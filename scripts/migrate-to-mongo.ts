import * as fs from 'fs/promises';
import * as path from 'path';
import mongoose, { Model, Schema } from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Import Schema instances and interfaces from model files
import { ICharacter, CharacterSchemaInstance } from '../src/models/Character';
import { ITrait, TraitSchemaInstance } from '../src/models/Trait';
import { ISubset, SubsetSchemaInstance } from '../src/models/Subset';
// Assuming your User model for auth is defined and can be imported if needed for 'created_by' or similar
// import User from '../src/models/User'; 

// Create models locally for the script
const Trait: Model<ITrait> = mongoose.model<ITrait>('Trait', TraitSchemaInstance);
const Character: Model<ICharacter> = mongoose.model<ICharacter>('Character', CharacterSchemaInstance);
const Subset: Model<ISubset> = mongoose.model<ISubset>('Subset', SubsetSchemaInstance);

const MONGODB_URI = process.env.MONGODB_URI;

// Define paths to the data files
const DATA_DIR = path.join(__dirname, '../../public/data');
const CHARACTERS_FILE = path.join(DATA_DIR, 'characters.json');
const MAPPING_FILE = path.join(DATA_DIR, 'mapping.json');
const TRAIT_LINKS_FILE = path.join(DATA_DIR, 'trait_links.json');
const SUBSETS_FILE = path.join(DATA_DIR, 'subsets.json');
const IMPORTANCE_FILE = path.join(DATA_DIR, 'importance.json');

interface RawCharacterData {
  id: string; // name
  name: string;
  traits: { [traitName: string]: number }; // e.g. {"傲娇": 1.0}
  gender: number;
}

interface RawMappingData { 
  [characterName: string]: number; // bangumi_id
}

interface RawTraitLinksData {
  [traitName: string]: string; // moegirl_link
}

interface RawSubsetsData {
  [subsetSlug: string]: {
    id: string; // slug
    displayName: string;
    characters: string[]; // array of character names
    originalId: string;
    charactersCount: number;
  };
}

interface RawImportanceData {
  [traitName: string]: number; // importance value
}

// Types for documents to be inserted (plain objects matching schema fields)
// These should not include mongoose.Document specific fields like _id, __v, or methods.
type TraitInsertData = { name: string; importance?: number; moegirl_link?: string; };
type CharacterInsertData = { name: string; gender?: number; bangumi_id?: number; image_url?: string; traits: mongoose.Types.ObjectId[]; subsets: mongoose.Types.ObjectId[]; };
type SubsetInsertData = { slug: string; display_name: string; characters: mongoose.Types.ObjectId[]; };

async function connectDB() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in .env.local');
    process.exit(1);
  }
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('MongoDB connected successfully.');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  } else {
    console.log('MongoDB already connected.');
  }
}

async function clearCollections() {
  try {
    console.log('Clearing collections...');
    // Check if models exist before trying to delete
    if (mongoose.models.Trait) await Trait.deleteMany({});
    if (mongoose.models.Character) await Character.deleteMany({});
    if (mongoose.models.Subset) await Subset.deleteMany({});
    console.log('Collections cleared (if they existed).');
  } catch (error) {
    console.error('Error clearing collections:', error);
    throw error;
  }
}

async function migrateData() {
  try {
    await connectDB();
    await clearCollections();

    console.log('Reading data files...');
    const charactersJson: { [key: string]: RawCharacterData } = JSON.parse(await fs.readFile(CHARACTERS_FILE, 'utf-8'));
    const mappingJson: RawMappingData = JSON.parse(await fs.readFile(MAPPING_FILE, 'utf-8'));
    const traitLinksJson: RawTraitLinksData = JSON.parse(await fs.readFile(TRAIT_LINKS_FILE, 'utf-8'));
    const subsetsJson: RawSubsetsData = JSON.parse(await fs.readFile(SUBSETS_FILE, 'utf-8'));
    const importanceJson: RawImportanceData = JSON.parse(await fs.readFile(IMPORTANCE_FILE, 'utf-8'));
    console.log('Data files read successfully.');

    console.log('Migrating traits...');
    const allTraitNames = new Set<string>();
    Object.values(charactersJson).forEach(char => Object.keys(char.traits).forEach(traitName => allTraitNames.add(traitName)));

    const traitDocsToInsert: TraitInsertData[] = [];
    allTraitNames.forEach(name => {
      traitDocsToInsert.push({
        name: name,
        moegirl_link: traitLinksJson[name] || '',
        importance: importanceJson[name] || 0,
      });
    });

    if (traitDocsToInsert.length > 0) {
      await Trait.insertMany(traitDocsToInsert);
    }
    console.log(`${traitDocsToInsert.length} traits migrated.`);

    const traitNameToIdMap = new Map<string, mongoose.Types.ObjectId>();
    const allTraitsFromDB = await Trait.find({});
    allTraitsFromDB.forEach(trait => { if (trait._id && trait.name) traitNameToIdMap.set(trait.name, trait._id as mongoose.Types.ObjectId); });
    console.log('Trait name to ObjectId map created.');

    console.log('Migrating characters...');
    const characterDocsToInsert: CharacterInsertData[] = [];
    const characterNameToIdMap = new Map<string, mongoose.Types.ObjectId>();

    for (const charNameKey in charactersJson) {
      const charData = charactersJson[charNameKey];
      let rawBangumiId = mappingJson[charData.name]; 
      let processedBangumiId: number | undefined = undefined;

      if (Array.isArray(rawBangumiId) && rawBangumiId.length > 0) {
        const idFromArray = String(rawBangumiId[0]);
        const potentialNum = parseInt(idFromArray, 10);
        if (!isNaN(potentialNum)) {
          processedBangumiId = potentialNum;
        }
      } else if (typeof rawBangumiId === 'number') {
        processedBangumiId = rawBangumiId;
      } else if (typeof rawBangumiId === 'string') {
        const potentialNum = parseInt(rawBangumiId, 10);
        if (!isNaN(potentialNum)) {
          processedBangumiId = potentialNum;
        }
      }

      const imageUrl = processedBangumiId ? `https://api.bgm.tv/v0/characters/${processedBangumiId}/image?type=medium` : '';
      const traitObjectIds = Object.keys(charData.traits)
        .map(traitName => traitNameToIdMap.get(traitName))
        .filter(id => id !== undefined) as mongoose.Types.ObjectId[];

      characterDocsToInsert.push({
        name: charData.name,
        gender: charData.gender,
        bangumi_id: processedBangumiId,
        image_url: imageUrl,
        traits: traitObjectIds,
        subsets: [],
      });
    }

    if (characterDocsToInsert.length > 0) {
      const insertedCharacters = await Character.insertMany(characterDocsToInsert);
      insertedCharacters.forEach(char => { if (char.name && char._id) characterNameToIdMap.set(char.name, char._id as mongoose.Types.ObjectId); });
    }
    console.log(`${characterDocsToInsert.length} characters migrated.`);
    console.log('Character name to ObjectId map created.');

    console.log('Migrating subsets and linking characters...');
    let subsetsMigratedCount = 0;
    for (const subsetSlug in subsetsJson) {
      const subsetData = subsetsJson[subsetSlug];
      const characterIdsForSubset = subsetData.characters
        .map(charName => characterNameToIdMap.get(charName))
        .filter(id => id !== undefined) as mongoose.Types.ObjectId[];

      const newSubsetDocData: SubsetInsertData = {
        slug: subsetData.id,
        display_name: subsetData.displayName,
        characters: characterIdsForSubset,
      };
      const savedSubset = await Subset.create(newSubsetDocData);
      subsetsMigratedCount++;

      if (savedSubset._id) {
        await Character.updateMany(
          { _id: { $in: characterIdsForSubset } },
          { $addToSet: { subsets: savedSubset._id as mongoose.Types.ObjectId } }
        );
      }
    }
    console.log(`${subsetsMigratedCount} subsets migrated and characters linked.`);
    console.log('Data migration completed successfully!');

  } catch (error) {
    console.error('Error during data migration:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('MongoDB disconnected.');
    }
  }
}

migrateData(); 
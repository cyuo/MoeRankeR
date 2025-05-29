"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs/promises");
var path = require("path");
var mongoose_1 = require("mongoose");
var dotenv = require("dotenv");
// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
// Import Schema instances and interfaces from model files
var Character_1 = require("../src/models/Character");
var Trait_1 = require("../src/models/Trait");
var Subset_1 = require("../src/models/Subset");
// Assuming your User model for auth is defined and can be imported if needed for 'created_by' or similar
// import User from '../src/models/User'; 
// Create models locally for the script
var Trait = mongoose_1.default.model('Trait', Trait_1.TraitSchemaInstance);
var Character = mongoose_1.default.model('Character', Character_1.CharacterSchemaInstance);
var Subset = mongoose_1.default.model('Subset', Subset_1.SubsetSchemaInstance);
var MONGODB_URI = process.env.MONGODB_URI;
// Define paths to the data files
var DATA_DIR = path.join(__dirname, '../../public/data');
var CHARACTERS_FILE = path.join(DATA_DIR, 'characters.json');
var MAPPING_FILE = path.join(DATA_DIR, 'mapping.json');
var TRAIT_LINKS_FILE = path.join(DATA_DIR, 'trait_links.json');
var SUBSETS_FILE = path.join(DATA_DIR, 'subsets.json');
var IMPORTANCE_FILE = path.join(DATA_DIR, 'importance.json');
function connectDB() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!MONGODB_URI) {
                        console.error('Error: MONGODB_URI is not defined in .env.local');
                        process.exit(1);
                    }
                    if (!(mongoose_1.default.connection.readyState === 0)) return [3 /*break*/, 5];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, mongoose_1.default.connect(MONGODB_URI)];
                case 2:
                    _a.sent();
                    console.log('MongoDB connected successfully.');
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('MongoDB connection error:', error_1);
                    process.exit(1);
                    return [3 /*break*/, 4];
                case 4: return [3 /*break*/, 6];
                case 5:
                    console.log('MongoDB already connected.');
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
function clearCollections() {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    console.log('Clearing collections...');
                    if (!mongoose_1.default.models.Trait) return [3 /*break*/, 2];
                    return [4 /*yield*/, Trait.deleteMany({})];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (!mongoose_1.default.models.Character) return [3 /*break*/, 4];
                    return [4 /*yield*/, Character.deleteMany({})];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    if (!mongoose_1.default.models.Subset) return [3 /*break*/, 6];
                    return [4 /*yield*/, Subset.deleteMany({})];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6:
                    console.log('Collections cleared (if they existed).');
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _a.sent();
                    console.error('Error clearing collections:', error_2);
                    throw error_2;
                case 8: return [2 /*return*/];
            }
        });
    });
}
function migrateData() {
    return __awaiter(this, void 0, void 0, function () {
        var charactersJson, _a, _b, mappingJson, _c, _d, traitLinksJson_1, _e, _f, subsetsJson, _g, _h, importanceJson_1, _j, _k, allTraitNames_1, traitDocsToInsert_1, traitNameToIdMap_1, allTraitsFromDB, characterDocsToInsert, characterNameToIdMap_1, charNameKey, charData, rawBangumiId, processedBangumiId, idFromArray, potentialNum, potentialNum, imageUrl, traitObjectIds, insertedCharacters, subsetsMigratedCount, _l, _m, _o, _i, subsetSlug, subsetData, characterIdsForSubset, newSubsetDocData, savedSubset, error_3;
        return __generator(this, function (_p) {
            switch (_p.label) {
                case 0:
                    _p.trys.push([0, 18, 19, 22]);
                    return [4 /*yield*/, connectDB()];
                case 1:
                    _p.sent();
                    return [4 /*yield*/, clearCollections()];
                case 2:
                    _p.sent();
                    console.log('Reading data files...');
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, fs.readFile(CHARACTERS_FILE, 'utf-8')];
                case 3:
                    charactersJson = _b.apply(_a, [_p.sent()]);
                    _d = (_c = JSON).parse;
                    return [4 /*yield*/, fs.readFile(MAPPING_FILE, 'utf-8')];
                case 4:
                    mappingJson = _d.apply(_c, [_p.sent()]);
                    _f = (_e = JSON).parse;
                    return [4 /*yield*/, fs.readFile(TRAIT_LINKS_FILE, 'utf-8')];
                case 5:
                    traitLinksJson_1 = _f.apply(_e, [_p.sent()]);
                    _h = (_g = JSON).parse;
                    return [4 /*yield*/, fs.readFile(SUBSETS_FILE, 'utf-8')];
                case 6:
                    subsetsJson = _h.apply(_g, [_p.sent()]);
                    _k = (_j = JSON).parse;
                    return [4 /*yield*/, fs.readFile(IMPORTANCE_FILE, 'utf-8')];
                case 7:
                    importanceJson_1 = _k.apply(_j, [_p.sent()]);
                    console.log('Data files read successfully.');
                    console.log('Migrating traits...');
                    allTraitNames_1 = new Set();
                    Object.values(charactersJson).forEach(function (char) { return Object.keys(char.traits).forEach(function (traitName) { return allTraitNames_1.add(traitName); }); });
                    traitDocsToInsert_1 = [];
                    allTraitNames_1.forEach(function (name) {
                        traitDocsToInsert_1.push({
                            name: name,
                            moegirl_link: traitLinksJson_1[name] || '',
                            importance: importanceJson_1[name] || 0,
                        });
                    });
                    if (!(traitDocsToInsert_1.length > 0)) return [3 /*break*/, 9];
                    return [4 /*yield*/, Trait.insertMany(traitDocsToInsert_1)];
                case 8:
                    _p.sent();
                    _p.label = 9;
                case 9:
                    console.log("".concat(traitDocsToInsert_1.length, " traits migrated."));
                    traitNameToIdMap_1 = new Map();
                    return [4 /*yield*/, Trait.find({})];
                case 10:
                    allTraitsFromDB = _p.sent();
                    allTraitsFromDB.forEach(function (trait) { if (trait._id && trait.name)
                        traitNameToIdMap_1.set(trait.name, trait._id); });
                    console.log('Trait name to ObjectId map created.');
                    console.log('Migrating characters...');
                    characterDocsToInsert = [];
                    characterNameToIdMap_1 = new Map();
                    for (charNameKey in charactersJson) {
                        charData = charactersJson[charNameKey];
                        rawBangumiId = mappingJson[charData.name];
                        processedBangumiId = undefined;
                        if (Array.isArray(rawBangumiId) && rawBangumiId.length > 0) {
                            idFromArray = String(rawBangumiId[0]);
                            potentialNum = parseInt(idFromArray, 10);
                            if (!isNaN(potentialNum)) {
                                processedBangumiId = potentialNum;
                            }
                        }
                        else if (typeof rawBangumiId === 'number') {
                            processedBangumiId = rawBangumiId;
                        }
                        else if (typeof rawBangumiId === 'string') {
                            potentialNum = parseInt(rawBangumiId, 10);
                            if (!isNaN(potentialNum)) {
                                processedBangumiId = potentialNum;
                            }
                        }
                        imageUrl = processedBangumiId ? "https://api.bgm.tv/v0/characters/".concat(processedBangumiId, "/image?type=medium") : '';
                        traitObjectIds = Object.keys(charData.traits)
                            .map(function (traitName) { return traitNameToIdMap_1.get(traitName); })
                            .filter(function (id) { return id !== undefined; });
                        characterDocsToInsert.push({
                            name: charData.name,
                            gender: charData.gender,
                            bangumi_id: processedBangumiId,
                            image_url: imageUrl,
                            traits: traitObjectIds,
                            subsets: [],
                        });
                    }
                    if (!(characterDocsToInsert.length > 0)) return [3 /*break*/, 12];
                    return [4 /*yield*/, Character.insertMany(characterDocsToInsert)];
                case 11:
                    insertedCharacters = _p.sent();
                    insertedCharacters.forEach(function (char) { if (char.name && char._id)
                        characterNameToIdMap_1.set(char.name, char._id); });
                    _p.label = 12;
                case 12:
                    console.log("".concat(characterDocsToInsert.length, " characters migrated."));
                    console.log('Character name to ObjectId map created.');
                    console.log('Migrating subsets and linking characters...');
                    subsetsMigratedCount = 0;
                    _l = subsetsJson;
                    _m = [];
                    for (_o in _l)
                        _m.push(_o);
                    _i = 0;
                    _p.label = 13;
                case 13:
                    if (!(_i < _m.length)) return [3 /*break*/, 17];
                    _o = _m[_i];
                    if (!(_o in _l)) return [3 /*break*/, 16];
                    subsetSlug = _o;
                    subsetData = subsetsJson[subsetSlug];
                    characterIdsForSubset = subsetData.characters
                        .map(function (charName) { return characterNameToIdMap_1.get(charName); })
                        .filter(function (id) { return id !== undefined; });
                    newSubsetDocData = {
                        slug: subsetData.id,
                        display_name: subsetData.displayName,
                        characters: characterIdsForSubset,
                    };
                    return [4 /*yield*/, Subset.create(newSubsetDocData)];
                case 14:
                    savedSubset = _p.sent();
                    subsetsMigratedCount++;
                    if (!savedSubset._id) return [3 /*break*/, 16];
                    return [4 /*yield*/, Character.updateMany({ _id: { $in: characterIdsForSubset } }, { $addToSet: { subsets: savedSubset._id } })];
                case 15:
                    _p.sent();
                    _p.label = 16;
                case 16:
                    _i++;
                    return [3 /*break*/, 13];
                case 17:
                    console.log("".concat(subsetsMigratedCount, " subsets migrated and characters linked."));
                    console.log('Data migration completed successfully!');
                    return [3 /*break*/, 22];
                case 18:
                    error_3 = _p.sent();
                    console.error('Error during data migration:', error_3);
                    return [3 /*break*/, 22];
                case 19:
                    if (!(mongoose_1.default.connection.readyState !== 0)) return [3 /*break*/, 21];
                    return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 20:
                    _p.sent();
                    console.log('MongoDB disconnected.');
                    _p.label = 21;
                case 21: return [7 /*endfinally*/];
                case 22: return [2 /*return*/];
            }
        });
    });
}
migrateData();

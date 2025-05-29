import { MongoClient, Db, Collection } from 'mongodb';
// ObjectId is not directly used here anymore, can be removed if not needed by other functions in this file

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'moeranker';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

async function connectToDatabase(): Promise<{ db: Db; client: MongoClient }> {
  if (dbInstance && client) {
    console.log('Already connected to MongoDB (or connection in progress).');
    return { db: dbInstance, client };
  }
  try {
    console.log(`Attempting to connect to MongoDB: ${MONGODB_URI}`);
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    dbInstance = client.db(DB_NAME);
    console.log(`Successfully connected to MongoDB database: ${DB_NAME}`);
    return { db: dbInstance, client };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    if (client) {
        try {
            await client.close();
        } catch (closeError) {
            console.error('Error attempting to close client after connection failure:', closeError);
        }
        client = null; 
        dbInstance = null;
    }
    throw error;
  }
}

async function getDatabase(): Promise<Db> {
  if (dbInstance) {
    return dbInstance;
  }
  const { db: connectedDb } = await connectToDatabase();
  return connectedDb;
}

async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    try {
      await client.close();
      console.log('MongoDB connection closed.');
      client = null;
      dbInstance = null;
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  }
}

async function getCollection<T extends Record<string, any>>(collectionName: string): Promise<Collection<T>> {
  const database = await getDatabase();
  return database.collection<T>(collectionName);
}

export {
  connectToDatabase,
  getDatabase,
  closeDatabaseConnection,
  getCollection,
  MONGODB_URI,
  DB_NAME
}; 
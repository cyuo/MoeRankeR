const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017'; // Default to local MongoDB
const DB_NAME = process.env.MONGODB_DB_NAME || 'moeranker'; // Default database name

let client = null;
let db = null;

async function connectToDatabase() {
  if (db && client && client.topology && client.topology.isConnected()) {
    console.log('Already connected to MongoDB.');
    return { db, client };
  }
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    console.log(`Successfully connected to MongoDB database: ${DB_NAME}`);
    return { db, client };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

async function getDatabase() {
  if (db) {
    return db;
  }
  const { db: connectedDb } = await connectToDatabase();
  return connectedDb;
}

async function closeDatabaseConnection() {
  if (client) {
    try {
      await client.close();
      console.log('MongoDB connection closed.');
      client = null;
      db = null;
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
    }
  }
}

module.exports = {
  connectToDatabase,
  getDatabase,
  closeDatabaseConnection,
  MONGODB_URI, // Export for potential use elsewhere or for logging
  DB_NAME      // Export for potential use elsewhere or for logging
}; 
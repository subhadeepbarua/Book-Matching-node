const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');

// MongoDB connection URI
const mongoURI = 'mongodb+srv://avijitsarkarofficial39:YFR6mdJdUb8PoI94@bookdata.osrvcno.mongodb.net/?retryWrites=true&w=majority';

// JSON file path
const jsonFilePath = 'finalConstruct.json';

// Database and collection names
const dbName = 'Books';
const collectionName = 'Book_metaData';

async function uploadJSONToMongoDB() {
  try {
    // Read the JSON file
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

    // Connect to MongoDB
    const client = await MongoClient.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);

    // Insert the data into the collection
    const result = await db.collection(collectionName).insertMany(jsonData);

    console.log(`Uploaded ${result.insertedCount} documents to MongoDB`);

    // Close the MongoDB connection
    client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Call the function to upload JSON to MongoDB
uploadJSONToMongoDB();

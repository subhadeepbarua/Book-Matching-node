const { MongoClient } = require('mongodb');
const axios = require('axios');

const mongoURI =
  'mongodb+srv://avijitsarkarofficial39:YFR6mdJdUb8PoI94@bookdata.osrvcno.mongodb.net/?retryWrites=true&w=majority';

const modelId = 'sentence-transformers/all-MiniLM-L6-v2';
const hfToken = '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';

const apiUrl = `https://api-inference.huggingface.co/pipeline/feature-extraction/${modelId}`;
const headers = { Authorization: `Bearer ${hfToken}` };

async function findSimilarDocuments(queryText) {
  try {
    const client = await MongoClient.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = client.db('Books');
    const collection = db.collection('Book_metaData');


    const queryEmbedding = await generateEmbedding([queryText]);

    const documents = await collection
      .aggregate([
        {
          $search: {
            knnBeta: {
              vector: queryEmbedding,
              path: 'embeddings',
              k: 10,
            },
          },
        },
        {
          $project: {
            original_title: 1,
            description: 1,
            score: { $meta: 'searchScore' },
          },
        },
      ])
      .toArray();

    client.close();

    if (documents.length > 0) {

      const highestScoreDoc = documents.reduce((highest, current) =>
        highest.score > current.score ? highest : current
      );

      console.log('Similar Documents:', documents);
      console.log('Document with Highest Score:', highestScoreDoc.original_title);
    } else {
      console.log('No documents found.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function generateEmbedding(texts) {
  try {
    const response = await axios.post(apiUrl, {
      inputs: texts,
      options: { wait_for_model: true },
    }, { headers });

    const embedding = response.data[0];
    const embeddingArray = Array.isArray(embedding) ? embedding : [embedding];


    return embeddingArray;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
}

const queryText = 'love, romance, vampire, teenage';
findSimilarDocuments(queryText);

const express = require('express');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

const mongoURI = 'mongodb+srv://avijitsarkarofficial39:YFR6mdJdUb8PoI94@bookdata.osrvcno.mongodb.net/?retryWrites=true&w=majority';
const modelId = 'sentence-transformers/all-MiniLM-L6-v2';
const hfToken = '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';
const apiUrl = `https://api-inference.huggingface.co/pipeline/feature-extraction/${modelId}`;
const headers = { Authorization: `Bearer ${hfToken}` };


async function findSimilarDocuments(preferredPlot, favoriteBooks) {
  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(mongoURI, {
      useNewUrlParser: true,
    });

    const db = client.db('Books');
    const collection = db.collection('Book_metaData');

    const queryEmbedding = await generateEmbedding([preferredPlot + favoriteBooks]);

    const documents = await collection
      .aggregate([
        {
          $search: {
            knnBeta: {
              vector: queryEmbedding,
              path: 'embeddings',
              k: 6,
            },
          },
        },
        {
          $project: {
            original_title: 1,
            authors: 1,
            summary: 1, 
            coverImgURL: 1,
            score: { $meta: 'searchScore' },
          },
        },
      ])
      .toArray();
    client.close();
    
    return documents;
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

app.post('/', async (req, res) => {
  try {
    const { preferredPlot } = req.body;
    const { favoriteBooks } = req.body;
    const similarDocuments = await findSimilarDocuments(preferredPlot, favoriteBooks);

    res.status(200).json({
      success: true,
      message: 'Similar documents search complete.',
      similarDocuments: similarDocuments,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
});

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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

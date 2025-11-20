// server/server.js
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB configuration
const mongoConfig = {
  uri: process.env.MONGODB_URI,
  databaseName: process.env.DATABASE_NAME || 'bit-hackathon',
  collectionName: process.env.COLLECTION_NAME || 'registrations'
};

let client;
let db;
let collection;

// Initialize MongoDB connection
const initializeMongoDB = async () => {
  try {
    if (!client) {
      client = new MongoClient(mongoConfig.uri);
      await client.connect();
      db = client.db(mongoConfig.databaseName);
      collection = db.collection(mongoConfig.collectionName);
      console.log('Connected to MongoDB Atlas');
    }
    return { client, db, collection };
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
};

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.post('/api/register', async (req, res) => {
  try {
    const registrationData = {
      ...req.body,
      submittedAt: new Date()
    };

    const { collection } = await initializeMongoDB();
    const result = await collection.insertOne(registrationData);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      id: result.insertedId
    });

  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});

app.get('/api/registrations', async (req, res) => {
  try {
    const { collection } = await initializeMongoDB();
    const registrations = await collection.find({}).toArray();
    
    res.json({
      success: true,
      count: registrations.length,
      data: registrations
    });

  } catch (error) {
    console.error('Failed to fetch registrations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations',
      error: error.message
    });
  }
});

// Start server (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    if (client) {
      await client.close();
    }
    process.exit(0);
  });
}

// Export for Vercel
export default app;
// test-mongodb.js
// Run this with: node test-mongodb.js

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    console.log('URI (first 20 chars):', MONGODB_URI?.substring(0, 20) + '...');
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');

    // Test database operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));

    // Test if we can access the users collection
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    console.log('👥 Total users in database:', userCount);

    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error('Error message:', error.message);
    
    if (error.message.includes('authentication')) {
      console.error('🔐 Authentication issue - check username/password');
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      console.error('🌐 Network issue - check internet connection');
    } else if (error.message.includes('SSL')) {
      console.error('🔒 SSL issue - might be a certificate problem');
    }
    
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testConnection();
/**
 * Test MongoDB Connection
 * Quick test to verify MongoDB connectivity
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('🗄️  Testing MongoDB Connection');
  console.log('==============================\n');
  
  console.log('MongoDB URI:', process.env.MONGODB_URI?.replace(/:[^:@]*@/, ':****@'));
  
  try {
    console.log('Attempting to connect...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🔗 Connection State: ${conn.connection.readyState}`);
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections found: ${collections.length}`);
    
    await mongoose.connection.close();
    console.log('\n🎉 MongoDB connection test successful!');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n🔧 Possible solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify the MongoDB Atlas cluster is running');
      console.log('3. Check if your IP is whitelisted in MongoDB Atlas');
    } else if (error.message.includes('authentication')) {
      console.log('\n🔧 Possible solutions:');
      console.log('1. Check username and password in connection string');
      console.log('2. Verify database user permissions in MongoDB Atlas');
    }
  }
}

testConnection();
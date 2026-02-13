/**
 * Local MongoDB Setup
 * Alternative to MongoDB Atlas for development
 */

const mongoose = require('mongoose');

const connectLocalDB = async () => {
  try {
    // Try to connect to local MongoDB first
    const conn = await mongoose.connect('mongodb://localhost:27017/one_hospital', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🗄️  Local MongoDB Connected:', conn.connection.host);
    return true;
  } catch (error) {
    console.log('❌ Local MongoDB not available:', error.message);
    console.log('💡 Install MongoDB locally or use MongoDB Atlas');
    return false;
  }
};

module.exports = connectLocalDB;

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/varuni-backoffice';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface Connection {
  isConnected?: number;
}

const connection: Connection = {};

async function connectDB() {
  if (connection.isConnected) {
    console.log('✅ Using existing database connection');
    return;
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    
    const db = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    connection.isConnected = db.connections[0].readyState;
    
    console.log('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 MongoDB disconnected');
      connection.isConnected = 0;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
      connection.isConnected = 1;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    throw error;
  }
}

async function disconnectDB() {
  if (connection.isConnected) {
    await mongoose.connection.close();
    connection.isConnected = 0;
    console.log('🔌 MongoDB disconnected');
  }
}

export { connectDB, disconnectDB, connection }; 
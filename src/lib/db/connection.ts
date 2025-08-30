import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'varuni-backoffice';
const MONGODB_FULL_URI = MONGODB_URI.includes('mongodb+srv://') || MONGODB_URI.includes('mongodb://')
  ? (MONGODB_URI.includes('cosmos.azure.com') ? MONGODB_URI : `${MONGODB_URI}/${MONGODB_DB_NAME}`)
  : `mongodb://localhost:27017/${MONGODB_DB_NAME}`;
console.log(MONGODB_FULL_URI);
if (!MONGODB_FULL_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface Connection {
  isConnected?: number;
  promise?: Promise<typeof mongoose>;
}

// Global connection object to survive hot reloads
const connection: Connection = {};

// Detect if we're using Azure Cosmos DB
const isAzureCosmosDB = MONGODB_FULL_URI.includes('cosmos.azure.com');

// MongoDB/Cosmos DB connection options
const connectionOptions = {
  bufferCommands: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4
  ...(isAzureCosmosDB && {
    // Azure Cosmos DB specific options
    ssl: true,
    retryWrites: false,
    maxIdleTimeMS: 120000,
  })
};

export async function connectDB() {
  // If already connected, return
  if (connection.isConnected === 1) {
    console.log('✅ Using existing database connection');
    return;
  }

  // If connection is in progress, wait for it
  if (connection.promise) {
    console.log('⏳ Waiting for ongoing connection...');
    await connection.promise;
    return;
  }

  try {
    console.log(isAzureCosmosDB ? '🌐 Connecting to Azure Cosmos DB...' : '🔌 Connecting to MongoDB...');
    
    connection.promise = mongoose.connect(MONGODB_FULL_URI, connectionOptions);
    
    const db = await connection.promise;
    
    // Wait for the connection to be fully ready
    let attempts = 0;
    while (mongoose.connection.readyState !== 1 && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    connection.isConnected = db.connections[0].readyState;
    
    if (connection.isConnected === 1) {
      console.log(isAzureCosmosDB 
        ? '✅ Azure Cosmos DB connected successfully' 
        : '✅ MongoDB connected successfully'
      );
      
      // Log database info (without sensitive data)
      const dbName = mongoose.connection.name;
      const host = isAzureCosmosDB ? 'Azure Cosmos DB' : mongoose.connection.host;
      console.log(`📊 Database: ${dbName} on ${host}`);
    } else {
      throw new Error('Database connection failed');
    }
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    connection.promise = undefined;
    throw error;
  }
}

// Avoid duplicate listeners in dev/hot-reload
const globalAny = globalThis as unknown as {
  _mongooseListenersRegistered?: boolean;
  _processSigintRegistered?: boolean;
};

function registerEventListeners() {
  if (!globalAny._mongooseListenersRegistered) {
    // Increase limit to prevent MaxListeners warnings during dev
    try { mongoose.connection.setMaxListeners(50); } catch { /* noop */ }
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to database');
    });
    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });
    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose disconnected');
      connection.isConnected = 0;
    });
    globalAny._mongooseListenersRegistered = true;
  }

  if (!globalAny._processSigintRegistered) {
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('👋 Database connection closed through app termination');
        process.exit(0);
      } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });
    globalAny._processSigintRegistered = true;
  }
}

// Register listeners once
registerEventListeners();

// Test connection function
export async function testConnection() {
  try {
    await connectDB();
    
    // Ensure database connection exists
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    // Test basic operations
    const testCollection = mongoose.connection.db.collection('connection_test');
    
    // Write test
    const writeResult = await testCollection.insertOne({
      test: true,
      timestamp: new Date(),
      environment: process.env.NODE_ENV
    });
    
    // Read test
    await testCollection.findOne({ _id: writeResult.insertedId });
    
    // Cleanup
    await testCollection.deleteOne({ _id: writeResult.insertedId });
    
    console.log('✅ Database connection test successful');
    console.log('✅ Read/Write operations working correctly');
    
    return {
      success: true,
      database: mongoose.connection.name,
      host: isAzureCosmosDB ? 'Azure Cosmos DB' : mongoose.connection.host,
      readyState: mongoose.connection.readyState,
      isAzure: isAzureCosmosDB
    };
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      isAzure: isAzureCosmosDB
    };
  }
}

export { isAzureCosmosDB }; 
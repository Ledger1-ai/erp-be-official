import { loadEnv } from '../src/lib/config/load-env';
import { testConnection } from '../src/lib/db/connection';

async function main() {
  loadEnv();
  console.log('🧪 Testing database connection...\n');
  
  try {
    const result = await testConnection();
    
    if (result.success) {
      console.log('\n🎉 SUCCESS! Database connection is working perfectly.');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 Database: ${result.database}`);
      console.log(`🏠 Host: ${result.host}`);
      console.log(`🔗 Ready State: ${result.readyState} (1 = connected)`);
      console.log(`☁️  Azure Cosmos DB: ${result.isAzure ? 'Yes' : 'No'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (result.isAzure) {
        console.log('\n✅ Azure Cosmos DB Features:');
        console.log('   • SSL/TLS encryption enabled');
        console.log('   • Global distribution ready');
        console.log('   • Automatic scaling available');
        console.log('   • Built-in backup & restore');
      }
      
    } else {
      console.log('\n❌ FAILED! Database connection test failed.');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`❌ Error: ${result.error}`);
      console.log(`☁️  Attempted Azure: ${result.isAzure ? 'Yes' : 'No'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      console.log('\n🔧 Troubleshooting Steps:');
      if (result.isAzure) {
        console.log('   1. Verify Azure Cosmos DB connection string');
        console.log('   2. Check if your IP is allowed in firewall');
        console.log('   3. Ensure SSL is enabled');
        console.log('   4. Verify credentials are correct');
      } else {
        console.log('   1. Ensure MongoDB is running locally');
        console.log('   2. Check MONGODB_URI in .env.local');
        console.log('   3. Verify network connectivity');
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 CRITICAL ERROR!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error details:', error);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🔧 Quick Fixes:');
    console.log('   1. Check your .env.local file exists');
    console.log('   2. Verify MONGODB_URI is set correctly');
    console.log('   3. For Azure: Use the full connection string from portal');
    console.log('   4. For local: Ensure MongoDB service is running');
    
    process.exit(1);
  }
  
  // Graceful exit
  process.exit(0);
}

// Run the test
main(); 
#!/usr/bin/env tsx

import { loadEnv } from '../src/lib/config/load-env';

async function testConnectionString() {
  console.log('🔍 Testing MongoDB Connection String...\n');

  // Load environment variables
  loadEnv();

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  console.log('📋 Connection Details:');
  console.log(`URI: ${uri ? 'SET' : 'MISSING'}`);
  console.log(`DB Name: ${dbName || 'MISSING'}`);

  if (!uri) {
    console.log('❌ MONGODB_URI is not set!');
    return;
  }

  // Decode the URI to check for encoding issues
  try {
    const decodedUri = decodeURIComponent(uri);
    console.log('\n🔓 Decoded URI:');
    console.log(decodedUri);

    if (uri !== decodedUri) {
      console.log('\n⚠️  URI contains URL encoding that may need to be decoded');
      console.log('Original:', uri);
      console.log('Decoded: ', decodedUri);
    }

    // Check for common Azure Cosmos DB issues
    console.log('\n🔍 Connection String Analysis:');

    if (uri.includes('cosmos.azure.com')) {
      console.log('✅ Azure Cosmos DB detected');

      if (!uri.includes('tls=true')) {
        console.log('⚠️  TLS not explicitly enabled (may be required for Azure)');
      }

      if (!uri.includes('authMechanism=SCRAM-SHA-256')) {
        console.log('⚠️  SCRAM-SHA-256 auth mechanism not specified');
      }

      if (uri.includes('retrywrites=false')) {
        console.log('ℹ️  Retry writes disabled (this is normal for Cosmos DB)');
      }
    }

    // Check for potential password encoding issues
    if (uri.includes('%40')) {
      console.log('⚠️  Password contains @ symbol encoded as %40');
      console.log('   This should be decoded to @ in the actual password');
    }

    // Check database name inclusion
    if (!uri.includes(`/${dbName}`)) {
      console.log(`⚠️  Database name "${dbName}" not included in URI`);
      console.log('   It will be appended automatically');
    }

  } catch (error) {
    console.log('❌ Error decoding URI:', error);
  }

  console.log('\n🔗 Final Connection String:');
  const finalUri = uri.includes(`/${dbName}`) ? uri : `${uri.replace(/\/$/, '')}/${dbName}`;
  console.log(finalUri);

  console.log('\n💡 Recommendations:');
  console.log('1. If password contains @, ensure it\'s properly URL encoded in your connection string');
  console.log('2. For Azure Cosmos DB, ensure your IP is whitelisted');
  console.log('3. Check Azure firewall settings allow connections from your app service');
  console.log('4. Verify the username and password are correct');
  console.log('5. Try the /api/debug endpoint to get more detailed error information');
}

testConnectionString().catch(console.error);

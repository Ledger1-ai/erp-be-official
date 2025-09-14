#!/usr/bin/env tsx

import { loadEnv } from '../src/lib/config/load-env';
import { testConnection } from '../src/lib/db/connection';

async function testContainerEnvironment() {
  console.log('🐳 Testing Container Environment...\n');

  // Test 1: Environment Variables
  console.log('1️⃣  Testing Environment Variables:');
  loadEnv();

  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'NODE_ENV'
  ];

  let envOk = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`   ✅ ${varName}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
    } else {
      console.log(`   ❌ ${varName}: MISSING`);
      envOk = false;
    }
  }

  if (!envOk) {
    console.log('\n❌ Environment variables are missing!');
    console.log('   Make sure envstandin file is copied to the container');
    process.exit(1);
  }

  // Test 2: Database Connection
  console.log('\n2️⃣  Testing Database Connection:');
  try {
    const result = await testConnection();
    if (result.success) {
      console.log('   ✅ Database connection successful');
      console.log(`   📊 Database: ${result.database}`);
      console.log(`   🏠 Host: ${result.host}`);
    } else {
      console.log('   ❌ Database connection failed');
      console.log(`   Error: ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.log('   ❌ Database test threw exception');
    console.error('   Error:', error);
    process.exit(1);
  }

  console.log('\n🎉 Container environment test passed!');
  console.log('   Your container should now work properly.');
}

testContainerEnvironment().catch(console.error);

#!/usr/bin/env node

/**
 * Deployment Verification Script for MetaAPI Configuration
 * 
 * This script verifies that MetaAPI configuration is working properly
 * in the production environment.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
        }
      }
    });
  }
}

// Load environment variables
loadEnvFile();

// Configuration
const METAAPI_ACCOUNT_ID = process.env.NEXT_PUBLIC_METAAPI_ACCOUNT_ID;
const METAAPI_ACCESS_TOKEN = process.env.NEXT_PUBLIC_METAAPI_ACCESS_TOKEN;

console.log('🔍 MetaAPI Deployment Verification');
console.log('=====================================\n');

// Check environment variables
console.log('1. Checking Environment Variables:');
console.log(`   Account ID: ${METAAPI_ACCOUNT_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`   Access Token: ${METAAPI_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);

if (!METAAPI_ACCOUNT_ID || !METAAPI_ACCESS_TOKEN) {
  console.log('\n❌ ERROR: MetaAPI environment variables are not configured!');
  console.log('   Please set the following environment variables:');
  console.log('   - NEXT_PUBLIC_METAAPI_ACCOUNT_ID');
  console.log('   - NEXT_PUBLIC_METAAPI_ACCESS_TOKEN');
  process.exit(1);
}

console.log('\n2. Testing MetaAPI Connection:');

// Test MetaAPI connection
function testMetaAPIConnection() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'mt-client-api-v1.agiliumtrade.ai',
      port: 443,
      path: `/users/current/accounts/${METAAPI_ACCOUNT_ID}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${METAAPI_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const accountData = JSON.parse(data);
            resolve({
              success: true,
              statusCode: res.statusCode,
              accountData: accountData
            });
          } catch (error) {
            reject({
              success: false,
              error: 'Failed to parse response',
              statusCode: res.statusCode,
              data: data
            });
          }
        } else {
          reject({
            success: false,
            error: `HTTP ${res.statusCode}`,
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        success: false,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject({
        success: false,
        error: 'Connection timeout'
      });
    });

    req.end();
  });
}

// Run the test
testMetaAPIConnection()
  .then((result) => {
    console.log('   ✅ MetaAPI connection successful!');
    console.log(`   Status Code: ${result.statusCode}`);
    console.log(`   Account ID: ${result.accountData.id}`);
    console.log(`   Account Name: ${result.accountData.name || 'N/A'}`);
    console.log(`   Account Type: ${result.accountData.type || 'N/A'}`);
    console.log(`   Currency: ${result.accountData.currency || 'N/A'}`);
    
    console.log('\n3. Deployment Status:');
    console.log('   ✅ MetaAPI configuration is working properly');
    console.log('   ✅ Ready for production use');
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Deploy your application');
    console.log('   2. Test the Strategy Testing page');
    console.log('   3. Verify MetaAPI data source works');
    console.log('   4. Run a test backtest');
    
    process.exit(0);
  })
  .catch((error) => {
    console.log('   ❌ MetaAPI connection failed!');
    console.log(`   Error: ${error.error}`);
    
    if (error.statusCode) {
      console.log(`   Status Code: ${error.statusCode}`);
    }
    
    if (error.data) {
      console.log(`   Response: ${error.data}`);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if MetaAPI credentials are valid');
    console.log('   2. Verify account ID is correct');
    console.log('   3. Ensure access token is not expired');
    console.log('   4. Check network connectivity');
    console.log('   5. Contact MetaAPI support if needed');
    
    process.exit(1);
  }); 
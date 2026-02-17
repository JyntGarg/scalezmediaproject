const axios = require('axios');

// Configuration
// Use /webhook/ for production (when workflow is ACTIVE)
// Use /webhook-test/ only for one-time testing in n8n UI
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:5678/webhook/north-star-metrics';
const PROJECT_ID = process.argv[2] || process.env.PROJECT_ID;

if (!PROJECT_ID) {
  console.error('❌ Please provide a project ID:');
  console.error('   node test-webhook.js <PROJECT_ID>');
  console.error('   OR set PROJECT_ID environment variable');
  process.exit(1);
}

const testData = {
  projectId: PROJECT_ID,
  name: `Test Metric ${Date.now()}`,
  shortName: 'TEST',
  description: 'Test metric created via webhook at ' + new Date().toISOString(),
  currentValue: 100,
  targetValue: 500,
  unit: 'users',
  metricType: 'count',
  timePeriod: 'monthly',
  isActive: true
};

console.log('🧪 Testing n8n Webhook...');
console.log('📡 Webhook URL:', WEBHOOK_URL);
console.log('📦 Project ID:', PROJECT_ID);
console.log('📋 Test Data:', JSON.stringify(testData, null, 2));
console.log('');

axios
  .post(WEBHOOK_URL, testData, {
    headers: {
      'Content-Type': 'application/json'
    },
    timeout: 10000
  })
  .then(response => {
    console.log('✅ SUCCESS!');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Check n8n Executions tab for webhook execution');
    console.log('   2. Check backend logs for API call');
    console.log('   3. Verify metric was created in database');
  })
  .catch(error => {
    console.error('❌ ERROR!');
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📋 Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('❌ No response received. Is n8n running?');
      console.error('   Make sure: http://localhost:5678 is accessible');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  });


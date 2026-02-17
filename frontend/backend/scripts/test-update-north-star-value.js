const axios = require('axios');

const WEBHOOK_URL = process.env.WEBHOOK_URL_NSM || 'http://localhost:5678/webhook/north-star-metrics';
const PROJECT_ID = process.argv[2];
const METRIC_ID = process.argv[3];
const VALUE = parseFloat(process.argv[4]);

if (!PROJECT_ID || !METRIC_ID || VALUE === undefined || isNaN(VALUE)) {
  console.error('❌ Please provide projectId, metricId, and value:');
  console.error('   node test-update-north-star-value.js <PROJECT_ID> <METRIC_ID> <VALUE>');
  console.error('');
  console.error('💡 Example:');
  console.error('   node test-update-north-star-value.js 68de8dc441fb08ec87689bb3 6905aa66437009fa72f4a527 3500');
  process.exit(1);
}

const testData = {
  projectId: PROJECT_ID,
  metricId: METRIC_ID,
  value: VALUE,
  userEmail: process.argv[5] || "john.doe@example.com" // Optional: pass userEmail as 5th argument
};

console.log('🧪 Testing n8n North Star Metric Value Update Webhook...');
console.log('📡 Webhook URL:', WEBHOOK_URL);
console.log('📦 Project ID:', PROJECT_ID);
console.log('📊 Metric ID:', METRIC_ID);
console.log('📈 Value:', VALUE);
console.log('📋 Test Data:', JSON.stringify(testData, null, 2));
console.log('');

axios.post(WEBHOOK_URL, testData, {
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
  console.log('   3. Verify metric value was updated in database');
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


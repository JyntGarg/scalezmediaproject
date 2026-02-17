const axios = require('axios');

const WEBHOOK_URL = process.env.WEBHOOK_URL_GOAL || 'http://localhost:5678/webhook/goal-metrics';
const GOAL_ID = process.argv[2] || '68de930770ccd3d466d18ef0';
const KEYMETRIC_ID = process.argv[3];
const VALUE = parseFloat(process.argv[4]);

if (!GOAL_ID || !KEYMETRIC_ID || VALUE === undefined || isNaN(VALUE)) {
  console.error('❌ Please provide goalId, keymetricId, and value:');
  console.error('   node test-update-metric-value.js <GOAL_ID> <KEYMETRIC_ID> <VALUE>');
  console.error('');
  console.error('💡 Example:');
  console.error('   node test-update-metric-value.js 68de930770ccd3d466d18ef0 6905aa66437009fa72f4a527 3.5');
  process.exit(1);
}

const testData = {
  goalId: GOAL_ID,
  keymetricId: KEYMETRIC_ID,
  value: VALUE,
  date: new Date().toISOString()
};

console.log('🧪 Testing n8n Goal Metric Value Update Webhook...');
console.log('📡 Webhook URL:', WEBHOOK_URL);
console.log('🎯 Goal ID:', GOAL_ID);
console.log('📊 Key Metric ID:', KEYMETRIC_ID);
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


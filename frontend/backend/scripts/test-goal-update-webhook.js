const axios = require('axios');

const WEBHOOK_URL = process.env.WEBHOOK_URL_GOAL || 'http://localhost:5678/webhook/goal-metrics';
const GOAL_ID = process.argv[2] || '68de930770ccd3d466d18ef0';
const PROJECT_ID = process.argv[3] || '68de8dc441fb08ec87689bb3';

if (!GOAL_ID || !PROJECT_ID) {
  console.error('❌ Please provide goal ID and project ID:');
  console.error('   node test-goal-update-webhook.js <GOAL_ID> <PROJECT_ID>');
  process.exit(1);
}

const testData = {
  goalId: GOAL_ID,
  project: PROJECT_ID,
  keymetric: [
    {
      name: "Web Conversion Rate",
      startValue: 2.5,
      targetValue: 5.0,
      unit: "%"
    }
  ]
};

console.log('🧪 Testing n8n Goal Update Webhook...');
console.log('📡 Webhook URL:', WEBHOOK_URL);
console.log('🎯 Goal ID:', GOAL_ID);
console.log('📦 Project ID:', PROJECT_ID);
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
  console.log('   3. Verify goal was updated in database');
  console.log('   4. Run: node scripts/find-goal.js', PROJECT_ID);
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


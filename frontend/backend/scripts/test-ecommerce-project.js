const axios = require('axios');

// Project: E-Commerce Growth Platform
const PROJECT_ID = '68de8dc441fb08ec87689bb3';
const PROJECT_NAME = 'E-Commerce Growth Platform';

// Goal: Improve Customer Support Response Time
const GOAL_ID = '68de932170ccd3d466d18f04';
const GOAL_NAME = 'Improve Customer Support Response Time';
const KEYMETRIC_ID = '68de932170ccd3d466d18f05';
const KEYMETRIC_NAME = 'Response Time (hours)';

// North Star Metric
const NSM_ID = '68f8887937ba616c971b2df7';

// Project members (4 team members - can update North Star Metrics)
const PROJECT_MEMBERS = [
  'alice.team@example.com',
  'bob.team@example.com',
  'carol.team@example.com',
  'david.team@example.com'
];

// Goal members (3 members - can update Goal Metrics)
const GOAL_MEMBERS = [
  'alice.team@example.com',
  'bob.team@example.com',
  'carol.team@example.com'
];

const WEBHOOK_URL_GOAL = 'http://localhost:5678/webhook/goal-metrics';
const WEBHOOK_URL_NSM = 'http://localhost:5678/webhook/north-star-metrics';

async function testNorthStarMetric(memberEmail, value) {
  console.log(`\n🧪 Testing North Star Metric update by: ${memberEmail}`);
  console.log(`   Value: ${value}`);
  
  const testData = {
    projectId: PROJECT_ID,
    metricId: NSM_ID,
    value: value,
    userEmail: memberEmail
  };
  
  try {
    const response = await axios.post(WEBHOOK_URL_NSM, testData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log(`   ✅ SUCCESS! Response:`, response.data.success ? 'Metric updated' : response.data);
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ ERROR (${error.response.status}):`, error.response.data.message || error.response.data);
    } else {
      console.log(`   ❌ ERROR:`, error.message);
    }
  }
}

async function testGoalMetric(memberEmail, value) {
  console.log(`\n🧪 Testing Goal Metric update by: ${memberEmail}`);
  console.log(`   Value: ${value}`);
  
  const testData = {
    goalId: GOAL_ID,
    keymetricId: KEYMETRIC_ID,
    value: value,
    userEmail: memberEmail
  };
  
  try {
    const response = await axios.post(WEBHOOK_URL_GOAL, testData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    
    console.log(`   ✅ SUCCESS! Response:`, response.data.message || response.data);
  } catch (error) {
    if (error.response) {
      console.log(`   ❌ ERROR (${error.response.status}):`, error.response.data.message || error.response.data);
    } else {
      console.log(`   ❌ ERROR:`, error.message);
    }
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 Testing E-Commerce Growth Platform Metrics');
  console.log('═══════════════════════════════════════════════════════════');
  
  console.log('\n📁 Project: E-Commerce Growth Platform');
  console.log(`   ID: ${PROJECT_ID}`);
  console.log(`   Members: ${PROJECT_MEMBERS.length} team members`);
  
  console.log('\n🎯 Goal: Improve Customer Support Response Time');
  console.log(`   ID: ${GOAL_ID}`);
  console.log(`   Members: ${GOAL_MEMBERS.length} members`);
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('⭐ Testing North Star Metrics (Project Members)');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Test North Star Metrics with project members (all 4 should work)
  let nsmValue = 100;
  for (const member of PROJECT_MEMBERS) {
    await testNorthStarMetric(member, nsmValue);
    nsmValue += 10;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🎯 Testing Goal Metrics (Goal Members)');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Test Goal Metrics with goal members (3 should work)
  let goalValue = 2.5;
  for (const member of GOAL_MEMBERS) {
    await testGoalMetric(member, goalValue);
    goalValue += 0.5;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('❌ Testing with non-member (should fail)');
  console.log('═══════════════════════════════════════════════════════════');
  
  // Test with david (not in goal members) - should fail
  await testGoalMetric('david.team@example.com', 5.0);
  
  console.log('\n✅ Tests completed!');
}

runTests().catch(console.error);


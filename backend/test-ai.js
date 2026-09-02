const axios = require('axios');

const AI_SERVICE_URL = 'https://ai-railway-ai-service.onrender.com';

async function test() {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/score-batch`, [
      {
        severity: 'high',
        days_overdue: 5,
        asset_criticality: 'high',
        corridor_traffic: 150,
        department: 'TMS',
        asset_type: 'track',
        asset_age_years: 10,
        total_past_defects: 3
      }
    ], { timeout: 30000 });
    console.log('Success:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

test();
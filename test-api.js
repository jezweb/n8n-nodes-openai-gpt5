#!/usr/bin/env node

// Test script to check what the OpenAI API accepts for reasoning_effort
// Usage: OPENAI_API_KEY=your-key-here node test-api.js

const https = require('https');
const fs = require('fs');

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('Please set OPENAI_API_KEY environment variable');
  process.exit(1);
}

// Test configurations
const tests = [
  {
    name: 'GPT-5 with flat reasoning_effort',
    endpoint: '/v1/responses',
    body: {
      model: 'gpt-5',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Hello, this is a test'
            }
          ]
        }
      ],
      reasoning_effort: 'medium'
    }
  },
  {
    name: 'GPT-5 with nested reasoning.effort',
    endpoint: '/v1/responses',
    body: {
      model: 'gpt-5',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Hello, this is a test'
            }
          ]
        }
      ],
      reasoning: {
        effort: 'medium'
      }
    }
  },
  {
    name: 'GPT-5 without reasoning parameter',
    endpoint: '/v1/responses',
    body: {
      model: 'gpt-5',
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Hello, this is a test'
            }
          ]
        }
      ]
    }
  },
  {
    name: 'O1 with reasoning_effort (Chat API)',
    endpoint: '/v1/chat/completions',
    body: {
      model: 'o1-preview',
      messages: [
        {
          role: 'user',
          content: 'Hello, this is a test'
        }
      ],
      reasoning_effort: 'medium'
    }
  }
];

async function makeRequest(test) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: test.endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: JSON.parse(data)
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(test.body));
    req.end();
  });
}

async function runTests() {
  console.log('Testing OpenAI API parameter formats...\n');
  
  for (const test of tests) {
    console.log(`Test: ${test.name}`);
    console.log(`Endpoint: ${test.endpoint}`);
    console.log(`Body:`, JSON.stringify(test.body, null, 2));
    
    try {
      const result = await makeRequest(test);
      
      if (result.statusCode === 200) {
        console.log('✅ SUCCESS');
        console.log('Response preview:', JSON.stringify(result.data).substring(0, 200) + '...\n');
      } else {
        console.log(`❌ FAILED (Status: ${result.statusCode})`);
        if (result.data.error) {
          console.log('Error:', result.data.error.message);
          if (result.data.error.param) {
            console.log('Parameter:', result.data.error.param);
          }
        }
        console.log();
      }
    } catch (error) {
      console.log('❌ REQUEST ERROR:', error.message);
      console.log();
    }
    
    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nTest complete! Based on the results above, we can determine:');
  console.log('1. Which parameter format works for GPT-5 (flat vs nested)');
  console.log('2. Whether reasoning_effort is supported for GPT-5 at all');
  console.log('3. The correct format for O-series models');
}

runTests().catch(console.error);
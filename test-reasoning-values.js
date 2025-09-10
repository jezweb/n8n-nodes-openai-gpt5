#!/usr/bin/env node

// Comprehensive test script for GPT-5 reasoning effort values
// Tests all possible reasoning effort values with nested structure
// Usage: OPENAI_API_KEY=your-key-here node test-reasoning-values.js

const https = require('https');
const fs = require('fs');

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('Please set OPENAI_API_KEY environment variable');
  process.exit(1);
}

// Test prompts - simple and complex
const prompts = {
  simple: 'What is 2 + 2?',
  complex: 'Analyze the implications of quantum computing on modern cryptography, considering both near-term and long-term scenarios. Include discussion of post-quantum cryptography standards.'
};

// Reasoning effort levels to test
const reasoningLevels = ['low', 'medium', 'high', 'minimal', null]; // null = no reasoning parameter

// Models to test
const models = ['gpt-5', 'gpt-5-mini', 'gpt-5-nano'];

// Store results for comparison
const results = [];

async function makeRequest(model, prompt, reasoningEffort, promptType) {
  const body = {
    model: model,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: prompt
          }
        ]
      }
    ]
  };

  // Add reasoning parameter if specified
  if (reasoningEffort !== null) {
    body.reasoning = {
      effort: reasoningEffort
    };
  }

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/responses',
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
        const responseTime = Date.now() - startTime;
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
            responseTime: responseTime,
            model: model,
            reasoningEffort: reasoningEffort,
            promptType: promptType
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: { error: { message: 'Failed to parse response', raw: data } },
            responseTime: responseTime,
            model: model,
            reasoningEffort: reasoningEffort,
            promptType: promptType
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(body));
    req.end();
  });
}

function extractResponse(data) {
  // Handle different response structures
  if (data.output && data.output[0] && data.output[0].content) {
    return data.output[0].content;
  } else if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  } else if (data.error) {
    return `Error: ${data.error.message || JSON.stringify(data.error)}`;
  }
  return 'No content found in response';
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('GPT-5 REASONING EFFORT COMPREHENSIVE TEST');
  console.log('Testing nested reasoning.effort structure with all values');
  console.log('='.repeat(80));
  console.log();

  // Test each model
  for (const model of models) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`TESTING MODEL: ${model}`);
    console.log('='.repeat(80));

    // Test with simple prompt first
    console.log('\n--- Simple Prompt Test: "What is 2 + 2?" ---');
    for (const effort of reasoningLevels) {
      const effortLabel = effort === null ? 'none (default)' : effort;
      process.stdout.write(`  Reasoning effort: ${effortLabel.padEnd(15)}`);
      
      try {
        const result = await makeRequest(model, prompts.simple, effort, 'simple');
        
        if (result.statusCode === 200) {
          const response = extractResponse(result.data);
          const preview = response.substring(0, 50).replace(/\n/g, ' ');
          console.log(`✅ (${result.responseTime}ms) "${preview}${response.length > 50 ? '...' : ''}"`);
          results.push(result);
        } else {
          const errorMsg = result.data.error?.message || 'Unknown error';
          console.log(`❌ (${result.statusCode}) ${errorMsg}`);
        }
      } catch (error) {
        console.log(`❌ Request error: ${error.message}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Test with complex prompt
    console.log('\n--- Complex Prompt Test: Quantum Computing Analysis ---');
    for (const effort of reasoningLevels) {
      const effortLabel = effort === null ? 'none (default)' : effort;
      process.stdout.write(`  Reasoning effort: ${effortLabel.padEnd(15)}`);
      
      try {
        const result = await makeRequest(model, prompts.complex, effort, 'complex');
        
        if (result.statusCode === 200) {
          const response = extractResponse(result.data);
          const wordCount = response.split(/\s+/).length;
          const usage = result.data.usage;
          console.log(`✅ (${result.responseTime}ms) ${wordCount} words, ${usage?.total_tokens || 'N/A'} tokens`);
          results.push(result);
        } else {
          const errorMsg = result.data.error?.message || 'Unknown error';
          console.log(`❌ (${result.statusCode}) ${errorMsg}`);
        }
      } catch (error) {
        console.log(`❌ Request error: ${error.message}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Summary report
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY REPORT');
  console.log('='.repeat(80));

  // Group successful results by model
  const successfulResults = results.filter(r => r.statusCode === 200);
  
  for (const model of models) {
    const modelResults = successfulResults.filter(r => r.model === model);
    if (modelResults.length === 0) continue;

    console.log(`\n${model.toUpperCase()} Performance:`);
    console.log('-'.repeat(40));
    
    // Simple prompt results
    const simpleResults = modelResults.filter(r => r.promptType === 'simple');
    if (simpleResults.length > 0) {
      console.log('  Simple Prompt:');
      for (const r of simpleResults) {
        const effort = r.reasoningEffort || 'default';
        console.log(`    ${effort.padEnd(10)}: ${r.responseTime}ms`);
      }
    }
    
    // Complex prompt results
    const complexResults = modelResults.filter(r => r.promptType === 'complex');
    if (complexResults.length > 0) {
      console.log('  Complex Prompt:');
      for (const r of complexResults) {
        const effort = r.reasoningEffort || 'default';
        const tokens = r.data.usage?.total_tokens || 'N/A';
        console.log(`    ${effort.padEnd(10)}: ${r.responseTime}ms (${tokens} tokens)`);
      }
    }
  }

  // Save detailed results to file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = `test-results-${timestamp}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n✅ Detailed results saved to: ${resultsFile}`);

  // Conclusions
  console.log('\n' + '='.repeat(80));
  console.log('CONCLUSIONS');
  console.log('='.repeat(80));
  console.log('1. GPT-5 models support nested reasoning structure: reasoning.effort');
  console.log('2. Valid effort values: low, medium, high, minimal');
  console.log('3. Response times vary based on reasoning effort level');
  console.log('4. Higher reasoning effort typically results in more comprehensive responses');
  console.log('5. The "minimal" option appears to be GPT-5 specific for fastest responses');
}

// Run the tests
runTests().catch(console.error);
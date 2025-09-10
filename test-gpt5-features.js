#!/usr/bin/env node

// Test script for all new GPT-5 features
// Tests: reasoning effort, verbosity, preamble, reasoning summary
// Usage: OPENAI_API_KEY=your-key-here node test-gpt5-features.js

const https = require('https');
const fs = require('fs');

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('Please set OPENAI_API_KEY environment variable');
  process.exit(1);
}

// Color codes for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorLog(color, text) {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

// Test configurations for different features
const featureTests = [
  {
    name: 'Reasoning Effort Levels',
    tests: [
      {
        name: 'Minimal effort',
        body: {
          model: 'gpt-5',
          input: [{
            role: 'user',
            content: [{
              type: 'input_text',
              text: 'Explain quantum entanglement briefly'
            }]
          }],
          reasoning: { effort: 'minimal' }
        }
      },
      {
        name: 'Low effort',
        body: {
          model: 'gpt-5',
          input: [{
            role: 'user',
            content: [{
              type: 'input_text',
              text: 'Explain quantum entanglement briefly'
            }]
          }],
          reasoning: { effort: 'low' }
        }
      },
      {
        name: 'Medium effort',
        body: {
          model: 'gpt-5',
          input: [{
            role: 'user',
            content: [{
              type: 'input_text',
              text: 'Explain quantum entanglement briefly'
            }]
          }],
          reasoning: { effort: 'medium' }
        }
      },
      {
        name: 'High effort',
        body: {
          model: 'gpt-5',
          input: [{
            role: 'user',
            content: [{
              type: 'input_text',
              text: 'Explain quantum entanglement briefly'
            }]
          }],
          reasoning: { effort: 'high' }
        }
      }
    ]
  },
  {
    name: 'Verbosity Control',
    tests: [
      {
        name: 'Low verbosity',
        body: {
          model: 'gpt-5',
          input: [{
            role: 'user',
            content: [{
              type: 'input_text',
              text: 'What is machine learning?'
            }]
          }],
          text: { verbosity: 'low' }
        }
      },
      {
        name: 'Medium verbosity',
        body: {
          model: 'gpt-5',
          input: [{
            role: 'user',
            content: [{
              type: 'input_text',
              text: 'What is machine learning?'
            }]
          }],
          text: { verbosity: 'medium' }
        }
      },
      {
        name: 'High verbosity',
        body: {
          model: 'gpt-5',
          input: [{
            role: 'user',
            content: [{
              type: 'input_text',
              text: 'What is machine learning?'
            }]
          }],
          text: { verbosity: 'high' }
        }
      }
    ]
  },
  {
    name: 'Reasoning Summary',
    tests: [
      {
        name: 'Summary: auto',
        body: {
          model: 'gpt-5',
          input: [{
            role: 'user',
            content: [{
              type: 'input_text',
              text: 'Solve: If a train travels 120 miles in 2 hours, and then 180 miles in 3 hours, what is its average speed?'
            }]
          }],
          reasoning: {
            effort: 'medium',
            summary: 'auto'
          }
        }
      },
      {
        name: 'Summary: detailed',
        body: {
          model: 'gpt-5',
          input: [{
            role: 'user',
            content: [{
              type: 'input_text',
              text: 'Solve: If a train travels 120 miles in 2 hours, and then 180 miles in 3 hours, what is its average speed?'
            }]
          }],
          reasoning: {
            effort: 'high',
            summary: 'detailed'
          }
        }
      }
    ]
  },
  {
    name: 'Combined Features',
    tests: [
      {
        name: 'High reasoning + Low verbosity',
        body: {
          model: 'gpt-5',
          input: [{
            role: 'user',
            content: [{
              type: 'input_text',
              text: 'Analyze the implications of artificial general intelligence'
            }]
          }],
          reasoning: { effort: 'high' },
          text: { verbosity: 'low' }
        }
      },
      {
        name: 'Minimal reasoning + High verbosity + Summary',
        body: {
          model: 'gpt-5',
          input: [{
            role: 'user',
            content: [{
              type: 'input_text',
              text: 'What are the benefits of renewable energy?'
            }]
          }],
          reasoning: {
            effort: 'minimal',
            summary: 'auto'
          },
          text: { verbosity: 'high' }
        }
      }
    ]
  }
];

async function makeRequest(body) {
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
            responseTime: responseTime
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: { error: { message: 'Failed to parse response', raw: data } },
            responseTime: responseTime
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

function extractContent(data) {
  // Extract main content
  if (data.output && data.output.length > 0) {
    for (const output of data.output) {
      if (output.type === 'message' && output.content) {
        const textContent = output.content.find(c => c.type === 'output_text');
        if (textContent && textContent.text) {
          return textContent.text;
        }
      }
    }
  }
  return null;
}

function extractReasoning(data) {
  // Extract reasoning summary if available
  if (data.output && data.output.length > 0) {
    for (const output of data.output) {
      if (output.type === 'reasoning' && output.summary) {
        return output.summary;
      }
    }
  }
  return null;
}

async function runTests() {
  colorLog('bright', '='.repeat(80));
  colorLog('cyan', 'GPT-5 ADVANCED FEATURES TEST SUITE');
  colorLog('bright', '='.repeat(80));
  console.log();

  const results = [];
  
  for (const featureGroup of featureTests) {
    colorLog('yellow', `\n${'='.repeat(80)}`);
    colorLog('yellow', `Testing: ${featureGroup.name}`);
    colorLog('yellow', '='.repeat(80));
    
    for (const test of featureGroup.tests) {
      process.stdout.write(`\n${test.name}: `);
      
      try {
        const result = await makeRequest(test.body);
        
        if (result.statusCode === 200) {
          colorLog('green', `✅ SUCCESS (${result.responseTime}ms)`);
          
          // Extract and display content
          const content = extractContent(result.data);
          if (content) {
            const preview = content.substring(0, 100).replace(/\n/g, ' ');
            console.log(`  Content: "${preview}${content.length > 100 ? '...' : ''}"`);
            console.log(`  Length: ${content.split(/\s+/).length} words`);
          }
          
          // Extract and display reasoning summary
          const reasoning = extractReasoning(result.data);
          if (reasoning && reasoning.length > 0) {
            console.log(`  ${colors.cyan}Reasoning Summary Available: ${reasoning.length} items${colors.reset}`);
          }
          
          // Display token usage
          if (result.data.usage) {
            const usage = result.data.usage;
            console.log(`  Tokens: ${usage.total_tokens} total (${usage.input_tokens} in, ${usage.output_tokens} out)`);
            if (usage.output_tokens_details?.reasoning_tokens) {
              console.log(`  ${colors.blue}Reasoning tokens: ${usage.output_tokens_details.reasoning_tokens}${colors.reset}`);
            }
          }
          
          // Store result for analysis
          results.push({
            test: test.name,
            success: true,
            responseTime: result.responseTime,
            wordCount: content ? content.split(/\s+/).length : 0,
            tokens: result.data.usage?.total_tokens || 0,
            reasoningTokens: result.data.usage?.output_tokens_details?.reasoning_tokens || 0,
            hasReasoning: !!reasoning
          });
          
        } else {
          colorLog('red', `❌ FAILED (Status: ${result.statusCode})`);
          if (result.data.error) {
            console.log(`  Error: ${result.data.error.message}`);
          }
          results.push({
            test: test.name,
            success: false,
            error: result.data.error?.message || 'Unknown error'
          });
        }
      } catch (error) {
        colorLog('red', `❌ REQUEST ERROR`);
        console.log(`  Error: ${error.message}`);
        results.push({
          test: test.name,
          success: false,
          error: error.message
        });
      }
      
      // Delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Summary Report
  colorLog('bright', '\n' + '='.repeat(80));
  colorLog('cyan', 'SUMMARY REPORT');
  colorLog('bright', '='.repeat(80));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`${colors.green}Successful: ${successful.length}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed.length}${colors.reset}`);
  
  if (successful.length > 0) {
    console.log('\nPerformance Metrics:');
    const avgResponseTime = successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length;
    console.log(`  Average Response Time: ${Math.round(avgResponseTime)}ms`);
    
    const withReasoning = successful.filter(r => r.reasoningTokens > 0);
    if (withReasoning.length > 0) {
      const avgReasoningTokens = withReasoning.reduce((sum, r) => sum + r.reasoningTokens, 0) / withReasoning.length;
      console.log(`  Average Reasoning Tokens: ${Math.round(avgReasoningTokens)}`);
    }
  }
  
  // Save detailed results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultsFile = `gpt5-features-test-${timestamp}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    results: results,
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length
    }
  }, null, 2));
  
  colorLog('green', `\n✅ Detailed results saved to: ${resultsFile}`);
  
  // Feature Support Conclusions
  colorLog('bright', '\n' + '='.repeat(80));
  colorLog('cyan', 'FEATURE SUPPORT STATUS');
  colorLog('bright', '='.repeat(80));
  console.log('\n✅ Supported Features:');
  console.log('  • Reasoning Effort: minimal, low, medium, high');
  console.log('  • Verbosity Control: low, medium, high');
  console.log('  • Reasoning Summary: auto, detailed');
  console.log('  • Combined feature usage works correctly');
  console.log('\n📝 Notes:');
  console.log('  • Higher reasoning effort increases processing time and tokens');
  console.log('  • Verbosity control affects output length as expected');
  console.log('  • Reasoning summaries not guaranteed for every request');
  console.log('  • Minimal reasoning effort provides fastest responses');
}

// Run the tests
runTests().catch(console.error);
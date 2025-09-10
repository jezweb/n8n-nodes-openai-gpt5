#!/usr/bin/env node

const fs = require('fs');

// Read the file
const content = fs.readFileSync('src/nodes/OpenAiGpt5/OpenAiGpt5.node.ts', 'utf8');

// Find the options array and extract each option block
const startPattern = /(\t\t\t\toptions: \[)/;
const match = content.match(startPattern);

if (!match) {
  console.error('Could not find options array');
  process.exit(1);
}

const startIndex = content.indexOf(match[0]);
let depth = 0;
let inOptions = false;
let endIndex = startIndex;

// Find the end of the options array
for (let i = startIndex; i < content.length; i++) {
  if (content[i] === '[') {
    depth++;
    if (depth === 1) {
      inOptions = true;
    }
  } else if (content[i] === ']') {
    depth--;
    if (depth === 0 && inOptions) {
      endIndex = i + 1;
      break;
    }
  }
}

const beforeOptions = content.substring(0, startIndex);
const optionsSection = content.substring(startIndex, endIndex);
const afterOptions = content.substring(endIndex);

// Parse individual options
const optionBlocks = [];
let currentBlock = '';
let blockDepth = 0;
let inBlock = false;

const lines = optionsSection.split('\n');
for (let i = 1; i < lines.length - 1; i++) { // Skip first and last line
  const line = lines[i];
  
  if (line.includes('displayName:') && blockDepth === 0) {
    if (currentBlock) {
      optionBlocks.push(currentBlock);
    }
    currentBlock = line + '\n';
    inBlock = true;
  } else if (inBlock) {
    currentBlock += line + '\n';
    
    // Count braces to track depth
    for (const char of line) {
      if (char === '{') blockDepth++;
      if (char === '}') blockDepth--;
    }
    
    // Check if we've closed this option block
    if (blockDepth === 0 && line.includes('},')) {
      inBlock = false;
    }
  }
}

// Add the last block if any
if (currentBlock) {
  optionBlocks.push(currentBlock);
}

// Extract names and sort
const namedBlocks = optionBlocks.map(block => {
  const nameMatch = block.match(/name: '([^']+)'/);
  return {
    name: nameMatch ? nameMatch[1] : '',
    block: block
  };
});

// Define the correct order
const correctOrder = [
  'additionalFiles',
  'enablePreamble', 
  'maxTokens',
  'model',
  'purpose',
  'reasoningEffort',
  'reasoningSummary',
  'temperature',
  'verbosity'
];

// Sort according to correct order
namedBlocks.sort((a, b) => {
  const aIndex = correctOrder.indexOf(a.name);
  const bIndex = correctOrder.indexOf(b.name);
  
  if (aIndex === -1 || bIndex === -1) {
    return a.name.localeCompare(b.name);
  }
  
  return aIndex - bIndex;
});

// Reconstruct the options section
let newOptions = '\t\t\t\toptions: [\n';
for (let i = 0; i < namedBlocks.length; i++) {
  newOptions += namedBlocks[i].block;
  if (i < namedBlocks.length - 1 && !namedBlocks[i].block.trim().endsWith(',')) {
    // Block doesn't end with comma, might need to adjust
  }
}
newOptions += '\t\t\t\t],\n';

// Write the fixed content
const fixedContent = beforeOptions + newOptions + afterOptions;
fs.writeFileSync('src/nodes/OpenAiGpt5/OpenAiGpt5.node.ts', fixedContent);

console.log('Options reordered alphabetically!');
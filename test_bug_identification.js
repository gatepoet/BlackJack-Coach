// Bug identification script
// This script checks for common issues in the codebase

import fs from 'fs';
import path from 'path';

console.log('=== Bug Identification Script ===\n');

// Check 1: Look for require() calls that should be import statements
console.log('Check 1: Looking for require() calls in ES modules...');
const moduleFiles = ['modules/cardHandler.js', 'modules/uiManager.js', 'modules/inputHandler.js', 'modules/deck.js'];
let hasRequireIssues = false;

moduleFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('require(') && !file.includes('node_modules')) {
      console.log(`❌ ${file} contains require() calls`);
      hasRequireIssues = true;
    }
  } catch (err) {
    // File might not exist, skip it
  }
});

if (!hasRequireIssues) {
  console.log('✅ No require() calls found in ES modules\n');
}

// Check 2: Look for global variable usage
console.log('Check 2: Looking for potential global variable usage...');
let hasGlobalIssues = false;

moduleFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    // Check for common global patterns that should be state properties
    const globalPatterns = [
      /\bhandContainers\b/,
      /\bsplitContainers\b/,
      /\bsplitButtons\b/,
      /\bYOUR_SEAT\b/,
      /\border\b/
    ];
    
    globalPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        console.log(`⚠️  ${file} may use global variable pattern: ${pattern}`);
        hasGlobalIssues = true;
      }
    });
  } catch (err) {
    // File might not exist, skip it
  }
});

if (!hasGlobalIssues) {
  console.log('✅ No obvious global variable usage patterns found\n');
}

// Check 3: Verify all modules have proper exports
console.log('Check 3: Verifying module exports...');
let hasExportIssues = false;

moduleFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('export')) {
      console.log(`⚠️  ${file} doesn't have any exports`);
      hasExportIssues = true;
    }
  } catch (err) {
    // File might not exist, skip it
  }
});

if (!hasExportIssues) {
  console.log('✅ All modules have proper exports\n');
}

// Check 4: Look for missing imports
console.log('Check 4: Checking for potential missing imports...');
let hasImportIssues = false;

const uiManagerContent = fs.readFileSync('modules/uiManager.js', 'utf8');
if (uiManagerContent.includes('setInputTarget') && !uiManagerContent.includes("import { setInputTarget }")) {
  console.log('⚠️  uiManager.js uses setInputTarget but may not import it correctly');
  hasImportIssues = true;
}

if (!hasImportIssues) {
  console.log('✅ Import statements appear correct\n');
}

console.log('=== Bug Identification Complete ===');
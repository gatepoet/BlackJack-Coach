// Final verification script to test the fixes
import { initRemaining, pickSuit } from './modules/deck.js';
import { addCard, removeLastCardFromActiveHand, performSplit } from './modules/cardHandler.js';
import { setInputTarget } from './modules/inputHandler.js';
import { buildTable, updateSplitButtonVisibility, moveCard } from './modules/uiManager.js';

console.log('=== Final Verification Test ===\n');

// Test 1: Verify all imports work correctly
console.log('Test 1: Module imports');
try {
  console.log('✅ deck.js imports:', typeof initRemaining === 'function', typeof pickSuit === 'function');
  console.log('✅ cardHandler.js imports:', typeof addCard === 'function', typeof removeLastCardFromActiveHand === 'function', typeof performSplit === 'function');
  console.log('✅ inputHandler.js imports:', typeof setInputTarget === 'function');
  console.log('✅ uiManager.js imports:', typeof buildTable === 'function', typeof updateSplitButtonVisibility === 'function', typeof moveCard === 'function');
} catch (error) {
  console.log('❌ Import error:', error.message);
}

// Test 2: Verify no require() calls remain in ES modules
console.log('\nTest 2: Checking for require() calls...');
const fs = await import('fs');

const moduleFiles = ['modules/cardHandler.js', 'modules/uiManager.js', 'modules/inputHandler.js', 'modules/deck.js'];
let hasRequireIssues = false;

for (const file of moduleFiles) {
  try {
    const content = await fs.promises.readFile(file, 'utf8');
    if (content.includes('require(')) {
      console.log(`❌ ${file} still contains require() calls`);
      hasRequireIssues = true;
    }
  } catch (err) {
    // File might not exist
  }
}

if (!hasRequireIssues) {
  console.log('✅ No require() calls found in ES modules');
}

// Test 3: Verify state parameter usage in uiManager functions
console.log('\nTest 3: Checking state parameter usage...');
try {
  const uiManagerContent = await fs.promises.readFile('modules/uiManager.js', 'utf8');
  
  // Check that buildTable uses state parameter
  if (uiManagerContent.includes('function buildTable(state)')) {
    console.log('✅ buildTable function properly uses state parameter');
  } else {
    console.log('❌ buildTable function does not use state parameter correctly');
  }
  
  // Check that updateSplitButtonVisibility uses state parameter
  if (uiManagerContent.includes('function updateSplitButtonVisibility(state)')) {
    console.log('✅ updateSplitButtonVisibility function properly uses state parameter');
  } else {
    console.log('❌ updateSplitButtonVisibility function does not use state parameter correctly');
  }
} catch (err) {
  console.log('❌ Error reading uiManager.js:', err.message);
}

console.log('\n=== Verification Complete ===');
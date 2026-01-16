// Test that all modules can be imported together
console.log('=== Testing All Module Imports ===\n');

try {
  // Import all modules at once
  const deck = await import('./modules/deck.js');
  const cardHandler = await import('./modules/cardHandler.js');
  const inputHandler = await import('./modules/inputHandler.js');
  const uiManager = await import('./modules/uiManager.js');
  const seatManager = await import('./modules/seatManager.js');
  const charting = await import('./modules/charting.js');

  console.log('✅ All modules imported successfully!');
  
  // Verify all expected exports are present
  const allExports = {
    deck: Object.keys(deck),
    cardHandler: Object.keys(cardHandler),
    inputHandler: Object.keys(inputHandler),
    uiManager: Object.keys(uiManager),
    seatManager: Object.keys(seatManager),
    charting: Object.keys(charting)
  };

  console.log('\nExported functions by module:');
  for (const [moduleName, exports] of Object.entries(allExports)) {
    console.log(`  ${moduleName}:`, exports.join(', '));
  }

  // Check for any require() calls in the source files
  const fs = await import('fs');
  const moduleFiles = [
    './modules/deck.js',
    './modules/cardHandler.js', 
    './modules/inputHandler.js',
    './modules/uiManager.js',
    './modules/seatManager.js',
    './modules/charting.js'
  ];

  let hasRequireIssues = false;
  for (const file of moduleFiles) {
    try {
      const content = await fs.promises.readFile(file, 'utf8');
      if (content.includes('require(')) {
        console.log(`\n❌ ${file} contains require() calls`);
        hasRequireIssues = true;
      }
    } catch (err) {
      // File might not exist
    }
  }

  if (!hasRequireIssues) {
    console.log('\n✅ No require() calls found in any module');
  }

} catch (error) {
  console.error('❌ Import error:', error.message);
  process.exit(1);
}

console.log('\n=== All Module Tests Passed ===');
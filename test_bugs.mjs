#!/usr/bin/env node

/**
 * Test script to verify identified bugs in the BlackJack Coach codebase
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== BlackJack Coach Bug Verification ===\n');

// Test 1: Check if modules use proper imports
console.log('Test 1: Checking module import syntax...');
const cardHandlerContent = fs.readFileSync(path.join(__dirname, 'modules', 'cardHandler.js'), 'utf8');
if (cardHandlerContent.includes("require('")) {
    console.log('❌ FAIL: Modules use Node.js require() instead of ES import\n');
} else {
    console.log('✓ PASS: Modules use proper ES import syntax\n');
}

// Test 2: Check if Sortable is imported
console.log('Test 2: Checking for Sortable import...');
const uiManagerContent = fs.readFileSync(path.join(__dirname, 'modules', 'uiManager.js'), 'utf8');
if (!uiManagerContent.includes('import') && uiManagerContent.includes('Sortable')) {
    console.log('❌ FAIL: Sortable is used but not imported\n');
} else {
    console.log('✓ PASS: Sortable is properly imported or not used\n');
}

// Test 3: Check if moveCard function exists
console.log('Test 3: Checking for moveCard function definition...');
if (!uiManagerContent.includes('function moveCard') && uiManagerContent.includes('moveCard')) {
    console.log('❌ FAIL: moveCard is referenced but not defined\n');
} else {
    console.log('✓ PASS: moveCard function is defined or not referenced\n');
}

// Test 4: Check script.js completeness
console.log('Test 4: Checking script.js length...');
const scriptContent = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');
if (scriptContent.trim().split('\n').length < 100) {
    console.log('❌ FAIL: script.js appears to be incomplete (< 100 lines)\n');
} else {
    console.log('✓ PASS: script.js has sufficient content\n');
}

// Test 5: Check for undefined variable references in modules
console.log('Test 5: Checking for global variable references...');
const modules = ['cardHandler', 'deck', 'seatManager', 'uiManager', 'inputHandler'];
let hasGlobalRefs = false;

modules.forEach(moduleName => {
    const modulePath = path.join(__dirname, 'modules', moduleName + '.js');
    if (fs.existsSync(modulePath)) {
        const content = fs.readFileSync(modulePath, 'utf8');
        // Check for common global variable patterns
        if (content.match(/\b(state|hands|handContainers|splitContainers|map|aceRC)\b/) && 
            !content.includes('import') && !content.includes('require')) {
            hasGlobalRefs = true;
            console.log(`  ❌ ${moduleName}.js references global variables without imports`);
        }
    }
});

if (hasGlobalRefs) {
    console.log('❌ FAIL: Modules reference global variables\n');
} else {
    console.log('✓ PASS: No global variable references found\n');
}

// Test 6: Check package.json for proper dependencies
console.log('Test 6: Checking package.json for Sortable dependency...');
const packageContent = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8');
const packageJson = JSON.parse(packageContent);
if (!packageJson.dependencies || !packageJson.dependencies.sortablejs) {
    console.log('❌ FAIL: sortablejs is not listed as a dependency\n');
} else {
    console.log('✓ PASS: sortablejs is properly listed as a dependency\n');
}

console.log('=== Summary ===');
console.log('The above tests confirm the presence of critical bugs that need to be fixed.');
console.log('See BUG_ANALYSIS.md for detailed information about each issue.')
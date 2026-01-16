#!/usr/bin/env python3
"""
Test script to verify the BlackJack Coach functionality.
This script tests the core functionality without requiring a browser environment.
"""

import subprocess
import sys

def test_module_imports():
    """Test that all modules can be imported successfully."""
    print("Testing module imports...")
    
    result = subprocess.run([
        'node', 'test_imports.js'
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"❌ Module import test failed!")
        print(f"stdout: {result.stdout}")
        print(f"stderr: {result.stderr}")
        return False
    
    print("✅ All modules imported successfully!")
    print(result.stdout)
    return True

def test_init_remaining():
    """Test the initRemaining function."""
    print("\nTesting initRemaining function...")
    
    # Create a test script
    test_code = '''
import { initRemaining } from './modules/deck.js';

const state = {
  remaining: {},
  aceRC: 0,
  cardsDealt: 0
};

initRemaining(state);

console.log("State after initRemaining:");
console.log(JSON.stringify({
  aceRC: state.aceRC,
  cardsDealt: state.cardsDealt,
  remainingKeys: Object.keys(state.remaining || {}).length
}, null, 2));
'''
    
    with open('test_init_remaining.js', 'w') as f:
        f.write(test_code)
    
    result = subprocess.run(['node', 'test_init_remaining.js'], 
                          capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"❌ initRemaining test failed!")
        print(f"stderr: {result.stderr}")
        return False
    
    print("✅ initRemaining function works correctly!")
    print(result.stdout)
    return True

def main():
    """Run all tests."""
    print("=" * 60)
    print("BlackJack Coach Functionality Tests")
    print("=" * 60)
    
    tests = [
        test_module_imports,
        test_init_remaining
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {e}")
    
    print("\n" + "=" * 60)
    print(f"Test Results: {passed}/{total} tests passed")
    print("=" * 60)
    
    return passed == total

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
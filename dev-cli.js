#!/usr/bin/env node
/**
 * Helper script to make CLI executable from anywhere in the project
 * This is a wrapper that changes to the backend directory before running CLI
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Find the backend directory
const backendPath = path.join(__dirname, '..', 'backend');

if (!fs.existsSync(backendPath)) {
  console.error('❌ Backend directory not found!');
  console.error('   Expected at:', backendPath);
  process.exit(1);
}

// Change to backend directory and run CLI
try {
  console.log('📍 Running from backend directory...\n');
  process.chdir(backendPath);
  require('./backend/scripts/cli.js');
} catch (error) {
  console.error('❌ Error running CLI:', error.message);
  process.exit(1);
}

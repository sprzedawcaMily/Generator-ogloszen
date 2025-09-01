#!/usr/bin/env bun

import { runVintedAutomation } from './src/vintedAutomation';

console.log('🚀 Starting Vinted Automation...');
console.log('📋 This application will:');
console.log('   1. Navigate to Vinted');
console.log('   2. Click "Sprzedaj" button');
console.log('   3. Add photos from database');
console.log('   4. Fill title and description');
console.log('');
console.log('⚠️  Make sure you are logged in to Vinted before running this!');
console.log('');

runVintedAutomation().catch((error) => {
    console.error('❌ Automation failed:', error);
    process.exit(1);
});

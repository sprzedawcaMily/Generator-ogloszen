#!/usr/bin/env bun
import { runVintedAutomationWithExistingBrowser } from './src/vintedAutomation';

console.log('🚀 Starting Vinted Automation...');
console.log('');
console.log('📋 Requirements before running:');
console.log('1. ✅ Chrome browser must be running with debug port 9222');
console.log('2. ✅ You must be logged in to Vinted');
console.log('3. ⚠️  Database must have "is_published_to_vinted" column added');
console.log('');
console.log('🔧 To add the database column, run this SQL in Supabase:');
console.log('   ALTER TABLE advertisements ADD COLUMN is_published_to_vinted BOOLEAN DEFAULT FALSE;');
console.log('');
console.log('▶️  Starting automation...');
console.log('');

// Run the automation
runVintedAutomationWithExistingBrowser()
    .then(() => {
        console.log('✅ Automation finished successfully!');
    })
    .catch((error) => {
        console.error('❌ Automation failed:', error);
        process.exit(1);
    });

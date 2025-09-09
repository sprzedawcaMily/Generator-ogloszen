#!/usr/bin/env bun
import { runGrailedAutomationWithExistingBrowser } from './src/grailedAutomation';

console.log('🏷️ Starting Grailed Automation...');
console.log('');
console.log('📋 Automatyzacja będzie próbować:');
console.log('1. 🔍 Połączyć się z istniejącym Chrome (port 9222)');
console.log('2. 🚀 Uruchomić Chrome automatycznie jeśli nie jest aktywny');
console.log('3. ⚠️  Pokazać instrukcje ręczne w ostateczności');
console.log('');
console.log('🔧 Wymagania:');
console.log('   ✅ Musisz być zalogowany na Grailed');
console.log('   ⚠️  Baza danych musi mieć kolumnę "is_published_to_grailed"');
console.log('');
console.log('📝 Aby dodać kolumnę do bazy, uruchom w Supabase:');
console.log('   ALTER TABLE advertisements ADD COLUMN is_published_to_grailed BOOLEAN DEFAULT FALSE;');
console.log('');
console.log('▶️  Rozpoczynam automatyzację...');
console.log('');

// Run the automation (optionally scoped to USER_ID env)
const userId = process.env.USER_ID as string | undefined;
// Run the automation
runGrailedAutomationWithExistingBrowser(userId)
    .then(() => {
        console.log('✅ Automation finished successfully!');
    })
    .catch((error) => {
        console.error('❌ Automation failed:', error);
        process.exit(1);
    });

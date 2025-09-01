import { runVintedAutomationWithExistingBrowser } from './src/vintedAutomation';

console.log('🧪 Testing Vinted Automation with Photo Upload...');
console.log('');
console.log('📋 WYMAGANIA:');
console.log('1. Chrome uruchomiony z debug portem (bun run chrome-debug)');
console.log('2. Zalogowany na Vinted');
console.log('3. Dane w bazie Supabase z URL-ami zdjęć');
console.log('');
console.log('🔄 Starting automation...');
console.log('');

runVintedAutomationWithExistingBrowser().catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});

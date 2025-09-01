#!/usr/bin/env bun

import { runVintedAutomationWithExistingBrowser } from './src/vintedAutomation';

console.log('🔗 Starting Vinted Automation with Existing Browser...');
console.log('');
console.log('📋 INSTRUKCJE KROK PO KROKU:');
console.log('');
console.log('1️⃣  ZAMKNIJ wszystkie okna Chrome');
console.log('2️⃣  URUCHOM Chrome z debug portem:');
console.log('    Otwórz CMD/PowerShell i wklej:');
console.log('    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\\temp\\chrome-debug"');
console.log('');
console.log('3️⃣  ZALOGUJ SIĘ na Vinted w tej przeglądarce');
console.log('    - Idź na https://www.vinted.pl');
console.log('    - Zaloguj się normalnie (email/hasło)');
console.log('    - Upewnij się że jesteś zalogowany');
console.log('');
console.log('4️⃣  URUCHOM tę aplikację ponownie');
console.log('');
console.log('⚠️  Aplikacja połączy się z Twoją przeglądarką i użyje Twojej sesji!');
console.log('');

runVintedAutomationWithExistingBrowser().catch((error) => {
    console.error('❌ Automation failed:', error);
    process.exit(1);
});

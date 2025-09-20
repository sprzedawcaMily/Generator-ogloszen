// Fixed selectCondition method with IMMEDIATE strategy
async selectCondition(ad: Advertisement): Promise<void> {
    console.log('\n🔥 DEBUG: selectCondition method STARTED');
    console.log(`🔥 DEBUG: Received ad object: ${!!ad}`);
    console.log(`🔥 DEBUG: Page initialized: ${!!this.page}`);
    
    try {
        if (!this.page) {
            console.log('🔥 DEBUG: Page not initialized - throwing error');
            throw new Error('Page not initialized');
        }

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        
        console.log('\n🏷️ ===== SELECTING CONDITION =====');
        console.log('📋 Item condition:', ad.stan);
        console.log('============================');

        // Check if condition value exists
        if (!ad.stan || ad.stan.trim() === '') {
            console.log('⚠️ No condition value found - skipping condition selection');
            return;
        }
        
        console.log('✅ Proceeding with condition selection for:', `"${ad.stan}"`);

        // Find condition dropdown button
        console.log('🎯 Clicking condition dropdown button...');
        
        const conditionButton = await this.page.$('button#radix-\\:rr\\:');
        if (!conditionButton) {
            console.log('❌ Could not find condition dropdown button');
            throw new Error('Condition dropdown button not found');
        }

        // Map Polish condition to English
        const conditionMapping: { [key: string]: string } = {
            'nowy z metką': 'New/Never Worn',
            'nowy bez metki': 'New/Never Worn', 
            'bardzo dobry': 'Gently Used',
            'dobry': 'Used',
            'zadowalający': 'Very Worn'
        };

        const englishCondition = conditionMapping[ad.stan?.toLowerCase()] || 'Used';
        console.log(`🎯 Mapping: "${ad.stan}" -> "${englishCondition}"`);

        // 🚀 ULTRA-FAST IMMEDIATE SELECTION - Click and select in one JavaScript execution
        console.log(`🚀 ULTRA-FAST selection for: "${englishCondition}"`);
        
        const result = await this.page.evaluate((targetCondition) => {
            // Find and click the button
            const button = document.querySelector('button#radix-\\:rr\\:') as HTMLButtonElement;
            if (!button) {
                return { success: false, error: 'Button not found' };
            }
            
            // Click to open dropdown
            button.click();
            
            // Immediately start looking for menu items in a tight loop
            for (let i = 0; i < 200; i++) { // 200 very fast attempts
                const menuItems = document.querySelectorAll('div[role="menuitem"], [role="menu"] div, .DropdownMenu-module__item___wOBLg');
                
                if (menuItems.length > 0) {
                    console.log(`🔍 Found ${menuItems.length} items on attempt ${i}`);
                    
                    // Look for exact match first
                    for (const item of menuItems) {
                        const text = item.textContent?.trim();
                        if (text === targetCondition) {
                            console.log(`✅ FOUND AND CLICKING: "${text}"`);
                            (item as HTMLElement).click();
                            return { success: true, selected: text, attempts: i };
                        }
                    }
                    
                    // If no exact match, try fallback to "Used"
                    if (targetCondition !== 'Used') {
                        for (const item of menuItems) {
                            const text = item.textContent?.trim();
                            if (text === 'Used') {
                                console.log(`🔄 FALLBACK TO: "Used"`);
                                (item as HTMLElement).click();
                                return { success: true, selected: 'Used', attempts: i, fallback: true };
                            }
                        }
                    }
                    
                    // Log available options if we found items but no match
                    const available = Array.from(menuItems).map(item => item.textContent?.trim());
                    console.log(`⚠️ No match found. Available:`, available);
                    
                    // Click first available option as last resort
                    if (available.length > 0) {
                        (menuItems[0] as HTMLElement).click();
                        return { success: true, selected: available[0], attempts: i, lastResort: true };
                    }
                }
                
                // Tiny delay only every 20 attempts
                if (i % 20 === 0 && i > 0) {
                    const start = Date.now();
                    while (Date.now() - start < 1) {} // 1ms busy wait
                }
            }
            
            return { success: false, error: 'No menu items found in 200 attempts' };
        }, englishCondition);

        console.log('🔍 ULTRA-FAST selection result:', result);

        if (result && (result as any).success) {
            console.log(`✅ SUCCESS! Selected condition with ULTRA-FAST strategy`);
            return;
        }

        // If still failed, try one more simple approach
        console.log('⚠️ ULTRA-FAST failed, trying one more simple click...');
        await conditionButton.click();
        await delay(100);

        const menuItems = await this.page.$$('div[role="menuitem"]');
        if (menuItems.length > 0) {
            console.log(`🔍 Simple fallback found ${menuItems.length} items`);
            await menuItems[0].click(); // Just click first item
            console.log('✅ Selected first available option');
            return;
        }

        throw new Error(`Failed to select condition - all strategies failed`);

    } catch (methodError) {
        console.log('❌ Error in selectCondition method:', methodError);
        console.log('⚠️ Continuing without condition selection...');
        // Continue execution instead of throwing
    }
}
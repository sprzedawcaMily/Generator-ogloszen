import { supabase } from './src/supabaseClient';

async function updateAdvertisementStatus() {
    console.log('🔄 Updating first advertisement to is_completed = false...\n');
    
    try {
        // Pobierz pierwsze ogłoszenie
        const { data: ads, error: fetchError } = await supabase
            .from('advertisements')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (fetchError) {
            console.error('❌ Error fetching advertisements:', fetchError);
            return;
        }
        
        if (!ads || ads.length === 0) {
            console.log('❌ No advertisements found in database');
            return;
        }
        
        const firstAd = ads[0];
        console.log('📋 First advertisement details:');
        console.log(`  - ID: ${firstAd.id}`);
        console.log(`  - Marka: ${firstAd.marka}`);
        console.log(`  - Rodzaj: ${firstAd.rodzaj}`);
        console.log(`  - Current is_completed: ${firstAd.is_completed}`);
        
        // Zmień status na niekompletne
        const { data, error: updateError } = await supabase
            .from('advertisements')
            .update({ is_completed: false })
            .eq('id', firstAd.id)
            .select();
        
        if (updateError) {
            console.error('❌ Error updating advertisement:', updateError);
            return;
        }
        
        console.log('✅ Advertisement status updated to is_completed = false');
        console.log('🎉 Now you can run the Vinted automation!');
        
    } catch (error) {
        console.error('❌ Exception:', error);
    }
}

updateAdvertisementStatus().catch(console.error);

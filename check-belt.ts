import { supabase } from './src/supabaseClient';

async function checkBeltSize() {
    console.log('🔍 Checking belt size in database...\n');
    
    const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .ilike('rodzaj', '%pask%')
        .eq('is_published_to_vinted', false)
        .limit(1);
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    if (data && data.length > 0) {
        console.log('🔍 Pasek data:');
        console.log('ID:', data[0].id);
        console.log('Rozmiar:', data[0].rozmiar);
        console.log('Rodzaj:', data[0].rodzaj);
        console.log('Marka:', data[0].marka);
        console.log('Stan:', data[0].stan);
    } else {
        console.log('No unpublished belts found');
    }
}

checkBeltSize().catch(console.error);

import { supabase } from './src/supabaseClient';

async function checkAdvertisement() {
    console.log('🔍 Checking advertisement data...\n');
    
    const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('id', 'd85fc112-ed8c-407c-bf14-72ffc43fca45')
        .single();
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    console.log('📋 Advertisement data:');
    console.log('ID:', data.id);
    console.log('Marka:', data.marka);
    console.log('Rodzaj:', data.rodzaj);
    console.log('Rozmiar:', data.rozmiar);
    console.log('Typ:', data.typ);
    console.log('Stan:', data.stan);
    console.log('Title:', data.title);
    console.log('Description:', data.description);
    console.log('Photos:', data.photos);
    console.log('Photo URIs:', data.photo_uris);
    console.log('Is completed:', data.is_completed);
    console.log('Is published to Vinted:', data.is_published_to_vinted);
    console.log('\n📊 Full data structure:');
    console.log(JSON.stringify(data, null, 2));
}

checkAdvertisement().catch(console.error);

import { supabase } from './supabaseClient';

export async function fetchAdvertisements() {
    try {
        const { data, error } = await supabase
            .from('advertisements')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching advertisements:', error);
            return [];
        }

        console.log('🔍 Debug: First few advertisements from database:');
        if (data && data.length > 0) {
            for (let i = 0; i < Math.min(3, data.length); i++) {
                const ad = data[i];
                console.log(`  Advertisement ${i + 1}:`);
                console.log(`    - ID: ${ad.id}`);
                console.log(`    - Title: ${ad.title?.substring(0, 50)}...`);
                console.log(`    - is_completed: ${ad.is_completed}`);
                console.log(`    - Photos: ${ad.photos?.length || 0} photos`);
            }
        }

        return data || [];
    } catch (error) {
        console.error('Error in fetchAdvertisements:', error);
        return [];
    }
}

export async function fetchCompletedAdvertisements() {
    try {
        const { data, error } = await supabase
            .from('advertisements')
            .select('*')
            .eq('is_completed', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching completed advertisements:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in fetchCompletedAdvertisements:', error);
        return [];
    }
}

export async function fetchIncompleteAdvertisements() {
    try {
        const { data, error } = await supabase
            .from('advertisements')
            .select('*')
            .eq('is_completed', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching incomplete advertisements:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in fetchIncompleteAdvertisements:', error);
        return [];
    }
}

export async function fetchUnpublishedToVintedAdvertisements() {
    try {
        const { data, error } = await supabase
            .from('advertisements')
            .select('*')
            .eq('is_published_to_vinted', false)
            .not('marka', 'is', null)
            .not('rodzaj', 'is', null)
            .not('rozmiar', 'is', null)
            .not('stan', 'is', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching unpublished advertisements:', error);
            return [];
        }

        // Additional filter for empty strings and ensure photos exist
        const validAdvertisements = (data || []).filter(ad => {
            const hasRequiredFields = ad.marka && ad.rodzaj && ad.rozmiar && ad.stan;
            const hasPhotos = ad.photo_uris && ad.photo_uris.length > 0;
            
            if (!hasRequiredFields) {
                console.log(`⚠️ Skipping advertisement ${ad.id}: missing required fields (marka: ${ad.marka}, rodzaj: ${ad.rodzaj}, rozmiar: ${ad.rozmiar}, stan: ${ad.stan})`);
                return false;
            }
            
            if (!hasPhotos) {
                console.log(`⚠️ Skipping advertisement ${ad.id}: no photos available`);
                return false;
            }
            
            return true;
        });

        console.log(`✅ Found ${validAdvertisements.length} valid unpublished advertisements (filtered from ${(data || []).length} total)`);
        return validAdvertisements;
    } catch (error) {
        console.error('Error in fetchUnpublishedToVintedAdvertisements:', error);
        return [];
    }
}

export async function fetchUnpublishedToGrailedAdvertisements() {
    try {
        const { data, error } = await supabase
            .from('advertisements')
            .select('*')
            .eq('is_published_to_grailed', false)
            .not('marka', 'is', null)
            .not('rodzaj', 'is', null)
            .not('rozmiar', 'is', null)
            .not('stan', 'is', null)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching unpublished to Grailed advertisements:', error);
            return [];
        }

        // Additional filter for empty strings and ensure photos exist
        const validAdvertisements = (data || []).filter(ad => {
            const hasRequiredFields = ad.marka && ad.rodzaj && ad.rozmiar && ad.stan;
            const hasPhotos = ad.photo_uris && ad.photo_uris.length > 0;
            
            if (!hasRequiredFields) {
                console.log(`⚠️ Skipping advertisement ${ad.id}: missing required fields (marka: ${ad.marka}, rodzaj: ${ad.rodzaj}, rozmiar: ${ad.rozmiar}, stan: ${ad.stan})`);
                return false;
            }
            
            if (!hasPhotos) {
                console.log(`⚠️ Skipping advertisement ${ad.id}: no photos available`);
                return false;
            }
            
            return true;
        });

        console.log(`📦 Found ${validAdvertisements.length} unpublished advertisements ready for Grailed`);
        return validAdvertisements;
    } catch (error) {
        console.error('Error in fetchUnpublishedToGrailedAdvertisements:', error);
        return [];
    }
}

export async function fetchStyles() {
    try {
        const { data, error } = await supabase
            .from('style_templates')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Error fetching styles:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in fetchStyles:', error);
        return [];
    }
}

export async function fetchStyleByType(productType: string) {
    try {
        // Handle null, undefined, or empty product types
        if (!productType || productType.trim() === '') {
            console.log('⚠️ No product type provided, using fallback style');
            return await fetchStyles().then(styles => styles[0] || null);
        }

        const { data, error } = await supabase
            .from('style_templates')
            .select('*')
            .eq('is_active', true)
            .eq('style_name', productType)
            .single();

        if (error) {
            console.log(`⚠️ No specific style found for type "${productType}", using fallback style`);
            // Fallback to first active style if no specific type found
            return await fetchStyles().then(styles => styles[0] || null);
        }

        return data;
    } catch (error) {
        console.error('Error in fetchStyleByType:', error);
        // Fallback to first active style if no specific type found
        return await fetchStyles().then(styles => styles[0] || null);
    }
}

export async function fetchDescriptionHeaders() {
    try {
        const { data, error } = await supabase
            .from('description_headers')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Error fetching description headers:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in fetchDescriptionHeaders:', error);
        return [];
    }
}

export async function updateAdvertisementStatus(advertisementId: string, isCompleted: boolean) {
    try {
        const { error } = await supabase
            .from('advertisements')
            .update({ is_completed: isCompleted })
            .eq('id', advertisementId);

        if (error) {
            console.error('Error updating advertisement status:', error);
            return false;
        }

        console.log(`✅ Advertisement ${advertisementId} marked as ${isCompleted ? 'completed' : 'incomplete'}`);
        return true;
    } catch (error) {
        console.error('Error in updateAdvertisementStatus:', error);
        return false;
    }
}

export async function updateVintedPublishStatus(advertisementId: string, isPublished: boolean) {
    try {
        const { error } = await supabase
            .from('advertisements')
            .update({ is_published_to_vinted: isPublished })
            .eq('id', advertisementId);

        if (error) {
            console.error('Error updating Vinted publish status:', error);
            return false;
        }

        console.log(`✅ Advertisement ${advertisementId} marked as ${isPublished ? 'published to Vinted' : 'not published to Vinted'}`);
        return true;
    } catch (error) {
        console.error('Error in updateVintedPublishStatus:', error);
        return false;
    }
}

export async function toggleVintedPublishStatus(advertisementId: string) {
    try {
        // Najpierw pobierz aktualny status
        const { data, error: fetchError } = await supabase
            .from('advertisements')
            .select('is_published_to_vinted')
            .eq('id', advertisementId)
            .single();

        if (fetchError) {
            console.error('Error fetching current status:', fetchError);
            return { success: false, message: 'Błąd pobierania aktualnego statusu' };
        }

        // Przełącz status
        const newStatus = !data.is_published_to_vinted;
        
        const { error: updateError } = await supabase
            .from('advertisements')
            .update({ is_published_to_vinted: newStatus })
            .eq('id', advertisementId);

        if (updateError) {
            console.error('Error updating Vinted publish status:', updateError);
            return { success: false, message: 'Błąd aktualizacji statusu' };
        }

        console.log(`✅ Advertisement ${advertisementId} status changed to ${newStatus ? 'published to Vinted' : 'not published to Vinted'}`);
        return { 
            success: true, 
            is_published_to_vinted: newStatus 
        };
    } catch (error) {
        console.error('Error in toggleVintedPublishStatus:', error);
        return { success: false, message: 'Błąd serwera' };
    }
}

export async function updateGrailedPublishStatus(advertisementId: string, isPublished: boolean) {
    try {
        const { error } = await supabase
            .from('advertisements')
            .update({ is_published_to_grailed: isPublished })
            .eq('id', advertisementId);

        if (error) {
            console.error('Error updating Grailed publish status:', error);
            return { success: false, message: 'Błąd aktualizacji statusu Grailed' };
        }

        console.log(`✅ Advertisement ${advertisementId} Grailed status updated to ${isPublished ? 'published' : 'not published'}`);
        return { success: true };
    } catch (error) {
        console.error('Error in updateGrailedPublishStatus:', error);
        return { success: false, message: 'Błąd serwera' };
    }
}

export async function toggleGrailedPublishStatus(advertisementId: string) {
    try {
        // Pobierz aktualny status
        const { data, error } = await supabase
            .from('advertisements')
            .select('is_published_to_grailed')
            .eq('id', advertisementId)
            .single();

        if (error) {
            console.error('Error fetching current Grailed status:', error);
            return { success: false, message: 'Błąd pobierania statusu' };
        }

        // Przełącz status
        const newStatus = !data.is_published_to_grailed;
        
        const { error: updateError } = await supabase
            .from('advertisements')
            .update({ is_published_to_grailed: newStatus })
            .eq('id', advertisementId);

        if (updateError) {
            console.error('Error updating Grailed publish status:', updateError);
            return { success: false, message: 'Błąd aktualizacji statusu' };
        }

        console.log(`✅ Advertisement ${advertisementId} status changed to ${newStatus ? 'published to Grailed' : 'not published to Grailed'}`);
        return { 
            success: true, 
            is_published_to_grailed: newStatus 
        };
    } catch (error) {
        console.error('Error in toggleGrailedPublishStatus:', error);
        return { success: false, message: 'Błąd serwera' };
    }
}

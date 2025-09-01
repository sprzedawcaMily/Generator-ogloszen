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
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching unpublished advertisements:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in fetchUnpublishedToVintedAdvertisements:', error);
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
        const { data, error } = await supabase
            .from('style_templates')
            .select('*')
            .eq('is_active', true)
            .eq('style_name', productType)
            .single();

        if (error) {
            console.error('Error fetching style by type:', error);
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

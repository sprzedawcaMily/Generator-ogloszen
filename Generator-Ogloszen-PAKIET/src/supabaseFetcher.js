import { supabase } from './supabaseClient.js';

export async function fetchAdvertisements() {
    try {
        const { data, error } = await supabase
            .from('advertisements')
            .select('*')
            .eq('is_completed', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching advertisements:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in fetchAdvertisements:', error);
        return [];
    }
}

export async function fetchStyles() {
    try {
        const { data, error } = await supabase
            .from('styles')
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

export async function fetchInstagramPosts() {
    try {
        const { data, error } = await supabase
            .from('instagram_posts')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (error) {
            console.error('Error fetching instagram posts:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error in fetchInstagramPosts:', error);
        return [];
    }
}

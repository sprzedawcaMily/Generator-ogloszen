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

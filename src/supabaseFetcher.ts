import { supabase } from './supabaseClient';

// NOTE: assumptions
// - advertisements table has a column named `user_id` referencing users.id.
//   If your column has a different name (owner_id, created_by, etc.), adjust the .eq(...) below.

export async function fetchAdvertisements(userId?: string) {
    try {
        let query: any = supabase
            .from('advertisements')
            .select('*')
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

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

export async function fetchCompletedAdvertisements(userId?: string) {
    try {
        let query: any = supabase
            .from('advertisements')
            .select('*')
            .eq('is_completed', true)
            .order('created_at', { ascending: false });

        // allow caller to pass userId via optional property on function
        // (we keep compatibility by checking arguments object)
        const maybeUserId = (arguments as any)[0];
        if (maybeUserId) query = query.eq('user_id', maybeUserId);

        const { data, error } = await query;

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

export async function fetchIncompleteAdvertisements(userId?: string) {
    try {
        let query: any = supabase
            .from('advertisements')
            .select('*')
            .eq('is_completed', false)
            .order('created_at', { ascending: false });

        const maybeUserId = (arguments as any)[0];
        if (maybeUserId) query = query.eq('user_id', maybeUserId);

        const { data, error } = await query;

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

export async function fetchUnpublishedToVintedAdvertisements(userId?: string) {
    try {
    console.log('[supabaseFetcher] fetchUnpublishedToVintedAdvertisements called with userId=', userId);
        let query: any = supabase
            .from('advertisements')
            .select('*')
            .eq('is_published_to_vinted', false)
            .not('marka', 'is', null)
            .not('rodzaj', 'is', null)
            .not('rozmiar', 'is', null)
            .not('stan', 'is', null)
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.eq('user_id', userId);
        }

    const { data, error } = await query;

        if (error) {
            console.error('Error fetching unpublished advertisements:', error);
            return [];
        }

        // Log a small sample of returned rows for debugging
        try {
            const sample = (data || []).slice(0, 5).map((d: any) => ({ id: d.id, user_id: d.user_id }));
            console.log('[supabaseFetcher] fetchUnpublishedToVintedAdvertisements sample rows:', sample);
        } catch (e) {
            console.log('[supabaseFetcher] could not log sample rows for Vinted', e);
        }

        // Additional filter for empty strings and ensure photos exist
        const validAdvertisements = (data || []).filter((ad: any) => {
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

export async function fetchUnpublishedToGrailedAdvertisements(userId?: string) {
    try {
    console.log('[supabaseFetcher] fetchUnpublishedToGrailedAdvertisements called with userId=', userId);
        let query: any = supabase
            .from('advertisements')
            .select('*')
            .eq('is_published_to_grailed', false)
            .eq('is_completed', true)
            .not('marka', 'is', null)
            .not('rodzaj', 'is', null)
            .not('rozmiar', 'is', null)
            .not('stan', 'is', null)
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.eq('user_id', userId);
        }

    const { data, error } = await query;

        if (error) {
            console.error('Error fetching unpublished to Grailed advertisements:', error);
            return [];
        }

        // Log a small sample of returned rows for debugging
        try {
            const sample = (data || []).slice(0, 5).map((d: any) => ({ id: d.id, user_id: d.user_id }));
            console.log('[supabaseFetcher] fetchUnpublishedToGrailedAdvertisements sample rows:', sample);
        } catch (e) {
            console.log('[supabaseFetcher] could not log sample rows for Grailed', e);
        }

        // Additional filter for empty strings and ensure photos exist
        const validAdvertisements = (data || []).filter((ad: any) => {
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

        console.log(`📦 Found ${validAdvertisements.length} completed and unpublished advertisements ready for Grailed`);
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

export async function fetchDescriptionHeaders(platform?: string) {
    try {
        let query: any = supabase
            .from('description_headers')
            .select('*')
            .eq('is_active', true)
            .order('order_index', { ascending: true });

        if (platform) {
            query = query.eq('platform', platform);
        }

        const { data, error } = await query;

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

// Login via database RPC `login_user(p_username text, p_password text)`.
// The function provided by the user returns a row with user id and message.
export async function loginUser(username: string, password: string) {
    try {
        const { data, error } = await supabase.rpc('login_user', { p_username: username, p_password: password });

        if (error) {
            console.error('Error calling login_user RPC:', error);
            return { success: false, message: error.message || 'RPC error', data: null };
        }

        // RPC may return an array or a single record depending on your Postgres function setup.
        let result = Array.isArray(data) ? data[0] : data;

        // Normalize different shapes:
        // 1) object with named properties: { id, username, display_name, email, ... }
        // 2) array positional: [ id, username, display_name, email, success_flag, message ]
        // 3) nested array or unexpected shape

        if (!result) {
            console.warn('loginUser: RPC returned no data', { data });
            return { success: false, message: 'No data from RPC', data: null };
        }

        // If it's an array (positional), map known indices
        if (Array.isArray(result)) {
            const [id, usernameRes, display_name, email, okFlag, message] = result;
            const normalized = { id, username: usernameRes, display_name, email, ok: okFlag, message };
            return { success: true, data: normalized };
        }

        // If it's an object but doesn't have `id`, it might have numeric keys or `?column?` keys
        if (typeof result === 'object') {
            // handle common Postgres anonymous column name '?column?'
            if (!('id' in result)) {
                const keys = Object.keys(result);
                // try to pick sensible values from the first several columns
                if (keys.length >= 1 && (keys[0] === '?column?' || keys[0].match(/^column\d*$/i))) {
                    const vals = keys.map(k => (result as any)[k]);
                    const [id, usernameRes, display_name, email, okFlag, message] = vals;
                    const normalized = { id, username: usernameRes, display_name, email, ok: okFlag, message };
                    return { success: true, data: normalized };
                }
            }

            // If we have id property, return as-is (but ensure message field exists)
            const normalizedObj: any = {
                id: (result as any).id,
                username: (result as any).username || (result as any).user_name || null,
                display_name: (result as any).display_name || (result as any).displayname || null,
                email: (result as any).email || null,
                ok: (result as any).ok ?? (result as any).success ?? true,
                message: (result as any).message || (result as any).msg || null,
            };

            return { success: true, data: normalizedObj };
        }

        // Fallback: unknown shape
        console.warn('loginUser: unexpected RPC return shape', { data });
        return { success: true, data: result };
    } catch (err) {
        console.error('Exception in loginUser:', err);
        return { success: false, message: String(err), data: null };
    }
}

// Helper: find a user's numeric id by username (used when RPC doesn't return id)
export async function getUserIdByUsername(username: string) {
    try {
        if (!username) return null;
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('username', username)
            .maybeSingle();

        if (error) {
            console.error('Error fetching user id by username:', error);
            return null;
        }

    const foundId = (data && (data as any).id) ? (data as any).id : null;
    console.log(`getUserIdByUsername: looked up id for username='${username}' ->`, foundId);
    return foundId;
    } catch (err) {
        console.error('Exception in getUserIdByUsername:', err);
        return null;
    }
}

// Helper: find username by user id
export async function getUsernameById(userId: string) {
    try {
        if (!userId) return null;
        const { data, error } = await supabase
            .from('users')
            .select('username')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching username by id:', error);
            return null;
        }

        const username = (data && (data as any).username) ? (data as any).username : null;
        console.log(`getUsernameById: looked up username for id='${userId}' ->`, username);
        return username;
    } catch (err) {
        console.error('Exception in getUsernameById:', err);
        return null;
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

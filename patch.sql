
-- Add missing columns for Vinted/Grailed automation status
alter table public.advertisements 
add column if not exists is_published_to_vinted boolean default false;

alter table public.advertisements 
add column if not exists is_published_to_grailed boolean default false;

-- Add Vinted_URL if missing (might be called 'vinted_url' or 'Vinted_URL' based on other contexts, but user schema didn't show it)
alter table public.advertisements 
add column if not exists "Vinted_URL" text;

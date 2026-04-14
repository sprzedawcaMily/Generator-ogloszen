-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  username text unique,
  avatar_url text,
  is_premium boolean default false,
  created_at timestamptz default now()
);

-- RLS for users
alter table public.users enable row level security;
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- 2. COLORS (Optional, keeping for future use)
create table public.colors (
  id bigint primary key generated always as identity,
  name text not null,
  hex text,
  created_at timestamptz default now()
);

-- 3. SUBSCRIPTION PLANS
create table public.subscription_plans (
  id bigint primary key generated always as identity,
  name text not null,
  price_cents integer not null,
  currency text default 'PLN',
  max_ads integer,
  max_photos_per_ad integer,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 4. ADVERTISEMENTS
-- Combining "New Base" structure with "Old Requirements" for automation
create table public.advertisements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  
  -- Core fields from new design
  title text,
  description text,
  price_cents integer,
  currency text default 'PLN',
  status text default 'active', -- active, sold, archived
  
  -- Legacy fields required for VintedAutomation (keeping text types for compatibility)
  marka text,
  rodzaj text,
  rozmiar text,
  stan text,
  wada text,
  
  -- Dimensions
  dlugosc text,
  szerokosc text,
  pas text,
  udo text,
  dlugosc_nogawki text,
  
  -- Other props
  color text, -- keeping text for now to avoid breaking automation mapping
  color_id bigint references public.colors(id), -- optional relation for future
  price text, -- legacy string price used in some places
  
  -- Flags
  is_completed boolean default false,
  is_published_to_vinted boolean default false,
  is_published_to_grailed boolean default false,
  is_local boolean default false,
  "Vinted_URL" text,
  
  -- Legacy Photo Arrays (for backward compatibility with insert scripts)
  photos text[], 
  photo_uris text[],

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger to sync legacy photos array to advertisements_photos table
create or replace function public.sync_legacy_photos()
returns trigger as $$
declare
  photo_url text;
  idx integer;
  legacy_photos text[];
begin
  -- Prefer photo_uris if present, else photos
  if NEW.photo_uris is not null then
    legacy_photos := NEW.photo_uris;
  else
    legacy_photos := NEW.photos;
  end if;

  -- If we have photos to sync
  if legacy_photos is not null then
    -- clear existing photos for this ad to avoid duplicates/stale data
    delete from public.advertisement_photos where ad_id = NEW.id;
    
    idx := 0;
    foreach photo_url in array legacy_photos
    loop
      insert into public.advertisement_photos (ad_id, url, position)
      values (NEW.id, photo_url, idx);
      idx := idx + 1;
    end loop;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger on_advertisement_photos_sync
  after insert or update of photos, photo_uris on public.advertisements
  for each row execute procedure public.sync_legacy_photos();

-- RLS for advertisements
alter table public.advertisements enable row level security;
create policy "Users can view own ads" on public.advertisements for select using (auth.uid() = user_id);
create policy "Users can insert own ads" on public.advertisements for insert with check (auth.uid() = user_id);
create policy "Users can update own ads" on public.advertisements for update using (auth.uid() = user_id);
create policy "Users can delete own ads" on public.advertisements for delete using (auth.uid() = user_id);

-- 5. ADVERTISEMENT PHOTOS
-- Replaces array column with proper relation
create table public.advertisement_photos (
  id bigint primary key generated always as identity,
  ad_id uuid references public.advertisements(id) on delete cascade,
  url text not null,
  position integer default 0,
  created_at timestamptz default now()
);

-- RLS for photos
alter table public.advertisement_photos enable row level security;
create policy "Users can view own ad photos" on public.advertisement_photos 
  for select using (exists (select 1 from public.advertisements a where a.id = advertisement_photos.ad_id and a.user_id = auth.uid()));
create policy "Users can insert own ad photos" on public.advertisement_photos 
  for insert with check (exists (select 1 from public.advertisements a where a.id = advertisement_photos.ad_id and a.user_id = auth.uid())); 
create policy "Users can update own ad photos" on public.advertisement_photos 
  for update using (exists (select 1 from public.advertisements a where a.id = advertisement_photos.ad_id and a.user_id = auth.uid()));
create policy "Users can delete own ad photos" on public.advertisement_photos 
  for delete using (exists (select 1 from public.advertisements a where a.id = advertisement_photos.ad_id and a.user_id = auth.uid()));

-- 6. EMAIL LOGS
create table public.email_logs (
  id bigint primary key generated always as identity,
  user_id uuid references public.users(id),
  type text not null,
  status text not null,
  payload jsonb,
  created_at timestamptz default now()
);

-- 7. PENDING REGISTRATIONS
create table public.pending_registrations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  verification_code text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  used boolean default false
);

-- 8. STYLE TEMPLATES (Needed for automation)
create table public.style_templates (
  id bigint primary key generated always as identity,
  user_id uuid references public.users(id),
  style_name text,
  description_text text,
  footer_text text,
  is_active boolean default true,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- 9. DESCRIPTION HEADERS (Needed for automation)
create table public.description_headers (
  id bigint primary key generated always as identity,
  user_id uuid references public.users(id),
  platform text,
  title text,
  is_active boolean default true,
  order_index integer default 0,
  created_at timestamptz default now()
);


-- Function to handle new user signup (auto-create profile)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, username, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

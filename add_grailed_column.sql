-- Dodaj kolumnę is_published_to_grailed do tabeli advertisements
-- Uruchom to w Supabase SQL Editor

ALTER TABLE advertisements 
ADD COLUMN is_published_to_grailed BOOLEAN DEFAULT FALSE;

-- Opcjonalnie: Zaktualizuj istniejące rekordy
UPDATE advertisements 
SET is_published_to_grailed = FALSE 
WHERE is_published_to_grailed IS NULL;

-- Sprawdź czy kolumna została dodana
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'advertisements' 
AND column_name = 'is_published_to_grailed';

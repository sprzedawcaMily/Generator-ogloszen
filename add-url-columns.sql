-- Kolumna Vinted_URL już istnieje w bazie danych
-- Nie musisz uruchamiać tego skryptu

-- Sprawdź czy kolumna istnieje:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'advertisements' 
AND column_name = 'Vinted_URL';

-- Przykład użycia:
-- SELECT id, marka, rodzaj, Vinted_URL, is_published_to_vinted 
-- FROM advertisements 
-- WHERE Vinted_URL IS NOT NULL
-- LIMIT 10;

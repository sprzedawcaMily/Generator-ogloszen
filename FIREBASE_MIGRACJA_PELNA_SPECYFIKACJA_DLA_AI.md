# FIREBASE MIGRACJA - PELNA SPECYFIKACJA DLA AI (SKLEP)

## 1) Cel
Przepnij caly backend danych ze starego Supabase na Firebase Firestore tak, aby:
- wszystkie funkcje dzialaly tak samo jak przed migracja,
- logowanie dzialalo po samym nicku (username),
- dane byly widoczne w UI (lista ogloszen, style, naglowki, reverse scrape),
- automatyzacje Vinted i Grailed mialy ten sam dostep do danych co wczesniej.

## 2) Kontekst aktualnej aplikacji
Aplikacja juz korzysta z Firestore i obecnie odczytuje/zapisuje dane w kolekcjach:
- users
- advertisements
- style_templates
- description_headers
- vinted_reverse_scraped_ads
- vinted_ad_links

Do migracji ze starego Supabase uznaj ponizsza strukture Firestore jako docelowa (source of truth).

## 3) Docelowa struktura Firestore (wymagana)

### 3.1 Kolekcja users
Document ID:
- preferowany: losowy ID dokumentu Firestore
- biznesowe id uzytkownika trzymane dodatkowo w polu id

Pola:
- id: string (UUID lub inny stabilny identyfikator biznesowy)
- username: string (unikalny nick, wymagany)
- display_name: string
- email: string | null
- is_active: boolean (default true)
- created_at: string ISO datetime
- updated_at: string ISO datetime

Zasady:
- logowanie po username,
- jesli username nie istnieje: auto-utworzenie usera,
- jesli user ma is_active=false: blokada logowania.

### 3.2 Kolekcja advertisements
Document ID:
- moze byc Firestore doc id
- aplikacja umie szukac po doc id lub po polu id

Wymagane pola zgodnosci:
- id: string (legacy business id, opcjonalnie rowne document id)
- user_id: string
- title: string
- opis: string
- description: string
- marka: string
- rodzaj: string
- typ: string
- rozmiar: string
- stan: string
- wada: string
- color: string
- dlugosc: string
- szerokosc: string
- pas: string
- udo: string
- dlugosc_nogawki: string
- price: string
- price_vinted: string
- price_grailed: string
- photo_uris: string[]
- photos: string[]
- is_completed: boolean
- is_published_to_vinted: boolean
- is_published_to_grailed: boolean
- is_local: boolean
- Vinted_URL: string
- created_at: string ISO datetime | Firestore Timestamp
- updated_at: string ISO datetime | Firestore Timestamp

Uwagi kompatybilnosci:
- photo_uris i photos musza byc utrzymywane rownolegle,
- filtry list i automatyzacji opieraja sie o:
  - is_completed,
  - is_published_to_vinted,
  - is_published_to_grailed,
  - user_id.

### 3.3 Kolekcja style_templates
Pola:
- user_id: string
- style_name: string
- description_text: string
- footer_text: string
- is_active: boolean
- order_index: number
- created_at: string ISO datetime | Firestore Timestamp

### 3.4 Kolekcja description_headers
Pola:
- user_id: string
- platform: string (np. vinted, grailed)
- title: string
- is_active: boolean
- order_index: number
- created_at: string ISO datetime | Firestore Timestamp

### 3.5 Kolekcja vinted_reverse_scraped_ads
Document ID (wymagany standard):
- {userId}_{vinted_item_id} po sanityzacji znakow

Pola:
- vinted_item_id: string
- listing_status: string (draft | active)
- source_profile_url: string | null
- edit_url: string
- listing_url: string
- title: string
- description: string
- category: string
- brand: string
- size: string
- condition: string
- color: string
- price: string
- image_urls: string[]
- image_details: Array<{ order:number, src:string, alt:string }>
- user_id: string | null
- scraped_at: string ISO datetime
- updated_at: string ISO datetime

### 3.6 Kolekcja vinted_ad_links
Document ID:
- taki sam klucz jak w vinted_reverse_scraped_ads: {userId}_{vinted_item_id}

Pola:
- vinted_item_id: string
- user_id: string | null
- listing_url: string
- edit_url: string
- listing_status: string (draft | active)
- last_seen_at: string ISO datetime

## 4) Mapowanie ze starego Supabase -> Firestore

### 4.1 Tabela public.users -> users
- users.id -> users.id
- users.username -> users.username
- users.email -> users.email
- users.created_at -> users.created_at
- is_active ustaw true, jesli brak pola
- display_name ustaw username, jesli brak

### 4.2 Tabela public.advertisements -> advertisements
Mapuj 1:1 pola legacy i statusowe:
- id, user_id, marka, rodzaj, rozmiar, stan, wada
- dlugosc, szerokosc, pas, udo, dlugosc_nogawki
- color, price
- is_completed, is_published_to_vinted, is_published_to_grailed, is_local
- Vinted_URL
- photos, photo_uris
- created_at, updated_at

Dodatkowo uzupelnij fallback:
- opis = description, jesli opis puste
- description = opis, jesli description puste
- photo_uris = photos, jesli photo_uris puste
- photos = photo_uris, jesli photos puste

### 4.3 Tabela public.style_templates -> style_templates
Mapuj:
- user_id, style_name, description_text, footer_text, is_active, order_index, created_at

### 4.4 Tabela public.description_headers -> description_headers
Mapuj:
- user_id, platform, title, is_active, order_index, created_at

### 4.5 Tabela/arraye zdjec
Jesli byly relacje typu advertisement_photos, zloz je do tablic:
- advertisements.photo_uris (preferowana)
- advertisements.photos (kopia kompatybilnosci)

## 5) Wymagane indeksy Firestore
Utworz composite indexes:

1) advertisements
- user_id ASC, is_completed ASC, created_at DESC

2) advertisements
- user_id ASC, is_published_to_vinted ASC, created_at DESC

3) advertisements
- user_id ASC, is_published_to_grailed ASC, is_completed ASC, created_at DESC

4) style_templates
- user_id ASC, is_active ASC, order_index ASC

5) description_headers
- user_id ASC, platform ASC, is_active ASC, order_index ASC

6) vinted_reverse_scraped_ads
- user_id ASC, scraped_at DESC

7) users
- username ASC (dla szybkiego loginu po nicku)

## 6) Reguly bezpieczenstwa Firestore (minimalny target)
Dla produkcji preferuj auth UID, ale przy obecnym modelu sesji backendowej:
- bezposredni klient nie powinien miec pelnego RW do wszystkiego,
- operacje zapis/odczyt wykonuje backend API,
- jesli klient ma bezposredni dostep, ogranicz do dokumentow user_id == request.auth.uid.

Model docelowy (zalecany):
- users: user czyta/edytuje tylko swoj dokument,
- advertisements/style_templates/description_headers/vinted_reverse_scraped_ads/vinted_ad_links:
  - read/write tylko gdy user_id == request.auth.uid.

## 7) API i widocznosc danych w UI (to musi dzialac)

### 7.1 Logowanie
POST /api/login
Body:
- username: string

Dzialanie:
- login po username,
- auto-create user gdy brak,
- ustawienie cookie user_id,
- zwrot user id + username.

### 7.2 Ogloszenia
GET /api/advertisements
- zwraca completed dla usera

GET /api/advertisements/all
- zwraca wszystkie ogloszenia usera

GET /api/advertisements/completed
GET /api/advertisements/incomplete

Widocznosc w UI:
- karta ogloszenia pokazuje minimum: marka, rodzaj, rozmiar, stan, zdjecia, cena,
- dziala filtrowanie completed/incomplete,
- dziala status Vinted/Grailed.

### 7.3 Reverse scraper dane
GET /api/vinted/reverse-scraped
- zwraca dane z vinted_reverse_scraped_ads przemapowane do formatu kart

POST /api/vinted/reverse-scrape
- uruchamia reverse scraping (draft potem active)

Widocznosc w UI:
- przelacznik zrodla danych: standard/reverse,
- karty reverse sa widoczne jak zwykle ogloszenia,
- przycisk otwarcia listing_url dziala.

### 7.4 Szablony i naglowki
GET /api/styles
GET /api/styles/{productType}
GET /api/description-headers?platform=vinted|grailed

Widocznosc w UI:
- style sa widoczne i stosowane przy generowaniu opisu,
- naglowki sa widoczne i filtrowane po platformie.

### 7.5 Statusy publikacji
POST /api/vinted/toggle-status
POST /api/grailed/toggle-status

Widocznosc w UI:
- po kliknieciu status zmienia sie od razu na karcie,
- dane po odswiezeniu pozostaja zgodne z Firestore.

## 8) Plan wykonania dla AI (krok po kroku)
1. Odczytaj stare tabele Supabase i przygotuj mapowanie 1:1 do kolekcji Firestore.
2. Wgraj users, potem advertisements, potem style_templates i description_headers.
3. Ujednolic pola legacy (opis/description, photos/photo_uris).
4. Ustaw indeksy Firestore z sekcji 5.
5. Sprawdz endpointy login i listy ogloszen.
6. Sprawdz reverse scrape + reverse list endpoint.
7. Potwierdz, ze UI pokazuje dane po zalogowaniu (completed, incomplete, reverse, style, headers).
8. Potwierdz, ze zmiana statusu Vinted/Grailed zapisuje sie i jest widoczna.

## 9) Kryteria akceptacji (Definition of Done)
- Brak odczytow z Supabase w runtime.
- Wszystkie endpointy danych dzialaja tylko na Firestore.
- Login po nicku dziala i tworzy usera automatycznie.
- Ogloszenia, style, naglowki i reverse dane sa widoczne w UI.
- Toggle statusow Vinted/Grailed zapisuje sie trwale.
- Reverse scraper zapisuje do:
  - vinted_reverse_scraped_ads
  - vinted_ad_links
- Dane sa odseparowane per user_id.

## 10) Gotowy prompt dla zewnetrznego AI
Skopiuj ponizszy tekst i daj drugiemu AI:

"""
Masz wykonac pelna migracje mojego sklepu/aplikacji ze starego Supabase na Firebase Firestore, na podstawie specyfikacji FIREBASE MIGRACJA - PELNA SPECYFIKACJA DLA AI (SKLEP).

Wymagania krytyczne:
1) Login tylko po username (nick), z auto-tworzeniem usera jesli brak.
2) Kolekcje Firestore: users, advertisements, style_templates, description_headers, vinted_reverse_scraped_ads, vinted_ad_links.
3) Zachowaj kompatybilnosc legacy fields (opis/description, photos/photo_uris, statusy publikacji).
4) Ustaw indeksy Firestore zgodnie ze specyfikacja.
5) Zaimplementuj endpointy i UI tak, aby dane byly realnie widoczne po migracji:
   - listy ogloszen,
   - reverse scraped list,
   - style i description headers,
   - statusy publikacji Vinted/Grailed.
6) Dostarcz checkliste testow koncowych i wynik kazdego testu (PASS/FAIL).

Najpierw wypisz plan prac, potem zrob implementacje i na koniec raport zmian + testy.
"""

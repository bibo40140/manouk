-- Mise à jour des informations de Bibizi pour les PDFs

-- Vérifier d'abord les données actuelles
SELECT name, code, siret, address, phone, email, logo_url
FROM companies
WHERE name IN ('Manouk', 'Bibizi');

-- Mettre à jour Bibizi avec toutes les informations
UPDATE companies
SET 
  address = '123 Avenue de Bibizi\n75001 Paris',  -- 🔧 REMPLACER PAR LA VRAIE ADRESSE
  phone = '01 23 45 67 89',  -- 🔧 REMPLACER PAR LE VRAI NUMÉRO
  email = 'contact@bibizi.fr',  -- 🔧 REMPLACER PAR LE VRAI EMAIL
  website = 'www.bibizi.fr',  -- 🔧 REMPLACER PAR LE VRAI SITE
  vat_number = 'FR12345678901',  -- 🔧 REMPLACER PAR LE VRAI N° TVA
  logo_url = 'https://placehold.co/400x200/1e3a8a/white?text=BIBIZI',  -- 🔧 REMPLACER PAR LE VRAI LOGO
  legal_notice = 'Micro-entreprise - TVA non applicable selon l''article 293B du CGI'  -- 🔧 ADAPTER SI BESOIN
WHERE name = 'Bibizi';

-- Vérification après mise à jour
SELECT name, code, siret, address, phone, email, logo_url, website, vat_number
FROM companies
WHERE name = 'Bibizi';

-- ✅ RÉSULTAT ATTENDU :
-- La société Bibizi doit avoir toutes les infos complètes comme Manouk
-- Le PDF sera généré avec ces informations

-- 📝 NOTES :
-- 1. Remplace les valeurs par les vraies infos Bibizi
-- 2. Pour le logo, tu peux :
--    - Uploader sur Supabase Storage et utiliser l'URL publique
--    - Utiliser une URL externe (imgur, etc.)
--    - Utiliser un placeholder temporaire comme dans cet exemple
-- 3. Le format du logo doit être PNG ou JPG

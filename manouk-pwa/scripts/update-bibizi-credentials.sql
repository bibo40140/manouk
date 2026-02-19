-- Script de modification de l'identifiant Bibizi
-- Change l'email et le mot de passe de l'utilisateur Bibizi

-- 1. Vérifier l'utilisateur actuel de Bibizi
SELECT id, email, created_at 
FROM auth.users 
WHERE email LIKE '%bibizi%' OR raw_user_meta_data->>'name' LIKE '%Bibizi%'
ORDER BY created_at DESC;

-- 2. Mettre à jour l'email et le mot de passe
-- ⚠️ REMPLACE 'USER_ID_ICI' par l'ID trouvé dans la requête ci-dessus
UPDATE auth.users 
SET 
    email = 'd.theillet@icloud.com',
    raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{email}',
        '"d.theillet@icloud.com"'
    ),
    encrypted_password = crypt('denisbibizi', gen_salt('bf')),
    email_confirmed_at = now(),
    updated_at = now()
WHERE id = 'd946d3c7-c9d2-4d21-af32-b236d24238b1';

-- 3. Vérification finale
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'name' as name,
    email_confirmed_at,
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'd.theillet@icloud.com';

-- ✅ RÉSULTAT ATTENDU :
-- L'email doit être : d.theillet@icloud.com
-- Le mot de passe doit être : denisbibizi
-- email_confirmed_at ne doit pas être NULL

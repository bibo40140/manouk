# 🧪 GUIDE DE TEST : Split automatique des factures multi-sociétés

## 📋 Prérequis

### 1. Associer le compte admin aux sociétés

**Pourquoi ?** Le compte admin (fabien.hicauber@gmail.com) doit être associé aux sociétés pour pouvoir créer des factures.

**Exécutez ce SQL dans Supabase** (SQL Editor) :

```sql
-- Associer fabien.hicauber@gmail.com aux sociétés Manouk et Bibizi
INSERT INTO user_companies (user_id, company_id)
SELECT 
  u.id as user_id,
  c.id as company_id
FROM auth.users u
CROSS JOIN companies c
WHERE u.email = 'fabien.hicauber@gmail.com'
  AND c.name IN ('Manouk', 'Bibizi')
ON CONFLICT DO NOTHING;
```

✅ Vous devriez voir : `2 rows inserted`

### 2. Vérifier que les sociétés existent

```sql
SELECT id, name, code FROM companies ORDER BY name;
```

Vous devriez voir :
- Bibizi (code: BIB)
- Manouk (code: MAN)

### 3. Vérifier qu'un produit existe

```sql
SELECT id, name, unit_price, company_id FROM products WHERE name ILIKE '%etui%' OR name ILIKE '%lunettes%';
```

Si aucun produit n'existe, créez-en un via l'interface (Paramètres → Produits).

---

## 🎯 ÉTAPE 1 : Configurer les splits d'un produit

### Via l'interface (RECOMMANDÉ)

1. Allez sur **https://manouk.vercel.app/dashboard/settings**
2. Cliquez sur l'onglet **"Produits"**
3. Trouvez le produit "Étui à lunettes" (ou créez-le si absent)
4. Dans la colonne **"Répartition par société"**, configurez :
   - **Manouk** : `3.00`
   - **Bibizi** : `1.00`
5. Cliquez sur **"Enregistrer les modifications"**

### Via SQL (ALTERNATIVE)

Si vous préférez le SQL, exécutez :

```sql
-- 1. Récupérer les IDs (remplacer par vos vraies valeurs)
SELECT 
  (SELECT id FROM products WHERE name = 'Étui à lunettes') as product_id,
  (SELECT id FROM companies WHERE name = 'Manouk') as manouk_id,
  (SELECT id FROM companies WHERE name = 'Bibizi') as bibizi_id;

-- 2. Insérer les splits (REMPLACER les UUIDs par ceux ci-dessus)
INSERT INTO product_company_splits (product_id, company_id, amount)
VALUES
  ('PRODUCT_UUID_ICI', 'MANOUK_UUID_ICI', 3.00),
  ('PRODUCT_UUID_ICI', 'BIBIZI_UUID_ICI', 1.00)
ON CONFLICT (product_id, company_id) 
DO UPDATE SET amount = EXCLUDED.amount;
```

### Vérifier que les splits sont bien enregistrés

```sql
SELECT 
  p.name as produit,
  c.name as societe,
  s.amount as montant
FROM product_company_splits s
JOIN products p ON s.product_id = p.id
JOIN companies c ON s.company_id = c.id
ORDER BY p.name, c.name;
```

✅ Vous devriez voir :
```
produit              | societe | montant
---------------------|---------|--------
Étui à lunettes      | Bibizi  | 1.00
Étui à lunettes      | Manouk  | 3.00
```

---

## 🧪 ÉTAPE 2 : Créer une facture de test

### 1. Aller sur la page des factures

- URL : **https://manouk.vercel.app/dashboard/invoices**
- Cliquez sur **"Nouvelle facture"** (bouton bleu en haut à droite)

### 2. Remplir le formulaire

1. **Client** : Sélectionnez un client existant (ou créez-en un)
2. **Date** : Aujourd'hui (par défaut)
3. **Ajouter une ligne** :
   - Produit : **Étui à lunettes**
   - Quantité : `2`

### 3. Vérifier les splits affichés

⚠️ **IMPORTANT** : Vous devriez voir sous la ligne du produit :
```
Répartition : Manouk 3.00€ | Bibizi 1.00€
```

Si vous ne voyez **rien**, c'est que les splits ne sont **pas configurés** dans la base. Retournez à l'étape 1.

### 4. Enregistrer et envoyer

- Cochez **"Envoyer par email"**
- Corps du mail : personnalisez si besoin
- Cliquez sur **"Créer la facture"**

---

## ✅ ÉTAPE 3 : Vérifier que 2 factures ont été créées

### Via l'interface

Rechargez la page des factures. Vous devriez voir **2 nouvelles factures** :

| N° Facture | Client | Société | Total |
|-----------|--------|---------|-------|
| F2026-001 | Client Test | Manouk | 6,00€ |
| F2026-001 | Client Test | Bibizi | 2,00€ |

(2 étuis × Manouk 3€ = 6€, 2 étuis × Bibizi 1€ = 2€)

### Via SQL

```sql
SELECT 
  i.invoice_number,
  c.name as societe,
  cu.name as client,
  i.total,
  i.email_sent,
  i.email_sent_date
FROM invoices i
JOIN companies c ON i.company_id = c.id
JOIN customers cu ON i.customer_id = cu.id
ORDER BY i.date DESC, c.name
LIMIT 5;
```

✅ Vous devriez voir les 2 factures avec `email_sent = true`.

---

## 📧 ÉTAPE 4 : Vérifier l'envoi email

### Ce qui devrait se passer :

1. **UN SEUL email** envoyé au client
2. Contenant **2 PDF en pièces jointes** :
   - `Facture_F2026-001_Manouk.pdf` (6€)
   - `Facture_F2026-001_Bibizi.pdf` (2€)

### Comment vérifier :

1. Consultez la boîte mail du client
2. OU vérifiez les logs de l'API :
   - Vercel Dashboard → Logs
   - Recherchez `/api/send-invoice`

### En cas d'erreur email :

⚠️ Si l'email n'est pas envoyé, c'est probablement un problème de configuration SMTP.

**Testez la config SMTP** :
```
GET https://manouk.vercel.app/api/test-smtp
```

Si ça échoue, allez dans **Paramètres → SMTP** et vérifiez les identifiants.

---

## 🐛 Dépannage

### Problème : "Aucune société associée à votre compte"

**Solution** : Exécutez le SQL de l'étape 1 (associer le compte admin).

### Problème : Les splits ne s'affichent pas dans le formulaire

**Causes possibles** :
1. Les splits ne sont pas configurés → Étape 1
2. Le produit n'a pas de splits → Vérifiez via SQL
3. Erreur JavaScript dans la console → Ouvrez DevTools (F12)

**Vérification rapide** :
```sql
SELECT COUNT(*) FROM product_company_splits;
```
Si `0`, c'est normal, vous devez configurer les splits via Paramètres → Produits.

### Problème : Une seule facture créée au lieu de 2

**Causes possibles** :
1. Le produit n'a qu'un seul split (une seule société)
2. Un des splits a un montant = 0
3. Bug dans la logique de création

**Vérification** :
```sql
-- Voir les splits du dernier produit facturé
SELECT 
  p.name,
  c.name as societe,
  s.amount
FROM product_company_splits s
JOIN products p ON s.product_id = p.id
JOIN companies c ON s.company_id = c.id
WHERE p.id = (
  SELECT product_id FROM invoice_lines ORDER BY id DESC LIMIT 1
);
```

### Problème : Email non envoyé

**Solutions** :
1. Vérifiez la config SMTP dans Paramètres
2. Consultez les logs Vercel
3. Testez manuellement : `/api/test-smtp`

---

## 📊 Requêtes SQL utiles

### Voir toutes les factures par société

```sql
SELECT 
  c.name as societe,
  COUNT(*) as nb_factures,
  SUM(i.total) as total_ca
FROM invoices i
JOIN companies c ON i.company_id = c.id
GROUP BY c.name
ORDER BY c.name;
```

### Voir les splits de tous les produits

```sql
SELECT 
  p.name as produit,
  p.unit_price as prix_unitaire,
  c.name as societe,
  s.amount as montant_split,
  ROUND((s.amount / NULLIF(p.unit_price, 0) * 100), 2) as pourcentage
FROM product_company_splits s
JOIN products p ON s.product_id = p.id
JOIN companies c ON s.company_id = c.id
ORDER BY p.name, c.name;
```

### Supprimer toutes les factures de test

```sql
-- ⚠️ ATTENTION : Ceci supprime TOUTES les factures !
DELETE FROM invoice_lines;
DELETE FROM payments;
DELETE FROM invoices;
```

---

## ✅ Checklist finale

Avant de déclarer le test réussi :

- [ ] Le compte admin est associé aux 2 sociétés
- [ ] Au moins 1 produit a des splits configurés
- [ ] La création d'une facture affiche bien les splits dans le formulaire
- [ ] 2 factures sont créées dans la base de données
- [ ] 1 email est envoyé avec 2 PDF en pièces jointes
- [ ] Les 2 factures apparaissent dans la liste (une par société)

---

## 🎉 Cas de succès

Si tout fonctionne, vous devriez voir ceci dans la page factures :

```
📄 Factures

┌──────────┬──────────┬─────────┬────────┬───────┐
│ N°       │ Client   │ Société │ Total  │ Email │
├──────────┼──────────┼─────────┼────────┼───────┤
│ F2026-001│ Sophie   │ Manouk  │  6,00€ │ ✉️ ✓  │
│ F2026-001│ Sophie   │ Bibizi  │  2,00€ │ ✉️ ✓  │
└──────────┴──────────┴─────────┴────────┴───────┘
```

**Félicitations ! Le système de split fonctionne.** 🎊

---

## 📞 Besoin d'aide ?

Si ça ne fonctionne toujours pas après avoir suivi ce guide :

1. Ouvrez la console DevTools (F12) et regardez les erreurs JavaScript
2. Consultez les logs Vercel : https://vercel.com/lordbs/manouk/logs
3. Vérifiez les politiques RLS dans Supabase (peut bloquer l'insertion)

---

**Fichier créé le 7 février 2026**
**Pour l'application Manouk PWA - Version 1.0**

# 🎯 RÉCAPITULATIF : Split de factures multi-sociétés

## ✅ BONNE NOUVELLE : Le système fonctionne déjà !

Le code est **COMPLET** et **FONCTIONNEL**. Il suffit juste de configurer les données.

---

## 📊 Comment ça marche ?

### Avant (sans split)
```
Produit "Étui à lunettes" = 4€
↓
1 facture créée pour Manouk = 4€
```

### Après (avec split configuré)
```
Produit "Étui à lunettes" = 4€
Splits configurés :
  ├─ Manouk : 3€
  └─ Bibizi : 1€
↓
2 factures créées automatiquement :
  ├─ Facture Manouk = 3€
  └─ Facture Bibizi = 1€
↓
1 email envoyé avec 2 PDF
```

---

## 🚀 3 étapes pour activer le split

### ÉTAPE 1 : Associer le compte admin (1 minute)

**Dans Supabase SQL Editor**, copiez-collez :

```sql
INSERT INTO user_companies (user_id, company_id)
SELECT u.id, c.id
FROM auth.users u
CROSS JOIN companies c
WHERE u.email = 'fabien.hicauber@gmail.com'
  AND c.name IN ('Manouk', 'Bibizi')
ON CONFLICT DO NOTHING;
```

✅ Résultat : `2 rows inserted`

---

### ÉTAPE 2 : Configurer les splits (2 minutes)

**Option A : Via l'interface (RECOMMANDÉ)**

1. Aller sur https://manouk.vercel.app/dashboard/settings
2. Onglet **"Produits"**
3. Trouver "Étui à lunettes"
4. Dans "Répartition par société" :
   - Manouk : `3.00`
   - Bibizi : `1.00`
5. **Enregistrer**

**Option B : Via SQL**

```sql
-- Remplacer 'Étui à lunettes' par votre produit
INSERT INTO product_company_splits (product_id, company_id, amount)
SELECT 
  p.id, c.id,
  CASE 
    WHEN c.name = 'Manouk' THEN 3.00
    WHEN c.name = 'Bibizi' THEN 1.00
  END
FROM products p
CROSS JOIN companies c
WHERE p.name = 'Étui à lunettes'
  AND c.name IN ('Manouk', 'Bibizi')
ON CONFLICT (product_id, company_id) 
DO UPDATE SET amount = EXCLUDED.amount;
```

---

### ÉTAPE 3 : Tester (1 minute)

1. Aller sur https://manouk.vercel.app/dashboard/invoices
2. Cliquer **"Nouvelle facture"**
3. Sélectionner un client
4. Ajouter "Étui à lunettes", quantité 2
5. ✅ Vérifier que les splits s'affichent sous la ligne :
   ```
   Répartition : Manouk 3.00€ | Bibizi 1.00€
   ```
6. Cocher "Envoyer par email"
7. **Créer la facture**

**Résultat attendu** :
- ✅ 2 factures apparaissent dans la liste (une Manouk, une Bibizi)
- ✅ 1 email envoyé avec 2 PDF

---

## 🔍 Vérifier que ça a marché

**Dans Supabase** :

```sql
SELECT 
  i.invoice_number,
  c.name as societe,
  i.total,
  i.email_sent
FROM invoices i
JOIN companies c ON i.company_id = c.id
ORDER BY i.date DESC
LIMIT 5;
```

**Résultat attendu** :
```
invoice_number | societe | total | email_sent
---------------|---------|-------|------------
F2026-001      | Bibizi  | 2.00  | true
F2026-001      | Manouk  | 6.00  | true
```

(2 étuis × Manouk 3€ = 6€, 2 étuis × Bibizi 1€ = 2€)

---

## 🐛 Si ça ne marche pas

### Problème : "Aucune société associée à votre compte"
→ Exécutez l'ÉTAPE 1

### Problème : Les splits ne s'affichent pas dans le formulaire
→ Exécutez l'ÉTAPE 2

### Problème : Une seule facture créée
→ Vérifiez que les splits sont bien dans la BDD :
```sql
SELECT p.name, c.name, s.amount
FROM product_company_splits s
JOIN products p ON s.product_id = p.id
JOIN companies c ON s.company_id = c.id;
```

---

## 📚 Documentation complète

- **Guide détaillé** : `GUIDE_TEST_SPLIT_FACTURES.md`
- **Script SQL** : `scripts/setup-split-test.sql`
- **Rapport de session** : `SESSION_07_FEV_2026.md`

---

## 🎯 Checklist

- [ ] Compte admin associé aux sociétés
- [ ] Au moins 1 produit avec splits configurés
- [ ] Test de création de facture réussi
- [ ] 2 factures visibles dans la liste
- [ ] Email reçu avec 2 PDF

---

**Temps estimé : 5 minutes** ⏱️
**Difficulté : Facile** ⭐

🎉 Une fois configuré, le split est **automatique** pour toutes les factures futures !

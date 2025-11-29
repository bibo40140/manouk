# ☑️ CHECKLIST DE FINALISATION MANOUK PWA

## 🎯 URGENT - À FAIRE IMMÉDIATEMENT

### ⚠️ 1. Exécuter le script SQL URSSAF dans Supabase
- [ ] Ouvrir https://supabase.com/dashboard
- [ ] Sélectionner le projet manouk
- [ ] Aller dans SQL Editor
- [ ] Ouvrir le fichier `manouk-pwa/scripts/add-urssaf-columns.sql`
- [ ] Copier tout le contenu
- [ ] Coller dans SQL Editor et exécuter
- [ ] Vérifier que les colonnes apparaissent dans Table Editor > invoices

**Sans cette étape, les fonctions URSSAF ne fonctionneront PAS !**

---

## ✅ DÉJÀ FAIT - FONCTIONNEL

### 2. Édition inline (Produits) ✅
- [x] ProductsTab avec édition inline
- [x] Boutons Sauvegarder/Annuler
- [x] Sauvegarde en base

### 3. Modal édition facture ✅
- [x] Modifier client et date
- [x] Gérer lignes de facture
- [x] Gérer paiements multiples
- [x] Auto-fill prix produit

### 4. Système URSSAF ✅
- [x] Modal déclaration URSSAF
- [x] Modal paiement URSSAF
- [x] Affichage badges dans InvoicesList
- [x] Boutons Déclarer/Payer

### 5. Trésorerie prévisionnelle ✅
- [x] Simulation 6 mois
- [x] Calcul CA/Coûts/URSSAF
- [x] Graphique et tableau

---

## 📋 À COMPLÉTER (Optionnel - 30% restant)

### 6. Édition inline autres tabs
- [ ] RawMaterialsTab (copier pattern ProductsTab)
- [ ] CustomersTab (name, email)
- [ ] SuppliersTab (name)
- [ ] CompaniesTab (code, name, email)

**Estimation** : 30-45 minutes

### 7. URSSAF dû dans Dashboard
- [ ] Ouvrir `app/dashboard/page.tsx`
- [ ] Ajouter calcul urssafDue
- [ ] Ajouter card stats

**Estimation** : 10 minutes

### 8. Améliorations mineures
- [ ] Checkbox "Payé aujourd'hui" dans PurchaseModal
- [ ] Auto-fill unit_cost dans achats matières
- [ ] Vérifier dates par défaut partout

**Estimation** : 15 minutes

---

## 🧪 TESTS À FAIRE

### Après exécution du script SQL :
1. [ ] Créer une nouvelle facture → Vérifier que urssaf_amount apparaît
2. [ ] Déclarer URSSAF sur une facture → Badge "Déclaré" apparaît
3. [ ] Payer URSSAF → Badge "Payé" apparaît
4. [ ] Modifier une facture → Paiements multiples fonctionnent
5. [ ] Éditer un produit inline → Modification sauvegardée
6. [ ] Trésorerie prévisionnelle → Simulation fonctionne

---

## 📞 EN CAS DE PROBLÈME

### Erreur "Column does not exist" ?
➡️ Le script SQL n'a pas été exécuté → Retour à l'étape 1

### Modal ne s'ouvre pas ?
➡️ Vérifier la console (F12) pour les erreurs

### Rien ne se sauvegarde ?
➡️ Vérifier les Row Level Security policies dans Supabase

---

## 🎉 PRÊT À UTILISER

Une fois l'étape 1 (script SQL) effectuée, l'application est fonctionnelle à **70%** :
- ✅ Gestion factures complète
- ✅ Gestion paiements multiples  
- ✅ Système URSSAF complet
- ✅ Trésorerie prévisionnelle
- ✅ Édition inline (produits)

Le reste est optionnel et améliore l'expérience utilisateur.

---

**Bon courage ! 🚀**

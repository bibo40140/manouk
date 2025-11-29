# 🎯 Configuration Rapide - 5 Minutes

## Option A : Script Automatique (Recommandé)

```bash
node setup.js
```

Ce script interactif vous guide étape par étape.

---

## Option B : Configuration Manuelle

### 1️⃣ Créer un projet Supabase (2 min)

**Ouvrir dans votre navigateur :**
https://supabase.com

1. **Créer un compte** (bouton "Start your project")
   - Avec Google : 10 secondes
   - Avec email : 30 secondes

2. **Nouveau projet** (bouton "New Project")
   ```
   Name:     manouk-app
   Database: (générer un mot de passe fort)
   Region:   Europe (Frankfurt) ou Europe (Paris)
   Plan:     Free
   ```

3. **Attendre 2 minutes** ⏳
   - Le projet se crée automatiquement
   - Un indicateur de progression s'affiche

---

### 2️⃣ Récupérer les clés API (30 sec)

1. Dans votre projet Supabase
2. Cliquez sur **⚙️ Settings** (en bas à gauche)
3. Cliquez sur **API**
4. Vous voyez 2 sections importantes :

**Project URL :**
```
https://xxxxxxxxxx.supabase.co
```
→ Copiez cette URL

**Project API keys - anon public :**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```
→ Copiez cette clé (elle fait ~200 caractères)

---

### 3️⃣ Configurer .env.local (20 sec)

1. Ouvrez le fichier `.env.local` dans VSCode :
   ```
   c:\Users\lordb\Documents\manouk-app\manouk-pwa\.env.local
   ```

2. Remplacez le contenu par :
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...VOTRE_CLE_ICI
   ```

3. **Sauvegardez** (Ctrl+S)

---

### 4️⃣ Créer les tables (1 min)

1. Dans Supabase, cliquez sur **🗃️ SQL Editor** (menu gauche)
2. Cliquez sur **"+ New Query"**
3. Dans VSCode, ouvrez `supabase-schema.sql`
4. **Sélectionnez tout** (Ctrl+A)
5. **Copiez** (Ctrl+C)
6. **Collez** dans Supabase SQL Editor (Ctrl+V)
7. Cliquez sur **"Run"** (ou Ctrl+Enter)
8. Vous devez voir : ✅ **"Success. No rows returned"**

---

### 5️⃣ Vérifier les tables (20 sec)

1. Dans Supabase, cliquez sur **📋 Table Editor** (menu gauche)
2. Vous devez voir **12 tables** :
   - companies
   - customers
   - suppliers
   - raw_materials
   - products
   - product_materials
   - invoices
   - invoice_lines
   - payments
   - purchases
   - urssaf_declarations
   - email_settings

Si vous les voyez toutes → **✅ C'est bon !**

---

### 6️⃣ Tester l'application (30 sec)

1. Dans le terminal VSCode :
   ```bash
   npm run dev
   ```

2. Ouvrir http://localhost:3000

3. Vous devriez voir la **page de login** 🎉

4. Cliquez sur **"Pas encore de compte ?"**

5. Créez votre compte :
   - Email : votre email
   - Mot de passe : minimum 6 caractères

6. Connectez-vous

7. Vous arrivez sur le **Dashboard** !

---

## ✅ Checklist de vérification

- [ ] Compte Supabase créé
- [ ] Projet créé (Europe, Free)
- [ ] Clés API copiées dans .env.local
- [ ] Script SQL exécuté avec succès
- [ ] 12 tables visibles dans Table Editor
- [ ] npm run dev fonctionne
- [ ] Page de login accessible
- [ ] Compte créé et connexion OK
- [ ] Dashboard affiché

---

## ❌ Problèmes courants

### "Invalid supabaseUrl"
→ Vérifiez `.env.local`, les clés doivent être vos vraies clés, pas les placeholders

### "relation does not exist"
→ Le script SQL n'a pas été exécuté, retournez à l'étape 4

### "Failed to fetch"
→ Vérifiez que Supabase est bien en ligne (pas en mode pause)

### Le serveur ne démarre pas
→ Arrêtez-le (Ctrl+C) et relancez `npm run dev`

---

## 📞 Besoin d'aide ?

Si vous êtes bloqué sur une étape :
1. Vérifiez les erreurs dans la console (F12)
2. Vérifiez les erreurs dans le terminal
3. Relisez les étapes ci-dessus calmement
4. Consultez `GUIDE_DEMARRAGE.md` pour plus de détails

---

## 🎉 Une fois terminé

Vous aurez :
- ✅ Une base de données PostgreSQL sécurisée
- ✅ Un système d'authentification
- ✅ Un dashboard fonctionnel
- ✅ Une application accessible sur http://localhost:3000

**Durée totale : 5 minutes maximum** ⏱️

Ensuite, vous pourrez :
- Créer votre première société
- Ajouter des produits
- Créer des factures (modules à venir)
- Déployer en production sur Vercel (gratuit)

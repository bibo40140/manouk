# 🚀 Guide de Démarrage Rapide - Manouk PWA

## Étape 1 : Configuration Supabase (5 minutes)

### 1.1 Créer un compte et un projet

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un compte gratuit (avec Google ou email)
3. Cliquez sur **"New Project"**
4. Remplissez :
   - **Name** : `manouk-app`
   - **Database Password** : (généré automatiquement ou créez le vôtre)
   - **Region** : Europe (Frankfurt ou Paris)
   - **Pricing Plan** : Free (500MB suffisant pour commencer)
5. Cliquez sur **"Create new project"** et attendez 2 minutes

### 1.2 Récupérer les clés API

1. Dans votre projet Supabase, allez dans **Settings** (icône ⚙️ en bas à gauche)
2. Allez dans **API**
3. Copiez ces 2 valeurs :
   - **Project URL** (ex: `https://abcdefgh.supabase.co`)
   - **anon public** (clé publique, commence par `eyJ...`)

### 1.3 Configurer votre .env.local

Ouvrez le fichier `.env.local` dans VSCode et remplacez :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Par vos vraies valeurs.

### 1.4 Créer le schéma de base de données

1. Dans Supabase, allez dans **SQL Editor** (icône 🗃️ à gauche)
2. Cliquez sur **"New Query"**
3. Ouvrez le fichier `supabase-schema.sql` dans VSCode
4. **Copiez TOUT le contenu** (Ctrl+A puis Ctrl+C)
5. **Collez** dans l'éditeur SQL de Supabase
6. Cliquez sur **"Run"** (ou Ctrl+Enter)
7. Vous devriez voir : ✅ **"Success. No rows returned"**

### 1.5 Vérifier que tout est OK

1. Allez dans **Table Editor** (icône 📋 à gauche)
2. Vous devriez voir 12 tables :
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

✅ **C'est bon, Supabase est configuré !**

---

## Étape 2 : Lancer l'application (1 minute)

### 2.1 Installer les dépendances (si pas déjà fait)

```bash
npm install
```

### 2.2 Lancer le serveur de développement

```bash
npm run dev
```

Vous devriez voir :

```
▲ Next.js 16.0.x
- Local:        http://localhost:3000
- ready in 2.3s
```

### 2.3 Ouvrir dans le navigateur

1. Ouvrez [http://localhost:3000](http://localhost:3000)
2. Vous serez automatiquement redirigé vers `/login`

---

## Étape 3 : Créer votre premier compte (30 secondes)

### 3.1 Inscription

1. Sur la page de login, cliquez sur **"Pas encore de compte ? Inscrivez-vous"**
2. Entrez :
   - **Email** : votre email
   - **Mot de passe** : minimum 6 caractères
3. Cliquez sur **"Créer mon compte"**
4. Message vert : "Compte créé ! Vérifiez votre email pour confirmer."

### 3.2 Confirmer votre email

1. Allez dans votre boîte mail
2. Ouvrez l'email de Supabase : **"Confirm your signup"**
3. Cliquez sur **"Confirm your mail"**

> **Note** : En développement local, vous pouvez aussi vous connecter directement sans confirmation.

### 3.3 Se connecter

1. Retournez sur [http://localhost:3000/login](http://localhost:3000/login)
2. Entrez votre email et mot de passe
3. Cliquez sur **"Se connecter"**
4. Vous êtes redirigé vers le **Dashboard** 🎉

---

## Étape 4 : Créer votre première société (1 minute)

### 4.1 Aller dans les paramètres

1. Dans la sidebar gauche, cliquez sur **"⚙️ Paramètres"**
2. Cliquez sur l'onglet **"Sociétés"**

### 4.2 Ajouter une société

1. Remplissez :
   - **Code** : `manouk` (identifiant unique, minuscules)
   - **Nom** : `Manouk Création` (nom complet)
   - **Email** : `contact@manouk.com` (pour recevoir copies de factures)
2. Cliquez sur **"Ajouter la société"**
3. Votre société apparaît dans le tableau ✅

### 4.3 Ajouter des produits

1. Cliquez sur l'onglet **"Produits"**
2. Remplissez :
   - **Nom** : `Étui à lunettes`
   - **Prix de vente** : `25.00`
   - **Stock initial** : `10`
3. Cliquez sur **"Ajouter le produit"**

### 4.4 Ajouter des clients

1. Cliquez sur l'onglet **"Clients"**
2. Remplissez :
   - **Nom** : `Marie Dupont`
   - **Email** : `marie@exemple.com`
3. Cliquez sur **"Ajouter le client"**

---

## Étape 5 : Tester le Dashboard (2 minutes)

### 5.1 Retour au tableau de bord

1. Dans la sidebar, cliquez sur **"📊 Tableau de bord"**
2. Vous voyez 6 cartes de statistiques (toutes à 0 € pour l'instant)

### 5.2 Filtrer par société

1. En haut à droite, sélectionnez votre société dans le filtre
2. Les stats se mettent à jour automatiquement

---

## 🎉 Félicitations !

Votre application Manouk PWA est opérationnelle !

### Prochaines étapes

1. **Créer une facture** (module à venir)
2. **Enregistrer des achats** (module à venir)
3. **Simuler la trésorerie** (module à venir)
4. **Déployer sur Vercel** pour l'utiliser depuis n'importe où

---

## ⚠️ Problèmes courants

### Erreur "Invalid API key"

- Vérifiez que vous avez bien copié la clé `anon public` (pas la `service_role`)
- Vérifiez qu'il n'y a pas d'espaces avant/après dans `.env.local`
- Relancez `npm run dev` après avoir modifié `.env.local`

### Erreur "relation does not exist"

- Vous n'avez pas exécuté le script SQL `supabase-schema.sql`
- Retournez dans Supabase SQL Editor et exécutez-le

### Redirection infinie vers /login

- Supabase n'est pas correctement configuré
- Vérifiez vos clés API dans `.env.local`
- Effacez les cookies du navigateur (Ctrl+Shift+Del)

### Les tables n'apparaissent pas dans Supabase

- Rafraîchissez la page Table Editor (F5)
- Vérifiez que le script SQL a bien été exécuté entièrement (pas d'erreur rouge)

---

## 📞 Besoin d'aide ?

Si vous êtes bloqué :

1. Vérifiez les erreurs dans la console du navigateur (F12)
2. Vérifiez les erreurs dans le terminal Next.js
3. Relisez les étapes ci-dessus
4. Consultez la documentation Supabase : [https://supabase.com/docs](https://supabase.com/docs)

---

## 🔥 Mode Production

Une fois que tout fonctionne en local :

1. Créez un repo GitHub
2. Pushez votre code
3. Allez sur [vercel.com](https://vercel.com)
4. Importez votre repo
5. Ajoutez les mêmes variables d'environnement
6. Déployez !

Votre app sera accessible sur `https://votre-app.vercel.app` 🚀

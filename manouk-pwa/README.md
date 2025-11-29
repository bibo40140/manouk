# 💰 Manouk PWA - Application de Gestion pour Auto-Entrepreneurs

Application web progressive (PWA) pour la gestion de factures, trésorerie, achats et URSSAF.

## 🚀 Technologies

- **Next.js 14** (App Router, React 19, TypeScript)
- **Supabase** (PostgreSQL + Auth + Row Level Security)
- **Tailwind CSS** (Design moderne et responsive)
- **Chart.js** (Graphiques et visualisations)
- **PWA** (Installation mobile/desktop, mode offline)

## 📦 Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un nouveau projet (gratuit jusqu'à 500MB)
3. Récupérez les clés API dans **Settings > API**

### 3. Configurer les variables d'environnement

Modifiez le fichier `.env.local` :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_publique
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role
```

### 4. Créer le schéma de base de données

1. Allez dans **SQL Editor** de votre projet Supabase
2. Copiez le contenu du fichier `supabase-schema.sql`
3. Exécutez le script SQL
4. Vérifiez que les 12 tables sont créées avec RLS activé

### 5. Lancer l'application

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

## 🎯 Fonctionnalités

### ✅ Implémenté

- 🔐 **Authentification** (Signup/Login avec Supabase Auth)
- 🏢 **Multi-tenant** (plusieurs sociétés par utilisateur)
- 📊 **Dashboard** avec statistiques en temps réel
- 🔒 **Row Level Security** (isolation complète des données)

### 🚧 À migrer depuis Electron

- 📄 Factures (création, paiements, envoi email)
- 🧾 Achats (matières premières, fournisseurs)
- 💰 Trésorerie prévisionnelle (simulation 6 mois avec BOM)
- ⚙️ Paramètres (produits, matières, clients, fournisseurs)
- 📈 URSSAF (déclarations, paiements)

## 🚀 Déploiement sur Vercel

1. Push votre code sur GitHub
2. Connectez votre repo sur [vercel.com](https://vercel.com)
3. Ajoutez les variables d'environnement
4. Déployez en 1 clic !

## 📱 Installation PWA

### Android / iOS

1. Ouvrez l'app dans Chrome/Safari
2. Menu > "Ajouter à l'écran d'accueil"

### Windows / Mac / Linux

1. Ouvrez dans Chrome/Edge
2. Icône d'installation dans la barre d'adresse

## 📊 Schéma de base de données

12 tables avec Row Level Security :

- `companies` (sociétés multi-tenant)
- `customers`, `suppliers`, `raw_materials`, `products`
- `product_materials` (BOM)
- `invoices`, `invoice_lines`, `payments`
- `purchases`, `urssaf_declarations`, `email_settings`

Voir `supabase-schema.sql` pour le détail complet.

## 💡 Coûts

- **Supabase Free** : 500MB DB + 2GB storage
- **Vercel Free** : Déploiements illimités
- **Total : 0€/mois** 🎉

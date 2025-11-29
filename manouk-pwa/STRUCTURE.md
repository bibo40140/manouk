# 📁 Structure du Projet Manouk PWA

## Vue d'ensemble

```
manouk-pwa/
├── app/                          # Application Next.js (App Router)
│   ├── dashboard/               # Pages protégées (nécessitent connexion)
│   │   ├── layout.tsx          # Layout avec Sidebar + Header
│   │   ├── page.tsx            # Dashboard principal ✅
│   │   ├── invoices/           # Module Factures (à créer)
│   │   ├── purchases/          # Module Achats (à créer)
│   │   ├── forecast/           # Trésorerie prévisionnelle (à créer)
│   │   └── settings/           # Paramètres (à créer)
│   ├── login/
│   │   └── page.tsx            # Page de connexion/inscription ✅
│   ├── layout.tsx              # Layout racine
│   ├── globals.css             # Styles globaux Tailwind
│   └── page.tsx                # Page d'accueil (redirige vers /login ou /dashboard)
│
├── components/                  # Composants React réutilisables
│   ├── dashboard/              # Composants spécifiques au dashboard
│   │   ├── StatsCards.tsx     # 6 cartes de stats (CA, créances, etc.) ✅
│   │   ├── CompanyFilter.tsx  # Filtre par société ✅
│   │   ├── RevenueChart.tsx   # Graphique CA (Chart.js) ✅
│   │   ├── RecentInvoices.tsx # Tableau factures récentes ✅
│   │   └── RecentPurchases.tsx# Tableau achats récents ✅
│   ├── Sidebar.tsx             # Navigation principale ✅
│   └── Header.tsx              # En-tête avec déconnexion ✅
│
├── lib/                         # Utilitaires et configurations
│   └── supabase/               # Clients Supabase
│       ├── client.ts           # Client-side (browser) ✅
│       ├── server.ts           # Server-side (SSR) ✅
│       └── middleware.ts       # Protection des routes ✅
│
├── public/                      # Fichiers statiques
│   ├── manifest.json           # Configuration PWA ✅
│   ├── icon-192.png            # Icône PWA 192x192 (à créer)
│   └── icon-512.png            # Icône PWA 512x512 (à créer)
│
├── middleware.ts                # Middleware Next.js global (auth) ✅
├── next.config.ts              # Configuration Next.js ✅
├── tailwind.config.ts          # Configuration Tailwind CSS
├── tsconfig.json               # Configuration TypeScript
├── package.json                # Dépendances npm
├── .env.local                  # Variables d'environnement (NE PAS COMMIT) ✅
├── .env.example                # Exemple de .env.local ✅
├── supabase-schema.sql         # Schéma de base de données ✅
├── GUIDE_DEMARRAGE.md          # Guide de démarrage rapide ✅
└── README.md                   # Documentation principale ✅
```

## Statut des modules

### ✅ Implémentés (Phase 1)

- **Authentification** (`app/login/page.tsx`)
  - Signup avec email/password
  - Login avec email/password
  - Protection automatique des routes
  - Gestion d'erreurs
  
- **Dashboard** (`app/dashboard/page.tsx`)
  - 6 cartes de statistiques en temps réel
  - Graphique d'évolution du CA (6 mois)
  - Tableau des factures récentes (10 dernières)
  - Tableau des achats récents (10 derniers)
  - Filtre par société (multi-tenant)
  
- **Layout & Navigation** (`components/Sidebar.tsx`, `components/Header.tsx`)
  - Sidebar avec 5 pages
  - Header avec email de l'utilisateur
  - Bouton de déconnexion
  - Design responsive

- **Base de données** (`supabase-schema.sql`)
  - 12 tables avec relations
  - Row Level Security (RLS) complet
  - Policies multi-tenant
  - Indexes pour performance

### 🚧 À implémenter (Phase 2)

#### 1. Module Factures (`app/dashboard/invoices/`)

**Pages à créer :**
- `page.tsx` : Liste des factures avec filtres
- `new/page.tsx` : Créer une nouvelle facture
- `[id]/page.tsx` : Détails d'une facture

**Composants à créer :**
- `InvoiceCard.tsx` : Carte de facture (réutilisable)
- `InvoiceForm.tsx` : Formulaire de création/édition
- `InvoiceLinesEditor.tsx` : Édition des lignes de facture
- `PaymentModal.tsx` : Modal de paiement
- `EmailModal.tsx` : Modal d'envoi par email

**Fonctionnalités :**
- CRUD factures (Create, Read, Update, Delete)
- Ajout de lignes de facture (produits, quantités, prix)
- Gestion des paiements (complets ou partiels)
- Calcul automatique des totaux
- Envoi par email (via API route Next.js)
- Génération PDF (avec jsPDF ou react-pdf)
- Filtres : date, client, société, statut paiement

#### 2. Module Achats (`app/dashboard/purchases/`)

**Pages à créer :**
- `page.tsx` : Liste des achats avec filtres

**Composants à créer :**
- `PurchaseForm.tsx` : Formulaire d'achat
- `PurchaseTable.tsx` : Tableau des achats
- `PaymentStatusBadge.tsx` : Badge de statut (payé/non payé)

**Fonctionnalités :**
- Créer un achat de matière première
- Marquer comme payé/livré avec dates
- Mise à jour automatique du stock
- Filtres : date, fournisseur, société, matière

#### 3. Trésorerie Prévisionnelle (`app/dashboard/forecast/`)

**Pages à créer :**
- `page.tsx` : Interface de simulation

**Composants à créer :**
- `ForecastInputs.tsx` : Grille d'inputs par produit/mois
- `ForecastChart.tsx` : Graphique 3 courbes (CA, dépenses, solde)
- `ForecastTable.tsx` : Tableau détaillé mensuel
- `ForecastSummary.tsx` : 4 cartes de résumé

**Fonctionnalités :**
- Simulation sur 6 mois
- Inputs par produit et par mois
- Calcul automatique :
  - Coûts matières (via BOM)
  - URSSAF (22% du CA)
  - Résultat net mensuel
  - Solde cumulé
- Graphique interactif (Chart.js)
- Export des résultats (CSV/PDF)

#### 4. Paramètres (`app/dashboard/settings/`)

**Pages à créer :**
- `page.tsx` : Tabs pour chaque catégorie

**Composants à créer :**
- `ProductsTab.tsx` : CRUD produits + BOM
- `RawMaterialsTab.tsx` : CRUD matières premières
- `CustomersTab.tsx` : CRUD clients
- `SuppliersTab.tsx` : CRUD fournisseurs
- `CompaniesTab.tsx` : CRUD sociétés
- `EmailTab.tsx` : Configuration SMTP
- `BOMModal.tsx` : Modal de configuration BOM

**Fonctionnalités :**
- CRUD complet pour toutes les entités
- Configuration BOM (Bill of Materials)
  - Sélection matières par produit
  - Quantités requises
  - Calcul coût automatique
- Configuration email SMTP
  - Test d'envoi
  - Chiffrement du mot de passe
- Import/Export CSV

### 🎨 Phase 3 : Optimisations

#### PWA Avancé
- Service Workers pour mode offline
- Sync en arrière-plan
- Notifications push
- Cache intelligent des données

#### UX/UI
- Animations fluides (Framer Motion)
- Skeleton loaders
- Toast notifications améliorées
- Dark mode (optionnel)

#### Performance
- Lazy loading des composants lourds
- Pagination des tableaux
- Debounce sur les recherches
- Optimistic UI updates

## Technologies utilisées

### Frontend
- **Next.js 16** : Framework React avec App Router
- **React 19** : Bibliothèque UI
- **TypeScript** : Typage statique
- **Tailwind CSS** : Styling utility-first
- **Heroicons** : Icônes SVG

### Backend & Data
- **Supabase** : BaaS (Backend as a Service)
  - PostgreSQL (base de données)
  - Auth (authentification)
  - Row Level Security
  - Realtime (optionnel)
- **Supabase SSR** : Client serveur Next.js

### Visualisation
- **Chart.js** : Graphiques interactifs
- **react-chartjs-2** : Wrapper React pour Chart.js
- **date-fns** : Manipulation de dates

### PWA
- **next-pwa** : Configuration PWA automatique
- **Service Workers** : Cache et offline
- **Web App Manifest** : Métadonnées d'installation

## Conventions de code

### Nomenclature

- **Composants** : PascalCase (`StatsCards.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useAuth.ts`)
- **Utilitaires** : camelCase (`formatEuro.ts`)
- **Types** : PascalCase (`Invoice`, `Customer`)
- **Constantes** : UPPER_SNAKE_CASE (`MAX_ITEMS`)

### Organisation des imports

```typescript
// 1. Imports React/Next
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// 2. Imports externes
import { Chart } from 'react-chartjs-2'

// 3. Imports internes
import { createClient } from '@/lib/supabase/client'
import { formatEuro } from '@/lib/utils'

// 4. Imports de types
import type { Invoice } from '@/types'
```

### Structure d'un composant

```typescript
'use client' // Si composant client

import { ... }

// Types locaux (si nécessaires)
type Props = {
  ...
}

// Composant principal
export default function ComponentName({ props }: Props) {
  // 1. Hooks d'état
  const [state, setState] = useState()
  
  // 2. Hooks de routing/navigation
  const router = useRouter()
  
  // 3. Hooks personnalisés
  const { data } = useCustomHook()
  
  // 4. Effets
  useEffect(() => {
    ...
  }, [])
  
  // 5. Handlers
  const handleClick = () => {
    ...
  }
  
  // 6. Render
  return (
    <div>
      ...
    </div>
  )
}

// Sous-composants locaux (si nécessaires)
function SubComponent() {
  ...
}
```

## Patterns recommandés

### Server Components (par défaut)

Utilisez les Server Components pour :
- Fetching de données
- Accès direct à Supabase
- Réduction du bundle JS client

```typescript
// app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('invoices').select('*')
  
  return <div>{...}</div>
}
```

### Client Components (si nécessaire)

Utilisez les Client Components pour :
- Interactivité (onClick, onChange)
- Hooks React (useState, useEffect)
- Browser APIs

```typescript
'use client'

import { useState } from 'react'

export default function InteractiveComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

### API Routes pour l'envoi d'emails

```typescript
// app/api/send-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  const { to, subject, html } = await request.json()
  
  // Logique d'envoi avec nodemailer
  
  return NextResponse.json({ success: true })
}
```

## Commandes utiles

```bash
# Développement
npm run dev           # Lancer en mode dev (http://localhost:3000)

# Production
npm run build         # Build optimisé
npm run start         # Lancer le build en local

# Qualité
npm run lint          # ESLint
npm run type-check    # TypeScript (à ajouter)

# Supabase (si Supabase CLI installé)
supabase start        # Lancer Supabase local
supabase db reset     # Réinitialiser la DB
supabase gen types    # Générer les types TypeScript
```

## Prochaines étapes

1. **Créer les modules manquants** (Factures, Achats, Forecast, Settings)
2. **Implémenter l'envoi d'emails** via API route
3. **Générer des PDFs** pour les factures
4. **Ajouter des tests** (Jest, React Testing Library)
5. **Optimiser les performances** (Lighthouse score > 90)
6. **Déployer sur Vercel** en production

---

✨ **Le projet est prêt à être étendu !**

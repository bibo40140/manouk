# 🚀 Guide de Déploiement - Manouk PWA

Ce guide vous explique comment déployer votre application Manouk PWA en production sur Vercel (gratuit).

## 📋 Prérequis

- ✅ Application fonctionnelle en local (`npm run dev`)
- ✅ Supabase configuré avec les tables créées
- ✅ Compte GitHub (gratuit)
- ✅ Compte Vercel (gratuit)

---

## Étape 1 : Préparer le code pour Git (5 minutes)

### 1.1 Initialiser un repo Git (si pas déjà fait)

```bash
cd manouk-pwa
git init
git add .
git commit -m "Initial commit - Manouk PWA v1"
```

### 1.2 Créer un repo sur GitHub

1. Allez sur [https://github.com/new](https://github.com/new)
2. Remplissez :
   - **Repository name** : `manouk-pwa`
   - **Description** : `Application de gestion pour auto-entrepreneurs`
   - **Visibility** : Private (recommandé) ou Public
3. **NE COCHEZ PAS** "Add README" ni "Add .gitignore"
4. Cliquez sur **"Create repository"**

### 1.3 Lier votre code local à GitHub

```bash
git remote add origin https://github.com/VOTRE_USERNAME/manouk-pwa.git
git branch -M main
git push -u origin main
```

✅ **Votre code est maintenant sur GitHub !**

---

## Étape 2 : Déployer sur Vercel (3 minutes)

### 2.1 Créer un compte Vercel

1. Allez sur [https://vercel.com/signup](https://vercel.com/signup)
2. Cliquez sur **"Continue with GitHub"**
3. Autorisez Vercel à accéder à GitHub

### 2.2 Importer votre projet

1. Sur le dashboard Vercel, cliquez sur **"Add New"** → **"Project"**
2. Sélectionnez votre repo **"manouk-pwa"**
3. Cliquez sur **"Import"**

### 2.3 Configurer les variables d'environnement

1. Dans la section **"Environment Variables"**, ajoutez :

   **Variable 1 :**
   - **Name** : `NEXT_PUBLIC_SUPABASE_URL`
   - **Value** : `https://votre-projet.supabase.co`
   - Cliquez sur **"Add"**

   **Variable 2 :**
   - **Name** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (votre clé anon)
   - Cliquez sur **"Add"**

   **Variable 3 (optionnelle) :**
   - **Name** : `SUPABASE_SERVICE_ROLE_KEY`
   - **Value** : `votre_cle_service_role`
   - Cliquez sur **"Add"**

2. Cliquez sur **"Deploy"**

### 2.4 Attendre le déploiement

- Le build prend environ 1-2 minutes
- Vercel compile votre app et la déploie automatiquement
- Vous verrez des confettis 🎉 quand c'est terminé !

### 2.5 Tester votre app

1. Cliquez sur **"Visit"** ou copiez l'URL : `https://manouk-pwa.vercel.app`
2. Vous devriez voir la page de login
3. Créez un compte et testez !

✅ **Votre app est en ligne !**

---

## Étape 3 : Configuration Supabase pour la production

### 3.1 Autoriser le domaine Vercel

1. Allez dans votre projet Supabase
2. Allez dans **Settings** → **Authentication** → **URL Configuration**
3. Ajoutez votre URL Vercel dans **"Site URL"** :
   ```
   https://manouk-pwa.vercel.app
   ```
4. Ajoutez aussi dans **"Redirect URLs"** :
   ```
   https://manouk-pwa.vercel.app/auth/callback
   https://manouk-pwa.vercel.app/*
   ```
5. Cliquez sur **"Save"**

✅ **L'authentification fonctionnera maintenant en production !**

---

## Étape 4 : Configurer un nom de domaine personnalisé (optionnel)

### 4.1 Acheter un nom de domaine

Acheter sur :
- [OVH](https://www.ovh.com) (~10€/an pour un .fr)
- [Namecheap](https://www.namecheap.com) (~10$/an pour un .com)
- [Google Domains](https://domains.google)

### 4.2 Ajouter le domaine sur Vercel

1. Dans votre projet Vercel, allez dans **Settings** → **Domains**
2. Cliquez sur **"Add"**
3. Entrez votre domaine : `manouk-gestion.fr`
4. Suivez les instructions pour configurer les DNS :
   - **Type A** : `76.76.21.21`
   - **Type CNAME** : `cname.vercel-dns.com`
5. Attendez la propagation DNS (5 minutes à 48h)

### 4.3 Activer le HTTPS automatique

- Vercel génère automatiquement un certificat SSL (Let's Encrypt)
- Votre site sera accessible en HTTPS : `https://manouk-gestion.fr`

✅ **Votre domaine personnalisé est configuré !**

---

## Étape 5 : Mises à jour automatiques

### 5.1 Workflow de développement

Chaque fois que vous modifiez le code :

```bash
# 1. Faire vos modifications localement
# 2. Tester en local
npm run dev

# 3. Commiter et pusher
git add .
git commit -m "Ajout du module factures"
git push

# 4. Vercel déploie automatiquement !
```

### 5.2 Déploiements automatiques

- **Push sur `main`** → Déploiement en production
- **Push sur autre branche** → Preview deployment (URL temporaire)
- Chaque commit = nouveau déploiement

### 5.3 Rollback en cas de problème

1. Allez dans **Deployments** sur Vercel
2. Trouvez le déploiement précédent qui fonctionnait
3. Cliquez sur **"..."** → **"Promote to Production"**

---

## 📊 Monitoring et Analytics

### Analytics Vercel (inclus gratuitement)

1. Allez dans **Analytics** sur Vercel
2. Vous verrez :
   - Nombre de visiteurs
   - Pages les plus visitées
   - Performance (Core Web Vitals)
   - Erreurs

### Supabase Dashboard

1. Allez dans **Reports** sur Supabase
2. Vous verrez :
   - Nombre de requêtes DB
   - Utilisation du storage
   - Requêtes API

---

## 🔧 Optimisations pour la production

### 1. Activer la compression

Ajoutez dans `next.config.ts` :

```typescript
const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true, // Compression Gzip automatique
  turbopack: {},
};
```

### 2. Optimiser les images

Utilisez le composant `<Image>` de Next.js :

```tsx
import Image from 'next/image'

<Image 
  src="/logo.png" 
  alt="Logo" 
  width={200} 
  height={100}
  priority // Pour les images above the fold
/>
```

### 3. Ajouter le cache

Ajoutez dans vos headers (dans `next.config.ts`) :

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60, stale-while-revalidate=30' }
        ],
      },
    ]
  },
};
```

---

## 📱 Installer l'app sur mobile

### Android

1. Ouvrez `https://manouk-pwa.vercel.app` dans **Chrome**
2. Menu (⋮) → **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**
3. L'icône apparaît sur votre écran d'accueil
4. L'app s'ouvre en mode standalone (sans barre d'adresse)

### iOS

1. Ouvrez `https://manouk-pwa.vercel.app` dans **Safari**
2. Bouton de partage (□↑) → **"Sur l'écran d'accueil"**
3. Cliquez sur **"Ajouter"**
4. L'icône apparaît sur votre écran d'accueil

### Windows / Mac / Linux

1. Ouvrez dans **Chrome** ou **Edge**
2. Icône d'installation dans la barre d'adresse (⊕)
3. Cliquez sur **"Installer"**
4. L'app s'ouvre en fenêtre standalone

---

## ⚠️ Limites du plan gratuit

### Vercel Free

- ✅ **Déploiements** : Illimités
- ✅ **Bandwidth** : 100 GB/mois
- ✅ **Build time** : 6000 minutes/mois
- ✅ **Domaines personnalisés** : Illimités
- ❌ **Membres d'équipe** : 1 seul

### Supabase Free

- ✅ **Database** : 500 MB
- ✅ **Storage** : 1 GB
- ✅ **Bandwidth** : 2 GB
- ✅ **Requêtes API** : Illimitées
- ❌ **Backups automatiques** : Non (manuel uniquement)

> **Note** : Pour un usage PME/TPE, le plan gratuit suffit largement !

---

## 🔄 Migration vers un plan payant

### Quand migrer ?

Si vous atteignez les limites :

- **Vercel Pro** : 20 $/mois
  - 1 TB de bandwidth
  - Analytics avancés
  - Preview deployments illimités

- **Supabase Pro** : 25 $/mois
  - 8 GB de database
  - 100 GB de storage
  - Backups quotidiens automatiques

---

## 📞 Support

### Problèmes de déploiement ?

1. Vérifiez les logs dans Vercel :
   - **Deployments** → Cliquez sur le déploiement → **"Logs"**
2. Erreurs communes :
   - **Variables d'environnement manquantes** → Ajoutez-les dans Vercel Settings
   - **Build failed** → Vérifiez que `npm run build` fonctionne en local
   - **Runtime error** → Vérifiez les logs de production

### Erreurs d'authentification ?

1. Vérifiez que l'URL de redirection est correcte dans Supabase
2. Vérifiez que les variables d'environnement sont les bonnes
3. Effacez les cookies et réessayez

---

## ✅ Checklist finale

Avant de partager l'app avec vos utilisateurs :

- [ ] L'app fonctionne en production
- [ ] L'authentification fonctionne (signup + login)
- [ ] Les données s'affichent correctement
- [ ] Le dashboard affiche les bonnes stats
- [ ] L'app est installable (PWA)
- [ ] Le HTTPS fonctionne
- [ ] Le domaine personnalisé est configuré (optionnel)
- [ ] Vous avez testé sur mobile
- [ ] Vous avez testé sur desktop

---

## 🎉 Félicitations !

Votre application Manouk PWA est maintenant accessible partout dans le monde !

**URL de production** : `https://manouk-pwa.vercel.app`

Partagez cette URL à vos utilisateurs et ils pourront :
- Se créer un compte
- Gérer leurs factures
- Suivre leur trésorerie
- Installer l'app sur leur téléphone/ordinateur

---

## 📖 Ressources complémentaires

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

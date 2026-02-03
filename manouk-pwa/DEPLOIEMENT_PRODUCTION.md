# 🚀 GUIDE DE DÉPLOIEMENT EN PRODUCTION

## ✅ CHECKLIST AVANT MISE EN PROD

### 🔴 CRITIQUE - OBLIGATOIRE

#### 1. Script SQL URSSAF (REQUIS)
**Sans cette étape, l'app va planter sur toutes les pages factures !**

```bash
1. Ouvrir https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans "SQL Editor"
4. Ouvrir le fichier: scripts/add-urssaf-columns.sql
5. Copier tout le contenu
6. Coller dans SQL Editor
7. Cliquer sur "Run" (F5)
8. Vérifier: Table Editor > invoices > colonnes suivantes doivent apparaître:
   - urssaf_amount
   - urssaf_declared_date
   - urssaf_paid_date
   - urssaf_paid_amount
```

#### 2. Variables d'environnement Vercel

Dans Vercel > Settings > Environment Variables :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_publique
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service_role_secrete
```

⚠️ La `SERVICE_ROLE_KEY` est **secrète** - ne la commitez JAMAIS sur Git !

#### 3. Vérifier les Row Level Security (RLS)

Dans Supabase > Authentication > Policies :

```sql
-- Vérifier que chaque table a ses policies RLS
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- Résultat attendu: 0 lignes (toutes les tables doivent avoir RLS activé)
```

### 🟡 IMPORTANT - RECOMMANDÉ

#### 4. Tester le flow complet

- [ ] Créer un compte utilisateur de test
- [ ] Créer une société
- [ ] Créer des clients, fournisseurs, matières
- [ ] Créer une facture avec lignes et paiements
- [ ] Déclarer et payer URSSAF sur une facture
- [ ] Créer un achat
- [ ] Vérifier le dashboard (stats, graphiques)
- [ ] Tester la trésorerie prévisionnelle
- [ ] Se déconnecter et se reconnecter

#### 5. Vérifier les permissions admin

Si vous avez un compte admin (email défini dans le code) :

```typescript
// Dans app/dashboard/page.tsx, app/dashboard/purchases/page.tsx, etc.
const isAdmin = user?.email === 'fabien.hicauber@gmail.com'
```

⚠️ **Changez cet email** par le vôtre ou créez une table `admins` dans Supabase

#### 6. Optimisations de production

```bash
# Vérifier qu'il n'y a pas d'erreurs ESLint
npm run lint

# Build de test local
npm run build

# Vérifier la taille du bundle
npm run build -- --profile
```

### 🟢 OPTIONNEL - NICE TO HAVE

#### 7. Configuration PWA

Le fichier `public/manifest.json` est déjà configuré. Pour activer le PWA :

1. Vérifier que `next-pwa` est dans les dépendances
2. Le Service Worker sera généré automatiquement au build
3. Tester l'installation sur mobile après déploiement

#### 8. Monitoring et logs

Activer dans Vercel :
- [ ] Analytics (pour suivre les visites)
- [ ] Speed Insights (pour la performance)
- [ ] Log Drains (pour les erreurs en prod)

#### 9. Sauvegardes Supabase

Dans Supabase > Settings > Database :
- [ ] Activer Point-in-Time Recovery (PITR) si plan Pro
- [ ] Configurer un export automatique hebdomadaire
- [ ] Télécharger un backup initial

---

## 🔧 DÉPLOIEMENT SUR VERCEL

### Première fois

```bash
1. Push votre code sur GitHub
2. Aller sur https://vercel.com
3. Cliquer sur "Import Project"
4. Sélectionner le repo GitHub
5. Framework: Next.js (détection automatique)
6. Root Directory: manouk-pwa
7. Ajouter les variables d'environnement (voir étape 2)
8. Cliquer sur "Deploy"
```

### Mises à jour

```bash
# Chaque push sur la branche main déploiera automatiquement
git add .
git commit -m "fix: description du changement"
git push origin main
```

---

## 🧪 TESTS POST-DÉPLOIEMENT

### Tests de sécurité

- [ ] Essayer d'accéder au dashboard sans être connecté → Redirection /login
- [ ] Créer 2 comptes différents et vérifier l'isolation des données (RLS)
- [ ] Tenter d'injecter du SQL dans les formulaires
- [ ] Vérifier que les Service Role Keys ne sont pas exposées côté client

### Tests de performance

- [ ] Temps de chargement < 3s sur connexion 4G
- [ ] Lighthouse Score > 90
- [ ] Pas d'erreurs dans la console navigateur

### Tests de fonctionnalités

- [ ] Dashboard affiche les bonnes données
- [ ] Graphiques se chargent correctement
- [ ] URSSAF : déclaration et paiement fonctionnent
- [ ] Factures : création, modification, paiements multiples
- [ ] Achats : création fonctionne
- [ ] Filtrage par société fonctionne (si multi-tenant)

---

## 🐛 RÉSOLUTION DE PROBLÈMES

### Erreur "Column urssaf_amount does not exist"
→ Le script SQL n'a pas été exécuté (voir étape 1)

### Erreur "Row Level Security policy violation"
→ Vérifier que l'utilisateur est bien associé à une société via `user_companies`

### Dashboard vide alors qu'il y a des données
→ Vérifier le filtre de société et les permissions RLS

### Variables d'environnement non reconnues
→ Redéployer dans Vercel après avoir ajouté les variables

### Service Worker ne se met pas à jour
→ Vider le cache et recharger avec Ctrl+Shift+R

---

## 📊 FONCTIONNALITÉS DISPONIBLES

### ✅ Opérationnel
- Authentification (signup, login, logout, reset password)
- Dashboard avec 9 cartes de stats en temps réel
- Graphique d'évolution du CA (vraies données)
- Factures : création, modification, paiements multiples
- Système URSSAF complet (déclaration + paiement)
- Achats : création
- Trésorerie prévisionnelle (simulation 6 mois)
- Paramètres : produits avec édition inline
- Multi-tenant (plusieurs sociétés par utilisateur)
- Row Level Security (isolation des données)

### 🚧 À finaliser (optionnel)
- Envoi d'emails pour les factures
- Édition inline pour matières, clients, fournisseurs
- PWA mode offline
- Mouvements de stock détaillés
- Export PDF des factures

---

## 📞 SUPPORT

En cas de problème :
1. Vérifier les logs Vercel : vercel.com > votre-projet > Logs
2. Vérifier les logs Supabase : supabase.com > SQL Editor > Logs
3. Ouvrir la console du navigateur (F12)
4. Consulter les fichiers README.md et GUIDE_DEMARRAGE.md

---

**Temps estimé pour la mise en production : 30-45 minutes**

Bonne chance ! 🚀

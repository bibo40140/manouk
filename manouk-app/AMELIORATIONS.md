# 🚀 Améliorations Manouk - v2.0

## ✨ Nouvelles fonctionnalités implémentées

### 1. 📋 Numérotation automatique des factures
- **Format** : `FA-YYYY-XXXX` (ex: FA-2025-0001)
- **Auto-incrémentation** : Numérotation séquentielle par société et par année
- **Stockage** : Nouveau champ `invoice_number` dans la base de données
- **Table** : `invoice_sequences` pour gérer les compteurs

**Avantages** :
- Conformité comptable
- Traçabilité parfaite
- Pas de duplicatas possibles

---

### 2. 🔔 Notifications Toast modernes
- **Remplacement** : Tous les `alert()` remplacés par des notifications élégantes
- **Types** : Success ✅, Error ❌, Warning ⚠️, Info ℹ️
- **Animation** : Slide-in/out fluide
- **Auto-dismiss** : 4 secondes
- **Position** : Coin supérieur droit

**Bénéfices** :
- Interface non-bloquante
- Meilleure expérience utilisateur
- Design moderne

---

### 3. 💾 Sauvegardes automatiques
- **Fréquence** : Toutes les 24 heures (au démarrage + schedule)
- **Dossier** : `AppData\Roaming\manouk-gestion\backups\`
- **Nom** : `manouk-YYYY-MM-DD.db`
- **Rétention** : 30 jours (suppression automatique des anciennes sauvegardes)

**Sécurité** :
- Protection contre la perte de données
- Sauvegarde native SQLite (VACUUM INTO)
- Historique de 30 jours

---

### 4. 📊 Dashboard enrichi avec graphiques

#### Graphiques Chart.js
1. **Évolution du CA (6 derniers mois)**
   - Graphique en ligne avec zone remplie
   - Tendance mensuelle du chiffre d'affaires
   - Points interactifs avec tooltips

2. **Rentabilité par produit (Top 10)**
   - Graphique en barres double échelle
   - Revenus (€) et Marge (%) par produit
   - Identification rapide des produits les plus rentables

#### Statistiques avancées
- **Par produit** :
  - Total vendu (quantité)
  - Revenus totaux
  - Coût moyen d'achat
  - Marge brute (€ et %)

#### Alertes intelligentes
1. **Factures en retard** 🔴
   - Alerte si factures > 30 jours
   - Affiche le nombre et le montant total

2. **Stock faible** ⚠️
   - Alerte si stock < 10 unités
   - Liste les produits concernés avec quantités

---

### 5. 🎨 Design moderne et élégant

#### Palette de couleurs
- **Background** : Gradient violet-indigo (#667eea → #764ba2)
- **Cartes** : Blanc avec ombres subtiles
- **Accent** : Bleu professionnel (#0b7bbf)
- **Couleurs sémantiques** :
  - Success : #10b981 (vert)
  - Warning : #f59e0b (orange)
  - Danger : #ef4444 (rouge)

#### Effets visuels
- **Hover effects** : Transform + shadow sur toutes les cartes
- **Animations** : Transitions fluides (0.2-0.3s)
- **Gradients** : Sur boutons primaires et textes importants
- **Shadows** : 3 niveaux (sm, md, lg)

#### Typographie
- **Font** : Segoe UI (native Windows)
- **Hiérarchie** : Tailles et poids variés
- **Couleurs** : Contraste optimisé pour la lisibilité

#### Cartes statistiques
- **Grid responsive** : Adaptation automatique
- **Bordures colorées** : Par type de donnée (success, warning, danger)
- **Valeurs en évidence** : Grandes tailles avec gradients
- **Labels clairs** : Texte grisé descriptif

---

## 🔧 Modifications techniques

### Backend (main.js)
1. **Nouvelle fonction** : `getNextInvoiceNumber(companyId)`
   - Gère l'auto-incrémentation par société/année
   
2. **Nouvelle fonction** : `scheduleBackup()`
   - Backup au démarrage + setInterval 24h
   - Cleanup automatique (>30 jours)

3. **getDashboardData() enrichi**
   - `productStats` : Rentabilité détaillée par produit
   - `overdueInvoices` : Compteur + montant factures >30j
   - `lowStockProducts` : Liste produits stock <10
   - `monthlyRevenue` : CA des 6 derniers mois

4. **Migration automatique**
   - Ajout colonne `invoice_number` si absente
   - Création table `invoice_sequences`

### Frontend (renderer.js)
1. **showToast(message, type)** : Système de notifications
2. **renderDashboardAlerts()** : Affichage alertes visuelles
3. **renderRevenueChart()** : Graphique CA Chart.js
4. **renderProfitabilityChart()** : Graphique rentabilité
5. **State étendu** : Ajout `productStats`, `overdueInvoices`, `lowStockProducts`, `monthlyRevenue`

### UI (index.html)
1. **Chart.js** : Intégration CDN
2. **Toast container** : Conteneur notifications
3. **Canvas** : Deux éléments pour graphiques
4. **CSS modernisé** : Variables CSS, gradients, animations, responsive
5. **Stats-grid** : Layout moderne pour indicateurs

---

## 📈 Indicateurs de performance

### Rentabilité calculée
Pour chaque produit :
```
Marge brute (€) = Revenus - (Quantité vendue × Coût moyen)
Marge (%) = (Marge brute / Revenus) × 100
```

### Alertes business
- **Factures en retard** : `date_facture + 30 jours < date_actuelle`
- **Stock faible** : `stock < 10`

---

## 🎯 Utilisation

### Consulter le dashboard
1. Lancez l'application : `npm start`
2. Le tableau de bord s'affiche automatiquement
3. **Filtrage** : Sélectionnez une société pour filtrer les données
4. **Graphiques** : Scroll vers le bas pour voir l'évolution du CA et la rentabilité
5. **Alertes** : Les alertes s'affichent automatiquement en haut si nécessaire

### Créer une facture avec numéro
1. Onglet **Factures** → **Nouvelle facture**
2. Remplissez les informations client et lignes
3. Cliquez sur **Créer la facture**
4. Un numéro unique est généré automatiquement (ex: FA-2025-0042)
5. Notification de succès ✅

### Restaurer une sauvegarde
1. Fermez l'application
2. Allez dans `%APPDATA%\manouk-gestion\backups\`
3. Copiez la sauvegarde souhaitée
4. Remplacez `manouk.db` dans le dossier de l'application
5. Relancez l'application

---

## 🔮 Améliorations futures possibles

### Court terme
- [ ] Export CSV des factures et achats
- [ ] Filtres de date sur le dashboard
- [ ] Impression PDF des graphiques
- [ ] Dark mode

### Moyen terme
- [ ] Synchronisation cloud (Firebase/Supabase)
- [ ] Version mobile (React Native)
- [ ] Multi-utilisateurs avec authentification
- [ ] Tableau de trésorerie prévisionnel

### Long terme
- [ ] API REST pour intégrations tierces
- [ ] Module de relances automatiques
- [ ] IA pour prédictions de trésorerie
- [ ] Connexion bancaire (agrégation)

---

## 📝 Notes de version

### v2.0 (Novembre 2025)
- ✅ Numérotation automatique des factures
- ✅ Notifications toast modernes
- ✅ Sauvegardes automatiques (24h, rétention 30j)
- ✅ Dashboard avec graphiques Chart.js
- ✅ Calcul de rentabilité par produit
- ✅ Alertes intelligentes (retards, stock faible)
- ✅ Design moderne avec gradients et animations
- ✅ Stats enrichies (CA mensuel, marges)

### v1.0 (Version précédente)
- Gestion factures/achats
- Multi-société (Manouk, Bibizi)
- Répartition par rôles
- Envoi email SMTP
- Stock et URSSAF

---

## 💡 Conseils d'utilisation

### Performance
- Les graphiques se rechargent à chaque refresh du dashboard
- Le filtrage par société recalcule toutes les stats
- Les alertes sont calculées côté serveur (backend)

### Données
- Les sauvegardes prennent ~1-2 MB selon le volume de données
- Le calcul de rentabilité utilise le coût moyen pondéré
- Les factures >30j sont considérées en retard

### Personnalisation
- Modifiez les variables CSS dans `index.html` pour changer les couleurs
- Ajustez le seuil de stock faible dans `main.js` (actuellement 10)
- Changez la fréquence de backup dans `scheduleBackup()` (actuellement 24h)

---

## 🛠️ Stack technique

- **Electron** : 39.2.3
- **Node.js** : SQLite (better-sqlite3 12.4.6)
- **Email** : nodemailer 7.0.10
- **Charts** : Chart.js 4.5.1
- **UI** : CSS natif avec variables et animations
- **Base de données** : SQLite 3

---

## 🤝 Support

Pour toute question ou suggestion d'amélioration :
- Consultez le code source
- Testez les nouvelles fonctionnalités
- Proposez des améliorations via GitHub

---

**Développé avec ❤️ pour Manouk**

# 📖 Guide Utilisateur - Application Manouk

## 🎯 Vue d'ensemble

Application de gestion complète pour artisans savonniers multi-sociétés (Manouk & Bibizi) :
- 📊 Tableau de bord avec graphiques et statistiques
- 📄 Gestion des factures avec PDF automatique
- 🛒 Gestion des achats de matières premières
- 📦 Gestion des stocks avec alertes
- 💰 Déclarations URSSAF
- 🔮 Trésorerie prévisionnelle
- ⚙️ Paramètres (produits, clients, matières premières)

---

## 🔐 Connexion

**URL** : https://manouk.vercel.app

**Comptes** :
- `sophiefree40@gmail.com` → Accès société **Manouk** uniquement
- `fabien.hicauber+bibizi@gmail.com` → Accès société **Bibizi** uniquement
- `fabien.hicauber@gmail.com` → Accès **Admin** (toutes les sociétés)

---

## 📊 Tableau de bord

### Widgets disponibles
- **📈 Graphique revenus** : CA mensuel avec 4 courbes
  - CA HT total
  - CA HT Manouk
  - CA HT Bibizi
  - Coûts fixes mensuels
  
- **📄 Factures récentes** : Dernières factures avec statut paiement
- **🛒 Achats récents** : Derniers achats de matières premières
- **📦 Alertes stock** : Matières premières en stock faible
- **📊 Statistiques produits** : Top ventes par produit
- **💰 URSSAF** : Résumé trimestriel avec CA à déclarer

---

## 📄 Factures

### Créer une facture

1. Aller dans **Factures** → Cliquer sur **📄 Nouvelle facture**
2. Remplir le formulaire :
   - **Client** : Sélectionner dans la liste (ou créer un nouveau)
   - **Date** : Date de la facture
   - **Produits** : Ajouter un ou plusieurs produits
   - **Quantité** : Nombre d'unités vendues
   
3. **Système de répartition automatique** :
   - Si le produit a des splits configurés (ex: 60% Manouk, 40% Bibizi)
   - 2 factures PDF seront générées et envoyées automatiquement
   - Chaque société reçoit sa facture avec son logo et adresse

4. Cliquer sur **Créer la facture**

### Numérotation automatique
- Format : `F2026-001`, `F2026-002`...
- Séquentielle par société et par année
- **Pas de doublons possibles** (système de retry automatique)

### Actions disponibles
- ✉️ **Envoyer par email** : Envoi automatique du PDF au client
- 📥 **Télécharger PDF** : Télécharge la facture
- 💰 **Marquer comme payée** : Mettre à jour le statut de paiement
- 🗑️ **Supprimer** : Supprime la facture

### Export Excel
- **Export simple** : Exporte les factures visibles
- **Export global** : 6 onglets (factures, clients, produits, achats, matières premières, statistiques)

---

## 🛒 Achats de matières premières

### Faire un achat

1. Aller dans **Achats** → **🛒 Nouvel achat**
2. Remplir :
   - **Société** : Manouk ou Bibizi
   - **Matière première** : Choisir dans la liste
   - **Quantité** : Nombre d'unités/mètres/kg...
   
3. **💡 Deux méthodes pour le prix** :
   
   **Méthode 1 - Coût unitaire direct** :
   - Saisir directement le coût par unité (ex: 0.0606€)
   
   **Méthode 2 - Prix total du lot (recommandé)** :
   - Saisir le **prix total payé** (ex: 12.12€)
   - Le coût unitaire est **calculé automatiquement**
   - Exemple : 200 vis à 12,12€ → Coût unitaire = 0.0606€/unité

4. **Date d'achat** : Date de l'achat
5. **Payé** : Cocher si l'achat est déjà payé

### Gestion du stock
- Le stock est automatiquement incrémenté lors d'un achat
- Édition manuelle possible dans **Stocks** (bouton ✏️)

---

## 📦 Gestion des stocks

### Vue d'ensemble
- **Matières premières** : Liste avec stock actuel
- **Produits finis** : Stock de produits
- **Alertes** : Notification quand stock < seuil

### Éditer le stock manuellement
1. Cliquer sur **✏️** à côté du stock
2. Saisir la nouvelle valeur
3. Cliquer sur **✓** pour valider

### Définir des seuils d'alerte
1. Cliquer sur **✏️** dans la colonne "Seuil d'alerte"
2. Saisir le seuil (ex: 50)
3. Valider avec **✓**
4. → Alerte automatique quand stock < seuil

---

## ⚙️ Paramètres

### 1️⃣ Matières premières

#### Ajouter une matière première
1. Aller dans **Paramètres** → Onglet **Matières premières**
2. Remplir :
   - **Nom** : Ex: "Huile d'olive", "Tuyau", "Vis"
   - **Unité** : Choisir parmi :
     - `unité` : Pour les pièces (vis, bouchons...)
     - `mètre` : Pour les matériaux vendus au mètre
     - `centimètre` : Pour petites longueurs
     - `kilogramme` / `gramme` : Pour les poids
     - `litre` / `millilitre` : Pour les liquides
     - `lot` : Pour les achats en lot
   - **Coût unitaire** : Prix par unité (jusqu'à 4 décimales : 0.0044€)
   - **Stock** : Stock initial
   - **Société** : Manouk ou Bibizi

#### Exemples concrets
- **Tuyau** : Unité = `mètre`, Coût = 0.17€/m, Stock = 100m
- **Vis** : Unité = `unité`, Coût = 0.0606€/unité, Stock = 500
- **Paille** : Unité = `centimètre`, Coût = 0.0044€/cm, Stock = 1000

### 2️⃣ Produits

#### Ajouter un produit
1. **Nom** : Ex: "Savon lavande"
2. **Prix** : Prix de vente TTC
3. **Stock** : Stock initial
4. **Répartition multi-sociétés** :
   - Montant pour Manouk : 60%
   - Montant pour Bibizi : 40%
   - Total doit = 100%

#### Définir la composition (BOM)
1. Cliquer sur **📋 BOM** à côté du produit
2. Ajouter chaque matière première :
   - Sélectionner la matière
   - **Quantité** : Adapter selon l'unité
     - Ex: Tuyau (mètre) → 0.02 (= 2cm)
     - Ex: Vis (unité) → 1
     - Ex: Paille (cm) → 1
3. Le coût total s'affiche automatiquement

### 3️⃣ Clients

- **Nom**, **Email** : Informations de base
- **Adresse**, **Téléphone** : Optionnels
- **SIRET**, **N° TVA** : Pour les professionnels

### 4️⃣ Coûts fixes

Ajouter vos charges mensuelles :
- **Nom** : Ex: "Loyer", "Électricité"
- **Montant** : Montant en €
- **Fréquence** : Mensuel / Trimestriel / Annuel
- **Société** : Manouk, Bibizi ou Les deux

Ces coûts apparaissent dans les graphiques et le prévisionnel.

### 5️⃣ Configuration Email (SMTP)

Pour l'envoi automatique des factures :
- **Serveur SMTP** : Ex: smtp.gmail.com
- **Port** : 587 (TLS) ou 465 (SSL)
- **Email** : Votre adresse d'envoi
- **Mot de passe** : Mot de passe d'application Gmail

---

## 🔮 Trésorerie prévisionnelle

### Comment ça marche
1. Aller dans **Trésorerie prévisionnelle**
2. Pour chaque produit, saisir les **quantités prévues par mois**
3. Le système calcule automatiquement :
   - **CA prévisionnel** (quantité × prix de vente)
   - **Coût matières premières** (quantité × coût BOM)
   - **Marge brute** (CA - Coûts MP)
   - **Marge nette** (Marge brute - Coûts fixes)

### Prévision des stocks
- Affiche le **stock nécessaire** pour chaque matière
- Compare avec le **stock actuel**
- Indique s'il faut **commander** 🔴

---

## 💰 URSSAF

### Vue d'ensemble
- Affiche le CA à déclarer par trimestre
- **Important** : Seules les factures **entièrement payées** sont comptées
  - Si une facture de 100€ a 50€ payés → **pas comptée**
  - Si une facture de 100€ a 100€ payés → **comptée**

### Déclarer un trimestre
1. Vérifier le montant du CA
2. Cliquer sur **Déclarer**
3. Saisir les informations URSSAF
4. Valider

---

## 📱 Utilisation mobile

L'application est une **PWA** (Progressive Web App) :
1. Ouvrir dans Chrome/Safari sur mobile
2. Menu → **Ajouter à l'écran d'accueil**
3. L'app s'installe comme une application native
4. Fonctionne même hors ligne (données en cache)

---

## ❓ Problèmes courants

### Les factures ne s'envoient pas
- Vérifier la configuration SMTP dans **Paramètres → Email**
- Vérifier que le client a un email renseigné

### Le stock ne se met pas à jour
- Rafraîchir la page (F5)
- Vérifier que l'achat est bien lié à la bonne société

### Je ne vois pas mes données
- Vérifier que vous êtes connecté avec le bon compte
- Les utilisateurs normaux ne voient que **leur société**
- Seul l'admin voit **toutes les sociétés**

### Les prix ont trop de décimales
- Normal pour les très petits prix (0.0044€)
- Le système supporte **4 décimales** pour la précision

---

## 🔒 Sécurité

- **Authentification** : Via Supabase (email + mot de passe)
- **RLS (Row Level Security)** : Chaque utilisateur voit uniquement ses données
- **Isolation multi-sociétés** : Manouk et Bibizi sont totalement séparées
- **Backup automatique** : Données sauvegardées par Supabase

---

## 📞 Support

Pour toute question ou problème :
- Contacter l'administrateur : fabien.hicauber@gmail.com
- Consulter ce guide
- Tester en local avant de modifier en production

---

## 🎓 Bonnes pratiques

✅ **À faire** :
- Créer les matières premières AVANT les produits
- Définir les BOM pour calculer les coûts automatiquement
- Utiliser le champ "Prix total du lot" pour les achats en gros
- Vérifier les stocks régulièrement
- Marquer les factures comme payées dès réception

❌ **À éviter** :
- Supprimer une matière première utilisée dans un produit
- Modifier le prix d'une matière sans mettre à jour les BOM
- Oublier de définir les splits multi-sociétés pour les nouveaux produits
- Créer des factures sans vérifier le stock disponible

---

## 📊 Récapitulatif des fonctionnalités

| Fonctionnalité | Description | Automatique |
|----------------|-------------|-------------|
| Numérotation factures | F2026-001, F2026-002... | ✅ Oui |
| Split multi-sociétés | 2 PDFs (Manouk + Bibizi) | ✅ Oui |
| Calcul coût unitaire | Depuis prix total du lot | ✅ Oui |
| Mise à jour stock | À chaque achat/vente | ✅ Oui |
| Alertes stock | Quand < seuil | ✅ Oui |
| Export Excel | 6 onglets complets | 📥 Manuel |
| Envoi email | PDF aux clients | ✉️ Manuel |
| Trésorerie prévisionnelle | Basée sur quantités saisies | 📊 Temps réel |

---

**Version** : Février 2026  
**Dernière mise à jour** : Ajout gestion des unités (mètre, cm, kg...) et calcul automatique coût unitaire

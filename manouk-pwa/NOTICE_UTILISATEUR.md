# Notice d'utilisation - Application Manouk

## Accès à l'application

**URL de l'application** : https://manouk.vercel.app

## Connexion

1. Rendez-vous sur https://manouk.vercel.app
2. Entrez votre adresse email et votre mot de passe
3. Cliquez sur "Se connecter"

> **Note** : Si vous n'avez pas encore de compte, contactez l'administrateur pour qu'il vous en crée un.

---

## Navigation dans l'application

L'application comporte plusieurs sections accessibles depuis le menu latéral :

### 📊 Dashboard (Tableau de bord)

Page d'accueil affichant une vue d'ensemble de votre activité :
- **Statistiques clés** : Chiffre d'affaires, bénéfice net, dépenses, marge
- **Graphique de revenus** : Évolution mensuelle de vos revenus
- **Factures récentes** : Liste des dernières factures émises
- **Achats récents** : Liste des derniers achats effectués

**Filtre par société** : Utilisez le sélecteur en haut pour filtrer les données par société (ou "Toutes les sociétés")

---

### 📄 Factures

Gérez vos factures clients :

#### Consulter les factures
- Liste de toutes vos factures avec numéro, client, montant, date et statut
- Utilisez les filtres pour trouver rapidement une facture
- Cliquez sur une facture pour voir les détails

#### Créer une facture
1. Cliquez sur le bouton **"+ Nouvelle facture"**
2. Sélectionnez le **client**
3. Sélectionnez la **société** émettrice
4. Choisissez le **produit**
5. Indiquez la **quantité**
6. Ajoutez une **description** (optionnel)
7. Cliquez sur **"Créer la facture"**

#### Modifier une facture
1. Cliquez sur l'icône de modification (crayon)
2. Modifiez les informations souhaitées
3. Cliquez sur **"Enregistrer"**

#### Envoyer une facture par email
1. Cliquez sur l'icône d'envoi (enveloppe)
2. Vérifiez l'adresse email du destinataire
3. Cliquez sur **"Envoyer"**

#### Enregistrer un paiement
1. Cliquez sur l'icône de paiement (€)
2. Sélectionnez le **mode de paiement** (Virement, Chèque, Espèces, Carte bancaire)
3. Indiquez la **date de paiement**
4. Ajoutez une **référence** (optionnel)
5. Cliquez sur **"Enregistrer le paiement"**

#### Gestion URSSAF
- **Déclarer à l'URSSAF** : Marquez une facture comme déclarée à l'URSSAF
- **Payer l'URSSAF** : Enregistrez le paiement des cotisations URSSAF

---

### 🛒 Achats

Gérez vos achats de matières premières :

#### Consulter les achats
- Liste de tous vos achats avec date, matière première, quantité, prix et société
- Utilisez les filtres pour rechercher un achat spécifique

#### Créer un achat
1. Cliquez sur le bouton **"+ Nouvel achat"**
2. Sélectionnez la **matière première**
3. Sélectionnez la **société** acheteuse
4. Indiquez la **quantité**
5. Entrez le **prix unitaire**
6. Sélectionnez la **date d'achat**
7. Cliquez sur **"Créer"**

#### Modifier ou supprimer un achat
- Cliquez sur l'icône de modification (crayon) pour éditer
- Cliquez sur l'icône de suppression (poubelle) pour supprimer

---

### 📈 Prévisionnel

Outil de simulation financière pour anticiper votre activité :

#### Utilisation du simulateur
1. **Sélectionnez les produits** que vous prévoyez de vendre (cochez les cases)
2. **Indiquez les quantités mensuelles** pour chaque produit sur 12 mois
3. Les résultats s'affichent automatiquement avec :
   - **Revenus par société** : Répartition du chiffre d'affaires selon les splits configurés
   - **Coût matières** : Calcul automatique des coûts de production
   - **Bénéfice prévisionnel** : Différence entre revenus et coûts

> **Note** : Les revenus sont répartis entre les sociétés selon les pourcentages configurés dans les paramètres.

---

### ⚙️ Paramètres

Configurez les données de base de l'application :

#### Onglet Sociétés
- Créez et gérez vos sociétés (nom, SIRET, TVA, adresse)
- Configurez les informations bancaires

#### Onglet Clients
- Ajoutez vos clients avec leurs coordonnées
- Gérez les adresses de facturation et emails

#### Onglet Produits
- Créez vos produits/services
- Définissez les prix de vente
- Configurez la **nomenclature (BOM)** : liste des matières premières nécessaires pour chaque produit
- Paramétrez les **splits de revenus** : répartition du CA entre sociétés (ex: 70% Société A, 30% Société B)

#### Onglet Matières premières
- Ajoutez les matières premières utilisées
- Suivez les stocks et coûts

#### Onglet Fournisseurs
- Gérez vos fournisseurs de matières premières

#### Onglet Email (Administrateur uniquement)
- Configurez les paramètres SMTP pour l'envoi automatique de factures

#### Onglet Utilisateurs (Administrateur uniquement)
- Créez de nouveaux utilisateurs
- Assignez les utilisateurs aux sociétés
- Gérez les mots de passe
- Supprimez des utilisateurs

---

## Droits d'accès

### Tous les utilisateurs
- Peuvent voir **toutes les données** de toutes les sociétés
- Peuvent créer et modifier des factures, achats, clients, produits, etc.

### Administrateur uniquement
- Accès à l'onglet **Email** (configuration SMTP)
- Accès à l'onglet **Utilisateurs** (gestion des comptes)

---

## Fonctionnalités clés

### 💰 Calcul automatique du coût matières
Lorsque vous créez une facture, le système calcule automatiquement le coût des matières premières en se basant sur :
- La **nomenclature (BOM)** du produit
- Les **prix d'achat** réels des matières premières (historique des achats)

### 📊 Répartition multi-sociétés
Pour les produits partagés entre plusieurs sociétés, le système répartit automatiquement :
- Le **chiffre d'affaires** selon les pourcentages configurés
- Les **coûts matières** proportionnellement aux revenus de chaque société

### 📧 Envoi automatique de factures
Les factures peuvent être envoyées directement par email au format PDF aux clients.

---

## Support

Pour toute question ou problème technique, contactez votre administrateur système.

**Administrateur** : fabien.hicauber@gmail.com

---

*Dernière mise à jour : 3 décembre 2025*

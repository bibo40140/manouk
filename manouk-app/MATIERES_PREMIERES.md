# 🧱 Système de Matières Premières (BOM)

## Vue d'ensemble

Le système de **nomenclature (Bill of Materials - BOM)** permet de calculer le **coût réel de fabrication** de chaque produit en décomposant sa composition en matières premières.

---

## 🎯 Fonctionnalités

### 1. Gestion des matières premières

**Table `raw_materials`** :
- Nom (ex: Liner tissu, Vis, Pailles)
- Unité de mesure (mètre, unité, gramme, etc.)
- Coût unitaire (mis à jour automatiquement avec les achats)
- Stock actuel
- Notes

**Interface** :
- Onglet **Paramètres → Matières premières**
- Ajouter, modifier, supprimer des matières
- Visualisation du stock et coût actuel

---

### 2. Composition des produits (Nomenclature)

**Table `product_materials`** :
- Lien produit ↔ matière première
- Quantité nécessaire par unité de produit

**Exemple** : Étui à lunettes
```
- Liner (tissu) : 0.15 mètre @ 8.00€/m = 1.20€
- Vis : 2 unités @ 0.10€/u = 0.20€
- Pailles : 1 unité @ 0.05€/u = 0.05€
- Fil à coudre : 0.1 bobine @ 2.50€/bob = 0.25€
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COÛT TOTAL DE FABRICATION : 1.70€
```

**Interface** :
- Bouton **🧱 Composition** sur chaque produit
- Modal pour définir les matières et quantités
- Calcul automatique du coût total
- Sauvegarde de la nomenclature

---

### 3. Achats de matières premières

**Table `raw_material_purchases`** :
- Matière achetée
- Fournisseur
- Société (multi-company)
- Date, quantité, coût unitaire
- Total, payé, dû

**Mise à jour automatique** :
- Stock ajouté automatiquement
- Coût unitaire recalculé en **moyenne pondérée**

**Formule moyenne pondérée** :
```
Nouveau coût moyen = (Valeur stock actuel + Valeur nouvel achat) / Stock total
```

**Exemple** :
```
Stock actuel : 10 m @ 8.00€/m = 80€
Nouvel achat : 5 m @ 9.00€/m = 45€
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nouveau stock : 15 m
Nouveau coût moyen : (80 + 45) / 15 = 8.33€/m
```

---

### 4. Calcul de rentabilité avancé

**Dans le tableau des produits** :
- **Coût réel** : Calculé automatiquement depuis la nomenclature
- **Marge** : Prix de vente - Coût réel (en € et %)

**Exemple** : Étui à lunettes
```
Prix de vente : 3.00€
Coût réel : 1.70€
━━━━━━━━━━━━━━━━━━━━
Marge : 1.30€ (43.3%)
```

**Affichage** :
- Coût en vert si défini
- Marge en vert si positive, rouge si négative
- Pourcentage de marge affiché

---

## 📊 Avantages du système

### 1. Coût exact de fabrication
- Plus de coûts approximatifs
- Base de calcul fiable pour les prix
- Traçabilité complète

### 2. Gestion des stocks
- Stock de matières premières en temps réel
- Alertes si stock faible
- Historique des achats

### 3. Optimisation des marges
- Identification rapide des produits rentables/non rentables
- Ajustement des prix de vente informé
- Analyse de rentabilité produit par produit

### 4. Prévisions d'achat
- Calcul automatique des besoins en matières
- Planification des achats
- Optimisation de trésorerie

---

## 🔧 Utilisation

### Étape 1 : Ajouter les matières premières

1. Allez dans **Paramètres → Matières premières**
2. Remplissez le formulaire :
   - Nom : "Liner (tissu)"
   - Unité : "mètre"
   - Coût unitaire : 8.00€
   - Stock initial : 10
3. Cliquez sur **Ajouter la matière**

**Matières de base pré-remplies** :
- Liner (tissu) : 8.00€/mètre
- Vis : 0.10€/unité
- Pailles : 0.05€/unité
- Fil à coudre : 2.50€/bobine
- Fermeture éclair : 0.50€/unité

---

### Étape 2 : Définir la composition des produits

1. Allez dans **Paramètres → Produits**
2. Cliquez sur **🧱 Composition** pour un produit
3. Dans le modal :
   - Sélectionnez une matière première
   - Indiquez la quantité nécessaire
   - Cliquez sur **+ Ajouter une matière** pour plus de matières
4. Le **coût calculé** s'affiche en temps réel
5. Cliquez sur **Enregistrer**

---

### Étape 3 : Enregistrer les achats de matières

1. Allez dans **Paramètres → Matières premières**
2. Section **Achats de matières premières**
3. Remplissez :
   - Matière première
   - Fournisseur
   - Société
   - Quantité
   - Coût unitaire
4. Cliquez sur **Enregistrer l'achat**

**Résultat** :
- ✅ Stock mis à jour automatiquement
- ✅ Coût moyen recalculé
- ✅ Historique des achats enregistré

---

### Étape 4 : Consulter la rentabilité

1. Allez dans **Paramètres → Produits**
2. Colonnes affichées :
   - **Coût réel** : Calculé depuis la nomenclature
   - **Marge** : Prix - Coût (€ et %)
3. Ajustez les prix si nécessaire

---

## 📈 Cas d'usage avancés

### 1. Produit avec plusieurs matières

**Exemple : Étui à lunettes complet**
```
Matières :
- Liner extérieur : 0.10 m @ 8.00€ = 0.80€
- Liner intérieur : 0.10 m @ 8.00€ = 0.80€
- Mousse : 0.05 m @ 12.00€ = 0.60€
- Vis : 4 unités @ 0.10€ = 0.40€
- Fil : 0.15 bobine @ 2.50€ = 0.38€
- Fermeture : 1 unité @ 0.50€ = 0.50€
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL : 3.48€
```

### 2. Suivi des variations de coût

**Scénario** : Prix du liner augmente
```
Avant : Liner @ 8.00€/m → Coût produit = 1.70€
Après : Liner @ 9.00€/m → Coût produit = 1.85€
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Impact : +0.15€ par produit (+8.8%)
```

**Action** : Ajuster le prix de vente ou négocier avec fournisseur

### 3. Calcul du seuil de rentabilité

**Formule** :
```
Seuil de rentabilité = Coûts fixes / (Prix de vente - Coût variable)
```

**Exemple** :
```
Prix de vente : 3.00€
Coût matières (variable) : 1.70€
Coûts fixes mensuels : 500€
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Seuil : 500 / (3.00 - 1.70) = 385 unités/mois
```

---

## 🗄️ Structure de la base de données

### Tables créées

#### 1. `raw_materials`
```sql
CREATE TABLE raw_materials (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL DEFAULT 'unité',
  current_stock REAL NOT NULL DEFAULT 0,
  unit_cost REAL NOT NULL DEFAULT 0,
  notes TEXT
);
```

#### 2. `product_materials`
```sql
CREATE TABLE product_materials (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL,
  raw_material_id INTEGER NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id),
  UNIQUE(product_id, raw_material_id)
);
```

#### 3. `raw_material_purchases`
```sql
CREATE TABLE raw_material_purchases (
  id INTEGER PRIMARY KEY,
  raw_material_id INTEGER NOT NULL,
  supplier_id INTEGER,
  company_id INTEGER,
  date TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_cost REAL NOT NULL,
  total_cost REAL NOT NULL,
  paid REAL NOT NULL DEFAULT 0,
  due REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

---

## 🔮 Évolutions futures possibles

### Court terme
- [ ] Alertes stock matières premières bas
- [ ] Export BOM vers CSV/PDF
- [ ] Import matières depuis fichier

### Moyen terme
- [ ] Versions de nomenclature (historique)
- [ ] Calcul du coût de production en série
- [ ] Prévisions de consommation
- [ ] Optimisation des commandes

### Long terme
- [ ] Intégration fournisseurs (API)
- [ ] Gestion des lots de matières
- [ ] Traçabilité complète
- [ ] IA pour optimisation des coûts

---

## 💡 Bonnes pratiques

### 1. Mise à jour régulière
- Enregistrer tous les achats de matières
- Vérifier les coûts moyens régulièrement
- Ajuster les prix de vente si besoin

### 2. Précision des nomenclatures
- Être précis sur les quantités
- Inclure TOUTES les matières (même petites)
- Mettre à jour si recette change

### 3. Suivi des marges
- Vérifier la rentabilité après chaque mise à jour
- Identifier les produits à marge faible
- Optimiser ou supprimer les produits non rentables

### 4. Stocks
- Faire des inventaires réguliers
- Comparer stock réel vs théorique
- Ajuster si écarts importants

---

## 📊 Indicateurs de performance

### Marge globale par produit
```
Marge (%) = (Prix vente - Coût réel) / Prix vente × 100
```

**Interprétation** :
- > 50% : Excellente marge
- 30-50% : Bonne marge
- 10-30% : Marge correcte
- < 10% : Marge faible (à surveiller)

### Coût total de production
```
Pour N unités = Σ (Quantité matière × Coût unitaire) × N
```

### Impact des variations de prix
```
Sensibilité = ∂Coût total / ∂Prix matière
```

---

## 🆘 Dépannage

### Coût réel affiché "..." ?
➡️ Aucune nomenclature définie → Cliquer sur **🧱 Composition**

### Stock négatif ?
➡️ Ventes sans enregistrement d'achats → Faire inventaire et ajuster

### Coût moyen incohérent ?
➡️ Vérifier les achats enregistrés → Corriger les erreurs

### Marge négative ?
➡️ Prix de vente trop bas OU coût matières trop élevé
➡️ Action : Augmenter prix OU négocier avec fournisseurs

---

**Développé avec ❤️ pour optimiser la rentabilité de Manouk**

# ✅ APPLICATION RESTAURÉE - IDENTIQUE À L'ANCIENNE

## 🎯 Ce qui a été fait

### 1. ✏️ Édition inline (comme avant)
- Cliquez sur "✏️ Éditer" dans n'importe quel tableau
- La ligne se transforme en formulaire éditable
- Boutons 💾 Sauvegarder et ✖️ Annuler

**Onglets avec édition inline :**
- ✅ Produits
- ✅ Matières premières  
- ✅ Fournisseurs
- ✅ Sociétés
- ✅ Clients

### 2. 💰 Trésorerie prévisionnelle (EXACTEMENT comme avant)
- ✅ **Grid d'inputs** par produit × 6 mois (pas une quantité globale !)
- ✅ Chaque produit a 6 cases pour saisir les quantités mensuelles
- ✅ Bouton "🔮 Calculer la simulation"
- ✅ Graphique avec 4 courbes (CA, Coûts matières, URSSAF, Solde cumulé)
- ✅ Tableau détaillé avec 8 colonnes
- ✅ Stats résumées en bas

**Calculs automatiques :**
- CA = prix × quantité
- Coûts matières = calculés via BOM (nomenclatures)
- URSSAF = 22% du CA
- Résultat = CA - Coûts - URSSAF
- Solde cumulé mois par mois

### 3. 📊 URSSAF automatique

**⚠️ ACTION REQUISE : Exécutez le script SQL**

L'URSSAF sera calculé automatiquement à 22% sur chaque facture APRÈS avoir exécuté le script SQL.

**Comment faire :**
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur "SQL Editor" (menu gauche)
4. Ouvrez le fichier `scripts/add-urssaf-columns.sql`
5. Copiez TOUT le contenu (Ctrl+A, Ctrl+C)
6. Collez dans le SQL Editor (Ctrl+V)
7. Cliquez sur **RUN** (bouton vert en bas à droite)
8. Vérifiez : "Success" doit apparaître

**Ce que fait le script :**
- Ajoute 4 colonnes à la table `invoices`
- Crée un **trigger automatique** qui calcule 22% du total à chaque création/modification de facture
- L'URSSAF sera alors calculé automatiquement, comme dans votre ancienne app

**Sans ce script, l'URSSAF ne sera pas calculé !**

---

## 🎯 Différences vs ancienne app

**AUCUNE !** L'interface est maintenant identique.

- ✅ Même grille d'inputs pour la trésorerie
- ✅ Même tableau avec 8 colonnes
- ✅ Même graphique
- ✅ Même édition inline
- ✅ URSSAF automatique (après exécution du script)

**En PLUS, vous avez :**
- ✅ Design moderne et responsive
- ✅ Accessible depuis n'importe où (web)
- ✅ Base de données cloud sécurisée
- ✅ Pas besoin d'installer Electron

---

## 📝 Testez maintenant

### Test 1 : Trésorerie
1. Allez dans "💰 Trésorerie prévisionnelle"
2. Vous devez voir une grille avec vos produits
3. Sous chaque produit, 6 cases pour les 6 prochains mois
4. Saisissez des quantités (ex: 10, 15, 20, etc.)
5. Cliquez sur "🔮 Calculer la simulation"
6. ✅ Le graphique, le tableau et les stats doivent s'afficher

### Test 2 : Édition inline
1. Allez dans "⚙️ Paramètres" → "Produits"
2. Cliquez sur "✏️ Éditer" sur n'importe quel produit
3. La ligne devient éditable
4. Modifiez le nom ou le prix
5. Cliquez sur "💾 Sauvegarder"
6. ✅ La modification doit être enregistrée

### Test 3 : URSSAF (après script SQL)
1. Créez une nouvelle facture de 1000 €
2. L'URSSAF de 220 € (22%) doit être calculé automatiquement
3. Dans le Dashboard, la carte "URSSAF" doit afficher le total dû

---

## ❓ Questions ?

**Trésorerie pas comme avant ?**
➡️ Actualisez la page (F5) après mes modifications

**URSSAF pas calculé ?**
➡️ Exécutez le script SQL dans Supabase (étape 3 ci-dessus)

**Modifications ne se sauvent pas ?**
➡️ Vérifiez la console (F12) pour voir les erreurs

---

**Tout est maintenant identique à votre ancienne app locale ! 🎉**

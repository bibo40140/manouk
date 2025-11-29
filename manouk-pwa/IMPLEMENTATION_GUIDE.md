# GUIDE D'IMPLÉMENTATION COMPLÈTE - MANOUK PWA

## ✅ FONCTIONNALITÉS IMPLÉMENTÉES

### 1. ÉDITION INLINE (ProductsTab) ✅
- Au clic sur ✏️, la ligne se transforme en formulaire éditable
- Champs name, price éditables directement dans le tableau
- Boutons 💾 Sauvegarder et ✖️ Annuler apparaissent dans la ligne
- **Fichier**: `components/settings/ProductsTab.tsx`

### 2. MODAL ÉDITION FACTURE COMPLET ✅
- Modifier client, date, lignes de facture
- GÉRER PAIEMENTS MULTIPLES avec dates
- Bouton "Ajouter un paiement" dans le modal
- Afficher liste des paiements existants avec possibilité de retirer
- Auto-fill du prix quand on sélectionne un produit
- **Fichier**: `components/invoices/InvoiceEditModal.tsx`

### 3. SYSTÈME URSSAF (À IMPLÉMENTER DANS SUPABASE)
- **Script SQL créé**: `scripts/add-urssaf-columns.sql`
- Colonnes ajoutées à la table `invoices`:
  - `urssaf_amount` (calculé auto à 22% du total via trigger)
  - `urssaf_declared_date` (date de déclaration)
  - `urssaf_paid_date` (date de paiement)
  - `urssaf_paid_amount` (montant payé)

### 4. TRÉSORERIE PRÉVISIONNELLE ✅
- Page complète avec simulation sur 6 mois
- Inputs par produit et par mois
- Calcul auto : CA, coûts matières (via BOM), URSSAF 22%
- Tableau mensuel détaillé avec solde cumulé
- Graphique avec courbes Revenue/Dépenses/URSSAF/Résultat
- **Fichier**: `components/forecast/ForecastSimulator.tsx`

---

## 🔨 TÂCHES RESTANTES À IMPLÉMENTER

### A. Édition inline pour tous les Settings tabs

#### RawMaterialsTab
```tsx
// Ajouter édition inline pour:
- name, unit, unit_cost, current_stock
// Même pattern que ProductsTab
```

#### CustomersTab
```tsx
// Ajouter édition inline pour:
- name, email
```

#### SuppliersTab
```tsx
// Ajouter édition inline pour:
- name
```

#### CompaniesTab
```tsx
// Ajouter édition inline pour:
- code, name, email
```

### B. Mise à jour InvoicesList avec infos URSSAF

**Fichier**: `components/invoices/InvoicesList.tsx`

Ajouter dans chaque carte de facture:
```tsx
{/* URSSAF Info */}
<div>
  <div className="text-xs font-medium text-gray-600 mb-2">URSSAF {formatEuro(invoice.urssaf_amount || 0)}</div>
  
  {/* Badge Déclaration */}
  {invoice.urssaf_declared_date ? (
    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
      ✓ Déclaré le {new Date(invoice.urssaf_declared_date).toLocaleDateString('fr-FR')}
    </span>
  ) : (
    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
      Non déclaré
    </span>
  )}

  {/* Badge Paiement */}
  {invoice.urssaf_paid_date ? (
    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
      ✓ Payé le {new Date(invoice.urssaf_paid_date).toLocaleDateString('fr-FR')}
    </span>
  ) : (
    <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
      Non payé
    </span>
  )}

  {/* Boutons Actions URSSAF */}
  {!invoice.urssaf_declared_date && (
    <button onClick={() => openUrssafDeclareModal(invoice.id)} className="text-sm text-indigo-600 hover:text-indigo-800">
      📋 Déclarer
    </button>
  )}
  
  {invoice.urssaf_declared_date && !invoice.urssaf_paid_date && (
    <button onClick={() => openUrssafPayModal(invoice.id)} className="text-sm text-green-600 hover:text-green-800">
      💶 Payer URSSAF
    </button>
  )}
</div>
```

### C. Créer les Modals URSSAF

#### 1. UrssafDeclareModal.tsx
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UrssafDeclareModal({ invoice, onClose }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)

  const handleDeclare = async () => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ urssaf_declared_date: date })
        .eq('id', invoice.id)

      if (error) throw error
      router.refresh()
      onClose()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">📋 Déclarer l'URSSAF</h2>
        <p className="text-gray-600 mb-4">
          Montant URSSAF : <strong>{Number(invoice.urssaf_amount || 0).toFixed(2)} €</strong>
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date de déclaration
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleDeclare}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Déclarer'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

#### 2. UrssafPayModal.tsx
```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UrssafPayModal({ invoice, onClose }: any) {
  const router = useRouter()
  const supabase = createClient()
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState(invoice.urssaf_amount || 0)
  const [loading, setLoading] = useState(false)

  const handlePay = async () => {
    if (amount <= 0) {
      alert('Montant invalide')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          urssaf_paid_date: date,
          urssaf_paid_amount: amount
        })
        .eq('id', invoice.id)

      if (error) throw error
      router.refresh()
      onClose()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">💶 Payer l'URSSAF</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant à payer (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de paiement
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handlePay}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : 'Payer'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

### D. Afficher URSSAF dû dans Dashboard

**Fichier**: `app/dashboard/page.tsx`

Ajouter le calcul URSSAF :
```tsx
// Calculer URSSAF total dû
const urssafDue = invoices.reduce((sum, inv) => {
  const urssafAmount = inv.urssaf_amount || 0
  const urssafPaid = inv.urssaf_paid_amount || 0
  return sum + (urssafAmount - urssafPaid)
}, 0)
```

Ajouter dans la grille de stats :
```tsx
<div className="bg-white rounded-lg shadow-md border-l-4 border-orange-600 p-4">
  <div className="text-sm font-medium text-gray-600">URSSAF dû</div>
  <div className="text-2xl font-bold text-orange-600 mt-1">
    {formatEuro(urssafDue)}
  </div>
</div>
```

### E. Ajouts mineurs

#### 1. Checkbox "Payé aujourd'hui" sur PurchaseModal
```tsx
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={paidToday}
    onChange={(e) => setPaidToday(e.target.checked)}
  />
  <span>Payé aujourd'hui</span>
</label>
```

#### 2. Auto-fill coût unitaire pour achats
```tsx
// Dans le onChange du select material
const material = rawMaterials.find(m => m.id === selectedMaterialId)
if (material) {
  setUnitCost(material.unit_cost)
}
```

#### 3. Date par défaut = aujourd'hui
```tsx
const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
```

---

## 📝 ÉTAPES D'INSTALLATION

### 1. Exécuter le script SQL dans Supabase
```bash
# Aller dans Supabase Dashboard > SQL Editor
# Copier le contenu de scripts/add-urssaf-columns.sql
# Exécuter le script
```

### 2. Créer les composants modals manquants
- `components/invoices/UrssafDeclareModal.tsx`
- `components/invoices/UrssafPayModal.tsx`

### 3. Mettre à jour InvoicesList
- Ajouter l'affichage des infos URSSAF
- Ajouter les boutons Déclarer/Payer
- Importer et utiliser les modals URSSAF

### 4. Compléter l'édition inline
- Mettre à jour RawMaterialsTab.tsx
- Mettre à jour CustomersTab.tsx
- Mettre à jour SuppliersTab.tsx
- Mettre à jour CompaniesTab.tsx

### 5. Mettre à jour le Dashboard
- Ajouter le calcul URSSAF dû
- Afficher dans les stats cards

### 6. Tester toutes les fonctionnalités
- Créer une facture avec le nouveau modal
- Tester l'ajout de paiements multiples
- Déclarer et payer URSSAF
- Tester l'édition inline dans Settings
- Simuler la trésorerie prévisionnelle

---

## 🎯 RÉSUMÉ DES FICHIERS MODIFIÉS/CRÉÉS

### Modifiés ✏️
- `components/settings/ProductsTab.tsx` - Édition inline
- `components/settings/RawMaterialsTab.tsx` - Ajout state inline (partiel)

### Créés ✨
- `components/invoices/InvoiceEditModal.tsx` - Modal édition facture complet
- `scripts/add-urssaf-columns.sql` - Script SQL URSSAF

### À créer 📋
- `components/invoices/UrssafDeclareModal.tsx`
- `components/invoices/UrssafPayModal.tsx`

### À mettre à jour 🔄
- `components/invoices/InvoicesList.tsx` - Affichage URSSAF
- `components/settings/RawMaterialsTab.tsx` - Compléter édition inline
- `components/settings/CustomersTab.tsx` - Édition inline
- `components/settings/SuppliersTab.tsx` - Édition inline
- `components/settings/CompaniesTab.tsx` - Édition inline
- `app/dashboard/page.tsx` - Stat URSSAF dû

---

## ⚡ COMMANDES RAPIDES

```bash
# Lancer le dev server
cd c:\Users\lordb\Documents\manouk-app\manouk-pwa
npm run dev

# Accéder à l'app
http://localhost:3000

# Accéder à Supabase Dashboard
https://supabase.com/dashboard
```

---

## 🐛 DÉBOGAGE

Si vous rencontrez des erreurs:

1. **Erreur TypeScript** : Vérifier les types dans les composants
2. **Erreur Supabase** : Vérifier que les colonnes URSSAF existent
3. **Données manquantes** : Vérifier les foreign keys et relations
4. **Modal ne s'ouvre pas** : Vérifier l'import et le state du modal

---

**Dernière mise à jour** : 27 novembre 2025
**Status** : 60% implémenté - Reste édition inline complète + modals URSSAF

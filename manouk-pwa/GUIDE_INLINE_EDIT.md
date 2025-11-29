# 📝 GUIDE RAPIDE : Compléter l'édition inline

## Pattern à suivre (basé sur ProductsTab.tsx)

### 1. Ajouter les states dans le composant

```tsx
const [inlineEditId, setInlineEditId] = useState<string | null>(null)
const [inlineData, setInlineData] = useState<any>({})
```

### 2. Créer les fonctions d'édition

```tsx
const startInlineEdit = (item: any) => {
  setInlineEditId(item.id)
  setInlineData({
    // Copier les champs éditables
    name: item.name,
    email: item.email,
    // etc...
  })
}

const cancelInlineEdit = () => {
  setInlineEditId(null)
  setInlineData({})
}

const saveInlineEdit = async (id: string) => {
  try {
    const { error } = await supabase
      .from('NOM_DE_LA_TABLE') // customers, suppliers, companies, raw_materials
      .update(inlineData)
      .eq('id', id)

    if (error) throw error
    setInlineEditId(null)
    setInlineData({})
    router.refresh()
  } catch (err: any) {
    alert('Erreur: ' + err.message)
  }
}
```

### 3. Modifier le rendu du tableau

```tsx
<tbody>
  {items.map((item: any) => (
    <tr key={item.id}>
      {inlineEditId === item.id ? (
        <>
          {/* MODE ÉDITION */}
          <td>
            <input
              type="text"
              value={inlineData.name}
              onChange={(e) => setInlineData({...inlineData, name: e.target.value})}
              className="w-full px-2 py-1 border border-gray-300 rounded"
            />
          </td>
          {/* Répéter pour chaque champ éditable */}
          <td>
            <button onClick={() => saveInlineEdit(item.id)}>💾 Sauvegarder</button>
            <button onClick={cancelInlineEdit}>✖️ Annuler</button>
          </td>
        </>
      ) : (
        <>
          {/* MODE AFFICHAGE */}
          <td>{item.name}</td>
          <td>
            <button onClick={() => startInlineEdit(item)}>✏️ Éditer</button>
          </td>
        </>
      )}
    </tr>
  ))}
</tbody>
```

---

## Exemples spécifiques

### RawMaterialsTab.tsx

**Champs à éditer** : name, unit, unit_cost, stock

```tsx
const startInlineEdit = (material: any) => {
  setInlineEditId(material.id)
  setInlineData({
    name: material.name,
    unit: material.unit,
    unit_cost: material.unit_cost,
    stock: material.stock
  })
}
```

**Rendu édition** :
```tsx
<td>
  <input
    type="text"
    value={inlineData.name}
    onChange={(e) => setInlineData({...inlineData, name: e.target.value})}
    className="w-full px-2 py-1 border border-gray-300 rounded"
  />
</td>
<td>
  <input
    type="text"
    value={inlineData.unit}
    onChange={(e) => setInlineData({...inlineData, unit: e.target.value})}
    className="w-full px-2 py-1 border border-gray-300 rounded"
  />
</td>
<td>
  <input
    type="number"
    step="0.01"
    value={inlineData.unit_cost}
    onChange={(e) => setInlineData({...inlineData, unit_cost: e.target.value})}
    className="w-full px-2 py-1 border border-gray-300 rounded"
  />
</td>
<td>
  <input
    type="number"
    step="0.01"
    value={inlineData.stock}
    onChange={(e) => setInlineData({...inlineData, stock: e.target.value})}
    className="w-full px-2 py-1 border border-gray-300 rounded"
  />
</td>
```

---

### CustomersTab.tsx

**Champs à éditer** : name, email

```tsx
const startInlineEdit = (customer: any) => {
  setInlineEditId(customer.id)
  setInlineData({
    name: customer.name,
    email: customer.email
  })
}
```

**Table name** : `'customers'`

---

### SuppliersTab.tsx

**Champs à éditer** : name

```tsx
const startInlineEdit = (supplier: any) => {
  setInlineEditId(supplier.id)
  setInlineData({
    name: supplier.name
  })
}
```

**Table name** : `'suppliers'`

---

### CompaniesTab.tsx

**Champs à éditer** : code, name, email

```tsx
const startInlineEdit = (company: any) => {
  setInlineEditId(company.id)
  setInlineData({
    code: company.code,
    name: company.name,
    email: company.email
  })
}
```

**Table name** : `'companies'`

---

## Checklist par composant

### ✅ RawMaterialsTab
- [ ] Ajouter states (déjà fait partiellement)
- [ ] Ajouter fonctions startInlineEdit, cancelInlineEdit, saveInlineEdit
- [ ] Modifier le tbody avec condition inlineEditId === material.id
- [ ] Tester l'édition

### ✅ CustomersTab
- [ ] Créer le composant s'il n'existe pas
- [ ] Ajouter states
- [ ] Ajouter fonctions édition
- [ ] Modifier le rendu
- [ ] Tester

### ✅ SuppliersTab
- [ ] Créer le composant s'il n'existe pas
- [ ] Ajouter states
- [ ] Ajouter fonctions édition
- [ ] Modifier le rendu
- [ ] Tester

### ✅ CompaniesTab
- [ ] Créer le composant s'il n'existe pas
- [ ] Ajouter states
- [ ] Ajouter fonctions édition
- [ ] Modifier le rendu
- [ ] Tester

---

## Tips

1. **Copier ProductsTab.tsx** comme base et adapter
2. **Vérifier le nom de la table** dans Supabase
3. **Tester sur 1 item** avant de finaliser
4. **Utiliser les bons types d'input** (text, number, email)
5. **Ne pas oublier router.refresh()** après save

---

**Temps estimé par composant** : 5-10 minutes
**Temps total** : 30-45 minutes

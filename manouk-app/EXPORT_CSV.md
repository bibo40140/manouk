# 📥 Export CSV - Guide d'implémentation

## Vue d'ensemble
Fonctionnalité permettant d'exporter les factures et achats au format CSV pour analyse externe (Excel, LibreOffice, etc.).

---

## 🎯 Fonctionnalités à implémenter

### 1. Export des factures
**Colonnes** :
- Numéro facture
- Date
- Société
- Client
- Montant total
- Montant payé
- Montant dû
- URSSAF
- État (Payé/En attente)

### 2. Export des achats
**Colonnes** :
- Date
- Société
- Fournisseur
- Produit
- Quantité
- Coût unitaire
- Coût total
- Montant payé
- Montant dû

### 3. Export du dashboard
**Colonnes** :
- Période (mois)
- Chiffre d'affaires
- Achats totaux
- URSSAF
- Résultat net
- Créances
- Dettes

---

## 🔧 Implémentation technique

### Backend (main.js)

```javascript
// Ajouter après les autres IPC handlers

function arrayToCSV(data, headers) {
  if (!data || data.length === 0) return '';
  
  // CSV header
  let csv = headers.join(';') + '\n';
  
  // CSV rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains semicolon
      const escaped = String(value).replace(/"/g, '""');
      return escaped.includes(';') ? `"${escaped}"` : escaped;
    });
    csv += values.join(';') + '\n';
  });
  
  return csv;
}

ipcMain.handle('exportInvoicesCSV', async () => {
  try {
    const db = getDb();
    const invoices = db.prepare(`
      SELECT 
        i.invoice_number,
        i.date,
        c.name as company_name,
        cu.name as customer_name,
        i.total,
        i.paid,
        i.due,
        i.urssaf_due,
        CASE WHEN i.due = 0 THEN 'Payé' ELSE 'En attente' END as status
      FROM invoices i
      LEFT JOIN companies c ON i.company_id = c.id
      LEFT JOIN customers cu ON i.customer_id = cu.id
      ORDER BY i.date DESC
    `).all();
    
    const headers = [
      'invoice_number', 'date', 'company_name', 'customer_name',
      'total', 'paid', 'due', 'urssaf_due', 'status'
    ];
    
    return { ok: true, csv: arrayToCSV(invoices, headers) };
  } catch (error) {
    console.error('Export invoices CSV error:', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('exportPurchasesCSV', async () => {
  try {
    const db = getDb();
    const purchases = db.prepare(`
      SELECT 
        p.date,
        c.name as company_name,
        s.name as supplier_name,
        pr.name as product_name,
        p.qty,
        p.unit_cost,
        p.total_cost,
        p.paid,
        p.due
      FROM purchases p
      LEFT JOIN companies c ON p.company_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN products pr ON p.product_id = pr.id
      ORDER BY p.date DESC
    `).all();
    
    const headers = [
      'date', 'company_name', 'supplier_name', 'product_name',
      'qty', 'unit_cost', 'total_cost', 'paid', 'due'
    ];
    
    return { ok: true, csv: arrayToCSV(purchases, headers) };
  } catch (error) {
    console.error('Export purchases CSV error:', error);
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('saveCSVFile', async (event, { filename, content }) => {
  try {
    const { dialog } = require('electron');
    const fs = require('fs');
    const path = require('path');
    
    const result = await dialog.showSaveDialog({
      title: 'Enregistrer le fichier CSV',
      defaultPath: path.join(app.getPath('downloads'), filename),
      filters: [
        { name: 'Fichiers CSV', extensions: ['csv'] },
        { name: 'Tous les fichiers', extensions: ['*'] }
      ]
    });
    
    if (result.canceled) {
      return { ok: false, error: 'Annulé par l\'utilisateur' };
    }
    
    fs.writeFileSync(result.filePath, content, 'utf8');
    return { ok: true, filePath: result.filePath };
  } catch (error) {
    console.error('Save CSV file error:', error);
    return { ok: false, error: error.message };
  }
});
```

### Preload (preload.js)

```javascript
// Ajouter aux méthodes exposées
contextBridge.exposeInMainWorld('api', {
  // ... existing methods
  exportInvoicesCSV: () => ipcRenderer.invoke('exportInvoicesCSV'),
  exportPurchasesCSV: () => ipcRenderer.invoke('exportPurchasesCSV'),
  saveCSVFile: (data) => ipcRenderer.invoke('saveCSVFile', data)
});
```

### Frontend (renderer.js)

```javascript
// Ajouter ces fonctions

async function exportInvoicesToCSV() {
  try {
    const result = await window.api.exportInvoicesCSV();
    if (!result.ok) {
      showToast('Erreur export : ' + result.error, 'error');
      return;
    }
    
    const filename = `factures_${new Date().toISOString().split('T')[0]}.csv`;
    const saveResult = await window.api.saveCSVFile({
      filename: filename,
      content: result.csv
    });
    
    if (saveResult.ok) {
      showToast('Export réussi : ' + saveResult.filePath, 'success');
    } else {
      showToast('Erreur sauvegarde : ' + saveResult.error, 'error');
    }
  } catch (error) {
    console.error('Export error:', error);
    showToast('Erreur export : ' + error.message, 'error');
  }
}

async function exportPurchasesToCSV() {
  try {
    const result = await window.api.exportPurchasesCSV();
    if (!result.ok) {
      showToast('Erreur export : ' + result.error, 'error');
      return;
    }
    
    const filename = `achats_${new Date().toISOString().split('T')[0]}.csv`;
    const saveResult = await window.api.saveCSVFile({
      filename: filename,
      content: result.csv
    });
    
    if (saveResult.ok) {
      showToast('Export réussi : ' + saveResult.filePath, 'success');
    } else {
      showToast('Erreur sauvegarde : ' + saveResult.error, 'error');
    }
  } catch (error) {
    console.error('Export error:', error);
    showToast('Erreur export : ' + error.message, 'error');
  }
}

// Attacher aux boutons
document.getElementById('btn-export-invoices').addEventListener('click', exportInvoicesToCSV);
document.getElementById('btn-export-purchases').addEventListener('click', exportPurchasesToCSV);
```

### UI (index.html)

```html
<!-- Ajouter dans la section Factures -->
<div style="display:flex;gap:8px;margin-top:12px">
  <button id="btn-export-invoices" class="primary" style="padding:10px 16px">
    📥 Exporter les factures (CSV)
  </button>
</div>

<!-- Ajouter dans la section Achats -->
<div style="display:flex;gap:8px;margin-top:12px">
  <button id="btn-export-purchases" class="primary" style="padding:10px 16px">
    📥 Exporter les achats (CSV)
  </button>
</div>
```

---

## 📋 Format CSV

### Séparateur
- **France** : Point-virgule (`;`) pour compatibilité Excel français
- **International** : Virgule (`,`) - à adapter selon besoin

### Encodage
- **UTF-8 avec BOM** pour Excel (meilleure compatibilité caractères accentués)

### Échappement
- Guillemets doublés (`""`) pour les valeurs contenant des séparateurs
- Valeurs entourées de guillemets si elles contiennent `;` ou `\n`

---

## ✅ Tests à effectuer

1. **Export factures vide** : Vérifier comportement sans données
2. **Export avec caractères spéciaux** : Accents, guillemets, points-virgules
3. **Grandes quantités** : Tester avec >1000 factures
4. **Ouverture Excel** : Vérifier que les colonnes sont bien séparées
5. **Annulation** : Tester le bouton "Annuler" du dialog
6. **Permissions** : Vérifier écriture dans dossier protégé

---

## 🎨 Améliorations possibles

### Filtrage avancé
- Export par période (date début/fin)
- Export par société
- Export par client/fournisseur
- Export factures payées/impayées uniquement

### Formats additionnels
- **Excel (XLSX)** : Avec mise en forme, totaux, formules
- **PDF** : Tableau formaté
- **JSON** : Pour import dans d'autres systèmes

### Options d'export
- Choix des colonnes à exporter
- Ordre des colonnes personnalisable
- Filtres multiples combinés

### Export automatique
- Planification (quotidien, hebdomadaire, mensuel)
- Envoi par email automatique
- Upload vers cloud (Dropbox, Google Drive)

---

## 🔐 Sécurité

### Données sensibles
- Vérifier que les exports ne contiennent pas d'informations confidentielles non souhaitées
- Possibilité d'anonymiser certains champs (clients, montants)

### Permissions fichiers
- Exports dans dossier utilisateur uniquement
- Pas d'écriture dans Program Files

---

## 📚 Ressources

- [Format CSV RFC 4180](https://tools.ietf.org/html/rfc4180)
- [Electron dialog API](https://www.electronjs.org/docs/latest/api/dialog)
- [Node.js fs module](https://nodejs.org/api/fs.html)

---

**Note** : Cette fonctionnalité n'est pas encore implémentée. Utilisez ce guide pour l'ajouter quand nécessaire.

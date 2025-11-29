const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Chemin vers la base de données Electron
const dbPath = path.join(__dirname, '..', '..', 'manouk-app', 'manouk.db');

// Ouvrir la base de données
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('❌ Erreur ouverture base de données:', err.message);
    process.exit(1);
  }
  console.log('✅ Base de données Electron ouverte');
});

const exportData = {};

// Fonction pour lire une table
function readTable(tableName) {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) {
        console.log(`⚠️  Table ${tableName} n'existe pas ou est vide`);
        resolve([]);
      } else {
        console.log(`✅ ${tableName}: ${rows.length} lignes`);
        resolve(rows);
      }
    });
  });
}

// Export des données
async function exportAllData() {
  try {
    // Tables principales
    exportData.companies = await readTable('companies');
    exportData.customers = await readTable('customers');
    exportData.suppliers = await readTable('suppliers');
    exportData.raw_materials = await readTable('raw_materials');
    exportData.products = await readTable('products');
    exportData.product_materials = await readTable('product_materials');
    exportData.invoices = await readTable('invoices');
    exportData.invoice_lines = await readTable('invoice_lines');
    exportData.payments = await readTable('payments');
    exportData.purchases = await readTable('purchases');
    exportData.urssaf_declarations = await readTable('urssaf_declarations');
    exportData.email_settings = await readTable('email_settings');

    // Sauvegarder dans un fichier JSON
    const outputPath = path.join(__dirname, 'exported-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    
    console.log('\n🎉 Export terminé !');
    console.log(`📁 Fichier créé: ${outputPath}`);
    console.log('\n📊 Résumé:');
    Object.keys(exportData).forEach(table => {
      console.log(`  - ${table}: ${exportData[table].length} lignes`);
    });

  } catch (error) {
    console.error('❌ Erreur export:', error);
  } finally {
    db.close();
  }
}

exportAllData();

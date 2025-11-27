const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.env.APPDATA, 'manouk-gestion', 'manouk.db');

try {
  const db = new Database(dbPath, { readonly: true });
  
  // Extraire SMTP
  const smtpRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('smtp');
  
  // Extraire Company info
  const companyRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('company');
  
  const config = {
    smtp: smtpRow ? JSON.parse(smtpRow.value) : null,
    company: companyRow ? JSON.parse(companyRow.value) : null
  };
  
  const outputPath = path.join(__dirname, 'config-backup.json');
  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
  
  console.log('✅ Configuration sauvegardée dans: config-backup.json');
  console.log('\nContenu:');
  console.log(JSON.stringify(config, null, 2));
  
  db.close();
} catch (err) {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
}

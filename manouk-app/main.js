const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const nodemailer = require('nodemailer');
const fs = require('fs');
const os = require('os');

const db = new Database('manouk.db');

function initDb() {
  // Clients
  db.prepare(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT
    );
  `).run();

  // Produits
  db.prepare(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0
    );
  `).run();

  // Fournisseurs
  db.prepare(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `).run();

  // Settings (clé/valeur JSON)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `).run();

  // Achats fournisseurs (entrée de stock)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      qty REAL NOT NULL,
      unit_cost REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `).run();

  // Paiements fournisseurs
  db.prepare(`
    CREATE TABLE IF NOT EXISTS purchase_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT,
      note TEXT,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id)
    );
  `).run();

  // Factures clients
  db.prepare(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      total REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );
  `).run();

  // Lignes de facture
  db.prepare(`
    CREATE TABLE IF NOT EXISTS invoice_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      qty REAL NOT NULL,
      unit_price REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `).run();

  // Si la colonne note n'existe pas (migration), l'ajouter
  try {
    const cols = db.prepare("PRAGMA table_info(invoice_lines)").all();
    const hasNote = cols.some(c => c.name === 'note');
    if (!hasNote) {
      db.prepare('ALTER TABLE invoice_lines ADD COLUMN note TEXT').run();
    }
  } catch (e) {
    // ignore
  }

  // Paiements clients
  db.prepare(`
    CREATE TABLE IF NOT EXISTS invoice_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      method TEXT,
      note TEXT,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );
  `).run();

  // URSSAF par facture
  db.prepare(`
    CREATE TABLE IF NOT EXISTS urssaf (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER UNIQUE NOT NULL,
      amount REAL NOT NULL,
      declared_date TEXT,
      paid REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id)
    );
  `).run();

  // --- Données de base pour toi ---

  // Client Marie Victoire
  const existingCustomer = db
    .prepare('SELECT id FROM customers WHERE name = ?')
    .get('Marie Victoire');
  if (!existingCustomer) {
    db.prepare('INSERT INTO customers (name) VALUES (?)')
      .run('Marie Victoire');
  }

  // Produit "Étuis à lunettes" à 3€
  const existingProduct = db
    .prepare('SELECT id FROM products WHERE name = ?')
    .get('Étuis à lunettes');
  if (!existingProduct) {
    db.prepare('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)')
      .run('Étuis à lunettes', 3.0, 0);
  }

  // Fournisseurs de base
  const suppliers = ['Elena (liner)', 'Fournisseur vis', 'Fournisseur pailles'];
  const getSupplier = db.prepare('SELECT id FROM suppliers WHERE name = ?');
  const insertSupplier = db.prepare('INSERT INTO suppliers (name) VALUES (?)');

  suppliers.forEach((name) => {
    const row = getSupplier.get(name);
    if (!row) insertSupplier.run(name);
  });
}

function getDashboardData() {
  const customers = db.prepare('SELECT * FROM customers ORDER BY name').all();
  const products = db.prepare('SELECT * FROM products ORDER BY name').all();
  const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name').all();

  const invoices = db.prepare(`
    SELECT
      i.id,
      i.date,
      i.total,
      c.name AS customer_name,
      IFNULL((
        SELECT SUM(amount) FROM invoice_payments p
        WHERE p.invoice_id = i.id
      ), 0) AS paid,
      i.total - IFNULL((
        SELECT SUM(amount) FROM invoice_payments p
        WHERE p.invoice_id = i.id
      ), 0) AS due,
      IFNULL(u.amount, 0) AS urssaf_amount,
      u.declared_date AS urssaf_declared_date,
      IFNULL(u.paid, 0) AS urssaf_paid,
      (IFNULL(u.amount,0) - IFNULL(u.paid,0)) AS urssaf_due
    FROM invoices i
    JOIN customers c ON c.id = i.customer_id
    LEFT JOIN urssaf u ON u.invoice_id = i.id
    ORDER BY i.date DESC, i.id DESC
  `).all();

  const purchases = db.prepare(`
    SELECT
      pu.id,
      pu.date,
      s.name AS supplier_name,
      pr.name AS product_name,
      pu.qty,
      pu.unit_cost,
      (pu.qty * pu.unit_cost) AS total_cost,
      IFNULL((
        SELECT SUM(amount) FROM purchase_payments pp
        WHERE pp.purchase_id = pu.id
      ), 0) AS paid,
      (pu.qty * pu.unit_cost) - IFNULL((
        SELECT SUM(amount) FROM purchase_payments pp
        WHERE pp.purchase_id = pu.id
      ), 0) AS due
    FROM purchases pu
    JOIN suppliers s ON s.id = pu.supplier_id
    JOIN products pr ON pr.id = pu.product_id
    ORDER BY pu.date DESC, pu.id DESC
  `).all();

  // Totaux clients / fournisseurs (paiements déjà effectués)
  const totalClients = db.prepare('SELECT IFNULL(SUM(amount), 0) AS total FROM invoice_payments').get().total;
  const totalFournisseurs = db.prepare('SELECT IFNULL(SUM(amount), 0) AS total FROM purchase_payments').get().total;

  // URSSAF totals
  const urssafTotals = db.prepare('SELECT IFNULL(SUM(amount),0) as total, IFNULL(SUM(paid),0) as paid FROM urssaf').get();
  const urssaf_total = urssafTotals.total;
  const urssaf_paid = urssafTotals.paid;
  const urssaf_due = urssaf_total - urssaf_paid;

  // CA (Chiffre d'affaires) : total des factures
  const ca_total_row = db.prepare('SELECT IFNULL(SUM(total),0) as total FROM invoices').get();
  const ca_total = ca_total_row ? ca_total_row.total : 0;

  // Créances (montant restant à encaisser sur factures)
  const receivables_total = invoices.reduce((s, i) => s + (i.due || 0), 0);

  // Achats totaux et dettes fournisseurs
  const purchases_total = purchases.reduce((s, p) => s + (p.total_cost || 0), 0);
  const payables_total = purchases.reduce((s, p) => s + (p.due || 0), 0);

  // Inclure URSSAF due dans les dettes globales
  const payables_including_urssaf = payables_total + urssaf_due;

  // Solde actuel (cash-like) = paiements clients - paiements fournisseurs - URSSAF payés
  const current_cash = (totalClients || 0) - (totalFournisseurs || 0) - (urssaf_paid || 0);

  // Scénario si tout est soldé : encaissement des créances, paiement des dettes (+URSSAF)
  const settled_cash = current_cash + receivables_total - payables_total - urssaf_due;

  // Résultat économique (si on considère CA - achats - URSSAF)
  const result_if_settled = ca_total - purchases_total - urssaf_total;

  return {
    customers,
    products,
    suppliers,
    invoices,
    purchases,
    // expose more explicit accounting fields
    ca_total,
    receivables_total,
    purchases_total,
    payables_total,
    payables_including_urssaf,
    urssaf_total,
    urssaf_paid,
    urssaf_due,
    totalClients,
    totalFournisseurs,
    current_cash,
    settled_cash,
    result_if_settled
  };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

// IPC HANDLERS

ipcMain.handle('init', () => {
  initDb();
  return getDashboardData();
});

ipcMain.handle('customer:add', (event, customer) => {
  db.prepare('INSERT INTO customers (name, email) VALUES (?, ?)').run(
    customer.name,
    customer.email || null
  );
  return getDashboardData();
});

// Mettre à jour un client
ipcMain.handle('customer:update', (event, customer) => {
  db.prepare('UPDATE customers SET name = ?, email = ? WHERE id = ?')
    .run(customer.name, customer.email || null, customer.id);
  return getDashboardData();
});

// Supprimer un client
ipcMain.handle('customer:delete', (event, id) => {
  db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  return getDashboardData();
});

ipcMain.handle('product:add', (event, product) => {
  db.prepare('INSERT INTO products (name, price, stock) VALUES (?, ?, ?)').run(
    product.name,
    product.price,
    product.stock || 0
  );
  return getDashboardData();
});

ipcMain.handle('supplier:add', (event, supplier) => {
  db.prepare('INSERT INTO suppliers (name) VALUES (?)').run(supplier.name);
  return getDashboardData();
});

// Mettre à jour un fournisseur
ipcMain.handle('supplier:update', (event, supplier) => {
  db.prepare('UPDATE suppliers SET name = ? WHERE id = ?')
    .run(supplier.name, supplier.id);
  return getDashboardData();
});

// Supprimer un fournisseur
ipcMain.handle('supplier:delete', (event, id) => {
  db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);
  return getDashboardData();
});

// Settings get/set
ipcMain.handle('settings:get', (event, key) => {
  if (key) {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : null;
  }
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  rows.forEach(r => { out[r.key] = JSON.parse(r.value); });
  return out;
});

ipcMain.handle('settings:set', (event, key, value) => {
  const v = JSON.stringify(value);
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, v);
  return true;
});

// Send email (uses stored SMTP settings by default)
ipcMain.handle('email:send', async (event, payload) => {
  try {
    // payload: { to, subject, text, html, smtp }
    let smtp = payload.smtp;
    if (!smtp) {
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('smtp');
      smtp = row ? JSON.parse(row.value) : null;
    }
    if (!smtp) throw new Error('SMTP settings not configured');

    const transporter = nodemailer.createTransport(smtp);

    const from = smtp.auth && smtp.auth.user ? smtp.auth.user : (payload.from || smtp.from || 'noreply@example.com');

    const info = await transporter.sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html
    });
    return { ok: true, info };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Enregistrer un achat fournisseur (entrée de stock)
const insertPurchaseTx = db.transaction((payload) => {
  const { supplierId, productId, qty, unitCost, date } = payload;

  const info = db.prepare(`
    INSERT INTO purchases (supplier_id, product_id, qty, unit_cost, date)
    VALUES (?, ?, ?, ?, ?)
  `).run(supplierId, productId, qty, unitCost, date);

  db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?')
    .run(qty, productId);

  return info.lastInsertRowid;
});

ipcMain.handle('purchase:add', (event, payload) => {
  const date = payload.date || new Date().toISOString().slice(0, 10);
  insertPurchaseTx({ ...payload, date });
  return getDashboardData();
});

// Mettre à jour un achat (fournisseur, produit, qty, unitCost, date)
ipcMain.handle('purchase:update', (event, payload) => {
  const { purchaseId, supplierId, productId, qty, unitCost, date } = payload;

  const tx = db.transaction((p) => {
    // récupérer ancien achat
    const old = db.prepare('SELECT product_id, qty FROM purchases WHERE id = ?').get(p);
    if (!old) throw new Error('Achat introuvable');

    // si même produit, ajuster stock par différence
    if (old.product_id === productId) {
      const diff = qty - old.qty;
      db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(diff, productId);
    } else {
      // produit changé : retirer ancien qty puis ajouter nouveau qty
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(old.qty, old.product_id);
      db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(qty, productId);
    }

    db.prepare('UPDATE purchases SET supplier_id = ?, product_id = ?, qty = ?, unit_cost = ?, date = ? WHERE id = ?')
      .run(supplierId, productId, qty, unitCost, date, p);
  });

  tx(purchaseId);
  return getDashboardData();
});

// Supprimer un achat : restaure le stock (déduit), supprime paiements puis l'achat
ipcMain.handle('purchase:delete', (event, purchaseId) => {
  const tx = db.transaction((id) => {
    const pu = db.prepare('SELECT product_id, qty FROM purchases WHERE id = ?').get(id);
    if (pu) {
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(pu.qty, pu.product_id);
    }

    db.prepare('DELETE FROM purchase_payments WHERE purchase_id = ?').run(id);
    db.prepare('DELETE FROM purchases WHERE id = ?').run(id);
  });

  tx(purchaseId);
  return getDashboardData();
});

// Paiement d'un achat fournisseur
ipcMain.handle('purchase:payment', (event, payload) => {
  const date = payload.date || new Date().toISOString().slice(0, 10);
  db.prepare(`
    INSERT INTO purchase_payments (purchase_id, date, amount, method, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(payload.purchaseId, date, payload.amount, payload.method || null, payload.note || null);

  return getDashboardData();
});

// Créer une facture client
const createInvoiceTx = db.transaction((payload) => {
  const { customerId, lines, date } = payload;

  let total = 0;
  lines.forEach((l) => {
    total += l.qty * l.unit_price;
  });

  const info = db.prepare(`
    INSERT INTO invoices (customer_id, date, total)
    VALUES (?, ?, ?)
  `).run(customerId, date, total);

  const invoiceId = info.lastInsertRowid;

  const insertLine = db.prepare(`
    INSERT INTO invoice_lines (invoice_id, product_id, qty, unit_price, note)
    VALUES (?, ?, ?, ?, ?)
  `);
  const updateStock = db.prepare(`
    UPDATE products SET stock = stock - ? WHERE id = ?
  `);

  lines.forEach((l) => {
    const note = l.note || null;
    insertLine.run(invoiceId, l.productId, l.qty, l.unit_price, note);
    updateStock.run(l.qty, l.productId);
  });

  // Calcul URSSAF automatique (22% du total) et insertion
  try {
    const urssafAmount = Math.round((total * 0.22) * 100) / 100;
    db.prepare('INSERT OR REPLACE INTO urssaf (invoice_id, amount, declared_date, paid) VALUES (?, ?, NULL, 0)')
      .run(invoiceId, urssafAmount);
  } catch (e) {
    // ignore
  }

  return invoiceId;
});

ipcMain.handle('invoice:create', (event, payload) => {
  const date = payload.date || new Date().toISOString().slice(0, 10);
  const id = createInvoiceTx({ ...payload, date });
  return getDashboardData();
});

// Mettre à jour facture (client, date)
ipcMain.handle('invoice:update', (event, payload) => {
  const { invoiceId, customerId, date } = payload;
  db.prepare('UPDATE invoices SET customer_id = ?, date = ? WHERE id = ?').run(customerId, date, invoiceId);
  return getDashboardData();
});

// Supprimer facture (restore stock, supprimer lignes, paiements, urssaf)
ipcMain.handle('invoice:delete', (event, invoiceId) => {
  const tx = db.transaction((id) => {
    // restore stock from invoice_lines
    const lines = db.prepare('SELECT product_id, qty FROM invoice_lines WHERE invoice_id = ?').all(id);
    const updateStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
    lines.forEach(l => updateStock.run(l.qty, l.product_id));

    // delete related rows
    db.prepare('DELETE FROM invoice_payments WHERE invoice_id = ?').run(id);
    db.prepare('DELETE FROM invoice_lines WHERE invoice_id = ?').run(id);
    db.prepare('DELETE FROM urssaf WHERE invoice_id = ?').run(id);
    db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
  });

  tx(invoiceId);
  return getDashboardData();
});

// Générer un HTML simple pour la facture
function buildInvoiceHtml(invoiceId) {
  const inv = db.prepare(`SELECT i.id, i.date, i.total, c.name as customer_name, c.email as customer_email FROM invoices i JOIN customers c ON c.id = i.customer_id WHERE i.id = ?`).get(invoiceId);
  const lines = db.prepare(`SELECT l.qty, l.unit_price, l.note, p.name as product_name FROM invoice_lines l JOIN products p ON p.id = l.product_id WHERE l.invoice_id = ?`).all(invoiceId);

  let linesHtml = '';
  lines.forEach(l => {
    const noteHtml = l.note ? `<div style="font-size:11px;color:#666;margin-top:4px">${l.note}</div>` : '';
    linesHtml += `<tr>
      <td>${l.product_name}${noteHtml}</td>
      <td style="text-align:right">${l.qty}</td>
      <td style="text-align:right">${l.unit_price.toFixed(2)} €</td>
      <td style="text-align:right">${(l.qty * l.unit_price).toFixed(2)} €</td>
    </tr>`;
  });

  // Récupérer settings company (si présents)
  let company = { name: '', address: '', siret: '', legal: 'TVA non applicable, article 293 B du CGI', logo: null };
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('company');
    if (row) company = Object.assign(company, JSON.parse(row.value));
  } catch (e) {}

  // If no logo specified, try default 'logo.png' in app dir
  let logoPath = null;
  if (company.logo) {
    logoPath = path.isAbsolute(company.logo) ? company.logo : path.join(__dirname, company.logo);
    if (!fs.existsSync(logoPath)) logoPath = null;
  }
  if (!logoPath) {
    const defaultLogo = path.join(__dirname, 'logo.png');
    if (fs.existsSync(defaultLogo)) logoPath = defaultLogo;
  }

  let logoTag = '';
  if (logoPath) {
    const fileUrl = 'file://' + logoPath.replace(/\\/g, '/');
    logoTag = `<img src="${fileUrl}" style="height:80px;object-fit:contain" alt="logo"/>`;
  }

  // Build HTML with a cleaner layout
  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body{font-family: Arial, Helvetica, sans-serif; color:#222; margin:0; padding:24px}
        .header{display:flex;justify-content:space-between;align-items:center}
        .company{font-size:14px;text-align:right}
        h1{color:#0b7bbf;margin:0}
        .meta{margin-top:8px;font-size:12px;color:#444}
        .invoice-box{margin-top:18px}
        table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}
        th,td{padding:10px;border:1px solid #e6eef5}
        th{background:#f6f8fa;text-align:left}
        tfoot td{border:none}
        .total-row td{border-top:2px solid #ddd;font-weight:700}
        .footer{margin-top:18px;font-size:11px;color:#444}
        .buyer{margin-top:12px;padding:8px;background:#fbfdff;border:1px solid #eef6fb}
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">${logoTag}</div>
        <div class="company">
          <div style="font-weight:700">${company.name || ''}</div>
          <div>${company.address || ''}</div>
          <div>${company.siret ? 'SIRET/SIREN: ' + company.siret : ''}</div>
        </div>
      </div>

      <div class="invoice-box">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
          <div>
            <h1>FACTURE</h1>
            <div class="meta">Réf: <strong>#${inv.id}</strong></div>
            <div class="meta">Date: ${inv.date}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700">${inv.customer_name}</div>
            <div style="font-size:12px;color:#555">${inv.customer_email || ''}</div>
          </div>
        </div>

        <div class="buyer">
          <strong>Facturé à :</strong><br/>
          ${inv.customer_name}<br/>
          ${inv.customer_email ? inv.customer_email + '<br/>' : ''}
        </div>

        <table>
          <thead>
            <tr><th>Produit</th><th style="width:80px;text-align:right">Qté</th><th style="width:120px;text-align:right">PU</th><th style="width:120px;text-align:right">Total</th></tr>
          </thead>
          <tbody>
            ${linesHtml}
          </tbody>
          <tfoot>
            <tr class="total-row"><td colspan="3" style="text-align:right">Total</td><td style="text-align:right">${inv.total.toFixed(2)} €</td></tr>
          </tfoot>
        </table>

        <div class="footer">
          <div><strong>${company.name || ''}</strong></div>
          <div>${company.address || ''}</div>
          ${company.siret ? '<div>SIRET/SIREN: ' + company.siret + '</div>' : ''}
          <div style="margin-top:8px"><em>${company.legal || 'TVA non applicable, article 293 B du CGI'}</em></div>
        </div>
      </div>
    </body>
  </html>
  `;

  return { html, customer_email: inv.customer_email, id: inv.id };
}

async function generatePdfFromHtml(html, filename) {
  return new Promise((resolve, reject) => {
    // Créer une fenêtre cachée pour rendre le HTML et générer le PDF
    const win = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    win.loadURL(dataUrl);
    win.webContents.on('did-finish-load', async () => {
      try {
        const pdfBuffer = await win.webContents.printToPDF({});
        // Save directly into app userData invoices folder if available
        const invoicesDir = path.join(app.getPath('userData'), 'invoices');
        try { fs.mkdirSync(invoicesDir, { recursive: true }); } catch (e) {}
        const destPath = path.join(invoicesDir, filename);
        fs.writeFileSync(destPath, pdfBuffer);
        try { win.destroy(); } catch (_) {}
        resolve(destPath);
      } catch (err) {
        try { win.destroy(); } catch (_) {}
        reject(err);
      }
    });
    win.webContents.on('did-fail-load', (e, code, desc) => {
      try { win.destroy(); } catch (_) {}
      reject(new Error('Failed to load invoice HTML: ' + desc));
    });
  });
}

ipcMain.handle('invoice:createAndSend', async (event, payload) => {
  try {
    const date = payload.date || new Date().toISOString().slice(0, 10);
    const invoiceId = createInvoiceTx({ ...payload, date });

    let mailResult = null;
    if (payload.sendEmail) {
      // Générer HTML
      const info = buildInvoiceHtml(invoiceId);
      const filename = `manouk-invoice-${invoiceId}.pdf`;
      const pdfPath = await generatePdfFromHtml(info.html, filename);

      // Récupérer SMTP
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('smtp');
      const smtp = row ? JSON.parse(row.value) : null;
      if (!smtp) throw new Error('SMTP settings not configured');

      const transporter = nodemailer.createTransport(smtp);
      const from = smtp.auth && smtp.auth.user ? smtp.auth.user : (payload.from || 'noreply@example.com');

      // Récupérer company pour signature
      let company = {};
      try { const crow = db.prepare('SELECT value FROM settings WHERE key = ?').get('company'); if (crow) company = JSON.parse(crow.value); } catch (e) {}

      const mailText = payload.text || `Ci-joint la facture #${invoiceId}.\n\nMerci,\n${company.name || ''}`;
      const mailHtml = payload.html || `<p>Ci-joint la facture <strong>#${invoiceId}</strong>.</p><p>Merci,<br/>${company.name || ''}</p>`;

      const mailOptions = {
        from,
        to: payload.to || info.customer_email,
        subject: payload.subject || `Facture #${invoiceId}`,
        text: mailText,
        html: mailHtml,
        attachments: [ { filename, path: pdfPath } ]
      };

      try {
        const infoSend = await transporter.sendMail(mailOptions);
        mailResult = { ok: true, info: infoSend };
      } catch (err) {
        mailResult = { ok: false, error: err.message };
      }

      // Conserver le PDF généré dans le dossier `invoices` (ne pas supprimer)
      // (anciennement on supprimait le fichier temporaire ici)
    }

    const data = getDashboardData();
    return { data, mailResult };
  } catch (err) {
    return { error: err.message };
  }
});

// Ouvrir un sélecteur de fichier pour logo et copier le fichier dans le dossier de l'app
ipcMain.handle('dialog:selectLogo', async (event) => {
  try {
    const win = BrowserWindow.getFocusedWindow();
    const res = await dialog.showOpenDialog(win, {
      title: 'Sélectionner un logo',
      properties: ['openFile'],
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    if (res.canceled || !res.filePaths || res.filePaths.length === 0) return null;
    const src = res.filePaths[0];
    const ext = path.extname(src) || '.png';
    const destName = `logo-${Date.now()}${ext}`;
    const dest = path.join(__dirname, destName);
    fs.copyFileSync(src, dest);
    return destName; // relative name stored in settings and resolved by renderer/main
  } catch (err) {
    console.error('dialog:selectLogo error', err);
    return null;
  }
});

// Paiement facture client
ipcMain.handle('invoice:payment', (event, payload) => {
  const date = payload.date || new Date().toISOString().slice(0, 10);
  db.prepare(`
    INSERT INTO invoice_payments (invoice_id, date, amount, method, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(payload.invoiceId, date, payload.amount, payload.method || null, payload.note || null);

  return getDashboardData();
});

// Marquer URSSAF déclaré (avec date)
ipcMain.handle('urssaf:markDeclared', (event, payload) => {
  const { invoiceId, date } = payload;
  db.prepare('INSERT OR REPLACE INTO urssaf (invoice_id, amount, declared_date, paid) VALUES (?, COALESCE((SELECT amount FROM urssaf WHERE invoice_id = ?), 0), ?, COALESCE((SELECT paid FROM urssaf WHERE invoice_id = ?), 0))')
    .run(invoiceId, invoiceId, date || new Date().toISOString().slice(0, 10), invoiceId);
  return getDashboardData();
});

// Ajouter paiement URSSAF (ajoute au champ paid)
ipcMain.handle('urssaf:addPayment', (event, payload) => {
  const { invoiceId, amount } = payload;
  const current = db.prepare('SELECT paid FROM urssaf WHERE invoice_id = ?').get(invoiceId);
  const paid = (current && current.paid) ? (current.paid + amount) : amount;
  db.prepare('INSERT OR REPLACE INTO urssaf (invoice_id, amount, declared_date, paid) VALUES (?, COALESCE((SELECT amount FROM urssaf WHERE invoice_id = ?), 0), COALESCE((SELECT declared_date FROM urssaf WHERE invoice_id = ?), NULL), ?)')
    .run(invoiceId, invoiceId, invoiceId, paid);
  return getDashboardData();
});

app.whenReady().then(() => {
  initDb();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

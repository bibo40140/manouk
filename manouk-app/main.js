const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const nodemailer = require('nodemailer');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');

const db = new Database('manouk.db');

// Function to generate next invoice number
function getNextInvoiceNumber(companyId) {
  const year = new Date().getFullYear();
  const company = db.prepare('SELECT code FROM companies WHERE id = ?').get(companyId);
  const companyCode = company ? company.code.toUpperCase() : 'FA';
  
  const result = db.transaction(() => {
    // Get or create sequence
    let seq = db.prepare('SELECT last_number FROM invoice_sequences WHERE company_id = ? AND year = ?').get(companyId, year);
    
    if (!seq) {
      db.prepare('INSERT INTO invoice_sequences (company_id, year, last_number) VALUES (?, ?, 1)').run(companyId, year);
      return `${companyCode}-${year}-0001`;
    }
    
    const nextNum = seq.last_number + 1;
    db.prepare('UPDATE invoice_sequences SET last_number = ? WHERE company_id = ? AND year = ?').run(nextNum, companyId, year);
    
    return `${companyCode}-${year}-${String(nextNum).padStart(4, '0')}`;
  })();
  
  return result;
}

// Auto backup database daily
function scheduleBackup() {
  const backupDir = path.join(app.getPath('userData'), 'backups');
  
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
  } catch (e) {
    console.error('Failed to create backup directory', e);
    return;
  }
  
  const performBackup = () => {
    try {
      const date = new Date().toISOString().split('T')[0];
      const backupPath = path.join(backupDir, `manouk-${date}.db`);
      
      // Copy database file
      db.backup(backupPath).then(() => {
        console.log('Database backed up to:', backupPath);
        
        // Clean old backups (keep last 30 days)
        const files = fs.readdirSync(backupDir);
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        files.forEach(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          if (stats.mtimeMs < thirtyDaysAgo) {
            fs.unlinkSync(filePath);
          }
        });
      }).catch(err => {
        console.error('Backup failed:', err);
      });
    } catch (e) {
      console.error('Backup error:', e);
    }
  };
  
  // Backup on startup
  performBackup();
  
  // Schedule daily backup (every 24 hours)
  setInterval(performBackup, 24 * 60 * 60 * 1000);
}

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

  // Sociétés (manouk, bibizi)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT
    );
  `).run();

  // Migration: add email column to companies if missing
  try {
    const companyCols = db.prepare("PRAGMA table_info(companies)").all();
    const hasEmail = companyCols.some(c => c.name === 'email');
    if (!hasEmail) {
      db.prepare('ALTER TABLE companies ADD COLUMN email TEXT').run();
    }
  } catch (e) {}

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
      company_id INTEGER DEFAULT NULL,
      product_id INTEGER NOT NULL,
      qty REAL NOT NULL,
      unit_cost REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `).run();

  // Migration: ensure purchases.company_id exists for older DBs
  try {
    const pcols = db.prepare("PRAGMA table_info(purchases)").all();
    const hasCompany = pcols.some(c => c.name === 'company_id');
    if (!hasCompany) {
      db.prepare('ALTER TABLE purchases ADD COLUMN company_id INTEGER DEFAULT NULL').run();
    }
  } catch (e) {}

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
      company_id INTEGER DEFAULT NULL,
      date TEXT NOT NULL,
      total REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );
  `).run();

  // Migration: ensure invoices.company_id exists for older DBs
  try {
    const icol = db.prepare("PRAGMA table_info(invoices)").all();
    const hasInvCompany = icol.some(c => c.name === 'company_id');
    if (!hasInvCompany) {
      db.prepare('ALTER TABLE invoices ADD COLUMN company_id INTEGER DEFAULT NULL').run();
    }
  } catch (e) {}

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

  // Product shares between companies (fixed amount per unit)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS product_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      amount_per_unit REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (company_id) REFERENCES companies(id),
      UNIQUE(product_id, company_id)
    );
  `).run();

  // Roles (production, logistics...)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL
    );
  `).run();

  // Product role shares (amount per unit for a role)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS product_role_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      amount_per_unit REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      UNIQUE(product_id, role_id)
    );
  `).run();

  // Which companies can play which roles for each product
  db.prepare(`
    CREATE TABLE IF NOT EXISTS product_role_companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (company_id) REFERENCES companies(id),
      UNIQUE(product_id, role_id, company_id)
    );
  `).run();

  // Seed roles
  const insertRole = db.prepare('INSERT OR IGNORE INTO roles (code, name) VALUES (?, ?)');
  insertRole.run('production', 'Production');
  insertRole.run('logistics', 'Logistique');

  // Table for invoice numbering per company
  db.prepare(`
    CREATE TABLE IF NOT EXISTS invoice_sequences (
      company_id INTEGER NOT NULL,
      year INTEGER NOT NULL,
      last_number INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (company_id, year),
      FOREIGN KEY (company_id) REFERENCES companies(id)
    );
  `).run();

  // Table for raw materials (matières premières)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS raw_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      unit TEXT NOT NULL DEFAULT 'unité',
      current_stock REAL NOT NULL DEFAULT 0,
      unit_cost REAL NOT NULL DEFAULT 0,
      notes TEXT
    );
  `).run();

  // Table for product composition (nomenclature/BOM)
  db.prepare(`
    CREATE TABLE IF NOT EXISTS product_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      raw_material_id INTEGER NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (raw_material_id) REFERENCES raw_materials(id),
      UNIQUE(product_id, raw_material_id)
    );
  `).run();

  // Table for raw material purchases history
  db.prepare(`
    CREATE TABLE IF NOT EXISTS raw_material_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  `).run();

  // Add invoice_number column to invoices if missing
  try {
    const cols = db.prepare("PRAGMA table_info(invoices)").all();
    const hasInvoiceNumber = cols.some(c => c.name === 'invoice_number');
    if (!hasInvoiceNumber) {
      db.prepare('ALTER TABLE invoices ADD COLUMN invoice_number TEXT').run();
    }
  } catch (e) {}

  // Add delivery_date and paid_date columns to raw_material_purchases if missing
  try {
    const rmCols = db.prepare("PRAGMA table_info(raw_material_purchases)").all();
    const hasDeliveryDate = rmCols.some(c => c.name === 'delivery_date');
    const hasPaidDate = rmCols.some(c => c.name === 'paid_date');
    if (!hasDeliveryDate) {
      db.prepare('ALTER TABLE raw_material_purchases ADD COLUMN delivery_date TEXT').run();
    }
    if (!hasPaidDate) {
      db.prepare('ALTER TABLE raw_material_purchases ADD COLUMN paid_date TEXT').run();
    }
  } catch (e) {}

  // Add paid_date to URSSAF table
  try {
    const ursCols = db.prepare("PRAGMA table_info(urssaf)").all();
    const hasUrsPaidDate = ursCols.some(c => c.name === 'paid_date');
    if (!hasUrsPaidDate) {
      db.prepare('ALTER TABLE urssaf ADD COLUMN paid_date TEXT').run();
    }
  } catch (e) {}

  // --- Base vide - Aucune donnée par défaut ---
}

function getDashboardData() {
  const customers = db.prepare('SELECT * FROM customers ORDER BY name').all();
  const products = db.prepare('SELECT * FROM products ORDER BY name').all();
  const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name').all();

  const invoices = db.prepare(`
    SELECT
      i.id,
      i.invoice_number,
      i.date,
      i.company_id,
      co.name AS company_name,
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
    LEFT JOIN companies co ON co.id = i.company_id
    LEFT JOIN urssaf u ON u.invoice_id = i.id
    ORDER BY i.date DESC, i.id DESC
  `).all();

  const purchases = db.prepare(`
    SELECT
      pu.id,
      pu.date,
      pu.company_id,
      co.name AS company_name,
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
    LEFT JOIN companies co ON co.id = pu.company_id
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

  // Per-company aggregates
  const companies = db.prepare('SELECT id, code, name FROM companies ORDER BY id').all();
  const roles = db.prepare('SELECT id, code, name FROM roles ORDER BY id').all();
  const companyAggregates = companies.map(c => {
    const caRow = db.prepare('SELECT IFNULL(SUM(total),0) as ca FROM invoices WHERE company_id = ?').get(c.id);
    const receiv = db.prepare('SELECT IFNULL(SUM(i.total - IFNULL((SELECT SUM(amount) FROM invoice_payments p WHERE p.invoice_id = i.id),0)),0) as due FROM invoices i WHERE i.company_id = ?').get(c.id);
    return { company: c, ca: caRow.ca || 0, receivables: receiv.due || 0 };
  });

  // CA (Chiffre d'affaires) : total des factures
  const ca_total_row = db.prepare('SELECT IFNULL(SUM(total),0) as total FROM invoices').get();
  const ca_total = ca_total_row ? ca_total_row.total : 0;

  // Créances (montant restant à encaisser sur factures)
  const receivables_total = invoices.reduce((s, i) => s + (i.due || 0), 0);

  // Achats totaux et dettes fournisseurs
  const purchases_total = purchases.reduce((s, p) => s + (p.total_cost || 0), 0);
  const payables_total = purchases.reduce((s, p) => s + (p.due || 0), 0);

  // Achats de matières premières
  const rawMaterialPurchasesRow = db.prepare('SELECT IFNULL(SUM(total_cost), 0) as total, IFNULL(SUM(due), 0) as due, IFNULL(SUM(paid), 0) as paid FROM raw_material_purchases').get();
  const raw_purchases_total = rawMaterialPurchasesRow.total || 0;
  const raw_payables_total = rawMaterialPurchasesRow.due || 0;
  const raw_paid_total = rawMaterialPurchasesRow.paid || 0;

  // Totaux combinés (anciens achats produits + nouveaux achats matières premières)
  const all_purchases_total = purchases_total + raw_purchases_total;
  const all_payables_total = payables_total + raw_payables_total;

  // Inclure URSSAF due dans les dettes globales
  const payables_including_urssaf = all_payables_total + urssaf_due;

  // Solde actuel (cash-like) = paiements clients - paiements fournisseurs - paiements matières premières - URSSAF payés
  const current_cash = (totalClients || 0) - (totalFournisseurs || 0) - (raw_paid_total || 0) - (urssaf_paid || 0);

  // Scénario si tout est soldé : encaissement des créances, paiement des dettes (+URSSAF)
  const settled_cash = current_cash + receivables_total - all_payables_total - urssaf_due;

  // Résultat économique (si on considère CA - achats - URSSAF)
  const result_if_settled = ca_total - all_purchases_total - urssaf_total;

  // Product profitability analysis
  const productStats = products.map(p => {
    // Total sold
    const soldRow = db.prepare(`
      SELECT IFNULL(SUM(il.qty), 0) as total_sold, 
             IFNULL(SUM(il.qty * il.unit_price), 0) as revenue
      FROM invoice_lines il
      WHERE il.product_id = ?
    `).get(p.id);
    
    // Average purchase cost
    const avgCostRow = db.prepare(`
      SELECT IFNULL(AVG(unit_cost), 0) as avg_cost
      FROM purchases
      WHERE product_id = ?
    `).get(p.id);
    
    const totalSold = soldRow.total_sold || 0;
    const revenue = soldRow.revenue || 0;
    const avgCost = avgCostRow.avg_cost || 0;
    const totalCost = totalSold * avgCost;
    const margin = revenue - totalCost;
    const marginPercent = revenue > 0 ? ((margin / revenue) * 100) : 0;
    
    return {
      id: p.id,
      name: p.name,
      totalSold,
      revenue,
      avgCost,
      totalCost,
      margin,
      marginPercent
    };
  });

  // Overdue invoices (>30 days)
  const overdueInvoices = db.prepare(`
    SELECT COUNT(*) as count, IFNULL(SUM(i.total - IFNULL((SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = i.id), 0)), 0) as amount
    FROM invoices i
    WHERE (i.total - IFNULL((SELECT SUM(amount) FROM invoice_payments WHERE invoice_id = i.id), 0)) > 0.01
    AND DATE(i.date) < DATE('now', '-30 days')
  `).get();

  // Low stock products (stock < 10)
  const lowStockProducts = db.prepare(`
    SELECT id, name, stock
    FROM products
    WHERE stock < 10
    ORDER BY stock ASC
    LIMIT 10
  `).all();

  // Monthly revenue trend (last 6 months)
  const monthlyRevenue = db.prepare(`
    SELECT 
      strftime('%Y-%m', date) as month,
      IFNULL(SUM(total), 0) as revenue
    FROM invoices
    WHERE date >= DATE('now', '-6 months')
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month ASC
  `).all();

  // Monthly paid revenue (from payments)
  const monthlyRevenuePaid = db.prepare(`
    SELECT 
      strftime('%Y-%m', ip.date) as month,
      IFNULL(SUM(ip.amount), 0) as revenue_paid
    FROM invoice_payments ip
    WHERE ip.date >= DATE('now', '-6 months')
    GROUP BY strftime('%Y-%m', ip.date)
    ORDER BY month ASC
  `).all();

  // Monthly supplier payments (legacy purchases payments)
  const monthlyPurchasePayments = db.prepare(`
    SELECT 
      strftime('%Y-%m', pp.date) as month,
      IFNULL(SUM(pp.amount), 0) as amount
    FROM purchase_payments pp
    WHERE pp.date >= DATE('now', '-6 months')
    GROUP BY strftime('%Y-%m', pp.date)
    ORDER BY month ASC
  `).all();

  // Monthly raw material purchases fully paid (using paid_date)
  const monthlyRawPurchasePayments = db.prepare(`
    SELECT 
      strftime('%Y-%m', rmp.paid_date) as month,
      IFNULL(SUM(rmp.total_cost), 0) as amount
    FROM raw_material_purchases rmp
    WHERE rmp.paid_date IS NOT NULL
      AND rmp.paid_date >= DATE('now', '-6 months')
    GROUP BY strftime('%Y-%m', rmp.paid_date)
    ORDER BY month ASC
  `).all();

  // Merge expenses (purchases + raw purchases) per month
  const monthAgg = new Map();
  monthlyRevenuePaid.forEach(r => {
    monthAgg.set(r.month, { rev: r.revenue_paid || 0, exp: 0 });
  });
  monthlyPurchasePayments.forEach(p => {
    const cur = monthAgg.get(p.month) || { rev: 0, exp: 0 };
    cur.exp += (p.amount || 0);
    monthAgg.set(p.month, cur);
  });
  monthlyRawPurchasePayments.forEach(p => {
    const cur = monthAgg.get(p.month) || { rev: 0, exp: 0 };
    cur.exp += (p.amount || 0);
    monthAgg.set(p.month, cur);
  });

  const monthsAll = Array.from(monthAgg.keys()).sort();
  const monthlyExpensesPaid = monthsAll.map(m => ({ month: m, expenses_paid: (monthAgg.get(m)?.exp) || 0 }));
  const monthlyResultPaid = monthsAll.map(m => ({ month: m, result_paid: ((monthAgg.get(m)?.rev) || 0) - ((monthAgg.get(m)?.exp) || 0) }));

  // Expose raw payment events for day-level plotting (with company_id for filtering)
  const invoicePayments = db.prepare(`
    SELECT ip.date, ip.amount, i.company_id
    FROM invoice_payments ip
    JOIN invoices i ON i.id = ip.invoice_id
    ORDER BY ip.date ASC
  `).all();
  const purchasePayments = db.prepare(`
    SELECT pp.date, pp.amount, p.company_id
    FROM purchase_payments pp
    JOIN purchases p ON p.id = pp.purchase_id
    ORDER BY pp.date ASC
  `).all();
  const rawPurchasePaidEvents = db.prepare(`
    SELECT paid_date as date, CASE WHEN paid > 0 THEN paid ELSE total_cost END as amount, company_id
    FROM raw_material_purchases
    WHERE paid_date IS NOT NULL
    ORDER BY paid_date ASC
  `).all();

  return {
    customers,
    products,
    suppliers,
    companies,
    roles,
    companyAggregates,
    invoices,
    purchases,
    productStats,
    overdueInvoices,
    lowStockProducts,
    monthlyRevenue,
    monthlyRevenuePaid,
    monthlyExpensesPaid,
    monthlyResultPaid,
    invoicePayments,
    purchasePayments,
    rawPurchasePaidEvents,
    // expose more explicit accounting fields
    ca_total,
    receivables_total,
    purchases_total: all_purchases_total,
    payables_total: all_payables_total,
    payables_including_urssaf,
    urssaf_total,
    urssaf_paid,
    urssaf_due,
    totalClients,
    totalFournisseurs,
    current_cash,
    settled_cash,
    result_if_settled,
    raw_purchases_total,
    raw_payables_total,
    raw_paid_total
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

// Mettre à jour un produit
ipcMain.handle('product:update', (event, payload) => {
  const { id, name, price, stock } = payload;
  db.prepare('UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?').run(name, price, stock || 0, id);
  return getDashboardData();
});

// Supprimer un produit (si non référencé)
ipcMain.handle('product:delete', (event, id) => {
  if (!id) throw new Error('id requis');
  // check references
  const usedInvoice = db.prepare('SELECT 1 FROM invoice_lines WHERE product_id = ? LIMIT 1').get(id);
  const usedPurchase = db.prepare('SELECT 1 FROM purchases WHERE product_id = ? LIMIT 1').get(id);
  if (usedInvoice || usedPurchase) {
    throw new Error('Impossible de supprimer : produit référencé par des factures ou des achats');
  }
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
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

// Companies CRUD
ipcMain.handle('company:getAll', (event) => {
  return db.prepare('SELECT id, code, name, email FROM companies ORDER BY id').all();
});

ipcMain.handle('company:add', (event, payload) => {
  const code = (payload.code || '').trim();
  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim();
  if (!code || !name) throw new Error('Code et nom requis');
  db.prepare('INSERT OR IGNORE INTO companies (code, name, email) VALUES (?, ?, ?)').run(code, name, email || null);
  return db.prepare('SELECT id, code, name, email FROM companies ORDER BY id').all();
});

ipcMain.handle('company:update', (event, payload) => {
  const id = payload.id;
  const code = (payload.code || '').trim();
  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim();
  if (!id || !code || !name) throw new Error('id, code et nom requis');
  db.prepare('UPDATE companies SET code = ?, name = ?, email = ? WHERE id = ?').run(code, name, email || null, id);
  return db.prepare('SELECT id, code, name, email FROM companies ORDER BY id').all();
});

ipcMain.handle('company:delete', (event, id) => {
  if (!id) throw new Error('id requis');
  // remove company; invoices/purchases referencing it will keep company_id NULL
  db.prepare('DELETE FROM companies WHERE id = ?').run(id);
  return db.prepare('SELECT id, code, name, email FROM companies ORDER BY id').all();
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
  const { supplierId, companyId, productId, qty, unitCost, date } = payload;

  const info = db.prepare(`
    INSERT INTO purchases (supplier_id, company_id, product_id, qty, unit_cost, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(supplierId, companyId || null, productId, qty, unitCost, date);

  db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?')
    .run(qty, productId);

  return info.lastInsertRowid;
});

ipcMain.handle('purchase:add', (event, payload) => {
  const date = payload.date || new Date().toISOString().slice(0, 10);
  insertPurchaseTx({ ...payload, date });
  return getDashboardData();
});

// Set or get product shares
ipcMain.handle('product:getShares', (event, productId) => {
  const rows = db.prepare('SELECT company_id, amount_per_unit FROM product_shares WHERE product_id = ?').all(productId);
  return rows;
});

ipcMain.handle('product:getRoleShares', (event, productId) => {
  const rows = db.prepare('SELECT role_id, amount_per_unit FROM product_role_shares WHERE product_id = ?').all(productId);
  return rows;
});

ipcMain.handle('product:setRoleShares', (event, productId, shares) => {
  const tx = db.transaction((pId, sList) => {
    db.prepare('DELETE FROM product_role_shares WHERE product_id = ?').run(pId);
    const ins = db.prepare('INSERT INTO product_role_shares (product_id, role_id, amount_per_unit) VALUES (?, ?, ?)');
    sList.forEach(s => ins.run(pId, s.role_id, s.amount_per_unit || 0));
  });
  tx(productId, shares || []);
  return true;
});

// Get allowed companies for each role for a product
ipcMain.handle('product:getRoleCompanies', (event, productId) => {
  const rows = db.prepare('SELECT role_id, company_id FROM product_role_companies WHERE product_id = ?').all(productId);
  return rows;
});

// Set allowed companies for roles on a product
ipcMain.handle('product:setRoleCompanies', (event, productId, entries) => {
  // entries: [{ role_id, company_id }, ...]
  const tx = db.transaction((pId, list) => {
    db.prepare('DELETE FROM product_role_companies WHERE product_id = ?').run(pId);
    const ins = db.prepare('INSERT INTO product_role_companies (product_id, role_id, company_id) VALUES (?, ?, ?)');
    (list || []).forEach(e => ins.run(pId, e.role_id, e.company_id));
  });
  tx(productId, entries || []);
  return true;
});

ipcMain.handle('product:setShares', (event, productId, shares) => {
  // shares: [{company_id, amount_per_unit}, ...]
  const tx = db.transaction((pId, sList) => {
    // delete existing
    db.prepare('DELETE FROM product_shares WHERE product_id = ?').run(pId);
    const ins = db.prepare('INSERT INTO product_shares (product_id, company_id, amount_per_unit) VALUES (?, ?, ?)');
    sList.forEach(s => ins.run(pId, s.company_id, s.amount_per_unit || 0));
  });
  tx(productId, shares || []);
  return true;
});

ipcMain.handle('roles:getAll', (event) => {
  return db.prepare('SELECT id, code, name FROM roles ORDER BY id').all();
});

// Create a sale that may be split between companies according to product_shares
ipcMain.handle('sale:createSplit', async (event, payload) => {
  // payload: { customerId, lines: [{productId, qty, unit_price, note}], date, sendEmail, to, subject, text }
  const date = payload.date || new Date().toISOString().slice(0,10);
  const lines = payload.lines || [];

  // collect companies involved and per-company lines
  const companies = db.prepare('SELECT id FROM companies').all();
  const companyIds = companies.map(c => c.id);

  // For each product, get shares map
  const sharesMap = {};
  lines.forEach(l => {
    const ps = db.prepare('SELECT company_id, amount_per_unit FROM product_shares WHERE product_id = ?').all(l.productId);
    if (!ps || ps.length === 0) {
      // default: assign full unit price to manouk
      const manouk = db.prepare('SELECT id FROM companies WHERE code = ?').get('manouk');
      sharesMap[l.productId] = [{ company_id: manouk.id, amount_per_unit: l.unit_price }];
    } else {
      sharesMap[l.productId] = ps.map(x => ({ company_id: x.company_id, amount_per_unit: x.amount_per_unit }));
    }
  });

  // build per-company lines
  const perCompanyLines = {}; // companyId -> [lines]
  lines.forEach(l => {
    const ps = sharesMap[l.productId] || [];
    ps.forEach(s => {
      if (!perCompanyLines[s.company_id]) perCompanyLines[s.company_id] = [];
      // unit price for company is s.amount_per_unit
      perCompanyLines[s.company_id].push({ productId: l.productId, qty: l.qty, unit_price: s.amount_per_unit, note: l.note || null });
    });
  });

  // Create invoices per company (without stock adjustments)
  const created = [];
  Object.keys(perCompanyLines).forEach(cid => {
    const compId = parseInt(cid, 10);
    const cls = perCompanyLines[compId];
    if (!cls || cls.length === 0) return;
    const invId = createInvoiceNoStockTx({ customerId: payload.customerId, companyId: compId, lines: cls, date });
    created.push({ companyId: compId, invoiceId: invId });
  });

  // Now update stock ONCE for each product (decrease by total sold qty)
  const qtyPerProduct = {};
  lines.forEach(l => { qtyPerProduct[l.productId] = (qtyPerProduct[l.productId] || 0) + l.qty; });
  const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  Object.keys(qtyPerProduct).forEach(pid => updateStock.run(qtyPerProduct[pid], pid));

  // Send emails if requested
  let mailResults = [];
  if (payload.sendEmail && created.length > 0) {
    try {
      mailResults = await sendMultiCompanyInvoiceEmails(created, payload);
    } catch (err) {
      console.error('Email sending error:', err);
    }
  }

  const data = getDashboardData();
  return { data, created, mailResults };
});

// Create a sale by role allocations (payload.lines include roleAllocations)
ipcMain.handle('sale:createByRole', async (event, payload) => {
  // payload: { customerId, lines: [{ productId, qty, unit_price, note, allocations: [{ role_id, company_id, qty }] }], invoice_date, date, sendEmail, to, subject, text }
  const date = payload.invoice_date || payload.date || new Date().toISOString().slice(0,10);
  const lines = payload.lines || [];

  // Build company-specific invoice lines from allocations
  const perCompanyAllocations = {}; // companyId -> [ { productId, role_id, qty, unit_price } ]

  lines.forEach(l => {
    const allocs = l.allocations || [];
    allocs.forEach(a => {
      const roleShare = db.prepare('SELECT amount_per_unit FROM product_role_shares WHERE product_id = ? AND role_id = ?').get(l.productId, a.role_id);
      const amtPerUnit = roleShare ? roleShare.amount_per_unit : 0;
      if (!perCompanyAllocations[a.company_id]) perCompanyAllocations[a.company_id] = [];
      perCompanyAllocations[a.company_id].push({ productId: l.productId, role_id: a.role_id, qty: a.qty, unit_price: amtPerUnit, note: l.note || null });
    });
  });

  const created = [];
  Object.keys(perCompanyAllocations).forEach(cid => {
    const compId = parseInt(cid, 10);
    const cls = perCompanyAllocations[compId];
    if (!cls || cls.length === 0) return;
    // Create invoice (no stock operations here)
    const invId = createInvoiceNoStockTx({ customerId: payload.customerId, companyId: compId, lines: cls, date });
    created.push({ companyId: compId, invoiceId: invId });
  });

  // Now decrement stock once per product
  const qtyPerProduct = {};
  lines.forEach(l => { qtyPerProduct[l.productId] = (qtyPerProduct[l.productId] || 0) + l.qty; });
  const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
  Object.keys(qtyPerProduct).forEach(pid => updateStock.run(qtyPerProduct[pid], pid));

  // Send emails if requested
  let mailResults = [];
  if (payload.sendEmail && created.length > 0) {
    try {
      mailResults = await sendMultiCompanyInvoiceEmails(created, payload);
    } catch (err) {
      console.error('Email sending error:', err);
    }
  }

  const data = getDashboardData();
  return { data, created, mailResults };
});

// Mettre à jour un achat (fournisseur, produit, qty, unitCost, date)
ipcMain.handle('purchase:update', (event, payload) => {
  const { purchaseId, companyId, supplierId, productId, qty, unitCost, date } = payload;

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

    db.prepare('UPDATE purchases SET supplier_id = ?, company_id = ?, product_id = ?, qty = ?, unit_cost = ?, date = ? WHERE id = ?')
      .run(supplierId, companyId || null, productId, qty, unitCost, date, p);
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

// Create invoice WITHOUT touching stock (used when splitting invoices between companies)
const createInvoiceNoStockTx = db.transaction((payload) => {
  const { customerId, companyId, lines, date } = payload;

  let total = 0;
  lines.forEach((l) => { total += l.qty * l.unit_price; });

  // Generate invoice number
  const invoiceNumber = companyId ? getNextInvoiceNumber(companyId) : null;

  const info = db.prepare(`
    INSERT INTO invoices (customer_id, company_id, date, total, invoice_number)
    VALUES (?, ?, ?, ?, ?)
  `).run(customerId, companyId || null, date, total, invoiceNumber);

  const invoiceId = info.lastInsertRowid;

  const insertLine = db.prepare(`
    INSERT INTO invoice_lines (invoice_id, product_id, qty, unit_price, note)
    VALUES (?, ?, ?, ?, ?)
  `);

  lines.forEach((l) => {
    const note = l.note || null;
    insertLine.run(invoiceId, l.productId, l.qty, l.unit_price, note);
  });

  // create urssaf for this invoice (22%)
  try {
    const urssafAmount = Math.round((total * 0.22) * 100) / 100;
    db.prepare('INSERT OR REPLACE INTO urssaf (invoice_id, amount, declared_date, paid) VALUES (?, ?, NULL, 0)')
      .run(invoiceId, urssafAmount);
  } catch (e) {}

  return invoiceId;
});

ipcMain.handle('invoice:create', (event, payload) => {
  const date = payload.invoice_date || payload.date || new Date().toISOString().slice(0, 10);
  const id = createInvoiceTx({ ...payload, date });
  return getDashboardData();
});

// Mettre à jour facture (client, date)
ipcMain.handle('invoice:update', (event, payload) => {
  const { invoiceId, customerId, date } = payload;
  db.prepare('UPDATE invoices SET customer_id = ?, date = ? WHERE id = ?').run(customerId, date, invoiceId);
  return getDashboardData();
});

// Récupérer les paiements d'une facture
ipcMain.handle('invoice:getPayments', (event, invoiceId) => {
  return db.prepare('SELECT * FROM invoice_payments WHERE invoice_id = ? ORDER BY date ASC').all(invoiceId);
});

// Récupérer les lignes d'une facture
ipcMain.handle('invoice:getLines', (event, invoiceId) => {
  return db.prepare('SELECT * FROM invoice_lines WHERE invoice_id = ? ORDER BY id ASC').all(invoiceId);
});

// Mettre à jour les paiements d'une facture
ipcMain.handle('invoice:updatePayments', (event, payload) => {
  const { invoiceId, payments } = payload;
  const tx = db.transaction(() => {
    // Delete existing payments
    db.prepare('DELETE FROM invoice_payments WHERE invoice_id = ?').run(invoiceId);
    // Insert new payments
    const insertPay = db.prepare('INSERT INTO invoice_payments (invoice_id, date, amount, method, note) VALUES (?, ?, ?, ?, ?)');
    payments.forEach(p => {
      if (p.amount > 0) {
        insertPay.run(invoiceId, p.date, p.amount, p.method || 'Virement', p.note || '');
      }
    });
  });
  tx();
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

// Send emails for multi-company invoices
async function sendMultiCompanyInvoiceEmails(created, payload) {
  // created: [{ companyId, invoiceId }, ...]
  // payload: { customerId, to, subject, text, ... }
  
  const results = [];
  
  // Get SMTP settings
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('smtp');
  const smtp = row ? JSON.parse(row.value) : null;
  if (!smtp) {
    return [{ ok: false, error: 'SMTP settings not configured' }];
  }
  
  const transporter = nodemailer.createTransport(smtp);
  const from = smtp.auth && smtp.auth.user ? smtp.auth.user : 'noreply@example.com';
  
  // Get customer info
  const customer = db.prepare('SELECT name, email FROM customers WHERE id = ?').get(payload.customerId);
  const customerEmail = payload.to || (customer ? customer.email : null);
  const customerName = customer ? customer.name : '';
  
  // Get company info for signature
  let companyInfo = {};
  try { 
    const crow = db.prepare('SELECT value FROM settings WHERE key = ?').get('company'); 
    if (crow) companyInfo = JSON.parse(crow.value); 
  } catch (e) {}
  
  // Generate PDFs for all invoices
  const invoicePdfs = [];
  for (const item of created) {
    try {
      const info = buildInvoiceHtml(item.invoiceId);
      const filename = `facture-${item.invoiceId}.pdf`;
      const pdfPath = await generatePdfFromHtml(info.html, filename);
      const company = db.prepare('SELECT name, email FROM companies WHERE id = ?').get(item.companyId);
      invoicePdfs.push({ 
        invoiceId: item.invoiceId, 
        companyId: item.companyId,
        companyName: company ? company.name : '',
        companyEmail: company ? company.email : null,
        filename, 
        pdfPath 
      });
    } catch (err) {
      console.error(`Error generating PDF for invoice ${item.invoiceId}:`, err);
    }
  }
  
  if (invoicePdfs.length === 0) {
    return [{ ok: false, error: 'No PDFs generated' }];
  }
  
  // Prepare email content
  const mailText = payload.text || `Bonjour ${customerName},\n\nVeuillez trouver ci-joint votre/vos facture(s).\n\nCordialement,\n${companyInfo.name || ''}`;
  const mailHtml = payload.html || `<p>Bonjour <strong>${customerName}</strong>,</p><p>Veuillez trouver ci-joint votre/vos facture(s).</p><p>Cordialement,<br/>${companyInfo.name || ''}</p>`;
  const subject = payload.subject || `Facture(s) ${customerName}`;
  
  // 1. Send to customer with ALL PDFs attached
  if (customerEmail) {
    const attachments = invoicePdfs.map(pdf => ({ filename: pdf.filename, path: pdf.pdfPath }));
    try {
      const infoSend = await transporter.sendMail({
        from,
        to: customerEmail,
        subject,
        text: mailText,
        html: mailHtml,
        attachments
      });
      results.push({ 
        ok: true, 
        recipient: customerEmail, 
        type: 'customer',
        info: infoSend 
      });
    } catch (err) {
      results.push({ 
        ok: false, 
        recipient: customerEmail, 
        type: 'customer',
        error: err.message 
      });
    }
  }
  
  // 2. Send to each company (CC) with only their invoice
  for (const pdf of invoicePdfs) {
    if (pdf.companyEmail) {
      const companySubject = `Copie facture ${pdf.companyName} - ${customerName}`;
      const companyText = `Bonjour,\n\nVeuillez trouver ci-joint une copie de la facture ${pdf.companyName} pour le client ${customerName}.\n\nCordialement,\n${companyInfo.name || ''}`;
      const companyHtml = `<p>Bonjour,</p><p>Veuillez trouver ci-joint une copie de la facture <strong>${pdf.companyName}</strong> pour le client <strong>${customerName}</strong>.</p><p>Cordialement,<br/>${companyInfo.name || ''}</p>`;
      
      try {
        const infoSend = await transporter.sendMail({
          from,
          to: pdf.companyEmail,
          subject: companySubject,
          text: companyText,
          html: companyHtml,
          attachments: [{ filename: pdf.filename, path: pdf.pdfPath }]
        });
        results.push({ 
          ok: true, 
          recipient: pdf.companyEmail, 
          type: 'company',
          companyName: pdf.companyName,
          info: infoSend 
        });
      } catch (err) {
        results.push({ 
          ok: false, 
          recipient: pdf.companyEmail, 
          type: 'company',
          companyName: pdf.companyName,
          error: err.message 
        });
      }
    }
  }
  
  return results;
}

ipcMain.handle('invoice:createAndSend', async (event, payload) => {
  try {
    const date = payload.invoice_date || payload.date || new Date().toISOString().slice(0, 10);
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
  const { invoiceId, amount, date } = payload;
  const current = db.prepare('SELECT paid FROM urssaf WHERE invoice_id = ?').get(invoiceId);
  const paid = (current && current.paid) ? (current.paid + amount) : amount;
  const paidDate = date || new Date().toISOString().slice(0,10);
  db.prepare('INSERT OR REPLACE INTO urssaf (invoice_id, amount, declared_date, paid, paid_date) VALUES (?, COALESCE((SELECT amount FROM urssaf WHERE invoice_id = ?), 0), COALESCE((SELECT declared_date FROM urssaf WHERE invoice_id = ?), NULL), ?, ?)')
    .run(invoiceId, invoiceId, invoiceId, paid, paidDate);
  return getDashboardData();
});

// ========== RAW MATERIALS MANAGEMENT ==========

ipcMain.handle('rawMaterial:getAll', () => {
  return db.prepare('SELECT * FROM raw_materials ORDER BY name').all();
});

ipcMain.handle('rawMaterial:add', (event, material) => {
  const result = db.prepare(`
    INSERT INTO raw_materials (name, unit, current_stock, unit_cost, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    material.name,
    material.unit || 'unité',
    material.current_stock || 0,
    material.unit_cost || 0,
    material.notes || null
  );
  return result.lastInsertRowid;
});

ipcMain.handle('rawMaterial:update', (event, material) => {
  db.prepare(`
    UPDATE raw_materials
    SET name = ?, unit = ?, current_stock = ?, unit_cost = ?, notes = ?
    WHERE id = ?
  `).run(
    material.name,
    material.unit,
    material.current_stock,
    material.unit_cost,
    material.notes,
    material.id
  );
  return getDashboardData();
});

ipcMain.handle('rawMaterial:delete', (event, id) => {
  db.prepare('DELETE FROM product_materials WHERE raw_material_id = ?').run(id);
  db.prepare('DELETE FROM raw_materials WHERE id = ?').run(id);
  return getDashboardData();
});

// Product composition (BOM)
ipcMain.handle('product:getMaterials', (event, productId) => {
  return db.prepare(`
    SELECT pm.*, rm.name, rm.unit, rm.unit_cost
    FROM product_materials pm
    JOIN raw_materials rm ON pm.raw_material_id = rm.id
    WHERE pm.product_id = ?
  `).all(productId);
});

ipcMain.handle('product:setMaterials', (event, productId, materials) => {
  // Delete existing compositions
  db.prepare('DELETE FROM product_materials WHERE product_id = ?').run(productId);
  
  // Insert new compositions
  const stmt = db.prepare(`
    INSERT INTO product_materials (product_id, raw_material_id, quantity)
    VALUES (?, ?, ?)
  `);
  
  materials.forEach(m => {
    if (m.raw_material_id && m.quantity > 0) {
      stmt.run(productId, m.raw_material_id, m.quantity);
    }
  });
  
  return getDashboardData();
});

// Calculate product cost based on materials
ipcMain.handle('product:calculateCost', (event, productId) => {
  const materials = db.prepare(`
    SELECT pm.quantity, rm.unit_cost, rm.name, rm.unit
    FROM product_materials pm
    JOIN raw_materials rm ON pm.raw_material_id = rm.id
    WHERE pm.product_id = ?
  `).all(productId);
  
  let totalCost = 0;
  const details = [];
  
  materials.forEach(m => {
    const cost = m.quantity * m.unit_cost;
    totalCost += cost;
    details.push({
      name: m.name,
      quantity: m.quantity,
      unit: m.unit,
      unit_cost: m.unit_cost,
      total: cost
    });
  });
  
  return { totalCost, details };
});

// Raw material purchase
ipcMain.handle('rawMaterialPurchase:add', (event, purchase) => {
  const date = purchase.date || new Date().toISOString().slice(0, 10);
  const total = purchase.quantity * purchase.unit_cost;
  const due = total - (purchase.paid || 0);
  
  const result = db.prepare(`
    INSERT INTO raw_material_purchases 
    (raw_material_id, supplier_id, company_id, date, quantity, unit_cost, total_cost, paid, due)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    purchase.raw_material_id,
    purchase.supplier_id || null,
    purchase.company_id || null,
    date,
    purchase.quantity,
    purchase.unit_cost,
    total,
    purchase.paid || 0,
    due
  );
  
  // Update stock and average cost
  const current = db.prepare('SELECT current_stock, unit_cost FROM raw_materials WHERE id = ?')
    .get(purchase.raw_material_id);
  
  if (current) {
    const newStock = (current.current_stock || 0) + purchase.quantity;
    // Weighted average cost
    const oldValue = (current.current_stock || 0) * (current.unit_cost || 0);
    const newValue = purchase.quantity * purchase.unit_cost;
    const newAvgCost = newStock > 0 ? (oldValue + newValue) / newStock : purchase.unit_cost;
    
    db.prepare(`
      UPDATE raw_materials 
      SET current_stock = ?, unit_cost = ?
      WHERE id = ?
    `).run(newStock, newAvgCost, purchase.raw_material_id);
  }
  
  return getDashboardData();
});

ipcMain.handle('rawMaterialPurchase:getAll', () => {
  return db.prepare(`
    SELECT 
      rmp.*,
      rm.name as material_name,
      rm.unit,
      s.name as supplier_name,
      c.name as company_name
    FROM raw_material_purchases rmp
    LEFT JOIN raw_materials rm ON rmp.raw_material_id = rm.id
    LEFT JOIN suppliers s ON rmp.supplier_id = s.id
    LEFT JOIN companies c ON rmp.company_id = c.id
    ORDER BY rmp.date DESC
  `).all();
});

ipcMain.handle('rawMaterialPurchase:update', (event, purchase) => {
  const { id, raw_material_id, company_id, date, quantity, unit_cost, delivery_date, paid_date } = purchase;
  const total = quantity * unit_cost;
  const paid = paid_date ? total : 0;
  const due = total - paid;
  
  const tx = db.transaction(() => {
    // Get old purchase to adjust stock
    const old = db.prepare('SELECT raw_material_id, quantity FROM raw_material_purchases WHERE id = ?').get(id);
    
    if (old) {
      // If same material, adjust by difference
      if (old.raw_material_id === raw_material_id) {
        const diff = quantity - old.quantity;
        db.prepare('UPDATE raw_materials SET current_stock = current_stock + ? WHERE id = ?').run(diff, raw_material_id);
      } else {
        // Material changed: remove old qty, add new qty
        db.prepare('UPDATE raw_materials SET current_stock = current_stock - ? WHERE id = ?').run(old.quantity, old.raw_material_id);
        db.prepare('UPDATE raw_materials SET current_stock = current_stock + ? WHERE id = ?').run(quantity, raw_material_id);
      }
    }
    
    db.prepare(`
      UPDATE raw_material_purchases 
      SET raw_material_id = ?, company_id = ?, date = ?, quantity = ?, unit_cost = ?, 
          total_cost = ?, paid = ?, due = ?, delivery_date = ?, paid_date = ?
      WHERE id = ?
    `).run(raw_material_id, company_id, date, quantity, unit_cost, total, paid, due, delivery_date || null, paid_date || null, id);
  });
  
  tx();
  return getDashboardData();
});

ipcMain.handle('rawMaterialPurchase:delete', (event, id) => {
  const tx = db.transaction(() => {
    // Get purchase to adjust stock
    const pu = db.prepare('SELECT raw_material_id, quantity FROM raw_material_purchases WHERE id = ?').get(id);
    if (pu) {
      db.prepare('UPDATE raw_materials SET current_stock = current_stock - ? WHERE id = ?').run(pu.quantity, pu.raw_material_id);
    }
    db.prepare('DELETE FROM raw_material_purchases WHERE id = ?').run(id);
  });
  
  tx();
  return getDashboardData();
});

app.whenReady().then(() => {
  initDb();
  scheduleBackup();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

let state = {
  customers: [],
  products: [],
  suppliers: [],
  invoices: [],
  purchases: [],
  ca_total: 0,
  receivables_total: 0,
  purchases_total: 0,
  payables_total: 0,
  payables_including_urssaf: 0,
  urssaf_total: 0,
  urssaf_paid: 0,
  urssaf_due: 0,
  totalClients: 0,
  totalFournisseurs: 0,
  current_cash: 0,
  settled_cash: 0,
  result_if_settled: 0
};

// global company filter for dashboard (company id as string or 'all')
let currentCompanyFilter = 'all';

function formatEuro(value) {
  return (value || 0).toFixed(2) + ' €';
}

function switchSection(targetId) {
  document.querySelectorAll('section').forEach(sec => {
    sec.classList.toggle('active', sec.id === targetId);
  });
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.target === targetId);
  });
}

function renderDashboard() {
  // Summary boxes
  
  const caEl = document.getElementById('ca-value');
  const recEl = document.getElementById('receivables-value');
  const payEl = document.getElementById('payables-value');
  const urssEl = document.getElementById('urssaf-value');
  const curEl = document.getElementById('current-net-value');
  const setEl = document.getElementById('settled-net-value');
  const resEl = document.getElementById('result-value');

  // compute summary values based on currentCompanyFilter
  const filterId = (currentCompanyFilter && currentCompanyFilter !== 'all') ? parseInt(currentCompanyFilter, 10) : null;
  const filteredInvoices = (state.invoices || []).filter(i => !filterId || i.company_id === filterId);
  const filteredPurchases = (state.purchases || []).filter(p => !filterId || p.company_id === filterId);

  const ca_total = filteredInvoices.reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
  const receivables_total = filteredInvoices.reduce((s, i) => s + (parseFloat(i.due) || 0), 0);
  const purchases_total = filteredPurchases.reduce((s, p) => s + (parseFloat(p.total_cost) || 0), 0);
  const payables_total = filteredPurchases.reduce((s, p) => s + (parseFloat(p.due) || 0), 0);
  const urssaf_due = filteredInvoices.reduce((s, i) => s + (parseFloat(i.urssaf_due) || 0), 0);

  if (caEl) caEl.textContent = formatEuro(ca_total || 0);
  if (recEl) recEl.textContent = formatEuro(receivables_total || 0);
  if (payEl) payEl.textContent = formatEuro(payables_total || 0);
  if (urssEl) urssEl.textContent = formatEuro(urssaf_due || 0);
  // keep simple approximations for cash/result
  const paidInvoices = filteredInvoices.reduce((s, i) => s + (parseFloat(i.paid) || 0), 0);
  const paidPurchases = filteredPurchases.reduce((s, p) => s + (parseFloat(p.paid) || 0), 0);
  const current_cash = paidInvoices - paidPurchases - urssaf_due;
  if (curEl) curEl.textContent = formatEuro(current_cash || 0);
  if (setEl) setEl.textContent = formatEuro(paidInvoices || 0);
  if (resEl) resEl.textContent = formatEuro((ca_total - purchases_total - urssaf_due) || 0);

  // Recent invoices (same as before)
  const tbodyInvDash = document.querySelector('#table-invoices-dashboard tbody');
  tbodyInvDash.innerHTML = '';
  // populate dashboard company filter
  const dashFilter = document.getElementById('dashboard-company-filter');
  if (dashFilter) {
    const cur = dashFilter.value || 'all';
    dashFilter.innerHTML = '';
    const oAll = document.createElement('option'); oAll.value = 'all'; oAll.textContent = 'Toutes'; dashFilter.appendChild(oAll);
    (state.companies || []).forEach(c => { const o = document.createElement('option'); o.value = String(c.id); o.textContent = c.name; dashFilter.appendChild(o); });
    dashFilter.value = cur;
    dashFilter.onchange = () => {
      currentCompanyFilter = dashFilter.value || 'all';
      // sync invoice filter select
      const invFilter = document.getElementById('invoice-company-filter'); if (invFilter) invFilter.value = currentCompanyFilter;
      // re-render full page to apply filter everywhere
      renderAll();
    };
  }

  const dashFilterVal = (dashFilter && dashFilter.value) ? dashFilter.value : 'all';
  state.invoices.slice(0, 5).forEach(inv => {
    if (dashFilterVal !== 'all') {
      const fid = parseInt(dashFilterVal, 10);
      if (inv.company_id !== fid) return;
    }
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${inv.id}</td>
      <td>${inv.company_name || ''}</td>
      <td>${inv.date}</td>
      <td>${inv.customer_name}</td>
      <td>${formatEuro(inv.total)}</td>
      <td>${formatEuro(inv.paid)}</td>
      <td>${formatEuro(inv.due)}</td>
    `;
    tbodyInvDash.appendChild(tr);
  });

  const tbodyPurDash = document.querySelector('#table-purchases-dashboard tbody');
  tbodyPurDash.innerHTML = '';
  // Use filtered purchases (respect dashboard/company filter) and show associated company
  filteredPurchases.slice(0, 5).forEach(pu => {
    const tr = document.createElement('tr');
    const compName = pu.company_name || ((state.companies||[]).find(c=>c.id===pu.company_id)||{}).name || '';
    tr.innerHTML = `
      <td>${pu.id}</td>
      <td>${compName}</td>
      <td>${pu.date}</td>
      <td>${pu.supplier_name}</td>
      <td>${pu.product_name}</td>
      <td>${pu.qty}</td>
      <td>${formatEuro(pu.total_cost)}</td>
      <td>${formatEuro(pu.paid)}</td>
      <td>${formatEuro(pu.due)}</td>
    `;
    tbodyPurDash.appendChild(tr);
  });
}

function renderSettings() {
  // Produits (onglet produits)
  const tbodyProd = document.querySelector('#table-products tbody');
  tbodyProd.innerHTML = '';
  state.products.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${formatEuro(p.price)}</td>
      <td>${p.stock}</td>
      <td>
        <button data-type="prod-edit" data-id="${p.id}">✏️</button>
        <button data-type="prod-del" data-id="${p.id}">🗑️</button>
        <button data-type="prod-config-roles" data-id="${p.id}" style="margin-left:6px">Configurer rôles & parts</button>
      </td>
    `;
    tbodyProd.appendChild(tr);
  });

  // Sociétés (onglet sociétés)
  const tbodyComp = document.querySelector('#table-companies tbody');
  if (tbodyComp) {
    tbodyComp.innerHTML = '';
    (state.companies || []).forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.id}</td>
        <td>${c.code}</td>
        <td>${c.name}</td>
        <td>
          <button data-type="company-edit" data-id="${c.id}">✏️</button>
          <button data-type="company-del" data-id="${c.id}">🗑️</button>
        </td>
      `;
      tbodyComp.appendChild(tr);
    });
  }

  // Clients (onglet clients)
  const ulCust = document.getElementById('list-customers');
  ulCust.innerHTML = '';
  state.customers.forEach(c => {
    const li = document.createElement('li');
      const left = document.createElement('div');
      left.textContent = `${c.name}${c.email ? ` (${c.email})` : ''}`;
      const right = document.createElement('div');
      right.innerHTML = `
        <button data-type="cust-edit" data-id="${c.id}">✏️</button>
        <button data-type="cust-del" data-id="${c.id}">🗑️</button>`;
      li.appendChild(left);
      li.appendChild(right);
    ulCust.appendChild(li);
  });

  // Fournisseurs (onglet fournisseurs)
  const ulSup = document.getElementById('list-suppliers');
  ulSup.innerHTML = '';
  state.suppliers.forEach(s => {
    const li = document.createElement('li');
      const left = document.createElement('div');
      left.textContent = s.name;
      const right = document.createElement('div');
      right.innerHTML = `
        <button data-type="sup-edit" data-id="${s.id}">✏️</button>
        <button data-type="sup-del" data-id="${s.id}">🗑️</button>`;
      li.appendChild(left);
      li.appendChild(right);
    ulSup.appendChild(li);
  });

  // Email settings: remplir les champs si déjà configurés
  loadSmtpSettings();
}

async function loadSmtpSettings() {
  try {
    const smtp = await window.api.getSetting('smtp');
    if (!smtp) return;
    document.getElementById('smtp-host').value = smtp.host || '';
    document.getElementById('smtp-port').value = smtp.port || 465;
    document.getElementById('smtp-secure').value = smtp.secure ? 'true' : 'false';
    document.getElementById('smtp-user').value = (smtp.auth && smtp.auth.user) || '';
    document.getElementById('smtp-pass').value = (smtp.auth && smtp.auth.pass) || '';
  } catch (err) {
    console.error('loadSmtpSettings', err);
  }
}

async function loadCompanySettings() {
  try {
    const company = await window.api.getSetting('company');
    if (!company) return;
    document.getElementById('company-name').value = company.name || '';
    document.getElementById('company-address').value = company.address || '';
    document.getElementById('company-siret').value = company.siret || '';
    document.getElementById('company-legal').value = company.legal || 'TVA non applicable, article 293 B du CGI';
    document.getElementById('company-logo').value = company.logo || '';
  } catch (err) {
    console.error('loadCompanySettings', err);
  }
}

function renderInvoices() {
  // populate company filter
  const compFilter = document.getElementById('invoice-company-filter');
  if (compFilter) {
    const current = compFilter.value || 'all';
    compFilter.innerHTML = '';
    const oAll = document.createElement('option'); oAll.value = 'all'; oAll.textContent = 'Toutes'; compFilter.appendChild(oAll);
    (state.companies || []).forEach(c => { const o = document.createElement('option'); o.value = String(c.id); o.textContent = c.name; compFilter.appendChild(o); });
    compFilter.value = current;
    compFilter.onchange = () => {
      currentCompanyFilter = compFilter.value || 'all';
      // sync dashboard filter
      const dash = document.getElementById('dashboard-company-filter'); if (dash) dash.value = currentCompanyFilter;
      // re-render whole page
      renderAll();
    };
  }
  // Selects
  const selCust = document.getElementById('invoice-customer');
  selCust.innerHTML = '';

  state.customers.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    selCust.appendChild(opt);
  });

  // invoice product selects are created per-line in the invoice lines UI

  // Ensure existing invoice-line product selects are up-to-date
  const refreshLineSelects = () => {
    const container = document.getElementById('invoice-lines');
    if (!container) return;
    const selects = container.querySelectorAll('.invoice-line-product');
    selects.forEach(sel => {
      const current = sel.value;
      sel.innerHTML = '';
      state.products.forEach(p => {
        const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.name} (${formatEuro(p.price)})`; sel.appendChild(o);
      });
      if (current) sel.value = current;
    });
  };

  refreshLineSelects();

  // Table factures
  const tbody = document.querySelector('#table-invoices tbody');
  tbody.innerHTML = '';
  const filterVal = (document.getElementById('invoice-company-filter') && document.getElementById('invoice-company-filter').value) || 'all';
  state.invoices.forEach(inv => {
    if (filterVal !== 'all') {
      const fid = parseInt(filterVal, 10);
      if (inv.company_id !== fid) return; // skip invoices not matching selected company
    }
    const tr = document.createElement('tr');
    const statusBadge = inv.due <= 0.001
      ? '<span class="badge badge-ok">Payée</span>'
      : '<span class="badge badge-warn">En cours</span>';

    // URSSAF info
    const urssafAmount = inv.urssaf_amount || 0;
    const urssafPaid = inv.urssaf_paid || 0;
    const urssafDue = inv.urssaf_due || 0;
    const urssafDeclared = inv.urssaf_declared_date ? `Déclaré (${inv.urssaf_declared_date})` : 'Non déclaré';

    tr.innerHTML = `
      <td>${inv.id}</td>
      <td>${inv.company_name || ''}</td>
      <td>${inv.date}</td>
      <td>${inv.customer_name}</td>
      <td>${formatEuro(inv.total)}</td>
      <td>${formatEuro(inv.paid)}</td>
      <td>${formatEuro(inv.due)} ${statusBadge}</td>
      <td>
        <div style="font-size:12px">${formatEuro(urssafAmount)}</div>
        <div style="font-size:11px;color:#666">${urssafDeclared}</div>
        <div style="margin-top:6px">
          <input type="date" data-type="urssaf-declare-date" data-id="${inv.id}" style="width:140px;" />
          <button data-type="urssaf-declare-btn" data-id="${inv.id}">Marquer déclaré</button>
        </div>
        <div style="margin-top:6px">
          <input type="number" min="0" step="0.01" placeholder="Paiement URSSAF" data-type="urssaf-pay-amount" data-id="${inv.id}" style="width:110px;" />
          <button data-type="urssaf-pay-btn" data-id="${inv.id}">Payer</button>
        </div>
        <div style="font-size:11px;color:#666;margin-top:6px">Payé: ${formatEuro(urssafPaid)} • Restant: ${formatEuro(urssafDue)}</div>
      </td>
      <td>
        <input type="number" min="0" step="0.01"
               placeholder="Montant"
               data-type="inv-pay-amount" data-id="${inv.id}" style="width:80px;"/>
        <button data-type="inv-pay-btn" data-id="${inv.id}">OK</button>
      </td>
      <td>
        <button data-type="inv-edit" data-id="${inv.id}">✏️ Modifier</button>
        <button data-type="inv-del" data-id="${inv.id}">🗑️ Supprimer</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderPurchases() {
  // Selects
  const selSup = document.getElementById('purchase-supplier');
  const selProd = document.getElementById('purchase-product');
  const selComp = document.getElementById('purchase-company');
  selSup.innerHTML = '';
  selProd.innerHTML = '';
  if (selComp) selComp.innerHTML = '';

  state.suppliers.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    selSup.appendChild(opt);
  });

  state.products.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    selProd.appendChild(opt);
  });
  if (selComp) {
    (state.companies || []).forEach(c => {
      const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name; selComp.appendChild(opt);
    });
  }

  // Table achats
  const tbody = document.querySelector('#table-purchases tbody');
  tbody.innerHTML = '';
  state.purchases.forEach(pu => {
    // apply global company filter
    const filterId = (currentCompanyFilter && currentCompanyFilter !== 'all') ? parseInt(currentCompanyFilter, 10) : null;
    if (filterId && pu.company_id !== filterId) return;
    const statusBadge = pu.due <= 0.001
      ? '<span class="badge badge-ok">Payé</span>'
      : '<span class="badge badge-warn">À payer</span>';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${pu.id}</td>
      <td>${((state.companies||[]).find(c=>c.id===pu.company_id)||{}).name||''}</td>
      <td>${pu.date}</td>
      <td>${pu.supplier_name}</td>
      <td>${pu.product_name}</td>
      <td>${pu.qty}</td>
      <td>${formatEuro(pu.total_cost)}</td>
      <td>${formatEuro(pu.paid)}</td>
      <td>${formatEuro(pu.due)} ${statusBadge}</td>
      <td>
        <input type="number" min="0" step="0.01"
               placeholder="Montant"
               data-type="pur-pay-amount" data-id="${pu.id}" style="width:80px;"/>
        <button data-type="pur-pay-btn" data-id="${pu.id}">OK</button>
      </td>
      <td>
        <button data-type="pur-edit" data-id="${pu.id}">✏️ Modifier</button>
        <button data-type="pur-del" data-id="${pu.id}">🗑️ Supprimer</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAll() {
  renderDashboard();
  renderSettings();
  renderInvoices();
  renderPurchases();
}

async function refresh() {
  const data = await window.api.init();
  state = data;
  renderAll();
}

document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.target));
  });

  // Tabs inside Settings
  document.querySelectorAll('.tab-btn').forEach(tb => {
    tb.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(x => x.classList.toggle('active', x === tb));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.toggle('active', p.id === tb.dataset.tab));
    });
  });

  // Charger paramètres SMTP et company
  loadSmtpSettings();
  loadCompanySettings();

  // Sauvegarder company
  document.getElementById('btn-save-company').addEventListener('click', async () => {
    const name = document.getElementById('company-name').value.trim();
    const address = document.getElementById('company-address').value.trim();
    const siret = document.getElementById('company-siret').value.trim();
    const legal = document.getElementById('company-legal').value.trim();
    const logo = document.getElementById('company-logo').value.trim();

    const company = { name, address, siret, legal, logo };
    await window.api.setSetting('company', company);
    alert('Informations société enregistrées');
  });

  // Parcourir / uploader logo
  const btnBrowseLogo = document.getElementById('btn-browse-logo');
  if (btnBrowseLogo) {
    btnBrowseLogo.addEventListener('click', async () => {
      const result = await window.api.selectLogo();
      if (!result) return; // cancelled or error
      document.getElementById('company-logo').value = result;
      alert('Logo copié dans le dossier de l\'application : ' + result + '. Cliquez sur "Enregistrer société" pour sauvegarder.');
    });
  }

  // Invoice lines UI: helper to add/remove lines
  function addInvoiceLineRow(initial) {
    const container = document.getElementById('invoice-lines');
    const row = document.createElement('div');
    row.className = 'invoice-line';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = '1fr 120px 1fr 80px';
    row.style.gap = '8px';
    row.style.marginBottom = '8px';

    const prodSel = document.createElement('select');
    prodSel.className = 'invoice-line-product';
    state.products.forEach(p => {
      const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.name} (${formatEuro(p.price)})`; prodSel.appendChild(o);
    });
    if (initial && initial.productId) prodSel.value = initial.productId;

    const qty = document.createElement('input'); qty.type = 'number'; qty.className = 'invoice-line-qty'; qty.min = '0.01'; qty.step = '0.01'; qty.value = (initial && initial.qty) ? initial.qty : '1';

    const note = document.createElement('input'); note.type = 'text'; note.className = 'invoice-line-note'; note.placeholder = 'Note (optionnel)'; if (initial && initial.note) note.value = initial.note;

    const btns = document.createElement('div');
    const btnRemove = document.createElement('button'); btnRemove.type = 'button'; btnRemove.textContent = 'Supprimer'; btnRemove.style.padding = '6px';
    btnRemove.addEventListener('click', () => { row.remove(); });
    const btnAlloc = document.createElement('button'); btnAlloc.type = 'button'; btnAlloc.textContent = 'Répartitions rôles'; btnAlloc.style.marginLeft = '6px'; btnAlloc.dataset.type = 'line-role-alloc';
    btns.appendChild(btnRemove);
    btns.appendChild(btnAlloc);

    // assign a stable index for allocations
    if (!window._invoiceLineIdCounter) window._invoiceLineIdCounter = 1;
    row.dataset.lineIndex = window._invoiceLineIdCounter++;

    row.appendChild(prodSel);
    row.appendChild(qty);
    row.appendChild(note);
    row.appendChild(btns);

    container.appendChild(row);
    return row;
  }

  // Initialize invoice-lines container with one row if empty
  const invoiceLinesContainer = document.getElementById('invoice-lines');
  if (invoiceLinesContainer && invoiceLinesContainer.children.length === 0) {
    addInvoiceLineRow();
  }

  const btnAddLine = document.getElementById('btn-add-invoice-line');
  if (btnAddLine) btnAddLine.addEventListener('click', () => addInvoiceLineRow());
    
    

  // Ajout produit
  document.getElementById('btn-add-product').addEventListener('click', async () => {
    const name = document.getElementById('product-name').value.trim();
    const price = parseFloat(document.getElementById('product-price').value || '0');
    const stock = parseInt(document.getElementById('product-stock').value || '0', 10);

    if (!name) return alert('Nom du produit obligatoire');
    await window.api.addProduct({ name, price, stock });
    document.getElementById('product-name').value = '';
    await refresh();
  });

  // Ajout société
  const btnAddCompany = document.getElementById('btn-add-company');
  if (btnAddCompany) {
    btnAddCompany.addEventListener('click', async () => {
      const code = (document.getElementById('company-code-new').value || '').trim();
      const name = (document.getElementById('company-name-new').value || '').trim();
      if (!code || !name) return alert('Code et nom requis');
      try {
        await window.api.addCompany({ code, name });
        document.getElementById('company-code-new').value = '';
        document.getElementById('company-name-new').value = '';
        await refresh();
      } catch (err) {
        console.error('addCompany error', err);
        alert('Erreur création société: ' + (err && err.message ? err.message : err));
      }
    });
  }

  // Ajout client
  document.getElementById('btn-add-customer').addEventListener('click', async () => {
    const name = document.getElementById('customer-name').value.trim();
    const email = document.getElementById('customer-email').value.trim();
    if (!name) return alert('Nom du client obligatoire');
    await window.api.addCustomer({ name, email });
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-email').value = '';
    await refresh();
  });

  // Ajout fournisseur
  document.getElementById('btn-add-supplier').addEventListener('click', async () => {
    const name = document.getElementById('supplier-name').value.trim();
    if (!name) return alert('Nom du fournisseur obligatoire');
    await window.api.addSupplier({ name });
    document.getElementById('supplier-name').value = '';
    await refresh();
  });

  // Replace direct creation: open an invoice-edit modal to edit the whole invoice before creating
  const btnCreateInvoice = document.getElementById('btn-create-invoice');

  // Build and manage modal lines
  const invoiceEditModal = document.getElementById('invoice-edit-modal');
  if (invoiceEditModal) {
    const editLinesContainer = document.getElementById('invoice-edit-lines');
    const editAddLine = document.getElementById('invoice-edit-add-line');
    const editSave = document.getElementById('invoice-edit-save');
    const editCancel = document.getElementById('invoice-edit-cancel');

    // opener function (has access to editLinesContainer and helpers)
    async function openInvoiceEditModal() {
      // populate customers select
      const custSel = document.getElementById('invoice-edit-customer');
      custSel.innerHTML = '';
      (state.customers || []).forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; custSel.appendChild(o); });

      // clear lines and add a single blank line
      editLinesContainer.innerHTML = '';
      addEditLine();

      // reset send-email checkbox
      const se = document.getElementById('invoice-edit-send-email'); if (se) se.checked = false;

      invoiceEditModal.style.display = 'flex';
    }

    // wire both buttons to open the modal
    if (btnCreateInvoice) btnCreateInvoice.addEventListener('click', async () => { await openInvoiceEditModal(); });
    const btnNewInvoice = document.getElementById('btn-new-invoice');
    if (btnNewInvoice) btnNewInvoice.addEventListener('click', async () => { await openInvoiceEditModal(); });

    function createProductSelect(selectedId) {
      const sel = document.createElement('select');
      const emptyOpt = document.createElement('option'); emptyOpt.value = ''; emptyOpt.textContent = '-- Choisir produit --'; sel.appendChild(emptyOpt);
      state.products.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = `${p.name} (${formatEuro(p.price)})`; sel.appendChild(o); });
      if (selectedId) sel.value = selectedId;
      return sel;
    }

    async function populateRoleAreaForRow(row, productId, existingAlloc = []) {
      // remove prior role area
      let roleArea = row.querySelector('.edit-role-area');
      if (roleArea) roleArea.remove();
      roleArea = document.createElement('div'); roleArea.className = 'edit-role-area'; roleArea.style.display = 'grid'; roleArea.style.gap = '6px'; roleArea.style.marginTop = '4px';

      // load allowed companies for product
      let allowed = [];
      try { allowed = await window.api.getProductRoleCompanies(productId); } catch (e) { allowed = []; }
      const allowedMap = {};
      (allowed || []).forEach(a => { if (!allowedMap[a.role_id]) allowedMap[a.role_id] = []; allowedMap[a.role_id].push(a.company_id); });

      (state.roles || []).forEach(r => {
        const line = document.createElement('div'); line.style.display = 'flex'; line.style.gap = '8px'; line.style.alignItems = 'center';
        const lbl = document.createElement('div'); lbl.style.width = '120px'; lbl.textContent = r.name;
        const sel = document.createElement('select'); sel.style.minWidth = '160px';
        const allowedCompanies = allowedMap[r.id] || [];
        if ((allowedCompanies || []).length === 0) {
          const o = document.createElement('option'); o.value = ''; o.textContent = 'Aucune société configurée'; sel.appendChild(o); sel.disabled = true;
          line.appendChild(lbl); line.appendChild(sel);
          const warn = document.createElement('div'); warn.style.color = '#b00'; warn.style.fontSize = '12px'; warn.textContent = 'Configurer roles → Produits'; line.appendChild(warn);
          roleArea.appendChild(line);
          return;
        }
        allowedCompanies.forEach(cid => { const c = (state.companies || []).find(x => x.id === cid); if (c) { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; sel.appendChild(o); } });

        // if only one company is allowed for this role, auto-select it (but keep select enabled for clarity)
        if ((allowedCompanies || []).length === 1) {
          sel.value = allowedCompanies[0];
        }

        const ex = existingAlloc.find(x => x.role_id === r.id);
        if (ex) { if (allowedCompanies.includes(ex.company_id)) sel.value = ex.company_id; }

        line.appendChild(lbl); line.appendChild(sel);
        line.dataset.roleId = r.id;
        roleArea.appendChild(line);
      });

      row.appendChild(roleArea);
    }

    function addEditLine(initial) {
      const row = document.createElement('div'); row.className = 'invoice-edit-line'; row.style.display = 'grid'; row.style.gridTemplateColumns = '1fr 120px 1fr 140px'; row.style.gap = '8px'; row.style.alignItems = 'center';
      const prodSel = createProductSelect(initial && initial.productId);
      const qty = document.createElement('input'); qty.type = 'number'; qty.min = '0.01'; qty.step = '0.01'; qty.value = (initial && initial.qty) ? initial.qty : '1'; qty.className = 'invoice-edit-line-qty';
      const note = document.createElement('input'); note.type = 'text'; note.placeholder = 'Note (optionnel)'; note.value = (initial && initial.note) ? initial.note : '';
      const right = document.createElement('div'); right.style.display = 'flex'; right.style.gap = '6px';
      const btnRemove = document.createElement('button'); btnRemove.type = 'button'; btnRemove.textContent = 'Supprimer'; btnRemove.style.padding = '6px';
      btnRemove.addEventListener('click', () => { row.remove(); });
      right.appendChild(btnRemove);

      row.appendChild(prodSel); row.appendChild(qty); row.appendChild(note); row.appendChild(right);
      editLinesContainer.appendChild(row);

      // populate role area for this product if a product is selected
      (async () => {
        let existingAlloc = [];
        if (initial && initial.allocations) existingAlloc = initial.allocations;
        if (prodSel.value) await populateRoleAreaForRow(row, parseInt(prodSel.value, 10), existingAlloc);
      })();

      prodSel.addEventListener('change', async () => {
        if (!prodSel.value) {
          // remove role area if no product selected
          const ra = row.querySelector('.edit-role-area'); if (ra) ra.remove();
        } else {
          await populateRoleAreaForRow(row, parseInt(prodSel.value, 10), []);
        }
        // if this row is the last row and a product was selected, auto-append a new blank line
        const rows = Array.from(editLinesContainer.querySelectorAll('.invoice-edit-line'));
        const last = rows[rows.length - 1];
        if (last === row) {
          const val = prodSel.value;
          if (val && val !== '') {
            addEditLine();
          }
        }
      });

      return row;
    }

    editAddLine.addEventListener('click', () => addEditLine());

    editCancel.addEventListener('click', () => { invoiceEditModal.style.display = 'none'; });

    editSave.addEventListener('click', async () => {
      const customerId = parseInt(document.getElementById('invoice-edit-customer').value, 10);
      const sendEmail = document.getElementById('invoice-edit-send-email').checked;
      if (!customerId) return alert('Client requis');

      const rows = Array.from(editLinesContainer.querySelectorAll('.invoice-edit-line'));
      if (rows.length === 0) return alert('Ajoutez au moins une ligne');

      const lines = [];
      for (const r of rows) {
        const prodSel = r.querySelector('select');
        const qtyInput = r.querySelector('.invoice-edit-line-qty');
        const noteInput = r.querySelector('input[type="text"]');
        const productId = parseInt(prodSel.value, 10);
        const qty = parseFloat(qtyInput.value || '0');

        // skip blank lines (no product or zero qty)
        if (!productId || qty <= 0) continue;

        const product = state.products.find(p => p.id === productId);
        if (!product) return alert('Produit introuvable');

        // read allocations from role area
        const roleWrappers = Array.from(r.querySelectorAll('.edit-role-area > div'));
        // read allocations: for each role, if a company selected, assign the full line qty to that role-company
        const allocations = roleWrappers.map(w => {
          const role_id = parseInt(w.dataset.roleId, 10);
          const sel = w.querySelector('select');
          const company_id = sel && sel.value ? parseInt(sel.value, 10) : null;
          return company_id ? { role_id, company_id, qty: qty } : null;
        }).filter(a => a !== null);

        const line = { productId, qty, unit_price: product.price, note: (noteInput && noteInput.value) ? noteInput.value.trim() : null };
        if (allocations && allocations.length) line.allocations = allocations;
        lines.push(line);
      }

      if (lines.length === 0) return alert('Ajoutez au moins une ligne valide (produit + quantité)');

      // determine whether any allocations are present
      const hasAlloc = lines.some(l => l.allocations && l.allocations.length);
      try {
        if (hasAlloc) {
          await window.api.createByRole({ customerId, lines });
          alert('Factures par société créées à partir des répartitions par rôle. (Envoi email non géré automatiquement)');
        } else {
          if (sendEmail) {
            // store pending invoice and open email modal for composition
            window._pendingInvoice = { customerId, lines };
            const emailModal = document.getElementById('email-modal');
            const emailTo = document.getElementById('email-to');
            const emailSubject = document.getElementById('email-subject');
            const emailBody = document.getElementById('email-body');
            const cust = state.customers.find(c => c.id === customerId) || {};
            emailTo.value = cust.email || '';
            emailSubject.value = `Facture pour ${cust.name || ''}`;
            emailBody.value = `Bonjour ${cust.name || ''},\n\nVeuillez trouver ci-joint votre facture.\n\nCordialement,\n${(document.getElementById('company-name') && document.getElementById('company-name').value) || ''}`;
            emailModal.style.display = 'flex';
          } else {
            await window.api.createInvoice({ customerId, lines });
            alert('Facture créée (sans envoi d\'email).');
          }
        }
        invoiceEditModal.style.display = 'none';
        await refresh();
      } catch (err) {
        console.error('create invoice error', err);
        alert('Erreur lors de la création de la/les facture(s): ' + (err && err.message ? err.message : err));
      }
    });
  }

  // Email modal handlers
  const emailModal = document.getElementById('email-modal');
  if (emailModal) {
    const btnSend = document.getElementById('email-send');
    const btnCancel = document.getElementById('email-cancel');

    btnCancel.addEventListener('click', () => {
      emailModal.style.display = 'none';
      window._pendingInvoice = null;
    });

    btnSend.addEventListener('click', async () => {
      const to = document.getElementById('email-to').value.trim();
      const subject = document.getElementById('email-subject').value.trim();
      const text = document.getElementById('email-body').value || '';
      const pending = window._pendingInvoice;
      if (!pending) return alert('Aucune facture en attente');
      if (!to) return alert('Destinataire requis');

      // call backend createAndSend with email content
      const res = await window.api.createInvoiceAndSend({ customerId: pending.customerId, lines: pending.lines, sendEmail: true, to, subject, text });
      if (res && res.error) {
        alert('Erreur : ' + res.error);
      } else {
        if (res.mailResult) {
          if (res.mailResult.ok) alert('Facture créée et email envoyé.');
          else alert('Facture créée mais erreur envoi : ' + res.mailResult.error);
        } else {
          alert('Facture créée.');
        }
      }
      emailModal.style.display = 'none';
      window._pendingInvoice = null;
      await refresh();
    });
  }

  // Shares modal handlers
  const sharesModal = document.getElementById('shares-modal');
  if (sharesModal) {
    const btnSave = document.getElementById('shares-save');
    const btnCancel = document.getElementById('shares-cancel');
    btnCancel.addEventListener('click', () => {
      sharesModal.style.display = 'none';
      window._sharesPending = null;
    });

    btnSave.addEventListener('click', async () => {
      const pending = window._sharesPending;
      if (!pending) return alert('Aucun produit sélectionné');
      const productId = pending.productId;
      const body = document.getElementById('shares-modal-body');
      const inputs = Array.from(body.querySelectorAll('input'));
      const shares = inputs.map(i => ({ role_id: parseInt(i.dataset.roleId, 10), amount_per_unit: parseFloat(i.value || '0') || 0 }));
      try {
        await window.api.setProductRoleShares(productId, shares);
        alert('Parts par rôle enregistrées');
        sharesModal.style.display = 'none';
        window._sharesPending = null;
        await refresh();
      } catch (err) {
        console.error('setProductRoleShares error', err);
        alert('Erreur lors de l\'enregistrement des parts');
      }
    });
  }

  // Role participants modal handlers
  const roleParticipantsModal = document.getElementById('role-participants-modal');
  if (roleParticipantsModal) {
    const bodyRP = document.getElementById('role-participants-body');
    const titleRP = document.getElementById('role-participants-title');
    const btnSaveRP = document.getElementById('role-participants-save');
    const btnCancelRP = document.getElementById('role-participants-cancel');
    let _rpPending = null; // { productId }

    btnCancelRP.addEventListener('click', () => {
      roleParticipantsModal.style.display = 'none';
      _rpPending = null;
    });

    btnSaveRP.addEventListener('click', async () => {
      if (!_rpPending) return;
      const productId = _rpPending.productId;
      // collect checked entries: for each role, collect checked companies
      // This handler preserved for backward-compat; prefer using unified config modal
      const rows = Array.from(bodyRP.querySelectorAll('[data-role-id]'));
      const entries = [];
      rows.forEach(r => {
        const role_id = parseInt(r.dataset.roleId, 10);
        const checks = Array.from(r.querySelectorAll('input[type="checkbox"]'));
        checks.forEach(ch => {
          if (ch.checked) entries.push({ role_id, company_id: parseInt(ch.dataset.companyId, 10) });
        });
      });
      try {
        await window.api.setProductRoleCompanies(productId, entries);
        alert('Participants par rôle enregistrés');
        roleParticipantsModal.style.display = 'none';
        _rpPending = null;
        await refresh();
      } catch (err) {
        console.error('setProductRoleCompanies error', err);
        alert('Erreur enregistrement participants');
      }
    });

    // open modal when clicking configure roles button
    document.body.addEventListener('click', async (ev) => {
      const t = ev.target;
      if (!t || !t.dataset) return;

      // legacy participants button
      if (t.dataset.type === 'prod-role-participants') {
        const productId = parseInt(t.dataset.id, 10);
        const product = state.products.find(p => p.id === productId);
        if (!product) return alert('Produit introuvable');
        _rpPending = { productId };
        titleRP.textContent = `Configurer participants pour ${product.name}`;
        bodyRP.innerHTML = '';
        const roles = state.roles || [];
        let existing = [];
        try { existing = await window.api.getProductRoleCompanies(productId); } catch (e) { existing = []; }
        roles.forEach(r => {
          const wrapper = document.createElement('div');
          wrapper.dataset.roleId = r.id;
          const h = document.createElement('div'); h.textContent = r.name; h.style.fontWeight = '600'; h.style.marginTop = '8px';
          wrapper.appendChild(h);
          const row = document.createElement('div'); row.style.display = 'flex'; row.style.gap = '8px'; row.style.flexWrap = 'wrap'; row.style.marginTop = '6px';
          (state.companies || []).forEach(c => {
            const id = c.id;
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.dataset.companyId = id; cb.id = `rp_${productId}_${r.id}_${id}`;
            const lab = document.createElement('label'); lab.htmlFor = cb.id; lab.style.marginRight = '8px'; lab.appendChild(cb); lab.appendChild(document.createTextNode(' ' + c.name));
            const found = existing.find(x => x.role_id === r.id && x.company_id === c.id);
            if (found) cb.checked = true;
            row.appendChild(lab);
          });
          wrapper.appendChild(row);
          bodyRP.appendChild(wrapper);
        });
        roleParticipantsModal.style.display = 'flex';
        return;
      }

      // unified product config button
      if (t.dataset.type === 'prod-config-roles') {
        const productId = parseInt(t.dataset.id, 10);
        const product = state.products.find(p => p.id === productId);
        if (!product) return alert('Produit introuvable');

        const modal = document.getElementById('product-role-config-modal');
        const body = document.getElementById('product-role-config-body');
        const title = document.getElementById('product-role-config-title');
        title.textContent = `Configurer rôles & parts pour ${product.name}`;
        body.innerHTML = '';

        // get existing shares and participants
        let existingShares = [];
        let existingParticipants = [];
        try { existingShares = await window.api.getProductRoleShares(productId); } catch (e) { existingShares = []; }
        try { existingParticipants = await window.api.getProductRoleCompanies(productId); } catch (e) { existingParticipants = []; }

        const participantsMap = {};
        (existingParticipants || []).forEach(p => { if (!participantsMap[p.role_id]) participantsMap[p.role_id] = []; participantsMap[p.role_id].push(p.company_id); });
        const sharesMap = {};
        (existingShares || []).forEach(s => sharesMap[s.role_id] = s.amount_per_unit || 0);

        (state.roles || []).forEach(r => {
          const row = document.createElement('div'); row.style.display = 'grid'; row.style.gridTemplateColumns = '1fr 1fr'; row.style.gap = '8px'; row.style.alignItems = 'start';
          const left = document.createElement('div');
          const lbl = document.createElement('div'); lbl.textContent = r.name; lbl.style.fontWeight = '600'; left.appendChild(lbl);
          const inp = document.createElement('input'); inp.type = 'number'; inp.step = '0.01'; inp.min = '0'; inp.value = sharesMap[r.id] !== undefined ? sharesMap[r.id] : 0; inp.dataset.roleId = r.id; inp.style.width = '100%';
          const hint = document.createElement('div'); hint.style.fontSize = '12px'; hint.style.color = '#666'; hint.textContent = 'Montant par unité pour ce rôle';
          left.appendChild(inp); left.appendChild(hint);

          const right = document.createElement('div');
          (state.companies || []).forEach(c => {
            const cb = document.createElement('input'); cb.type = 'checkbox'; cb.dataset.companyId = c.id; cb.id = `prc_${productId}_${r.id}_${c.id}`;
            const lab = document.createElement('label'); lab.htmlFor = cb.id; lab.style.display = 'block'; lab.style.marginBottom = '4px'; lab.appendChild(cb); lab.appendChild(document.createTextNode(' ' + c.name));
            const allowed = participantsMap[r.id] || [];
            if (allowed.includes(c.id)) cb.checked = true;
            right.appendChild(lab);
          });

          row.appendChild(left); row.appendChild(right);
          row.dataset.roleId = r.id;
          body.appendChild(row);
        });

        // store productId for save handler
        modal.dataset.productId = productId;
        modal.style.display = 'flex';
        return;
      }
    });
  }

  // Product role config modal save/cancel
  const prcModal = document.getElementById('product-role-config-modal');
  if (prcModal) {
    const prcBody = document.getElementById('product-role-config-body');
    const prcSave = document.getElementById('product-role-config-save');
    const prcCancel = document.getElementById('product-role-config-cancel');

    prcCancel.addEventListener('click', () => { prcModal.style.display = 'none'; prcModal.dataset.productId = ''; });

    prcSave.addEventListener('click', async () => {
      const pid = parseInt(prcModal.dataset.productId, 10);
      if (!pid) return alert('Produit introuvable');

      // collect shares and participants
      const rows = Array.from(prcBody.querySelectorAll('div[data-role-id]'));
      const shares = [];
      const participants = [];
      rows.forEach(r => {
        const role_id = parseInt(r.dataset.roleId, 10);
        const amountInput = r.querySelector('input[type="number"]');
        const amount = parseFloat(amountInput.value || '0') || 0;
        shares.push({ role_id, amount_per_unit: amount });
        const checks = Array.from(r.querySelectorAll('input[type="checkbox"]'));
        checks.forEach(cb => { if (cb.checked) participants.push({ role_id, company_id: parseInt(cb.dataset.companyId, 10) }); });
      });

      try {
        await window.api.setProductRoleShares(pid, shares);
        await window.api.setProductRoleCompanies(pid, participants);
        alert('Configuration rôles et parts enregistrée');
        prcModal.style.display = 'none'; prcModal.dataset.productId = '';
        await refresh();
      } catch (err) {
        console.error('product-role-config save error', err);
        alert('Erreur enregistrement configuration');
      }
    });
  }

  // Role allocation modal handlers
  const roleAllocModal = document.getElementById('role-alloc-modal');
  if (roleAllocModal) {
    const allocBody = document.getElementById('role-alloc-body');
    const allocTitle = document.getElementById('role-alloc-title');
    const allocSave = document.getElementById('role-alloc-save');
    const allocCancel = document.getElementById('role-alloc-cancel');

    let _currentAllocRow = null;
    let _currentAllocLineQty = 0;

    allocCancel.addEventListener('click', () => {
      roleAllocModal.style.display = 'none';
      _currentAllocRow = null;
    });

    allocSave.addEventListener('click', async () => {
      if (!_currentAllocRow) return;
      const wrappers = Array.from(allocBody.querySelectorAll('[data-role-id]'));
      // For each selected company per role, assign the full line qty to that allocation
      const allocations = wrappers.map(w => {
        const role_id = parseInt(w.dataset.roleId, 10);
        const sel = w.querySelector('select');
        const company_id = sel && sel.value ? parseInt(sel.value, 10) : null;
        return company_id ? { role_id, company_id, qty: _currentAllocLineQty } : null;
      }).filter(a => a !== null);

      // save allocations JSON into row dataset
      _currentAllocRow.dataset.allocations = JSON.stringify(allocations);
      roleAllocModal.style.display = 'none';
      _currentAllocRow = null;
      _currentAllocLineQty = 0;
    });

    // Open role alloc modal when requested
    document.body.addEventListener('click', async (ev) => {
      const t = ev.target;
      if (!t || !t.dataset) return;
      if (t.dataset.type === 'line-role-alloc') {
        const row = t.closest('.invoice-line');
        if (!row) return;
        _currentAllocRow = row;
        const prodId = parseInt(row.querySelector('.invoice-line-product').value, 10);
        const qty = parseFloat(row.querySelector('.invoice-line-qty').value || '0');
        _currentAllocLineQty = qty;
        allocTitle.textContent = `Répartitions pour ${state.products.find(p=>p.id===prodId)?.name || ''} (Qté ligne: ${qty})`;
        allocBody.innerHTML = '';

        // existing allocations
        let existing = [];
        try { existing = row.dataset.allocations ? JSON.parse(row.dataset.allocations) : []; } catch (_) { existing = []; }

        // load allowed companies per role for this product
        let allowed = [];
        try { allowed = await window.api.getProductRoleCompanies(prodId); } catch (e) { allowed = []; }
        // convert to map role_id => [company_id]
        const allowedMap = {};
        (allowed || []).forEach(a => {
          if (!allowedMap[a.role_id]) allowedMap[a.role_id] = [];
          allowedMap[a.role_id].push(a.company_id);
        });

        // build UI: for each role, a select of allowed companies + qty input
        (state.roles || []).forEach(r => {
          const wrapper = document.createElement('div');
          wrapper.style.display = 'flex'; wrapper.style.gap = '8px'; wrapper.style.alignItems = 'center';
          const lbl = document.createElement('div'); lbl.style.width = '120px'; lbl.textContent = r.name;

          const sel = document.createElement('select');
          sel.style.minWidth = '160px';
          const allowedCompanies = allowedMap[r.id] || [];
          if ((allowedCompanies || []).length === 0) {
            const o = document.createElement('option'); o.value = ''; o.textContent = 'Aucune société configurée'; sel.appendChild(o); sel.disabled = true;
            const warn = document.createElement('div'); warn.style.color = '#b00'; warn.style.fontSize = '12px'; warn.textContent = 'Configurez les sociétés pour ce rôle dans Produits → Configurer rôles';
            wrapper.appendChild(lbl);
            wrapper.appendChild(sel);
            wrapper.appendChild(warn);
            wrapper.dataset.roleId = r.id;
            wrapper.setAttribute('data-role-id', r.id);
            allocBody.appendChild(wrapper);
            return;
          }

          // populate allowed companies
          allowedCompanies.forEach(cid => {
            const c = (state.companies || []).find(x => x.id === cid);
            if (c) { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; sel.appendChild(o); }
          });

          // populate from existing if found
          const ex = existing.find(x => x.role_id === r.id);
          if (ex) {
            // ensure company is allowed
            if (allowedCompanies.includes(ex.company_id)) sel.value = ex.company_id;
          }

          wrapper.dataset.roleId = r.id;
          wrapper.appendChild(lbl);
          wrapper.appendChild(sel);
          wrapper.setAttribute('data-role-id', r.id);
          allocBody.appendChild(wrapper);
        });

        roleAllocModal.style.display = 'flex';
      }
    });
  }

  // Paiements factures & achats (delegation)
  document.body.addEventListener('click', async (e) => {
    const target = e.target;

    // Edit product shares by role (open modal)
    if (target && target.dataset && target.dataset.type === 'prod-shares') {
      const productId = parseInt(target.dataset.id, 10);
      const product = state.products.find(p => p.id === productId);
      if (!product) return alert('Produit introuvable');

      // fetch existing role shares
      let existing = [];
      try {
        existing = await window.api.getProductRoleShares(productId);
      } catch (err) {
        console.error('getProductRoleShares error', err);
      }
      const existingMap = {};
      existing.forEach(s => existingMap[s.role_id] = s.amount_per_unit || 0);

      // populate modal
      const modal = document.getElementById('shares-modal');
      const body = document.getElementById('shares-modal-body');
      const title = document.getElementById('shares-modal-title');
      if (!modal || !body || !title) return alert('Modal d\'édition non disponible');
      title.textContent = `Parts (par rôle) pour produit: ${product.name}`;
      body.innerHTML = '';

      (state.roles || []).forEach(r => {
        const def = existingMap[r.id] !== undefined ? existingMap[r.id] : 0;
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.alignItems = 'center';

        const lbl = document.createElement('div');
        lbl.style.width = '140px';
        lbl.textContent = r.name;

        const inp = document.createElement('input');
        inp.type = 'number';
        inp.min = '0';
        inp.step = '0.01';
        inp.value = def;
        inp.dataset.roleId = r.id;
        inp.style.flex = '1';

        row.appendChild(lbl);
        row.appendChild(inp);
        body.appendChild(row);
      });

      // store pending product id
      window._sharesPending = { productId };
      modal.style.display = 'flex';
      return;
    }

    if (target.dataset.type === 'inv-pay-btn') {
      const id = parseInt(target.dataset.id, 10);
      const input = document.querySelector(`input[data-type="inv-pay-amount"][data-id="${id}"]`);
      const amount = parseFloat(input.value || '0');
      if (amount <= 0) return alert('Montant invalide');
      await window.api.addInvoicePayment({
        invoiceId: id,
        amount
      });
      await refresh();
    }

    if (target.dataset.type === 'pur-pay-btn') {
      const id = parseInt(target.dataset.id, 10);
      const input = document.querySelector(`input[data-type="pur-pay-amount"][data-id="${id}"]`);
      const amount = parseFloat(input.value || '0');
      if (amount <= 0) return alert('Montant invalide');
      await window.api.addPurchasePayment({
        purchaseId: id,
        amount
      });
      await refresh();
    }

    // Edit purchase
    if (target.dataset.type === 'pur-edit') {
      const id = parseInt(target.dataset.id, 10);
      const tr = target.closest('tr');
      const pu = state.purchases.find(p => p.id === id);
      if (!pu) return;

      // build selects for supplier/product
      const compSel = document.createElement('select');
      (state.companies || []).forEach(c => { const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name; if (c.id === pu.company_id) opt.selected = true; compSel.appendChild(opt); });

      const supSel = document.createElement('select');
      state.suppliers.forEach(s => { const opt = document.createElement('option'); opt.value = s.id; opt.textContent = s.name; if (s.id === pu.supplier_id) opt.selected = true; supSel.appendChild(opt); });

      const prodSel = document.createElement('select');
      state.products.forEach(p => { const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.name; if (p.id === pu.product_id) opt.selected = true; prodSel.appendChild(opt); });

      tr.innerHTML = `
        <td>${pu.id}</td>
        <td></td>
        <td><input type="date" data-edit="pur-date" value="${pu.date}" /></td>
        <td></td>
        <td></td>
        <td><input type="number" min="0" step="0.01" data-edit="pur-qty" value="${pu.qty}" style="width:80px;" /></td>
        <td><input type="number" min="0" step="0.01" data-edit="pur-unitcost" value="${(pu.total_cost/pu.qty).toFixed(2)}" style="width:80px;" /></td>
        <td>${formatEuro(pu.paid)}</td>
        <td>${formatEuro(pu.due)}</td>
        <td></td>
        <td>
          <button data-type="pur-save" data-id="${pu.id}">💾 Sauvegarder</button>
          <button data-type="pur-cancel" data-id="${pu.id}">✖️ Annuler</button>
        </td>
      `;

      // insert selects into the appropriate cells (company, supplier, product)
      tr.children[1].appendChild(compSel);
      tr.children[3].appendChild(supSel);
      tr.children[4].appendChild(prodSel);
      return;
    }

    if (target.dataset.type === 'pur-save') {
      const id = parseInt(target.dataset.id, 10);
      const tr = target.closest('tr');
      const date = tr.querySelector('[data-edit="pur-date"]').value;
      const selects = tr.querySelectorAll('select');
      const companyId = selects && selects[0] ? parseInt(selects[0].value, 10) : null;
      const supplierId = selects && selects[1] ? parseInt(selects[1].value, 10) : null;
      const prodSel = selects && selects[2] ? selects[2] : null;
      const productId = prodSel ? parseInt(prodSel.value, 10) : null;
      const qty = parseFloat(tr.querySelector('[data-edit="pur-qty"]').value || '0');
      const unitCost = parseFloat(tr.querySelector('[data-edit="pur-unitcost"]').value || '0');
      if (!supplierId || !productId || qty <= 0 || unitCost < 0) return alert('Fournisseur, produit, quantité et coût valides requis');
      await window.api.updatePurchase({ purchaseId: id, companyId, supplierId, productId, qty, unitCost, date });
      await refresh();
      return;
    }

    if (target.dataset.type === 'pur-cancel') {
      await refresh();
      return;
    }

    if (target.dataset.type === 'pur-del') {
      const id = parseInt(target.dataset.id, 10);
      if (!confirm('Supprimer cet achat ? Cela ajustera le stock en conséquence et supprimera les paiements.')) return;
      await window.api.deletePurchase(id);
      await refresh();
      return;
    }

    // Edit invoice (customer/date)
    if (target.dataset.type === 'inv-edit') {
      const id = parseInt(target.dataset.id, 10);
      const tr = target.closest('tr');
      const inv = state.invoices.find(i => i.id === id);
      if (!inv) return;

      // Build customer select
      const custSel = document.createElement('select');
      state.customers.forEach(c => {
        const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name; if (c.name === inv.customer_name) opt.selected = true; custSel.appendChild(opt);
      });

      tr.innerHTML = `
        <td>${inv.id}</td>
        <td><input type="date" data-edit="inv-date" value="${inv.date}" /></td>
        <td></td>
        <td>${formatEuro(inv.total)}</td>
        <td>${formatEuro(inv.paid)}</td>
        <td>${formatEuro(inv.due)}</td>
        <td></td>
        <td></td>
        <td>
          <button data-type="inv-save" data-id="${inv.id}">💾 Sauvegarder</button>
          <button data-type="inv-cancel" data-id="${inv.id}">✖️ Annuler</button>
        </td>
      `;

      // insert customer select into the 3rd cell
      tr.children[2].appendChild(custSel);
      return;
    }

    if (target.dataset.type === 'inv-save') {
      const id = parseInt(target.dataset.id, 10);
      const tr = target.closest('tr');
      const dateInput = tr.querySelector('[data-edit="inv-date"]');
      const custSel = tr.querySelector('select');
      const date = dateInput.value;
      const customerId = parseInt(custSel.value, 10);
      if (!customerId || !date) return alert('Date et client requis');
      await window.api.updateInvoice({ invoiceId: id, customerId, date });
      await refresh();
      return;
    }

    if (target.dataset.type === 'inv-cancel') {
      await refresh();
      return;
    }

    if (target.dataset.type === 'inv-del') {
      const id = parseInt(target.dataset.id, 10);
      if (!confirm('Supprimer cette facture ? Cela restaurera le stock et supprimera les paiements et l\'URSSAF lié.')) return;
      await window.api.deleteInvoice(id);
      await refresh();
      return;
    }

    // URSSAF declare
    if (target.dataset.type === 'urssaf-declare-btn') {
      const id = parseInt(target.dataset.id, 10);
      const input = document.querySelector(`input[data-type="urssaf-declare-date"][data-id="${id}"]`);
      const date = input.value || new Date().toISOString().slice(0,10);
      await window.api.markUrssafDeclared({ invoiceId: id, date });
      await refresh();
      return;
    }

    // URSSAF payment
    if (target.dataset.type === 'urssaf-pay-btn') {
      const id = parseInt(target.dataset.id, 10);
      const input = document.querySelector(`input[data-type="urssaf-pay-amount"][data-id="${id}"]`);
      const amount = parseFloat(input.value || '0');
      if (amount <= 0) return alert('Montant invalide');
      await window.api.addUrssafPayment({ invoiceId: id, amount });
      await refresh();
      return;
    }

    // Édition / suppression clients
    if (target.dataset.type === 'cust-edit') {
      const id = parseInt(target.dataset.id, 10);
      const li = target.closest('li');
      const cust = state.customers.find(c => c.id === id);
      if (!cust) return;
      li.innerHTML = `
        <input type="text" data-edit="cust-name" value="${cust.name}" style="width:200px;" />
        <input type="email" data-edit="cust-email" value="${cust.email || ''}" style="width:200px; margin-left:6px;" />
        <button data-type="cust-save" data-id="${id}">💾</button>
        <button data-type="cust-cancel">✖️</button>
      `;
      return;
    }

    if (target.dataset.type === 'cust-save') {
      const id = parseInt(target.dataset.id, 10);
      const li = target.closest('li');
      const name = li.querySelector('[data-edit="cust-name"]').value.trim();
      const email = li.querySelector('[data-edit="cust-email"]').value.trim();
      if (!name) return alert('Nom du client obligatoire');
      await window.api.updateCustomer({ id, name, email });
      await refresh();
      return;
    }

    if (target.dataset.type === 'cust-cancel') {
      await refresh();
      return;
    }

    if (target.dataset.type === 'cust-del') {
      const id = parseInt(target.dataset.id, 10);
      if (!confirm('Supprimer ce client ?')) return;
      await window.api.deleteCustomer(id);
      await refresh();
      return;
    }

    // Edit / delete product
    if (target.dataset.type === 'prod-edit') {
      const id = parseInt(target.dataset.id, 10);
      const tr = target.closest('tr');
      const prod = state.products.find(p => p.id === id);
      if (!prod) return;
      tr.innerHTML = `
        <td>${prod.id}</td>
        <td><input type="text" data-edit="prod-name" value="${prod.name}" style="width:200px;" /></td>
        <td><input type="number" data-edit="prod-price" value="${prod.price}" step="0.01" style="width:120px;" /></td>
        <td><input type="number" data-edit="prod-stock" value="${prod.stock}" step="1" style="width:80px;" /></td>
        <td>
          <button data-type="prod-save" data-id="${prod.id}">💾</button>
          <button data-type="prod-cancel">✖️</button>
        </td>
      `;
      return;
    }

    if (target.dataset.type === 'prod-save') {
      const id = parseInt(target.dataset.id, 10);
      const tr = target.closest('tr');
      const name = tr.querySelector('[data-edit="prod-name"]').value.trim();
      const price = parseFloat(tr.querySelector('[data-edit="prod-price"]').value || '0');
      const stock = parseInt(tr.querySelector('[data-edit="prod-stock"]').value || '0', 10);
      if (!name) return alert('Nom du produit requis');
      try {
        await window.api.updateProduct({ id, name, price, stock });
        await refresh();
      } catch (err) {
        console.error('updateProduct error', err);
        alert('Erreur mise à jour produit');
      }
      return;
    }

    if (target.dataset.type === 'prod-cancel') {
      await refresh();
      return;
    }

    if (target.dataset.type === 'prod-del') {
      const id = parseInt(target.dataset.id, 10);
      if (!confirm('Supprimer ce produit ? (Impossible si utilisé dans factures/achats)')) return;
      try {
        await window.api.deleteProduct(id);
        await refresh();
      } catch (err) {
        console.error('deleteProduct error', err);
        alert('Erreur suppression produit: ' + (err && err.message ? err.message : err));
      }
      return;
    }

    // Édition / suppression fournisseurs
    if (target.dataset.type === 'sup-edit') {
      const id = parseInt(target.dataset.id, 10);
      const li = target.closest('li');
      const sup = state.suppliers.find(s => s.id === id);
      if (!sup) return;
      li.innerHTML = `
        <input type="text" data-edit="sup-name" value="${sup.name}" style="width:240px;" />
        <button data-type="sup-save" data-id="${id}">💾</button>
        <button data-type="sup-cancel">✖️</button>
      `;
      return;
    }

    if (target.dataset.type === 'sup-save') {
      const id = parseInt(target.dataset.id, 10);
      const li = target.closest('li');
      const name = li.querySelector('[data-edit="sup-name"]').value.trim();
      if (!name) return alert('Nom du fournisseur obligatoire');
      await window.api.updateSupplier({ id, name });
      await refresh();
      return;
    }

    if (target.dataset.type === 'sup-cancel') {
      await refresh();
      return;
    }

    if (target.dataset.type === 'sup-del') {
      const id = parseInt(target.dataset.id, 10);
      if (!confirm('Supprimer ce fournisseur ?')) return;
      await window.api.deleteSupplier(id);
      await refresh();
      return;
    }

    // Edit / delete company
    if (target.dataset.type === 'company-edit') {
      const id = parseInt(target.dataset.id, 10);
      const tr = target.closest('tr');
      const comp = state.companies.find(c => c.id === id);
      if (!comp) return;
      tr.innerHTML = `
        <td>${comp.id}</td>
        <td><input type="text" data-edit="comp-code" value="${comp.code}" style="width:120px;" /></td>
        <td><input type="text" data-edit="comp-name" value="${comp.name}" style="width:220px;" /></td>
        <td>
          <button data-type="company-save" data-id="${comp.id}">💾</button>
          <button data-type="company-cancel">✖️</button>
        </td>
      `;
      return;
    }

    if (target.dataset.type === 'company-save') {
      const id = parseInt(target.dataset.id, 10);
      const tr = target.closest('tr');
      const code = tr.querySelector('[data-edit="comp-code"]').value.trim();
      const name = tr.querySelector('[data-edit="comp-name"]').value.trim();
      if (!code || !name) return alert('Code et nom requis');
      try {
        await window.api.updateCompany({ id, code, name });
        await refresh();
      } catch (err) {
        console.error('updateCompany error', err);
        alert('Erreur mise à jour société');
      }
      return;
    }

    if (target.dataset.type === 'company-cancel') {
      await refresh();
      return;
    }

    if (target.dataset.type === 'company-del') {
      const id = parseInt(target.dataset.id, 10);
      if (!confirm('Supprimer cette société ? Les factures/achats liés garderont company_id NULL.')) return;
      try {
        await window.api.deleteCompany(id);
        await refresh();
      } catch (err) {
        console.error('deleteCompany error', err);
        alert('Erreur suppression société');
      }
      return;
    }
  });

  // Sauvegarder les paramètres SMTP
  document.getElementById('btn-save-smtp').addEventListener('click', async () => {
    const host = document.getElementById('smtp-host').value.trim();
    const port = parseInt(document.getElementById('smtp-port').value, 10) || 465;
    const secure = document.getElementById('smtp-secure').value === 'true';
    const user = document.getElementById('smtp-user').value.trim();
    const pass = document.getElementById('smtp-pass').value;

    if (!host || !user || !pass) return alert('Host, utilisateur et mot de passe SMTP requis');

    const smtp = {
      host,
      port,
      secure,
      auth: { user, pass }
    };

    await window.api.setSetting('smtp', smtp);
    alert('Paramètres SMTP enregistrés');
  });

  // Envoyer un email de test
  document.getElementById('btn-send-test').addEventListener('click', async () => {
    const to = document.getElementById('test-to').value.trim();
    const subject = document.getElementById('test-subject').value.trim() || 'Test Manouk';
    const text = document.getElementById('test-body').value || 'Test email depuis Manouk';
    if (!to) return alert('Destinataire requis');
    document.getElementById('email-result').textContent = 'Envoi en cours...';
    const res = await window.api.sendEmail({ to, subject, text });
    if (res && res.ok) {
      document.getElementById('email-result').textContent = 'Email envoyé avec succès';
    } else {
      document.getElementById('email-result').textContent = 'Erreur: ' + (res && res.error ? res.error : 'inconnue');
      document.getElementById('email-result').style.color = 'red';
    }
  });

  // Nouvel achat fournisseur
  document.getElementById('btn-add-purchase').addEventListener('click', async () => {
    const supplierId = parseInt(document.getElementById('purchase-supplier').value, 10);
    const productId = parseInt(document.getElementById('purchase-product').value, 10);
    const companyId = parseInt((document.getElementById('purchase-company') && document.getElementById('purchase-company').value) || '0', 10) || null;
    const qty = parseFloat(document.getElementById('purchase-qty').value || '0');
    const unitCost = parseFloat(document.getElementById('purchase-unit-cost').value || '0');

    if (!supplierId || !productId || qty <= 0 || unitCost < 0) {
      return alert('Fournisseur, produit, quantité et coût sont obligatoires');
    }

    await window.api.addPurchase({
      supplierId,
      productId,
      qty,
      unitCost,
      companyId
    });

    alert('Achat enregistré. Le stock du produit a été augmenté.');
    await refresh();
  });

  // Chargement initial
  refresh();
});

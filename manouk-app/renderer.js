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

  if (caEl) caEl.textContent = formatEuro(state.ca_total || 0);
  if (recEl) recEl.textContent = formatEuro(state.receivables_total || 0);
  if (payEl) payEl.textContent = formatEuro(state.payables_total || 0);
  if (urssEl) urssEl.textContent = formatEuro(state.urssaf_due || 0);
  if (curEl) curEl.textContent = formatEuro(state.current_cash || 0);
  if (setEl) setEl.textContent = formatEuro(state.settled_cash || 0);
  if (resEl) resEl.textContent = formatEuro(state.result_if_settled || 0);

  // Recent invoices (same as before)
  const tbodyInvDash = document.querySelector('#table-invoices-dashboard tbody');
  tbodyInvDash.innerHTML = '';
  state.invoices.slice(0, 5).forEach(inv => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${inv.id}</td>
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
  state.purchases.slice(0, 5).forEach(pu => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${pu.id}</td>
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
    `;
    tbodyProd.appendChild(tr);
  });

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
  state.invoices.forEach(inv => {
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
  selSup.innerHTML = '';
  selProd.innerHTML = '';

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

  // Table achats
  const tbody = document.querySelector('#table-purchases tbody');
  tbody.innerHTML = '';
  state.purchases.forEach(pu => {
    const statusBadge = pu.due <= 0.001
      ? '<span class="badge badge-ok">Payé</span>'
      : '<span class="badge badge-warn">À payer</span>';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${pu.id}</td>
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
    btns.appendChild(btnRemove);

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

  // Nouvelle facture (1 produit simple pour l'instant)
  // Create invoice (multi-line)
  document.getElementById('btn-create-invoice').addEventListener('click', async () => {
    const customerId = parseInt(document.getElementById('invoice-customer').value, 10);
    const sendEmail = document.getElementById('invoice-send-email') && document.getElementById('invoice-send-email').checked;

    // gather lines from DOM
    const linesContainer = document.getElementById('invoice-lines');
    const rows = Array.from(linesContainer.querySelectorAll('.invoice-line'));
    if (!customerId) return alert('Client requis');
    if (rows.length === 0) return alert('Ajoutez au moins une ligne');

    const lines = [];
    for (const r of rows) {
      const prodSel = r.querySelector('.invoice-line-product');
      const qtyInput = r.querySelector('.invoice-line-qty');
      const noteInput = r.querySelector('.invoice-line-note');
      const productId = parseInt(prodSel.value, 10);
      const qty = parseFloat(qtyInput.value || '0');
      if (!productId || qty <= 0) return alert('Produit et quantité valides requis pour chaque ligne');
      const product = state.products.find(p => p.id === productId);
      if (!product) return alert('Produit introuvable');
      lines.push({ productId, qty, unit_price: product.price, note: (noteInput && noteInput.value) ? noteInput.value.trim() : null });
    }

    if (sendEmail) {
      // open modal to compose email before sending
      const emailModal = document.getElementById('email-modal');
      const emailTo = document.getElementById('email-to');
      const emailSubject = document.getElementById('email-subject');
      const emailBody = document.getElementById('email-body');

      // store pending invoice details
      window._pendingInvoice = { customerId, lines };

      // prefill recipient and subject/body
      const cust = state.customers.find(c => c.id === customerId) || {};
      emailTo.value = cust.email || '';
      emailSubject.value = `Facture pour ${cust.name || ''}`;
      emailBody.value = `Bonjour ${cust.name || ''},\n\nVeuillez trouver ci-joint votre facture.\n\nCordialement,\n${(document.getElementById('company-name') && document.getElementById('company-name').value) || ''}`;

      emailModal.style.display = 'flex';
      return;
    }

    await window.api.createInvoice({ customerId, lines });
    alert('Facture créée (sans envoi d\'email).');
    await refresh();
  });

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

  // Paiements factures & achats (delegation)
  document.body.addEventListener('click', async (e) => {
    const target = e.target;

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
      const supSel = document.createElement('select');
      state.suppliers.forEach(s => { const opt = document.createElement('option'); opt.value = s.id; opt.textContent = s.name; if (s.name === pu.supplier_name) opt.selected = true; supSel.appendChild(opt); });

      const prodSel = document.createElement('select');
      state.products.forEach(p => { const opt = document.createElement('option'); opt.value = p.id; opt.textContent = p.name; if (p.name === pu.product_name) opt.selected = true; prodSel.appendChild(opt); });

      tr.innerHTML = `
        <td>${pu.id}</td>
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

      // insert selects into the appropriate cells
      tr.children[2].appendChild(supSel);
      tr.children[3].appendChild(prodSel);
      return;
    }

    if (target.dataset.type === 'pur-save') {
      const id = parseInt(target.dataset.id, 10);
      const tr = target.closest('tr');
      const date = tr.querySelector('[data-edit="pur-date"]').value;
      const supplierId = parseInt(tr.querySelector('select').value, 10);
      // product select is the second select in the row
      const prodSel = tr.querySelectorAll('select')[1];
      const productId = parseInt(prodSel.value, 10);
      const qty = parseFloat(tr.querySelector('[data-edit="pur-qty"]').value || '0');
      const unitCost = parseFloat(tr.querySelector('[data-edit="pur-unitcost"]').value || '0');
      if (!supplierId || !productId || qty <= 0 || unitCost < 0) return alert('Fournisseur, produit, quantité et coût valides requis');
      await window.api.updatePurchase({ purchaseId: id, supplierId, productId, qty, unitCost, date });
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
    const qty = parseFloat(document.getElementById('purchase-qty').value || '0');
    const unitCost = parseFloat(document.getElementById('purchase-unit-cost').value || '0');

    if (!supplierId || !productId || qty <= 0 || unitCost < 0) {
      return alert('Fournisseur, produit, quantité et coût sont obligatoires');
    }

    await window.api.addPurchase({
      supplierId,
      productId,
      qty,
      unitCost
    });

    alert('Achat enregistré. Le stock du produit a été augmenté.');
    await refresh();
  });

  // Chargement initial
  refresh();
});

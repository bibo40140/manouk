const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  init: () => ipcRenderer.invoke('init'),
  addCustomer: (customer) => ipcRenderer.invoke('customer:add', customer),
  updateCustomer: (customer) => ipcRenderer.invoke('customer:update', customer),
  deleteCustomer: (id) => ipcRenderer.invoke('customer:delete', id),
  addProduct: (product) => ipcRenderer.invoke('product:add', product),
  createInvoiceAndSend: (payload) => ipcRenderer.invoke('invoice:createAndSend', payload),
  addSupplier: (supplier) => ipcRenderer.invoke('supplier:add', supplier),
  updateInvoice: (payload) => ipcRenderer.invoke('invoice:update', payload),
  deleteInvoice: (id) => ipcRenderer.invoke('invoice:delete', id),
  updatePurchase: (payload) => ipcRenderer.invoke('purchase:update', payload),
  deletePurchase: (id) => ipcRenderer.invoke('purchase:delete', id),
  updateSupplier: (supplier) => ipcRenderer.invoke('supplier:update', supplier),
  deleteSupplier: (id) => ipcRenderer.invoke('supplier:delete', id),
  addPurchase: (purchase) => ipcRenderer.invoke('purchase:add', purchase),
  addPurchasePayment: (payment) => ipcRenderer.invoke('purchase:payment', payment),
  createInvoice: (invoice) => ipcRenderer.invoke('invoice:create', invoice),
  addInvoicePayment: (payment) => ipcRenderer.invoke('invoice:payment', payment)
  ,
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  sendEmail: (payload) => ipcRenderer.invoke('email:send', payload)
  ,
  selectLogo: () => ipcRenderer.invoke('dialog:selectLogo')
  ,
  markUrssafDeclared: (payload) => ipcRenderer.invoke('urssaf:markDeclared', payload),
  addUrssafPayment: (payload) => ipcRenderer.invoke('urssaf:addPayment', payload)
});

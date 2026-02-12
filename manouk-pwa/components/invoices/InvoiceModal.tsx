'use client'

import { useState, useRef, useEffect } from 'react'

import { useRouter } from 'next/navigation'
import { PlusIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'

type InvoiceLine = {
  product_id: string
  product_name?: string
  quantity: number
  unit_price: number
  total: number
  splits?: { company_id: string, amount: number }[]
}

import { createClient } from '@/lib/supabase/client'

export default function InvoiceModal({ companies, customers, products }: any) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const [customerId, setCustomerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [mailBody, setMailBody] = useState('Bonjour,\n\nVeuillez trouver vos factures en pièce jointe.\n\nCordialement.');

  const [pendingAction, setPendingAction] = useState<'create' | 'create-send' | null>(null);
  // ...le reste du code inchangé...

  const addLine = () => {
    // Ajoute une ligne avec une répartition initiale égale entre sociétés
    const defaultSplits = companies.map((c: any) => ({ company_id: c.id, amount: 0 }));
    setLines([
      ...lines,
      { product_id: '', quantity: 1, unit_price: 0, total: 0, splits: defaultSplits }
    ]);
  }

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index))
  }

  // Utilitaire pour charger les splits côté client
  const loadSplitsForProduct = async (productId: string) => {
    if (typeof window === 'undefined') return companies.map((c: any) => ({ company_id: c.id, amount: 0 }))
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: splitsData, error } = await supabase
      .from('product_company_splits')
      .select('*')
      .eq('product_id', productId)
    
    console.log('🔍 Recherche splits pour produit', productId);
    console.log('🔍 Splits trouvés dans la DB:', splitsData);
    console.log('🔍 Erreur?', error);
    
    if (!error && splitsData) {
      return companies.map((c: any) => {
        const found = splitsData.find((s: any) => s.company_id === c.id)
        return { company_id: c.id, amount: found ? Number(found.amount) : 0 }
      })
    }
    return companies.map((c: any) => ({ company_id: c.id, amount: 0 }))
  }

  const updateLine = (index: number, field: keyof InvoiceLine | 'splits', value: any) => {
    setLines(prevLines => {
      const newLines = [...prevLines];
      const prev = newLines[index] || {};
      let updated: any = { ...prev };
      if (field === 'product_id') {
        updated.product_id = value || '';
        const product = products.find((p: any) => p.id === value);
        if (product) {
          updated.unit_price = product.unit_price ?? product.price ?? 0;
          updated.product_name = product.name;
        }
        updated.total = (Number(updated.quantity ?? 1) || 0) * (Number(updated.unit_price ?? 0) || 0);
      } else if (field === 'product_name') {
        updated.product_name = value || '';
      } else if (field === 'quantity') {
        updated.quantity = value ?? 1;
        updated.total = (Number(value) || 0) * (Number(updated.unit_price ?? 0) || 0);
      } else if (field === 'unit_price') {
        updated.unit_price = value ?? 0;
        updated.total = (Number(updated.quantity ?? 1) || 0) * (Number(value) || 0);
      } else if (field === 'splits') {
        // On repart de la version la plus récente de la ligne
        updated.splits = value;
        // plus besoin de fallback sur lastProductIdRef
      }
      newLines[index] = updated;
      return newLines;
    });
  }

  // Effet pour charger les splits quand un produit est sélectionné
  const handleProductChange = async (index: number, productId: string) => {
    updateLine(index, 'product_id', productId);
    if (productId) {
      // Toujours charger les splits pour ce produit, même si déjà sélectionné ailleurs
      setTimeout(async () => {
        const splits = await loadSplitsForProduct(productId);
        console.log('🔄 Splits chargés pour produit', productId, ':', splits);
        updateLine(index, 'splits', splits);
      }, 0);
    }
  }

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + line.total, 0)
  }

  // Génération automatique du numéro de facture
  // (le bloc await fetch a été déplacé dans handleSubmit)
  // Génération automatique du numéro de facture
  useEffect(() => {
    // Le numéro de facture sera généré automatiquement par l'API PostgreSQL
    // pour garantir l'unicité même en cas de concurrence
    setInvoiceNumber('Auto');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      alert('Ajoutez au moins une ligne à la facture');
      return;
    }
    setLoading(true);
    try {
      // Regrouper les lignes par société selon la répartition (splits)
      const companyMap: Record<string, { total: number, lines: any[] }> = {};
      
      console.log('📊 Lignes de facture à traiter:', lines);
      
      lines.forEach(line => {
        console.log('📦 Traitement ligne:', { 
          product_id: line.product_id, 
          product_name: line.product_name,
          splits: line.splits 
        });
        
        (line.splits || []).forEach((split: any) => {
          console.log('💰 Split détecté:', split);
          
          if (!split.amount || split.amount <= 0) {
            console.log('⚠️ Split ignoré (montant = 0):', split);
            return;
          }
          
          if (!companyMap[split.company_id]) companyMap[split.company_id] = { total: 0, lines: [] };
          companyMap[split.company_id].lines.push({
            product_id: line.product_id,
            product_name: line.product_name,
            quantity: line.quantity,
            unit_price: split.amount,
            total: split.amount * line.quantity
          });
          companyMap[split.company_id].total += split.amount * line.quantity;
        });
      });
      
      console.log('🏢 Répartition par société:', companyMap);
      console.log('🏢 Nombre de sociétés concernées:', Object.keys(companyMap).length);
      
      // Créer une facture par société et collecter les infos pour l’API
      const invoicesToSend: any[] = [];
      for (const [company_id, { total, lines: companyLines }] of Object.entries(companyMap)) {
        // Le numéro sera généré automatiquement par l'API via PostgreSQL
        // pour garantir l'unicité même en cas de concurrence
        
        // UTILISER L'API POUR CRÉER LA FACTURE (BYPASS RLS + Numéro auto)
        const createRes = await fetch('/api/create-invoice-single', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id,
            customer_id: customerId,
            // invoice_number sera généré automatiquement par l'API
            date: invoiceDate,
            total,
            lines: companyLines
          })
        });
        
        const createData = await createRes.json();
        if (!createData.ok) throw new Error(createData.error);
        const invoice = createData.invoice;
        
        // Récupérer les infos société et client pour l'email
        const company = companies.find((c: any) => c.id === company_id);
        const customer = customers.find((c: any) => c.id === customerId);
        invoicesToSend.push({ company, customer, invoice, lines: companyLines });
      }
      
      console.log('📧 Factures à envoyer:', invoicesToSend);
      console.log('📧 Nombre de factures:', invoicesToSend.length);
      
      // Envoi groupé au client (un seul mail, toutes les factures)
      const customer = customers.find((c: any) => c.id === customerId);
      
      console.log('📨 Envoi email à:', customer?.email);
      console.log('📨 Nombre de PDFs joints:', invoicesToSend.length);
      
      await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoices: invoicesToSend,
          to: customer?.email || '',
          subject: `Vos factures ${customer?.name || ''}`,
          text: mailBody
        })
      });

      // Vérifier et envoyer les alertes de stock automatiquement
      try {
        await fetch('/api/stock/process-alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (alertError) {
        console.error('Erreur envoi alertes stock:', alertError);
        // On ne bloque pas si les alertes échouent
      }

      // Réinitialiser le formulaire
      setCustomerId('');
      setInvoiceNumber('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setLines([]);
      setMailBody('Bonjour,\n\nVeuillez trouver vos factures en pièce jointe.\n\nCordialement.');
      setIsOpen(false);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      alert('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // On ne filtre plus les clients par société
  const filteredCustomers = customers;

  // On ne filtre plus les produits par société
  const filteredProducts = products;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <PlusIcon className="w-5 h-5" />
        Nouvelle facture
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Nouvelle facture</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form id="invoice-form" onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* En-tête de facture */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                    // plus de désactivation par société
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Sélectionner...</option>
                    {filteredCustomers.map((customer: any) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>

                {/* N° de facture supprimé (auto) */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de facture *
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Date d'échéance supprimée */}
              </div>

              {/* Lignes de facture */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">Lignes de facture</h3>
                  <button
                    type="button"
                    onClick={addLine}
                    // plus de désactivation par société
                    className="flex items-center gap-1 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Ajouter une ligne
                  </button>
                </div>

                {lines.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                    Aucune ligne. Cliquez sur "Ajouter une ligne" ci-dessus.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {lines.map((line, index) => (
                      <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Produit
                            </label>
                            <select
                              value={line.product_id || ''}
                              onChange={e => handleProductChange(index, e.target.value)}
                              required
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                              <option value="">Sélectionner...</option>
                              {filteredProducts.map((product: any) => (
                                <option key={product.id} value={product.id}>{product.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Quantité
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={line.quantity ?? 1}
                              onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value))}
                              required
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Prix unitaire (€)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={line.unit_price ?? 0}
                              onChange={(e) => updateLine(index, 'unit_price', parseFloat(e.target.value))}
                              required
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                          {/* Répartition multi-sociétés - toujours afficher pour voir les splits */}
                          <div className="col-span-full">
                            <label className="block text-xs font-medium text-gray-600 mb-1">Répartition par société (€)</label>
                            <div className="flex gap-2">
                              {companies.map((c: any, splitIdx: number) => (
                                <div key={c.id} className="flex flex-col items-center">
                                  <span className="text-xs text-gray-500">{c.name}</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={line.splits?.find((s: any) => s.company_id === c.id)?.amount ?? 0}
                                    onChange={e => {
                                      const splits = (line.splits || companies.map((cc: any) => ({ company_id: cc.id, amount: 0 })));
                                      const newSplits = splits.map((s: any) => s.company_id === c.id ? { ...s, amount: parseFloat(e.target.value) } : s);
                                      updateLine(index, 'splits', newSplits);
                                    }}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-xs"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Total (€)
                            </label>
                            <input
                              type="text"
                              value={typeof line.total === 'number' ? line.total.toFixed(2) : '0.00'}
                              disabled
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-700 font-medium"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="mt-6 text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              {lines.length > 0 && (
                <div className="flex justify-end">
                  <div className="bg-indigo-50 border-2 border-indigo-600 rounded-lg px-6 py-3">
                    <div className="text-sm text-gray-600">Total de la facture</div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {calculateTotal().toFixed(2)} €
                    </div>
                  </div>
                </div>
              )}

              {/* Message personnalisé pour le mail */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Message pour le client</label>
                <textarea
                  value={mailBody}
                  onChange={e => setMailBody(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">Ce texte sera utilisé comme corps du mail envoyé au client.</div>
              </div>
              {/* Actions */}
              <div className="flex flex-col md:flex-row justify-end gap-3 pt-4 border-t relative">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                    <svg className="animate-spin h-7 w-7 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={loading}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => { if (!loading) { setPendingAction('create'); setTimeout(() => { (document.activeElement as HTMLElement)?.blur(); }, 0); setTimeout(() => { (document.getElementById('invoice-form') as HTMLFormElement)?.requestSubmit(); }, 0); }}}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {loading && pendingAction === 'create' ? 'Création...' : 'Créer la facture'}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => { if (!loading) { setPendingAction('create-send'); setTimeout(() => { (document.activeElement as HTMLElement)?.blur(); }, 0); setTimeout(() => { (document.getElementById('invoice-form') as HTMLFormElement)?.requestSubmit(); }, 0); }}}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading && pendingAction === 'create-send' ? 'Envoi...' : 'Créer et envoyer par mail'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

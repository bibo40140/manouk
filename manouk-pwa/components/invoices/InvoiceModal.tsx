'use client'

import { useState, useRef } from 'react'

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
  const router = useRouter()

  
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  
  // const [companyId, setCompanyId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [lines, setLines] = useState<InvoiceLine[]>([])

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
    if (!error && splitsData) {
      return companies.map((c: any) => {
        const found = splitsData.find((s: any) => s.company_id === c.id)
        return { company_id: c.id, amount: found ? Number(found.amount) : 0 }
      })
    }
    return companies.map((c: any) => ({ company_id: c.id, amount: 0 }))
  }

  const updateLine = (index: number, field: keyof InvoiceLine | 'splits', value: any) => {
    const newLines = [...lines];
    const prev = newLines[index] || {};
    let updated: any = {
      product_id: field === 'product_id' ? (value || '') : (prev.product_id || ''),
      product_name: field === 'product_name' ? (value || '') : (prev.product_name || ''),
      quantity: field === 'quantity' ? (value ?? 1) : (typeof prev.quantity === 'number' ? prev.quantity : 1),
      unit_price: field === 'unit_price' ? (value ?? 0) : (typeof prev.unit_price === 'number' ? prev.unit_price : 0),
      total: typeof prev.total === 'number' ? prev.total : 0,
      splits: prev.splits || companies.map((c: any) => ({ company_id: c.id, amount: 0 }))
    };
    // Auto-fill price and name when product is selected
    if (field === 'product_id') {
      const product = products.find((p: any) => p.id === value);
      if (product) {
        updated.unit_price = product.unit_price ?? product.price ?? 0;
        updated.product_name = product.name;
        // splits chargés plus bas via effet
      }
    }
    // Always recalc total if quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price' || field === 'product_id') {
      updated.total = (Number(updated.quantity) || 0) * (Number(updated.unit_price) || 0);
    }
    // Gestion splits (répartition multi-sociétés)
    if (field === 'splits') {
      updated.splits = value;
    }
    newLines[index] = updated;
    setLines(newLines);
  }

  // Effet pour charger les splits quand un produit est sélectionné
  const lastProductIdRef = useRef<string | null>(null)
  const handleProductChange = async (index: number, productId: string) => {
    updateLine(index, 'product_id', productId)
    if (productId && productId !== lastProductIdRef.current) {
      lastProductIdRef.current = productId
      const splits = await loadSplitsForProduct(productId)
      updateLine(index, 'splits', splits)
    }
  }

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + line.total, 0)
  }

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
      lines.forEach(line => {
        (line.splits || []).forEach((split: any) => {
          if (!split.amount || split.amount <= 0) return;
          if (!companyMap[split.company_id]) companyMap[split.company_id] = { total: 0, lines: [] };
          companyMap[split.company_id].lines.push({
            product_id: line.product_id,
            quantity: line.quantity,
            unit_price: split.amount,
            total: split.amount * line.quantity
          });
          companyMap[split.company_id].total += split.amount * line.quantity;
        });
      });
      // Créer une facture par société
      for (const [company_id, { total, lines: companyLines }] of Object.entries(companyMap)) {
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert([{
            company_id,
            customer_id: customerId,
            invoice_number: invoiceNumber,
            invoice_date: invoiceDate,
            due_date: dueDate,
            total,
            paid: 0
          }])
          .select()
          .single();
        if (invoiceError) throw invoiceError;
        // Créer les lignes de facture pour cette société
        const invoiceLines = companyLines.map(line => ({
          invoice_id: invoice.id,
          product_id: line.product_id,
          quantity: line.quantity,
          unit_price: line.unit_price,
          total: line.total
        }));
        const { error: linesError } = await supabase
          .from('invoice_lines')
          .insert(invoiceLines);
        if (linesError) throw linesError;
      }
      // Réinitialiser le formulaire
      setCustomerId('');
      setInvoiceNumber('');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setDueDate('');
      setLines([]);
      setIsOpen(false);
      router.refresh();
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

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° de facture *
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="ex: F2024-001"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'échéance
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
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
                          {/* Répartition multi-sociétés */}
                          {companies.length > 1 && (
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
                          )}
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

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer la facture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

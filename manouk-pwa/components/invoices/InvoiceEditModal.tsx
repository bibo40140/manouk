'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// Pour la démo, on stocke la config SMTP en dur ici (à remplacer par une vraie config sécurisée !)
const SMTP_CONFIG = typeof window !== 'undefined' && (window as any).SMTP_CONFIG ? (window as any).SMTP_CONFIG : {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: 'MAIL', pass: 'PASSWORD' }
};

export default function InvoiceEditModal({ invoice, onClose }: any) {
    const [sendMail, setSendMail] = useState(false);
  // Ajout des champs URSSAF
  const [urssafAmount, setUrssafAmount] = useState(invoice?.urssaf_amount || 0);
  const [urssafDeclaredDate, setUrssafDeclaredDate] = useState(invoice?.urssaf_declared_date || '');
  const [urssafPaidDate, setUrssafPaidDate] = useState(invoice?.urssaf_paid_date || '');
  const [urssafPaidAmount, setUrssafPaidAmount] = useState(invoice?.urssaf_paid_amount || 0);
  const router = useRouter()
  const supabase = createClient()
  
  const [customerId, setCustomerId] = useState(invoice?.customer_id || '')
  const [date, setDate] = useState(invoice?.date || new Date().toISOString().slice(0, 10))
  const [lines, setLines] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [
      { data: customersData },
      { data: productsData },
      { data: linesData },
      { data: paymentsData }
    ] = await Promise.all([
      supabase.from('customers').select('*').order('name'),
      supabase.from('products').select('*').order('name'),
      invoice ? supabase.from('invoice_lines').select('*, product:products(*)').eq('invoice_id', invoice.id) : Promise.resolve({ data: [] }),
      invoice ? supabase.from('payments').select('*').eq('invoice_id', invoice.id).order('date') : Promise.resolve({ data: [] })
    ])

    setCustomers(customersData || [])
    setProducts(productsData || [])
    setLines(linesData || [{ product_id: '', quantity: 1, price: 0 }])
    setPayments(paymentsData || [])
  }

  const addLine = () => {
    setLines([...lines, { product_id: '', quantity: 1, price: 0 }])
  }

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines]
    newLines[index] = { ...newLines[index], [field]: value }
    
    // Auto-fill price when product is selected
    if (field === 'product_id') {
      const product = products.find(p => p.id === value)
      if (product) {
        newLines[index].price = product.price
      }
    }
    
    setLines(newLines)
  }

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index))
  }

  const addPayment = () => {
    setPayments([...payments, { date: new Date().toISOString().slice(0, 10), amount: 0 }])
  }

  const updatePayment = (index: number, field: string, value: any) => {
    const newPayments = [...payments]
    newPayments[index] = { ...newPayments[index], [field]: value }
    setPayments(newPayments)
  }

  const removePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!customerId || !date) {
      alert('Client et date requis')
      return
    }

    if (lines.length === 0 || lines.every(l => !l.product_id)) {
      alert('Ajoutez au moins une ligne de facture')
      return
    }

    setLoading(true)

    try {
      if (invoice) {
        // Update existing invoice
        const total = lines.reduce((sum, line) => sum + (Number(line.quantity) * Number(line.price)), 0)
        // Update invoice basic info, y compris URSSAF
        const { error: invoiceError } = await supabase
          .from('invoices')
          .update({
            customer_id: customerId,
            date,
            total,
            urssaf_amount: urssafAmount,
            urssaf_declared_date: urssafDeclaredDate || null,
            urssaf_paid_date: urssafPaidDate || null,
            urssaf_paid_amount: urssafPaidAmount || null
          })
          .eq('id', invoice.id)
        if (invoiceError) throw invoiceError

        // Delete existing lines and create new ones
        await supabase.from('invoice_lines').delete().eq('invoice_id', invoice.id)
        
        const linesToInsert = lines
          .filter(l => l.product_id && Number(l.quantity) > 0)
          .map(l => ({
            invoice_id: invoice.id,
            product_id: l.product_id,
            quantity: Number(l.quantity),
            price: Number(l.price)
          }))
        
        if (linesToInsert.length > 0) {
          const { error: linesError } = await supabase
            .from('invoice_lines')
            .insert(linesToInsert)
          if (linesError) throw linesError
        }

        // Delete existing payments and create new ones
        await supabase.from('payments').delete().eq('invoice_id', invoice.id)
        
        const paymentsToInsert = payments
          .filter(p => Number(p.amount) > 0)
          .map(p => ({
            invoice_id: invoice.id,
            date: p.date,
            amount: Number(p.amount)
          }))
        
        if (paymentsToInsert.length > 0) {
          const { error: paymentsError } = await supabase
            .from('payments')
            .insert(paymentsToInsert)
          if (paymentsError) throw paymentsError
        }

        // Update paid amount
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
        await supabase
          .from('invoices')
          .update({ paid: totalPaid })
          .eq('id', invoice.id)
      } else {
        // Create new invoice
        const total = lines.reduce((sum, line) => sum + (Number(line.quantity) * Number(line.price)), 0)
        const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
        
        // Generate invoice number
        const { data: lastInvoice } = await supabase
          .from('invoices')
          .select('invoice_number')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        let invoiceNumber = 'INV-0001'
        if (lastInvoice?.invoice_number) {
          const lastNum = parseInt(lastInvoice.invoice_number.split('-')[1] || '0')
          invoiceNumber = `INV-${String(lastNum + 1).padStart(4, '0')}`
        }

        const { data: newInvoice, error: invoiceError } = await supabase
          .from('invoices')
          .insert({
            invoice_number: invoiceNumber,
            customer_id: customerId,
            company_id: lines[0]?.company_id || null,
            date,
            total,
            paid: totalPaid,
            urssaf_amount: urssafAmount,
            urssaf_declared_date: urssafDeclaredDate || null,
            urssaf_paid_date: urssafPaidDate || null,
            urssaf_paid_amount: urssafPaidAmount || null
          })
          .select()
          .single()
        if (invoiceError) throw invoiceError

        // Insert lines
        const linesToInsert = lines
          .filter(l => l.product_id && Number(l.quantity) > 0)
          .map(l => ({
            invoice_id: newInvoice.id,
            product_id: l.product_id,
            quantity: Number(l.quantity),
            price: Number(l.price)
          }))
        
        if (linesToInsert.length > 0) {
          const { error: linesError } = await supabase
            .from('invoice_lines')
            .insert(linesToInsert)
          if (linesError) throw linesError
        }

        // Insert payments
        const paymentsToInsert = payments
          .filter(p => Number(p.amount) > 0)
          .map(p => ({
            invoice_id: newInvoice.id,
            date: p.date,
            amount: Number(p.amount)
          }))
        
        if (paymentsToInsert.length > 0) {
          const { error: paymentsError } = await supabase
            .from('payments')
            .insert(paymentsToInsert)
          if (paymentsError) throw paymentsError
        }
      }

      // Envoi mail si demandé
      if (sendMail) {
        await fetch('/api/send-invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            smtpConfig: SMTP_CONFIG,
            invoices: [{
              id: invoice?.id,
              to: customers.find(c => c.id === customerId)?.email,
              subject: `Votre facture ${invoice?.invoice_number || ''}`,
              text: `Bonjour,\nVeuillez trouver votre facture en pièce jointe.`,
              html: `<p>Bonjour,<br>Veuillez trouver votre facture en pièce jointe.</p>`,
              attachments: []
            }]
          })
        });
      }
      router.refresh()
      onClose()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {invoice ? 'Modifier la facture' : 'Créer une facture'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* URSSAF fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant URSSAF</label>
              <input
                type="number"
                step="0.01"
                value={urssafAmount}
                onChange={e => setUrssafAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date déclaration URSSAF</label>
              <input
                type="date"
                value={urssafDeclaredDate || ''}
                onChange={e => setUrssafDeclaredDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date paiement URSSAF</label>
              <input
                type="date"
                value={urssafPaidDate || ''}
                onChange={e => setUrssafPaidDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant payé URSSAF</label>
              <input
                type="number"
                step="0.01"
                value={urssafPaidAmount}
                onChange={e => setUrssafPaidAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Sélectionner un client</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Invoice Lines */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Lignes de facture</h3>
              <button
                onClick={addLine}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                + Ajouter une ligne
              </button>
            </div>
            <div className="space-y-2">
              {lines.map((line, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={line.product_id}
                    onChange={(e) => updateLine(index, 'product_id', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Sélectionner un produit</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {Number(product.price).toFixed(2)} €
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                    placeholder="Qté"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={line.price}
                    onChange={(e) => updateLine(index, 'price', e.target.value)}
                    placeholder="Prix"
                    className="w-28 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={() => removeLine(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right">
              <span className="text-lg font-semibold text-gray-900">
                Total: {lines.reduce((sum, line) => sum + (Number(line.quantity) * Number(line.price)), 0).toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Payments */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Paiements</h3>
              <button
                onClick={addPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                + Ajouter un paiement
              </button>
            </div>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun paiement enregistré</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={payment.date}
                      onChange={(e) => updatePayment(index, 'date', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={payment.amount}
                      onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                      placeholder="Montant"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <button
                      onClick={() => removePayment(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      ✖️
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 text-right">
              <span className="text-md font-semibold text-green-600">
                Total payé: {payments.reduce((sum, p) => sum + Number(p.amount || 0), 0).toFixed(2)} €
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex flex-col gap-3">
          <label className="inline-flex items-center mb-2">
            <input type="checkbox" checked={sendMail} onChange={e => setSendMail(e.target.checked)} className="mr-2" />
            Envoyer la facture par mail à la validation
          </label>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Enregistrement...' : (invoice ? 'Enregistrer' : 'Créer la facture')}
          </button>
        </div>
      </div>
    </div>
  )
}

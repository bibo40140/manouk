'use client'

import { useState } from 'react'
import InvoiceDetailsModal from './InvoiceDetailsModal'
import PaymentModal from './PaymentModal'
import InvoiceEditModal from './InvoiceEditModal'
import UrssafDeclareModal from './UrssafDeclareModal'
import UrssafPayModal from './UrssafPayModal'

export default function InvoicesList({ invoices, companies, customers, products }: any) {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [paymentInvoice, setPaymentInvoice] = useState<any>(null)
  const [editInvoice, setEditInvoice] = useState<any>(null)
  const [urssafDeclareInvoice, setUrssafDeclareInvoice] = useState<any>(null)
  const [urssafPayInvoice, setUrssafPayInvoice] = useState<any>(null)
  const [companyFilter, setCompanyFilter] = useState('')

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const filteredInvoices = invoices.filter((inv: any) => 
    !companyFilter || inv.company_id === companyFilter
  )

  const getStatusBadge = (invoice: any) => {
    const remaining = Number(invoice.total) - Number(invoice.paid)
    if (remaining <= 0) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Payée</span>
    }
    if (Number(invoice.paid) > 0) {
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Partiellement payée</span>
    }
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">En attente</span>
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6">
        {/* Filtre */}
        {companies.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par société
            </label>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Toutes les sociétés</option>
              {companies.map((company: any) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Liste des factures */}
        {filteredInvoices.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            Aucune facture. Créez-en une avec le bouton "Nouvelle facture" ci-dessus.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">N° Facture</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Société</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Payé</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Restant</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">URSSAF</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInvoices.map((invoice: any) => {
                  const remaining = Number(invoice.total) - Number(invoice.paid)
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {invoice.customer?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {invoice.company?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(invoice.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatEuro(Number(invoice.total))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-green-600">
                        {formatEuro(Number(invoice.paid))}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-orange-600">
                        {formatEuro(remaining)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(invoice)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="space-y-1">
                          {/* URSSAF Declaration Badge */}
                          {invoice.urssaf_declared_date ? (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              ✓ Déclaré {new Date(invoice.urssaf_declared_date).toLocaleDateString('fr-FR')}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              Non déclaré
                            </span>
                          )}
                          
                          {/* URSSAF Payment Badge */}
                          {invoice.urssaf_paid_date ? (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              ✓ Payé {new Date(invoice.urssaf_paid_date).toLocaleDateString('fr-FR')}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              Non payé
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditInvoice(invoice)}
                              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                            >
                              ✏️ Modifier
                            </button>
                            {remaining > 0 && (
                              <button
                                onClick={() => setPaymentInvoice(invoice)}
                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                              >
                                💰 Payer
                              </button>
                            )}
                          </div>
                          <div className="flex justify-end gap-2">
                            {!invoice.urssaf_declared_date && (
                              <button
                                onClick={() => setUrssafDeclareInvoice(invoice)}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                              >
                                📋 Déclarer URSSAF
                              </button>
                            )}
                            {invoice.urssaf_declared_date && !invoice.urssaf_paid_date && (
                              <button
                                onClick={() => setUrssafPayInvoice(invoice)}
                                className="text-purple-600 hover:text-purple-800 text-xs font-medium"
                              >
                                💶 Payer URSSAF
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {paymentInvoice && (
        <PaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
        />
      )}

      {editInvoice && (
        <InvoiceEditModal
          invoice={editInvoice}
          onClose={() => setEditInvoice(null)}
        />
      )}

      {urssafDeclareInvoice && (
        <UrssafDeclareModal
          invoice={urssafDeclareInvoice}
          onClose={() => setUrssafDeclareInvoice(null)}
        />
      )}

      {urssafPayInvoice && (
        <UrssafPayModal
          invoice={urssafPayInvoice}
          onClose={() => setUrssafPayInvoice(null)}
        />
      )}
    </>
  )
}

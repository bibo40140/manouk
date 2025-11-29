'use client'

import { XMarkIcon } from '@heroicons/react/24/outline'

export default function InvoiceDetailsModal({ invoice, onClose }: any) {
  const formatEuro = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  }

  const remaining = Number(invoice.total) - Number(invoice.paid)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Facture {invoice.invoice_number}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Client</label>
              <p className="text-base font-semibold text-gray-900">{invoice.customer?.name}</p>
              {invoice.customer?.email && (
                <p className="text-sm text-gray-600">{invoice.customer.email}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Société</label>
              <p className="text-base font-semibold text-gray-900">{invoice.company?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Date de facture</label>
              <p className="text-base text-gray-900">
                {new Date(invoice.invoice_date).toLocaleDateString('fr-FR')}
              </p>
            </div>
            {invoice.due_date && (
              <div>
                <label className="text-sm font-medium text-gray-600">Date d'échéance</label>
                <p className="text-base text-gray-900">
                  {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>

          {/* Lignes de facture */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Lignes de facture</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Produit</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Quantité</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Prix unitaire</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoice.invoice_lines?.map((line: any) => (
                    <tr key={line.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">{line.product?.name || 'Produit inconnu'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{line.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-700">{formatEuro(Number(line.unit_price))}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                        {formatEuro(Number(line.total))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totaux */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total de la facture</span>
              <span className="text-xl font-bold text-gray-900">{formatEuro(Number(invoice.total))}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Montant payé</span>
              <span className="text-lg font-semibold text-green-600">{formatEuro(Number(invoice.paid))}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-900 font-medium">Restant dû</span>
              <span className={`text-xl font-bold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatEuro(remaining)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

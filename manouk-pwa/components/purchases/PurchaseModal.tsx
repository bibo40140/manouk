'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function PurchaseModal({ companies, suppliers, rawMaterials, activeCompanyId }: any) {
  const router = useRouter()
  const supabase = createClient()
  
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Auto-sélectionner la société active si disponible
  const [companyId, setCompanyId] = useState(activeCompanyId || '')
  const [rawMaterialId, setRawMaterialId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [totalPrice, setTotalPrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [paid, setPaid] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('purchases')
        .insert([{
          company_id: companyId,
          raw_material_id: rawMaterialId,
          quantity: parseFloat(quantity),
          unit_cost: parseFloat(unitCost),
          purchase_date: purchaseDate,
          paid
        }])

      if (error) throw error

      // Déclencher la vérification des alertes de stock après l'achat
      try {
        await fetch('/api/stock/process-alerts', { method: 'POST' })
      } catch (alertError) {
        console.error('Erreur envoi alertes:', alertError)
        // Ne pas bloquer l'achat si l'envoi d'alertes échoue
      }

      // Réinitialiser le formulaire
      setCompanyId('')
      setRawMaterialId('')
      setQuantity('')
      setUnitCost('')
      setTotalPrice('')
      setPurchaseDate(new Date().toISOString().split('T')[0])
      setPaid(false)
      setIsOpen(false)
      router.refresh()
    } catch (err: any) {
      alert('Erreur: ' + err.message)
    } finally {
      setLoading(false)
    }
  }


  const filteredRawMaterials = rawMaterials.filter((m: any) => 
    !companyId || m.company_id === companyId
  )

  const selectedMaterial = rawMaterials.find((m: any) => m.id === rawMaterialId)

  const calculateTotal = () => {
    if (!quantity || !unitCost) return 0
    return parseFloat(quantity) * parseFloat(unitCost)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <PlusIcon className="w-5 h-5" />
        Nouvel achat
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Nouvel achat</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!activeCompanyId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Société *
                    </label>
                    <select
                      value={companyId}
                      onChange={(e) => setCompanyId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner...</option>
                      {companies.map((company: any) => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                  </div>
                )}



                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matière première *
                  </label>
                  <select
                    value={rawMaterialId}
                    onChange={(e) => {
                      setRawMaterialId(e.target.value)
                      const material = rawMaterials.find((m: any) => m.id === e.target.value)
                      if (material) {
                        setUnitCost(material.unit_cost.toString())
                      }
                    }}
                    required
                    disabled={!companyId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Sélectionner...</option>
                    {filteredRawMaterials.map((material: any) => (
                      <option key={material.id} value={material.id}>
                        {material.name} ({material.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="100"
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    {selectedMaterial && (
                      <div className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium">
                        {selectedMaterial.unit}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coût unitaire (€) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={unitCost}
                    onChange={(e) => {
                      setUnitCost(e.target.value)
                      // Si on modifie le coût unitaire manuellement, calculer le prix total
                      if (e.target.value && quantity) {
                        setTotalPrice((parseFloat(e.target.value) * parseFloat(quantity)).toFixed(4))
                      }
                    }}
                    placeholder="0.0606"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Ou utilisez "Prix total du lot" ci-dessous</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    💡 Prix total du lot (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalPrice}
                    onChange={(e) => {
                      setTotalPrice(e.target.value)
                      // Calculer automatiquement le coût unitaire
                      if (e.target.value && quantity && parseFloat(quantity) > 0) {
                        setUnitCost((parseFloat(e.target.value) / parseFloat(quantity)).toFixed(4))
                      }
                    }}
                    placeholder="12.12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-green-50"
                  />
                  <p className="text-xs text-green-600 mt-1">
                    {quantity && totalPrice && parseFloat(quantity) > 0 
                      ? `→ Coût unitaire : ${(parseFloat(totalPrice) / parseFloat(quantity)).toFixed(4)} €`
                      : 'Saisissez quantité + prix total pour calculer automatiquement'
                    }
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'achat *
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paid}
                      onChange={(e) => setPaid(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Payé</span>
                  </label>
                </div>
              </div>

              {/* Total */}
              {quantity && unitCost && (
                <div className="flex justify-end">
                  <div className="bg-indigo-50 border-2 border-indigo-600 rounded-lg px-6 py-3">
                    <div className="text-sm text-gray-600">Total de l'achat</div>
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
                  {loading ? 'Création...' : 'Créer l\'achat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

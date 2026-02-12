'use client'

import { useState } from 'react'
import ProductionModal from '@/components/stock/ProductionModal'

export default function ProductionButton({ products }: { products: any[] }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2 text-sm"
      >
        <span>🏭</span>
        <span>Nouvelle Production</span>
      </button>

      {showModal && (
        <ProductionModal
          products={products}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

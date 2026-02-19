'use client'

import { useState } from 'react'
import DeliveryModal from '@/components/deliveries/DeliveryModal'

export default function DeliveryButton({ customers, productions }: { customers: any[]; productions: any[] }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 text-sm"
      >
        <span>🚚</span>
        <span>Nouvelle Livraison</span>
      </button>

      {showModal && (
        <DeliveryModal
          customers={customers}
          productions={productions}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}
    </>
  )
}

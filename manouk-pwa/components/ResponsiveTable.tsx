'use client'

import { ReactNode } from 'react'

interface ResponsiveTableProps {
  children: ReactNode
  className?: string
}

export default function ResponsiveTable({ children, className = '' }: ResponsiveTableProps) {
  return (
    <div className={`overflow-x-auto -mx-4 sm:mx-0 ${className}`}>
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          {children}
        </div>
      </div>
    </div>
  )
}

// Composant pour les cellules mobiles
export function MobileTableCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white p-4 border-b border-gray-200 space-y-2 ${className}`}>
      {children}
    </div>
  )
}

export function MobileTableRow({ label, value, className = '' }: { label: string; value: ReactNode; className?: string }) {
  return (
    <div className={`flex justify-between items-center ${className}`}>
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

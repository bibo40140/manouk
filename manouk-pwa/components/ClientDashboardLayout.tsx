'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { User } from '@supabase/supabase-js'

export default function ClientDashboardLayout({
  user,
  children,
}: {
  user: User
  children: React.ReactNode
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} onMenuToggle={() => setIsMenuOpen(!isMenuOpen)} />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

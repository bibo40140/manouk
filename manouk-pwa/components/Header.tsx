'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Bars3Icon } from '@heroicons/react/24/outline'

export default function Header({ user, onMenuClick }: { user: User; onMenuClick: () => void }) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        {/* Bouton menu hamburger pour mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-600 hover:text-gray-900"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        
        <div className="text-xs sm:text-sm text-gray-600">
          <span className="hidden sm:inline">Connecté en tant que </span>
          <span className="font-semibold text-gray-900">{user.email}</span>
        </div>
      </div>
      
      <button
        onClick={handleLogout}
        className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <span className="hidden sm:inline">Se déconnecter</span>
        <span className="sm:hidden">Quitter</span>
      </button>
    </header>
  )
}

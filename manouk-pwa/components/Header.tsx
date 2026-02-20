'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { Bars3Icon } from '@heroicons/react/24/outline'

export default function Header({
  user,
  onMenuToggle,
}: {
  user: User
  onMenuToggle?: () => void
}) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex justify-between items-center shadow-sm gap-4">
      <button
        onClick={onMenuToggle}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
        aria-label="Toggle menu"
      >
        <Bars3Icon className="w-6 h-6 text-gray-600" />
      </button>
      
      <div className="text-xs sm:text-sm text-gray-600 truncate">
        Connecté en tant que <span className="font-semibold text-gray-900 hidden sm:inline">{user.email}</span>
        <span className="font-semibold text-gray-900 sm:hidden">{user.email?.split('@')[0]}</span>
      </div>
      
      <button
        onClick={handleLogout}
        className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap"
      >
        Déconnexion
      </button>
    </header>
  )
}

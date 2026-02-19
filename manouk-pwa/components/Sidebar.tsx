'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  DocumentTextIcon, 
  ShoppingCartIcon,
  CurrencyEuroIcon,
  CogIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
  TruckIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: HomeIcon },
  { name: 'Factures', href: '/dashboard/invoices', icon: DocumentTextIcon },
  { name: 'Achats', href: '/dashboard/purchases', icon: ShoppingCartIcon },
  { name: 'Stocks', href: '/dashboard/stock', icon: CubeIcon },
  { name: 'Productions', href: '/dashboard/productions', icon: WrenchScrewdriverIcon },
  { name: 'Livraisons', href: '/dashboard/deliveries', icon: TruckIcon },
  { name: 'Trésorerie prévisionnelle', href: '/dashboard/forecast', icon: CurrencyEuroIcon },
  { name: 'Paramètres', href: '/dashboard/settings', icon: CogIcon },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 text-white shadow-2xl">
      <div className="p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Manouk
        </h2>
      </div>
      <nav className="px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

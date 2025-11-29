'use client'

import { useSearchParams, useRouter } from 'next/navigation'

type Company = {
  id: string
  code: string
  name: string
}

export default function CompanyFilter({ companies }: { companies: Company[] }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentCompany = searchParams.get('company') || 'all'

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('company')
    } else {
      params.set('company', value)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">
        Filtrer société :
      </label>
      <select
        value={currentCompany}
        onChange={(e) => handleChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
      >
        <option value="all">Toutes les sociétés</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </div>
  )
}

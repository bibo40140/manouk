'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveCompany } from '@/hooks/useActiveCompany';

type Company = {
  id: string;
  code: string;
  name: string;
};

export default function CompanyFilter({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const { activeCompanyId, setActiveCompanyId } = useActiveCompany(companies);

  useEffect(() => {
    // Update cookie for SSR sync
    if (typeof document !== 'undefined' && activeCompanyId) {
      document.cookie = `active_company_id=${activeCompanyId}; path=/`;
    }
  }, [activeCompanyId]);

  const handleChange = (value: string) => {
    setActiveCompanyId(value);
    // Forcer le rechargement pour mettre à jour le dashboard côté serveur
    router.refresh();
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">
        Filtrer société :
      </label>
      <select
        value={activeCompanyId || 'all'}
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
  );
}

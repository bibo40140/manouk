import { useEffect, useState } from 'react';

const COMPANY_COOKIE_KEY = 'activeCompanyId';
const DEFAULT_COMPANY = 'MANOUK'; // Use the actual Manouk company ID if available

export function useActiveCompany(companies: { id: string; name: string }[] = []) {
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);

  useEffect(() => {
    // Try to get from localStorage first
    let stored = null;
    if (typeof window !== 'undefined') {
      stored = localStorage.getItem(COMPANY_COOKIE_KEY);
    }
    let initial = stored;
    // If not in localStorage, use Manouk as default if present
    if (!initial && companies.length > 0) {
      const manouk = companies.find(c => c.name.toUpperCase().includes('MANOUK'));
      initial = manouk ? manouk.id : companies[0].id;
      if (typeof window !== 'undefined') {
        localStorage.setItem(COMPANY_COOKIE_KEY, initial);
      }
    }
    setActiveCompanyId(initial);
  }, [companies]);

  const setCompany = (id: string) => {
    setActiveCompanyId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(COMPANY_COOKIE_KEY, id);
    }
  };

  return { activeCompanyId, setActiveCompanyId: setCompany };
}

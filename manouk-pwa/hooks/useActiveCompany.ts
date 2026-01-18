import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const COMPANY_STORAGE_KEY = 'activeCompanyId';

type Company = { id: string; code: string; name: string };

export function useActiveCompany() {
  const supabase = createClient();
  const [companiesAuthorized, setCompaniesAuthorized] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCompaniesAuthorized([]);
          setActiveCompanyId(null);
          setLoading(false);
          return;
        }

        const isAdmin = user.email === 'fabien.hicauber@gmail.com';

        // Try to read authorized companies via user_companies relation (inner join)
        const { data: rel, error: relErr } = await supabase
          .from('user_companies')
          .select('companies!inner(id, code, name)')
          .eq('user_id', user.id);

        let companies: Company[] = [];
        if (!relErr && rel && rel.length > 0) {
          companies = rel.map((r: any) => ({ id: r.companies.id, code: r.companies.code, name: r.companies.name }));
        } else {
          // Fallback: list companies — RLS should still restrict
          const { data, error } = await supabase
            .from('companies')
            .select('id, code, name')
            .order('name', { ascending: true });
          if (error) throw error;
          companies = data || [];
        }
        setCompaniesAuthorized(companies);

        // Pour l'admin, on force TOUJOURS null (= Tout)
        if (isAdmin) {
          document.cookie = `activeCompanyId=all; path=/; max-age=${60 * 60 * 24 * 365}`;
          setActiveCompanyId(null);
          setLoading(false);
          return;
        }

        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(COMPANY_STORAGE_KEY) : null;
        const validStored = stored && companies.some(c => c.id === stored) ? stored : null;
        const fallback = companies.length > 0 ? companies[0].id : null;
        setActiveCompanyId(validStored ?? fallback);
      } catch (e: any) {
        setError(e.message || 'Erreur');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSeeAll = useMemo(() => companiesAuthorized.length > 1, [companiesAuthorized]);

  const changeActiveCompany = (id: string | null) => {
    setActiveCompanyId(id);
    if (typeof window !== 'undefined') {
      if (id) window.localStorage.setItem(COMPANY_STORAGE_KEY, id);
      else window.localStorage.removeItem(COMPANY_STORAGE_KEY);
    }
  };

  return { companiesAuthorized, activeCompanyId, setActiveCompanyId: changeActiveCompany, canSeeAll, loading, error };
}

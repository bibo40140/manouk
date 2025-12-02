"use client"

import { useActiveCompany } from "@/hooks/useActiveCompany";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Props = {
	companies?: { id: string; name: string }[]
	canSeeAllOverride?: boolean
};

export default function CompanyFilter({ companies, canSeeAllOverride }: Props) {
	const { companiesAuthorized, activeCompanyId, setActiveCompanyId, canSeeAll, loading } = useActiveCompany();
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	if (loading) return null;
	const list = companies && companies.length > 0 ? companies : companiesAuthorized || [];
	if (!list || list.length === 0) return null;

	const urlCompany = searchParams.get('company');
	const selected = urlCompany === 'all'
		? '__ALL__'
		: (urlCompany || (activeCompanyId ?? ((canSeeAllOverride ?? canSeeAll) ? '__ALL__' : list[0]?.id)));
	// Debug: log current selection sources
	if (typeof window !== 'undefined') {
		console.log('[CompanyFilter] init', {
			urlCompany,
			activeCompanyId,
			canSeeAll: canSeeAllOverride ?? canSeeAll,
			listCount: list.length,
			selected
		});
	}

	const onChange = (val: string) => {
		// Update local selection state for client-side components
		const newId = val === '__ALL__' ? null : val;
		setActiveCompanyId(newId);
		// Persist cookie for server-side reads (cookie-only strategy)
		const cookieVal = val === '__ALL__' ? 'all' : val;
		document.cookie = `activeCompanyId=${cookieVal}; path=/; max-age=${60 * 60 * 24 * 365}`;
		// Debug: log write event
		console.log('[CompanyFilter] change', { val, newId, cookieVal });
		// Refresh current route without altering URL params
		router.refresh();
	};

	return (
		<div className="flex items-center gap-2">
			<label className="text-sm text-gray-600">Société</label>
			<select
				value={selected}
				onChange={(e) => onChange(e.target.value)}
				className="px-2 py-1 border rounded text-sm"
			>
				{(canSeeAllOverride ?? canSeeAll) && (
					<option value="__ALL__">Tout</option>
				)}
				{list.map((c) => (
					<option key={c.id} value={c.id}>{c.name}</option>
				))}
			</select>
		</div>
	);
}

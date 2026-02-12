'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'

export default function GlobalExportButton({ companyId }: { companyId?: string }) {
  const [isExporting, setIsExporting] = useState(false)

  const exportAllData = async () => {
    setIsExporting(true)
    
    try {
      const supabase = createClient()
      
      // Récupérer toutes les données
      let invoicesQuery = supabase
        .from('invoices')
        .select(`
          invoice_number,
          date,
          total,
          paid,
          customer:customers(name),
          company:companies(name, code),
          urssaf_amount,
          urssaf_declared_date,
          urssaf_paid_date,
          email_sent,
          email_sent_date
        `)
        .order('date', { ascending: false })
      
      if (companyId && companyId !== 'all') {
        invoicesQuery = invoicesQuery.eq('company_id', companyId)
      }

      let purchasesQuery = supabase
        .from('purchases')
        .select(`
          date,
          raw_material:raw_materials(name),
          supplier:suppliers(name),
          quantity,
          unit_cost,
          amount,
          paid,
          company:companies(name, code)
        `)
        .order('date', { ascending: false })
      
      if (companyId && companyId !== 'all') {
        purchasesQuery = purchasesQuery.eq('company_id', companyId)
      }

      let customersQuery = supabase
        .from('customers')
        .select('name, email, company:companies(name)')
        .order('name')
      
      if (companyId && companyId !== 'all') {
        customersQuery = customersQuery.eq('company_id', companyId)
      }

      let productsQuery = supabase
        .from('products')
        .select('name, price, company:companies(name)')
        .order('name')
      
      if (companyId && companyId !== 'all') {
        productsQuery = productsQuery.eq('company_id', companyId)
      }

      // Récupérer les splits de produits
      const { data: productSplits } = await supabase
        .from('product_company_splits')
        .select(`
          amount,
          product:products(name),
          company:companies(name, code)
        `)
        .order('product_id')

      // Récupérer les sociétés
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, code')
        .order('name')

      const [
        { data: invoices },
        { data: purchases },
        { data: customers },
        { data: products }
      ] = await Promise.all([
        invoicesQuery,
        purchasesQuery,
        customersQuery,
        productsQuery
      ])

      // Créer le workbook
      const wb = XLSX.utils.book_new()

      // Onglet 1: Factures
      const invoicesData = (invoices || []).map((inv: any) => ({
        'N° Facture': inv.invoice_number,
        'Date': new Date(inv.date).toLocaleDateString('fr-FR'),
        'Client': inv.customer?.name || 'N/A',
        'Société': inv.company?.name || 'N/A',
        'Code': inv.company?.code || 'N/A',
        'Montant HT': inv.total,
        'Payée': inv.paid ? 'Oui' : 'Non',
        'URSSAF': inv.urssaf_amount || 0,
        'URSSAF Déclaré': inv.urssaf_declared_date ? 'Oui' : 'Non',
        'URSSAF Payé': inv.urssaf_paid_date ? 'Oui' : 'Non',
        'Email envoyé': inv.email_sent ? 'Oui' : 'Non'
      }))
      const wsInvoices = XLSX.utils.json_to_sheet(invoicesData)
      wsInvoices['!cols'] = [
        { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 8 },
        { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 12 }
      ]
      XLSX.utils.book_append_sheet(wb, wsInvoices, 'Factures')

      // Onglet 2: Achats
      const purchasesData = (purchases || []).map((p: any) => ({
        'Date': new Date(p.date).toLocaleDateString('fr-FR'),
        'Matière première': p.raw_material?.name || 'N/A',
        'Fournisseur': p.supplier?.name || 'N/A',
        'Quantité': p.quantity,
        'Coût unitaire': p.unit_cost,
        'Montant total': p.amount,
        'Payé': p.paid ? 'Oui' : 'Non',
        'Société': p.company?.name || 'N/A',
        'Code': p.company?.code || 'N/A'
      }))
      const wsPurchases = XLSX.utils.json_to_sheet(purchasesData)
      wsPurchases['!cols'] = [
        { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 10 },
        { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 8 }
      ]
      XLSX.utils.book_append_sheet(wb, wsPurchases, 'Achats')

      // Onglet 3: Clients
      const customersData = (customers || []).map((c: any) => ({
        'Nom': c.name,
        'Email': c.email || '',
        'Société': c.company?.name || 'N/A'
      }))
      const wsCustomers = XLSX.utils.json_to_sheet(customersData)
      wsCustomers['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, wsCustomers, 'Clients')

      // Onglet 4: Produits
      const productsData = (products || []).map((p: any) => ({
        'Nom': p.name,
        'Prix HT': p.price,
        'Société': p.company?.name || 'N/A'
      }))
      const wsProducts = XLSX.utils.json_to_sheet(productsData)
      wsProducts['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Produits')

      // Onglet 5: Splits Produits par Société
      const splitsData = (productSplits || []).map((s: any) => ({
        'Produit': s.product?.name || 'N/A',
        'Société': s.company?.name || 'N/A',
        'Code': s.company?.code || 'N/A',
        'Montant': s.amount
      }))
      const wsSplits = XLSX.utils.json_to_sheet(splitsData)
      wsSplits['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 8 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(wb, wsSplits, 'Splits Produits')

      // Onglet 6: Statistiques
      const totalCA = (invoices || []).reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)
      const totalCAPaye = (invoices || []).filter((inv: any) => inv.paid).reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)
      const totalAchats = (purchases || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      const totalAchatsPayes = (purchases || []).filter((p: any) => p.paid).reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      const totalURSSAF = (invoices || []).reduce((sum: number, inv: any) => sum + (inv.urssaf_amount || 0), 0)
      const totalURSSAFDeclare = (invoices || []).filter((inv: any) => inv.urssaf_declared_date).reduce((sum: number, inv: any) => sum + (inv.urssaf_amount || 0), 0)
      const totalURSSAFPaye = (invoices || []).filter((inv: any) => inv.urssaf_paid_date).reduce((sum: number, inv: any) => sum + (inv.urssaf_amount || 0), 0)

      const statsData = [
        { 'Indicateur': 'CA Total', 'Valeur': totalCA + ' €' },
        { 'Indicateur': 'CA Payé', 'Valeur': totalCAPaye + ' €' },
        { 'Indicateur': 'CA Non payé', 'Valeur': (totalCA - totalCAPaye) + ' €' },
        { 'Indicateur': 'Taux de paiement', 'Valeur': totalCA > 0 ? ((totalCAPaye / totalCA * 100).toFixed(1) + ' %') : '0 %' },
        { 'Indicateur': '', 'Valeur': '' },
        { 'Indicateur': 'Achats Total', 'Valeur': totalAchats + ' €' },
        { 'Indicateur': 'Achats Payés', 'Valeur': totalAchatsPayes + ' €' },
        { 'Indicateur': 'Achats Non payés', 'Valeur': (totalAchats - totalAchatsPayes) + ' €' },
        { 'Indicateur': '', 'Valeur': '' },
        { 'Indicateur': 'Résultat Réel', 'Valeur': (totalCAPaye - totalAchatsPayes) + ' €' },
        { 'Indicateur': 'Résultat Prévisionnel', 'Valeur': (totalCA - totalAchats) + ' €' },
        { 'Indicateur': '', 'Valeur': '' },
        { 'Indicateur': 'URSSAF Total', 'Valeur': totalURSSAF + ' €' },
        { 'Indicateur': 'URSSAF Déclaré', 'Valeur': totalURSSAFDeclare + ' €' },
        { 'Indicateur': 'URSSAF Payé', 'Valeur': totalURSSAFPaye + ' €' },
        { 'Indicateur': '', 'Valeur': '' },
        { 'Indicateur': 'Nombre de factures', 'Valeur': (invoices || []).length },
        { 'Indicateur': 'Nombre d\'achats', 'Valeur': (purchases || []).length },
        { 'Indicateur': 'Nombre de clients', 'Valeur': (customers || []).length },
        { 'Indicateur': 'Nombre de produits', 'Valeur': (products || []).length }
      ]
      const wsStats = XLSX.utils.json_to_sheet(statsData)
      wsStats['!cols'] = [{ wch: 25 }, { wch: 20 }]
      XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques')

      // Générer le fichier
      const companyLabel = companyId && companyId !== 'all' ? `_${companyId.slice(0, 8)}` : '_toutes_societes'
      const fileName = `export_global${companyLabel}_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)

      // Si "Toutes les sociétés", générer aussi un fichier par société
      if (companyId === 'all' && companies && companies.length > 0) {
        for (const company of companies) {
          const wbCompany = XLSX.utils.book_new()
          
          // Filtrer les données pour cette société
          const companyInvoices = (invoices || []).filter((inv: any) => inv.company?.name === company.name)
          const companyPurchases = (purchases || []).filter((p: any) => p.company?.name === company.name)
          const companyCustomers = (customers || []).filter((c: any) => c.company?.name === company.name)
          const companyProducts = (products || []).filter((p: any) => p.company?.name === company.name)
          const companySplits = (productSplits || []).filter((s: any) => s.company?.name === company.name)

          // Factures
          const companyInvoicesData = companyInvoices.map((inv: any) => ({
            'N° Facture': inv.invoice_number,
            'Date': new Date(inv.date).toLocaleDateString('fr-FR'),
            'Client': inv.customer?.name || 'N/A',
            'Montant HT': inv.total,
            'Payée': inv.paid ? 'Oui' : 'Non',
            'URSSAF': inv.urssaf_amount || 0,
            'URSSAF Déclaré': inv.urssaf_declared_date ? 'Oui' : 'Non',
            'URSSAF Payé': inv.urssaf_paid_date ? 'Oui' : 'Non',
            'Email envoyé': inv.email_sent ? 'Oui' : 'Non'
          }))
          const wsCompanyInvoices = XLSX.utils.json_to_sheet(companyInvoicesData)
          wsCompanyInvoices['!cols'] = [
            { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 12 },
            { wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 12 }
          ]
          XLSX.utils.book_append_sheet(wbCompany, wsCompanyInvoices, 'Factures')

          // Achats
          const companyPurchasesData = companyPurchases.map((p: any) => ({
            'Date': new Date(p.date).toLocaleDateString('fr-FR'),
            'Matière première': p.raw_material?.name || 'N/A',
            'Fournisseur': p.supplier?.name || 'N/A',
            'Quantité': p.quantity,
            'Coût unitaire': p.unit_cost,
            'Montant total': p.amount,
            'Payé': p.paid ? 'Oui' : 'Non'
          }))
          const wsCompanyPurchases = XLSX.utils.json_to_sheet(companyPurchasesData)
          wsCompanyPurchases['!cols'] = [
            { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 10 },
            { wch: 12 }, { wch: 12 }, { wch: 8 }
          ]
          XLSX.utils.book_append_sheet(wbCompany, wsCompanyPurchases, 'Achats')

          // Clients
          const companyCustomersData = companyCustomers.map((c: any) => ({
            'Nom': c.name,
            'Email': c.email || ''
          }))
          const wsCompanyCustomers = XLSX.utils.json_to_sheet(companyCustomersData)
          wsCompanyCustomers['!cols'] = [{ wch: 25 }, { wch: 30 }]
          XLSX.utils.book_append_sheet(wbCompany, wsCompanyCustomers, 'Clients')

          // Produits avec splits
          const companyProductsData = companyProducts.map((p: any) => {
            const split = companySplits.find((s: any) => s.product?.name === p.name)
            return {
              'Nom': p.name,
              'Prix total': p.price,
              'Part société': split?.amount || 0
            }
          })
          const wsCompanyProducts = XLSX.utils.json_to_sheet(companyProductsData)
          wsCompanyProducts['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }]
          XLSX.utils.book_append_sheet(wbCompany, wsCompanyProducts, 'Produits')

          // Stats pour cette société
          const companyTotalCA = companyInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)
          const companyTotalCAPaye = companyInvoices.filter((inv: any) => inv.paid).reduce((sum: number, inv: any) => sum + (inv.total || 0), 0)
          const companyTotalAchats = companyPurchases.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
          const companyTotalAchatsPayes = companyPurchases.filter((p: any) => p.paid).reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
          
          const companyStatsData = [
            { 'Indicateur': 'CA Total', 'Valeur': companyTotalCA + ' €' },
            { 'Indicateur': 'CA Payé', 'Valeur': companyTotalCAPaye + ' €' },
            { 'Indicateur': 'Achats Total', 'Valeur': companyTotalAchats + ' €' },
            { 'Indicateur': 'Achats Payés', 'Valeur': companyTotalAchatsPayes + ' €' },
            { 'Indicateur': 'Résultat Réel', 'Valeur': (companyTotalCAPaye - companyTotalAchatsPayes) + ' €' },
            { 'Indicateur': 'Résultat Prévisionnel', 'Valeur': (companyTotalCA - companyTotalAchats) + ' €' },
            { 'Indicateur': '', 'Valeur': '' },
            { 'Indicateur': 'Nombre de factures', 'Valeur': companyInvoices.length },
            { 'Indicateur': 'Nombre d\'achats', 'Valeur': companyPurchases.length },
            { 'Indicateur': 'Nombre de clients', 'Valeur': companyCustomers.length }
          ]
          const wsCompanyStats = XLSX.utils.json_to_sheet(companyStatsData)
          wsCompanyStats['!cols'] = [{ wch: 25 }, { wch: 20 }]
          XLSX.utils.book_append_sheet(wbCompany, wsCompanyStats, 'Statistiques')

          // Générer le fichier pour cette société
          const companyFileName = `export_${company.code || company.name}_${new Date().toISOString().split('T')[0]}.xlsx`
          XLSX.writeFile(wbCompany, companyFileName)
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      alert('Erreur lors de l\'export Excel')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={exportAllData}
      disabled={isExporting}
      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-lg font-semibold"
    >
      {isExporting ? (
        <>
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Export en cours...
        </>
      ) : (
        <>
          📥 Exporter toutes les données (Excel)
        </>
      )}
    </button>
  )
}

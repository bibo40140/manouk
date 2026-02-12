'use client'

import { useState } from 'react'
import * as XLSX from 'xlsx'

type Invoice = {
  invoice_number: string
  date: string
  total: number
  paid: boolean
  customer: { name: string } | null
  company: { name: string; code: string } | null
  urssaf_amount?: number
  urssaf_declared_date?: string | null
  urssaf_paid_date?: string | null
  email_sent?: boolean
  email_sent_date?: string | null
}

export default function ExportButton({ invoices }: { invoices: Invoice[] }) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToExcel = () => {
    setIsExporting(true)
    
    try {
      // Préparer les données pour l'export
      const data = invoices.map(inv => ({
        'N° Facture': inv.invoice_number,
        'Date': new Date(inv.date).toLocaleDateString('fr-FR'),
        'Client': inv.customer?.name || 'N/A',
        'Société': inv.company?.name || 'N/A',
        'Code Société': inv.company?.code || 'N/A',
        'Montant HT': inv.total,
        'Statut': inv.paid ? 'Payée' : 'Non payée',
        'URSSAF': inv.urssaf_amount || 0,
        'URSSAF Déclaré': inv.urssaf_declared_date ? 'Oui' : 'Non',
        'Date Déclaration': inv.urssaf_declared_date ? new Date(inv.urssaf_declared_date).toLocaleDateString('fr-FR') : '',
        'URSSAF Payé': inv.urssaf_paid_date ? 'Oui' : 'Non',
        'Date Paiement URSSAF': inv.urssaf_paid_date ? new Date(inv.urssaf_paid_date).toLocaleDateString('fr-FR') : '',
        'Email envoyé': inv.email_sent ? 'Oui' : 'Non',
        'Date envoi email': inv.email_sent_date ? new Date(inv.email_sent_date).toLocaleDateString('fr-FR') : ''
      }))

      // Créer un nouveau workbook
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Factures')

      // Ajuster la largeur des colonnes
      const columnWidths = [
        { wch: 12 }, // N° Facture
        { wch: 12 }, // Date
        { wch: 25 }, // Client
        { wch: 15 }, // Société
        { wch: 12 }, // Code Société
        { wch: 12 }, // Montant HT
        { wch: 12 }, // Statut
        { wch: 10 }, // URSSAF
        { wch: 15 }, // URSSAF Déclaré
        { wch: 18 }, // Date Déclaration
        { wch: 12 }, // URSSAF Payé
        { wch: 20 }, // Date Paiement URSSAF
        { wch: 12 }, // Email envoyé
        { wch: 18 }  // Date envoi email
      ]
      ws['!cols'] = columnWidths

      // Générer le fichier Excel
      const fileName = `factures_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error('Erreur lors de l\'export:', error)
      alert('Erreur lors de l\'export Excel')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={exportToExcel}
      disabled={isExporting || invoices.length === 0}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isExporting ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Export...
        </>
      ) : (
        <>
          📊 Exporter Excel
        </>
      )}
    </button>
  )
}

'use client'

import { useState } from 'react'
import CompaniesTab from './CompaniesTab'
import ProductsTab from './ProductsTab'
import RawMaterialsTab from './RawMaterialsTab'
import CustomersTab from './CustomersTab'
import SmtpSettings from './SmtpSettings'

type TabName = 'companies' | 'products' | 'materials' | 'customers' | 'smtp';

export default function SettingsTabs({ companies, products, rawMaterials, customers }: any) {
  const [activeTab, setActiveTab] = useState<TabName>('companies');
  const tabs = [
    { id: 'companies' as TabName, label: '🏢 Sociétés', count: companies.length },
    { id: 'products' as TabName, label: '📦 Produits', count: products.length },
    { id: 'materials' as TabName, label: '🧱 Matières premières', count: rawMaterials.length },
    { id: 'customers' as TabName, label: '👥 Clients', count: customers.length },
    { id: 'smtp' as TabName, label: '✉️ Email', count: 0 },
  ];

  return (
    <div>
      {/* Navigation des tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium text-sm transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenu des tabs */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {activeTab === 'companies' && <CompaniesTab companies={companies} />}
        {activeTab === 'products' && <ProductsTab products={products} companies={companies} rawMaterials={rawMaterials} />}
        {activeTab === 'materials' && <RawMaterialsTab rawMaterials={rawMaterials} companies={companies} />}
        {activeTab === 'customers' && <CustomersTab customers={customers} companies={companies} />}
        {activeTab === 'smtp' && <SmtpSettings />}
      </div>
    </div>
  )
}

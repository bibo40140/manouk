import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ID de l'utilisateur
const userId = process.env.USER_ID

// Lire les données exportées
const dataPath = path.join(__dirname, 'exported-data.json')
if (!fs.existsSync(dataPath)) {
  console.error('❌ Fichier exported-data.json introuvable')
  console.log('💡 Exécutez d\'abord: node scripts/export-from-electron.js')
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

// Maps pour convertir les anciens IDs en UUIDs
const companyIdMap = {}
const customerIdMap = {}
const supplierIdMap = {}
const materialIdMap = {}
const productIdMap = {}
const invoiceIdMap = {}

async function importData() {
  try {
    console.log('🔐 Connexion à Supabase...\n')

    if (!userId) {
      console.error('❌ USER_ID manquant.')
      process.exit(1)
    }
    
    console.log(`✅ Import pour l'utilisateur: ${userId}\n`)

    // 1. Sociétés
    let defaultCompanyId = null
    if (data.companies?.length > 0) {
      console.log('📦 Import sociétés...')
      for (const c of data.companies) {
        const newId = randomUUID()
        companyIdMap[c.id] = newId
        if (!defaultCompanyId) defaultCompanyId = newId
        
        const { error } = await supabase.from('companies').insert({
          id: newId,
          user_id: userId,
          code: c.code,
          name: c.name,
          email: c.email,
          created_at: c.created_at || new Date().toISOString()
        })
        if (error) {
          console.error(`⚠️  Société ${c.name}:`, error.message)
        }
      }
      console.log(`✅ ${data.companies.length} sociétés importées`)
    }

    // 2. Clients
    if (data.customers?.length > 0) {
      console.log('📦 Import clients...')
      for (const c of data.customers) {
        const newId = randomUUID()
        customerIdMap[c.id] = newId
        
        const { error } = await supabase.from('customers').insert({
          id: newId,
          company_id: companyIdMap[c.company_id] || defaultCompanyId,
          name: c.name,
          email: c.email,
          phone: c.phone,
          address: c.address,
          created_at: c.created_at || new Date().toISOString()
        })
        if (error) {
          console.error(`⚠️  Client ${c.name}:`, error.message)
        }
      }
      console.log(`✅ ${data.customers.length} clients importés`)
    }

    // 3. Fournisseurs
    if (data.suppliers?.length > 0) {
      console.log('📦 Import fournisseurs...')
      for (const s of data.suppliers) {
        const newId = randomUUID()
        supplierIdMap[s.id] = newId
        
        const { error } = await supabase.from('suppliers').insert({
          id: newId,
          company_id: companyIdMap[s.company_id] || defaultCompanyId,
          name: s.name,
          email: s.email,
          phone: s.phone,
          address: s.address,
          created_at: s.created_at || new Date().toISOString()
        })
        if (error) {
          console.error(`⚠️  Fournisseur ${s.name}:`, error.message)
        }
      }
      console.log(`✅ ${data.suppliers.length} fournisseurs importés`)
    }

    // 4. Matières premières
    if (data.raw_materials?.length > 0) {
      console.log('📦 Import matières premières...')
      for (const m of data.raw_materials) {
        const newId = randomUUID()
        materialIdMap[m.id] = newId
        
        const { error } = await supabase.from('raw_materials').insert({
          id: newId,
          company_id: companyIdMap[m.company_id] || defaultCompanyId,
          name: m.name,
          unit: m.unit,
          unit_cost: m.unit_cost,
          stock: m.stock || m.current_stock || 0,
          created_at: m.created_at || new Date().toISOString()
        })
        if (error) {
          console.error(`⚠️  Matière ${m.name}:`, error.message)
        }
      }
      console.log(`✅ ${data.raw_materials.length} matières premières importées`)
    }

    // 5. Produits
    if (data.products?.length > 0) {
      console.log('📦 Import produits...')
      for (const p of data.products) {
        const newId = randomUUID()
        productIdMap[p.id] = newId
        
        const { error } = await supabase.from('products').insert({
          id: newId,
          company_id: companyIdMap[p.company_id] || defaultCompanyId,
          name: p.name,
          unit_price: p.unit_price,
          created_at: p.created_at || new Date().toISOString()
        })
        if (error) {
          console.error(`⚠️  Produit ${p.name}:`, error.message)
        }
      }
      console.log(`✅ ${data.products.length} produits importés`)
    }

    // 6. Nomenclature produits (BOM)
    if (data.product_materials?.length > 0) {
      console.log('📦 Import nomenclature produits...')
      for (const pm of data.product_materials) {
        const { error } = await supabase.from('product_materials').insert({
          product_id: productIdMap[pm.product_id],
          raw_material_id: materialIdMap[pm.raw_material_id],
          quantity: pm.quantity
        })
        if (error) {
          console.error(`⚠️  Nomenclature:`, error.message)
        }
      }
      console.log(`✅ ${data.product_materials.length} lignes BOM importées`)
    }

    // 7. Factures
    if (data.invoices?.length > 0) {
      console.log('📦 Import factures...')
      for (const inv of data.invoices) {
        const newId = randomUUID()
        invoiceIdMap[inv.id] = newId
        
        const { error } = await supabase.from('invoices').insert({
          id: newId,
          company_id: companyIdMap[inv.company_id],
          customer_id: customerIdMap[inv.customer_id],
          invoice_number: inv.invoice_number,
          date: inv.invoice_date || inv.date,
          total: inv.total_amount || inv.total || 0,
          paid: 0,
          email_sent: false,
          created_at: inv.created_at || new Date().toISOString()
        })
        if (error) {
          console.error(`⚠️  Facture ${inv.invoice_number}:`, error.message)
        }
      }
      console.log(`✅ ${data.invoices.length} factures importées`)
    }

    // 8. Lignes de factures
    if (data.invoice_lines?.length > 0) {
      console.log('📦 Import lignes de factures...')
      for (const line of data.invoice_lines) {
        const { error } = await supabase.from('invoice_lines').insert({
          invoice_id: invoiceIdMap[line.invoice_id],
          product_id: productIdMap[line.product_id],
          quantity: line.qty || line.quantity || 1,
          price: line.unit_price || line.price || 0
        })
        if (error) {
          console.error(`⚠️  Ligne facture:`, error.message)
        }
      }
      console.log(`✅ ${data.invoice_lines.length} lignes importées`)
    }

    // 9. Paiements
    if (data.payments?.length > 0) {
      console.log('📦 Import paiements...')
      for (const p of data.payments) {
        const { error } = await supabase.from('payments').insert({
          invoice_id: invoiceIdMap[p.invoice_id],
          amount: p.amount,
          date: p.payment_date || p.date,
          created_at: p.created_at || new Date().toISOString()
        })
        if (error) {
          console.error(`⚠️  Paiement:`, error.message)
        }
      }
      console.log(`✅ ${data.payments.length} paiements importés`)
    }

    // 10. Achats
    if (data.purchases?.length > 0) {
      console.log('📦 Import achats...')
      for (const p of data.purchases) {
        const { error } = await supabase.from('purchases').insert({
          company_id: companyIdMap[p.company_id] || defaultCompanyId,
          supplier_id: supplierIdMap[p.supplier_id],
          raw_material_id: materialIdMap[p.raw_material_id],
          quantity: p.quantity,
          unit_cost: p.unit_cost,
          date: p.purchase_date || p.date || new Date().toISOString(),
          paid: p.is_paid || p.paid || false,
          created_at: p.created_at || new Date().toISOString()
        })
        if (error) {
          console.error(`⚠️  Achat:`, error.message)
        }
      }
      console.log(`✅ ${data.purchases.length} achats importés`)
    }

    console.log('\n🎉 Import terminé avec succès !')
    console.log('\n📊 Récapitulatif:')
    console.log(`   • ${data.companies?.length || 0} sociétés`)
    console.log(`   • ${data.customers?.length || 0} clients`)
    console.log(`   • ${data.suppliers?.length || 0} fournisseurs`)
    console.log(`   • ${data.raw_materials?.length || 0} matières premières`)
    console.log(`   • ${data.products?.length || 0} produits`)
    console.log(`   • ${data.invoices?.length || 0} factures (${data.invoice_lines?.length || 0} lignes)`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

importData()

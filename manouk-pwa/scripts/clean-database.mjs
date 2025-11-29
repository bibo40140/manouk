import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function cleanDatabase() {
  console.log('🗑️  Nettoyage de la base de données...\n')

  const tables = [
    'payments',
    'invoice_lines',
    'invoices',
    'purchases',
    'product_materials',
    'products',
    'raw_materials',
    'suppliers',
    'customers',
    'companies'
  ]

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) {
      console.error(`⚠️  Erreur ${table}:`, error.message)
    } else {
      console.log(`✅ Table ${table} vidée`)
    }
  }

  console.log('\n🎉 Nettoyage terminé !')
}

cleanDatabase()

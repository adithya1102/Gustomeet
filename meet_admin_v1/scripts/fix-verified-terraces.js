const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx > 0) {
      const key = trimmed.substring(0, idx).trim()
      const value = trimmed.substring(idx + 1).trim()
      if (!process.env[key]) process.env[key] = value
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(url, key)

async function fix() {
  console.log('Fixing terraces with VERIFIED but is_active=false...\n')
  
  const { data, error } = await supabase
    .from('terraces')
    .update({ is_active: true })
    .eq('verification', 'VERIFIED')
    .eq('is_active', false)
    .select('id, title, area')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Fixed ${data?.length || 0} terrace(s):`)
  data?.forEach(t => console.log(`  ✅ ${t.title} (${t.area})`))

  console.log('\nAll VERIFIED terraces now active. Mobile app will show them.')
}

fix().catch(console.error)

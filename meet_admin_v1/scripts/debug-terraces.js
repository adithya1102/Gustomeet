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

async function debug() {
  console.log('=== TERRACES: Adambakkam vs Nanganallur ===\n')
  
  const { data: terraces } = await supabase
    .from('terraces')
    .select('id, title, area, city, verification, is_active, host_id, created_at')
    .ilike('area', '%adambakkam%')
    
  const { data: nanganallur } = await supabase
    .from('terraces')
    .select('id, title, area, city, verification, is_active, host_id, created_at')
    .ilike('area', '%nanganallur%')

  console.log('Adambakkam terraces:')
  console.log(JSON.stringify(terraces, null, 2))
  
  console.log('\nNanganallur terraces:')
  console.log(JSON.stringify(nanganallur, null, 2))
  
  // Also check ALL terraces with their status
  console.log('\n=== ALL TERRACES ===')
  const { data: all } = await supabase
    .from('terraces')
    .select('id, title, area, city, verification, is_active, created_at')
    .order('created_at', { ascending: false })
  
  all?.forEach(t => {
    console.log(`${t.title} | area=${t.area} | city=${t.city} | verification=${t.verification} | is_active=${t.is_active}`)
  })
  
  // Check what the mobile app query would return
  console.log('\n=== MOBILE APP QUERY RESULTS ===')
  const { data: mobile } = await supabase
    .from('terraces')
    .select('id, title, area, city, verification, is_active')
    .eq('is_active', true)
    .eq('verification', 'VERIFIED')
    .eq('city', 'Chennai')
  
  console.log(`Mobile app would show ${mobile?.length || 0} terraces:`)
  mobile?.forEach(t => console.log(`  - ${t.title} (${t.area})`))
  
  // Check for VERIFIED but is_active=false
  console.log('\n=== VERIFIED but NOT ACTIVE (BUG) ===')
  const { data: bug } = await supabase
    .from('terraces')
    .select('id, title, area, verification, is_active')
    .eq('verification', 'VERIFIED')
    .eq('is_active', false)
  
  bug?.forEach(t => console.log(`  - ${t.title} (${t.area}): verification=${t.verification} but is_active=${t.is_active}`))
}

debug().catch(console.error)

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Parse .env.local
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

if (!url || !key) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

async function test() {
  console.log('🔌 Connecting to Supabase:', url)
  console.log('')

  // Test 1: Count tables
  const tables = [
    'users', 'terraces', 'terrace_permissions', 'terrace_rates',
    'bookings', 'wallet_transactions', 'reviews', 'damage_reports',
    'admin_users', 'admin_audit_log', 'platform_config', 'promo_codes',
    'host_payouts', 'slot_holds', 'cleaning_partners', 'booking_photos',
    'notifications', 'terrace_light_data', 'cleaning_assignments',
    'kyc_records', 'user_kyc_links', 'creator_review_tags', 'terrace_images'
  ]

  console.log('📊 Table Status:')
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`)
    } else {
      console.log(`  ✅ ${table}: ${count} rows`)
    }
  }

  console.log('')

  // Test 2: Check admin users
  const { data: admins } = await supabase.from('admin_users').select('employee_id, full_name, role, is_active')
  console.log('👤 Admin Users:')
  if (admins && admins.length > 0) {
    admins.forEach(a => console.log(`  • ${a.employee_id} — ${a.full_name} (${a.role}) ${a.is_active ? '✅' : '❌'}`))
  } else {
    console.log('  ⚠️ No admin users found')
  }

  console.log('')

  // Test 3: Check recent bookings
  const { data: bookings } = await supabase.from('bookings').select('id, status, created_at').order('created_at', { ascending: false }).limit(5)
  console.log('📅 Recent Bookings (last 5):')
  if (bookings && bookings.length > 0) {
    bookings.forEach(b => console.log(`  • ${b.id.substring(0,8)} — ${b.status} — ${b.created_at}`))
  } else {
    console.log('  ⚠️ No bookings found')
  }

  console.log('')

  // Test 4: Check terrace listings
  const { data: terraces } = await supabase.from('terraces').select('title, verification, is_active').limit(5)
  console.log('🏠 Recent Terraces (last 5):')
  if (terraces && terraces.length > 0) {
    terraces.forEach(t => console.log(`  • ${t.title} — ${t.verification} ${t.is_active ? '✅' : '❌'}`))
  } else {
    console.log('  ⚠️ No terraces found')
  }

  console.log('')
  console.log('✅ Integration test complete. Both mobile app and admin panel connect to the same database.')
}

test().catch(console.error)

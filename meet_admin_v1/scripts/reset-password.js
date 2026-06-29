const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')

// Parse .env.local manually
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
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

async function reset() {
  const employeeId = 'ADM-001'
  const newPassword = 'adi'

  const hash = await bcrypt.hash(newPassword, 12)
  console.log(`Resetting password for ${employeeId} to: ${newPassword}`)
  console.log(`New hash: ${hash}`)

  const { data, error } = await supabase
    .from('admin_users')
    .update({
      password_hash: hash,
      failed_login_count: 0,
      locked_until: null,
    })
    .eq('employee_id', employeeId)
    .select('id, employee_id, full_name, role')

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log('✅ Success! Updated user:', JSON.stringify(data, null, 2))
  console.log(`\nNow login with:`)
  console.log(`  Employee ID: ${employeeId}`)
  console.log(`  Password:    ${newPassword}`)
}

reset().catch(console.error)

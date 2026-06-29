const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')

// Parse .env.local manually (no dotenv package needed)
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
  console.error('Make sure .env.local exists in the project root with these values.')
  process.exit(1)
}

const supabase = createClient(url, key)

function isBcryptHash(str) {
  return typeof str === 'string' && str.startsWith('$2') && str.length >= 59
}

async function migrate() {
  const { data, error } = await supabase.from('admin_users').select('id, employee_id, password_hash')
  if (error) {
    console.error('Error fetching admins:', error)
    process.exit(1)
  }

  let migrated = 0
  for (const admin of data || []) {
    if (!isBcryptHash(admin.password_hash)) {
      const newHash = await bcrypt.hash(admin.password_hash, 12)
      const { error: updError } = await supabase
        .from('admin_users')
        .update({ password_hash: newHash })
        .eq('id', admin.id)
      if (updError) {
        console.error(`Failed to hash ${admin.employee_id}:`, updError)
      } else {
        console.log(`✅ Hashed password for ${admin.employee_id}`)
        migrated++
      }
    } else {
      console.log(`⏭️  Already hashed: ${admin.employee_id}`)
    }
  }

  console.log(`\nDone. ${migrated} password(s) hashed.`)
}

migrate().catch(console.error)

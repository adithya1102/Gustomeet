import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/supabase/server'
import { signAdminToken } from '@/lib/admin-auth'
import { getPermissionsForRole } from '@/lib/permissions'

function isBcryptHash(str: string): boolean {
  return typeof str === 'string' && str.startsWith('$2') && str.length >= 59
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (isBcryptHash(hash)) {
    try {
      return await bcrypt.compare(password, hash)
    } catch (err) {
      console.error('bcrypt.compare error:', err)
      return false
    }
  }
  console.warn(`Admin password is stored as plain text. Please re-hash via the API for security.`)
  return password === hash
}

export async function POST(req: NextRequest) {
  const { employeeId, password } = await req.json()

  if (!employeeId || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('employee_id', employeeId)
    .single()

  if (error || !admin) {
    console.log('Login failed: admin not found for', employeeId)
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
    return NextResponse.json({ error: 'Account locked. Try again later.' }, { status: 423 })
  }

  const valid = await verifyPassword(password, admin.password_hash)

  if (!valid) {
    const newCount = (admin.failed_login_count || 0) + 1
    const updates: Record<string, unknown> = { failed_login_count: newCount }
    if (newCount >= 5) {
      updates.locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    }
    await supabase.from('admin_users').update(updates).eq('id', admin.id)
    console.log('Login failed: password mismatch for', employeeId, 'attempt', newCount)
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  await supabase
    .from('admin_users')
    .update({ failed_login_count: 0, last_login_at: new Date().toISOString() })
    .eq('id', admin.id)

  const permissions = admin.permissions && Array.isArray(admin.permissions) && admin.permissions.length > 0
    ? admin.permissions
    : getPermissionsForRole(admin.role)

  const token = await signAdminToken({
    adminId: admin.id,
    employeeId: admin.employee_id,
    role: admin.role,
    name: admin.full_name,
    permissions,
  })

  const res = NextResponse.json({ success: true })
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 28800,
  })
  return res
}

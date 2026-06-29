import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServerClient } from '@/lib/supabase/server'
import { getPermissionsForRole, hasPermission, Permission } from '@/lib/permissions'

export async function GET() {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('admin_users')
    .select('id, employee_id, full_name, role, email, last_login_at, created_at, locked_until, is_active, permissions, date_of_birth')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const mappedData = data?.map(user => ({
    ...user,
    permissions: user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0
      ? user.permissions
      : getPermissionsForRole(user.role)
  })) || []

  return NextResponse.json({ data: mappedData })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { employee_id, full_name, email, password, role, permissions, date_of_birth } = body
    const adminId = req.headers.get('x-admin-id') || 'system'
    const adminEmployeeId = req.headers.get('x-admin-employee-id') || 'system'

    if (!employee_id || !full_name || !email || !password || !date_of_birth) {
      return NextResponse.json({ error: 'Missing required fields: employee_id, full_name, email, password, date_of_birth' }, { status: 400 })
    }

    const requesterPermissions = JSON.parse(req.headers.get('x-admin-permissions') || '[]') as Permission[]
    if (!hasPermission(requesterPermissions, 'team.manage' as Permission) && !hasPermission(requesterPermissions, 'team.admins' as Permission)) {
      return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })
    }

    const supabase = createServerClient()
    const passwordHash = await bcrypt.hash(password, 12)
    const effectivePermissions = permissions && Array.isArray(permissions) && permissions.length > 0
      ? permissions
      : getPermissionsForRole(role || 'ADMIN')

    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        employee_id,
        full_name,
        email,
        password_hash: passwordHash,
        role: role || 'ADMIN',
        date_of_birth,
        permissions: effectivePermissions,
        failed_login_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    await supabase.from('admin_audit_log').insert({
      admin_id: adminId,
      employee_id: adminEmployeeId,
      action_type: 'create_admin',
      target_type: 'admin_user',
      target_id: data.id,
      action_detail: { employee_id, role, permissions: effectivePermissions },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: { ...data, permissions: effectivePermissions }
    })
  } catch (err: any) {
    console.error('POST /api/admin/team/admins error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, full_name, email, role, is_active, permissions, password, date_of_birth } = body
    const adminId = req.headers.get('x-admin-id') || 'system'
    const adminEmployeeId = req.headers.get('x-admin-employee-id') || 'system'

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    }

    const requesterPermissions = JSON.parse(req.headers.get('x-admin-permissions') || '[]') as Permission[]
    const isSuperAdmin = requesterPermissions.includes('team.manage' as Permission) || 
                         requesterPermissions.some((p: string) => p.includes('team.manage'))

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden: only SUPER_ADMIN can edit admins' }, { status: 403 })
    }

    const supabase = createServerClient()

    // Build update object dynamically
    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (full_name !== undefined) updates.full_name = full_name
    if (email !== undefined) updates.email = email
    if (role !== undefined) {
      updates.role = role
      // If role changes and no custom permissions provided, auto-assign role defaults
      if (permissions === undefined) {
        updates.permissions = getPermissionsForRole(role)
      }
    }
    if (is_active !== undefined) updates.is_active = is_active
    if (permissions !== undefined && Array.isArray(permissions)) updates.permissions = permissions
    if (date_of_birth !== undefined) updates.date_of_birth = date_of_birth
    if (password && password.length >= 6) {
      updates.password_hash = await bcrypt.hash(password, 12)
    }

    const { data, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.from('admin_audit_log').insert({
      admin_id: adminId,
      employee_id: adminEmployeeId,
      action_type: 'update_admin',
      target_type: 'admin_user',
      target_id: id,
      action_detail: { updated_fields: Object.keys(updates).filter(k => k !== 'updated_at' && k !== 'password_hash') },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      data: { ...data, permissions: data.permissions || getPermissionsForRole(data.role) }
    })
  } catch (err: any) {
    console.error('PATCH /api/admin/team/admins error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const adminId = req.headers.get('x-admin-id') || 'system'
    const adminEmployeeId = req.headers.get('x-admin-employee-id') || 'system'

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 })
    }

    // Prevent self-deletion
    if (id === adminId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 403 })
    }

    const requesterPermissions = JSON.parse(req.headers.get('x-admin-permissions') || '[]') as Permission[]
    const isSuperAdmin = requesterPermissions.includes('team.manage' as Permission) || 
                         requesterPermissions.some((p: string) => p.includes('team.manage'))

    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden: only SUPER_ADMIN can delete admins' }, { status: 403 })
    }

    const supabase = createServerClient()

    // Get admin info before deleting for audit log
    const { data: adminData } = await supabase
      .from('admin_users')
      .select('employee_id, full_name, role')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabase.from('admin_audit_log').insert({
      admin_id: adminId,
      employee_id: adminEmployeeId,
      action_type: 'delete_admin',
      target_type: 'admin_user',
      target_id: id,
      action_detail: { deleted_admin: adminData },
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, message: 'Admin deleted successfully' })
  } catch (err: any) {
    console.error('DELETE /api/admin/team/admins error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

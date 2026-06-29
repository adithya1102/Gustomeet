import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { getPermissionsForRole } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const payload = await verifyAdminToken(token)
    const permissions = payload.permissions && payload.permissions.length > 0
      ? payload.permissions
      : getPermissionsForRole(payload.role)

    return NextResponse.json({
      admin: {
        id: payload.adminId,
        employeeId: payload.employeeId,
        role: payload.role,
        name: payload.name,
        permissions,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}

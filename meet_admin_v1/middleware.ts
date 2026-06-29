import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { hasAnyPermission, NAV_PERMISSION_MAP, API_PERMISSION_MAP } from '@/lib/permissions'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only protect admin routes
  if (!pathname.startsWith('/dashboard') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next()
  }

  // Allow login API
  if (pathname === '/api/admin/login') {
    return NextResponse.next()
  }

  const token = request.cookies.get('admin_session')?.value
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const payload = await verifyAdminToken(token)
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-admin-id', payload.adminId)
    requestHeaders.set('x-admin-employee-id', payload.employeeId)
    requestHeaders.set('x-admin-role', payload.role)
    requestHeaders.set('x-admin-name', payload.name)
    requestHeaders.set('x-admin-permissions', JSON.stringify(payload.permissions))

    // Check route permissions
    const isApi = pathname.startsWith('/api/')
    const permMap = isApi ? API_PERMISSION_MAP : NAV_PERMISSION_MAP

    const requiredPerms = Object.entries(permMap).find(([route]) =>
      pathname === route || pathname.startsWith(route + '/')
    )?.[1]

    if (requiredPerms && !hasAnyPermission(payload.permissions, requiredPerms)) {
      if (isApi) {
        return NextResponse.json({ error: 'Forbidden: insufficient permissions' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
}

import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

function getSecret() {
  return new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'fallback')
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get('admin_session')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    try {
      const { payload } = await jwtVerify(token, getSecret())
      const res = NextResponse.next()
      res.headers.set('x-admin-id', String(payload.adminId ?? ''))
      res.headers.set('x-admin-role', String(payload.role ?? ''))
      res.headers.set('x-admin-name', String(payload.name ?? ''))
      res.headers.set('x-admin-employee-id', String(payload.employeeId ?? ''))
      return res
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}

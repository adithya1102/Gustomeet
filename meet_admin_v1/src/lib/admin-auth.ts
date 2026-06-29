import { SignJWT, jwtVerify } from 'jose'

import { getPermissionsForRole, Permission } from './permissions'

export interface AdminPayload {
  adminId: string
  employeeId: string
  role: string
  name: string
  permissions: Permission[]
}

function getSecret() {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret) throw new Error('ADMIN_JWT_SECRET not set')
  return new TextEncoder().encode(secret)
}

export async function signAdminToken(payload: AdminPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

export async function verifyAdminToken(token: string): Promise<AdminPayload> {
  const { payload } = await jwtVerify(token, getSecret())
  const p = payload as unknown as AdminPayload
  if (!p.permissions || p.permissions.length === 0) {
    p.permissions = getPermissionsForRole(p.role)
  }
  return p
}

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, toZonedTime } from 'date-fns-tz'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatIST(date: string | Date, fmt = 'dd MMM yyyy, hh:mm a') {
  const d = typeof date === 'string' ? new Date(date) : date
  const zoned = toZonedTime(d, 'Asia/Kolkata')
  return format(zoned, fmt, { timeZone: 'Asia/Kolkata' })
}

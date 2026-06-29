import { supabase } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'

export function useAdminNotifications() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastEvent, setLastEvent] = useState<string | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, () => {
        toast.info('New booking received')
        setUnreadCount((c) => c + 1)
        setLastEvent('booking')
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'terraces' }, () => {
        toast.info('New listing submitted for review')
        setUnreadCount((c) => c + 1)
        setLastEvent('listing')
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'damage_reports' }, () => {
        toast.warning('New damage report submitted')
        setUnreadCount((c) => c + 1)
        setLastEvent('damage')
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const reset = useCallback(() => setUnreadCount(0), [])

  return { unreadCount, lastEvent, reset }
}

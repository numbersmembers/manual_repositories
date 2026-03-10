import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const checks: Record<string, string> = {}

  // 1. Check env vars
  checks['SUPABASE_URL'] = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'
  checks['ANON_KEY'] = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
  checks['SERVICE_KEY'] = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'

  // 2. Test service client creation
  try {
    const supabase = createServiceClient()
    checks['serviceClient'] = 'OK'

    // 3. Test DB query
    const { data, error } = await supabase.from('categories').select('id').limit(1)
    checks['dbQuery'] = error ? `ERROR: ${error.message}` : `OK (${data?.length} rows)`
  } catch (e) {
    checks['serviceClient'] = `CRASH: ${e instanceof Error ? e.message : String(e)}`
  }

  // 4. Test auth client creation
  try {
    const supabase = await createClient()
    checks['authClient'] = 'OK'

    // 5. Test session
    const { data: { session }, error } = await supabase.auth.getSession()
    checks['session'] = error ? `ERROR: ${error.message}` : session ? `OK (${session.user?.email})` : 'NO_SESSION'
  } catch (e) {
    checks['authClient'] = `CRASH: ${e instanceof Error ? e.message : String(e)}`
  }

  // 6. Test getAuthUser
  try {
    const { getAuthUser } = await import('@/lib/auth')
    const user = await getAuthUser()
    checks['getAuthUser'] = user ? `OK (${user.email}, role=${user.role}, status=${user.status})` : 'NULL'
  } catch (e) {
    checks['getAuthUser'] = `CRASH: ${e instanceof Error ? e.message : String(e)}`
  }

  return NextResponse.json(checks, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

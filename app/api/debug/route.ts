import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const checks: Record<string, string> = {}

  // 1. Check env vars
  checks['SUPABASE_URL'] = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'
  checks['ANON_KEY'] = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
  checks['SERVICE_KEY'] = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'

  // 2. List all cookie names (not values, for security)
  const allCookies = request.cookies.getAll()
  checks['cookieNames'] = allCookies.map((c) => c.name).join(', ') || 'NONE'
  checks['cookieCount'] = String(allCookies.length)

  // 3. Test auth via request.cookies (like middleware does)
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {},
        },
      }
    )
    const { data: { user }, error } = await supabase.auth.getUser()
    checks['requestCookieAuth'] = error
      ? `ERROR: ${error.message}`
      : user ? `OK (${user.email})` : 'NO_USER'
  } catch (e) {
    checks['requestCookieAuth'] = `CRASH: ${e instanceof Error ? e.message : String(e)}`
  }

  // 4. Test auth via cookies() from next/headers
  try {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    checks['nextHeadersCookieAuth'] = error
      ? `ERROR: ${error.message}`
      : session ? `OK (${session.user?.email})` : 'NO_SESSION'
  } catch (e) {
    checks['nextHeadersCookieAuth'] = `CRASH: ${e instanceof Error ? e.message : String(e)}`
  }

  // 5. Test service client DB
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase.from('categories').select('id').limit(1)
    checks['dbQuery'] = error ? `ERROR: ${error.message}` : `OK (${data?.length} rows)`
  } catch (e) {
    checks['dbQuery'] = `CRASH: ${e instanceof Error ? e.message : String(e)}`
  }

  return NextResponse.json(checks, {
    headers: { 'Cache-Control': 'no-store' },
  })
}

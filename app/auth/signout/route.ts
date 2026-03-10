import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: Request) {
  const { origin } = new URL(request.url)
  const supabase = await createClient()

  // Log logout activity using service client (bypasses RLS)
  try {
    const user = await getAuthUser()
    if (user) {
      const serviceClient = await createServiceClient()
      await serviceClient.from('activity_logs').insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.name,
        action: 'logout',
        metadata: {
          user_agent: request.headers.get('user-agent'),
        },
      })
    }
  } catch {
    // Ignore logging errors to ensure signout always completes
  }

  await supabase.auth.signOut()
  return NextResponse.redirect(`${origin}/login`)
}

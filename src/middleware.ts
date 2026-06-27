import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ['/invite', '/auth/callback'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Auth routes
  const authRoutes = ['/login', '/signup'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // If no user and trying to access protected route (except invite pages)
  if (!user && !isPublicRoute && !isAuthRoute) {
    const inviteMatch = pathname.match(/^\/invite\/(.+)/);
    if (!inviteMatch) {
      // Redirect to invite page or login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    // Allow invite pages without auth
    return supabaseResponse;
  }

  // If user is logged in, check if they've completed onboarding
  if (user) {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no profile found (shouldn't happen due to trigger, but just in case)
    if (!profile && !isPublicRoute && !pathname.startsWith('/auth')) {
      // Try to let them through to signup/login
      return supabaseResponse;
    }

    // Redirect to onboarding if not completed
    if (
      profile &&
      (!profile.session_1_start || !profile.session_2_start) &&
      !pathname.startsWith('/onboarding') &&
      !pathname.startsWith('/auth') &&
      !pathname.startsWith('/invite')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/onboarding';
      return NextResponse.redirect(url);
    }

    // Redirect to dashboard if already logged in and trying auth routes
    if (isAuthRoute && profile?.session_1_start) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip static files, Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

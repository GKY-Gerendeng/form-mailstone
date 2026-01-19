import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js proxy for handling Supabase authentication
 * - Refreshes session on every request
 * - Protects configured routes
 * - Redirects authenticated users from auth pages
 */
export async function proxy(request: NextRequest) {
  // Skip if Supabase is not configured (dev mode without env vars)
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: Refreshing the auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes configuration
  // These routes require authentication - users will be redirected to login
  const protectedRoutes = [
    "/",
    "/account",
    "/dashboard",
    "/profile",
    "/settings",
  ];
  const isProtectedRoute = protectedRoutes.some((route) => {
    // Exact match for home page
    if (route === "/") {
      return request.nextUrl.pathname === "/";
    }
    // Prefix match for other routes
    return request.nextUrl.pathname.startsWith(route);
  });

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  const authRoutes = ["/login", "/otp"];
  const isAuthRoute = authRoutes.some(
    (route) => request.nextUrl.pathname === route,
  );

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    const redirectTo = url.searchParams.get("redirect") || "/";
    url.pathname = redirectTo;
    url.searchParams.delete("redirect");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

/**
 * Configure which routes the proxy should run on
 * Excludes static files and API routes that don't need auth
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public files (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

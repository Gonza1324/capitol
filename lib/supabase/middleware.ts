import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard")
    || request.nextUrl.pathname.startsWith("/clients")
    || request.nextUrl.pathname.startsWith("/contacts")
    || request.nextUrl.pathname.startsWith("/tasks")
    || request.nextUrl.pathname.startsWith("/interactions")
    || request.nextUrl.pathname.startsWith("/calls")
    || request.nextUrl.pathname.startsWith("/calendar")
    || request.nextUrl.pathname.startsWith("/internal-calendar")
    || request.nextUrl.pathname.startsWith("/reports")
    || request.nextUrl.pathname.startsWith("/alerts")
    || request.nextUrl.pathname.startsWith("/stakeholders")
    || request.nextUrl.pathname.startsWith("/documents")
    || request.nextUrl.pathname.startsWith("/search")
    || request.nextUrl.pathname.startsWith("/notifications")
    || request.nextUrl.pathname.startsWith("/settings");

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

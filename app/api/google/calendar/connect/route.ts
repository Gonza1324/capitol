import { NextResponse, type NextRequest } from "next/server";
import { createGoogleCalendarAuthUrl, isGoogleCalendarEnabled } from "@/lib/google/calendar";
import { createClient } from "@/lib/supabase/server";

const internalRoles = ["admin", "partner_director", "analyst", "assistant"];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile?.role || !internalRoles.includes(profile.role)) {
    return NextResponse.redirect(new URL("/settings?toast=error", request.url));
  }

  if (!isGoogleCalendarEnabled()) {
    return NextResponse.redirect(new URL("/settings?toast=google_calendar_not_configured", request.url));
  }

  const state = crypto.randomUUID();
  const url = createGoogleCalendarAuthUrl({ state, origin: request.nextUrl.origin });
  const response = NextResponse.redirect(url);
  response.cookies.set("google_calendar_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    maxAge: 60 * 10,
    path: "/"
  });
  return response;
}

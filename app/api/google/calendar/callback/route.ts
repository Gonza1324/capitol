import { NextResponse, type NextRequest } from "next/server";
import { exchangeGoogleCode, fetchGoogleUserInfo, getTokenExpiresAt } from "@/lib/google/calendar";
import { createClient } from "@/lib/supabase/server";

const internalRoles = ["admin", "partner_director", "analyst", "assistant"];

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get("google_calendar_oauth_state")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/settings?toast=error", request.url));
  }

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

  try {
    const tokens = await exchangeGoogleCode(code, request.nextUrl.origin);
    const userInfo = await fetchGoogleUserInfo(tokens.access_token);
    const { data: existingConnection } = await supabase
      .from("google_calendar_connections")
      .select("refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error } = await supabase
      .from("google_calendar_connections")
      .upsert({
        user_id: user.id,
        google_account_email: userInfo?.email || null,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || existingConnection?.refresh_token || null,
        token_type: tokens.token_type || null,
        scope: tokens.scope || null,
        expires_at: getTokenExpiresAt(tokens.expires_in),
        connected_at: new Date().toISOString(),
        deleted_at: null
      }, { onConflict: "user_id" });

    if (error) throw error;

    await supabase.from("activity_log").insert({
      actor_id: user.id,
      action: "google_calendar_connected",
      entity_type: "google_calendar_connection",
      entity_id: user.id,
      metadata: { google_account_email: userInfo?.email || null }
    });

    const response = NextResponse.redirect(new URL("/settings?toast=google_calendar_connected", request.url));
    response.cookies.delete("google_calendar_oauth_state");
    return response;
  } catch {
    return NextResponse.redirect(new URL("/settings?toast=error", request.url));
  }
}

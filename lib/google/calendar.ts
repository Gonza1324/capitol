import type { Json } from "@/lib/supabase/types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_CALENDAR_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

export const googleCalendarScopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly"
];

export type GoogleCalendarConnection = {
  id: string;
  user_id: string;
  google_account_email: string | null;
  access_token: string;
  refresh_token: string | null;
  token_type: string | null;
  scope: string | null;
  expires_at: string | null;
  last_synced_at: string | null;
};

type GoogleTokenResponse = {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
};

type GoogleUserInfo = {
  email?: string;
};

export type GoogleCalendarEvent = {
  id: string;
  status?: string;
  htmlLink?: string;
  hangoutLink?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  organizer?: { email?: string };
  attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string }>;
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
  };
};

type GoogleEventsResponse = {
  items?: GoogleCalendarEvent[];
};

export type NormalizedCalendarEvent = {
  google_event_id: string;
  calendar_id: string;
  summary: string | null;
  description: string | null;
  location: string | null;
  start_at: string | null;
  end_at: string | null;
  start_date: string | null;
  end_date: string | null;
  html_link: string | null;
  hangout_link: string | null;
  meet_url: string | null;
  status: string | null;
  organizer_email: string | null;
  attendees: Json;
  raw: Json;
};

export function isGoogleCalendarEnabled() {
  return process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ENABLED === "true"
    && Boolean(process.env.GOOGLE_CLIENT_ID)
    && Boolean(process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleRedirectUri(origin?: string) {
  return process.env.GOOGLE_REDIRECT_URI || (origin ? `${origin}/api/google/calendar/callback` : "");
}

export function createGoogleCalendarAuthUrl({ state, origin }: { state: string; origin?: string }) {
  const redirectUri = getGoogleRedirectUri(origin);
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: googleCalendarScopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string, origin?: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: getGoogleRedirectUri(origin),
      grant_type: "authorization_code"
    })
  });

  if (!response.ok) {
    throw new Error("No pudimos conectar Google Calendar.");
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

export async function refreshGoogleAccessToken(refreshToken: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      grant_type: "refresh_token"
    })
  });

  if (!response.ok) {
    throw new Error("No pudimos renovar la conexion con Google Calendar.");
  }

  return response.json() as Promise<GoogleTokenResponse>;
}

export async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) return null;
  return response.json() as Promise<GoogleUserInfo>;
}

export async function fetchGoogleCalendarEvents(accessToken: string, { timeMin, timeMax }: { timeMin: Date; timeMax: Date }) {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString()
  });

  const response = await fetch(`${GOOGLE_CALENDAR_EVENTS_URL}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    throw new Error("No pudimos leer los eventos de Google Calendar.");
  }

  const payload = await response.json() as GoogleEventsResponse;
  return payload.items || [];
}

export function getTokenExpiresAt(expiresIn?: number) {
  const seconds = expiresIn || 3600;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export function shouldRefreshToken(expiresAt?: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now() + 60_000;
}

export function normalizeGoogleEvent(event: GoogleCalendarEvent): NormalizedCalendarEvent {
  const meetUrl = event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri || event.hangoutLink || null;

  return {
    google_event_id: event.id,
    calendar_id: "primary",
    summary: event.summary || null,
    description: event.description || null,
    location: event.location || null,
    start_at: event.start?.dateTime || null,
    end_at: event.end?.dateTime || null,
    start_date: event.start?.date || null,
    end_date: event.end?.date || null,
    html_link: event.htmlLink || null,
    hangout_link: event.hangoutLink || null,
    meet_url: meetUrl,
    status: event.status || null,
    organizer_email: event.organizer?.email || null,
    attendees: (event.attendees || []) as Json,
    raw: event as unknown as Json
  };
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "admin" | "partner_director" | "analyst" | "assistant" | "external_client";
export type ClientStatus = "active" | "prospect" | "paused" | "former" | "potential" | "archived";
export type ClientType = "company" | "chamber" | "ngo" | "person" | "public_agency" | "embassy" | "association" | "other";
export type TaskStatus = "pending" | "in_progress" | "in_review" | "blocked" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type ClientRow = {
  id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  status: ClientStatus;
  client_type: ClientType;
  description: string | null;
  strategic_profile: string | null;
  start_date: string | null;
  end_date: string | null;
  confidentiality_level: "standard" | "confidential" | "restricted";
  website: string | null;
  drive_url: string | null;
  general_notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ContactRow = {
  id: string;
  client_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  title: string | null;
  email: string | null;
  whatsapp: string | null;
  linkedin_url: string | null;
  area: string | null;
  relationship_role: string | null;
  is_primary: boolean;
  is_active: boolean;
  birthday: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  source: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  recurrence_interval: number;
  recurrence_ends_at: string | null;
  recurrence_count: number | null;
  parent_recurring_id: string | null;
  generated_from_recurring_id: string | null;
  next_occurrence_at: string | null;
  comments: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type GoogleCalendarConnectionRow = {
  id: string;
  user_id: string;
  google_account_email: string | null;
  access_token: string;
  refresh_token: string | null;
  token_type: string | null;
  scope: string | null;
  expires_at: string | null;
  connected_at: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type GoogleCalendarEventRow = {
  id: string;
  user_id: string;
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
  client_id: string | null;
  interaction_id: string | null;
  synced_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type InternalCalendarEventRow = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  event_type: string;
  status: string;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  timezone: string;
  location: string | null;
  meeting_url: string | null;
  client_id: string | null;
  contact_id: string | null;
  stakeholder_id: string | null;
  task_id: string | null;
  interaction_id: string | null;
  created_by: string | null;
  assigned_to: string | null;
  visibility: string;
  source: string;
  external_provider: string | null;
  external_event_id: string | null;
  external_calendar_id: string | null;
  sync_status: string;
  last_synced_at: string | null;
  recurrence_rule: string | null;
  is_recurring: boolean;
  recurrence_interval: number;
  recurrence_ends_at: string | null;
  recurrence_count: number | null;
  parent_recurring_id: string | null;
  generated_from_recurring_id: string | null;
  next_occurrence_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      clients: {
        Row: ClientRow;
        Insert: Partial<Omit<ClientRow, "id" | "created_at" | "updated_at">> & { id?: string; name: string; created_at?: string; updated_at?: string };
        Update: Partial<ClientRow>;
        Relationships: [];
      };
      contacts: {
        Row: ContactRow;
        Insert: Partial<Omit<ContactRow, "id" | "created_at" | "updated_at">> & { id?: string; client_id: string; first_name: string; last_name: string; full_name: string; created_at?: string; updated_at?: string };
        Update: Partial<ContactRow>;
        Relationships: [];
      };
      tasks: {
        Row: TaskRow;
        Insert: Partial<Omit<TaskRow, "id" | "created_at" | "updated_at">> & { id?: string; title: string; created_at?: string; updated_at?: string };
        Update: Partial<TaskRow>;
        Relationships: [];
      };
      alerts: {
        Row: { id: string; title: string; sent_at: string | null };
        Insert: { id?: string; title: string; sent_at?: string | null };
        Update: { id?: string; title?: string; sent_at?: string | null };
        Relationships: [];
      };
      reports: {
        Row: { id: string; title: string; sent_at: string | null };
        Insert: { id?: string; title: string; sent_at?: string | null };
        Update: { id?: string; title?: string; sent_at?: string | null };
        Relationships: [];
      };
      interactions: {
        Row: { id: string; title: string; interaction_date: string | null };
        Insert: { id?: string; title: string; interaction_date?: string | null };
        Update: { id?: string; title?: string; interaction_date?: string | null };
        Relationships: [];
      };
      google_calendar_connections: {
        Row: GoogleCalendarConnectionRow;
        Insert: Partial<Omit<GoogleCalendarConnectionRow, "id" | "created_at" | "updated_at" | "connected_at">> & { id?: string; user_id: string; access_token: string; created_at?: string; updated_at?: string; connected_at?: string };
        Update: Partial<GoogleCalendarConnectionRow>;
        Relationships: [];
      };
      google_calendar_events: {
        Row: GoogleCalendarEventRow;
        Insert: Partial<Omit<GoogleCalendarEventRow, "id" | "created_at" | "updated_at" | "synced_at" | "calendar_id" | "attendees" | "raw">> & { id?: string; user_id: string; google_event_id: string; calendar_id?: string; attendees?: Json; raw?: Json; created_at?: string; updated_at?: string; synced_at?: string };
        Update: Partial<GoogleCalendarEventRow>;
        Relationships: [];
      };
      internal_calendar_events: {
        Row: InternalCalendarEventRow;
        Insert: Partial<Omit<InternalCalendarEventRow, "id" | "created_at" | "updated_at" | "timezone" | "visibility" | "source" | "sync_status">> & { id?: string; title: string; start_at: string; timezone?: string; visibility?: string; source?: string; sync_status?: string; created_at?: string; updated_at?: string };
        Update: Partial<InternalCalendarEventRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: { Args: Record<PropertyKey, never>; Returns: UserRole };
      is_internal_user: { Args: Record<PropertyKey, never>; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

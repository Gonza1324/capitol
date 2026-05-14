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
  comments: string | null;
  created_by: string | null;
  updated_by: string | null;
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

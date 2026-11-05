export type UserRole = "trainer" | "client";
export type ClientStatus = "active" | "paused" | "archived";
export type SessionType = "personal" | "group" | "online";
export type SessionStatus = "attended" | "missed" | "cancelled" | "late";
export type PhotoLabel = "front" | "side" | "back" | "other";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  created_at: string;
};

export type TrainerSettings = {
  trainer_id: string;
  business_name: string;
  logo_path: string | null;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  trainer_id: string;
  profile_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  height_cm: number | null;
  goal: string | null;
  start_date: string;
  status: ClientStatus;
  notes: string | null;
  consent_health_data: boolean;
  consent_at: string | null;
  created_at: string;
};

export type Session = {
  id: string;
  client_id: string;
  trainer_id: string;
  session_date: string;
  start_time: string;
  duration_min: number;
  type: SessionType;
  status: SessionStatus;
  notes: string | null;
  created_at: string;
};

export type Measurement = {
  id: string;
  client_id: string;
  measured_on: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  arm_cm: number | null;
  thigh_cm: number | null;
  notes: string | null;
  created_at: string;
};

export type ProgressPhoto = {
  id: string;
  client_id: string;
  taken_on: string;
  storage_path: string;
  label: PhotoLabel;
  created_at: string;
};

export type WorkoutLog = {
  id: string;
  client_id: string;
  logged_on: string;
  exercise: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  notes: string | null;
  created_at: string;
};

export type LabResult = {
  id: string;
  client_id: string;
  tested_on: string;
  b12: string | null;
  vitamin_d: string | null;
  hemogram: string | null;
  hemoglobin: string | null;
  homocysteine: string | null;
  c_reactive_protein: string | null;
  serum_creatinine: string | null;
  serum_ferritin: string | null;
  urea: string | null;
  uric_acid: string | null;
  calcium: string | null;
  electrolytes: string | null;
  lipids: string | null;
  fasting_sugar: string | null;
  t3_t4_tsh: string | null;
  notes: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at"> & { created_at?: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      trainer_settings: {
        Row: TrainerSettings;
        Insert: Omit<TrainerSettings, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<TrainerSettings>;
        Relationships: [];
      };
      clients: {
        Row: Client;
        Insert: Partial<Client> &
          Pick<Client, "trainer_id" | "full_name" | "email">;
        Update: Partial<Client>;
        Relationships: [];
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Session>;
        Relationships: [];
      };
      measurements: {
        Row: Measurement;
        Insert: Omit<Measurement, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Measurement>;
        Relationships: [];
      };
      progress_photos: {
        Row: ProgressPhoto;
        Insert: Omit<ProgressPhoto, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<ProgressPhoto>;
        Relationships: [];
      };
      workout_logs: {
        Row: WorkoutLog;
        Insert: Omit<WorkoutLog, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<WorkoutLog>;
        Relationships: [];
      };
      lab_results: {
        Row: LabResult;
        Insert: Omit<LabResult, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<LabResult>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_trainer: { Args: Record<string, never>; Returns: boolean };
      owns_client: { Args: { p_client_id: string }; Returns: boolean };
      is_own_client_row: { Args: { p_client_id: string }; Returns: boolean };
      grant_own_health_consent: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: {
      user_role: UserRole;
      client_status: ClientStatus;
      session_type: SessionType;
      session_status: SessionStatus;
      photo_label: PhotoLabel;
    };
    CompositeTypes: Record<string, never>;
  };
};

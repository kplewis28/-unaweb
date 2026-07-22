export type ApplicationStatus = "pending" | "approved" | "rejected" | "paid" | "expired";

export interface Retreat {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  total_spots: number;
  price_cents: number;
  currency: string;
  is_open: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  retreat_id: string;
  name: string;
  email: string;
  country: string | null;
  profession: string | null;
  why_attend: string | null;
  how_heard: string | null;
  social_media: string | null;
  phone: string | null;
  q_draw: string | null;
  q_work_intersection: string | null;
  q_responsible_participation: string | null;
  org_connection: string | null;
  travel_availability: string | null;
  investment_comfort: string | null;
  num_attendees: number;
  status: ApplicationStatus;
  access_code: string | null;
  access_code_expires_at: string | null;
  access_code_email_sent: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  retreat?: Retreat;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  interest: string | null;
  message: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      retreats: {
        Row: Retreat;
        Insert: Omit<Retreat, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Retreat, "id" | "created_at">>;
      };
      applications: {
        Row: Application;
        Insert: Omit<
          Application,
          "id" | "created_at" | "updated_at" | "retreat"
        >;
        Update: Partial<Omit<Application, "id" | "created_at" | "retreat">>;
      };
    };
  };
}

import type {
  Client,
  ClientStatus,
  Session,
} from "@/lib/supabase/database.types";

export type ClientOption = Pick<Client, "id" | "full_name" | "status">;

export type SessionWithClient = Session & {
  client_name: string;
  client_status: ClientStatus;
};

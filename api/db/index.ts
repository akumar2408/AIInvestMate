import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const url = process.env.SUPABASE_DB_URL; // e.g. postgresql://user:pass@host:6543/db
export const hasDB = !!url;

export const db = hasDB ? drizzle(postgres(url!, { ssl: "prefer", max: 1 })) : null;
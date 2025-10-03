import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const url = process.env.SUPABASE_DB_URL; // postgresql://...:6543/... ?sslmode=require
export const hasDB = !!url;

// force SSL + tiny pool for serverless
export const db = hasDB
  ? drizzle(postgres(url!, { ssl: "require", max: 1 }))
  : null;

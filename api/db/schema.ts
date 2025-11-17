import { pgTable, text, numeric, timestamp, varchar } from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: varchar("date", { length: 16 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  amount: numeric("amount").notNull(), // store as numeric in DB; cast to number in app
  account: varchar("account", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // YYYY-MM
  category: varchar("category", { length: 64 }).notNull(),
  limit: numeric("limit").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  target: numeric("target").notNull(),
  current: numeric("current").notNull(),
  deadline: varchar("deadline", { length: 16 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  incomeRange: varchar("income_range", { length: 32 }).notNull(),
  goalFocus: varchar("goal_focus", { length: 64 }).notNull(),
  riskComfort: varchar("risk_comfort", { length: 16 }).notNull(),
  experience: varchar("experience", { length: 32 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiLogs = pgTable("ai_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  month: varchar("month", { length: 7 }).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
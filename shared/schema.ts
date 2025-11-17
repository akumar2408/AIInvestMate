import { relations, sql } from "drizzle-orm";
import {
  boolean,
  decimal,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  plan: varchar("plan").notNull().default("free"), // 'free' | 'pro' | 'premium'
  status: varchar("status").notNull().default("active"), // 'active' | 'canceled' | 'past_due'
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  renewsAt: timestamp("renews_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  riskTolerance: varchar("risk_tolerance"), // 'low' | 'medium' | 'high'
  currency: varchar("currency").notNull().default("USD"),
  goalsText: text("goals_text"),
  twoFAEnabled: boolean("two_fa_enabled").default(false),
  twoFASecret: text("two_fa_secret"), // encrypted
  backupCodes: text("backup_codes").array(), // encrypted
});

export const securitySettings = pgTable("security_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  loginAlerts: boolean("login_alerts").default(true),
  trustedOnly: boolean("trusted_only").default(false),
});

export const bankAccounts = pgTable("bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  plaidItemId: varchar("plaid_item_id"),
  mask: varchar("mask"), // last 4 digits
  institution: varchar("institution"),
  type: varchar("type").notNull(), // 'checking' | 'savings' | 'credit' | 'loan'
  name: varchar("name").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).default("0"),
  autoSync: boolean("auto_sync").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const investments = pgTable("investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  symbol: varchar("symbol").notNull(),
  name: varchar("name"),
  quantity: decimal("quantity", { precision: 16, scale: 8 }).default("0"),
  costBasis: decimal("cost_basis", { precision: 12, scale: 2 }).default("0"),
  accountId: varchar("account_id"),
  type: varchar("type").notNull(), // 'stock' | 'etf' | 'crypto' | 'mutual_fund'
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: varchar("account_id").references(() => bankAccounts.id),
  date: timestamp("date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category").notNull(),
  merchant: varchar("merchant"),
  notes: text("notes"),
  direction: varchar("direction").notNull(), // 'income' | 'expense' | 'transfer'
  createdAt: timestamp("created_at").defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: varchar("category").notNull(),
  monthlyCap: decimal("monthly_cap", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  target: decimal("target", { precision: 12, scale: 2 }).notNull(),
  current: decimal("current", { precision: 12, scale: 2 }).default("0"),
  targetDate: timestamp("target_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  period: varchar("period").notNull(), // 'M2025-08', 'Q2025-Q3', 'Y2025'
  summary: text("summary").notNull(), // AI narrative
  metricsJson: jsonb("metrics_json"), // Structured metrics data
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories and subcategories
export const categories = pgTable(
  "categories",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    name: varchar("name").notNull(),
    parentId: varchar("parent_id"),
    color: varchar("color"), // For UI display
    icon: varchar("icon"), // Lucide icon name
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    parentFk: foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "categories_parent_fk",
    }).onDelete("set null"),
  })
);

// Recurring transaction rules
export const recurringRules = pgTable("recurring_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  merchant: varchar("merchant").notNull(),
  category: varchar("category"),
  direction: varchar("direction").notNull(), // 'income', 'expense', 'transfer'
  cadence: varchar("cadence").notNull(), // 'daily', 'weekly', 'monthly'
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  nextRunAt: timestamp("next_run_at").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Auto-categorization rules
export const categoryRules = pgTable("category_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  merchantRegex: varchar("merchant_regex").notNull(),
  amountMin: decimal("amount_min", { precision: 12, scale: 2 }),
  amountMax: decimal("amount_max", { precision: 12, scale: 2 }),
  categoryId: varchar("category_id").references(() => categories.id),
  priority: integer("priority").default(0), // Higher priority rules apply first
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trustedDevices = pgTable("trusted_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  deviceId: varchar("device_id").notNull(), // hashed
  label: varchar("label"),
  lastUsed: timestamp("last_used").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  subscription: one(subscriptions),
  profile: one(userProfiles),
  securitySettings: one(securitySettings),
  bankAccounts: many(bankAccounts),
  investments: many(investments),
  transactions: many(transactions),
  budgets: many(budgets),
  goals: many(goals),
  reports: many(reports),
  trustedDevices: many(trustedDevices),
  recurringRules: many(recurringRules),
  categoryRules: many(categoryRules),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const securitySettingsRelations = relations(securitySettings, ({ one }) => ({
  user: one(users, {
    fields: [securitySettings.userId],
    references: [users.id],
  }),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [bankAccounts.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  user: one(users, {
    fields: [investments.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  account: one(bankAccounts, {
    fields: [transactions.accountId],
    references: [bankAccounts.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
}));

export const trustedDevicesRelations = relations(trustedDevices, ({ one }) => ({
  user: one(users, {
    fields: [trustedDevices.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  categoryRules: many(categoryRules),
}));

export const recurringRulesRelations = relations(recurringRules, ({ one }) => ({
  user: one(users, {
    fields: [recurringRules.userId],
    references: [users.id],
  }),
}));

export const categoryRulesRelations = relations(categoryRules, ({ one }) => ({
  user: one(users, {
    fields: [categoryRules.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [categoryRules.categoryId],
    references: [categories.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertRecurringRuleSchema = createInsertSchema(recurringRules).omit({
  id: true,
  createdAt: true,
});

export const insertCategoryRuleSchema = createInsertSchema(categoryRules).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type SecuritySettings = typeof securitySettings.$inferSelect;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type TrustedDevice = typeof trustedDevices.$inferSelect;

export type InsertSubscription = typeof subscriptions.$inferInsert;
export type InsertUserProfile = typeof userProfiles.$inferInsert;
export type InsertBankAccount = typeof bankAccounts.$inferInsert;
export type InsertInvestment = typeof investments.$inferInsert;
export type InsertTransaction = typeof transactions.$inferInsert;
export type InsertBudget = typeof budgets.$inferInsert;
export type InsertGoal = typeof goals.$inferInsert;
export type InsertReport = typeof reports.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export type RecurringRule = typeof recurringRules.$inferSelect;
export type InsertRecurringRule = typeof recurringRules.$inferInsert;

export type CategoryRule = typeof categoryRules.$inferSelect;
export type InsertCategoryRule = typeof categoryRules.$inferInsert;

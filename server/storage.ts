import {
  users,
  subscriptions,
  userProfiles,
  securitySettings,
  bankAccounts,
  investments,
  transactions,
  budgets,
  goals,
  reports,
  trustedDevices,
  categories,
  recurringRules,
  categoryRules,
  type User,
  type UpsertUser,
  type Subscription,
  type UserProfile,
  type BankAccount,
  type Investment,
  type Transaction,
  type Budget,
  type Goal,
  type Report,
  type Category,
  type RecurringRule,
  type CategoryRule,
  type InsertSubscription,
  type InsertUserProfile,
  type InsertBankAccount,
  type InsertInvestment,
  type InsertTransaction,
  type InsertBudget,
  type InsertGoal,
  type InsertReport,
  type InsertCategory,
  type InsertRecurringRule,
  type InsertCategoryRule,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeCustomerId(userId: string, customerId: string): Promise<void>;
  
  // Subscription operations
  getUserSubscription(userId: string): Promise<Subscription | undefined>;
  updateUserSubscription(stripeCustomerId: string, data: Partial<InsertSubscription>): Promise<void>;
  
  // Profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(data: InsertUserProfile): Promise<UserProfile>;
  
  // Bank account operations
  getBankAccounts(userId: string): Promise<BankAccount[]>;
  createBankAccount(data: InsertBankAccount): Promise<BankAccount>;
  
  // Investment operations
  getInvestments(userId: string): Promise<Investment[]>;
  createInvestment(data: InsertInvestment): Promise<Investment>;
  
  // Transaction operations
  getTransactions(userId: string, filters: { from?: string; to?: string; category?: string; limit?: number }): Promise<Transaction[]>;
  createTransaction(data: InsertTransaction): Promise<Transaction>;
  
  // Budget operations
  getBudgets(userId: string): Promise<Budget[]>;
  createBudget(data: InsertBudget): Promise<Budget>;
  
  // Goal operations
  getGoals(userId: string): Promise<Goal[]>;
  createGoal(data: InsertGoal): Promise<Goal>;
  
  // Report operations
  getReports(userId: string, period?: string): Promise<Report[]>;
  createReport(data: InsertReport): Promise<Report>;
  
  // Dashboard operations
  getDashboardSummary(userId: string): Promise<any>;

  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(data: InsertCategory): Promise<Category>;

  // Recurring rule operations
  getRecurringRules(userId: string): Promise<RecurringRule[]>;
  createRecurringRule(data: InsertRecurringRule): Promise<RecurringRule>;
  updateRecurringRule(id: string, data: Partial<InsertRecurringRule>): Promise<RecurringRule>;
  deleteRecurringRule(id: string): Promise<void>;

  // Category rule operations
  getCategoryRules(userId: string): Promise<CategoryRule[]>;
  createCategoryRule(data: InsertCategoryRule): Promise<CategoryRule>;
  deleteCategoryRule(id: string): Promise<void>;

  // Auto-categorization
  applyCategoryRules(userId: string, merchant: string, amount: number): Promise<string | null>;
  
  // Utility operations
  seedMockData(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return (Array.isArray(result) ? result[0] : (result as any).rows[0]) as User;
  }

  async updateUserStripeCustomerId(userId: string, customerId: string): Promise<void> {
    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId));
  }

  // Subscription operations
  async getUserSubscription(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async updateUserSubscription(stripeCustomerId: string, data: Partial<InsertSubscription>): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, stripeCustomerId));
    
    if (user) {
      await db
        .insert(subscriptions)
        .values({
          userId: user.id,
          ...data,
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: data,
        });
    }
  }

  // Profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertUserProfile(data: InsertUserProfile): Promise<UserProfile> {
    const profileResult = await db
      .insert(userProfiles)
      .values(data)
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: data,
      })
      .returning();
    return (Array.isArray(profileResult) ? profileResult[0] : (profileResult as any).rows[0]) as UserProfile;
  }

  // Bank account operations
  async getBankAccounts(userId: string): Promise<BankAccount[]> {
    return await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, userId))
      .orderBy(desc(bankAccounts.createdAt));
  }

  async createBankAccount(data: InsertBankAccount): Promise<BankAccount> {
    const result = await db.insert(bankAccounts).values(data).returning();
    return (Array.isArray(result) ? result[0] : (result as any).rows[0]) as BankAccount;
  }

  // Investment operations
  async getInvestments(userId: string): Promise<Investment[]> {
    return await db
      .select()
      .from(investments)
      .where(eq(investments.userId, userId))
      .orderBy(desc(investments.createdAt));
  }

  async createInvestment(data: InsertInvestment): Promise<Investment> {
    const result = await db.insert(investments).values(data).returning();
    return (Array.isArray(result) ? result[0] : (result as any).rows[0]) as Investment;
  }

  // Transaction operations
  async getTransactions(userId: string, filters: { from?: string; to?: string; category?: string; limit?: number }): Promise<Transaction[]> {
    const conditions = [eq(transactions.userId, userId)];

    if (filters.from) {
      conditions.push(gte(transactions.date, new Date(filters.from)));
    }

    if (filters.to) {
      conditions.push(lte(transactions.date, new Date(filters.to)));
    }

    if (filters.category) {
      conditions.push(eq(transactions.category, filters.category));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    const baseQuery = db
      .select()
      .from(transactions)
      .where(whereClause)
      .orderBy(desc(transactions.date));

    if (filters.limit) {
      return await baseQuery.limit(filters.limit);
    }

    return await baseQuery;
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(data).returning();
    return (Array.isArray(result) ? result[0] : (result as any).rows[0]) as Transaction;
  }

  // Budget operations
  async getBudgets(userId: string): Promise<Budget[]> {
    return await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, userId))
      .orderBy(desc(budgets.createdAt));
  }

  async createBudget(data: InsertBudget): Promise<Budget> {
    const result = await db.insert(budgets).values(data).returning();
    return (Array.isArray(result) ? result[0] : (result as any).rows[0]) as Budget;
  }

  // Goal operations
  async getGoals(userId: string): Promise<Goal[]> {
    return await db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt));
  }

  async createGoal(data: InsertGoal): Promise<Goal> {
    const result = await db.insert(goals).values(data).returning();
    return (Array.isArray(result) ? result[0] : (result as any).rows[0]) as Goal;
  }

  // Report operations
  async getReports(userId: string, period?: string): Promise<Report[]> {
    const conditions = [eq(reports.userId, userId)];

    if (period) {
      conditions.push(eq(reports.period, period));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];

    return await db
      .select()
      .from(reports)
      .where(whereClause)
      .orderBy(desc(reports.createdAt));
  }

  async createReport(data: InsertReport): Promise<Report> {
    const result = await db.insert(reports).values(data).returning();
    return (Array.isArray(result) ? result[0] : (result as any).rows[0]) as Report;
  }

  // Dashboard operations
  async getDashboardSummary(userId: string): Promise<any> {
    // Get account balances
    const accounts = await this.getBankAccounts(userId);
    const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance ?? 0), 0);

    // Get current month transactions
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTransactions = await this.getTransactions(userId, { from: `${currentMonth}-01` });
    
    const monthlySpending = monthlyTransactions
      .filter((t) => t.direction === "expense")
      .reduce((sum, t) => sum + Math.abs(Number(t.amount ?? 0)), 0);

    // Get investments
    const investments = await this.getInvestments(userId);
    const investmentValue = investments.reduce((sum, inv) => {
      return sum + Number(inv.quantity ?? 0) * Number(inv.costBasis ?? 0);
    }, 0);

    // Get goals progress
    const goals = await this.getGoals(userId);
    const completedGoals = goals.filter((goal) => Number(goal.current ?? 0) >= Number(goal.target ?? 0));
    const savingsProgress = goals.length > 0
      ?
          (goals.reduce(
            (sum, goal) => sum + Math.min(Number(goal.current ?? 0) / Math.max(Number(goal.target ?? 0), 1), 1),
            0,
          ) /
            goals.length) *
          100
      : 0;

    return {
      totalBalance,
      monthlySpending,
      investmentValue,
      savingsProgress,
      totalTransactions: monthlyTransactions.length,
      totalInvestments: investments.length,
      totalGoals: goals.length,
      completedGoals: completedGoals.length,
      recentTransactions: monthlyTransactions.slice(0, 5),
    };
  }

  // Utility operations
  async seedMockData(userId: string): Promise<void> {
    // Create mock bank accounts
    const mockAccounts = [
      {
        userId,
        name: "Main Checking",
        type: "checking",
        institution: "Chase Bank",
        mask: "1234",
        balance: "12580.45",
        autoSync: true,
      },
      {
        userId,
        name: "Savings Account",
        type: "savings",
        institution: "Wells Fargo",
        mask: "5678",
        balance: "8500.20",
        autoSync: true,
      },
      {
        userId,
        name: "Credit Card",
        type: "credit",
        institution: "Capital One",
        mask: "9012",
        balance: "-1250.80",
        autoSync: true,
      },
      {
        userId,
        name: "Investment Account",
        type: "checking",
        institution: "Fidelity",
        mask: "3456",
        balance: "25000.00",
        autoSync: false,
      },
    ];

    for (const account of mockAccounts) {
      await this.createBankAccount(account);
    }

    // Create mock transactions
    const mockTransactions = [
      {
        userId,
        date: new Date(),
        amount: "-127.45",
        category: "Groceries",
        merchant: "Whole Foods Market",
        direction: "expense",
        notes: "Weekly grocery shopping",
      },
      {
        userId,
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        amount: "4200.00",
        category: "Income",
        merchant: "Acme Corp",
        direction: "income",
        notes: "Salary deposit",
      },
      {
        userId,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        amount: "-45.20",
        category: "Transportation",
        merchant: "Shell Gas Station",
        direction: "expense",
      },
      {
        userId,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        amount: "-15.99",
        category: "Entertainment",
        merchant: "Netflix",
        direction: "expense",
      },
      {
        userId,
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        amount: "-6.85",
        category: "Dining",
        merchant: "Starbucks",
        direction: "expense",
      },
      {
        userId,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        amount: "-89.50",
        category: "Shopping",
        merchant: "Amazon",
        direction: "expense",
      },
      {
        userId,
        date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        amount: "-1200.00",
        category: "Bills",
        merchant: "Rent Payment",
        direction: "expense",
      },
      {
        userId,
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        amount: "-85.30",
        category: "Utilities",
        merchant: "Electric Company",
        direction: "expense",
      },
    ];

    for (const transaction of mockTransactions) {
      await this.createTransaction(transaction);
    }

    // Create mock budgets
    const mockBudgets = [
      { userId, category: "Groceries", monthlyCap: "500.00" },
      { userId, category: "Dining", monthlyCap: "300.00" },
      { userId, category: "Transportation", monthlyCap: "200.00" },
      { userId, category: "Entertainment", monthlyCap: "150.00" },
      { userId, category: "Shopping", monthlyCap: "400.00" },
    ];

    for (const budget of mockBudgets) {
      await this.createBudget(budget);
    }

    // Create mock goals
    const mockGoals = [
      {
        userId,
        name: "Emergency Fund",
        target: "10000.00",
        current: "7800.00",
        targetDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000),
      },
      {
        userId,
        name: "Vacation Fund",
        target: "3500.00",
        current: "1200.00",
        targetDate: new Date(Date.now() + 240 * 24 * 60 * 60 * 1000),
      },
      {
        userId,
        name: "New Laptop",
        target: "2000.00",
        current: "1800.00",
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const goal of mockGoals) {
      await this.createGoal(goal);
    }

    // Create mock investments
    const mockInvestments = [
      {
        userId,
        symbol: "AAPL",
        name: "Apple Inc.",
        quantity: "25.5",
        costBasis: "180.50",
        type: "stock",
      },
      {
        userId,
        symbol: "VOO",
        name: "Vanguard S&P 500 ETF",
        quantity: "35.2",
        costBasis: "420.75",
        type: "etf",
      },
      {
        userId,
        symbol: "TSLA",
        name: "Tesla Inc.",
        quantity: "12.8",
        costBasis: "245.30",
        type: "stock",
      },
      {
        userId,
        symbol: "BTC",
        name: "Bitcoin",
        quantity: "0.15",
        costBasis: "45000.00",
        type: "crypto",
      },
    ];

    for (const investment of mockInvestments) {
      await this.createInvestment(investment);
    }

    // Create default categories
    const defaultCategories = [
      { name: "Food & Dining", color: "#ef4444", icon: "UtensilsCrossed" },
      { name: "Transportation", color: "#3b82f6", icon: "Car" },
      { name: "Shopping", color: "#8b5cf6", icon: "ShoppingBag" },
      { name: "Entertainment", color: "#f59e0b", icon: "Film" },
      { name: "Bills & Utilities", color: "#10b981", icon: "Receipt" },
      { name: "Healthcare", color: "#ec4899", icon: "Heart" },
      { name: "Education", color: "#6366f1", icon: "GraduationCap" },
      { name: "Travel", color: "#06b6d4", icon: "Plane" },
      { name: "Investment", color: "#84cc16", icon: "TrendingUp" },
      { name: "Income", color: "#22c55e", icon: "DollarSign" },
      { name: "Other", color: "#6b7280", icon: "MoreHorizontal" },
    ];

    for (const category of defaultCategories) {
      await this.createCategory(category);
    }

    // Create default recurring rules
    const defaultRecurringRules = [
      {
        userId,
        name: "Monthly Rent",
        amount: "1200.00",
        merchant: "Property Management Co",
        category: "Bills & Utilities",
        direction: "expense",
        cadence: "monthly",
        startDate: new Date(),
        nextRunAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        userId,
        name: "Salary",
        amount: "4500.00",
        merchant: "Employer Inc",
        category: "Income",
        direction: "income",
        cadence: "monthly",
        startDate: new Date(),
        nextRunAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ];

    for (const rule of defaultRecurringRules) {
      await this.createRecurringRule(rule);
    }

    // Create default category rules
    const defaultCategoryRules: InsertCategoryRule[] = [
      {
        userId,
        merchantRegex: "starbucks|coffee|cafe",
        categoryId: null, // Will reference Food & Dining
        priority: 100,
        isActive: true,
      },
      {
        userId,
        merchantRegex: "uber|lyft|taxi",
        categoryId: null, // Will reference Transportation
        priority: 100,
        isActive: true,
      },
      {
        userId,
        merchantRegex: "amazon|walmart|target",
        categoryId: null, // Will reference Shopping
        priority: 80,
        isActive: true,
      },
    ];

    // Get category IDs for rules
    const categories = await this.getCategories();
    const foodCategory = categories.find(c => c.name === "Food & Dining");
    const transportCategory = categories.find(c => c.name === "Transportation");
    const shoppingCategory = categories.find(c => c.name === "Shopping");

    if (foodCategory) defaultCategoryRules[0].categoryId = foodCategory.id;
    if (transportCategory) defaultCategoryRules[1].categoryId = transportCategory.id;
    if (shoppingCategory) defaultCategoryRules[2].categoryId = shoppingCategory.id;

    for (const rule of defaultCategoryRules) {
      await this.createCategoryRule(rule);
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .orderBy(categories.name);
  }

  async createCategory(data: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(data).returning();
    return (Array.isArray(result) ? result[0] : (result as any).rows[0]) as Category;
  }

  // Recurring rule operations
  async getRecurringRules(userId: string): Promise<RecurringRule[]> {
    return await db
      .select()
      .from(recurringRules)
      .where(eq(recurringRules.userId, userId))
      .orderBy(desc(recurringRules.createdAt));
  }

  async createRecurringRule(data: InsertRecurringRule): Promise<RecurringRule> {
    const result = await db.insert(recurringRules).values(data).returning();
    return (Array.isArray(result) ? result[0] : (result as any).rows[0]) as RecurringRule;
  }

  async updateRecurringRule(id: string, data: Partial<InsertRecurringRule>): Promise<RecurringRule> {
    const result = await db
      .update(recurringRules)
      .set(data)
      .where(eq(recurringRules.id, id))
      .returning();
    return (Array.isArray(result) ? result[0] : (result as any).rows[0]) as RecurringRule;
  }

  async deleteRecurringRule(id: string): Promise<void> {
    await db
      .delete(recurringRules)
      .where(eq(recurringRules.id, id));
  }

  // Category rule operations
  async getCategoryRules(userId: string): Promise<CategoryRule[]> {
    return await db
      .select()
      .from(categoryRules)
      .where(eq(categoryRules.userId, userId))
      .orderBy(desc(categoryRules.priority));
  }

  async createCategoryRule(data: InsertCategoryRule): Promise<CategoryRule> {
    const result = await db.insert(categoryRules).values(data).returning();
    return (Array.isArray(result) ? result[0] : (result as any).rows[0]) as CategoryRule;
  }

  async deleteCategoryRule(id: string): Promise<void> {
    await db
      .delete(categoryRules)
      .where(eq(categoryRules.id, id));
  }

  // Auto-categorization
  async applyCategoryRules(userId: string, merchant: string, amount: number): Promise<string | null> {
    const rules = await this.getCategoryRules(userId);
    
    for (const rule of rules) {
      if (!rule.isActive) continue;
      
      // Check merchant regex
      const merchantRegex = new RegExp(rule.merchantRegex, 'i');
      if (!merchantRegex.test(merchant)) continue;
      
      // Check amount range if specified
      if (rule.amountMin && amount < parseFloat(rule.amountMin)) continue;
      if (rule.amountMax && amount > parseFloat(rule.amountMax)) continue;
      
      // Get category name if categoryId is set
      if (rule.categoryId) {
        const [category] = await db
          .select()
          .from(categories)
          .where(eq(categories.id, rule.categoryId))
          .limit(1);
        return category?.name || null;
      }
    }
    
    return null;
  }
}

export const storage = new DatabaseStorage();

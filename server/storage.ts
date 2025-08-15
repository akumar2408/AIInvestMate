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
  type InsertSubscription,
  type InsertUserProfile,
  type InsertBankAccount,
  type InsertInvestment,
  type InsertTransaction,
  type InsertBudget,
  type InsertGoal,
  type InsertReport,
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
    const [user] = await db
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
    return user;
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
    const [profile] = await db
      .insert(userProfiles)
      .values(data)
      .onConflictDoUpdate({
        target: userProfiles.userId,
        set: data,
      })
      .returning();
    return profile;
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
    const [account] = await db
      .insert(bankAccounts)
      .values(data)
      .returning();
    return account;
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
    const [investment] = await db
      .insert(investments)
      .values(data)
      .returning();
    return investment;
  }

  // Transaction operations
  async getTransactions(userId: string, filters: { from?: string; to?: string; category?: string; limit?: number }): Promise<Transaction[]> {
    let query = db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));

    if (filters.from) {
      query = query.where(and(eq(transactions.userId, userId), gte(transactions.date, new Date(filters.from))));
    }

    if (filters.to) {
      query = query.where(and(eq(transactions.userId, userId), lte(transactions.date, new Date(filters.to))));
    }

    if (filters.category) {
      query = query.where(and(eq(transactions.userId, userId), eq(transactions.category, filters.category)));
    }

    query = query.orderBy(desc(transactions.date));

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    return await query;
  }

  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db
      .insert(transactions)
      .values(data)
      .returning();
    return transaction;
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
    const [budget] = await db
      .insert(budgets)
      .values(data)
      .returning();
    return budget;
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
    const [goal] = await db
      .insert(goals)
      .values(data)
      .returning();
    return goal;
  }

  // Report operations
  async getReports(userId: string, period?: string): Promise<Report[]> {
    let query = db
      .select()
      .from(reports)
      .where(eq(reports.userId, userId));

    if (period) {
      query = query.where(and(eq(reports.userId, userId), eq(reports.period, period)));
    }

    return await query.orderBy(desc(reports.createdAt));
  }

  async createReport(data: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(data)
      .returning();
    return report;
  }

  // Dashboard operations
  async getDashboardSummary(userId: string): Promise<any> {
    // Get account balances
    const accounts = await this.getBankAccounts(userId);
    const totalBalance = accounts.reduce((sum, account) => sum + parseFloat(account.balance), 0);

    // Get current month transactions
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTransactions = await this.getTransactions(userId, { from: `${currentMonth}-01` });
    
    const monthlySpending = monthlyTransactions
      .filter(t => t.direction === 'expense')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

    // Get investments
    const investments = await this.getInvestments(userId);
    const investmentValue = investments.reduce((sum, inv) => {
      return sum + (parseFloat(inv.quantity) * parseFloat(inv.costBasis));
    }, 0);

    // Get goals progress
    const goals = await this.getGoals(userId);
    const completedGoals = goals.filter(goal => parseFloat(goal.current) >= parseFloat(goal.target));
    const savingsProgress = goals.length > 0 
      ? goals.reduce((sum, goal) => sum + Math.min(parseFloat(goal.current) / parseFloat(goal.target), 1), 0) / goals.length * 100 
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
  }
}

export const storage = new DatabaseStorage();

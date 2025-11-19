import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertTransactionSchema,
  insertBudgetSchema,
  insertGoalSchema,
  insertInvestmentSchema,
  insertReportSchema,
  insertCategorySchema,
  insertRecurringRuleSchema,
  insertCategoryRuleSchema
} from "@shared/schema";
import type {
  InsertTransaction,
  InsertBudget,
  InsertGoal,
  InsertInvestment,
  InsertReport,
  InsertCategory,
  InsertRecurringRule,
  InsertCategoryRule
} from "@shared/schema";
import { z } from "zod";
import { aiService } from "./services/openai";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not provided - subscription features will be disabled');
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-07-30.basil" as Stripe.LatestApiVersion,
    })
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user subscription and profile
      const subscription = await storage.getUserSubscription(userId);
      const profile = await storage.getUserProfile(userId);
      
      res.json({
        ...user,
        subscription,
        profile
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Subscription routes
  if (stripe) {
    app.post('/api/billing/checkout', isAuthenticated, async (req: any, res) => {
      try {
        const { plan } = req.body;
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        
        if (!user?.email) {
          return res.status(400).json({ message: "User email required" });
        }

        let customerId = user.stripeCustomerId;
        
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim(),
          });
          customerId = customer.id;
          await storage.updateUserStripeCustomerId(userId, customerId);
        }

        // Use price_data for demo purposes since we don't have actual Stripe product IDs
        const planPrices = {
          pro: { amount: 999, name: 'Pro Plan' }, // $9.99
          premium: { amount: 1999, name: 'Premium Plan' }, // $19.99
        };

        const selectedPlan = planPrices[plan as keyof typeof planPrices];
        if (!selectedPlan) {
          return res.status(400).json({ message: "Invalid plan selected" });
        }

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: selectedPlan.name,
                  description: `${selectedPlan.name} - AI Investmate`,
                },
                unit_amount: selectedPlan.amount,
                recurring: {
                  interval: 'month',
                },
              },
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: `${req.protocol}://${req.get('host')}/dashboard?success=true`,
          cancel_url: `${req.protocol}://${req.get('host')}/subscribe?canceled=true`,
        });

        res.json({ url: session.url });
      } catch (error: any) {
        console.error("Stripe checkout error:", error);
        res.status(500).json({ message: error.message });
      }
    });

    app.post('/api/billing/portal', isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        
        if (!user?.stripeCustomerId) {
          return res.status(400).json({ message: "No subscription found" });
        }

        const session = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: `${req.protocol}://${req.get('host')}/profile`,
        });

        res.json({ url: session.url });
      } catch (error: any) {
        console.error("Billing portal error:", error);
        res.status(500).json({ message: error.message });
      }
    });

    app.post('/api/billing/webhook', async (req, res) => {
      const sig = req.headers['stripe-signature'];
      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET!);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      try {
        switch (event.type) {
          case 'customer.subscription.created':
          case 'customer.subscription.updated':
            const subscription = event.data.object;
            await storage.updateUserSubscription(subscription.customer as string, {
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              plan: subscription.items.data[0]?.price?.nickname?.toLowerCase() || 'pro',
            });
            break;
          case 'customer.subscription.deleted':
            const deletedSubscription = event.data.object;
            await storage.updateUserSubscription(deletedSubscription.customer as string, {
              status: 'canceled',
            });
            break;
        }
        
        res.json({ received: true });
      } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
      }
    });
  }

  // Bank account routes (mocked)
  app.get('/api/banks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getBankAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      res.status(500).json({ message: "Failed to fetch bank accounts" });
    }
  });

  app.post('/api/banks/mock/seed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.seedMockData(userId);
      res.json({ message: "Mock data seeded successfully" });
    } catch (error) {
      console.error("Error seeding mock data:", error);
      res.status(500).json({ message: "Failed to seed mock data" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { from, to, category } = req.query;
      const transactions = await storage.getTransactions(userId, { from, to, category });
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData: InsertTransaction = insertTransactionSchema.parse({
        ...req.body,
        userId,
      });
      
      // Auto-categorize with AI if category not provided
      if (!validatedData.category && validatedData.merchant) {
        const categorization = await aiService.categorizeTransaction(
          validatedData.merchant,
          Number(validatedData.amount),
          validatedData.direction
        );
        validatedData.category = categorization.category;
      }
      
      const transaction = await storage.createTransaction(validatedData);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Budget routes
  app.get('/api/budgets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const budgets = await storage.getBudgets(userId);
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.post('/api/budgets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData: InsertBudget = insertBudgetSchema.parse({
        ...req.body,
        userId,
      });
      const budget = await storage.createBudget(validatedData);
      res.json(budget);
    } catch (error) {
      console.error("Error creating budget:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create budget" });
    }
  });

  // Goal routes
  app.get('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  app.post('/api/goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData: InsertGoal = insertGoalSchema.parse({
        ...req.body,
        userId,
      });
      const goal = await storage.createGoal(validatedData);
      res.json(goal);
    } catch (error) {
      console.error("Error creating goal:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  // Investment routes
  app.get('/api/investments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const investments = await storage.getInvestments(userId);
      res.json(investments);
    } catch (error) {
      console.error("Error fetching investments:", error);
      res.status(500).json({ message: "Failed to fetch investments" });
    }
  });

  app.post('/api/investments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData: InsertInvestment = insertInvestmentSchema.parse({
        ...req.body,
        userId,
      });
      const investment = await storage.createInvestment(validatedData);
      res.json(investment);
    } catch (error) {
      console.error("Error creating investment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create investment" });
    }
  });

  // Reports routes
  app.post('/api/reports/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { period } = req.query;
      
      // Get user's financial data
      const transactions = await storage.getTransactions(userId, {});
      const investments = await storage.getInvestments(userId);
      const budgets = await storage.getBudgets(userId);
      const goals = await storage.getGoals(userId);
      
      // Generate AI report
      const summary = await aiService.generateReport({
        period: period as string,
        transactions,
        investments,
        budgets,
        goals,
      });
      
      const validatedData: InsertReport = insertReportSchema.parse({
        userId,
        period: period as string,
        summary,
      });
      
      const report = await storage.createReport(validatedData);
      res.json(report);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  app.get('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { period } = req.query;
      const reports = await storage.getReports(userId, period as string);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  // AI routes
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, contextFlags } = req.body;
      
      // Get user context for AI
      const userProfile = await storage.getUserProfile(userId);
      const recentTransactions = await storage.getTransactions(userId, { limit: 10 });
      const budgets = await storage.getBudgets(userId);
      const goals = await storage.getGoals(userId);
      
      const response = await aiService.chatWithCoach({
        message,
        contextFlags,
        userProfile,
        recentTransactions,
        budgets,
        goals,
      });
      
      res.json({ response });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process AI chat" });
    }
  });

  app.post('/api/ai/categorize', isAuthenticated, async (req: any, res) => {
    try {
      const { merchant, amount, direction } = req.body;
      const categorization = await aiService.categorizeTransaction(
        merchant,
        Number(amount),
        direction
      );
      res.json(categorization);
    } catch (error) {
      console.error("Error categorizing transaction:", error);
      res.status(500).json({ message: "Failed to categorize transaction" });
    }
  });

  app.post('/api/ai/whatif', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { deltaInvestments, savingsChange } = req.body;
      
      const investments = await storage.getInvestments(userId);
      const analysis = await aiService.whatIfAnalysis({
        currentInvestments: investments,
        deltaInvestments,
        savingsChange,
      });
      
      res.json(analysis);
    } catch (error) {
      console.error("Error in what-if analysis:", error);
      res.status(500).json({ message: "Failed to perform what-if analysis" });
    }
  });

  // Dashboard summary route
  app.get('/api/dashboard/summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const summary = await storage.getDashboardSummary(userId);
      res.json(summary);
    } catch (error) {
      console.error("Error fetching dashboard summary:", error);
      res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
  });

  // Categories routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData: InsertCategory = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Recurring rules routes
  app.get('/api/recurring-rules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rules = await storage.getRecurringRules(userId);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching recurring rules:", error);
      res.status(500).json({ message: "Failed to fetch recurring rules" });
    }
  });

  app.post('/api/recurring-rules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData: InsertRecurringRule = insertRecurringRuleSchema.parse({
        ...req.body,
        userId,
      });
      const rule = await storage.createRecurringRule(validatedData);
      res.json(rule);
    } catch (error) {
      console.error("Error creating recurring rule:", error);
      res.status(500).json({ message: "Failed to create recurring rule" });
    }
  });

  app.put('/api/recurring-rules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const validatedData: Partial<InsertRecurringRule> = insertRecurringRuleSchema.partial().parse(req.body);
      const rule = await storage.updateRecurringRule(id, validatedData);
      res.json(rule);
    } catch (error) {
      console.error("Error updating recurring rule:", error);
      res.status(500).json({ message: "Failed to update recurring rule" });
    }
  });

  app.delete('/api/recurring-rules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRecurringRule(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting recurring rule:", error);
      res.status(500).json({ message: "Failed to delete recurring rule" });
    }
  });

  // Category rules routes
  app.get('/api/category-rules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const rules = await storage.getCategoryRules(userId);
      res.json(rules);
    } catch (error) {
      console.error("Error fetching category rules:", error);
      res.status(500).json({ message: "Failed to fetch category rules" });
    }
  });

  app.post('/api/category-rules', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData: InsertCategoryRule = insertCategoryRuleSchema.parse({
        ...req.body,
        userId,
      }) as InsertCategoryRule;
      const rule = await storage.createCategoryRule(validatedData);
      res.json(rule);
    } catch (error) {
      console.error("Error creating category rule:", error);
      res.status(500).json({ message: "Failed to create category rule" });
    }
  });

  app.delete('/api/category-rules/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCategoryRule(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category rule:", error);
      res.status(500).json({ message: "Failed to delete category rule" });
    }
  });

  // Enhanced transaction route with auto-categorization
  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let transactionData: InsertTransaction = insertTransactionSchema.parse({
        ...req.body,
        userId,
        date: new Date(req.body.date),
      });

      // Auto-categorize if no category provided
      if (!transactionData.category && transactionData.merchant) {
        const suggestedCategory = await storage.applyCategoryRules(
          userId,
          transactionData.merchant,
          Math.abs(parseFloat(transactionData.amount))
        );
        if (suggestedCategory) {
          transactionData.category = suggestedCategory;
        }
      }

      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

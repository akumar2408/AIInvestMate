import { useAuth } from "./useAuth";

export type Plan = "free" | "pro" | "premium";

const PLAN_FEATURES: Record<Plan, string[]> = {
  free: ["basic_tracking", "manual_categorization", "basic_budgets", "basic_goals", "csv_export"],
  pro: ["ai_insights", "auto_categorization", "expense_forecasting", "advanced_budgets", "monthly_reports"],
  premium: ["portfolio_analysis", "whatif_simulator", "tax_estimator", "fraud_alerts", "priority_support"],
};

export function usePlan() {
  const { user } = useAuth();
  const plan = (user?.subscription?.plan ?? "free") as Plan;

  const hasFeature = (feature: string): boolean => {
    const tiers: Plan[] = ["free", "pro", "premium"];
    const planIndex = tiers.indexOf(plan);
    const unlocked = tiers.slice(0, planIndex + 1).flatMap((tier) => PLAN_FEATURES[tier]);
    return unlocked.includes(feature);
  };

  const requiresPlan = (requiredPlan: Plan): boolean => {
    const hierarchy: Record<Plan, number> = { free: 0, pro: 1, premium: 2 };
    return hierarchy[plan] >= hierarchy[requiredPlan];
  };

  return {
    plan,
    hasFeature,
    requiresPlan,
    isPro: plan === "pro" || plan === "premium",
    isPremium: plan === "premium",
  };
}

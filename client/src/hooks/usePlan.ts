import { useAuth } from "./useAuth";

export type Plan = 'free' | 'pro' | 'premium';

export function usePlan() {
  const { user } = useAuth();
  
  const plan: Plan = user?.subscription?.plan || 'free';
  
  const hasFeature = (feature: string): boolean => {
    const features = {
      free: ['basic_tracking', 'manual_categorization', 'basic_budgets', 'basic_goals', 'csv_export'],
      pro: ['ai_insights', 'auto_categorization', 'expense_forecasting', 'advanced_budgets', 'monthly_reports'],
      premium: ['portfolio_analysis', 'whatif_simulator', 'tax_estimator', 'fraud_alerts', 'priority_support']
    };
    
    const allFeatures = [
      ...features.free,
      ...(plan === 'pro' || plan === 'premium' ? features.pro : []),
      ...(plan === 'premium' ? features.premium : [])
    ];
    
    return allFeatures.includes(feature);
  };
  
  const requiresPlan = (requiredPlan: Plan): boolean => {
    const planHierarchy = { free: 0, pro: 1, premium: 2 };
    return planHierarchy[plan] >= planHierarchy[requiredPlan];
  };
  
  return {
    plan,
    hasFeature,
    requiresPlan,
    isPro: plan === 'pro' || plan === 'premium',
    isPremium: plan === 'premium'
  };
}

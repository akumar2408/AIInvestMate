import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

export default function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
  const handleUpgrade = (plan: string) => {
    window.location.href = `/subscribe?plan=${plan}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white text-center">
            Upgrade Your Plan
          </DialogTitle>
          <p className="text-slate-400 text-center">
            {feature 
              ? `Unlock ${feature} and more with Pro or Premium` 
              : "Unlock advanced AI insights and premium features"
            }
          </p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Pro Plan */}
          <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-500/50 rounded-xl p-6 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-emerald-600 text-white">Most Popular</Badge>
            </div>
            
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-6 h-6 text-emerald-400 mr-2" />
                <h3 className="text-xl font-semibold text-white">Pro</h3>
              </div>
              <div className="text-3xl font-bold text-white">
                $9.99<span className="text-base text-slate-400">/month</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                AI-powered insights
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                Auto-categorization
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                Expense forecasting
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                Advanced budgets & goals
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                Monthly AI reports
              </li>
            </ul>
            
            <Button 
              data-testid="button-upgrade-pro-modal"
              onClick={() => handleUpgrade('pro')}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Upgrade to Pro
            </Button>
          </div>

          {/* Premium Plan */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-2">
                <Crown className="w-6 h-6 text-purple-400 mr-2" />
                <h3 className="text-xl font-semibold text-white">Premium</h3>
              </div>
              <div className="text-3xl font-bold text-white">
                $19.99<span className="text-base text-slate-400">/month</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                Everything in Pro
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                Portfolio analysis
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                What-if simulator
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                Tax estimator
              </li>
              <li className="flex items-center text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                Priority support
              </li>
            </ul>
            
            <Button 
              data-testid="button-upgrade-premium-modal"
              onClick={() => handleUpgrade('premium')}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

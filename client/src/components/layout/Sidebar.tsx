import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Wallet, 
  Target, 
  PieChart, 
  FileText, 
  Crown,
  X,
  TrendingUp,
  Bot
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Budgets", href: "/budgets", icon: Wallet },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Investments", href: "/investments", icon: PieChart },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Automation", href: "/automation", icon: Bot },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { plan } = usePlan();

  const isActive = (href: string) => {
    if (href === "/dashboard" && location === "/") return true;
    return location === href;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-800/50 backdrop-blur-sm border-r border-slate-700/50 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">AI Investmate</span>
            </div>
            <Button
              data-testid="button-close-sidebar"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <button
                  key={item.name}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                  onClick={() => {
                    setLocation(item.href);
                    onClose();
                  }}
                  className={cn(
                    "w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    active
                      ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-300"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  )}
                >
                  <Icon className={cn(
                    "mr-3 w-5 h-5",
                    active ? "text-emerald-400" : "text-slate-400"
                  )} />
                  {item.name}
                </button>
              );
            })}
            
            {/* Upgrade Button */}
            {plan === 'free' && (
              <button
                data-testid="nav-upgrade"
                onClick={() => {
                  setLocation("/subscribe");
                  onClose();
                }}
                className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-slate-300 hover:bg-slate-700/50 hover:text-white"
              >
                <Crown className="mr-3 w-5 h-5 text-amber-400" />
                Upgrade to Pro
              </button>
            )}
          </nav>
          
          {/* User Profile */}
          <div className="flex-shrink-0 px-4 pb-4">
            <div className="bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <img 
                  data-testid="img-user-avatar"
                  src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
                  alt="User avatar" 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p data-testid="text-user-name" className="text-sm font-medium text-white truncate">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.email?.split('@')[0] || 'User'}
                  </p>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                    {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Menu, 
  Search, 
  Bell, 
  User,
  LogOut
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  onMenuClick: () => void;
}

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case "/":
    case "/dashboard":
      return "Dashboard";
    case "/transactions":
      return "Transactions";
    case "/budgets":
      return "Budgets";
    case "/goals":
      return "Goals";
    case "/investments":
      return "Investments";
    case "/reports":
      return "Reports";
    case "/subscribe":
      return "Subscription";
    case "/profile":
      return "Profile";
    default:
      return "Dashboard";
  }
};

export default function TopBar({ onMenuClick }: TopBarProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  
  const pageTitle = getPageTitle(location);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-slate-800/30 backdrop-blur-sm border-b border-slate-700/50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <Button
            data-testid="button-menu"
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 data-testid="text-page-title" className="text-2xl font-bold text-white">
            {pageTitle}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:block relative">
            <Input
              data-testid="input-search"
              type="text"
              placeholder="Search transactions..."
              className="bg-slate-700/50 border-slate-600/50 rounded-lg px-4 py-2 pl-10 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          </div>
          
          {/* Notifications */}
          <Button
            data-testid="button-notifications"
            variant="ghost"
            size="sm"
            className="relative text-slate-400 hover:text-white"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full"></span>
          </Button>
          
          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="button-profile-menu"
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                <User className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-slate-800 border-slate-700"
            >
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-white">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem 
                data-testid="menu-profile"
                onClick={() => setLocation("/profile")}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem 
                data-testid="menu-logout"
                onClick={handleLogout}
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

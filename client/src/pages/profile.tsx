import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { usePlan } from "@/hooks/usePlan";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Settings, Shield, CreditCard, Bell } from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { plan } = usePlan();
  
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currency: "USD",
    riskTolerance: "medium",
  });
  
  const [securitySettings, setSecuritySettings] = useState({
    twoFAEnabled: false,
    loginAlerts: true,
    trustedOnly: false,
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    budgetAlerts: true,
    goalReminders: true,
    weeklyReports: true,
    investmentAlerts: true,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }

    if (user) {
      setPersonalInfo({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        currency: user.profile?.currency || "USD",
        riskTolerance: user.profile?.riskTolerance || "medium",
      });
      
      setSecuritySettings({
        twoFAEnabled: user.profile?.twoFAEnabled || false,
        loginAlerts: true,
        trustedOnly: false,
      });
    }
  }, [user, isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSavePersonalInfo = () => {
    toast({
      title: "Success",
      description: "Personal information updated successfully",
    });
  };

  const handleSaveSecuritySettings = () => {
    toast({
      title: "Success",
      description: "Security settings updated successfully",
    });
  };

  const handleSaveNotificationSettings = () => {
    toast({
      title: "Success",
      description: "Notification preferences updated successfully",
    });
  };

  const handleManageBilling = () => {
    window.location.href = "/subscribe";
  };

  return (
    <AppLayout>
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
            <p className="text-slate-400">Manage your account preferences and security</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800/40 border border-slate-700/50">
            <TabsTrigger 
              data-testid="tab-personal"
              value="personal" 
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <User className="w-4 h-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger 
              data-testid="tab-security"
              value="security"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger 
              data-testid="tab-notifications"
              value="notifications"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              data-testid="tab-billing"
              value="billing"
              className="data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal" className="space-y-6">
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-300">First Name</Label>
                    <Input
                      data-testid="input-first-name"
                      id="firstName"
                      value={personalInfo.firstName}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-300">Last Name</Label>
                    <Input
                      data-testid="input-last-name"
                      id="lastName"
                      value={personalInfo.lastName}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      className="bg-slate-700/50 border-slate-600/50 text-white"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                  <Input
                    data-testid="input-email"
                    id="email"
                    type="email"
                    value={personalInfo.email}
                    disabled
                    className="bg-slate-700/30 border-slate-600/50 text-slate-400"
                  />
                  <p className="text-xs text-slate-400">Email cannot be changed</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-slate-300">Currency</Label>
                    <Select value={personalInfo.currency} onValueChange={(value) => setPersonalInfo(prev => ({ ...prev, currency: value }))}>
                      <SelectTrigger data-testid="select-currency" className="bg-slate-700/50 border-slate-600/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CAD">CAD (C$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="riskTolerance" className="text-slate-300">Risk Tolerance</Label>
                    <Select value={personalInfo.riskTolerance} onValueChange={(value) => setPersonalInfo(prev => ({ ...prev, riskTolerance: value }))}>
                      <SelectTrigger data-testid="select-risk-tolerance" className="bg-slate-700/50 border-slate-600/50 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Conservative</SelectItem>
                        <SelectItem value="medium">Moderate</SelectItem>
                        <SelectItem value="high">Aggressive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  data-testid="button-save-personal"
                  onClick={handleSavePersonalInfo}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-slate-700/50">
                  <div className="space-y-1">
                    <h3 className="text-white font-medium">Two-Factor Authentication</h3>
                    <p className="text-slate-400 text-sm">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    data-testid="switch-2fa"
                    checked={securitySettings.twoFAEnabled}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFAEnabled: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between py-4 border-b border-slate-700/50">
                  <div className="space-y-1">
                    <h3 className="text-white font-medium">Login Alerts</h3>
                    <p className="text-slate-400 text-sm">Get notified when someone signs into your account</p>
                  </div>
                  <Switch
                    data-testid="switch-login-alerts"
                    checked={securitySettings.loginAlerts}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, loginAlerts: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <h3 className="text-white font-medium">Trusted Devices Only</h3>
                    <p className="text-slate-400 text-sm">Only allow access from trusted devices</p>
                  </div>
                  <Switch
                    data-testid="switch-trusted-only"
                    checked={securitySettings.trustedOnly}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, trustedOnly: checked }))}
                  />
                </div>
                
                <Button 
                  data-testid="button-save-security"
                  onClick={handleSaveSecuritySettings}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-slate-700/50">
                  <div className="space-y-1">
                    <h3 className="text-white font-medium">Budget Alerts</h3>
                    <p className="text-slate-400 text-sm">Get notified when you approach budget limits</p>
                  </div>
                  <Switch
                    data-testid="switch-budget-alerts"
                    checked={notificationSettings.budgetAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, budgetAlerts: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between py-4 border-b border-slate-700/50">
                  <div className="space-y-1">
                    <h3 className="text-white font-medium">Goal Reminders</h3>
                    <p className="text-slate-400 text-sm">Receive reminders about your financial goals</p>
                  </div>
                  <Switch
                    data-testid="switch-goal-reminders"
                    checked={notificationSettings.goalReminders}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, goalReminders: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between py-4 border-b border-slate-700/50">
                  <div className="space-y-1">
                    <h3 className="text-white font-medium">Weekly Reports</h3>
                    <p className="text-slate-400 text-sm">Get weekly spending summaries via email</p>
                  </div>
                  <Switch
                    data-testid="switch-weekly-reports"
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, weeklyReports: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <h3 className="text-white font-medium">Investment Alerts</h3>
                    <p className="text-slate-400 text-sm">Notifications about significant portfolio changes</p>
                  </div>
                  <Switch
                    data-testid="switch-investment-alerts"
                    checked={notificationSettings.investmentAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, investmentAlerts: checked }))}
                  />
                </div>
                
                <Button 
                  data-testid="button-save-notifications"
                  onClick={handleSaveNotificationSettings}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Settings */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="bg-slate-800/40 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Billing & Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-slate-700/50">
                  <div className="space-y-1">
                    <h3 className="text-white font-medium">Current Plan</h3>
                    <p className="text-slate-400 text-sm">
                      You are currently on the {plan.charAt(0).toUpperCase() + plan.slice(1)} plan
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  <Button 
                    data-testid="button-manage-billing"
                    onClick={handleManageBilling}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Manage Subscription
                  </Button>
                  
                  {plan === 'free' && (
                    <p className="text-slate-400 text-sm">
                      Upgrade to Pro or Premium to unlock advanced AI features and unlimited access.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </AppLayout>
  );
}

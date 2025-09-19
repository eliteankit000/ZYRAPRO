import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DashboardContentSkeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/dashboard/sidebar";
import AITools from "@/components/dashboard/ai-tools";
import AutomationTools from "@/components/dashboard/automation-tools";
import Campaigns from "@/components/dashboard/campaigns";
import GrowthDashboard from "@/components/dashboard/growth-dashboard";
import Settings from "@/components/dashboard/settings";
import Profile from "@/components/dashboard/profile";
import NotificationCenter from "@/components/dashboard/notification-center";
import { useAuth } from "@/lib/auth";
import { useDashboard, useSkeletonLoader, useConnectionStatus } from "@/hooks/useDashboard";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Zap, TrendingUp, ShoppingCart, Eye, RotateCcw, Plus, Menu, User, LogOut, Settings as SettingsIcon } from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle logout
  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  

  // Real-time dashboard data
  const {
    dashboardData,
    formattedStats,
    isLoading,
    isInitialized,
    trackToolAccess,
    logActivity,
    updateUsageStats,
    lastUpdate,
    isTrackingTool,
  } = useDashboard();

  // Skeleton loader with delay
  const showSkeleton = useSkeletonLoader(isLoading, 300);

  // Connection status monitoring
  const { isOnline } = useConnectionStatus();

  


  // Handle responsive behavior - close sidebar on mobile by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize(); // Check initial size
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate stats from real-time data with icons
  const stats = formattedStats.map((stat, index) => {
    const iconMap = {
      TrendingUp: <TrendingUp className="w-6 h-6" />,
      ShoppingCart: <ShoppingCart className="w-6 h-6" />,
      Eye: <Eye className="w-6 h-6" />,
      RotateCcw: <RotateCcw className="w-6 h-6" />,
    };
    return {
      ...stat,
      icon: iconMap[stat.icon as keyof typeof iconMap] || <TrendingUp className="w-6 h-6" />,
    };
  });

  // Quick actions with optimistic UI updates
  const handleToolNavigation = async (toolName: string, displayName: string) => {
    // Optimistic UI update - navigate immediately
    setActiveTab(toolName);
    
    // Track tool access in the background
    trackToolAccess(toolName);
    
    // Log activity
    logActivity(
      "tool_navigation",
      `Navigated to ${displayName}`,
      toolName,
      { timestamp: new Date().toISOString(), optimistic: true }
    );
    
    // Update usage stats based on tool type
    if (toolName === "ai-tools") {
      updateUsageStats("aiGenerationsUsed", 0); // Just tracking access, not usage
    } else if (toolName === "automate") {
      updateUsageStats("automationActionsUsed", 0);
    } else if (toolName === "campaigns") {
      updateUsageStats("campaignsUsed", 0);
    }
  };

  const quickActions = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "AI Product Generator",
      description: "Generate compelling product descriptions in seconds",
      action: () => handleToolNavigation("ai-tools", "AI Tools"),
      primary: true,
      toolName: "ai-tools",
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Automation Tools", 
      description: "Streamline bulk operations and intelligent optimizations",
      action: () => handleToolNavigation("automate", "Automation Tools"),
      primary: false,
      toolName: "automate",
    },
    {
      icon: <ShoppingCart className="w-5 h-5" />,
      title: "AI Campaigns",
      description: "Automated email & SMS growth engine with AI targeting",
      action: () => handleToolNavigation("campaigns", "AI Campaigns"),
      primary: false,
      toolName: "campaigns",
    },
  ];

  // Format real-time activities
  const activities = dashboardData?.activityLogs?.map((log) => {
    const iconMap = {
      "tool_accessed": <Zap className="w-5 h-5 text-primary" />,
      "tool_navigation": <TrendingUp className="w-5 h-5 text-chart-2" />,
      "user_login": <ShoppingCart className="w-5 h-5 text-chart-3" />,
      "generated_product": <Zap className="w-5 h-5 text-primary" />,
      "optimized_seo": <TrendingUp className="w-5 h-5 text-chart-2" />,
      "sent_campaign": <ShoppingCart className="w-5 h-5 text-chart-3" />,
    };

    // Format time ago
    const timeAgo = (dateString: string) => {
      const now = new Date();
      const activityTime = new Date(dateString);
      const diffMs = now.getTime() - activityTime.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} minutes ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hours ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    };

    return {
      icon: iconMap[log.action as keyof typeof iconMap] || <Zap className="w-5 h-5 text-primary" />,
      description: log.description,
      time: timeAgo(log.createdAt),
      id: log.id,
    };
  }) || [
    // Fallback activities if no real data
    {
      icon: <Zap className="w-5 h-5 text-primary" />,
      description: "Dashboard initialized with real-time data",
      time: "Just now",
      id: "fallback-1",
    },
  ];

  const getPageTitle = () => {
    const titles = {
      overview: { title: "Dashboard", subtitle: "Welcome back! Here's your store overview." },
      "ai-tools": { title: "AI Tools", subtitle: "AI-powered content generation and optimization hub" },
      "automate": { title: "Automation Tools", subtitle: "Streamline your workflow with powerful automation features" },
      campaigns: { title: "AI Email & SMS Growth Engine", subtitle: "Automate customer communications with intelligent campaigns" },
      products: { title: "Products", subtitle: "Manage your product catalog" },
      profile: { title: "Profile", subtitle: "Manage your account and subscription" },
      settings: { title: "Settings", subtitle: "Configure your account and integrations" },
    };
    return titles[activeTab as keyof typeof titles] || titles.overview;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "ai-tools":
        return <AITools />;
      case "automate":
        return <AutomationTools />;
      case "campaigns":
        return <Campaigns />;
      case "products":
        return (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2" data-testid="text-products-title">Product Management</h3>
            <p className="text-muted-foreground mb-6">Manage and optimize your product catalog</p>
            <Button className="gradient-button" data-testid="button-sync-shopify">
              <RotateCcw className="w-4 h-4 mr-2" />
              Sync from Shopify
            </Button>
          </div>
        );
      case "profile":
        return <Profile />;
      case "settings":
        return <Settings />;
      default:
        return <GrowthDashboard />;
    }
  };

  const pageTitle = getPageTitle();

  return (
    <div className="min-h-screen flex">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        user={user} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-64' : 'ml-0'
      }`}>
        {/* Top Bar */}
        <header className="bg-gradient-to-br from-[#021024] to-[#052659] backdrop-blur-sm border-b border-border px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center">
            {/* Left Section - Hamburger + Title */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-slate-200 hover:text-[#C1E8FF] hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
                data-testid="button-toggle-sidebar"
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl truncate" data-testid="text-page-title">{pageTitle.title}</h1>
                <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate" data-testid="text-page-subtitle">{pageTitle.subtitle}</p>
              </div>
            </div>

            

            {/* Right Section - Notifications + Profile */}
            <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
              <NotificationCenter />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full text-slate-200 hover:text-[#C1E8FF] transition-all duration-300 ease-in-out"
                    data-testid="avatar-menu-trigger"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user?.fullName || "User"} />
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gradient-to-br from-[#021024] to-[#052659] border-border/50 text-white" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-bold text-white text-sm">{user?.fullName || "User"}</p>
                      <p className="text-xs text-slate-300">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem
                    className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
                    onClick={() => setActiveTab("profile")}
                    data-testid="menuitem-profile"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
                    onClick={() => setActiveTab("settings")}
                    data-testid="menuitem-settings"
                  >
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/30" />
                  <DropdownMenuItem
                    className="text-red-300 hover:text-red-200 hover:bg-red-500/20 focus:text-red-200 focus:bg-red-500/20 cursor-pointer"
                    onClick={handleLogout}
                    data-testid="menuitem-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6">
          {showSkeleton && activeTab === "overview" ? (
            <DashboardContentSkeleton />
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import NotificationCenter from "@/components/dashboard/notification-center";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Mail, 
  TrendingUp, 
  Users,
  MousePointer,
  User, 
  LogOut, 
  Settings as SettingsIcon,
  Eye,
  BarChart
} from "lucide-react";

export default function EmailPerformance() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    setLocation("/auth");
  };

  const handleGoBack = () => {
    setLocation("/dashboard");
  };

  // Mock email campaign data
  const campaigns = [
    {
      id: "1",
      name: "Winter Sale Campaign",
      subject: "🎉 50% Off Everything - Limited Time!",
      sent: 15420,
      opens: 5285,
      clicks: 847,
      openRate: 34.3,
      clickRate: 5.5,
      sentDate: "2024-01-18"
    },
    {
      id: "2",
      name: "New Product Launch",
      subject: "Introducing Our Latest Innovation",
      sent: 8750,
      opens: 2980,
      clicks: 536,
      openRate: 34.1,
      clickRate: 6.1,
      sentDate: "2024-01-15"
    },
    {
      id: "3",
      name: "Cart Recovery",
      subject: "Don't forget your items",
      sent: 3240,
      opens: 1134,
      clicks: 227,
      openRate: 35.0,
      clickRate: 7.0,
      sentDate: "2024-01-12"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#021024] to-[#052659]">
      {/* Header */}
      <header className="bg-gradient-to-br from-[#021024] to-[#052659] backdrop-blur-sm border-b border-slate-700/50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="text-slate-200 hover:text-[#C1E8FF] hover:bg-white/10 transition-all duration-300 ease-in-out flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold text-white text-base sm:text-lg lg:text-xl xl:text-2xl truncate">
                Email Performance
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm lg:text-base truncate">
                Email open rates and click-through performance analytics
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 sm:space-x-4 flex-shrink-0">
            <NotificationCenter />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full text-slate-200 hover:text-[#C1E8FF] transition-all duration-300 ease-in-out"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.fullName || "User"} />
                    <AvatarFallback className="bg-gradient-to-br from-[#021024] to-[#052659] text-[#C1E8FF]">
                      {user?.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700/50 text-white" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-bold text-white text-sm">{user?.fullName || "User"}</p>
                    <p className="text-xs text-slate-300">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-slate-700/30" />
                <DropdownMenuItem
                  className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
                  onClick={() => setLocation("/profile")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-slate-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10 cursor-pointer"
                  onClick={() => setLocation("/billing")}
                >
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700/30" />
                <DropdownMenuItem
                  className="text-red-300 hover:text-red-200 hover:bg-red-500/20 focus:text-red-200 focus:bg-red-500/20 cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <Mail className="w-6 h-6" style={{ color: '#C1E8FF' }} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">27,410</h3>
                  <p className="text-slate-300 text-sm">Total Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <Users className="w-6 h-6" style={{ color: '#C1E8FF' }} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">9,399</h3>
                  <p className="text-slate-300 text-sm">Total Opens</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <MousePointer className="w-6 h-6" style={{ color: '#C1E8FF' }} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">1,610</h3>
                  <p className="text-slate-300 text-sm">Total Clicks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <TrendingUp className="w-6 h-6" style={{ color: '#C1E8FF' }} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-2xl">34.2%</h3>
                  <p className="text-slate-300 text-sm">Avg Open Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Performance */}
        <Card className="bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Recent Email Campaigns</CardTitle>
            <CardDescription className="text-slate-300">
              Performance metrics for your latest email marketing campaigns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-lg p-4 space-y-3 bg-[#041d44]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-semibold text-lg">{campaign.name}</h3>
                    <p className="text-slate-300 text-sm">{campaign.subject}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Sent on {new Date(campaign.sentDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-white/10">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" className="bg-[#C1E8FF] hover:bg-[#C1E8FF]/90 text-indigo-900">
                      <BarChart className="w-4 h-4 mr-2" />
                      Analyze
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{campaign.sent.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{campaign.opens.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">Opens</p>
                    <Badge variant="secondary" className="bg-green-500/20 text-green-400 text-xs mt-1">
                      {campaign.openRate}%
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{campaign.clicks.toLocaleString()}</p>
                    <p className="text-slate-400 text-sm">Clicks</p>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs mt-1">
                      {campaign.clickRate}%
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{Math.round(campaign.clicks / campaign.opens * 100)}%</p>
                    <p className="text-slate-400 text-sm">Click-to-Open</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
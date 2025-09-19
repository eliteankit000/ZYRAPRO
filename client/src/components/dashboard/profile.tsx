import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubscriptionPlans from "./subscription-plans";
import { User, Mail, Calendar, CreditCard, Settings } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Profile() {
  const { user } = useAuth();

  // Extract initials from full name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* User Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="gradient-card border-0 lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl sm:text-2xl font-bold">
                  {getInitials(user?.fullName || "User")}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold" data-testid="text-profile-name">
              {user?.fullName || "User"}
            </CardTitle>
            <div className="flex justify-center">
              <Badge 
                variant="secondary" 
                className="bg-primary/20 text-primary text-sm"
                data-testid="badge-user-plan"
              >
                {user?.plan || "Free"} Plan
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span data-testid="text-profile-email">{user?.email || "user@example.com"}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Member since: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              <span>Billing Status: Active</span>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="gradient-card border-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-lg sm:text-xl font-bold">
              <User className="w-5 h-5 mr-2" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  defaultValue={user?.fullName || ""} 
                  data-testid="input-profile-fullname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue={user?.email || ""} 
                  data-testid="input-profile-email"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shopifyStore">Shopify Store URL</Label>
                <Input 
                  id="shopifyStore" 
                  placeholder="your-store.myshopify.com" 
                  data-testid="input-shopify-store"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input 
                  id="timezone" 
                  defaultValue="UTC-5 (Eastern Time)" 
                  data-testid="input-timezone"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button className="gradient-button" data-testid="button-save-profile">
                <Settings className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" data-testid="button-change-password">
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans Section */}
      <div>
        <SubscriptionPlans currentPlan={user?.plan?.toLowerCase().replace(/\s+/g, '-')} />
      </div>

      {/* Billing History */}
      <Card className="gradient-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center text-lg sm:text-xl font-bold">
            <CreditCard className="w-5 h-5 mr-2" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "Dec 15, 2024", plan: "Pro Plan", amount: "$25.00", status: "Paid" },
              { date: "Nov 15, 2024", plan: "Pro Plan", amount: "$25.00", status: "Paid" },
              { date: "Oct 15, 2024", plan: "Starter Plan", amount: "$15.00", status: "Paid" },
            ].map((bill, index) => (
              <div 
                key={index} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-lg"
                data-testid={`card-billing-${index}`}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm sm:text-base" data-testid={`text-billing-plan-${index}`}>
                    {bill.plan}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground" data-testid={`text-billing-date-${index}`}>
                    {bill.date}
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-4 mt-2 sm:mt-0">
                  <span className="font-medium text-sm sm:text-base" data-testid={`text-billing-amount-${index}`}>
                    {bill.amount}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className="bg-green-400/10 text-green-400 text-xs"
                    data-testid={`badge-billing-status-${index}`}
                  >
                    {bill.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-border">
            <Button variant="outline" className="w-full sm:w-auto" data-testid="button-download-invoices">
              Download All Invoices
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
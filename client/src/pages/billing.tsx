import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Calendar, 
  Download, 
  ChevronRight, 
  Check, 
  Crown, 
  Zap,
  Globe,
  Shield,
  Star,
  TrendingUp,
  Building,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Plus
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  planName: string;
  price: number;
  description: string;
  features: string[];
  limits: {
    products: number;
    emails: number;
    sms: number;
    aiGenerations: number;
    seoOptimizations: number;
  };
  currency: string;
  interval: string;
}

interface UserSubscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  invoiceNumber: string;
  invoiceUrl: string;
  pdfUrl: string;
  createdAt: string;
  paidAt: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  cardBrand: string;
  cardLast4: string;
  cardExpMonth: number;
  cardExpYear: number;
  isDefault: boolean;
}

interface UsageStats {
  productsCount: number;
  emailsSent: number;
  emailsRemaining: number;
  smsSent: number;
  smsRemaining: number;
  aiGenerationsUsed: number;
  seoOptimizationsUsed: number;
}

const planIcons = {
  "Forever Free": <Zap className="w-6 h-6" style={{ color: '#C1E8FF' }} />,
  "Starter": <TrendingUp className="w-6 h-6" style={{ color: '#C1E8FF' }} />,
  "Pro": <Crown className="w-6 h-6" style={{ color: '#C1E8FF' }} />,
  "Growth": <Globe className="w-6 h-6" style={{ color: '#C1E8FF' }} />,
  "Enterprise": <Building className="w-6 h-6" style={{ color: '#C1E8FF' }} />
};

export default function BillingPage() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Fetch subscription plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
  });

  // Fetch current subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery<UserSubscription>({
    queryKey: ['/api/subscription/current'],
  });

  // Fetch usage stats
  const { data: usageStats, isLoading: usageLoading } = useQuery<UsageStats>({
    queryKey: ['/api/usage-stats'],
  });

  // Fetch invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
  });

  // Fetch payment methods
  const { data: paymentMethods = [], isLoading: paymentMethodsLoading } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
  });

  // Upgrade/downgrade mutation
  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      return apiRequest('/api/subscription/change-plan', 'POST', { planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/usage-stats'] });
      toast({
        title: "Plan Updated",
        description: "Your subscription plan has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription plan.",
        variant: "destructive",
      });
    },
  });

  // Add payment method mutation
  const addPaymentMethodMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/payment-methods/add', 'POST');
    },
    onSuccess: (data: any) => {
      // Redirect to Stripe setup page
      if (data.setupUrl) {
        window.location.href = data.setupUrl;
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/payment-methods'] });
        toast({
          title: "Success",
          description: "Payment method added successfully.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add payment method.",
        variant: "destructive",
      });
    },
  });

  const currentPlan = plans.find((plan: SubscriptionPlan) => 
    plan.id === currentSubscription?.planId
  );

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const formatPrice = (price: number, currency: string = 'USD') => {
    // Convert cents to dollars
    const priceInDollars = price / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(priceInDollars);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (plansLoading || subscriptionLoading || usageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C1E8FF] mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading billing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #021024 0%, #052659 50%, #5483B3 100%)' }}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Subscription & Billing
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Manage your subscription, billing history, and payment methods
          </p>
        </div>

        {/* Current Plan Overview */}
        {currentPlan && (
          <Card className="bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {planIcons[currentPlan.planName as keyof typeof planIcons]}
                  <div>
                    <CardTitle className="text-white text-2xl" data-testid="text-current-plan">
                      {currentPlan.planName}
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      {currentPlan.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white" data-testid="text-current-price">
                    {formatPrice(currentPlan.price)}
                    <span className="text-lg text-slate-300">/{currentPlan.interval}</span>
                  </div>
                  {currentSubscription?.status && (
                    <Badge 
                      variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}
                      className="capitalize mt-2"
                      data-testid="badge-subscription-status"
                    >
                      {currentSubscription.status}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usageStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Products</span>
                      <span className="text-white" data-testid="text-products-usage">
                        {usageStats.productsCount}
                        {currentPlan.limits.products !== -1 && `/${currentPlan.limits.products}`}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usageStats.productsCount, currentPlan.limits.products)} 
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">Emails</span>
                      <span className="text-white" data-testid="text-emails-usage">
                        {usageStats.emailsSent}
                        {currentPlan.limits.emails !== -1 && `/${currentPlan.limits.emails}`}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usageStats.emailsSent, currentPlan.limits.emails)} 
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">SMS</span>
                      <span className="text-white" data-testid="text-sms-usage">
                        {usageStats.smsSent}
                        {currentPlan.limits.sms !== -1 && `/${currentPlan.limits.sms}`}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usageStats.smsSent, currentPlan.limits.sms)} 
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">AI Generations</span>
                      <span className="text-white" data-testid="text-ai-usage">
                        {usageStats.aiGenerationsUsed}
                        {currentPlan.limits.aiGenerations !== -1 && `/${currentPlan.limits.aiGenerations}`}
                      </span>
                    </div>
                    <Progress 
                      value={getUsagePercentage(usageStats.aiGenerationsUsed, currentPlan.limits.aiGenerations)} 
                      className="h-2"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs for different sections */}
        <Tabs defaultValue="plans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-[#041b3e]">
            <TabsTrigger value="plans" data-testid="tab-plans">Plans</TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">Billing History</TabsTrigger>
            <TabsTrigger value="payment" data-testid="tab-payment">Payment Methods</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
          </TabsList>

          {/* Plan Selection */}
          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan: SubscriptionPlan) => {
                const isCurrentPlan = plan.id === currentSubscription?.planId;
                const isUpgrade = plan.price > (currentPlan?.price || 0);
                const isDowngrade = plan.price < (currentPlan?.price || 0);
                
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl transition-all duration-300 hover:scale-105 border-slate-700/50 hover:shadow-cyan-500/30 ${
                      isCurrentPlan 
                        ? 'border-[#C1E8FF] shadow-cyan-500/50'
                        : ''
                    }`}
                    data-testid={`card-plan-${plan.planName.toLowerCase().replace(' ', '-')}`}
                  >
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-[#C1E8FF] text-indigo-900">Current Plan</Badge>
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        {planIcons[plan.planName as keyof typeof planIcons]}
                        <div>
                          <CardTitle className="text-white" data-testid={`text-plan-name-${plan.planName.toLowerCase().replace(' ', '-')}`}>
                            {plan.planName}
                          </CardTitle>
                          <CardDescription className="text-slate-300">
                            {plan.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-white" data-testid={`text-plan-price-${plan.planName.toLowerCase().replace(' ', '-')}`}>
                        {formatPrice(plan.price)}
                        <span className="text-lg text-slate-300">/{plan.interval}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-slate-300">
                            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      {!isCurrentPlan && (
                        <Button
                          onClick={() => changePlanMutation.mutate(plan.id)}
                          disabled={changePlanMutation.isPending}
                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 w-full font-medium transition-all duration-300 hover:scale-105 hover:bg-green-700 text-[#000000] bg-[#b5e1fe]"
                          data-testid={`button-change-plan-${plan.planName.toLowerCase().replace(' ', '-')}`}
                        >
                          {isUpgrade && <ArrowUp className="w-4 h-4 mr-2" />}
                          {isDowngrade && <ArrowDown className="w-4 h-4 mr-2" />}
                          {changePlanMutation.isPending ? "Processing..." : 
                           isUpgrade ? "Upgrade" : isDowngrade ? "Downgrade" : "Select Plan"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Billing History */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2" style={{ color: '#C1E8FF' }} />
                  Billing History
                </CardTitle>
                <CardDescription className="text-slate-300">
                  View and download your invoices and receipts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C1E8FF] mx-auto"></div>
                    <p className="mt-2 text-slate-300">Loading invoices...</p>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-8 text-slate-300">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No invoices yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div 
                        key={invoice.id} 
                        className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg"
                        data-testid={`invoice-${invoice.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                            <CreditCard className="w-5 h-5" style={{ color: '#C1E8FF' }} />
                          </div>
                          <div>
                            <p className="text-white font-medium" data-testid={`text-invoice-number-${invoice.id}`}>
                              Invoice #{invoice.invoiceNumber}
                            </p>
                            <p className="text-sm text-slate-300" data-testid={`text-invoice-date-${invoice.id}`}>
                              {formatDate(invoice.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-white font-medium" data-testid={`text-invoice-amount-${invoice.id}`}>
                              {formatPrice(invoice.amount, invoice.currency)}
                            </p>
                            <Badge 
                              variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                              className="capitalize"
                              data-testid={`badge-invoice-status-${invoice.id}`}
                            >
                              {invoice.status}
                            </Badge>
                          </div>
                          {invoice.pdfUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(invoice.pdfUrl, '_blank')}
                              data-testid={`button-download-invoice-${invoice.id}`}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods */}
          <TabsContent value="payment" className="space-y-6">
            <Card className="bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" style={{ color: '#C1E8FF' }} />
                      Payment Methods
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Manage your payment methods and billing information
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => addPaymentMethodMutation.mutate()}
                    disabled={addPaymentMethodMutation.isPending}
                    className="bg-[#C1E8FF] hover:bg-[#A5D8FF] text-indigo-900"
                    data-testid="button-add-payment-method"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Payment Method
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {paymentMethodsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C1E8FF] mx-auto"></div>
                    <p className="mt-2 text-slate-300">Loading payment methods...</p>
                  </div>
                ) : paymentMethods.length === 0 ? (
                  <div className="text-center py-8 text-slate-300">
                    <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No payment methods added</p>
                    <p className="text-sm mt-2">Add a payment method to start using paid features</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paymentMethods.map((method) => (
                      <div 
                        key={method.id} 
                        className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg"
                        data-testid={`payment-method-${method.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                            <CreditCard className="w-5 h-5" style={{ color: '#C1E8FF' }} />
                          </div>
                          <div>
                            <p className="text-white font-medium capitalize" data-testid={`text-card-brand-${method.id}`}>
                              {method.cardBrand} •••• {method.cardLast4}
                            </p>
                            <p className="text-sm text-slate-300" data-testid={`text-card-expiry-${method.id}`}>
                              Expires {method.cardExpMonth.toString().padStart(2, '0')}/{method.cardExpYear}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {method.isDefault && (
                            <Badge className="bg-green-600" data-testid={`badge-default-${method.id}`}>
                              Default
                            </Badge>
                          )}
                          <Button variant="outline" size="sm" data-testid={`button-manage-payment-${method.id}`}>
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2" style={{ color: '#C1E8FF' }} />
                  Subscription Settings
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Manage your subscription preferences and billing settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentSubscription && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Billing Cycle</p>
                        <p className="text-sm text-slate-300">
                          Next billing date: {formatDate(currentSubscription.currentPeriodEnd)}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {currentPlan?.interval || 'monthly'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Auto-renewal</p>
                        <p className="text-sm text-slate-300">
                          {currentSubscription.cancelAtPeriodEnd 
                            ? 'Your subscription will not renew' 
                            : 'Your subscription will automatically renew'
                          }
                        </p>
                      </div>
                      <Button variant="outline" size="sm" data-testid="button-manage-renewal">
                        {currentSubscription.cancelAtPeriodEnd ? 'Resume' : 'Cancel'} Subscription
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="pt-6 border-t border-slate-700">
                  <h3 className="text-white font-medium mb-4">Need Help?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="justify-start" data-testid="button-contact-support">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Contact Support
                    </Button>
                    <Button variant="outline" className="justify-start" data-testid="button-billing-portal">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Billing Portal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
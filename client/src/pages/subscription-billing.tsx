import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  CreditCard,
  ArrowLeft,
  Check,
  Crown,
  Zap,
  Calendar,
  Download,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  DollarSign,
  FileText,
  Settings,
  Star
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  planName: string;
  price: string;
  interval: string;
  features: string[];
  limits: {
    products: number;
    emails: number;
    sms: number;
    aiGenerations: number;
  };
  stripePriceId?: string;
  description: string;
  isPopular?: boolean;
}

interface CurrentSubscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  plan: SubscriptionPlan;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  status: string;
  invoiceUrl?: string;
  pdfUrl?: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  isDefault: boolean;
}

export default function SubscriptionBilling() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  // Fetch current subscription
  const { data: currentSubscription, isLoading: subscriptionLoading } = useQuery<CurrentSubscription>({
    queryKey: ['/api/subscription/current'],
    enabled: true
  });

  // Fetch available plans
  const { data: availablePlans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
    enabled: true
  });

  // Fetch billing history
  const { data: billingHistory, isLoading: billingLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices'],
    enabled: true
  });

  // Fetch payment methods
  const { data: paymentMethods, isLoading: paymentsLoading } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
    enabled: true
  });

  // Change plan mutation
  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/subscription/change-plan', { planId });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      setChangePlanDialogOpen(false);
      setSelectedPlan(null);
      toast({
        title: "Plan Updated",
        description: "Your subscription plan has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Plan Change Failed",
        description: error.message || "Failed to update subscription plan",
        variant: "destructive",
      });
    }
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/cancel');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will be cancelled at the end of the current billing period.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    }
  });

  // Reactivate subscription mutation
  const reactivateSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/reactivate');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/current'] });
      toast({
        title: "Subscription Reactivated",
        description: "Your subscription has been successfully reactivated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reactivation Failed",
        description: error.message || "Failed to reactivate subscription",
        variant: "destructive",
      });
    }
  });

  // Download invoice mutation
  const downloadInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const response = await apiRequest('GET', `/api/invoices/${invoiceId}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Invoice Downloaded",
        description: "Invoice has been downloaded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download invoice",
        variant: "destructive",
      });
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { color: 'bg-green-500/20 text-green-400', label: 'Active' },
      trialing: { color: 'bg-blue-500/20 text-blue-400', label: 'Trial' },
      past_due: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Past Due' },
      canceled: { color: 'bg-red-500/20 text-red-400', label: 'Cancelled' },
      incomplete: { color: 'bg-gray-500/20 text-gray-400', label: 'Incomplete' },
      paid: { color: 'bg-green-500/20 text-green-400', label: 'Paid' },
      open: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Open' },
      void: { color: 'bg-gray-500/20 text-gray-400', label: 'Void' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'bg-gray-500/20 text-gray-400', label: status };
    
    return (
      <Badge variant="secondary" className={`${statusInfo.color} text-xs`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const SubscriptionSkeleton = () => (
    <Card className="bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 min-h-screen">
      {/* Header with Back Button */}
      <div className="flex items-center space-x-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation('/dashboard?tab=settings')}
          className="text-[#C1E8FF] hover:bg-slate-800/50"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settings
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Subscription & Billing
          </h1>
          <p className="text-slate-300">
            Manage your subscription plan, billing history, and payment methods
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Subscription */}
        <Card className="lg:col-span-2 bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl border-slate-700/50" data-testid="card-current-subscription">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-slate-800/50">
                <Crown className="w-6 h-6" style={{ color: '#C1E8FF' }} />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Current Subscription</CardTitle>
                <CardDescription className="text-slate-300">
                  Your active plan and billing cycle
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {subscriptionLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-40" />
              </div>
            ) : currentSubscription ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{currentSubscription.plan.planName}</h3>
                    <p className="text-slate-300">{currentSubscription.plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-[#C1E8FF]">
                      ${currentSubscription.plan.price}
                      <span className="text-lg text-slate-400">/{currentSubscription.plan.interval}</span>
                    </p>
                    {getStatusBadge(currentSubscription.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/30 rounded-lg">
                  <div>
                    <p className="text-slate-400 text-sm">Current Period</p>
                    <p className="text-white font-medium">
                      {formatDate(currentSubscription.currentPeriodStart)} - {formatDate(currentSubscription.currentPeriodEnd)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Next Billing</p>
                    <p className="text-white font-medium">
                      {currentSubscription.cancelAtPeriodEnd ? "Cancelled" : formatDate(currentSubscription.currentPeriodEnd)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-white font-medium">Plan Features:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {currentSubscription.plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-green-400" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Dialog open={changePlanDialogOpen} onOpenChange={setChangePlanDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="bg-[#C1E8FF] hover:bg-[#C1E8FF]/90 text-indigo-900"
                        data-testid="button-change-plan"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Change Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-white">Choose Your Plan</DialogTitle>
                        <DialogDescription className="text-slate-300">
                          Select the plan that best fits your business needs
                        </DialogDescription>
                      </DialogHeader>
                      {plansLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[1, 2, 3].map((i) => (
                            <Card key={i} className="bg-slate-800/30 border-slate-700/50">
                              <CardContent className="p-6">
                                <Skeleton className="h-6 w-20 mb-2" />
                                <Skeleton className="h-8 w-16 mb-4" />
                                <div className="space-y-2">
                                  {[1, 2, 3, 4].map((j) => (
                                    <Skeleton key={j} className="h-4 w-full" />
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {availablePlans?.map((plan) => (
                            <Card 
                              key={plan.id} 
                              className={`relative cursor-pointer transition-all duration-300 hover:scale-105 ${
                                plan.isPopular 
                                  ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/50' 
                                  : 'bg-slate-800/30 border-slate-700/50'
                              } ${
                                selectedPlan?.id === plan.id ? 'ring-2 ring-[#C1E8FF]' : ''
                              }`}
                              onClick={() => setSelectedPlan(plan)}
                              data-testid={`plan-${plan.id}`}
                            >
                              {plan.isPopular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                  <Badge className="bg-blue-500 text-white px-3 py-1">
                                    <Star className="w-3 h-3 mr-1" />
                                    Popular
                                  </Badge>
                                </div>
                              )}
                              <CardContent className="p-6">
                                <div className="text-center space-y-4">
                                  <h3 className="text-xl font-bold text-white">{plan.planName}</h3>
                                  <div>
                                    <span className="text-3xl font-bold text-[#C1E8FF]">${plan.price}</span>
                                    <span className="text-slate-400">/{plan.interval}</span>
                                  </div>
                                  <p className="text-slate-300 text-sm">{plan.description}</p>
                                  <div className="space-y-2 text-left">
                                    {plan.features.slice(0, 4).map((feature, index) => (
                                      <div key={index} className="flex items-center space-x-2 text-sm text-slate-300">
                                        <Check className="w-4 h-4 text-green-400" />
                                        <span>{feature}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {currentSubscription?.planId === plan.id ? (
                                    <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                                      Current Plan
                                    </Badge>
                                  ) : (
                                    <Button
                                      className="w-full bg-[#C1E8FF] hover:bg-[#C1E8FF]/90 text-indigo-900"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        changePlanMutation.mutate(plan.id);
                                      }}
                                      disabled={changePlanMutation.isPending}
                                      data-testid={`button-select-${plan.id}`}
                                    >
                                      {changePlanMutation.isPending ? "Updating..." : "Select Plan"}
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {currentSubscription.cancelAtPeriodEnd ? (
                    <Button
                      variant="outline"
                      onClick={() => reactivateSubscriptionMutation.mutate()}
                      disabled={reactivateSubscriptionMutation.isPending}
                      className="border-green-500 text-green-400 hover:bg-green-500/10"
                      data-testid="button-reactivate"
                    >
                      {reactivateSubscriptionMutation.isPending ? "Reactivating..." : "Reactivate"}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => cancelSubscriptionMutation.mutate()}
                      disabled={cancelSubscriptionMutation.isPending}
                      className="border-red-500 text-red-400 hover:bg-red-500/10"
                      data-testid="button-cancel"
                    >
                      {cancelSubscriptionMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
                    </Button>
                  )}
                </div>

                {currentSubscription.cancelAtPeriodEnd && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <p className="text-red-400 font-medium">Subscription Cancelled</p>
                    </div>
                    <p className="text-red-300 text-sm mt-1">
                      Your subscription will end on {formatDate(currentSubscription.currentPeriodEnd)}. 
                      You can reactivate it anytime before this date.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Crown className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                <h3 className="text-white font-medium mb-2">No Active Subscription</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Choose a plan to get started with Zyra's premium features
                </p>
                <Button 
                  onClick={() => setChangePlanDialogOpen(true)}
                  className="bg-[#C1E8FF] hover:bg-[#C1E8FF]/90 text-indigo-900"
                  data-testid="button-choose-plan"
                >
                  Choose a Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl border-slate-700/50" data-testid="card-billing-stats">
            <CardHeader>
              <CardTitle className="text-white text-lg">Billing Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscriptionLoading ? (
                <>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded bg-green-500/20">
                      <DollarSign className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        ${currentSubscription?.plan.price || '0'}
                      </p>
                      <p className="text-slate-400 text-sm">Monthly</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded bg-blue-500/20">
                      <Calendar className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-white">
                        {currentSubscription 
                          ? formatDate(currentSubscription.currentPeriodEnd).split(',')[0] 
                          : 'No renewal'
                        }
                      </p>
                      <p className="text-slate-400 text-sm">Next billing</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl border-slate-700/50" data-testid="card-payment-method">
            <CardHeader>
              <CardTitle className="text-white text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : paymentMethods && paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethods.filter(pm => pm.isDefault).map((method) => (
                    <div key={method.id} className="flex items-center space-x-3">
                      <div className="p-2 rounded bg-slate-800/50">
                        <CreditCard className="w-5 h-5" style={{ color: '#C1E8FF' }} />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {method.cardBrand?.toUpperCase()} •••• {method.cardLast4}
                        </p>
                        <p className="text-slate-400 text-sm">
                          Expires {method.cardExpMonth}/{method.cardExpYear}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-600 text-white hover:bg-slate-800/50"
                    data-testid="button-manage-payment"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                  <p className="text-slate-400 text-sm">No payment method</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 border-slate-600 text-white hover:bg-slate-800/50"
                    data-testid="button-add-payment"
                  >
                    Add Payment Method
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Billing History */}
        <Card className="lg:col-span-3 bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl border-slate-700/50" data-testid="card-billing-history">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <FileText className="w-6 h-6" style={{ color: '#C1E8FF' }} />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Billing History</CardTitle>
                  <CardDescription className="text-slate-300">
                    View and download your invoices
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {billingLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : billingHistory && billingHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Invoice</TableHead>
                      <TableHead className="text-slate-300">Date</TableHead>
                      <TableHead className="text-slate-300">Amount</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingHistory.map((invoice) => (
                      <TableRow key={invoice.id} className="border-slate-700" data-testid={`invoice-${invoice.id}`}>
                        <TableCell className="text-white font-medium">
                          {invoice.invoiceNumber || `INV-${invoice.id.slice(0, 8)}`}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {formatDate(invoice.createdAt)}
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          ${invoice.amount} {invoice.currency.toUpperCase()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invoice.status)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadInvoiceMutation.mutate(invoice.id)}
                              disabled={downloadInvoiceMutation.isPending}
                              className="text-[#C1E8FF] hover:bg-[#C1E8FF]/10"
                              data-testid={`button-download-${invoice.id}`}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {invoice.invoiceUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(invoice.invoiceUrl, '_blank')}
                                className="text-[#C1E8FF] hover:bg-[#C1E8FF]/10"
                                data-testid={`button-view-${invoice.id}`}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                <h3 className="text-white font-medium mb-2">No billing history</h3>
                <p className="text-slate-400 text-sm">
                  Your invoices and billing history will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
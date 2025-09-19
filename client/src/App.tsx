import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Profile from "@/pages/profile";
import Billing from "@/pages/billing";
import NotFound from "@/pages/not-found";
import OptimizedProducts from "@/pages/optimized-products";
import EmailPerformance from "@/pages/email-performance";
import SmsConversion from "@/pages/sms-conversion";
import SeoKeywordDensity from "@/pages/seo-keyword-density";
import ContentROI from "@/pages/content-roi";
import RevenueImpact from "@/pages/revenue-impact";
import SeoRankingTracker from "@/pages/seo-ranking-tracker";
import ABTestResults from "@/pages/ab-test-results";
import ProfileAccount from "@/pages/profile-account";
import SubscriptionBilling from "@/pages/subscription-billing";
import { useAuth } from "@/lib/auth";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={user ? Dashboard : Landing} />
      <Route path="/auth/:mode?" component={Auth} />
      <Route path="/dashboard" component={user ? Dashboard : () => { window.location.href = "/auth/login"; return null; }} />
      <Route path="/products" component={user ? Products : () => { window.location.href = "/auth/login"; return null; }} />
      <Route path="/profile" component={user ? Profile : () => { window.location.href = "/auth/login"; return null; }} />
      <Route path="/billing" component={user ? Billing : () => { window.location.href = "/auth/login"; return null; }} />
      <Route path="/analytics/optimized-products" component={user ? OptimizedProducts : () => { window.location.href = "/auth/login"; return null; }} />
      <Route path="/analytics/email-performance" component={user ? EmailPerformance : () => { window.location.href = "/auth/login"; return null; }} />
      <Route path="/analytics/sms-conversion" component={user ? SmsConversion : () => { window.location.href = "/auth/login"; return null; }} />
      <Route path="/analytics/seo-keyword-density" component={user ? SeoKeywordDensity : () => { window.location.href = "/auth/login"; return null; }} />
      <Route path="/analytics/content-roi" component={user ? ContentROI : () => { window.location.href = "/auth/login"; return null; }} />
      <Route path="/analytics/revenue-impact" component={user ? RevenueImpact : () => { window.location.href = "/auth/login"; return null; }} />
      <Route path="/analytics/seo-ranking-tracker" component={user ? SeoRankingTracker : () => { window.location.href = "/auth/login"; return null; }} />
      <Route path="/analytics/ab-test-results" component={user ? ABTestResults : () => { window.location.href = "/auth/login"; return null; }} />
      <Route path="/settings/profile-account" component={user ? ProfileAccount : () => { window.location.href = "/auth/login"; return null; }} />
      <Route path="/settings/subscription-billing" component={user ? SubscriptionBilling : () => { window.location.href = "/auth/login"; return null; }} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

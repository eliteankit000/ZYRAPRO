import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Star, TrendingUp, ShoppingCart, Mail, Search, BarChart3, Cog, ArrowRight, Play, Check, Gift, Crown, Award } from "lucide-react";
import ResponsiveNavbar from "@/components/responsive-navbar";

export default function Landing() {
  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "AI Product Descriptions",
      description: "Generate compelling product descriptions in Sales, SEO, and Casual styles with one click."
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: "SEO Optimization", 
      description: "Auto-generate SEO titles, meta descriptions, and keyword-rich tags for better rankings."
    },
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      title: "Cart Recovery",
      description: "AI-powered SMS and email campaigns to recover abandoned carts automatically."
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Upsell Emails",
      description: "Branded receipt emails with intelligent product recommendations and upsells."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics Dashboard",
      description: "Track performance, conversions, and ROI with detailed analytics and insights."
    },
    {
      icon: <Cog className="w-6 h-6" />,
      title: "Bulk Optimization",
      description: "Optimize hundreds of products at once with CSV import/export and batch processing."
    }
  ];

  const plans = [
    {
      name: "Free Trial",
      price: "$0",
      period: "7 days",
      icon: <Gift className="w-8 h-8" />,
      description: "Try all premium features free for 7 days.",
      whoItsFor: "",
      features: [
        "Try all premium features free for 7 days",
        "No credit card required (optional)",
        "Cancel anytime before trial ends",
        "Perfect for testing Zyra on your own store before upgrading"
      ],
      popular: false
    },
    {
      name: "Starter",
      price: "$15",
      period: "per month",
      icon: <Zap className="w-8 h-8" />,
      description: "Small Shopify stores just getting started with AI.",
      whoItsFor: "Small Shopify stores just getting started with AI.",
      features: [
        "Optimize up to 100 products with AI-generated descriptions",
        "Send up to 500 AI-crafted emails per month (upsells, receipts)",
        "Access to SEO title + meta tag generator",
        "AI image alt-text generator for accessibility + SEO boost",
        "Basic analytics dashboard (track optimized products + email open rates)"
      ],
      popular: false
    },
    {
      name: "Pro",
      price: "$25", 
      period: "per month",
      icon: <Crown className="w-8 h-8" />,
      description: "Established stores with medium traffic looking to grow faster.",
      whoItsFor: "Established stores with medium traffic looking to grow faster.",
      features: [
        "Unlimited product optimizations (no limits on AI copy)",
        "Send up to 2,000 AI-crafted emails per month",
        "Recover abandoned carts with 500 SMS reminders per month",
        "Advanced analytics dashboard (email CTR, SMS conversion, keyword density)",
        "Priority AI processing → faster response + reduced wait times"
      ],
      popular: true
    },
    {
      name: "Growth",
      price: "$49",
      period: "per month",
      icon: <Award className="w-8 h-8" />,
      description: "High-volume stores that want maximum automation and advanced growth tools.",
      whoItsFor: "High-volume stores that want maximum automation and advanced growth tools.",
      features: [
        "Unlimited everything → products, emails, and SMS recovery",
        "Full analytics suite → keyword insights, revenue from emails/SMS, product optimization impact",
        "A/B testing for AI-generated content → test multiple product descriptions, email subjects, and SMS messages",
        "Premium template library → advanced email & SMS layouts designed to convert",
        "Early access to new AI tools (before Starter/Pro users)",
        "Priority support for faster help"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <ResponsiveNavbar
        navItems={[
          { label: "Features", href: "#features", external: true },
          { label: "Pricing", href: "#pricing", external: true },
          { label: "Login", href: "/auth/login" }
        ]}
        actionButton={{
          label: "Get Started",
          href: "/auth/register"
        }}
      />

      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent" data-testid="text-hero-title">
            Smarter Sales, Faster Growth
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0" data-testid="text-hero-subtitle">
            AI-powered Shopify optimization that boosts sales, recovers carts, and automates your growth with intelligent product descriptions and SEO.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-12 px-4 sm:px-0">
            <Button asChild className="gradient-button w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold" data-testid="button-start-trial">
              <Link href="/auth/register">
                Start 7-Day Free Trial
              </Link>
            </Button>
            <Button variant="outline" className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold" data-testid="button-watch-demo">
              <Play className="w-4 h-4 mr-2" />
              Watch Demo
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-2xl mx-auto">
            <div className="text-center p-4 sm:p-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary" data-testid="text-stat-sales">300%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Sales Increase</div>
            </div>
            <div className="text-center p-4 sm:p-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary" data-testid="text-stat-recovery">85%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Cart Recovery</div>
            </div>
            <div className="text-center p-4 sm:p-0">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary" data-testid="text-stat-setup">10min</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Setup Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4" data-testid="text-features-title">Powerful AI Features</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground px-4 sm:px-0">Everything you need to optimize your Shopify store</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="gradient-card border-0 h-full" data-testid={`card-feature-${index}`}>
                <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-3 sm:mb-4 text-primary flex-shrink-0">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3" data-testid={`text-feature-title-${index}`}>{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground flex-grow" data-testid={`text-feature-description-${index}`}>{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="container mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4" data-testid="text-pricing-title">Choose Your Plan</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground px-4 sm:px-0">Start with a 7-day free trial, upgrade anytime</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto mb-12 sm:mb-16">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`pricing-card border-0 relative h-full ${plan.popular ? 'border-primary/50 lg:scale-105' : ''}`}
                data-testid={`card-plan-${index}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Popular</Badge>
                  </div>
                )}
                <CardContent className="p-4 sm:p-6 h-full flex flex-col">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="flex justify-center text-primary mb-2">{plan.icon}</div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2" data-testid={`text-plan-name-${index}`}>{plan.name}</h3>
                    <div className="text-2xl sm:text-3xl font-bold" data-testid={`text-plan-price-${index}`}>{plan.price}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3" data-testid={`text-plan-period-${index}`}>{plan.period}</div>
                    {plan.whoItsFor && (
                      <p className="text-xs sm:text-sm text-primary/80 font-medium px-2 sm:px-0" data-testid={`text-plan-target-${index}`}>
                        Who it's for: {plan.whoItsFor}
                      </p>
                    )}
                  </div>
                  <div className="flex-1">
                    <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start text-xs sm:text-sm" data-testid={`text-plan-feature-${index}-${featureIndex}`}>
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    asChild
                    className={`w-full ${plan.popular ? 'gradient-button' : 'border border-border hover:bg-muted'}`}
                    variant={plan.popular ? "default" : "outline"}
                    data-testid={`button-choose-plan-${index}`}
                  >
                    <Link href="/auth/register">
                      {index === 0 ? "Start Trial" : "Choose Plan"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="max-w-6xl mx-auto px-2 sm:px-4">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-6 sm:mb-8" data-testid="text-comparison-title">Feature Comparison</h3>
            <Card className="gradient-card border-0">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2 sm:p-3 lg:p-4 text-xs sm:text-sm font-semibold">Features</th>
                        <th className="text-center p-2 sm:p-3 lg:p-4 text-xs sm:text-sm font-semibold">Free Trial</th>
                        <th className="text-center p-2 sm:p-3 lg:p-4 text-xs sm:text-sm font-semibold">Starter</th>
                        <th className="text-center p-2 sm:p-3 lg:p-4 text-xs sm:text-sm font-semibold bg-primary/10">Pro</th>
                        <th className="text-center p-2 sm:p-3 lg:p-4 text-xs sm:text-sm font-semibold">Growth</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs sm:text-sm">
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 font-medium">Product Optimization</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">Unlimited (7 days)</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">100 products</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-primary/5">Unlimited</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">Unlimited</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 font-medium">AI Emails per Month</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">Unlimited (7 days)</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">500</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-primary/5">2,000</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">Unlimited</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 font-medium">SMS Recovery</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✓</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">—</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-primary/5">500/month</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">Unlimited</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 font-medium">Analytics</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">Full access</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">Basic</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-primary/5">Advanced</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">Full suite</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 font-medium">AI Processing</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">Standard</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">Standard</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-primary/5">Priority</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">Priority</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 font-medium">A/B Testing</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">—</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">—</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-primary/5">—</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✓</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 font-medium">Premium Templates</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">—</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">—</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-primary/5">—</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✓</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="p-2 sm:p-3 lg:p-4 font-medium">Early Access to New AI Tools</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">—</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">—</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-primary/5">—</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">✓</td>
                      </tr>
                      <tr>
                        <td className="p-2 sm:p-3 lg:p-4 font-medium">Support</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">Standard</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">Standard</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4 bg-primary/5">Standard</td>
                        <td className="text-center p-2 sm:p-3 lg:p-4">Priority</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4" data-testid="text-cta-title">Ready to Transform Your Shopify Store?</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 px-4 sm:px-0">Join thousands of merchants already using Zyra to boost their sales</p>
          <Button asChild className="gradient-button w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold" data-testid="button-cta-start">
            <Link href="/auth/register">
              Start Your Free Trial Today
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 sm:py-8 px-4 sm:px-6 border-t border-border">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-3 sm:mb-4">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-bold">Zyra</span>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">© 2024 Zyra. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

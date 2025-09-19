import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  Settings as SettingsIcon,
  User,
  CreditCard,
  Brain,
  Bell,
  Zap,
  Shield,
  HelpCircle,
  Store,
  Globe,
  Mail,
  MessageSquare,
  BarChart3,
  Key,
  Download,
  Trash2,
  Eye,
  Edit3,
  Lock,
  Smartphone,
  FileText,
  ExternalLink,
  Users
} from "lucide-react";

interface SettingsCard {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  features: string[];
  actionText: string;
  category: 'account' | 'billing' | 'preferences' | 'integrations' | 'security' | 'support';
}

export default function Settings() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [aiConfigModalOpen, setAiConfigModalOpen] = useState(false);
  const [aiPreferences, setAiPreferences] = useState({
    brandVoice: 'casual',
    contentStyles: ['sales', 'seo'],
    autoSaveOutputs: true,
    scheduledUpdates: 'every-6-months'
  });

  const settingsCards: SettingsCard[] = [
    {
      id: 'profile-account',
      title: 'Profile & Account',
      description: 'Manage your personal information, connected stores, and language preferences',
      icon: <User className="w-5 h-5 stroke-2" style={{ color: '#C1E8FF' }} />,
      features: ['Edit Profile (name, email, image)', 'Change Password', 'Connected Stores (Shopify, WooCommerce)', 'Multi-language UI + Auto-translation'],
      actionText: 'Manage Profile',
      category: 'account'
    },
    {
      id: 'subscription-billing',
      title: 'Subscription & Billing',
      description: 'View current plan, upgrade options, billing history, and payment methods',
      icon: <CreditCard className="w-5 h-5 stroke-2" style={{ color: '#C1E8FF' }} />,
      features: ['Current Plan Overview', 'Upgrade/Downgrade Plans', 'Billing History & Invoices', 'Payment Method Management'],
      actionText: 'View Billing',
      category: 'billing'
    },
    {
      id: 'ai-preferences',
      title: 'AI Preferences',
      description: 'Customize AI behavior, brand voice, content style, and automation settings',
      icon: <Brain className="w-5 h-5 stroke-2" style={{ color: '#C1E8FF' }} />,
      features: ['Brand Voice Memory (Luxury, Casual, Gen Z)', 'Default Content Style (Sales, SEO)', 'Auto-save AI Outputs', 'Scheduled AI Updates (3-6 months)'],
      actionText: 'Configure AI',
      category: 'preferences'
    },
    {
      id: 'notifications-alerts',
      title: 'Notifications & Alerts',
      description: 'Control email notifications, in-app alerts, and mobile push settings',
      icon: <Bell className="w-5 h-5 stroke-2" style={{ color: '#C1E8FF' }} />,
      features: ['Email Notifications (Campaigns, Billing)', 'In-app Performance Alerts', 'Mobile Push Notifications', 'AI Recommendation Alerts'],
      actionText: 'Set Notifications',
      category: 'preferences'
    },
    {
      id: 'integrations',
      title: 'Integrations',
      description: 'Connect email providers, SMS services, analytics tools, and automation platforms',
      icon: <Zap className="w-5 h-5 stroke-2" style={{ color: '#C1E8FF' }} />,
      features: ['Email (Gmail, Outlook, SMTP)', 'SMS (Twilio, Vonage)', 'Analytics (Google Analytics, Meta Pixel)', 'Zapier / Make Automation'],
      actionText: 'Manage Integrations',
      category: 'integrations'
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Two-factor authentication, login activity, API keys, and data management',
      icon: <Shield className="w-5 h-5 stroke-2" style={{ color: '#C1E8FF' }} />,
      features: ['Two-Factor Authentication (2FA)', 'Login Activity Log', 'API Key Management', 'Data Export/Delete (GDPR)'],
      actionText: 'Security Settings',
      category: 'security'
    },
    {
      id: 'support-resources',
      title: 'Support & Resources',
      description: 'Access help center, contact support, submit feedback, and join community',
      icon: <HelpCircle className="w-5 h-5 stroke-2" style={{ color: '#C1E8FF' }} />,
      features: ['Help Center (FAQs, Docs, Tutorials)', 'Contact Support (Live Chat, Email)', 'Feedback & Feature Requests', 'Community Forum / Slack'],
      actionText: 'Get Support',
      category: 'support'
    }
  ];

  // Mock mutation for settings actions
  const settingsMutation = useMutation({
    mutationFn: async (data: { cardId: string; action: string }) => {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockResponses = {
        'profile-account': {
          message: `Profile settings loaded. Connected to 2 stores: Shopify "Fashion Forward" and WooCommerce "Tech Gadgets".`
        },
        'subscription-billing': {
          message: `Billing dashboard loaded. Current: Pro Plan ($25/month). Next billing: Jan 15, 2025. 3 invoices available.`
        },
        'ai-preferences': {
          message: `AI preferences loaded. Brand Voice: "Luxury Premium" • Content Style: "Sales-focused" • Auto-save: Enabled`
        },
        'notifications-alerts': {
          message: `Notification settings loaded. Email alerts: ON • Performance insights: Daily • Mobile push: Enabled for critical alerts`
        },
        'integrations': {
          message: `Integration hub loaded. Active: Gmail, Google Analytics, Twilio SMS. Available: 15+ new integrations to connect.`
        },
        'security': {
          message: `Security dashboard loaded. 2FA: Enabled • Last login: Today 9:03 AM • 3 active API keys • GDPR tools ready`
        },
        'support-resources': {
          message: `Support center loaded. Help articles: 150+ • Live chat: Available 24/7 • Community: 2,500+ members active`
        }
      };

      return mockResponses[data.cardId as keyof typeof mockResponses] || { message: 'Settings loaded successfully.' };
    },
    onSuccess: (data: any) => {
      toast({
        title: "Settings Loaded",
        description: data.message,
        duration: 4000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Loading Failed",
        description: error.message || "Failed to load settings",
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const handleSettingsAction = (cardId: string) => {
    // Handle specific navigation pages
    if (cardId === 'profile-account') {
      setLocation('/profile');
      return;
    }
    
    if (cardId === 'subscription-billing') {
      setLocation('/billing');
      return;
    }
    
    const card = settingsCards.find(c => c.id === cardId);
    if (!card) return;

    settingsMutation.mutate({
      cardId,
      action: card.actionText.toLowerCase().replace(/\s+/g, '_')
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-3 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Settings & Configuration
          </h1>
          <p className="text-slate-300 text-lg">
            Customize your Zyra experience, manage integrations, and configure AI preferences
          </p>
        </div>
      </div>

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {settingsCards.map((card) => (
          <Card 
            key={card.id} 
            className="relative bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl transition-all duration-300 hover:scale-105 border-slate-700/50 hover:shadow-cyan-500/30"
            data-testid={`card-settings-${card.id}`}
          >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 flex items-center justify-center transition-all duration-300">
                      <div className="w-5 h-5 flex items-center justify-center">
                        {card.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-white font-bold text-lg leading-none" data-testid={`text-title-${card.id}`}>
                        {card.title}
                      </CardTitle>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 capitalize"
                    data-testid={`badge-category-${card.id}`}
                  >
                    {card.category}
                  </Badge>
                </div>
                <CardDescription className="text-slate-300 mt-2 mb-4" data-testid={`text-description-${card.id}`}>
                  {card.description}
                </CardDescription>
                
                {/* Feature List */}
                <div className="space-y-2">
                  {card.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-slate-300" data-testid={`feature-${card.id}-${index}`}>
                      <div className="w-1.5 h-1.5 bg-[#C1E8FF] rounded-full flex-shrink-0"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  onClick={() => handleSettingsAction(card.id)}
                  disabled={settingsMutation.isPending}
                  className="w-full font-medium transition-all duration-300 bg-[#C1E8FF] hover:bg-[#C1E8FF] text-indigo-900 hover:scale-105"
                  data-testid={`button-action-${card.id}`}
                >
                  {settingsMutation.isPending ? "Loading..." : card.actionText}
                </Button>
              </CardContent>
            </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-slate-800/50 transition-all duration-300">
              <Store className="w-5 h-5 stroke-2" style={{ color: '#C1E8FF' }} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">2 Stores</h3>
              <p className="text-slate-300 text-sm">Connected</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-slate-800/50 transition-all duration-300">
              <Zap className="w-5 h-5 stroke-2" style={{ color: '#C1E8FF' }} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">8 Active</h3>
              <p className="text-slate-300 text-sm">Integrations</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-slate-800/50 transition-all duration-300">
              <Shield className="w-5 h-5 stroke-2" style={{ color: '#C1E8FF' }} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Secure</h3>
              <p className="text-slate-300 text-sm">2FA Enabled</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Account Status */}
      <div className="mt-8 p-6 bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 flex items-center justify-center transition-all duration-300">
            <div className="w-5 h-5 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 stroke-2" style={{ color: '#C1E8FF' }} />
            </div>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-2">Account Configuration</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Your Zyra account is fully configured with AI preferences optimized for your brand voice. 
              All integrations are active and security features are enabled. Your settings sync across 
              all connected stores and devices for a seamless experience.
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-green-400">All Systems Operational</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-blue-400">Pro Plan Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
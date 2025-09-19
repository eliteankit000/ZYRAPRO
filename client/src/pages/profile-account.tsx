import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  User,
  Store,
  Globe,
  Lock,
  Edit3,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Settings,
  ArrowLeft,
  Upload,
  Languages
} from "lucide-react";

const profileUpdateSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  preferredLanguage: z.string().min(1, "Please select a language"),
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const storeConnectionSchema = z.object({
  platform: z.enum(["shopify", "woocommerce"]),
  storeName: z.string().min(1, "Store name is required"),
  storeUrl: z.string().url("Please enter a valid URL"),
  accessToken: z.string().min(1, "Access token is required"),
});

type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
type PasswordChange = z.infer<typeof passwordChangeSchema>;
type StoreConnection = z.infer<typeof storeConnectionSchema>;

interface UserProfileResponse {
  user?: {
    id: string;
    fullName: string;
    email: string;
    preferredLanguage: string;
    imageUrl?: string;
    plan: string;
    role: string;
  };
}

export default function ProfileAccount() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [storeDialogOpen, setStoreDialogOpen] = useState(false);

  // Fetch user profile data
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfileResponse>({
    queryKey: ['/api/me'],
    enabled: true
  });

  // Fetch connected stores
  const { data: connectedStores, isLoading: storesLoading } = useQuery({
    queryKey: ['/api/store-connections'],
    enabled: true
  });

  // Profile update form
  const profileForm = useForm<ProfileUpdate>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      fullName: "",
      email: "",
      preferredLanguage: "en",
    },
    values: userProfile?.user ? {
      fullName: userProfile.user.fullName,
      email: userProfile.user.email,
      preferredLanguage: userProfile.user.preferredLanguage,
    } : undefined
  });

  // Password change form
  const passwordForm = useForm<PasswordChange>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  });

  // Store connection form
  const storeForm = useForm<StoreConnection>({
    resolver: zodResolver(storeConnectionSchema),
    defaultValues: {
      platform: "shopify",
      storeName: "",
      storeUrl: "",
      accessToken: "",
    }
  });

  // Profile update mutation
  const profileUpdateMutation = useMutation({
    mutationFn: async (data: ProfileUpdate) => {
      const response = await apiRequest('PUT', '/api/profile', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  });

  // Password change mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordChange) => {
      const response = await apiRequest('PUT', '/api/change-password', data);
      return await response.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      setPasswordDialogOpen(false);
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    }
  });

  // Store connection mutation
  const storeConnectionMutation = useMutation({
    mutationFn: async (data: StoreConnection) => {
      const response = await apiRequest('POST', '/api/store-connections', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store-connections'] });
      storeForm.reset();
      setStoreDialogOpen(false);
      toast({
        title: "Store Connected",
        description: "Your store has been successfully connected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect store",
        variant: "destructive",
      });
    }
  });

  // Store disconnection mutation
  const disconnectStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      const response = await apiRequest('DELETE', `/api/store-connections/${storeId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/store-connections'] });
      toast({
        title: "Store Disconnected",
        description: "Store has been successfully disconnected.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect store",
        variant: "destructive",
      });
    }
  });

  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
    { value: "fr", label: "Français" },
    { value: "de", label: "Deutsch" },
    { value: "it", label: "Italiano" },
    { value: "pt", label: "Português" },
    { value: "zh", label: "中文" },
    { value: "ja", label: "日本語" },
    { value: "ko", label: "한국어" },
    { value: "ar", label: "العربية" },
  ];

  const ProfileSkeleton = () => (
    <Card className="bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl border-slate-700/50">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-1/2" />
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
            Profile & Account
          </h1>
          <p className="text-slate-300">
            Manage your personal information, connected stores, and preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card className="bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl border-slate-700/50" data-testid="card-profile-info">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-slate-800/50">
                <User className="w-6 h-6" style={{ color: '#C1E8FF' }} />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Profile Information</CardTitle>
                <CardDescription className="text-slate-300">
                  Update your personal details and preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-1/2" />
              </div>
            ) : (
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit((data) => profileUpdateMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="bg-slate-800/50 border-slate-600 text-white"
                            data-testid="input-full-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            className="bg-slate-800/50 border-slate-600 text-white"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="preferredLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Preferred Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white" data-testid="select-language">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={profileUpdateMutation.isPending}
                    className="w-full bg-[#C1E8FF] hover:bg-[#C1E8FF]/90 text-indigo-900 font-medium"
                    data-testid="button-update-profile"
                  >
                    {profileUpdateMutation.isPending ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl border-slate-700/50" data-testid="card-security">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-slate-800/50">
                <Lock className="w-6 h-6" style={{ color: '#C1E8FF' }} />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Security</CardTitle>
                <CardDescription className="text-slate-300">
                  Manage password and account security
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full border-slate-600 text-white hover:bg-slate-800/50"
                  data-testid="button-change-password"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Change Password</DialogTitle>
                  <DialogDescription className="text-slate-300">
                    Enter your current password and choose a new one.
                  </DialogDescription>
                </DialogHeader>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit((data) => passwordMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Current Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password"
                              className="bg-slate-800/50 border-slate-600 text-white"
                              data-testid="input-current-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">New Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password"
                              className="bg-slate-800/50 border-slate-600 text-white"
                              data-testid="input-new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Confirm New Password</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="password"
                              className="bg-slate-800/50 border-slate-600 text-white"
                              data-testid="input-confirm-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={passwordMutation.isPending}
                      className="w-full bg-[#C1E8FF] hover:bg-[#C1E8FF]/90 text-indigo-900 font-medium"
                      data-testid="button-submit-password"
                    >
                      {passwordMutation.isPending ? "Changing..." : "Change Password"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <div className="pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Two-Factor Authentication</p>
                  <p className="text-slate-400 text-sm">Add an extra layer of security</p>
                </div>
                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                  Coming Soon
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connected Stores */}
        <Card className="bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl border-slate-700/50 lg:col-span-2" data-testid="card-connected-stores">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-full bg-slate-800/50">
                  <Store className="w-6 h-6" style={{ color: '#C1E8FF' }} />
                </div>
                <div>
                  <CardTitle className="text-white text-xl">Connected Stores</CardTitle>
                  <CardDescription className="text-slate-300">
                    Manage your e-commerce store connections
                  </CardDescription>
                </div>
              </div>
              <Dialog open={storeDialogOpen} onOpenChange={setStoreDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#C1E8FF] hover:bg-[#C1E8FF]/90 text-indigo-900" data-testid="button-add-store">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Store
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-white">Connect New Store</DialogTitle>
                    <DialogDescription className="text-slate-300">
                      Add a new Shopify or WooCommerce store to your account.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...storeForm}>
                    <form onSubmit={storeForm.handleSubmit((data) => storeConnectionMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={storeForm.control}
                        name="platform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Platform</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white" data-testid="select-platform">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="shopify">Shopify</SelectItem>
                                <SelectItem value="woocommerce">WooCommerce</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="storeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Store Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-slate-800/50 border-slate-600 text-white"
                                placeholder="My Amazing Store"
                                data-testid="input-store-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="storeUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Store URL</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className="bg-slate-800/50 border-slate-600 text-white"
                                placeholder="https://mystore.shopify.com"
                                data-testid="input-store-url"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={storeForm.control}
                        name="accessToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Access Token</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="password"
                                className="bg-slate-800/50 border-slate-600 text-white"
                                placeholder="Enter your API access token"
                                data-testid="input-access-token"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={storeConnectionMutation.isPending}
                        className="w-full bg-[#C1E8FF] hover:bg-[#C1E8FF]/90 text-indigo-900 font-medium"
                        data-testid="button-connect-store"
                      >
                        {storeConnectionMutation.isPending ? "Connecting..." : "Connect Store"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {storesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="bg-slate-800/30 border-slate-700/50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="w-10 h-10 rounded" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="w-8 h-8" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : connectedStores && Array.isArray(connectedStores) && connectedStores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connectedStores.map((store: any) => (
                  <Card key={store.id} className="bg-slate-800/30 border-slate-700/50" data-testid={`store-card-${store.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded bg-slate-700/50">
                            <Store className="w-5 h-5" style={{ color: '#C1E8FF' }} />
                          </div>
                          <div>
                            <h4 className="text-white font-medium">{store.storeName}</h4>
                            <p className="text-slate-400 text-sm capitalize">{store.platform}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className={`w-2 h-2 rounded-full ${store.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                              <span className={`text-xs ${store.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                {store.status === 'active' ? 'Connected' : 'Disconnected'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => disconnectStoreMutation.mutate(store.id)}
                          disabled={disconnectStoreMutation.isPending}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          data-testid={`button-disconnect-${store.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Store className="w-12 h-12 mx-auto mb-4 text-slate-500" />
                <h3 className="text-white font-medium mb-2">No stores connected</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Connect your Shopify or WooCommerce store to get started
                </p>
                <Button 
                  onClick={() => setStoreDialogOpen(true)}
                  className="bg-[#C1E8FF] hover:bg-[#C1E8FF]/90 text-indigo-900"
                  data-testid="button-connect-first-store"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Connect Your First Store
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Language & Localization */}
        <Card className="bg-gradient-to-br from-[#021024] to-[#052659] rounded-2xl border-slate-700/50 lg:col-span-2" data-testid="card-localization">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-full bg-slate-800/50">
                <Languages className="w-6 h-6" style={{ color: '#C1E8FF' }} />
              </div>
              <div>
                <CardTitle className="text-white text-xl">Language & Localization</CardTitle>
                <CardDescription className="text-slate-300">
                  Configure multi-language support and AI auto-translation
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Current Language</h4>
                  <p className="text-slate-400 text-sm">
                    Your interface is displayed in {languages.find(l => l.value === (userProfile?.user?.preferredLanguage || 'en'))?.label || 'English'}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Auto-translate AI outputs</p>
                      <p className="text-slate-400 text-sm">Automatically translate AI-generated content</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-auto-translate" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Multi-language product descriptions</p>
                      <p className="text-slate-400 text-sm">Generate descriptions in multiple languages</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-multi-language" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-medium mb-2">Supported Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {languages.slice(0, 6).map((lang) => (
                      <Badge 
                        key={lang.value} 
                        variant="secondary" 
                        className="bg-blue-500/20 text-blue-400 text-xs"
                      >
                        {lang.label}
                      </Badge>
                    ))}
                    <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                      +4 more
                    </Badge>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">AI Translation Ready</span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Your account is configured for automatic translation using advanced AI models.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
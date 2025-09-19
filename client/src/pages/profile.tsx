import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, 
  Lock, 
  Store, 
  Globe, 
  Camera, 
  Settings, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  Trash2
} from "lucide-react";

const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const connectStoreSchema = z.object({
  platform: z.enum(["shopify", "woocommerce"]),
  storeName: z.string().min(1, "Store name is required"),
  storeUrl: z.string().url("Invalid store URL"),
  accessToken: z.string().min(1, "Access token is required"),
});

export default function ProfilePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch current user data
  const { data: user } = useQuery<any>({
    queryKey: ["/api/me"],
  });

  // Fetch store connections
  const { data: storeConnections = [] } = useQuery<any[]>({
    queryKey: ["/api/store-connections"],
  });

  // Profile update form
  const profileForm = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
    },
    values: {
      fullName: user?.fullName || "",
      email: user?.email || "",
    },
  });

  // Password change form
  const passwordForm = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Store connection form
  const storeForm = useForm({
    resolver: zodResolver(connectStoreSchema),
    defaultValues: {
      platform: "shopify" as const,
      storeName: "",
      storeUrl: "",
      accessToken: "",
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Success", description: "Profile updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", "/api/change-password", data);
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: "Success", description: "Password changed successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });

  // Store connection mutation
  const connectStoreMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/store-connections", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-connections"] });
      storeForm.reset();
      toast({ title: "Success", description: "Store connected successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to connect store",
        variant: "destructive",
      });
    },
  });

  // Language update mutation
  const updateLanguageMutation = useMutation({
    mutationFn: async (language: string) => {
      return await apiRequest("PUT", "/api/language", { preferredLanguage: language });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Success", description: "Language preference updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update language",
        variant: "destructive",
      });
    },
  });

  // Profile image upload mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      return await apiRequest("POST", "/api/upload-profile-image", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Success", description: "Profile image updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    },
  });

  // Disconnect store mutation
  const disconnectStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      return await apiRequest("DELETE", `/api/store-connections/${storeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/store-connections"] });
      toast({ title: "Success", description: "Store disconnected successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect store",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Error",
          description: "Image size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      uploadImageMutation.mutate(file);
    }
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "pt", name: "Portuguese" },
    { code: "zh", name: "Chinese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#021024] to-[#052659] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Profile Settings
            </h1>
            <p className="text-slate-300 text-sm sm:text-base">
              Manage your account information, connected stores, and preferences
            </p>
          </div>

          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-[#031a3c] border border-slate-700">
              <TabsTrigger value="general" className="flex items-center space-x-2 data-[state=active]:bg-slate-700 bg-[#c1e8ff] text-[#000000]">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="password" className="flex items-center space-x-2 data-[state=active]:bg-slate-700">
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Password</span>
              </TabsTrigger>
              <TabsTrigger value="stores" className="flex items-center space-x-2 data-[state=active]:bg-slate-700">
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline">Stores</span>
              </TabsTrigger>
              <TabsTrigger value="language" className="flex items-center space-x-2 data-[state=active]:bg-slate-700">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Language</span>
              </TabsTrigger>
            </TabsList>

            {/* General Info Tab */}
            <TabsContent value="general">
              <Card className="bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>General Information</span>
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Update your personal information and profile image
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Image */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                      <AvatarFallback className="text-lg bg-slate-700 text-white">
                        {user?.fullName?.slice(0, 2).toUpperCase() || "US"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadImageMutation.isPending}
                        className="bg-[#C1E8FF] text-[#052659] hover:bg-[#A8DCFF]"
                        data-testid="button-upload-image"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {uploadImageMutation.isPending ? "Uploading..." : "Change Photo"}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        data-testid="input-file-upload"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        JPG, PNG up to 5MB
                      </p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <Form {...profileForm}>
                    <form 
                      onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))}
                      className="space-y-4"
                    >
                      <FormField
                        control={profileForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Full Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-slate-800 border-slate-600 text-white"
                                placeholder="Enter your full name"
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
                                className="bg-slate-800 border-slate-600 text-white"
                                placeholder="Enter your email"
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="bg-[#C1E8FF] text-[#052659] hover:bg-[#A8DCFF]"
                        data-testid="button-save-profile"
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Password Tab */}
            <TabsContent value="password">
              <Card className="bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Lock className="w-5 h-5" />
                    <span>Change Password</span>
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form 
                      onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))}
                      className="space-y-4"
                    >
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-white">Current Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showCurrentPassword ? "text" : "password"}
                                  className="bg-slate-800 border-slate-600 text-white pr-10"
                                  placeholder="Enter current password"
                                  data-testid="input-current-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                  {showCurrentPassword ? (
                                    <EyeOff className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-slate-400" />
                                  )}
                                </Button>
                              </div>
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
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showNewPassword ? "text" : "password"}
                                  className="bg-slate-800 border-slate-600 text-white pr-10"
                                  placeholder="Enter new password"
                                  data-testid="input-new-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-slate-400" />
                                  )}
                                </Button>
                              </div>
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
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showConfirmPassword ? "text" : "password"}
                                  className="bg-slate-800 border-slate-600 text-white pr-10"
                                  placeholder="Confirm new password"
                                  data-testid="input-confirm-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-slate-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-slate-400" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={changePasswordMutation.isPending}
                        className="bg-[#C1E8FF] text-[#052659] hover:bg-[#A8DCFF]"
                        data-testid="button-change-password"
                      >
                        {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stores Tab */}
            <TabsContent value="stores">
              <div className="space-y-6">
                {/* Connected Stores */}
                <Card className="bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-2">
                      <Store className="w-5 h-5" />
                      <span>Connected Stores</span>
                    </CardTitle>
                    <CardDescription className="text-slate-300">
                      Manage your connected e-commerce platforms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {storeConnections.length > 0 ? (
                      <div className="space-y-4">
                        {storeConnections.map((store: any) => (
                          <div
                            key={store.id}
                            className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-600"
                            data-testid={`store-connection-${store.id}`}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                                <Store className="w-5 h-5 text-[#C1E8FF]" />
                              </div>
                              <div>
                                <h3 className="text-white font-medium">{store.storeName}</h3>
                                <p className="text-slate-400 text-sm capitalize">{store.platform}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={store.status === "active" ? "default" : "destructive"}
                                className={store.status === "active" ? "bg-green-500/20 text-green-400" : ""}
                              >
                                {store.status === "active" ? (
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                )}
                                {store.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => disconnectStoreMutation.mutate(store.id)}
                                disabled={disconnectStoreMutation.isPending}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                data-testid={`button-disconnect-${store.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-center py-8">
                        No stores connected yet. Add your first store below.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Connect New Store */}
                <Card className="bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Connect New Store</CardTitle>
                    <CardDescription className="text-slate-300">
                      Add a new Shopify or WooCommerce store to sync with Zyra
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...storeForm}>
                      <form 
                        onSubmit={storeForm.handleSubmit((data) => connectStoreMutation.mutate(data))}
                        className="space-y-4"
                      >
                        <FormField
                          control={storeForm.control}
                          name="platform"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Platform</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-platform">
                                    <SelectValue placeholder="Select platform" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-slate-800 border-slate-600">
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
                                  className="bg-slate-800 border-slate-600 text-white"
                                  placeholder="My Store"
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
                                  type="url"
                                  className="bg-slate-800 border-slate-600 text-white"
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
                                  className="bg-slate-800 border-slate-600 text-white"
                                  placeholder="Enter your access token"
                                  data-testid="input-access-token"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          disabled={connectStoreMutation.isPending}
                          className="bg-[#C1E8FF] text-[#052659] hover:bg-[#A8DCFF]"
                          data-testid="button-connect-store"
                        >
                          {connectStoreMutation.isPending ? "Connecting..." : "Connect Store"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Language Tab */}
            <TabsContent value="language">
              <Card className="bg-gradient-to-br from-[#021024] to-[#052659] border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <span>Language Preferences</span>
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Choose your preferred language for the interface
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Label className="text-white">Preferred Language</Label>
                    <Select
                      value={user?.preferredLanguage || "en"}
                      onValueChange={(value) => updateLanguageMutation.mutate(value)}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600 text-white" data-testid="select-language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {updateLanguageMutation.isPending && (
                      <p className="text-slate-400 text-sm">Updating language preference...</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Zap, 
  Copy, 
  TrendingUp, 
  Search, 
  Heart, 
  Upload, 
  Wand2,
  Package,
  Target,
  ImageIcon,
  Palette,
  Brain,
  Camera,
  FlaskConical,
  RefreshCw,
  Sparkles,
  FileText,
  BarChart3
} from "lucide-react";

interface GenerateForm {
  productName: string;
  category: string;
  features: string;
  audience: string;
}

interface GeneratedResult {
  sales?: string;
  seo?: string;
  casual?: string;
}

export default function AITools() {
  const { toast } = useToast();
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [brandVoice, setBrandVoice] = useState("sales");
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult>({});

  const form = useForm<GenerateForm>({
    defaultValues: {
      productName: "",
      category: "Electronics",
      features: "",
      audience: "General consumers",
    },
  });

  // Mock mutation for AI generation (placeholder for MVP)
  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response based on tool type
      const mockResponses = {
        'product-descriptions': {
          description: `Experience premium quality with our ${data.productName}. ${data.features ? `Featuring ${data.features}, ` : ''}this product delivers exceptional value for ${data.audience}.`
        },
        'bulk-optimization': {
          message: `Successfully optimized ${Math.floor(Math.random() * 50) + 20} products with improved SEO scores and conversion rates.`
        },
        'seo-titles': {
          title: `${data.productName} - Premium Quality & Fast Shipping | YourStore`,
          meta: `Shop ${data.productName} with confidence. ${data.features} Perfect for ${data.audience}. Free shipping on orders over $50.`
        },
        'image-alt-text': {
          altText: `High-quality ${data.productName} showing ${data.features} in professional studio lighting`
        }
      };
      
      return mockResponses[data.toolId as keyof typeof mockResponses] || { message: 'AI processing completed successfully!' };
    },
    onSuccess: (result, variables) => {
      if (variables.toolId === 'product-descriptions' && 'description' in result) {
        setGeneratedResults(prev => ({
          ...prev,
          [variables.brandVoice || 'sales']: result.description,
        }));
      }
      
      toast({
        title: "AI Processing Complete!",
        description: `${getToolById(variables.toolId)?.title} completed successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process with AI",
        variant: "destructive",
      });
    },
  });

  const aiTools = [
    {
      id: 'product-descriptions',
      title: 'Smart Product Descriptions',
      description: 'AI generates compelling descriptions in 3 styles: Sales, SEO, and Casual',
      icon: <FileText className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      category: 'existing',
      gradient: 'from-blue-500 to-cyan-400',
      actionText: 'Generate Descriptions',
      comingSoon: false
    },
    {
      id: 'bulk-optimization',
      title: 'Bulk Optimization',
      description: 'Optimize 20-100+ products in one go with AI-powered enhancements',
      icon: <Package className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      category: 'existing', 
      gradient: 'from-green-500 to-emerald-400',
      actionText: 'Start Bulk Process',
      comingSoon: false
    },
    {
      id: 'seo-titles',
      title: 'SEO Titles & Meta Tags',
      description: 'Keyword-rich, AI-crafted titles and meta descriptions for better search rankings',
      icon: <Search className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      category: 'existing',
      gradient: 'from-purple-500 to-violet-400', 
      actionText: 'Generate SEO',
      comingSoon: false
    },
    {
      id: 'image-alt-text',
      title: 'AI Image Alt-Text',
      description: 'Auto-generate alt-text for accessibility and SEO optimization',
      icon: <ImageIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      category: 'existing',
      gradient: 'from-orange-500 to-yellow-400',
      actionText: 'Process Images',
      comingSoon: false
    },
    {
      id: 'dynamic-templates',
      title: 'Dynamic Templates',
      description: 'Pre-built tones: Luxury, Gen Z, Eco, Minimalist, and more',
      icon: <Palette className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      category: 'new',
      gradient: 'from-pink-500 to-rose-400',
      actionText: 'Choose Template',
      comingSoon: true
    },
    {
      id: 'brand-voice',
      title: 'Brand Voice Memory',
      description: 'Set your brand tone once, Zyra applies it everywhere automatically',
      icon: <Brain className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      category: 'new',
      gradient: 'from-indigo-500 to-blue-400',
      actionText: 'Setup Voice',
      comingSoon: true
    },
    {
      id: 'multimodal-ai',
      title: 'Multimodal AI',
      description: 'Upload product images + tags for richer, more accurate copy generation',
      icon: <Camera className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />,
      category: 'new',
      gradient: 'from-teal-500 to-cyan-400',
      actionText: 'Upload & Generate',
      comingSoon: true
    },
    {
      id: 'ab-testing',
      title: 'A/B Testing Copy',
      description: 'Auto-generate multiple versions, track CTR/conversions, keep the winner',
      icon: <FlaskConical className="w-8 h-8" />,
      category: 'new',
      gradient: 'from-red-500 to-pink-400',
      actionText: 'Start A/B Test',
      comingSoon: true
    },
    {
      id: 'scheduled-refresh',
      title: 'Scheduled Refresh',
      description: 'Auto-update SEO/descriptions every 3-6 months for content freshness',
      icon: <RefreshCw className="w-8 h-8" />,
      category: 'new',
      gradient: 'from-violet-500 to-purple-400',
      actionText: 'Schedule Updates',
      comingSoon: true
    }
  ];

  const getToolById = (id: string) => aiTools.find(tool => tool.id === id);

  const handleToolAction = (toolId: string) => {
    const tool = getToolById(toolId);
    
    if (tool?.comingSoon) {
      toast({
        title: "Coming Soon!",
        description: `${tool.title} will be available in a future update.`,
      });
      return;
    }

    if (toolId === 'product-descriptions') {
      setActiveToolId(toolId);
    } else {
      // For other tools, simulate processing
      generateMutation.mutate({ 
        toolId,
        productName: form.getValues("productName") || "Sample Product",
        features: form.getValues("features") || "premium features",
        audience: form.getValues("audience") || "general consumers"
      });
    }
  };

  const onSubmit = (data: GenerateForm) => {
    generateMutation.mutate({ ...data, brandVoice, toolId: 'product-descriptions' });
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${type} description copied to clipboard.`,
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const voiceButtons = [
    { id: "sales", label: "Sales", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "seo", label: "SEO", icon: <Search className="w-4 h-4" /> },
    { id: "casual", label: "Casual", icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* AI Tools Hub Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            AI Tools Hub
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Supercharge your e-commerce with AI-powered content generation, optimization, and automation
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {aiTools.map((tool) => (
          <Card 
            key={tool.id} 
            className="group relative overflow-hidden border-0 bg-gradient-to-br from-[#021024] via-[#052659] to-[#021024] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            data-testid={`card-${tool.id}`}
          >
            <div className="h-full p-6 space-y-4">
              <CardHeader className="p-0">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-[#C1E8FF]">
                      {tool.icon}
                    </div>
                    <CardTitle className="text-xl font-semibold text-white">
                      {tool.title}
                    </CardTitle>
                  </div>
                  {tool.comingSoon && (
                    <Badge className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded-full hover:bg-slate-700">
                      Coming Soon
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-slate-300 text-sm leading-relaxed">
                  {tool.description}
                </CardDescription>
              </CardHeader>
              
              <Button
                onClick={() => handleToolAction(tool.id)}
                disabled={generateMutation.isPending || tool.comingSoon}
                className={`w-full transition-all duration-200 border-0 font-medium ${
                  tool.comingSoon 
                    ? 'bg-black text-white opacity-50 cursor-not-allowed' 
                    : 'bg-[#C1E8FF] text-[#052659] hover:shadow-lg hover:scale-105 active:scale-95'
                }`}
                data-testid={`button-${tool.id}`}
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {generateMutation.isPending && activeToolId === tool.id 
                  ? 'Processing...' 
                  : tool.actionText
                }
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Product Description Generator Form (when active) */}
      {activeToolId === 'product-descriptions' && (
        <Card className="border-2 border-primary/20 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <FileText className="w-6 h-6 mr-2 text-primary" />
              Smart Product Description Generator
            </CardTitle>
            <CardDescription>
              Generate compelling product descriptions in multiple AI-powered styles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input
                      id="productName"
                      className="mt-2"
                      placeholder="e.g., Wireless Bluetooth Headphones"
                      {...form.register("productName", { required: true })}
                      data-testid="input-product-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Product Category</Label>
                    <Select 
                      value={form.watch("category")} 
                      onValueChange={(value) => form.setValue("category", value)}
                    >
                      <SelectTrigger className="mt-2" data-testid="select-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Clothing & Accessories">Clothing & Accessories</SelectItem>
                        <SelectItem value="Home & Garden">Home & Garden</SelectItem>
                        <SelectItem value="Sports & Outdoors">Sports & Outdoors</SelectItem>
                        <SelectItem value="Beauty & Health">Beauty & Health</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="features">Key Features (comma-separated)</Label>
                    <Textarea
                      id="features"
                      className="mt-2 h-24 resize-none"
                      placeholder="e.g., Noise cancelling, 30-hour battery, wireless charging"
                      {...form.register("features")}
                      data-testid="textarea-features"
                    />
                  </div>

                  <div>
                    <Label htmlFor="audience">Target Audience</Label>
                    <Select 
                      value={form.watch("audience")} 
                      onValueChange={(value) => form.setValue("audience", value)}
                    >
                      <SelectTrigger className="mt-2" data-testid="select-audience">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="General consumers">General consumers</SelectItem>
                        <SelectItem value="Tech enthusiasts">Tech enthusiasts</SelectItem>
                        <SelectItem value="Business professionals">Business professionals</SelectItem>
                        <SelectItem value="Athletes & fitness enthusiasts">Athletes & fitness enthusiasts</SelectItem>
                        <SelectItem value="Students">Students</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Brand Voice</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {voiceButtons.map((voice) => (
                        <Button
                          key={voice.id}
                          type="button"
                          onClick={() => setBrandVoice(voice.id)}
                          className={brandVoice === voice.id ? "bg-primary text-primary-foreground" : ""}
                          variant={brandVoice === voice.id ? "default" : "outline"}
                          data-testid={`button-voice-${voice.id}`}
                        >
                          {voice.icon}
                          <span className="ml-2">{voice.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-blue-400 hover:shadow-lg"
                    disabled={generateMutation.isPending}
                    data-testid="button-generate"
                  >
                    {generateMutation.isPending ? (
                      <>Generating...</>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Generate Descriptions
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Product Image Upload */}
              <div>
                <Label>Product Image (Optional)</Label>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer mt-2"
                  data-testid="upload-area"
                >
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Drag & drop your image here</p>
                  <p className="text-sm text-muted-foreground">or click to browse</p>
                  <input type="file" accept="image/*" className="hidden" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Results */}
      {Object.keys(generatedResults).length > 0 && (
        <div className="space-y-6">
          {generatedResults.sales && (
            <Card className="border-2 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                    Sales Style
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(generatedResults.sales!, "Sales")}
                      data-testid="button-copy-sales"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-400 text-white" data-testid="button-use-sales">
                      Use This
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-foreground leading-relaxed" data-testid="text-sales-result">
                    {generatedResults.sales}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {generatedResults.seo && (
            <Card className="border-2 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Search className="w-5 h-5 text-blue-600 mr-2" />
                    SEO Style
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(generatedResults.seo!, "SEO")}
                      data-testid="button-copy-seo"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-400 text-white" data-testid="button-use-seo">
                      Use This
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-foreground leading-relaxed" data-testid="text-seo-result">
                    {generatedResults.seo}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {generatedResults.casual && (
            <Card className="border-2 border-pink-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center">
                    <Heart className="w-5 h-5 text-pink-600 mr-2" />
                    Casual Style
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(generatedResults.casual!, "Casual")}
                      data-testid="button-copy-casual"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button className="bg-gradient-to-r from-pink-500 to-rose-400 text-white" data-testid="button-use-casual">
                      Use This
                    </Button>
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-foreground leading-relaxed" data-testid="text-casual-result">
                    {generatedResults.casual}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Close Tool */}
      {activeToolId && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setActiveToolId(null)}
            data-testid="button-close-tool"
          >
            Close Tool
          </Button>
        </div>
      )}
    </div>
  );
}
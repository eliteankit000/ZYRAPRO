import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  Download, 
  Share, 
  Brain, 
  RotateCcw,
  FileSpreadsheet,
  Package,
  TrendingUp
} from "lucide-react";

interface AutomationTool {
  id: string;
  title: string;
  description: string;
  icon: JSX.Element;
  category: 'existing' | 'new';
  actionText: string;
  comingSoon: boolean;
  tooltip: string;
}

export default function AutomationTools() {
  const { toast } = useToast();

  const automationTools: AutomationTool[] = [
    {
      id: 'csv-import-export',
      title: 'CSV Import/Export',
      description: 'Upload or download CSV files for bulk product management and data synchronization',
      icon: <FileSpreadsheet className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" style={{ color: '#C1E8FF' }} />,
      category: 'existing',
      actionText: 'Upload CSV / Export CSV',
      comingSoon: false,
      tooltip: 'Bulk upload products from CSV or export your existing products for external management'
    },
    {
      id: 'shopify-publish',
      title: 'One-Click Shopify Publish',
      description: 'Push optimized product copy directly to your Shopify store listings instantly',
      icon: <Share className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" style={{ color: '#C1E8FF' }} />,
      category: 'existing', 
      actionText: 'Publish to Shopify',
      comingSoon: false,
      tooltip: 'Automatically sync your optimized product descriptions to Shopify with a single click'
    },
    {
      id: 'bulk-suggestions',
      title: 'Smart Bulk Suggestions',
      description: 'AI scans products with low CTR/SEO performance and auto-suggests improvements',
      icon: <Brain className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" style={{ color: '#C1E8FF' }} />,
      category: 'new',
      actionText: 'Run Suggestions',
      comingSoon: true,
      tooltip: 'Let AI analyze your product performance and automatically suggest title, description, and tag improvements'
    },
    {
      id: 'rollback-changes',
      title: 'Rollback Button',
      description: 'Instantly undo recent changes to restore previous versions and ensure data safety',
      icon: <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" style={{ color: '#C1E8FF' }} />,
      category: 'new',
      actionText: 'Rollback Changes',
      comingSoon: true,
      tooltip: 'One-click rollback to previous versions of your product data for peace of mind'
    }
  ];

  // Mock mutation for automation actions
  const automationMutation = useMutation({
    mutationFn: async (data: { toolId: string; action: string }) => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockResponses = {
        'csv-import-export': {
          message: `Successfully processed CSV file. ${Math.floor(Math.random() * 100) + 50} products updated.`
        },
        'shopify-publish': {
          message: `Published ${Math.floor(Math.random() * 25) + 10} optimized products to your Shopify store.`
        },
        'bulk-suggestions': {
          message: `Generated smart suggestions for ${Math.floor(Math.random() * 30) + 15} products needing optimization.`
        },
        'rollback-changes': {
          message: `Successfully rolled back to previous version. All changes from the last 24 hours have been restored.`
        }
      };

      return mockResponses[data.toolId as keyof typeof mockResponses] || { message: 'Action completed successfully.' };
    },
    onSuccess: (data) => {
      toast({
        title: "Success!",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete automation action. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToolAction = (toolId: string) => {
    const tool = automationTools.find(t => t.id === toolId);
    
    if (tool?.comingSoon) {
      toast({
        title: "Coming Soon!",
        description: `${tool.title} will be available in a future update.`,
      });
      return;
    }

    // Handle CSV Import/Export with file operations
    if (toolId === 'csv-import-export') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          automationMutation.mutate({ 
            toolId, 
            action: `import-${file.name}` 
          });
        }
      };
      input.click();
      return;
    }

    // For other tools, simulate the action
    automationMutation.mutate({ 
      toolId,
      action: tool?.actionText || 'execute'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">Automation Tools</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Streamline your workflow with powerful automation features for bulk operations and intelligent optimizations.
        </p>
      </div>

      {/* Automation Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {automationTools.map((tool) => (
          <Card 
            key={tool.id} 
            className="relative bg-gradient-to-br from-[#021024] via-[#052659] to-[#021024] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border-slate-700/50"
            data-testid={`card-automation-${tool.id}`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {tool.icon}
                  <CardTitle className="text-white font-semibold text-sm sm:text-base lg:text-lg" data-testid={`text-title-${tool.id}`}>
                    {tool.title}
                  </CardTitle>
                </div>
                {tool.comingSoon && (
                  <Badge 
                    variant="secondary" 
                    className="bg-slate-700 text-slate-200 text-xs px-2 py-1 rounded-full"
                    data-testid={`badge-coming-soon-${tool.id}`}
                  >
                    Coming Soon
                  </Badge>
                )}
              </div>
              <CardDescription className="text-slate-300 mt-2" data-testid={`text-description-${tool.id}`}>
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                onClick={() => handleToolAction(tool.id)}
                disabled={tool.comingSoon || automationMutation.isPending}
                className={`w-full ${
                  tool.comingSoon
                    ? "bg-black hover:bg-black text-white"
                    : "bg-[#C1E8FF] hover:bg-[#A8DCFF] text-[#052659] hover:shadow-lg"
                } transition-all duration-300`}
                data-testid={`button-action-${tool.id}`}
                title={tool.tooltip}
              >
                {automationMutation.isPending ? "Processing..." : tool.actionText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-8 p-6 bg-gradient-to-br from-[#021024] via-[#052659] to-[#021024] rounded-xl border border-slate-700/50">
        <div className="flex items-start space-x-4">
          <TrendingUp className="w-6 h-6 text-[#C1E8FF] mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-white font-semibold mb-2">Automation Benefits</h3>
            <p className="text-slate-300 text-sm">
              Save hours of manual work with intelligent bulk operations. Process hundreds of products, 
              sync with Shopify, and get AI-powered optimization suggestions to maximize your store's performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Types for real-time dashboard data
export interface DashboardData {
  user: any;
  profile: any;
  usageStats: UsageStats | null;
  activityLogs: any[];
  toolsAccess: any[];
  realtimeMetrics: any[];
}

export interface UsageStats {
  totalRevenue: number;
  totalOrders: number;
  conversionRate: number;
  cartRecoveryRate: number;
  productsOptimized: number;
  emailsSent: number;
  smsSent: number;
  aiGenerationsUsed: number;
  seoOptimizationsUsed: number;
  lastUpdated: string;
}

// Main dashboard hook with real-time capabilities
export function useDashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout>();

  // Fetch comprehensive dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    enabled: true,
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 5000, // Poll every 5 seconds
    refetchIntervalInBackground: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Initialize user real-time data
  const initializeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/dashboard/initialize");
    },
    onSuccess: () => {
      setIsInitialized(true);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Dashboard Ready",
        description: "Real-time data has been initialized successfully",
      });
    },
    onError: (error: any) => {
      console.error("Dashboard initialization failed:", error);
      toast({
        title: "Initialization Failed",
        description: "Failed to initialize real-time data",
        variant: "destructive",
      });
    },
  });

  // Track tool access with optimistic updates
  const trackToolAccessMutation = useMutation({
    mutationFn: async (toolName: string) => {
      return apiRequest("POST", "/api/dashboard/track-tool-access", {
        toolName,
      });
    },
    onMutate: async (toolName) => {
      // Optimistic update
      const queryKey = ["/api/dashboard"];
      const previousData = queryClient.getQueryData<DashboardData>(queryKey);

      if (previousData) {
        queryClient.setQueryData<DashboardData>(queryKey, {
          ...previousData,
          toolsAccess: previousData.toolsAccess.map((tool) =>
            tool.toolName === toolName
              ? { ...tool, accessCount: tool.accessCount + 1, lastAccessed: new Date().toISOString() }
              : tool
          ),
        });
      }

      return { previousData };
    },
    onError: (error, toolName, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(["/api/dashboard"], context.previousData);
      }
      console.error("Tool access tracking failed:", error);
    },
    onSuccess: () => {
      // Refetch to get server state
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });

  // Log activity
  const logActivityMutation = useMutation({
    mutationFn: async (activityData: {
      action: string;
      description: string;
      toolUsed?: string;
      metadata?: any;
    }) => {
      return apiRequest("POST", "/api/dashboard/log-activity", activityData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });

  // Update usage stats
  const updateUsageMutation = useMutation({
    mutationFn: async (data: { statField: string; increment?: number }) => {
      return apiRequest("POST", "/api/dashboard/update-usage", data);
    },
    onMutate: async ({ statField, increment = 1 }) => {
      // Optimistic update
      const queryKey = ["/api/dashboard"];
      const previousData = queryClient.getQueryData<DashboardData>(queryKey);

      if (previousData?.usageStats) {
        const updatedStats = {
          ...previousData.usageStats,
          [statField]: ((previousData.usageStats as any)[statField] || 0) + increment,
          lastUpdated: new Date().toISOString(),
        };

        queryClient.setQueryData<DashboardData>(queryKey, {
          ...previousData,
          usageStats: updatedStats,
        });
      }

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(["/api/dashboard"], context.previousData);
      }
      console.error("Usage stats update failed:", error);
    },
    onSuccess: () => {
      setLastUpdate(Date.now());
    },
  });

  // Refresh metrics (generate new sample data)
  const refreshMetricsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/dashboard/refresh-metrics");
    },
    onSuccess: (data: any) => {
      if (data.dashboardData) {
        queryClient.setQueryData(["/api/dashboard"], data.dashboardData);
      }
      toast({
        title: "Metrics Refreshed",
        description: "Real-time metrics have been updated",
      });
    },
  });

  // Initialize dashboard on first load
  useEffect(() => {
    if (!isInitialized && !initializeMutation.isPending) {
      initializeMutation.mutate();
    }
  }, [isInitialized, initializeMutation]);

  // Comprehensive refresh functionality with loading states and error handling
  const refreshMutation = useMutation({
    mutationFn: async () => {
      // Force fresh data fetch by invalidating all cache
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      
      // Fetch fresh data
      const response = await refetch();
      return response.data;
    },
    onMutate: () => {
      setIsRefreshing(true);
    },
    onSuccess: (data) => {
      setLastUpdate(Date.now());
      toast({
        title: "✅ Data refreshed successfully!",
        description: "All dashboard data has been updated with the latest information.",
        duration: 3000,
      });
    },
    onError: (error: any) => {
      console.error("Refresh failed:", error);
      toast({
        title: "❌ Refresh failed, try again.",
        description: "Unable to fetch fresh data. Please check your connection and try again.",
        variant: "destructive",
        duration: 4000,
      });
    },
    onSettled: () => {
      setIsRefreshing(false);
    }
  });

  // Manual refresh function with comprehensive functionality
  const refreshDashboard = useCallback(() => {
    refreshMutation.mutate();
  }, [refreshMutation]);

  // Track tool access with optimistic UI
  const trackToolAccess = useCallback(
    (toolName: string) => {
      trackToolAccessMutation.mutate(toolName);
    },
    [trackToolAccessMutation]
  );

  // Log user activity
  const logActivity = useCallback(
    (action: string, description: string, toolUsed?: string, metadata?: any) => {
      logActivityMutation.mutate({ action, description, toolUsed, metadata });
    },
    [logActivityMutation]
  );

  // Update usage statistics
  const updateUsageStats = useCallback(
    (statField: string, increment = 1) => {
      updateUsageMutation.mutate({ statField, increment });
    },
    [updateUsageMutation]
  );

  // Generate formatted stats for display
  const formattedStats = dashboardData?.usageStats
    ? [
        {
          icon: "TrendingUp",
          title: "Total Revenue",
          value: `$${Math.floor((dashboardData.usageStats.totalRevenue || 0) / 100).toLocaleString()}`,
          change: "+12.5%",
          positive: true,
        },
        {
          icon: "ShoppingCart",
          title: "Orders",
          value: (dashboardData.usageStats.totalOrders || 0).toLocaleString(),
          change: "+8.2%",
          positive: true,
        },
        {
          icon: "Eye",
          title: "Conversion Rate",
          value: `${((dashboardData.usageStats.conversionRate || 0) / 100).toFixed(1)}%`,
          change: "+2.1%",
          positive: true,
        },
        {
          icon: "RotateCcw",
          title: "Cart Recovery",
          value: `${Math.floor((dashboardData.usageStats.cartRecoveryRate || 0) / 100)}%`,
          change: "+15.3%",
          positive: true,
        },
      ]
    : [];

  return {
    // Data
    dashboardData,
    formattedStats,
    isLoading,
    error,
    isInitialized,
    lastUpdate,

    // Actions
    refreshDashboard,
    trackToolAccess,
    logActivity,
    updateUsageStats,
    refreshMetrics: refreshMetricsMutation.mutate,

    // Loading states
    isInitializing: initializeMutation.isPending,
    isTrackingTool: trackToolAccessMutation.isPending,
    isLoggingActivity: logActivityMutation.isPending,
    isUpdatingUsage: updateUsageMutation.isPending,
    isRefreshingMetrics: refreshMetricsMutation.isPending,
    isRefreshing,
  };
}

// Hook for skeleton loading states
export function useSkeletonLoader(isLoading: boolean, delay = 300) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading) {
      timer = setTimeout(() => {
        setShowSkeleton(true);
      }, delay);
    } else {
      setShowSkeleton(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isLoading, delay]);

  return showSkeleton;
}

// Hook for optimistic UI updates
export function useOptimisticAction<T extends any[], R>(
  action: (...args: T) => Promise<R>,
  optimisticUpdate?: (...args: T) => void,
  onError?: (error: any, ...args: T) => void
) {
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback(
    async (...args: T): Promise<R | null> => {
      setIsPending(true);

      // Apply optimistic update immediately
      if (optimisticUpdate) {
        optimisticUpdate(...args);
      }

      try {
        const result = await action(...args);
        setIsPending(false);
        return result;
      } catch (error) {
        setIsPending(false);
        if (onError) {
          onError(error, ...args);
        }
        return null;
      }
    },
    [action, optimisticUpdate, onError]
  );

  return { execute, isPending };
}

// Hook for real-time data synchronization
export function useRealtimeSync(intervalMs = 5000) {
  const queryClient = useQueryClient();
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      // Invalidate dashboard queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setLastSync(new Date());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [queryClient, intervalMs]);

  return { lastSync };
}

// Hook for connection status monitoring
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnline, setLastOnline] = useState<Date>(new Date());

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, lastOnline };
}
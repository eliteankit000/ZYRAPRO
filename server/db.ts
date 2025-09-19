import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, and, gte, lt } from "drizzle-orm";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import {
  users,
  profiles,
  sessions,
  subscriptionPlans,
  subscriptions,
  usageStats,
  activityLogs,
  toolsAccess,
  realtimeMetrics,
  type User,
  type InsertUser,
  type Profile,
  type InsertProfile,
  type Session,
  type InsertSession,
  type SubscriptionPlan,
  type InsertSubscriptionPlan,
  type Subscription,
  type UsageStats,
  type InsertUsageStats,
  type ActivityLog,
  type InsertActivityLog,
  type ToolsAccess,
  type InsertToolsAccess,
  type RealtimeMetrics,
  type InsertRealtimeMetrics
} from "@shared/schema";

// Database connection
let db: any;
let pool: Pool;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  db = drizzle(pool);
} else {
  console.warn("DATABASE_URL not found. Database operations will fail.");
}

// Error handling wrapper
async function withErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    if (!db) {
      throw new Error("Database connection not configured. Please check DATABASE_URL.");
    }
    console.log(`[DB] Starting operation: ${operationName}`);
    const result = await operation();
    console.log(`[DB] Operation completed successfully: ${operationName}`);
    return result;
  } catch (error) {
    console.error(`[DB] Error in ${operationName}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Database operation failed: ${operationName} - ${errorMessage}`);
  }
}

// User operations
export async function createUser(userData: InsertUser): Promise<User> {
  return withErrorHandling(async () => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db.insert(users).values({
      ...userData,
      password: hashedPassword,
    }).returning();
    
    // Auto-create profile for user
    await db.insert(profiles).values({
      userId: user.id,
      name: userData.fullName,
    });
    
    console.log(`[DB] User created with ID: ${user.id}`);
    return user;
  }, "createUser");
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return withErrorHandling(async () => {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }, "getUserByEmail");
}

export async function getUserById(userId: string): Promise<User | undefined> {
  return withErrorHandling(async () => {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user || undefined;
  }, "getUserById");
}

export async function updateUserSubscription(userId: string, planId: string): Promise<User> {
  return withErrorHandling(async () => {
    // Get the subscription plan details
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId));
    if (!plan) {
      throw new Error(`Subscription plan with ID ${planId} not found`);
    }

    // Update user's plan
    const [updatedUser] = await db.update(users)
      .set({ plan: plan.planName })
      .where(eq(users.id, userId))
      .returning();

    // Create subscription record
    await db.insert(subscriptions).values({
      userId,
      plan: plan.planName,
      status: "active",
    });

    console.log(`[DB] User ${userId} subscription updated to ${plan.planName}`);
    return updatedUser;
  }, "updateUserSubscription");
}

// Profile operations
export async function getUserProfile(userId: string): Promise<Profile | undefined> {
  return withErrorHandling(async () => {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    return profile || undefined;
  }, "getUserProfile");
}

export async function updateUserProfile(userId: string, profileData: Partial<InsertProfile>): Promise<Profile> {
  return withErrorHandling(async () => {
    const [updatedProfile] = await db.update(profiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(profiles.userId, userId))
      .returning();

    if (!updatedProfile) {
      throw new Error(`Profile for user ${userId} not found`);
    }

    console.log(`[DB] Profile updated for user: ${userId}`);
    return updatedProfile;
  }, "updateUserProfile");
}

// Session operations
export async function saveSession(sessionData: InsertSession): Promise<Session> {
  return withErrorHandling(async () => {
    // Clean up expired sessions first
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));

    const [session] = await db.insert(sessions).values(sessionData).returning();
    console.log(`[DB] Session saved: ${session.sessionId}`);
    return session;
  }, "saveSession");
}

export async function getSession(sessionId: string): Promise<Session | undefined> {
  return withErrorHandling(async () => {
    const [session] = await db.select()
      .from(sessions)
      .where(and(
        eq(sessions.sessionId, sessionId),
        gte(sessions.expiresAt, new Date())
      ));
    
    return session || undefined;
  }, "getSession");
}

export async function deleteSession(sessionId: string): Promise<void> {
  return withErrorHandling(async () => {
    await db.delete(sessions).where(eq(sessions.sessionId, sessionId));
    console.log(`[DB] Session deleted: ${sessionId}`);
  }, "deleteSession");
}

// Subscription plan operations
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return withErrorHandling(async () => {
    return await db.select({
      id: subscriptionPlans.id,
      planName: subscriptionPlans.planName,
      price: subscriptionPlans.price,
      features: subscriptionPlans.features,
      isActive: subscriptionPlans.isActive,
      createdAt: subscriptionPlans.createdAt
    })
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.price);
  }, "getSubscriptionPlans");
}

export async function createSubscriptionPlan(planData: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
  return withErrorHandling(async () => {
    const [plan] = await db.insert(subscriptionPlans).values(planData).returning();
    console.log(`[DB] Subscription plan created: ${plan.planName}`);
    return plan;
  }, "createSubscriptionPlan");
}

// Utility functions
export async function cleanupExpiredSessions(): Promise<number> {
  return withErrorHandling(async () => {
    const result = await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
    console.log(`[DB] Cleaned up expired sessions`);
    return result.rowCount || 0;
  }, "cleanupExpiredSessions");
}

export async function getUserSubscription(userId: string): Promise<Subscription | undefined> {
  return withErrorHandling(async () => {
    const [subscription] = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
    
    return subscription || undefined;
  }, "getUserSubscription");
}

// Seed default subscription plans
export async function seedSubscriptionPlans(): Promise<void> {
  return withErrorHandling(async () => {
    console.log("[DB] Seeding default subscription plans...");

    const defaultPlans: InsertSubscriptionPlan[] = [
      {
        planName: "Forever Free",
        price: "0",
        features: [
          "Up to 5 products",
          "1 email per month",
          "1 SMS per month", 
          "Basic analytics",
          "Community support"
        ],
        limits: {
          products: 5,
          emails: 1,
          sms: 1
        }
      },
      {
        planName: "Starter",
        price: "39.00",
        features: [
          "Up to 50 products",
          "CSV import/export",
          "Shopify/WooCommerce sync",
          "500 emails per month",
          "200 SMS per month",
          "Advanced analytics"
        ],
        limits: {
          products: 50,
          emails: 500,
          sms: 200
        }
      },
      {
        planName: "Pro",
        price: "99.00",
        features: [
          "Unlimited products",
          "Smart suggestions",
          "Rollback functionality",
          "5,000 emails per month",
          "1,000 SMS per month",
          "Email segmentation",
          "SEO tracker",
          "A/B testing"
        ],
        limits: {
          products: -1,
          emails: 5000,
          sms: 1000
        }
      },
      {
        planName: "Growth",
        price: "299.00",
        features: [
          "Everything in Pro",
          "Multi-language support",
          "Ad export functionality",
          "Content repurposing",
          "25,000 emails per month",
          "5,000 SMS per month",
          "Revenue dashboard",
          "White-label options"
        ],
        limits: {
          products: -1,
          emails: 25000,
          sms: 5000
        }
      },
      {
        planName: "Enterprise",
        price: "999.00",
        features: [
          "Unlimited everything",
          "Custom AI tuning",
          "API access",
          "SLA guarantee",
          "Dedicated support manager",
          "Custom integrations",
          "Advanced reporting"
        ],
        limits: {
          products: -1,
          emails: -1,
          sms: -1
        }
      },
    ];

    // Check if plans already exist
    for (const planData of defaultPlans) {
      const [existingPlan] = await db.select({
        id: subscriptionPlans.id,
        planName: subscriptionPlans.planName,
        price: subscriptionPlans.price,
        features: subscriptionPlans.features,
        isActive: subscriptionPlans.isActive,
        createdAt: subscriptionPlans.createdAt
      })
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.planName, planData.planName));

      if (!existingPlan) {
        // Only insert fields that exist in the database schema
        await db.insert(subscriptionPlans).values({
          planName: planData.planName,
          price: planData.price,
          features: planData.features,
          limits: {},
          interval: "month"
        });
        console.log(`[DB] Created subscription plan: ${planData.planName}`);
      } else {
        console.log(`[DB] Subscription plan already exists: ${planData.planName}`);
      }
    }

    console.log("[DB] Subscription plans seeding completed!");
  }, "seedSubscriptionPlans");
}

// Database health check
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    if (!db) return false;
    
    // Simple test query
    await db.execute("SELECT 1");
    console.log("[DB] Database connection test successful!");
    return true;
  } catch (error) {
    console.error("[DB] Database connection test failed:", error);
    return false;
  }
}

// REAL-TIME DASHBOARD DATA FUNCTIONS

// Usage Stats Operations
export async function getUserUsageStats(userId: string): Promise<UsageStats | null> {
  return withErrorHandling(async () => {
    const [stats] = await db.select().from(usageStats).where(eq(usageStats.userId, userId));
    return stats || null;
  }, "getUserUsageStats");
}

export async function createOrUpdateUsageStats(userId: string, statsData: Partial<InsertUsageStats>): Promise<UsageStats> {
  return withErrorHandling(async () => {
    const existing = await getUserUsageStats(userId);
    
    if (existing) {
      const [updated] = await db.update(usageStats)
        .set({ ...statsData, lastUpdated: new Date() })
        .where(eq(usageStats.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(usageStats)
        .values({ userId, ...statsData })
        .returning();
      return created;
    }
  }, "createOrUpdateUsageStats");
}

export async function incrementUsageStat(userId: string, statField: keyof UsageStats, increment: number = 1): Promise<void> {
  return withErrorHandling(async () => {
    const current = await getUserUsageStats(userId);
    if (current) {
      const currentValue = current[statField] as number || 0;
      await db.update(usageStats)
        .set({ [statField]: currentValue + increment, lastUpdated: new Date() })
        .where(eq(usageStats.userId, userId));
    } else {
      await db.insert(usageStats)
        .values({ userId, [statField]: increment });
    }
    console.log(`[DB] Incremented ${statField} by ${increment} for user ${userId}`);
  }, "incrementUsageStat");
}

// Activity Logs Operations
export async function createActivityLog(logData: InsertActivityLog): Promise<ActivityLog> {
  return withErrorHandling(async () => {
    const [log] = await db.insert(activityLogs).values(logData).returning();
    console.log(`[DB] Activity logged: ${logData.action} for user ${logData.userId}`);
    return log;
  }, "createActivityLog");
}

export async function getUserActivityLogs(userId: string, limit: number = 10): Promise<ActivityLog[]> {
  return withErrorHandling(async () => {
    return await db.select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }, "getUserActivityLogs");
}

// Tools Access Operations
export async function trackToolAccess(userId: string, toolName: string): Promise<ToolsAccess> {
  return withErrorHandling(async () => {
    const [existing] = await db.select()
      .from(toolsAccess)
      .where(and(eq(toolsAccess.userId, userId), eq(toolsAccess.toolName, toolName)));

    if (existing) {
      const [updated] = await db.update(toolsAccess)
        .set({ 
          accessCount: existing.accessCount + 1,
          lastAccessed: new Date()
        })
        .where(and(eq(toolsAccess.userId, userId), eq(toolsAccess.toolName, toolName)))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(toolsAccess)
        .values({ userId, toolName, accessCount: 1 })
        .returning();
      return created;
    }
  }, "trackToolAccess");
}

export async function getUserToolsAccess(userId: string): Promise<ToolsAccess[]> {
  return withErrorHandling(async () => {
    return await db.select()
      .from(toolsAccess)
      .where(eq(toolsAccess.userId, userId))
      .orderBy(desc(toolsAccess.lastAccessed));
  }, "getUserToolsAccess");
}

// Real-time Metrics Operations
export async function updateRealtimeMetric(metricData: InsertRealtimeMetrics): Promise<RealtimeMetrics> {
  return withErrorHandling(async () => {
    const [metric] = await db.insert(realtimeMetrics).values(metricData).returning();
    console.log(`[DB] Real-time metric updated: ${metricData.metricName} for user ${metricData.userId}`);
    return metric;
  }, "updateRealtimeMetric");
}

export async function getUserRealtimeMetrics(userId: string, hours: number = 24): Promise<RealtimeMetrics[]> {
  return withErrorHandling(async () => {
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await db.select()
      .from(realtimeMetrics)
      .where(and(
        eq(realtimeMetrics.userId, userId),
        gte(realtimeMetrics.timestamp, hoursAgo)
      ))
      .orderBy(desc(realtimeMetrics.timestamp));
  }, "getUserRealtimeMetrics");
}

// Comprehensive Dashboard Data
export async function getUserDashboardData(userId: string): Promise<{
  user: User;
  profile: Profile | null;
  usageStats: UsageStats | null;
  activityLogs: ActivityLog[];
  toolsAccess: ToolsAccess[];
  realtimeMetrics: RealtimeMetrics[];
}> {
  return withErrorHandling(async () => {
    const [user, profile, stats, activities, tools, metrics] = await Promise.all([
      getUserById(userId),
      getUserProfile(userId),
      getUserUsageStats(userId),
      getUserActivityLogs(userId, 5),
      getUserToolsAccess(userId),
      getUserRealtimeMetrics(userId, 24)
    ]);

    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    console.log(`[DB] Dashboard data fetched for user ${userId}`);
    return {
      user,
      profile: profile || null,
      usageStats: stats,
      activityLogs: activities,
      toolsAccess: tools,
      realtimeMetrics: metrics
    };
  }, "getUserDashboardData");
}

// Initialize user real-time data (called on first login)
export async function initializeUserRealtimeData(userId: string): Promise<void> {
  return withErrorHandling(async () => {
    // Create initial usage stats if they don't exist
    const existingStats = await getUserUsageStats(userId);
    if (!existingStats) {
      await db.insert(usageStats).values({
        userId,
        totalRevenue: Math.floor(Math.random() * 50000) + 10000, // Random initial revenue $100-$500
        totalOrders: Math.floor(Math.random() * 500) + 100, // Random initial orders 100-600
        conversionRate: Math.floor(Math.random() * 500) + 200, // 2-7% conversion rate
        cartRecoveryRate: Math.floor(Math.random() * 3000) + 5000, // 50-80% recovery rate
        productsOptimized: 0,
        emailsSent: 0,
        smsSent: 0,
        aiGenerationsUsed: 0,
        seoOptimizationsUsed: 0
      });
    }

    // Create initial activity log
    await createActivityLog({
      userId,
      action: "user_login",
      description: "User logged into dashboard",
      toolUsed: "dashboard",
      metadata: { timestamp: new Date().toISOString() }
    });

    console.log(`[DB] Initialized real-time data for user ${userId}`);
  }, "initializeUserRealtimeData");
}

// Generate realistic sample metrics for demo purposes
export async function generateSampleMetrics(userId: string): Promise<void> {
  return withErrorHandling(async () => {
    const metrics = [
      {
        userId,
        metricName: "revenue_change",
        value: "$" + (Math.floor(Math.random() * 5000) + 1000),
        changePercent: "+" + (Math.random() * 20 + 5).toFixed(1) + "%",
        isPositive: true
      },
      {
        userId,
        metricName: "orders_change", 
        value: (Math.floor(Math.random() * 100) + 50).toString(),
        changePercent: "+" + (Math.random() * 15 + 3).toFixed(1) + "%",
        isPositive: true
      },
      {
        userId,
        metricName: "conversion_change",
        value: (Math.random() * 2 + 2).toFixed(1) + "%",
        changePercent: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 5 + 1).toFixed(1) + "%",
        isPositive: Math.random() > 0.3
      },
      {
        userId,
        metricName: "cart_recovery_change",
        value: (Math.random() * 20 + 70).toFixed(0) + "%",
        changePercent: "+" + (Math.random() * 10 + 5).toFixed(1) + "%",
        isPositive: true
      }
    ];

    for (const metric of metrics) {
      await updateRealtimeMetric(metric);
    }

    console.log(`[DB] Generated sample metrics for user ${userId}`);
  }, "generateSampleMetrics");
}

// Export the database instance for direct queries if needed
export { db };

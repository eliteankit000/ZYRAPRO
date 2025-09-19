import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { insertUserSchema, insertProductSchema, insertNotificationSchema } from "@shared/schema";
import { storage } from "./storage";
import { 
  testDatabaseConnection,
  seedSubscriptionPlans,
  getSubscriptionPlans,
  updateUserSubscription,
  saveSession,
  getSession,
  deleteSession
} from "./db";
import OpenAI from "openai";
import Stripe from "stripe";

// Initialize OpenAI
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

// Initialize Stripe if keys are provided
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-08-27.basil",
  });
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      fullName: string;
      role: string;
      plan: string;
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Passport configuration
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Authentication required" });
  };

  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(validatedData);
      
      // Auto-login after registration
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after registration" });
        }
        res.json({ user: { id: user.id, email: user.email, fullName: user.fullName, plan: user.plan } });
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid email or password" });
      }
      
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Session creation failed" });
        }
        
        res.json({ 
          user: { 
            id: user.id, 
            email: user.email, 
            fullName: user.fullName, 
            plan: user.plan 
          } 
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/me", requireAuth, (req, res) => {
    const user = req.user!;
    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        fullName: user.fullName, 
        plan: user.plan 
      } 
    });
  });

  // AI Product Description Generator
  app.post("/api/generate-description", requireAuth, async (req, res) => {
    try {
      const { productName, category, features, audience, brandVoice } = req.body;

      if (!productName) {
        return res.status(400).json({ message: "Product name is required" });
      }

      const prompts = {
        sales: `Create a compelling sales-focused product description for "${productName}" in the ${category} category. 
                Target audience: ${audience}. Key features: ${features}. 
                Make it persuasive, benefit-focused, and include a clear call-to-action. Keep it under 150 words.
                Respond with JSON in this format: { "description": "your description here" }`,
        
        seo: `Create an SEO-optimized product description for "${productName}" in the ${category} category.
              Target audience: ${audience}. Key features: ${features}.
              Include relevant keywords naturally, focus on search-friendly language, and maintain readability.
              Keep it under 160 words.
              Respond with JSON in this format: { "description": "your description here" }`,
        
        casual: `Create a casual, friendly product description for "${productName}" in the ${category} category.
                 Target audience: ${audience}. Key features: ${features}.
                 Use conversational tone, emojis where appropriate, and make it relatable and fun.
                 Keep it under 150 words.
                 Respond with JSON in this format: { "description": "your description here" }`
      };

      const selectedPrompt = prompts[brandVoice as keyof typeof prompts] || prompts.sales;

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: selectedPrompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json({ description: result.description });
    } catch (error: any) {
      console.error("AI generation error:", error);
      res.status(500).json({ message: "Failed to generate description" });
    }
  });

  // SEO Optimization
  app.post("/api/optimize-seo", requireAuth, async (req, res) => {
    try {
      const { currentTitle, keywords, currentMeta, category } = req.body;

      if (!currentTitle || !keywords) {
        return res.status(400).json({ message: "Title and keywords are required" });
      }

      const prompt = `Optimize the following product for SEO:
                      Current Title: "${currentTitle}"
                      Keywords: "${keywords}"
                      Category: "${category}"
                      Current Meta: "${currentMeta}"
                      
                      Create an optimized SEO title (under 60 characters), meta description (under 160 characters), 
                      and suggest 5-7 relevant keywords. Calculate an SEO score out of 100.
                      
                      Respond with JSON in this format:
                      {
                        "optimizedTitle": "your title",
                        "optimizedMeta": "your meta description", 
                        "keywords": ["keyword1", "keyword2", "keyword3"],
                        "seoScore": 85
                      }`;

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result);
    } catch (error: any) {
      console.error("SEO optimization error:", error);
      res.status(500).json({ message: "Failed to optimize SEO" });
    }
  });

  // Products CRUD
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts(req.user!.id);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      // Validate the request body using the insertProductSchema
      const validation = insertProductSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: validation.error.errors 
        });
      }
      
      const productData = { ...validation.data, userId: req.user!.id };
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      // Check if the product belongs to the authenticated user
      if (product.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      res.json(product);
    } catch (error: any) {
      console.error("Get product error:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.patch("/api/products/:id", requireAuth, async (req, res) => {
    try {
      // Validate partial update data
      const validation = insertProductSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: validation.error.errors 
        });
      }

      // Check if the product exists and belongs to the user
      const existingProduct = await storage.getProduct(req.params.id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (existingProduct.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const product = await storage.updateProduct(req.params.id, validation.data);
      res.json(product);
    } catch (error: any) {
      console.error("Update product error:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      // Check if the product exists and belongs to the user
      const existingProduct = await storage.getProduct(req.params.id);
      if (!existingProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (existingProduct.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteProduct(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Optimize all products endpoint
  app.post("/api/products/optimize-all", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      
      // Fetch all products for the user
      const products = await storage.getProducts(userId);
      
      if (products.length === 0) {
        return res.json({ 
          message: "No products found to optimize", 
          optimizedCount: 0 
        });
      }

      // Helper function to capitalize names properly
      const capitalizeName = (name: string): string => {
        return name.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };

      // Helper function to generate default descriptions
      const generateDefaultDescription = (name: string, category: string): string => {
        const categoryDescriptions: Record<string, string> = {
          'Electronics': `Experience the latest in electronic innovation with ${name}. Designed for modern living with premium quality and reliable performance.`,
          'Clothing': `Discover stylish comfort with ${name}. Premium quality materials and contemporary design for your wardrobe essentials.`,
          'Home & Garden': `Transform your living space with ${name}. Quality craftsmanship meets functional design for your home.`,
          'Books': `Immerse yourself in ${name}. A captivating read that combines engaging content with valuable insights.`,
          'Health': `Enhance your wellness journey with ${name}. Quality ingredients and trusted formulation for your health goals.`,
          'Sports': `Elevate your performance with ${name}. Professional-grade quality for athletes and fitness enthusiasts.`,
          'Beauty': `Discover your natural radiance with ${name}. Premium formulation for effective and gentle care.`,
          'Toys': `Spark imagination and fun with ${name}. Safe, durable, and designed for endless entertainment.`
        };
        
        return categoryDescriptions[category] || `Discover the exceptional quality and value of ${name}. Carefully crafted to meet your needs with superior performance and reliability.`;
      };

      // Helper function to generate default tags
      const generateDefaultTags = (category: string): string => {
        const categoryTags: Record<string, string> = {
          'Electronics': 'technology, innovation, gadgets, electronics, modern',
          'Clothing': 'fashion, style, apparel, comfortable, trendy',
          'Home & Garden': 'home improvement, decor, garden, lifestyle, quality',
          'Books': 'reading, education, literature, knowledge, entertainment',
          'Health': 'wellness, health, fitness, natural, supplements',
          'Sports': 'fitness, sports, athletic, performance, training',
          'Beauty': 'skincare, beauty, cosmetics, self-care, premium',
          'Toys': 'kids, fun, educational, safe, entertainment'
        };
        
        return categoryTags[category] || 'quality, premium, reliable, popular, recommended';
      };

      // Remove duplicates by name and category
      const uniqueProducts = [];
      const seen = new Set();
      
      for (const product of products) {
        const key = `${product.name.toLowerCase()}-${product.category.toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueProducts.push(product);
        }
      }

      // Optimize each unique product
      const optimizedProducts = uniqueProducts.map(product => {
        const optimizedName = capitalizeName(product.name);
        const optimizedDescription = product.description || generateDefaultDescription(product.name, product.category);
        const optimizedTags = product.tags || generateDefaultTags(product.category);
        
        return {
          id: product.id,
          name: optimizedName,
          description: optimizedDescription,
          tags: optimizedTags,
          isOptimized: true,
          optimizedCopy: {
            originalName: product.name,
            originalDescription: product.description,
            originalTags: product.tags,
            optimizedAt: new Date().toISOString(),
            optimizationType: 'database-only'
          }
        };
      });

      // Update all optimized products in database
      const updatePromises = optimizedProducts.map(product => 
        storage.updateProduct(product.id, {
          name: product.name,
          description: product.description,
          tags: product.tags,
          isOptimized: product.isOptimized,
          optimizedCopy: product.optimizedCopy
        })
      );

      await Promise.all(updatePromises);

      // Delete duplicate products (keep only the unique ones)
      const duplicateCount = products.length - uniqueProducts.length;
      if (duplicateCount > 0) {
        const uniqueIds = new Set(uniqueProducts.map(p => p.id));
        const duplicateIds = products
          .filter(p => !uniqueIds.has(p.id))
          .map(p => p.id);
        
        const deletePromises = duplicateIds.map(id => storage.deleteProduct(id));
        await Promise.all(deletePromises);
      }

      res.json({
        message: "All products optimized successfully",
        optimizedCount: optimizedProducts.length,
        duplicatesRemoved: duplicateCount,
        details: {
          namesCapitalized: optimizedProducts.filter(p => p.optimizedCopy.originalName !== p.name).length,
          descriptionsGenerated: optimizedProducts.filter(p => !p.optimizedCopy.originalDescription).length,
          tagsAdded: optimizedProducts.filter(p => !p.optimizedCopy.originalTags).length
        }
      });
    } catch (error: any) {
      console.error("Optimize products error:", error);
      res.status(500).json({ message: "Failed to optimize products" });
    }
  });

  // Analytics
  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const { type } = req.query;
      const analytics = await storage.getAnalytics(req.user!.id, type as string);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.user!.id);
      res.json(notifications);
    } catch (error: any) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.user!.id);
      res.json({ count });
    } catch (error: any) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.post("/api/notifications", requireAuth, async (req, res) => {
    try {
      const validation = insertNotificationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid notification data", 
          errors: validation.error.errors 
        });
      }

      const notificationData = { ...validation.data, userId: req.user!.id };
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error: any) {
      console.error("Create notification error:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.user!.id, req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json(notification);
    } catch (error: any) {
      console.error("Mark notification as read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.post("/api/notifications/mark-all-read", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      console.error("Mark all notifications as read error:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteNotification(req.user!.id, req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification deleted successfully" });
    } catch (error: any) {
      console.error("Delete notification error:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  app.post("/api/notifications/clear-all", requireAuth, async (req, res) => {
    try {
      await storage.clearAllNotifications(req.user!.id);
      res.json({ message: "All notifications cleared successfully" });
    } catch (error: any) {
      console.error("Clear all notifications error:", error);
      res.status(500).json({ message: "Failed to clear all notifications" });
    }
  });

  // Stripe subscription routes
  if (stripe) {
    app.post("/api/create-subscription", requireAuth, async (req, res) => {
      try {
        let user = req.user!;
        
        if (user.stripeSubscriptionId) {
          const subscription = await stripe!.subscriptions.retrieve(user.stripeSubscriptionId);
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
          });
        }

        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripe!.customers.create({
            email: user.email,
            name: user.fullName,
          });
          customerId = customer.id;
          await storage.updateUserStripeInfo(user.id, customerId, "");
        }

        const subscription = await stripe!.subscriptions.create({
          customer: customerId,
          items: [{
            price: process.env.STRIPE_PRICE_ID || "price_1234", // User needs to set this
          }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });

        await storage.updateUserStripeInfo(user.id, customerId, subscription.id);

        res.json({
          subscriptionId: subscription.id,
          clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        });
      } catch (error: any) {
        console.error("Subscription error:", error);
        res.status(400).json({ error: { message: error.message } });
      }
    });
  }

  // NEW DATABASE HELPER ROUTES

  // User profile routes
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.getUser(req.user!.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error: any) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.put("/api/profile", requireAuth, async (req, res) => {
    try {
      const { name, bio, profileImage, preferences } = req.body;
      const updatedUser = await storage.updateUser(req.user!.id, {
        fullName: name
      });
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Subscription plans routes
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await getSubscriptionPlans();
      res.json(plans);
    } catch (error: any) {
      console.error("Get subscription plans error:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  // Get current user subscription
  app.get("/api/subscription/current", requireAuth, async (req, res) => {
    try {
      const subscription = await storage.getUserSubscription(req.user!.id);
      res.json(subscription || {});
    } catch (error: any) {
      console.error("Error fetching user subscription:", error);
      res.status(500).json({ 
        error: "Failed to fetch subscription",
        message: error.message 
      });
    }
  });

  // Get usage stats
  app.get("/api/usage-stats", requireAuth, async (req, res) => {
    try {
      const usageStats = await storage.getUserUsageStats(req.user!.id);
      res.json(usageStats || {
        productsCount: 0,
        emailsSent: 0,
        emailsRemaining: 0,
        smsSent: 0,
        smsRemaining: 0,
        aiGenerationsUsed: 0,
        seoOptimizationsUsed: 0
      });
    } catch (error: any) {
      console.error("Error fetching usage stats:", error);
      res.status(500).json({ 
        error: "Failed to fetch usage stats",
        message: error.message 
      });
    }
  });

  // Get invoices
  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      const invoices = await storage.getUserInvoices(req.user!.id);
      res.json(invoices || []);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ 
        error: "Failed to fetch invoices",
        message: error.message 
      });
    }
  });

  // Get payment methods
  app.get("/api/payment-methods", requireAuth, async (req, res) => {
    try {
      const paymentMethods = await storage.getUserPaymentMethods(req.user!.id);
      res.json(paymentMethods || []);
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
      res.status(500).json({ 
        error: "Failed to fetch payment methods",
        message: error.message 
      });
    }
  });

  // Add payment method
  app.post("/api/payment-methods/add", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const user = req.user!;
      let customerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.fullName,
          metadata: { userId: user.id }
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(user.id, customerId, "");
      }

      // Create setup session
      const session = await stripe.checkout.sessions.create({
        mode: 'setup',
        customer: customerId,
        success_url: `${req.protocol}://${req.get('host')}/billing?setup=success`,
        cancel_url: `${req.protocol}://${req.get('host')}/billing?setup=cancel`,
      });

      res.json({ setupUrl: session.url });
    } catch (error: any) {
      console.error("Error adding payment method:", error);
      res.status(500).json({ 
        error: "Failed to add payment method",
        message: error.message 
      });
    }
  });

  app.post("/api/update-subscription", requireAuth, async (req, res) => {
    try {
      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }
      
      const user = await updateUserSubscription(req.user!.id, planId);
      res.json({ message: "Subscription updated successfully", user });
    } catch (error: any) {
      console.error("Update subscription error:", error);
      res.status(500).json({ message: error.message || "Failed to update subscription" });
    }
  });

  // Change subscription plan (alternative endpoint for billing page)
  app.post("/api/subscription/change-plan", requireAuth, async (req, res) => {
    try {
      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ error: "Plan ID is required" });
      }

      const user = await updateUserSubscription(req.user!.id, planId);
      res.json({ user });
    } catch (error: any) {
      console.error("Error changing subscription plan:", error);
      res.status(500).json({ 
        error: "Failed to change subscription plan",
        message: error.message 
      });
    }
  });

  // Session management routes (for admin/internal use only)
  app.post("/api/sessions", requireAuth, async (req, res) => {
    try {
      // Only allow admin users to create sessions
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { sessionId, expiresAt } = req.body;
      if (!sessionId || !expiresAt) {
        return res.status(400).json({ message: "Missing required session data" });
      }
      
      // Use authenticated user's ID instead of allowing arbitrary userId
      const session = await saveSession({
        sessionId,
        userId: req.user!.id,
        expiresAt: new Date(expiresAt)
      });
      res.json(session);
    } catch (error: any) {
      console.error("Save session error:", error);
      res.status(500).json({ message: "Failed to save session" });
    }
  });

  app.get("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found or expired" });
      }
      res.json(session);
    } catch (error: any) {
      console.error("Get session error:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.delete("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      await deleteSession(sessionId);
      res.json({ message: "Session deleted successfully" });
    } catch (error: any) {
      console.error("Delete session error:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Database admin routes (you may want to protect these more strictly)
  app.get("/api/admin/db-test", requireAuth, async (req, res) => {
    try {
      const isConnected = await testDatabaseConnection();
      res.json({ 
        connected: isConnected,
        message: isConnected ? "Database connection successful" : "Database connection failed"
      });
    } catch (error: any) {
      console.error("Database test error:", error);
      res.status(500).json({ message: "Database test failed" });
    }
  });

  app.post("/api/admin/seed-plans", requireAuth, async (req, res) => {
    try {
      // Only allow admin users to seed (you may want to add role checking)
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      await seedSubscriptionPlans();
      res.json({ message: "Subscription plans seeded successfully" });
    } catch (error: any) {
      console.error("Seed plans error:", error);
      res.status(500).json({ message: "Failed to seed subscription plans" });
    }
  });

  // Enhanced user registration route using new database helper
  app.post("/api/register-v2", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists using new helper
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create user using new helper (automatically creates profile)
      const user = await storage.createUser(validatedData);
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        res.status(201).json({ 
          message: "User created successfully", 
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            plan: user.plan
          }
        });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message?.includes('Database operation failed')) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Registration failed" });
      }
    }
  });

  // REAL-TIME DASHBOARD API ENDPOINTS

  // Get comprehensive dashboard data
  app.get("/api/dashboard", requireAuth, async (req, res) => {
    try {
      const dashboardData = await storage.getDashboardData(req.user!.id);
      res.json(dashboardData);
    } catch (error: any) {
      console.error("[API] Dashboard data fetch error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Initialize user real-time data (called on first login)
  app.post("/api/dashboard/initialize", requireAuth, async (req, res) => {
    try {
      await storage.initializeUserRealtimeData(req.user!.id);
      await storage.generateSampleMetrics(req.user!.id);
      res.json({ message: "Real-time data initialized successfully" });
    } catch (error: any) {
      console.error("[API] Dashboard initialization error:", error);
      res.status(500).json({ message: "Failed to initialize dashboard data" });
    }
  });

  // Track tool access (called when user clicks on tool buttons)
  app.post("/api/dashboard/track-tool-access", requireAuth, async (req, res) => {
    try {
      const { toolName } = req.body;
      if (!toolName) {
        return res.status(400).json({ message: "Tool name is required" });
      }
      
      const toolAccess = await storage.trackToolAccess(req.user!.id, toolName);
      
      // Log activity
      await storage.createActivityLog(req.user!.id, {
        action: "tool_accessed",
        description: `Opened ${toolName.replace('-', ' ')} tool`,
        toolUsed: toolName,
        metadata: { timestamp: new Date().toISOString() }
      });

      res.json({ success: true, toolAccess });
    } catch (error: any) {
      console.error("[API] Tool access tracking error:", error);
      res.status(500).json({ message: "Failed to track tool access" });
    }
  });

  // Log user activity
  app.post("/api/dashboard/log-activity", requireAuth, async (req, res) => {
    try {
      const { action, description, toolUsed, metadata } = req.body;
      if (!action || !description) {
        return res.status(400).json({ message: "Action and description are required" });
      }

      const activityLog = await storage.createActivityLog(req.user!.id, {
        action,
        description,
        toolUsed,
        metadata
      });

      res.json({ success: true, activityLog });
    } catch (error: any) {
      console.error("[API] Activity logging error:", error);
      res.status(500).json({ message: "Failed to log activity" });
    }
  });

  // Update usage stats (called when user performs actions)
  app.post("/api/dashboard/update-usage", requireAuth, async (req, res) => {
    try {
      const { statField, increment = 1 } = req.body;
      if (!statField) {
        return res.status(400).json({ message: "Stat field is required" });
      }

      await storage.updateUsageStats(req.user!.id, statField, increment);
      res.json({ success: true, message: `Updated ${statField} by ${increment}` });
    } catch (error: any) {
      console.error("[API] Usage stats update error:", error);
      res.status(500).json({ message: "Failed to update usage stats" });
    }
  });

  // Generate new sample metrics (for demo purposes)
  app.post("/api/dashboard/refresh-metrics", requireAuth, async (req, res) => {
    try {
      await storage.generateSampleMetrics(req.user!.id);
      const dashboardData = await storage.getDashboardData(req.user!.id);
      res.json({ success: true, dashboardData });
    } catch (error: any) {
      console.error("[API] Metrics refresh error:", error);
      res.status(500).json({ message: "Failed to refresh metrics" });
    }
  });

  // Get real-time usage stats only
  app.get("/api/dashboard/usage-stats", requireAuth, async (req, res) => {
    try {
      const dashboardData = await storage.getDashboardData(req.user!.id);
      res.json(dashboardData.usageStats);
    } catch (error: any) {
      console.error("[API] Usage stats fetch error:", error);
      res.status(500).json({ message: "Failed to fetch usage stats" });
    }
  });

  // Profile management routes
  app.put('/api/profile', requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { fullName, email } = req.body;
      if (!fullName || !email) {
        return res.status(400).json({ error: 'Full name and email are required' });
      }

      const updatedUser = await storage.updateUserProfile(userId, fullName, email);
      res.json(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/change-password', requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
      }

      await storage.changeUserPassword(userId, currentPassword, newPassword);
      res.json({ success: true });
    } catch (error) {
      console.error('Change password error:', error);
      if (error.message === 'Current password is incorrect') {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/language', requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { preferredLanguage } = req.body;
      if (!preferredLanguage) {
        return res.status(400).json({ error: 'Preferred language is required' });
      }

      const updatedUser = await storage.updateUserLanguage(userId, preferredLanguage);
      res.json(updatedUser);
    } catch (error) {
      console.error('Update language error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/upload-profile-image', requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // For now, return a placeholder URL since we need to implement proper file upload
      // This would be where you handle the actual file upload to object storage
      const imageUrl = '/placeholder-avatar.png';
      const updatedUser = await storage.updateUserImage(userId, imageUrl);
      res.json(updatedUser);
    } catch (error) {
      console.error('Upload image error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Store connections routes
  app.get('/api/store-connections', requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const connections = await storage.getStoreConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error('Get store connections error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/store-connections', requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { platform, storeName, storeUrl, accessToken } = req.body;
      if (!platform || !storeName || !storeUrl || !accessToken) {
        return res.status(400).json({ error: 'All store connection fields are required' });
      }

      const connection = await storage.createStoreConnection({
        userId,
        platform,
        storeName,
        storeUrl,
        accessToken,
        status: 'active'
      });
      res.json(connection);
    } catch (error) {
      console.error('Create store connection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/store-connections/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { id } = req.params;
      await storage.deleteStoreConnection(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete store connection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

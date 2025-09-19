import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { 
  Zap, 
  Home, 
  Search, 
  BarChart3, 
  Mail, 
  Package, 
  Settings, 
  LogOut,
  User,
  X,
  Cog
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeTab, onTabChange, user, isOpen, onClose }: SidebarProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 1024
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close sidebar on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      toast({ title: "Logged out", description: "Successfully logged out" });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Logout failed",
        description: "Failed to logout",
        variant: "destructive",
      });
    },
  });

  const navItems = [
    { id: "overview", label: "Dashboard", icon: <Home className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: "ai-tools", label: "AI Tools", icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: "automate", label: "Automate", icon: <Cog className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: "campaigns", label: "Campaigns", icon: <Mail className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: "products", label: "Products", icon: <Package className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4 sm:w-5 sm:h-5" /> },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 w-64 h-full sidebar-gradient border-r border-border z-40 transition-transform duration-300 ease-in-out lg:top-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Close button - visible only on mobile */}
        <div className="lg:hidden absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-close-sidebar"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8" data-testid="sidebar-logo">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-foreground">Zyra</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 mt-[-17px] mb-[-17px]">
            {navItems.map((item) => (
              <Button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                variant="ghost"
                className={`w-full justify-start px-4 py-3 h-auto ${
                  activeTab === item.id
                    ? "bg-primary/20 text-primary hover:bg-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                data-testid={`nav-${item.id}`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Button>
            ))}
          </nav>
        </div>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border">
          <div className="flex items-center space-x-3" data-testid="user-profile">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-xs sm:text-sm font-medium pl-[0px] pr-[0px] ml-[-2px] mr-[-2px] pt-[-12px] pb-[-12px] mt-[-4px] mb-[-4px]" data-testid="text-user-name">{user?.fullName || "User"}</div>
              <div className="text-xs text-muted-foreground" data-testid="text-user-plan">{user?.plan || "Free"} Plan</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
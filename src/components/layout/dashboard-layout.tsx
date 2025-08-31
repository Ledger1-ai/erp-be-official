"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useGlobalSearch } from "@/lib/hooks/use-graphql";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Menu,
  Home,
  Calendar,
  Package,
  FileText,
  Users,
  Settings,
  BarChart3,
  Brain,
  LogOut,
  MessageSquare,
  Bell,
  Search,
  Bot,
  MapPin,
} from "lucide-react";
import Image from "next/image";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface User {
  email: string;
  name: string;
  role: string;
}

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    permission: "dashboard" as const,
  },
  {
    title: "Scheduling", 
    href: "/dashboard/scheduling",
    icon: Calendar,
    permission: "scheduling" as const,
    disabled: true,
    tag: "Coming soon",
  },
  {
    title: "Inventory",
    href: "/dashboard/inventory", 
    icon: Package,
    permission: "inventory" as const,
  },
  {
    title: "Invoicing",
    href: "/dashboard/invoicing",
    icon: FileText,
    disabled: true,
    tag: "Coming soon",
  },
  {
    title: "Menu",
    href: "/dashboard/menu",
    icon: Menu,
    permission: "menu" as const,
  },
  {
    title: "Team Management",
    href: "/dashboard/team", 
    icon: Users,
    permission: "team" as const,
  },
  {
    title: "HostPro",
    href: "/dashboard/hostpro",
    icon: MapPin,
    permission: "hostpro" as const,
  },
  {
    title: "Robotic Fleets",
    href: "/dashboard/robotic-fleets",
    icon: Bot, 
    permission: "robotic-fleets" as const,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    permission: "analytics" as const,
    disabled: true,
    tag: "Coming soon",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    permission: "settings" as const,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const permissions = usePermissions();
  const [user, setUser] = useState<User | null>(null);
  const [isVaruniOpen, setIsVaruniOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const [deniedOpen, setDeniedOpen] = useState(false);

  // Debounce search queries for UX & performance
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isIdleTyping, setIsIdleTyping] = useState(false);
  useEffect(() => {
    setIsIdleTyping(true);
    const id = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setIsIdleTyping(false);
    }, 250); // Shorter debounce for snappier results
    return () => clearTimeout(id);
  }, [searchQuery]);
  const minSearchChars = 2;
  const shouldFetch = debouncedQuery.length >= minSearchChars;
  const { data: searchData, loading: searchLoading, networkStatus } = useGlobalSearch(shouldFetch ? debouncedQuery : "", 8, { skip: !shouldFetch });
  const isRefetching = networkStatus === 4;
  const effectiveResults = shouldFetch ? (searchData?.globalSearch || []) : [];
  
  // Filter sidebar items based on user permissions (but always show disabled items)
  const visibleSidebarItems = sidebarItems
    .filter(item => item.disabled || (item.permission && permissions.hasPermission(item.permission)))
    .sort((a, b) => {
      // Always keep Settings last
      if (a.title === 'Settings') return 1;
      if (b.title === 'Settings') return -1;
      // Active (non-disabled) first
      const aActive = !a.disabled;
      const bActive = !b.disabled;
      if (aActive !== bActive) return aActive ? -1 : 1;
      // Otherwise keep original order
      return 0;
    });

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push("/login");
    }
  }, [router]);

  // Permission guard with redirect to first allowed route
  useEffect(() => {
    if (!user || permissions.loading) return;
    // Map pathname to required permission
    const requiresAccess = (path: string): boolean => {
      const p = path || "";
      if (p.startsWith("/dashboard/settings")) {
        return permissions.canAccessSettings();
      }
      const map: Array<{ test: (x: string) => boolean; perm: Parameters<typeof permissions.hasPermission>[0] }> = [
        { test: (x) => x === "/dashboard" || x === "/dashboard/", perm: "dashboard" },
        { test: (x) => x.startsWith("/dashboard/hostpro"), perm: "hostpro" },
        { test: (x) => x.startsWith("/dashboard/inventory"), perm: "inventory" },
        { test: (x) => x.startsWith("/dashboard/menu"), perm: "menu" },
        { test: (x) => x.startsWith("/dashboard/team"), perm: "team" },
        { test: (x) => x.startsWith("/dashboard/robotic-fleets"), perm: "robotic-fleets" },
        { test: (x) => x.startsWith("/dashboard/analytics"), perm: "analytics" },
        { test: (x) => x.startsWith("/dashboard/scheduling"), perm: "scheduling" },
        { test: (x) => x.startsWith("/dashboard/roster"), perm: "roster" },
      ];
      for (const m of map) {
        if (m.test(p)) return permissions.hasPermission(m.perm);
      }
      // default allow for unknown routes under dashboard
      return true;
    };

    if (!requiresAccess(pathname || "")) {
      // Compute first allowed landing route
      const order: Array<{ perm: Parameters<typeof permissions.hasPermission>[0]; route: string }> = [
        { perm: "dashboard", route: "/dashboard" },
        { perm: "hostpro", route: "/dashboard/hostpro" },
        { perm: "inventory", route: "/dashboard/inventory" },
        { perm: "menu", route: "/dashboard/menu" },
        { perm: "team", route: "/dashboard/team" },
        { perm: "robotic-fleets", route: "/dashboard/robotic-fleets" },
        { perm: "analytics", route: "/dashboard/analytics" },
        { perm: "scheduling", route: "/dashboard/scheduling" },
        { perm: "roster", route: "/dashboard/roster" },
      ];
      let landing = "/dashboard";
      for (const i of order) {
        if (permissions.hasPermission(i.perm)) { landing = i.route; break; }
      }
      if (!permissions.canAccessSettings() && landing === "/dashboard" && !permissions.hasPermission("dashboard")) {
        // Fallback to settings if that's the only allowed section
        landing = "/dashboard/settings";
      } else if (permissions.canAccessSettings() && !permissions.hasPermission("dashboard") && landing === "/dashboard") {
        landing = "/dashboard/settings";
      }
      try { sessionStorage.setItem("permissionDenied", "1"); } catch {}
      router.replace(landing);
    }
  }, [pathname, user, permissions, permissions.loading, router]);

  // Show permission denied modal if flagged by guard
  useEffect(() => {
    try {
      if (sessionStorage.getItem("permissionDenied") === "1") {
        sessionStorage.removeItem("permissionDenied");
        setDeniedOpen(true);
      }
    } catch {}
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b">
        <div className="mr-3">
          <Image 
            src="/tgl.png" 
            alt="The Graine Ledger" 
            width={40} 
            height={40} 
            className="h-10 w-10 rounded-full"
          />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">The Graine Ledger</h2>
          <p className="text-xs text-muted-foreground">Backoffice</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-2">
        {visibleSidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-between ${
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
              onClick={() => !item.disabled && router.push(item.href)}
              disabled={item.disabled}
            >
              <span className="flex items-center">
                <item.icon className="mr-3 h-4 w-4" />
                {item.title}
              </span>
              {item.tag && (
                <Badge variant="secondary" className="ml-2">{item.tag}</Badge>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Varuni AI Assistant */}
      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-between border-primary/20 text-primary/70 hover:bg-transparent cursor-not-allowed opacity-75"
          disabled
        >
          <span className="flex items-center">
            <Brain className="mr-3 h-4 w-4" />
            Chat with Varuni
          </span>
          <Badge variant="secondary">Coming soon</Badge>
        </Button>
      </div>
    </div>
  );

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
            <div className="min-h-screen bg-transparent">
      <Dialog open={deniedOpen} onOpenChange={setDeniedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Access Restricted</DialogTitle>
            <DialogDescription>
              You don't have permission to view that page. We've taken you to a page you can access.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[18rem] lg:flex-col">
        <div className="flex flex-col flex-grow glass-pane border-r border-border/50 shadow-lg">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-40">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 glass-pane border-r">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-[18rem] pt-16 min-h-screen bg-transparent">
        {/* Header */}
        <header className="fixed top-0 right-0 left-0 lg:left-[18rem] z-30 h-16 border-b border-border backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-background/80">
          <div className="px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex items-center justify-between h-full">
              {/* Search */}
              <div className="flex-1 max-w-lg ml-12 lg:ml-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search anything..."
                    className="w-full pl-10 pr-4 py-2 border border-input bg-background/60 text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring backdrop-blur-sm cursor-text"
                    onFocus={() => setIsSearchOpen(true)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    value={searchQuery}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsSearchOpen(true);
                    }}
                  />
                </div>
                <CommandDialog open={isSearchOpen} onOpenChange={(v) => { setIsSearchOpen(v); if (!v) { setSearchQuery(""); setDebouncedQuery(""); } }}>
                  <CommandInput
                    placeholder="Search anything..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    autoFocus
                  />
                  <CommandList>
                    {isSearchOpen && searchQuery.trim().length < minSearchChars && (
                      <div className="py-3 px-3 text-sm text-muted-foreground">Type at least {minSearchChars} characters…</div>
                    )}
                    {isSearchOpen && searchQuery.trim().length >= minSearchChars && (isIdleTyping || searchLoading || isRefetching) && (
                      <div className="py-3 px-3 text-sm text-muted-foreground">Searching…</div>
                    )}
                    {isSearchOpen && searchQuery.trim().length >= minSearchChars && !searchLoading && effectiveResults.length === 0 && (
                      <CommandEmpty>No results found.</CommandEmpty>
                    )}
                    <CommandGroup heading="Results">
                      {effectiveResults.map((r: any) => (
                        <CommandItem
                          value={`${r.title} ${r.kind} ${r.description || ''}`}
                          key={`${r.kind}-${r.id}`}
                          onSelect={() => { setIsSearchOpen(false); setSearchQuery(""); router.push(r.route); }}
                        >
                          {r.title}
                          <span className="ml-2 text-xs text-muted-foreground">{r.kind}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </CommandDialog>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Theme Toggle */}
                <ThemeToggle />
                
                {/* Notifications */}
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-3 hover:bg-accent">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={user.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left hidden sm:block">
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.role}</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 bg-transparent min-h-screen p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Varuni AI Chat Overlay */}
      {isVaruniOpen && (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-card rounded-lg shadow-xl border border-border z-50">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center">
              <Brain className="h-5 w-5 text-primary mr-2" />
              <h3 className="font-semibold text-card-foreground">Varuni AI Assistant</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsVaruniOpen(false)}>
              ×
            </Button>
          </div>
          <div className="p-4 h-80 overflow-y-auto">
            <div className="bg-primary/10 rounded-lg p-3 mb-3">
              <p className="text-sm text-primary">
                Hi! I&apos;m Varuni, your AI assistant. How can I help you manage your restaurant today?
              </p>
            </div>
            <div className="space-y-3">
              <Button variant="outline" size="sm" className="w-full text-left justify-start">
                📊 Show me today&apos;s analytics
              </Button>
              <Button variant="outline" size="sm" className="w-full text-left justify-start">
                👥 Help with staff scheduling
              </Button>
              <Button variant="outline" size="sm" className="w-full text-left justify-start">
                📦 Check inventory levels
              </Button>
              <Button variant="outline" size="sm" className="w-full text-left justify-start">
                💰 Review recent invoices
              </Button>
            </div>
          </div>
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Ask Varuni anything..."
                className="flex-1 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring focus:border-ring"
              />
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
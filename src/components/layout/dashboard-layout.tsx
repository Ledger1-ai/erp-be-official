"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
  },
  {
    title: "Scheduling",
    href: "/dashboard/scheduling",
    icon: Calendar,
  },
  {
    title: "Inventory",
    href: "/dashboard/inventory",
    icon: Package,
  },
  {
    title: "Invoicing",
    href: "/dashboard/invoicing",
    icon: FileText,
  },
  {
    title: "Team Management",
    href: "/dashboard/team",
    icon: Users,
  },
  {
    title: "Robotic Fleets",
    href: "/dashboard/robotic-fleets",
    icon: Bot,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isVaruniOpen, setIsVaruniOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b">
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
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
                          className={`w-full justify-start ${
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
              onClick={() => router.push(item.href)}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.title}
            </Button>
          );
        })}
      </nav>

      {/* Varuni AI Assistant */}
      <div className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start border-primary/20 text-primary hover:bg-primary/10"
          onClick={() => setIsVaruniOpen(!isVaruniOpen)}
        >
          <Brain className="mr-3 h-4 w-4" />
          Chat with Varuni
        </Button>
      </div>
    </div>
  );

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
            <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-background border-r border-border shadow-sm">
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
        <SheetContent side="left" className="p-0 w-72">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="lg:pl-72 min-h-screen bg-background">
        {/* Header */}
        <header className="bg-background shadow-sm border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Search */}
              <div className="flex-1 max-w-lg ml-12 lg:ml-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search anything..."
                    className="w-full pl-10 pr-4 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
                  />
                </div>
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
        <main className="flex-1 bg-background min-h-screen p-4 sm:p-6 lg:p-8">
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
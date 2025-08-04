"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useToastIntegration } from "@/lib/hooks/use-toast-integration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Settings,
  Plus,
  Shield,
  Users,
  Key,
  Bell,
  Globe,
  Smartphone,
  Edit,
  Trash2,
  CheckCircle,
  X,
  Link,
  AlertTriangle,
  Download,
} from "lucide-react";

// Sample data
const userRoles = [
  {
    id: 1,
    name: "Super Admin",
    description: "Full system access with all permissions",
    permissions: ["dashboard", "scheduling", "inventory", "invoicing", "team", "analytics", "settings"],
    userCount: 1,
    color: "bg-red-500",
  },
  {
    id: 2,
    name: "Manager",
    description: "Management access to most features",
    permissions: ["dashboard", "scheduling", "inventory", "invoicing", "team", "analytics"],
    userCount: 3,
    color: "bg-blue-500",
  },
  {
    id: 3,
    name: "Shift Supervisor",
    description: "Access to scheduling and team management",
    permissions: ["dashboard", "scheduling", "team"],
    userCount: 5,
    color: "bg-green-500",
  },
  {
    id: 4,
    name: "Staff",
    description: "Basic dashboard access",
    permissions: ["dashboard"],
    userCount: 12,
    color: "bg-yellow-500",
  },
];

const systemUsers = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@thegraineledger.com",
    role: "Super Admin",
    status: "active",
    lastLogin: "2025-01-22 14:30",
    avatar: "",
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah@thegraineledger.com",
    role: "Manager",
    status: "active",
    lastLogin: "2025-01-22 13:45",
    avatar: "",
  },
  {
    id: 3,
    name: "Mike Chen",
    email: "mike@thegraineledger.com",
    role: "Shift Supervisor",
    status: "active",
    lastLogin: "2025-01-22 12:15",
    avatar: "",
  },
  {
    id: 4,
    name: "Emma Davis",
    email: "emma@thegraineledger.com",
    role: "Staff",
    status: "inactive",
    lastLogin: "2025-01-20 18:30",
    avatar: "",
  },
];

// Toast integration data is now provided by the hook

const permissionsList = [
  { id: "dashboard", name: "Dashboard", description: "View dashboard and analytics" },
  { id: "scheduling", name: "Scheduling", description: "Manage staff schedules and shifts" },
  { id: "inventory", name: "Inventory", description: "Track and manage inventory" },
  { id: "invoicing", name: "Invoicing", description: "Create and manage invoices" },
  { id: "team", name: "Team Management", description: "Manage team members and roles" },
  { id: "analytics", name: "Analytics", description: "View detailed analytics and reports" },
  { id: "settings", name: "Settings", description: "System configuration and user management" },
];

export default function SettingsPage() {
  const [selectedTab, setSelectedTab] = useState("permissions");
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  
  const { 
    integrationStatus: toastIntegration, 
    restaurants,
    selectedRestaurant,
    setSelectedRestaurant,
    testConnection,
    performFullSync 
  } = useToastIntegration();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-1">Configure permissions, integrations, and system settings</p>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                                                    <h2 className="text-xl font-semibold text-foreground">Role Management</h2>
                  <p className="text-muted-foreground text-sm">Define roles and their permissions</p>
              </div>
              <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                    <DialogDescription>Define a new role with specific permissions</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role-name" className="text-right">Role Name</Label>
                      <Input id="role-name" placeholder="Enter role name" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="role-description" className="text-right">Description</Label>
                      <Input id="role-description" placeholder="Describe the role" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                      <Label className="text-right mt-2">Permissions</Label>
                      <div className="col-span-3 space-y-2">
                        {permissionsList.map((permission) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <input type="checkbox" id={permission.id} className="rounded" />
                            <label htmlFor={permission.id} className="text-sm">
                              <span className="font-medium text-foreground">{permission.name}</span>
                              <span className="text-muted-foreground ml-2">{permission.description}</span>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>Cancel</Button>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">Create Role</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userRoles.map((role) => (
                <Card key={role.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${role.color}`}></div>
                        <div>
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                          <CardDescription>{role.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {role.userCount === 0 && (
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Users with this role:</span>
                        <span className="font-medium text-foreground">{role.userCount}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Permissions:</p>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission) => (
                            <span key={permission} className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded">
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                                                    <h2 className="text-xl font-semibold text-foreground">User Management</h2>
                  <p className="text-muted-foreground text-sm">Manage system users and their access</p>
              </div>
              <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
                <DialogTrigger asChild>
                                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Create a new user account</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="user-name" className="text-right">Name</Label>
                      <Input id="user-name" placeholder="Full name" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="user-email" className="text-right">Email</Label>
                      <Input id="user-email" type="email" placeholder="email@example.com" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="user-role" className="text-right">Role</Label>
                      <select 
                        id="user-role" 
                        className="col-span-3 h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                        defaultValue=""
                      >
                        <option value="">Select role...</option>
                        {userRoles.map((role) => (
                          <option key={role.id} value={role.name}>{role.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>Cancel</Button>
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">Add User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback className="bg-orange-600 text-white">
                                {user.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded">
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {user.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{user.lastLogin}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div>
                              <h2 className="text-xl font-semibold text-foreground">System Integrations</h2>
                <p className="text-muted-foreground text-sm">Manage external system connections</p>
            </div>

            {/* Toast Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-2">
                      <Smartphone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle>Toast POS Integration</CardTitle>
                      <CardDescription>Sync team members and roles from Toast</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      toastIntegration.status === "connected" ? "bg-green-100 text-green-700" : 
                      toastIntegration.status === "connecting" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {toastIntegration.status === "connecting" ? "Connecting..." : toastIntegration.status}
                    </span>
                    {toastIntegration.status === "connected" ? (
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => performFullSync()}
                          disabled={toastIntegration.isLoading}
                        >
                          {toastIntegration.isLoading ? "Syncing..." : "Sync from Toast"}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={async () => {
                            if (selectedRestaurant) {
                              await fetch(`/api/toast/employees/clear?restaurantGuid=${selectedRestaurant}`, { method: 'POST' });
                              await performFullSync();
                            }
                          }}
                          disabled={toastIntegration.isLoading}
                          className="text-red-600 hover:text-red-700"
                        >
                          Clear & Re-sync
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={testConnection}
                        disabled={toastIntegration.isLoading}
                      >
                        {toastIntegration.isLoading ? "Connecting..." : "Connect"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Last Sync</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{toastIntegration.lastSync}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Employees Imported</Label>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{toastIntegration.employeesImported} employees</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Connected Restaurants</Label>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{restaurants.length} restaurants</p>
                  </div>
                </div>
                
                {/* Restaurant Selection */}
                {restaurants.length > 0 && (
                  <div className="space-y-2">
                    <Label>Active Restaurant</Label>
                    <select 
                      value={selectedRestaurant || ''} 
                      onChange={(e) => {
                        console.log('Restaurant selected:', e.target.value);
                        setSelectedRestaurant(e.target.value);
                      }}
                      className="w-full p-2 border rounded-md"
                    >
                      {restaurants.map((restaurant) => (
                        <option key={restaurant.guid} value={restaurant.guid}>
                          {restaurant.restaurantName} - {restaurant.locationName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Error Display */}
                {toastIntegration.error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-red-800">{toastIntegration.error}</p>
                    </div>
                  </div>
                )}
                <div className="mt-4 space-y-3">
                  <div>
                    <Label>API Key</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input value={toastIntegration.apiKey} type="password" readOnly />
                      <Button variant="outline" size="sm">
                        Update
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Webhook URL</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input value={toastIntegration.webhookUrl} readOnly />
                      <Button variant="outline" size="sm">
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    Sync Now
                  </Button>
                  <Button variant="outline">
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Other Integrations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 rounded-lg p-2">
                      <Bell className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Notification Services</CardTitle>
                      <CardDescription>Email and SMS notifications</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Configure Notifications
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 rounded-lg p-2">
                      <Globe className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>API Access</CardTitle>
                      <CardDescription>External API integrations</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Manage API Keys
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div>
                                              <h2 className="text-xl font-semibold text-foreground">System Configuration</h2>
                <p className="text-muted-foreground text-sm">General system settings and preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Basic system configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input id="business-name" defaultValue="The Graine Ledger" />
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <select 
                      id="timezone" 
                      className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      defaultValue="UTC-5 (Eastern Time)"
                    >
                      <option>UTC-5 (Eastern Time)</option>
                      <option>UTC-6 (Central Time)</option>
                      <option>UTC-7 (Mountain Time)</option>
                      <option>UTC-8 (Pacific Time)</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <select 
                      id="currency" 
                      className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      defaultValue="USD ($)"
                    >
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                      <option>CAD (C$)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Security and authentication options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                                                                      <p className="font-medium text-foreground">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                                                                      <p className="font-medium text-foreground">Session Timeout</p>
                        <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                    </div>
                    <select 
                      className="h-8 px-2 py-1 border border-input rounded text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      defaultValue="1 hour"
                    >
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>2 hours</option>
                      <option>Never</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                                                                      <p className="font-medium text-foreground">Password Requirements</p>
                        <p className="text-sm text-muted-foreground">Minimum password complexity</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data & Backup</CardTitle>
                  <CardDescription>Data management and backup settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                                                                      <p className="font-medium text-foreground">Automatic Backup</p>
                        <p className="text-sm text-muted-foreground">Daily system backup</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      Enabled
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                                                                      <p className="font-medium text-foreground">Data Retention</p>
                        <p className="text-sm text-muted-foreground">Keep data for 7 years</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Export All Data
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                  <CardDescription>Current system status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Version:</span>
                                            <span className="font-medium text-foreground">v2.1.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Last Update:</span>
                                            <span className="font-medium text-foreground">2025-01-15</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Database:</span>
                                            <span className="font-medium text-foreground">MongoDB 7.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Uptime:</span>
                                            <span className="font-medium text-foreground">15 days, 6 hours</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Check for Updates
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 
"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CustomChartTooltip from "@/components/ui/chart-tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Package,
  Plus,
  Brain,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Download,
  Truck,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
} from "lucide-react";

// Sample data
const inventoryItems = [
  {
    id: 1,
    name: "Chicken Breast",
    category: "Proteins",
    currentStock: 45,
    minThreshold: 20,
    maxCapacity: 100,
    unit: "lbs",
    costPerUnit: 8.50,
    supplier: "Fresh Farm Co",
    lastUpdated: "2025-01-22 14:30",
    status: "adequate",
  },
  {
    id: 2,
    name: "Beef Ribeye",
    category: "Proteins",
    currentStock: 12,
    minThreshold: 15,
    maxCapacity: 50,
    unit: "lbs",
    costPerUnit: 24.00,
    supplier: "Premium Meats",
    lastUpdated: "2025-01-22 14:15",
    status: "low",
  },
  {
    id: 3,
    name: "Fresh Basil",
    category: "Herbs",
    currentStock: 8,
    minThreshold: 5,
    maxCapacity: 20,
    unit: "bunches",
    costPerUnit: 2.25,
    supplier: "Green Gardens",
    lastUpdated: "2025-01-22 14:20",
    status: "adequate",
  },
  {
    id: 4,
    name: "Extra Virgin Olive Oil",
    category: "Pantry",
    currentStock: 3,
    minThreshold: 6,
    maxCapacity: 24,
    unit: "bottles",
    costPerUnit: 15.75,
    supplier: "Mediterranean Imports",
    lastUpdated: "2025-01-22 13:45",
    status: "critical",
  },
  {
    id: 5,
    name: "Parmesan Cheese",
    category: "Dairy",
    currentStock: 18,
    minThreshold: 10,
    maxCapacity: 30,
    unit: "lbs",
    costPerUnit: 18.50,
    supplier: "Artisan Dairy",
    lastUpdated: "2025-01-22 14:00",
    status: "adequate",
  },
];

const stockMovementData = [
  { date: "Jan 15", usage: 85, received: 120 },
  { date: "Jan 16", usage: 92, received: 0 },
  { date: "Jan 17", usage: 78, received: 50 },
  { date: "Jan 18", usage: 95, received: 0 },
  { date: "Jan 19", usage: 88, received: 75 },
  { date: "Jan 20", usage: 102, received: 0 },
  { date: "Jan 21", usage: 90, received: 100 },
];

const suppliers = [
  {
    id: 1,
    name: "Fresh Farm Co",
    contact: "John Smith",
    phone: "(555) 123-4567",
    email: "orders@freshfarm.com",
    category: "Proteins",
    rating: 4.8,
    deliveryDays: "Mon, Wed, Fri",
  },
  {
    id: 2,
    name: "Green Gardens",
    contact: "Maria Rodriguez",
    phone: "(555) 234-5678",
    email: "supply@greengardens.com",
    category: "Produce",
    rating: 4.6,
    deliveryDays: "Tue, Thu, Sat",
  },
  {
    id: 3,
    name: "Premium Meats",
    contact: "David Wilson",
    phone: "(555) 345-6789",
    email: "orders@premiummeats.com",
    category: "Proteins",
    rating: 4.9,
    deliveryDays: "Mon, Wed, Fri",
  },
];

const aiSuggestions = [
  {
    type: "reorder",
    title: "Immediate Reorder Required",
    items: ["Extra Virgin Olive Oil", "Beef Ribeye"],
    urgency: "critical",
    description: "These items are below minimum threshold and may impact menu availability.",
    action: "Order 12 bottles olive oil, 25 lbs ribeye",
  },
  {
    type: "optimization",
    title: "Cost Optimization Opportunity",
    items: ["Chicken Breast"],
    urgency: "medium",
    description: "Price trend analysis suggests waiting 2-3 days for better rates.",
    action: "Delay order by 3 days to save ~$45",
  },
  {
    type: "waste_prevention",
    title: "Waste Prevention Alert",
    items: ["Fresh Basil"],
    urgency: "low",
    description: "Current usage rate suggests these items may expire before depletion.",
    action: "Create special menu items featuring basil",
  },
];

export default function InventoryPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "tag-red";
      case "low": return "tag-yellow";
      case "adequate": return "tag-green";
      default: return "tag-slate";
    }
  };

  const getCriticalItems = () => inventoryItems.filter(item => item.status === "critical");
  const getLowStockItems = () => inventoryItems.filter(item => item.status === "low");

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">Track stock levels, manage suppliers, and optimize purchasing</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Inventory Item</DialogTitle>
                  <DialogDescription>Add a new item to your inventory tracking</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="item-name" className="text-right">Name</Label>
                    <Input id="item-name" placeholder="Item name" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">Category</Label>
                    <select 
                      id="category" 
                      className="col-span-3 h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      defaultValue=""
                    >
                      <option value="">Select category...</option>
                      <option>Proteins</option>
                      <option>Produce</option>
                      <option>Dairy</option>
                      <option>Pantry</option>
                      <option>Herbs</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="current-stock" className="text-right">Current Stock</Label>
                    <Input id="current-stock" type="number" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="min-threshold" className="text-right">Min Threshold</Label>
                    <Input id="min-threshold" type="number" className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="unit" className="text-right">Unit</Label>
                    <Input id="unit" placeholder="lbs, pieces, bottles, etc." className="col-span-3" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddItemOpen(false)}>Cancel</Button>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">Add Item</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* AI Suggestions */}
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-orange-600 rounded-full p-2">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-3">🧠 Varuni's Inventory Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiSuggestions.map((suggestion, index) => (
                                          <div key={index} className="bg-card rounded-lg p-4 border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">{suggestion.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          suggestion.urgency === "critical" ? "tag-red" :
                          suggestion.urgency === "medium" ? "tag-yellow" : "tag-blue"
                        }`}>
                          {suggestion.urgency}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                      <p className="text-xs text-muted-foreground font-medium mb-3">{suggestion.action}</p>
                      <Button size="sm" variant="outline">
                        Apply Suggestion
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                                      <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                    <p className="text-2xl font-bold text-foreground">{inventoryItems.length}</p>
                </div>
                <Package className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                                      <p className="text-sm font-medium text-muted-foreground">Critical Items</p>
                  <p className="text-2xl font-bold text-red-600">{getCriticalItems().length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                                      <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">{getLowStockItems().length}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                                      <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${inventoryItems.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0).toFixed(0)}
                    </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Critical Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Critical Items
                  </CardTitle>
                  <CardDescription>Items requiring immediate attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getCriticalItems().map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.currentStock} {item.unit} remaining (min: {item.minThreshold})
                          </p>
                        </div>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                          Reorder
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest inventory movements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 rounded-full p-2">
                        <Truck className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Delivery received from Fresh Farm Co</p>
                        <p className="text-xs text-slate-500">2 hours ago • 50 lbs Chicken Breast</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 rounded-full p-2">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Stock level updated</p>
                        <p className="text-xs text-slate-500">4 hours ago • Extra Virgin Olive Oil</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-yellow-100 rounded-full p-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Low stock alert triggered</p>
                        <p className="text-xs text-slate-500">6 hours ago • Beef Ribeye</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stock Movement Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Stock Movement Trends</CardTitle>
                <CardDescription>Daily usage vs. received inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stockMovementData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      className="dark:[&_.recharts-text]:fill-slate-400 dark:[&_.recharts-cartesian-axis-line]:stroke-slate-700"
                    />
                    <YAxis 
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      className="dark:[&_.recharts-text]:fill-slate-400 dark:[&_.recharts-cartesian-axis-line]:stroke-slate-700"
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Line type="monotone" dataKey="usage" stroke="#ef4444" strokeWidth={2} name="Usage" />
                    <Line type="monotone" dataKey="received" stroke="#ea580c" strokeWidth={2} name="Received" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Inventory Items</CardTitle>
                    <CardDescription>Manage your complete inventory catalog</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min Threshold</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                                                  <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          {item.currentStock} {item.unit}
                        </TableCell>
                        <TableCell>
                          {item.minThreshold} {item.unit}
                        </TableCell>
                        <TableCell>${item.costPerUnit}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </TableCell>
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

          {/* Suppliers Tab */}
          <TabsContent value="suppliers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Management</CardTitle>
                <CardDescription>Manage your vendor relationships</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {suppliers.map((supplier) => (
                    <div key={supplier.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                                                                                  <h3 className="font-semibold text-foreground">{supplier.name}</h3>
                            <p className="text-sm text-muted-foreground">{supplier.category}</p>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium mr-1">{supplier.rating}</span>
                          <div className="text-yellow-500">★</div>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-slate-600">
                        <p><strong>Contact:</strong> {supplier.contact}</p>
                        <p><strong>Phone:</strong> {supplier.phone}</p>
                        <p><strong>Email:</strong> {supplier.email}</p>
                        <p><strong>Delivery:</strong> {supplier.deliveryDays}</p>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          Edit
                        </Button>
                        <Button size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
                          Order
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                  <CardDescription>Inventory value by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={inventoryItems.reduce((acc, item) => {
                      const existing = acc.find(cat => cat.category === item.category);
                      if (existing) {
                        existing.value += item.currentStock * item.costPerUnit;
                      } else {
                        acc.push({
                          category: item.category,
                          value: item.currentStock * item.costPerUnit
                        });
                      }
                      return acc;
                    }, [] as Array<{category: string, value: number}>)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                      <XAxis 
                        dataKey="category" 
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        className="dark:[&_.recharts-text]:fill-slate-400 dark:[&_.recharts-cartesian-axis-line]:stroke-slate-700"
                      />
                      <YAxis 
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        className="dark:[&_.recharts-text]:fill-slate-400 dark:[&_.recharts-cartesian-axis-line]:stroke-slate-700"
                      />
                      <Tooltip content={<CustomChartTooltip formatter={(value) => [`$${Number(value).toFixed(0)}`, 'Value']} />} />
                      <Bar dataKey="value" fill="#ea580c" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stock Status Distribution</CardTitle>
                  <CardDescription>Items by status level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['adequate', 'low', 'critical'].map((status) => {
                      const count = inventoryItems.filter(item => item.status === status).length;
                      const percentage = (count / inventoryItems.length) * 100;
                      return (
                        <div key={status} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{status}</span>
                            <span>{count} items ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                status === 'adequate' ? 'bg-green-500' :
                                status === 'low' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
} 
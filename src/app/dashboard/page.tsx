"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Package,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  Star,
  Zap,
  Loader2,
} from "lucide-react";
import { useTeamMembers, useInventoryItems, useAnalytics, useLowStockItems } from "@/lib/hooks/use-graphql";
import { format } from "date-fns";

// Sample data for charts (fallback)
const salesData = [
  { name: "Mon", sales: 4200, orders: 25 },
  { name: "Tue", sales: 3800, orders: 22 },
  { name: "Wed", sales: 5100, orders: 31 },
  { name: "Thu", sales: 4600, orders: 28 },
  { name: "Fri", sales: 6200, orders: 38 },
  { name: "Sat", sales: 7800, orders: 45 },
  { name: "Sun", sales: 6900, orders: 41 },
];

const inventoryData = [
  { name: "Proteins", value: 35, color: "#ea580c" },
  { name: "Vegetables", value: 25, color: "#f97316" },
  { name: "Dairy", value: 20, color: "#fb923c" },
  { name: "Pantry", value: 15, color: "#fed7aa" },
  { name: "Beverages", value: 5, color: "#ffedd5" },
];

const recentActivities = [
  {
    id: 1,
    type: "order",
    message: "New order #2841 received",
    time: "2 minutes ago",
    status: "success",
  },
  {
    id: 2,
    type: "inventory",
    message: "Low stock alert: Chicken breast",
    time: "15 minutes ago",
    status: "warning",
  },
  {
    id: 3,
    type: "staff",
    message: "Sarah clocked in for evening shift",
    time: "1 hour ago",
    status: "info",
  },
  {
    id: 4,
    type: "payment",
    message: "Invoice #INV-2024-001 paid",
    time: "2 hours ago",
    status: "success",
  },
];

export default function DashboardPage() {
  const [selectedMetric, setSelectedMetric] = useState("sales");

  // Fetch real data from GraphQL
  const { data: teamData, loading: teamLoading, error: teamError } = useTeamMembers();
  const { data: inventoryApiData, loading: inventoryLoading, error: inventoryError } = useInventoryItems();
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } = useAnalytics("daily");
  const { data: lowStockData, loading: lowStockLoading, error: lowStockError } = useLowStockItems();

  // Calculate metrics from real data
  const activeStaff = teamData?.teamMembers?.filter((member: any) => member.status === 'active').length || 0;
  const totalInventoryItems = inventoryApiData?.inventoryItems?.length || 0;
  const lowStockCount = lowStockData?.lowStockItems?.length || 0;
  const revenue = analyticsData?.analytics?.revenue || 0;
  const orders = analyticsData?.analytics?.orders || 0;
  const tableTurnover = analyticsData?.analytics?.tableTurnover || 0;

  const metrics = [
    {
      title: "Today's Revenue",
      value: `$${revenue.toLocaleString()}`,
      change: "+12.5%",
      changeType: "positive",
      icon: DollarSign,
      loading: analyticsLoading,
    },
    {
      title: "Orders",
      value: orders.toString(),
      change: "+8.2%",
      changeType: "positive",
      icon: Package,
      loading: analyticsLoading,
    },
    {
      title: "Active Staff",
      value: activeStaff.toString(),
      change: "No change",
      changeType: "neutral",
      icon: Users,
      loading: teamLoading,
    },
    {
      title: "Table Turnover",
      value: `${tableTurnover.toFixed(1)}x`,
      change: "-2.1%",
      changeType: "negative",
      icon: Calendar,
      loading: analyticsLoading,
    },
  ];

  // Generate staff schedule from real data
  const staffSchedule = teamData?.teamMembers?.slice(0, 4).map((member: any) => ({
    name: member.name,
    role: member.role,
    shift: "2:00 PM - 10:00 PM", // This would come from shifts data
    status: member.status === 'active' ? 'active' : 'scheduled'
  })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening at your restaurant today.</p>
          </div>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white">
            <Brain className="mr-2 h-4 w-4" />
            Ask Varuni
          </Button>
        </div>

        {/* AI Insights Banner */}
                <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-orange-600 rounded-full p-2">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">🧠 Varuni AI Insights</h3>
                <p className="text-muted-foreground text-sm mb-3">
                  Based on current trends, I recommend increasing staff for tomorrow's dinner rush. 
                  Your inventory for chicken breast is running low - consider reordering soon.
                </p>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="font-medium">
                    View Details
                  </Button>
                  <Button size="sm" variant="outline" className="font-medium">
                      Dismiss
                    </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    {metric.loading ? (
                      <div className="flex items-center mt-1">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Loading...</span>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-foreground mt-1">{metric.value}</p>
                    )}
                    <div className="flex items-center mt-2">
                      {metric.changeType === "positive" && (
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      )}
                      {metric.changeType === "negative" && (
                        <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                      )}
                      <span
                        className={`text-sm ${
                          metric.changeType === "positive"
                            ? "text-green-600"
                            : metric.changeType === "negative"
                            ? "text-red-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        {metric.change}
                      </span>
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-3">
                    <metric.icon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analytics Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Performance</CardTitle>
                <CardDescription>Sales and order trends for the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sales">Sales</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                  </TabsList>
                  <TabsContent value="sales" className="mt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                        <XAxis 
                          dataKey="name" 
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
                        <Bar dataKey="sales" fill="#ea580c" />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>
                  <TabsContent value="orders" className="mt-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#e2e8f0" }}
                          className="dark:[&_.recharts-text]:fill-slate-400 dark:[&_.recharts-cartesian-axis-line]:stroke-slate-700"
                        />
                        <YAxis 
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={{ stroke: "#e2e8f0" }}
                          className="dark:[&_.recharts-cartesian-axis-line]:stroke-slate-700 dark:[&_.recharts-text]:fill-slate-400"
                        />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="orders" 
                          stroke="#ea580c" 
                          strokeWidth={2}
                          dot={{ fill: "#ea580c", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: "#ea580c" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Current Staff Schedule */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Staff Schedule</CardTitle>
                <CardDescription>Current and upcoming shifts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffSchedule.map((staff: any, index: number) => (
                                                                <div key={index} className="flex items-center justify-between p-4 bg-card rounded-lg border-2 border-border shadow-md hover:shadow-lg transition-shadow">
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-semibold">
                            {staff.name.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                        <div>
                          <p className="font-semibold text-foreground">{staff.name}</p>
                          <p className="text-sm text-muted-foreground">{staff.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{staff.shift}</p>
                        <div className="flex items-center justify-end mt-1">
                          {staff.status === "active" ? (
                            <div className="flex items-center text-green-600 dark:text-green-400">
                              <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-2"></div>
                              <span className="text-xs">Active</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              <span className="text-xs">Scheduled</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Inventory Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Overview</CardTitle>
                <CardDescription>Current stock levels by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={inventoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {inventoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {inventoryData.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`rounded-full p-1 ${
                        activity.status === "success" ? "bg-green-100 dark:bg-green-900/30" :
                        activity.status === "warning" ? "bg-yellow-100 dark:bg-yellow-900/30" :
                        "bg-blue-100 dark:bg-blue-900/30"
                      }`}>
                        {activity.status === "success" && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />}
                        {activity.status === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />}
                        {activity.status === "info" && <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center">
                    <Calendar className="h-4 w-4 mb-1" />
                    <span className="text-xs">Schedule</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center">
                    <Package className="h-4 w-4 mb-1" />
                    <span className="text-xs">Inventory</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center">
                    <DollarSign className="h-4 w-4 mb-1" />
                    <span className="text-xs">Invoice</span>
                  </Button>
                  <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col items-center">
                    <Users className="h-4 w-4 mb-1" />
                    <span className="text-xs">Team</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 
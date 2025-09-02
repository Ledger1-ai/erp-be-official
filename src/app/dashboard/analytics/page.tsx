"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { PermissionDenied, PermissionTab } from "@/components/ui/permission-denied";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  Brain,
  Download,
  Filter,
  Calendar,
  Target,
} from "lucide-react";

// Sample data
const revenueData = [
  { month: "Jan 2024", revenue: 45000, target: 50000, growth: 8.2 },
  { month: "Feb 2024", revenue: 48000, target: 52000, growth: 6.7 },
  { month: "Mar 2024", revenue: 52000, target: 54000, growth: 8.3 },
  { month: "Apr 2024", revenue: 49000, target: 55000, growth: -5.8 },
  { month: "May 2024", revenue: 55000, target: 57000, growth: 12.2 },
  { month: "Jun 2024", revenue: 62000, target: 60000, growth: 12.7 },
  { month: "Jul 2024", revenue: 58000, target: 62000, growth: -6.5 },
  { month: "Aug 2024", revenue: 65000, target: 65000, growth: 12.1 },
  { month: "Sep 2024", revenue: 68000, target: 67000, growth: 4.6 },
  { month: "Oct 2024", revenue: 72000, target: 70000, growth: 5.9 },
  { month: "Nov 2024", revenue: 75000, target: 72000, growth: 4.2 },
  { month: "Dec 2024", revenue: 78000, target: 75000, growth: 4.0 },
];

const dailyMetrics = [
  { day: "Mon", sales: 8400, orders: 48, avgOrder: 175 },
  { day: "Tue", sales: 7200, orders: 42, avgOrder: 171 },
  { day: "Wed", sales: 9600, orders: 52, avgOrder: 185 },
  { day: "Thu", sales: 11200, orders: 58, avgOrder: 193 },
  { day: "Fri", sales: 14800, orders: 72, avgOrder: 206 },
  { day: "Sat", sales: 16400, orders: 78, avgOrder: 210 },
  { day: "Sun", sales: 13200, orders: 65, avgOrder: 203 },
];

const categoryPerformance = [
  { category: "Appetizers", revenue: 18500, orders: 245, avgPrice: 75.5, margin: 68 },
  { category: "Main Courses", revenue: 45200, orders: 312, avgPrice: 145, margin: 72 },
  { category: "Desserts", revenue: 8900, orders: 189, avgPrice: 47, margin: 85 },
  { category: "Beverages", revenue: 12400, orders: 456, avgPrice: 27, margin: 92 },
  { category: "Specials", revenue: 6800, orders: 45, avgPrice: 151, margin: 65 },
];

const customerMetrics = [
  { segment: "New Customers", value: 35, color: "#10b981" },
  { segment: "Returning", value: 45, color: "#059669" },
  { segment: "VIP Members", value: 20, color: "#047857" },
];

const staffPerformance = [
  { name: "Sarah J.", sales: 15200, orders: 78, rating: 4.9, efficiency: 95 },
  { name: "Mike C.", sales: 13400, orders: 72, rating: 4.7, efficiency: 91 },
  { name: "Emma D.", sales: 11800, orders: 68, rating: 4.8, efficiency: 89 },
  { name: "Alex R.", sales: 10900, orders: 65, rating: 4.6, efficiency: 87 },
];

const aiInsights = [
  {
    type: "revenue",
    title: "Revenue Optimization",
    description: "Thursday dinner service shows 23% higher profit margins. Consider promoting premium items during this period.",
    impact: "potential +$2,400/month",
    priority: "high",
  },
  {
    type: "efficiency",
    title: "Operational Efficiency",
    description: "Average order preparation time has increased by 12% this month. Kitchen workflow optimization recommended.",
    impact: "reduce wait time by 8 minutes",
    priority: "medium",
  },
  {
    type: "customer",
    title: "Customer Retention",
    description: "VIP customer frequency has decreased by 15%. Targeted loyalty campaign suggested.",
    impact: "retain 85% of VIP customers",
    priority: "high",
  },
];

export default function AnalyticsPage() {
  const permissions = usePermissions();
  const [selectedTimeframe, setSelectedTimeframe] = useState("12m");
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Check if user has any analytics permissions
  const canViewBasicAnalytics = permissions.hasPermission('analytics');
  const canViewDetailedAnalytics = permissions.hasPermission('analytics:detailed');
  
  // If no analytics permission at all, show permission denied
  if (!canViewBasicAnalytics) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <PermissionDenied 
            variant="full"
            title="Analytics Access Required"
            message="You need analytics permissions to view reports and data insights."
            actionButton={{
              text: "Back to Dashboard",
              onClick: () => window.location.href = "/dashboard"
            }}
          />
        </div>
      </DashboardLayout>
    );
  }

  const kpiMetrics = [
    {
      title: "Total Revenue",
      value: "$78,000",
      change: "+4.0%",
      changeType: "positive",
      icon: DollarSign,
      description: "vs last month",
    },
    {
      title: "Average Order Value",
      value: "$187",
      change: "+12.5%",
      changeType: "positive",
      icon: Target,
      description: "vs last month",
    },
    {
      title: "Customer Satisfaction",
      value: "4.8/5",
      change: "+0.2",
      changeType: "positive",
      icon: Users,
      description: "avg rating",
    },
    {
      title: "Table Turnover",
      value: "3.2x",
      change: "-2.1%",
      changeType: "negative",
      icon: Clock,
      description: "per day",
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">Comprehensive performance insights and AI-powered recommendations</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <select 
              value={selectedTimeframe} 
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="3m">Last 3 months</option>
              <option value="12m">Last 12 months</option>
            </select>
          </div>
        </div>

        {/* AI Insights */}
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-orange-600 rounded-full p-2">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-foreground">Varuni's Strategic Insights</h3>
                  <Badge variant="warning">Coming Soon</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className="bg-card rounded-lg p-4 border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">{insight.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          insight.priority === "high" ? "tag-red" : "tag-yellow"
                        }`}>
                          {insight.priority}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      <p className="text-xs text-muted-foreground font-medium mb-3">Impact: {insight.impact}</p>
                      <Button size="sm" variant="outline">
                        Learn More
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiMetrics
            .filter((metric, index) => {
              // Financial metrics (Revenue, Order Value) require detailed analytics permission
              const isFinancialMetric = index <= 1; // First two metrics are financial
              return canViewDetailedAnalytics || !isFinancialMetric;
            })
            .map((metric, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{metric.value}</p>
                    <div className="flex items-center mt-2">
                      {metric.changeType === "positive" ? (
                        <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                      )}
                      <span
                        className={`text-sm ${
                          metric.changeType === "positive" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {metric.change}
                      </span>
                      <span className="text-sm text-muted-foreground ml-1">{metric.description}</span>
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

        {/* Main Analytics */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className={`grid w-full ${canViewDetailedAnalytics ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {canViewDetailedAnalytics && <TabsTrigger value="revenue">Revenue</TabsTrigger>}
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend - Detailed analytics permission required */}
              {canViewDetailedAnalytics && (
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Monthly revenue vs targets</CardDescription>
                  </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData.slice(-6)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        className="dark:[&_.recharts-text]:fill-slate-400 dark:[&_.recharts-cartesian-axis-line]:stroke-slate-700"
                      />
                      <YAxis 
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        className="dark:[&_.recharts-text]:fill-slate-400 dark:[&_.recharts-cartesian-axis-line]:stroke-slate-700"
                      />
                      <Tooltip content={<CustomChartTooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />} />
                      <Area type="monotone" dataKey="revenue" stroke="#ea580c" fill="#ea580c" fillOpacity={0.3} strokeWidth={2} />
                      <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              )}

              {/* Daily Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Performance</CardTitle>
                  <CardDescription>This week's sales by day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyMetrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                      <XAxis 
                        dataKey="day" 
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        className="dark:[&_.recharts-text]:fill-slate-400 dark:[&_.recharts-cartesian-axis-line]:stroke-slate-700"
                      />
                      <YAxis 
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={{ stroke: "#e2e8f0" }}
                        className="dark:[&_.recharts-text]:fill-slate-400 dark:[&_.recharts-cartesian-axis-line]:stroke-slate-700"
                      />
                      <Tooltip content={<CustomChartTooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Sales']} />} />
                      <Bar dataKey="sales" fill="#ea580c" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                  <CardDescription>Revenue by menu category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryPerformance.map((category, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                                                                                  <span className="font-medium text-foreground">{category.category}</span>
                            <span className="text-sm text-muted-foreground">${category.revenue.toLocaleString()}</span>
                        </div>
                                                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${(category.revenue / 45200) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{category.orders} orders</span>
                          <span>{category.margin}% margin</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Segments */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Segments</CardTitle>
                  <CardDescription>Customer distribution by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={customerMetrics}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ segment, value }) => `${segment}: ${value}%`}
                      >
                        {customerMetrics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab - Detailed analytics permission required */}
          {canViewDetailedAnalytics && (
            <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analysis</CardTitle>
                <CardDescription>Detailed revenue breakdown and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      className="dark:[&_.recharts-text]:fill-slate-400 dark:[&_.recharts-cartesian-axis-line]:stroke-slate-700"
                    />
                    <YAxis 
                      tick={{ fill: "#64748b", fontSize: 12 }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      className="dark:[&_.recharts-text]:fill-slate-400 dark:[&_.recharts-cartesian-axis-line]:stroke-slate-700"
                    />
                    <Tooltip content={<CustomChartTooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />} />
                    <Line type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={3} />
                    <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            </TabsContent>
          )}

          {/* Operations Tab */}
          <TabsContent value="operations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Performance</CardTitle>
                <CardDescription>Individual team member metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffPerformance.map((staff, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="bg-orange-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-semibold">
                          {staff.name.split(" ")[0][0]}{staff.name.split(" ")[1][0]}
                        </div>
                        <div>
                                                                                  <p className="font-medium text-foreground">{staff.name}</p>
                            <p className="text-sm text-muted-foreground">{staff.orders} orders</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <p className="font-semibold">${staff.sales.toLocaleString()}</p>
                                                      <p className="text-sm text-muted-foreground">Sales</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{staff.rating}/5</p>
                                                      <p className="text-sm text-muted-foreground">Rating</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{staff.efficiency}%</p>
                                                      <p className="text-sm text-muted-foreground">Efficiency</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Satisfaction</CardTitle>
                  <CardDescription>Average ratings and feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                                          <div className="text-center">
                        <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">4.8</div>
                        <div className="text-sm text-muted-foreground">out of 5 stars</div>
                      </div>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center space-x-2">
                          <span className="text-sm w-6 text-foreground">{rating}★</span>
                          <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full"
                              style={{ width: `${rating === 5 ? 65 : rating === 4 ? 25 : rating === 3 ? 8 : rating === 2 ? 2 : 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">
                            {rating === 5 ? '65%' : rating === 4 ? '25%' : rating === 3 ? '8%' : rating === 2 ? '2%' : '0%'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Retention</CardTitle>
                  <CardDescription>Repeat customer analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Repeat Customer Rate</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">68%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Visit Frequency</span>
                      <span className="font-semibold">2.3x/month</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Customer Lifetime Value</span>
                      <span className="font-semibold">$1,247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Churn Rate</span>
                      <span className="font-semibold text-red-600">8.2%</span>
                    </div>
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
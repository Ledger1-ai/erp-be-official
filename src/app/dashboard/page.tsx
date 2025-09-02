"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { usePermissions } from "@/lib/hooks/use-permissions";
import { ConditionalRender } from "@/components/ui/permission-denied";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import CustomChartTooltip from "@/components/ui/chart-tooltip";
import { LoadingBarChart, LoadingDonutPie } from "@/components/ui/loading-charts";
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
  Bot,
  Utensils,
} from "lucide-react";
import { useTeamMembers, useInventoryItems, useAnalytics, useLowStockItems } from "@/lib/hooks/use-graphql";
import WidgetsGrid from "@/components/dashboard/WidgetsGrid";
import Link from "next/link";

interface TeamMember {
  name: string;
  role: string;
  status: string;
}

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

function timeAgo(iso: string | number | Date | undefined) {
  if (!iso) return "just now";
  const t = typeof iso === 'string' || typeof iso === 'number' ? new Date(iso).getTime() : (iso as Date).getTime();
  const diff = Math.max(0, Date.now() - t);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h>1?'s':''} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d>1?'s':''} ago`;
}

function RecentActivity() {
  const [items, setItems] = useState<Array<{ id: string; type: string; message: string; time: string; status: 'success'|'warning'|'info' }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch('/api/activity/recent');
        const json = await res.json();
        if (mounted && json?.success && Array.isArray(json.data)) setItems(json.data);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 60 * 1000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  if (loading && items.length === 0) {
    return <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-10 rounded-md bg-muted animate-pulse" />
      ))}
    </div>;
  }

  return (
    <div className="space-y-4">
      {items.map((activity) => (
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
            <p className="text-xs text-muted-foreground">{timeAgo(activity.time)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link href="/dashboard/inventory" className="h-auto p-3 flex flex-col items-center border rounded-md hover:bg-muted transition-colors">
        <Package className="h-4 w-4 mb-1" />
        <span className="text-xs">Inventory</span>
      </Link>
      <Link href="/dashboard/menu" className="h-auto p-3 flex flex-col items-center border rounded-md hover:bg-muted transition-colors">
        <Utensils className="h-4 w-4 mb-1" />
        <span className="text-xs">Menu</span>
      </Link>
      <Link href="/dashboard/team" className="h-auto p-3 flex flex-col items-center border rounded-md hover:bg-muted transition-colors">
        <Users className="h-4 w-4 mb-1" />
        <span className="text-xs">Team</span>
      </Link>
      <Link href="/dashboard/robotic-fleets" className="h-auto p-3 flex flex-col items-center border rounded-md hover:bg-muted transition-colors">
        <Bot className="h-4 w-4 mb-1" />
        <span className="text-xs">Robotics</span>
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const permissions = usePermissions();
  const [selectedMetric, setSelectedMetric] = useState("sales");
  const [ordersToday, setOrdersToday] = useState<{ revenue: number; ordersCompleted: number; avgOrderValue: number; avgTurnoverMinutes?: number } | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [weeklySeries, setWeeklySeries] = useState<Array<{ date: string; sales: number; orders: number; avgTurnoverMinutes?: number }>>([]);
  const [staffSchedule, setStaffSchedule] = useState<Array<{ name: string; role: string; shift: string; status: string; department?: string; start?: string; end?: string; isActive?: boolean }>>([]);
  const [scheduleTab, setScheduleTab] = useState<string>('all');
  const [activeShiftsCount, setActiveShiftsCount] = useState(0);
  const [activeShiftsLoading, setActiveShiftsLoading] = useState(false);
  
  // Permission checks for dashboard content
  const canViewFinancialData = permissions.canViewFinancialData();

  // Fetch real data from GraphQL
  const { data: teamData, loading: teamLoading } = useTeamMembers();
  const { data: inventoryApiData } = useInventoryItems();
  const { data: analyticsData, loading: analyticsLoading } = useAnalytics("daily");
  const { data: lowStockData } = useLowStockItems();

  // Calculate metrics from real data
  const activeStaff = teamData?.teamMembers?.filter((member: TeamMember) => member.status === 'active').length || 0;
  const revenue = analyticsData?.analytics?.revenue || 0;
  const orders = analyticsData?.analytics?.orders || 0;
  const tableTurnover = ordersToday?.avgTurnoverMinutes || analyticsData?.analytics?.tableTurnover || 0;

  const metrics = [
    {
      title: "Today's Revenue",
      value: `$${(ordersToday?.revenue ?? revenue).toLocaleString()}`,
      change: "+12.5%",
      changeType: "positive",
      icon: DollarSign,
      loading: analyticsLoading || ordersLoading,
    },
    {
      title: "Orders",
      value: (ordersToday?.ordersCompleted ?? orders).toString(),
      change: "+8.2%",
      changeType: "positive",
      icon: Package,
      loading: analyticsLoading || ordersLoading,
    },
    {
      title: "Active Staff",
      value: activeShiftsCount.toString(),
      change: "No change",
      changeType: "neutral",
      icon: Users,
      loading: activeShiftsLoading,
    },
    {
      title: "Avg Table Time",
      value: `${Number(tableTurnover).toFixed(1)} min`,
      change: "-2.1%",
      changeType: "negative",
      icon: Calendar,
      loading: analyticsLoading,
    },
  ];

  // Live orders metrics from Toast
  const fetchOrdersToday = async (force = false) => {
    try {
      setOrdersLoading(true);
      const res = await fetch(`/api/toast/orders-metrics${force ? '?force=true' : ''}`);
      const json = await res.json();
      if (json?.success) setOrdersToday(json.data);
    } catch {
      // ignore
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersToday();
    const id = setInterval(() => fetchOrdersToday(false), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Load weekly performance for charts
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/toast/weekly-performance');
        const json = await res.json();
        if (json?.success) setWeeklySeries(json.data);
      } catch {}
    })();
  }, []);

  const chartData = weeklySeries.length > 0
    ? weeklySeries.map(d => ({ name: d.date.slice(5), sales: d.sales, orders: d.orders, turnover: d.avgTurnoverMinutes || 0 }))
    : salesData;

  // Load active staff from 7shifts (show real names and times)
  useEffect(() => {
    (async () => {
      try {
        setActiveShiftsLoading(true);
        const res = await fetch('/api/7shifts/active-shifts');
        const json = await res.json();
        if (json?.success && (Array.isArray(json?.data) || json?.grouped)) {
          // Prefer grouped if available
          const grouped = json.grouped as Record<string, any[]> | undefined;
          let list: any[] = [];
          if (grouped && typeof grouped === 'object') {
            for (const [dept, arr] of Object.entries(grouped)) {
              for (const s of (arr as any[])) list.push({ ...s, department: dept });
            }
          } else if (Array.isArray(json.data)) {
            list = json.data;
          }
          const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
          const mapped = list.map((s: any) => {
            const startMs = Number.isFinite(Number(s.startMs)) ? Number(s.startMs) : (s.start ? Date.parse(String(s.start)) : NaN);
            const endMs = Number.isFinite(Number(s.endMs)) ? Number(s.endMs) : (s.end ? Date.parse(String(s.end)) : NaN);
            const now = Date.now();
            const isActive = Boolean(Number.isFinite(startMs) && Number.isFinite(endMs) && now >= (startMs as number) && now <= (endMs as number));
            const localRange = (typeof s.range === 'string' && s.range.trim().length > 0)
              ? s.range
              : (Number.isFinite(startMs) && Number.isFinite(endMs)
                ? `${timeFmt.format(new Date(startMs as number))} - ${timeFmt.format(new Date(endMs as number))}`
                : '—');
            return {
              name: s.name,
              role: s.role || 'Shift',
              shift: localRange,
              status: isActive ? 'active' : 'scheduled',
              department: s.department || 'Other',
              start: s.start,
              end: s.end,
              isActive,
            };
          });
          setActiveShiftsCount(mapped.filter((m: any) => m.isActive).length);
          setStaffSchedule(mapped);
          return;
        }
      } catch {}
      finally {
        setActiveShiftsLoading(false);
      }
      const fallback = teamData?.teamMembers?.slice(0, 4).map((member: TeamMember) => ({
        name: member.name,
        role: member.role,
        shift: '—',
        status: member.status === 'active' ? 'active' : 'scheduled'
      })) || [];
      setStaffSchedule(fallback);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute active/inactive status every minute without refetching
  useEffect(() => {
    const id = setInterval(() => {
      setStaffSchedule(prev => {
        const now = Date.now();
        const updated = prev.map(s => {
          const st = s.start ? Date.parse(String(s.start)) : NaN;
          const en = s.end ? Date.parse(String(s.end)) : NaN;
          const isActive = Number.isFinite(st) && Number.isFinite(en) ? (now >= (st as number) && now <= (en as number)) : s.isActive;
          return { ...s, isActive, status: isActive ? 'active' : 'scheduled' };
        });
        setActiveShiftsCount(updated.filter(u => u.isActive).length);
        return updated;
      });
    }, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Derived groups and departments for schedule tabs
  const scheduleGroups = useMemo(() => {
    const groups: Record<string, Array<{ name: string; role: string; shift: string; status: string; department?: string; start?: string; end?: string; isActive?: boolean }>> = {};
    for (const s of staffSchedule as any[]) {
      const dept = (s.department || 'Other') as string;
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(s);
    }
    return groups;
  }, [staffSchedule]);
  const departments = useMemo(() => Object.keys(scheduleGroups).sort(), [scheduleGroups]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* No-op */}
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s what&apos;s happening at your restaurant today.</p>
          </div>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={() => {
            const evt = new CustomEvent('open-varuni');
            window.dispatchEvent(evt);
          }}>
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
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">Varuni AI Insights</h3>
                  <Badge variant="warning">Coming Soon</Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-3">
                  Based on current trends, I recommend increasing staff for tomorrow&apos;s dinner rush. 
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
          {metrics
            .filter((metric, index) => {
              // Hide revenue metric for users without financial permissions
              const isFinancialMetric = index === 0; // First metric is revenue
              return canViewFinancialData || !isFinancialMetric;
            })
            .map((metric, index) => (
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Analytics Charts */}
          <div className="lg:col-span-2 h-full flex flex-col space-y-6">
            {/* Sales Chart - Financial permission required */}
            {canViewFinancialData && (
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Performance</CardTitle>
                  <CardDescription>Sales and order trends for the past week</CardDescription>
                </CardHeader>
              <CardContent>
                <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="sales">Sales</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="turnover">Turnover</TabsTrigger>
                  </TabsList>
                  <TabsContent value="sales" className="mt-6">
                    {weeklySeries.length === 0 ? (
                      <LoadingBarChart />
                    ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
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
                        <Tooltip content={<CustomChartTooltip formatter={(v) => [
                          typeof v === 'number' ? `$${v.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}` : String(v),
                          'Sales'
                        ]} />} />
                        {
                          (() => {
                            const values = chartData.map((d: any) => Number(d.sales || 0));
                            const max = Math.max(1, ...values);
                            // Stepped solid orange palette (light -> dark)
                            const shades = [
                              '#ffedd5', // 100 - lightest
                              '#fed7aa', // 200
                              '#fdba74', // 300
                              '#fb923c', // 400
                              '#f97316', // 500
                              '#ea580c', // 600
                              '#c2410c'  // 700 - darkest
                            ];
                            return (
                              <Bar dataKey="sales">
                                {chartData.map((entry: any, index: number) => {
                                  const ratio = Math.min(1, Number(entry.sales || 0) / max);
                                  const shadeIndex = Math.max(0, Math.min(shades.length - 1, Math.floor(ratio * (shades.length - 1))));
                                  const color = shades[shadeIndex];
                                  return <Cell key={`cell-sales-${index}`} fill={color} />
                                })}
                              </Bar>
                            );
                          })()
                        }
                      </BarChart>
                    </ResponsiveContainer>
                    )}
                  </TabsContent>
                  <TabsContent value="orders" className="mt-6">
                    {weeklySeries.length === 0 ? (
                      <LoadingBarChart />
                    ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
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
                        <Tooltip content={<CustomChartTooltip formatter={(v, name) => [
                          typeof v === 'number' ? v.toFixed(0) : String(v),
                          name
                        ]} />} />
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
                    )}
                  </TabsContent>
                  <TabsContent value="turnover" className="mt-6">
                    {weeklySeries.length === 0 ? (
                      <LoadingBarChart />
                    ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
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
                        <Tooltip content={<CustomChartTooltip formatter={(v) => {
                          const val = Number(v || 0);
                          const mins = Math.floor(val);
                          const secs = Math.round((val - mins) * 60);
                          const label = `${mins}m ${secs.toString().padStart(2,'0')}s`;
                          return [label, 'Avg Table Time'];
                        }} />} />
                        <Line 
                          type="monotone" 
                          dataKey="turnover" 
                          stroke="#0ea5e9" 
                          strokeWidth={2}
                          dot={{ fill: "#0ea5e9", strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: "#0ea5e9" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            )}

            {/* Current Staff Schedule */}
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle>Today&apos;s Staff Schedule</CardTitle>
                <CardDescription>Current and upcoming shifts, grouped by department</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <Tabs value={scheduleTab} onValueChange={setScheduleTab}>
                  <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${2 + departments.length}, minmax(0, 1fr))` }}>
                    <TabsTrigger value="all">All</TabsTrigger>
                    {departments.map((d) => (
                      <TabsTrigger key={d} value={`dept:${d}`}>{d}</TabsTrigger>
                    ))}
                    <TabsTrigger value="gantt">Calendar</TabsTrigger>
                  </TabsList>

                  {/* All Departments */}
                  <TabsContent value="all" className="mt-4">
                    <div className="max-h-[700px] overflow-y-auto pr-1 space-y-6">
                      {departments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No shifts found for today.</p>
                      ) : (
                        departments.map((dept) => {
                          const members = scheduleGroups[dept] || [];
                          return (
                            <div key={dept}>
                              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{dept}</div>
                              <div className="space-y-3">
                                {members.map((staff, index) => (
                                  <div key={`${dept}-${index}`} className={`flex items-center justify-between p-3 bg-card rounded-lg border-2 border-border ${staff.status === 'active' ? '' : 'opacity-60'}`}>
                                    <div className="flex items-center space-x-3">
                                      <div className="bg-orange-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs font-semibold">
                                        {staff.name.split(" ").map((n: string) => n[0]).join("")}
                                      </div>
                                      <div>
                                        <p className="font-semibold text-foreground text-sm">{staff.name}</p>
                                        <p className="text-xs text-muted-foreground">{staff.role}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs font-semibold text-foreground">{staff.shift}</p>
                                      <div className="flex items-center justify-end mt-1">
                                        {staff.status === "active" ? (
                                          <div className="flex items-center text-green-600 dark:text-green-400">
                                            <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-2"></div>
                                            <span className="text-[10px]">Active</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center text-muted-foreground">
                                            <Clock className="w-3 h-3 mr-1" />
                                            <span className="text-[10px]">Scheduled</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </TabsContent>

                  {/* Per-Department */}
                  {departments.map((dept) => (
                    <TabsContent key={dept} value={`dept:${dept}`} className="mt-4">
                      <div className="max-h-[700px] overflow-y-auto pr-1 space-y-3">
                        {(scheduleGroups[dept] || []).map((staff, index) => (
                          <div key={`${dept}-${index}`} className={`flex items-center justify-between p-3 bg-card rounded-lg border-2 border-border ${staff.status === 'active' ? '' : 'opacity-60'}`}>
                            <div className="flex items-center space-x-3">
                              <div className="bg-orange-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs font-semibold">
                                {staff.name.split(" ").map((n: string) => n[0]).join("")}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground text-sm">{staff.name}</p>
                                <p className="text-xs text-muted-foreground">{staff.role}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-foreground">{staff.shift}</p>
                              <div className="flex items-center justify-end mt-1">
                                {staff.status === "active" ? (
                                  <div className="flex items-center text-green-600 dark:text-green-400">
                                    <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-2"></div>
                                    <span className="text-[10px]">Active</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-muted-foreground">
                                    <Clock className="w-3 h-3 mr-1" />
                                    <span className="text-[10px]">Scheduled</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {((scheduleGroups[dept] || []).length === 0) && (
                          <p className="text-sm text-muted-foreground">No shifts in this department today.</p>
                        )}
                      </div>
                    </TabsContent>
                  ))}

                  {/* Calendar / Gantt */}
                  <TabsContent value="gantt" className="mt-4">
                    <div className="max-h-[700px] overflow-y-auto pr-1">
                      {(() => {
                        const items = (staffSchedule as any[]).filter(s => s.start && s.end);
                        if (items.length === 0) return <p className="text-sm text-muted-foreground">No timed shifts available for calendar view.</p>;
                        const minStart = Math.min(...items.map(s => new Date(s.start).getTime()));
                        const maxEnd = Math.max(...items.map(s => new Date(s.end).getTime()));
                        const rangeMs = Math.max(1, maxEnd - minStart);
                        return (
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground">
                              {new Date(minStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(maxEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="space-y-2">
                              {items.map((s, index) => {
                                const st = new Date(s.start).getTime();
                                const en = new Date(s.end).getTime();
                                const left = ((st - minStart) / rangeMs) * 100;
                                const width = Math.max(1, ((en - st) / rangeMs) * 100);
                                return (
                                  <div key={index} className="flex items-center space-x-2 py-1">
                                    <div className="w-40 shrink-0">
                                      <p className="text-sm text-foreground leading-tight">{s.name}</p>
                                      <p className="text-[11px] text-muted-foreground leading-tight">{s.role || 'Shift'}</p>
                                    </div>
                                    <div className="relative h-6 w-full bg-muted rounded">
                                      <div className={`absolute top-0 h-6 rounded ${s.isActive ? 'bg-green-500' : 'bg-slate-400'}`} style={{ left: `${left}%`, width: `${width}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 h-full flex flex-col">
            {/* Inventory Overview */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Inventory Overview</CardTitle>
                <CardDescription>Current stock levels by category</CardDescription>
              </CardHeader>
              <CardContent>
                {!(inventoryApiData?.inventoryItems && Array.isArray(inventoryApiData.inventoryItems) && inventoryApiData.inventoryItems.length > 0) ? (
                  <LoadingDonutPie />
                ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={(inventoryApiData?.inventoryItems && Array.isArray(inventoryApiData.inventoryItems) && inventoryApiData.inventoryItems.length > 0)
                        ? (() => {
                            const byCat: Record<string, number> = {};
                            for (const it of inventoryApiData.inventoryItems as Array<{ category?: string; currentStock?: number }>) {
                              const cat = it.category || 'Other';
                              byCat[cat] = (byCat[cat] || 0) + Number(it.currentStock || 0);
                            }
                            const total = Object.values(byCat).reduce((s, v) => s + v, 0) || 1;
                            const palette = {
                              Proteins: '#ea580c',
                              Vegetables: '#f97316',
                              Dairy: '#fb923c',
                              Pantry: '#fed7aa',
                              Beverages: '#ffedd5'
                            } as Record<string, string>;
                            return Object.entries(byCat).map(([name, val]) => ({ name, value: Math.round((val / total) * 100), color: palette[name] || '#fbbf24' }));
                          })()
                        : inventoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {((inventoryApiData?.inventoryItems && Array.isArray(inventoryApiData.inventoryItems) && inventoryApiData.inventoryItems.length > 0)
                        ? (() => {
                            const byCat: Record<string, number> = {};
                            for (const it of inventoryApiData.inventoryItems as Array<{ category?: string; currentStock?: number }>) {
                              const cat = it.category || 'Other';
                              byCat[cat] = (byCat[cat] || 0) + Number(it.currentStock || 0);
                            }
                            const total = Object.values(byCat).reduce((s, v) => s + v, 0) || 1;
                            const palette = {
                              Proteins: '#ea580c',
                              Vegetables: '#f97316',
                              Dairy: '#fb923c',
                              Pantry: '#fed7aa',
                              Beverages: '#ffedd5'
                            } as Record<string, string>;
                            return Object.entries(byCat).map(([name, val]) => ({ name, value: Math.round((val / total) * 100), color: palette[name] || '#fbbf24' }));
                          })()
                        : inventoryData).map((entry: { color: string | undefined }, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                )}
                <div className="mt-4 space-y-2">
                  {((inventoryApiData?.inventoryItems && Array.isArray(inventoryApiData.inventoryItems) && inventoryApiData.inventoryItems.length > 0)
                    ? (() => {
                        const byCat: Record<string, number> = {};
                        for (const it of inventoryApiData.inventoryItems as Array<{ category?: string; currentStock?: number }>) {
                          const cat = it.category || 'Other';
                          byCat[cat] = (byCat[cat] || 0) + Number(it.currentStock || 0);
                        }
                        const total = Object.values(byCat).reduce((s, v) => s + v, 0) || 1;
                        const palette = {
                          Proteins: '#ea580c',
                          Vegetables: '#f97316',
                          Dairy: '#fb923c',
                          Pantry: '#fed7aa',
                          Beverages: '#ffedd5'
                        } as Record<string, string>;
                        return Object.entries(byCat).map(([name, val]) => ({ name, value: Math.round((val / total) * 100), color: palette[name] || '#fbbf24' }));
                      })()
                    : inventoryData).map((item: { color: string | undefined; name: string; value: number }, index: number) => (
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
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates and notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-auto overflow-y-auto pr-1">
                  <RecentActivity />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="flex-none">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <QuickActions />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Draggable Widgets Section */}
        <WidgetsGrid />
      </div>
    </DashboardLayout>
  );
} 
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
  Plus,
  Brain,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Send,
  Clock,
  AlertTriangle,
  Calendar,
} from "lucide-react";

// Sample data
const invoices = [
  {
    id: "INV-2025-001",
    clientName: "Acme Corp",
    amount: 2450.00,
    dueDate: "2025-02-15",
    status: "paid",
    issuedDate: "2025-01-15",
    description: "Catering Services - Corporate Event",
    paymentMethod: "Bank Transfer",
  },
  {
    id: "INV-2025-002",
    clientName: "Downtown Hotel",
    amount: 3200.00,
    dueDate: "2025-02-20",
    status: "pending",
    issuedDate: "2025-01-20",
    description: "Weekly Food Supply Contract",
    paymentMethod: "Net 30",
  },
  {
    id: "INV-2025-003",
    clientName: "City Council",
    amount: 1850.00,
    dueDate: "2025-01-25",
    status: "overdue",
    issuedDate: "2024-12-25",
    description: "Holiday Party Catering",
    paymentMethod: "Check",
  },
  {
    id: "INV-2025-004",
    clientName: "Tech Startup Inc",
    amount: 890.00,
    dueDate: "2025-02-10",
    status: "draft",
    issuedDate: "2025-01-22",
    description: "Team Lunch Catering",
    paymentMethod: "Credit Card",
  },
  {
    id: "INV-2025-005",
    clientName: "Wedding Venue LLC",
    amount: 4200.00,
    dueDate: "2025-02-28",
    status: "sent",
    issuedDate: "2025-01-22",
    description: "Wedding Reception Catering",
    paymentMethod: "Bank Transfer",
  },
];

const revenueData = [
  { month: "Jul", revenue: 45000, expenses: 32000 },
  { month: "Aug", revenue: 48000, expenses: 34000 },
  { month: "Sep", revenue: 52000, expenses: 36000 },
  { month: "Oct", revenue: 49000, expenses: 35000 },
  { month: "Nov", revenue: 55000, expenses: 38000 },
  { month: "Dec", revenue: 62000, expenses: 42000 },
  { month: "Jan", revenue: 58000, expenses: 40000 },
];

const paymentMethodData = [
  { name: "Bank Transfer", value: 45, color: "#10b981" },
  { name: "Credit Card", value: 30, color: "#059669" },
  { name: "Check", value: 20, color: "#047857" },
  { name: "Cash", value: 5, color: "#065f46" },
];

const aiInsights = [
  {
    type: "cash_flow",
    title: "Cash Flow Optimization",
    description: "3 invoices totaling $5,940 are overdue. Follow up could improve cash flow by 12%.",
    urgency: "high",
    action: "Send automated reminders to overdue clients",
  },
  {
    type: "pricing",
    title: "Pricing Analysis",
    description: "Catering prices are 8% below market average. Consider adjusting rates for new contracts.",
    urgency: "medium",
    action: "Review and update pricing structure",
  },
  {
    type: "seasonal",
    title: "Seasonal Trend Alert",
    description: "Wedding season approaching. Historical data shows 40% revenue increase in Q2.",
    urgency: "low",
    action: "Prepare additional catering capacity",
  },
];

export default function InvoicingPage() {
  const [selectedTab, setSelectedTab] = useState("invoices");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);

  const filteredInvoices = invoices.filter(invoice =>
    invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "tag-green";
      case "sent": return "tag-blue";
      case "pending": return "tag-yellow";
      case "overdue": return "tag-red";
      case "draft": return "tag-slate";
      default: return "tag-slate";
    }
  };

  const getTotalRevenue = () => invoices.filter(inv => inv.status === "paid").reduce((sum, inv) => sum + inv.amount, 0);
  const getPendingAmount = () => invoices.filter(inv => inv.status === "pending" || inv.status === "sent").reduce((sum, inv) => sum + inv.amount, 0);
  const getOverdueAmount = () => invoices.filter(inv => inv.status === "overdue").reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Invoicing & Finance</h1>
            <p className="text-muted-foreground mt-1">Manage invoices, track payments, and analyze financial performance</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                  <DialogDescription>Generate a new invoice for your client</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="client-name">Client Name</Label>
                      <Input id="client-name" placeholder="Enter client name" />
                    </div>
                    <div>
                      <Label htmlFor="invoice-amount">Amount</Label>
                      <Input id="invoice-amount" type="number" placeholder="0.00" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="due-date">Due Date</Label>
                      <Input id="due-date" type="date" />
                    </div>
                    <div>
                      <Label htmlFor="payment-method">Payment Method</Label>
                      <select 
                        id="payment-method" 
                        className="h-10 px-3 py-2 border border-input rounded-md w-full bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                        defaultValue=""
                      >
                        <option value="">Select payment method...</option>
                        <option>Bank Transfer</option>
                        <option>Credit Card</option>
                        <option>Check</option>
                        <option>Cash</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" placeholder="Service description" />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <textarea
                      id="notes"
                      placeholder="Additional notes or terms"
                      className="w-full px-3 py-2 border border-input rounded-md h-20 resize-none bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateInvoiceOpen(false)}>Cancel</Button>
                  <Button variant="outline">Save as Draft</Button>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">Create & Send</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                <h3 className="font-semibold text-foreground mb-3">🧠 Varuni&apos;s Financial Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className="bg-card rounded-lg p-4 border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">{insight.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          insight.urgency === "high" ? "tag-red" :
                          insight.urgency === "medium" ? "tag-yellow" : "tag-blue"
                        }`}>
                          {insight.urgency}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                      <p className="text-xs text-muted-foreground font-medium mb-3">{insight.action}</p>
                      <Button size="sm" variant="outline">
                        Take Action
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">${getTotalRevenue().toLocaleString()}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12.5% vs last month
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${getPendingAmount().toLocaleString()}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{invoices.filter(inv => inv.status === "pending" || inv.status === "sent").length} invoices</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue Amount</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">${getOverdueAmount().toLocaleString()}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{invoices.filter(inv => inv.status === "overdue").length} invoices</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">This Month</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">$58,000</p>
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center mt-1">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    -6.5% vs last month
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-slate-600 dark:text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Invoices</CardTitle>
                    <CardDescription>Manage and track your invoices</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search invoices..."
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
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                                                  <TableCell className="font-medium text-foreground">{invoice.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">{invoice.clientName}</div>
                                                          <div className="text-sm text-muted-foreground">{invoice.description}</div>
                          </div>
                        </TableCell>
                                                  <TableCell className="font-medium text-foreground">${invoice.amount.toLocaleString()}</TableCell>
                        <TableCell>{invoice.dueDate}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {invoice.status === "draft" && (
                              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue vs Expenses</CardTitle>
                  <CardDescription>Monthly financial performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
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
                      <Line type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={2} name="Revenue" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Distribution of payment methods</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Invoice Status Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Status</CardTitle>
                  <CardDescription>Current invoice status distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['paid', 'sent', 'pending', 'overdue', 'draft'].map((status) => {
                      const count = invoices.filter(inv => inv.status === status).length;
                      const amount = invoices.filter(inv => inv.status === status).reduce((sum, inv) => sum + inv.amount, 0);
                      const percentage = (count / invoices.length) * 100;
                      
                      return (
                        <div key={status} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize font-medium">{status}</span>
                            <span>{count} invoices • ${amount.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                status === 'paid' ? 'bg-green-500' :
                                status === 'sent' ? 'bg-blue-500' :
                                status === 'pending' ? 'bg-yellow-500' :
                                status === 'overdue' ? 'bg-red-500' : 'bg-slate-500'
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

              {/* Top Clients */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Clients</CardTitle>
                  <CardDescription>Highest value clients this period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoices
                      .reduce((acc, invoice) => {
                        const existing = acc.find(client => client.name === invoice.clientName);
                        if (existing) {
                          existing.amount += invoice.amount;
                          existing.invoices++;
                        } else {
                          acc.push({
                            name: invoice.clientName,
                            amount: invoice.amount,
                            invoices: 1
                          });
                        }
                        return acc;
                      }, [] as Array<{name: string, amount: number, invoices: number}>)
                      .sort((a, b) => b.amount - a.amount)
                      .slice(0, 5)
                      .map((client, index) => (
                        <div key={client.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="bg-orange-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{client.name}</p>
                              <p className="text-sm text-muted-foreground">{client.invoices} invoices</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">${client.amount.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue Report</CardTitle>
                  <CardDescription>Comprehensive revenue breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Tax Summary</CardTitle>
                  <CardDescription>Quarterly tax calculations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download Excel
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Client Report</CardTitle>
                  <CardDescription>Client billing summary</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
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
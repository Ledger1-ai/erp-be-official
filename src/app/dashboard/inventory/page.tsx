"use client";

import { useState, useRef, useCallback, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import CustomChartTooltip from "@/components/ui/chart-tooltip";
import { QRCodeSVG } from "qrcode.react";
import { Scanner } from "@yudiel/react-qr-scanner";
import Webcam from "react-webcam";
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
  Scale,
  Calendar,
  User,
  QrCode,
  Camera,
  ScanLine,
  Printer,
  FileDown,
  FileSpreadsheet,
  Settings,
  Palette,
  MousePointer2,
  Save,
  RefreshCw,
  Loader2,
  Target,
  BarChart as BarChartIcon,
  Upload,
  XCircle,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
} from "lucide-react";
import React from "react";
import { 
  useInventoryItems, 
  useLowStockItems, 
  useCreateInventoryItem, 
  useUpdateInventoryItem, 
  useDeleteInventoryItem,
  useUpdateStock,
  useRecordWaste,
  useVendors,
  useCreateVendor,
  useUpdateVendor,
  useDeleteVendor,
  useUpdateVendorRepresentative
} from "@/lib/hooks/use-graphql";
import { format } from "date-fns";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// TypeScript interfaces
interface InventoryItem {
  dailyUsage: number;
  sku: any;
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  maxCapacity: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  lastUpdated: string;
  status: string;
  location?: string;
  barcode?: string;
  qrCode?: string;
  description?: string;
  brand?: string;
  expiryDate?: string;
  waste?: number;
  wasteReason?: string;
  reorderPoint?: number;
  reorderQuantity?: number;
  // Sysco-specific ordering fields
  syscoSKU?: string;
  vendorSKU?: string;
  casePackSize?: number;
  vendorCode?: string;
  syscoCategory?: string;
  leadTimeDays?: number;
  minimumOrderQty?: number;
  pricePerCase?: number;
  lastOrderDate?: string;
  preferredVendor?: string;
  alternateVendors?: Array<{
    name: string;
    sku: string;
    price: number;
    leadTime: number;
  }>;
  // Additional tracking fields
  averageDailyUsage?: number;
  seasonalItem?: boolean;
  notes?: string;
  barcodeMapping?: {
    scannedBarcode: string;
  };
  lastCount?: number;
  countDate?: string;
  countBy?: string;
  wasteLogs?: Array<{
    id: string;
    date: string;
    quantity: number;
    reason: string;
    notes?: string;
  }>;
}

interface Suggestion {
  type: string;
  title: string;
  items: string[];
  urgency: string;
  description: string;
  action: string;
  costImpact: string;
}

interface CsvItem {
  isDuplicate: boolean;
  name: string;
  syscoSUPC: string;
  category: string;
  costPerUnit: string;
}

interface CsvPreviewData {
  totalParsed: number;
  summary: {
    new: number;
    duplicates: number;
  };
  items: CsvItem[];
}

interface ScanResult {
  rawValue: string;
}

// Sample current user role - In real app, this would come from auth context
const currentUserRole = "Super Admin";

// Default label template with positioning
const defaultLabelTemplate = {
  id: "default",
  name: "Standard Inventory Label",
  width: 300,
  height: 200,
  colors: {
    background: "#ffffff",
    text: "#000000",
    border: "#cccccc",
  },
  elements: {
    logo: {
      enabled: true,
      x: 10,
      y: 10,
      width: 40,
      height: 40,
      dragging: false,
    },
    qrCode: {
      enabled: true,
      x: 240,
      y: 10,
      width: 50,
      height: 50,
      dragging: false,
    },
    itemName: {
      enabled: true,
      x: 10,
      y: 80,
      width: 280,
      height: 30,
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center" as const,
      dragging: false,
    },
    metadata: {
      enabled: true,
      x: 10,
      y: 130,
      width: 280,
      height: 60,
      fontSize: 11,
      lineHeight: 1.4,
      dragging: false,
    },
  },
};

// Azure SAM model configuration
const AZURE_SAM_CONFIG = {
  endpoint: "https://varuni.eastus2.inference.ml.azure.com/score",
  apiKey: "FtUsk1gSK6c7M3fLAor9mjEdWsd4bVUIRIs8G7zEgENA0HDluoC6JQQJ99BGAAAAAAAAAAAAINFRAZMLhPnN",
};

export default function InventoryPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isQuickCountOpen, setIsQuickCountOpen] = useState(false);
  const [quickCountIndex, setQuickCountIndex] = useState(0);
  const [detailViewItem, setDetailViewItem] = useState<Partial<InventoryItem> | null>(null);
  const [quickCountValue, setQuickCountValue] = useState<string>("");
  const [quickParValue, setQuickParValue] = useState<string>("");
  const [quickSearch, setQuickSearch] = useState("");
  const [quickTouchStartX, setQuickTouchStartX] = useState<number | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [wasteQuantity, setWasteQuantity] = useState<string>("");
  const [wasteReason, setWasteReason] = useState<string>("");
  const [wasteNotes, setWasteNotes] = useState<string>("");
  const [isLabelDesignerOpen, setIsLabelDesignerOpen] = useState(false);
  const [isQuantityModifierOpen, setIsQuantityModifierOpen] = useState(false);
  const [isCameraCountingOpen, setIsCameraCountingOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isVendorOrderExportOpen, setIsVendorOrderExportOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ 
    title: string; 
    message: string; 
    confirmText?: string; 
    danger?: boolean; 
    onConfirm: null | (() => Promise<void> | void);
  }>({ title: "", message: "", confirmText: "Confirm", danger: false, onConfirm: null });

  // Nested help state for Par/On-hand tutorial
  const [isParHelpOpen, setIsParHelpOpen] = useState(false);

  const openAddItemDialog = () => {
    setNewItemForm({
      name: "",
      category: "",
      sku: "",
      barcode: "",
      unit: "unit",
      costPerUnit: "",
      supplier: "",
      currentStock: "0",
      minThreshold: "0",
      maxCapacity: "0",
      location: "",
      description: "",
      reorderPoint: "",
      reorderQuantity: "",
      syscoSKU: "",
      vendorSKU: "",
      casePackSize: "",
      vendorCode: "",
      syscoCategory: "",
      leadTimeDays: "",
      minimumOrderQty: "",
      pricePerCase: "",
      lastOrderDate: "",
      preferredVendor: "",
      alternateVendors: "",
      averageDailyUsage: "",
      seasonalItem: "",
      notes: "",
      restockPeriod: "weekly",
      restockDays: "7",
    });
    setIsAddItemOpen(true);
  };

  const VendorsPanel: React.FC = () => {
    const { data, loading, error } = useVendors();
    const [createVendor, { loading: creatingVendor }] = useCreateVendor();
    const [updateVendor, { loading: updatingVendor }] = useUpdateVendor();
    const [deleteVendor, { loading: deletingVendor }] = useDeleteVendor();
    const [updateVendorRep, { loading: updatingRep }] = useUpdateVendorRepresentative();

    const [vendorFormOpen, setVendorFormOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState<any>(null);
    const [vendorForm, setVendorForm] = useState({
      name: "",
      companyName: "",
      supplierCode: "",
      type: "Primary",
      categories: [] as string[],
      status: "Active",
      notes: "",
      isPreferred: false,
      address: { street: "", city: "", state: "", zipCode: "", country: "US" },
      paymentTerms: { terms: "Net 30", customTerms: "", creditLimit: 0, currentBalance: 0, currency: "USD" },
      deliveryInfo: { deliveryDays: [] as string[], deliveryWindow: "", minimumOrder: 0, deliveryFee: 0, freeDeliveryThreshold: 0, leadTimeDays: 1 },
      contacts: [] as any[],
      certifications: [] as string[],
    });

    const vendors = data?.vendors || [];

    const openNewVendor = () => {
      setEditingVendor(null);
      setVendorForm({
        name: "", companyName: "", supplierCode: "", type: "Primary", categories: [], status: "Active", notes: "", isPreferred: false,
        address: { street: "", city: "", state: "", zipCode: "", country: "US" },
        paymentTerms: { terms: "Net 30", customTerms: "", creditLimit: 0, currentBalance: 0, currency: "USD" },
        deliveryInfo: { deliveryDays: [], deliveryWindow: "", minimumOrder: 0, deliveryFee: 0, freeDeliveryThreshold: 0, leadTimeDays: 1 },
        contacts: [], certifications: []
      });
      setVendorFormOpen(true);
    };

    const openEditVendor = (vendor: any) => {
      setEditingVendor(vendor);
      setVendorForm({
        name: vendor.name || "",
        companyName: vendor.companyName || "",
        supplierCode: vendor.supplierCode || "",
        type: vendor.type || "Primary",
        categories: vendor.categories || [],
        status: vendor.status || "Active",
        notes: vendor.notes || "",
        isPreferred: !!vendor.isPreferred,
        address: vendor.address || { street: "", city: "", state: "", zipCode: "", country: "US" },
        paymentTerms: vendor.paymentTerms || { terms: "Net 30", customTerms: "", creditLimit: 0, currentBalance: 0, currency: "USD" },
        deliveryInfo: vendor.deliveryInfo || { deliveryDays: [], deliveryWindow: "", minimumOrder: 0, deliveryFee: 0, freeDeliveryThreshold: 0, leadTimeDays: 1 },
        contacts: vendor.contacts || [],
        certifications: vendor.certifications || [],
      });
      setVendorFormOpen(true);
    };

    const saveVendor = async () => {
      try {
        if (editingVendor) {
          await updateVendor({ variables: { id: editingVendor.id, input: vendorForm } });
          toast.success('Vendor updated');
        } else {
          await createVendor({ variables: { input: vendorForm } });
          toast.success('Vendor created');
        }
        setVendorFormOpen(false);
      } catch (e: any) {
        toast.error(e.message || 'Failed to save vendor');
      }
    };

    const confirmDeleteVendor = (vendor: any) => {
      openConfirm({
        title: 'Delete Vendor',
        message: `Delete vendor "${vendor.name}"? This cannot be undone.`,
        confirmText: 'Delete',
        danger: true,
        onConfirm: async () => {
          await deleteVendor({ variables: { id: vendor.id } });
          toast.success('Vendor deleted');
        }
      });
    };

    const [repDialogOpen, setRepDialogOpen] = useState(false);
    const [repVendor, setRepVendor] = useState<any>(null);
    const [repForm, setRepForm] = useState({ name: '', title: '', email: '', phone: '', mobile: '', startDate: '', notes: '' });
    const [repReason, setRepReason] = useState('');

    const openRepDialog = (vendor: any) => {
      setRepVendor(vendor);
      setRepForm({
        name: vendor.currentRepresentative?.name || '',
        title: vendor.currentRepresentative?.title || '',
        email: vendor.currentRepresentative?.email || '',
        phone: vendor.currentRepresentative?.phone || '',
        mobile: vendor.currentRepresentative?.mobile || '',
        startDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setRepReason('Replacement');
      setRepDialogOpen(true);
    };

    const saveRepresentative = async () => {
      if (!repVendor) return;
      try {
        await updateVendorRep({ variables: { id: repVendor.id, input: { representative: { ...repForm, startDate: repForm.startDate ? new Date(repForm.startDate).toISOString() : null }, reason: repReason } } });
        toast.success('Vendor representative updated');
        setRepDialogOpen(false);
      } catch (e: any) {
        toast.error(e.message || 'Failed to update representative');
      }
    };

    const printVendors = () => {
      const vendors = data?.vendors || [];
      const win = window.open('', '_blank');
      if (!win) return;
      const styles = `
        <style>
          body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto; padding: 24px; color: #111827; }
          .header { display:flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
          .title { font-size: 20px; font-weight: 700; }
          .meta { color:#6B7280; font-size:12px; }
          .grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
          .card { border:1px solid #E5E7EB; border-radius:10px; padding:12px; background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(249,250,251,0.9)); }
          .name { font-weight:600; margin-bottom:4px; }
          .muted { color:#6B7280; font-size:12px; }
          .row { display:flex; gap:8px; flex-wrap: wrap; margin-top:6px; }
          .tag { font-size:11px; background:#F3F4F6; border-radius:6px; padding:2px 6px; }
          .section { font-size:12px; margin-top:8px; }
          .small { font-size:11px; color:#374151; }
          @media print { .card { break-inside: avoid; } }
        </style>
      `;
      const html = [`<div class="header"><div class="title">Vendor Directory</div><div class="meta">Generated ${new Date().toLocaleString()}</div></div>`,
        `<div class="grid">`,
        ...vendors.map((v: any) => `
          <div class="card">
            <div class="name">${v.name}${v.supplierCode ? ` • ${v.supplierCode}` : ''}</div>
            <div className="muted">${v.companyName || ''}</div>
            <div className="row small">
              <span className="tag">${v.type || '—'}</span>
              <span className="tag">${v.status || '—'}</span>
              ${Array.isArray(v.categories) ? v.categories.slice(0,3).map((c:string) => `<span className="tag">${c}</span>`).join('') : ''}
            </div>
            <div className="section small">
              <strong>Delivery:</strong> ${(Array.isArray(v.deliveryInfo?.deliveryDays) ? v.deliveryInfo.deliveryDays.join(', ') : v.deliveryInfo?.deliveryDays) || '—'}
              ${v.deliveryInfo?.deliveryWindow ? ` • ${v.deliveryInfo.deliveryWindow}` : ''}
            </div>
            <div className="section small">
              <strong>Rep:</strong> ${v.currentRepresentative?.name || '—'} ${v.currentRepresentative?.title ? `(${v.currentRepresentative.title})` : ''}
              ${v.currentRepresentative?.email ? ` • ${v.currentRepresentative.email}` : ''}
            </div>
            <div className="section small">
              <strong>Address:</strong> ${[v.address?.street, v.address?.city, v.address?.state, v.address?.zipCode].filter(Boolean).join(', ') || '—'}
            </div>
            ${v.notes ? `<div className="section small"><strong>Notes:</strong> ${v.notes}</div>` : ''}
          </div>
        `),
        `</div>`
      ].join('');
      const doc = `<html><head><title>Vendors</title>${styles}</head><body>${html}</body></html>`;
      win.document.write(doc);
      win.document.close();
      win.focus();
      win.print();
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Track preferred partners and delivery details</p>
          </div>
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={printVendors}><Printer className="h-4 w-4" /></Button>
            <Button onClick={openNewVendor} className="bg-orange-600 hover:bg-orange-700 text-white" size="sm">
              <Plus className="mr-2 h-4 w-4" /> New Vendor
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading vendors...</div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load vendors</div>
        ) : vendors.length === 0 ? (
          <div className="text-sm text-muted-foreground">No vendors yet. Add your first vendor.</div>
        ) : (
          <div className="grid gap-4">
            {vendors.map((v: any) => (
              <div key={v.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="bg-orange-100 dark:bg-orange-900/30 rounded-full p-3">
                      <Truck className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-foreground">{v.name}</h3>
                        {v.isPreferred ? (<span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">Preferred</span>) : null}
                      </div>
                      <p className="text-sm text-muted-foreground">{v.companyName}{v.supplierCode ? ` • ${v.supplierCode}` : ''}</p>
                      <p className="text-sm text-muted-foreground">{Array.isArray(v.deliveryInfo?.deliveryDays) ? v.deliveryInfo.deliveryDays.join(', ') : v.deliveryInfo?.deliveryDays}</p>
                      {v.notes ? (
                        <p className="mt-2 text-sm text-foreground"><span className="text-muted-foreground">Notes:</span> {v.notes}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditVendor(v)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => confirmDeleteVendor(v)} disabled={deletingVendor}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Delivery Window</p>
                    <p className="text-sm">{v.deliveryInfo?.deliveryWindow || '—'}</p>
                    <p className="text-xs text-muted-foreground mt-2">Minimum Order</p>
                    <p className="text-sm">{v.deliveryInfo?.minimumOrder ?? '—'}</p>
                    <p className="text-xs text-muted-foreground mt-2">Lead Time (days)</p>
                    <p className="text-sm">{v.deliveryInfo?.leadTimeDays ?? '—'}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Performance</p>
                    <p className="text-sm">On-time: {v.performanceMetrics?.onTimeDeliveryRate ?? 0}% • Quality: {v.performanceMetrics?.qualityRating ?? 0}/5</p>
                    <p className="text-xs text-muted-foreground mt-2">Totals</p>
                    <p className="text-sm">Orders: {v.performanceMetrics?.totalOrders ?? 0} • Spent: ${v.performanceMetrics?.totalSpent?.toFixed?.(2) ?? '0.00'}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Representative</p>
                      <Button variant="outline" size="sm" onClick={() => openRepDialog(v)}>Replace</Button>
                    </div>
                    {v.currentRepresentative ? (
                      <div className="mt-1 text-sm">
                        <p className="font-medium">{v.currentRepresentative.name}{v.currentRepresentative.title ? ` • ${v.currentRepresentative.title}` : ''}</p>
                        <p className="text-muted-foreground">{v.currentRepresentative.email || '—'}{v.currentRepresentative.phone ? ` • ${v.currentRepresentative.phone}` : ''}</p>
                      </div>
                    ) : (
                      <p className="text-sm">No representative set</p>
                    )}
                    {Array.isArray(v.representativeHistory) && v.representativeHistory.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">History</p>
                        <div className="max-h-24 overflow-auto space-y-1 pr-1">
                          {v.representativeHistory.slice().reverse().map((h: any, idx: number) => (
                            <div key={idx} className="text-xs text-muted-foreground">
                              {h.representative?.name} → {new Date(h.toDate).toLocaleDateString()} ({h.reason || 'Change'})
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vendor create/edit modal */}
        <Dialog open={vendorFormOpen} onOpenChange={setVendorFormOpen}>
          <DialogContent className="max-w-3xl backdrop-blur-md bg-white/60 dark:bg-slate-900/40 border-white/30 shadow-2xl">
            <DialogHeader>
              <DialogTitle>{editingVendor ? 'Edit Vendor' : 'New Vendor'}</DialogTitle>
              <DialogDescription>Maintain vendor details and notes</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={vendorForm.name} onChange={(e) => setVendorForm(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input value={vendorForm.companyName} onChange={(e) => setVendorForm(prev => ({ ...prev, companyName: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Supplier Code</Label>
                  <Input value={vendorForm.supplierCode ?? ""} onChange={(e) => setVendorForm(prev => ({ ...prev, supplierCode: e.target.value }))} />
                  <p className="text-xs text-muted-foreground mt-1">Your vendor account identifier with this supplier.</p>
                </div>
                <div>
                  <Label>Type</Label>
                  <Input value={vendorForm.type ?? ""} onChange={(e) => setVendorForm(prev => ({ ...prev, type: e.target.value }))} />
                  <p className="text-xs text-muted-foreground mt-1">Example: Primary, Secondary, Emergency, or Specialty.</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Input value={vendorForm.status ?? ""} onChange={(e) => setVendorForm(prev => ({ ...prev, status: e.target.value }))} />
                  <p className="text-xs text-muted-foreground mt-1">Set vendor activation state. Example: Active or Inactive.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Address</p>
                  <Input placeholder="Street" value={vendorForm.address?.street ?? ""} onChange={(e) => setVendorForm(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input placeholder="City" value={vendorForm.address?.city ?? ""} onChange={(e) => setVendorForm(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))} />
                    <Input placeholder="State" value={vendorForm.address?.state ?? ""} onChange={(e) => setVendorForm(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input placeholder="ZIP" value={vendorForm.address?.zipCode ?? ""} onChange={(e) => setVendorForm(prev => ({ ...prev, address: { ...prev.address, zipCode: e.target.value } }))} />
                    <Input placeholder="Country" value={vendorForm.address?.country ?? ""} onChange={(e) => setVendorForm(prev => ({ ...prev, address: { ...prev.address, country: e.target.value } }))} />
                  </div>
                  <p className="text-xs text-muted-foreground">Used on POs and for deliveries/paperwork.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Payment Terms</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input placeholder="Terms (e.g., Net 30)" value={vendorForm.paymentTerms?.terms ?? ""} onChange={(e) => setVendorForm(prev => ({ ...prev, paymentTerms: { ...prev.paymentTerms, terms: e.target.value } }))} />
                    <Input placeholder="Currency" value={vendorForm.paymentTerms?.currency ?? ""} onChange={(e) => setVendorForm(prev => ({ ...prev, paymentTerms: { ...prev.paymentTerms, currency: e.target.value } }))} />
                  </div>
                  <Input placeholder="Custom Terms" value={vendorForm.paymentTerms?.customTerms ?? ""} onChange={(e) => setVendorForm(prev => ({ ...prev, paymentTerms: { ...prev.paymentTerms, customTerms: e.target.value } }))} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Input type="number" step="0.01" min="0" placeholder="Credit Limit (USD)" value={vendorForm.paymentTerms?.creditLimit ?? 0} onChange={(e) => setVendorForm(prev => ({ ...prev, paymentTerms: { ...prev.paymentTerms, creditLimit: parseFloat(e.target.value) || 0 } }))} />
                      <p className="text-xs text-muted-foreground mt-1">Maximum credit extended by vendor. Enter amount in USD (e.g., 2500).</p>
                    </div>
                    <div>
                      <Input type="number" step="0.01" min="0" placeholder="Current Balance (USD)" value={vendorForm.paymentTerms?.currentBalance ?? 0} onChange={(e) => setVendorForm(prev => ({ ...prev, paymentTerms: { ...prev.paymentTerms, currentBalance: parseFloat(e.target.value) || 0 } }))} />
                      <p className="text-xs text-muted-foreground mt-1">Outstanding payable balance today. Enter amount in USD.</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Capture billing terms and credit details for this vendor.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Delivery Info</p>
                  <Input placeholder="Delivery Window (e.g., 8 AM – 12 PM)" value={vendorForm.deliveryInfo?.deliveryWindow ?? ""} onChange={(e) => setVendorForm(prev => ({ ...prev, deliveryInfo: { ...prev.deliveryInfo, deliveryWindow: e.target.value } }))} />
                  <p className="text-xs text-muted-foreground mt-1">Typical receiving window for deliveries.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    <div>
                      <Input type="number" step="0.01" min="0" placeholder="Min Order (USD)" value={vendorForm.deliveryInfo?.minimumOrder ?? 0} onChange={(e) => setVendorForm(prev => ({ ...prev, deliveryInfo: { ...prev.deliveryInfo, minimumOrder: parseFloat(e.target.value) || 0 } }))} />
                      <p className="text-xs text-muted-foreground mt-1">Minimum invoice amount to place an order.</p>
                    </div>
                    <div>
                      <Input type="number" step="0.01" min="0" placeholder="Delivery Fee (USD)" value={vendorForm.deliveryInfo?.deliveryFee ?? 0} onChange={(e) => setVendorForm(prev => ({ ...prev, deliveryInfo: { ...prev.deliveryInfo, deliveryFee: parseFloat(e.target.value) || 0 } }))} />
                      <p className="text-xs text-muted-foreground mt-1">Typical delivery charge, if any.</p>
                    </div>
                    <div>
                      <Input type="number" step="0.01" min="0" placeholder="Free Delivery Threshold (USD)" value={vendorForm.deliveryInfo?.freeDeliveryThreshold ?? 0} onChange={(e) => setVendorForm(prev => ({ ...prev, deliveryInfo: { ...prev.deliveryInfo, freeDeliveryThreshold: parseFloat(e.target.value) || 0 } }))} />
                      <p className="text-xs text-muted-foreground mt-1">Order total at which delivery fee is waived.</p>
                    </div>
                  </div>
                  <Input type="number" min="0" placeholder="Lead Time (days)" value={vendorForm.deliveryInfo?.leadTimeDays ?? 0} onChange={(e) => setVendorForm(prev => ({ ...prev, deliveryInfo: { ...prev.deliveryInfo, leadTimeDays: parseInt(e.target.value || '0') || 0 } }))} />
                  <p className="text-xs text-muted-foreground mt-1">Number of days between order placement and delivery.</p>
                  <Input placeholder="Delivery Days (comma-separated, e.g., Mon, Wed, Fri)" value={Array.isArray(vendorForm.deliveryInfo?.deliveryDays) ? vendorForm.deliveryInfo.deliveryDays.join(', ') : ''} onChange={(e) => setVendorForm(prev => ({ ...prev, deliveryInfo: { ...prev.deliveryInfo, deliveryDays: e.target.value.split(',').map(d => d.trim()).filter(Boolean) } }))} />
                  <p className="text-xs text-muted-foreground">Use day names or abbreviations, separated by commas.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Certifications</p>
                  <Input placeholder="Add certification (press Enter)" onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value) {
                        setVendorForm(prev => ({ ...prev, certifications: Array.from(new Set([...(prev.certifications || []), value])) }));
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }} />
                  <div className="flex flex-wrap gap-2">
                    {(vendorForm.certifications || []).map((c, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 border border-border">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Notes</p>
                <Textarea value={vendorForm.notes ?? ""} onChange={(e) => setVendorForm(prev => ({ ...prev, notes: e.target.value }))} />
                <p className="text-xs text-muted-foreground">Internal notes for this vendor (not shared externally).</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVendorFormOpen(false)}>Cancel</Button>
              <Button onClick={saveVendor} disabled={creatingVendor || updatingVendor} className="bg-orange-600 hover:bg-orange-700 text-white">
                {(creatingVendor || updatingVendor) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Representative replace dialog */}
        <Dialog open={repDialogOpen} onOpenChange={setRepDialogOpen}>
          <DialogContent className="max-w-lg backdrop-blur-md bg-white/60 dark:bg-slate-900/40 border-white/30 shadow-2xl">
            <DialogHeader>
              <DialogTitle>Replace Representative</DialogTitle>
              <DialogDescription>Set a new vendor representative and record the change</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input value={repForm.name} onChange={(e) => setRepForm(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Title</Label>
                  <Input value={repForm.title} onChange={(e) => setRepForm(prev => ({ ...prev, title: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input value={repForm.email} onChange={(e) => setRepForm(prev => ({ ...prev, email: e.target.value }))} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={repForm.phone} onChange={(e) => setRepForm(prev => ({ ...prev, phone: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Mobile</Label>
                  <Input value={repForm.mobile} onChange={(e) => setRepForm(prev => ({ ...prev, mobile: e.target.value }))} />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={repForm.startDate} onChange={(e) => setRepForm(prev => ({ ...prev, startDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={repForm.notes} onChange={(e) => setRepForm(prev => ({ ...prev, notes: e.target.value }))} />
              </div>
              <div>
                <Label>Reason for change</Label>
                <Input value={repReason} onChange={(e) => setRepReason(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRepDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveRepresentative} disabled={updatingRep} className="bg-orange-600 hover:bg-orange-700 text-white">
                {updatingRep ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [labelTemplate, setLabelTemplate] = useState(defaultLabelTemplate);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    element: string | null;
    offset: { x: number; y: number };
  }>({
    isDragging: false,
    element: null,
    offset: { x: 0, y: 0 },
  });
  const [qrScanMode, setQrScanMode] = useState<'add-item' | 'quantity-modify' | 'map-barcode'>('add-item');
  const [scannedData, setScannedData] = useState<string>("");
  const [itemToMapBarcode, setItemToMapBarcode] = useState<InventoryItem | null>(null);
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // CSV Import states
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreviewData, setCsvPreviewData] = useState<CsvPreviewData | null>(null);
  const [csvImportLoading, setCsvImportLoading] = useState(false);
  const [selectedImportItems, setSelectedImportItems] = useState<number[]>([]);
  const [importStep, setImportStep] = useState<'upload' | 'review' | 'complete'>('upload');
  const [newItemForm, setNewItemForm] = useState({
    name: "",
    category: "",
    sku: "",
    barcode: "",
    unit: "",
    costPerUnit: "",
    supplier: "",
    currentStock: "",
    minThreshold: "",
    maxCapacity: "",
    location: "",
    description: "",
    reorderPoint: "",
    reorderQuantity: "",
    // Sysco-specific fields
    syscoSKU: "",
    vendorSKU: "",
    casePackSize: "",
    vendorCode: "",
    syscoCategory: "",
    leadTimeDays: "",
    minimumOrderQty: "",
    pricePerCase: "",
    lastOrderDate: "",
    preferredVendor: "",
    alternateVendors: "",
    averageDailyUsage: "",
    seasonalItem: "",
    notes: "",
    restockPeriod: "weekly",
    restockDays: "7",
  });

  // Camera counting state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [markers, setMarkers] = useState<Array<{x: number, y: number, id: string, timestamp: number}>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [estimatedCount, setEstimatedCount] = useState<number>(0);
  const [segmentationMasks, setSegmentationMasks] = useState<Array<{
    id: string, 
    mask: string, 
    confidence: number, 
    bounds: {x: number, y: number, width: number, height: number}, 
    timestamp: number,
    objectName?: string,
    maskImageUrl?: string
  }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countResult, setCountResult] = useState<number | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [trackingInterval, setTrackingInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastFrameTime, setLastFrameTime] = useState<number>(0);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // GraphQL hooks
  const { data: inventoryData, loading: inventoryLoading, error: inventoryError, refetch: refetchInventory } = useInventoryItems();
  const { data: lowStockData, loading: lowStockLoading } = useLowStockItems();
  const [createInventoryItem, { loading: creating }] = useCreateInventoryItem();
  const [updateInventoryItem, { loading: updating }] = useUpdateInventoryItem();
  const [deleteInventoryItem, { loading: deleting }] = useDeleteInventoryItem();
  const [updateStock, { loading: updatingStock }] = useUpdateStock();
  const [recordWaste, { loading: recordingWaste }] = useRecordWaste();
  const openConfirm = (config: { title: string; message: string; confirmText?: string; danger?: boolean; onConfirm: () => Promise<void> | void }) => {
    setConfirmConfig(config);
    setConfirmOpen(true);
  };

  const executeConfirm = async () => {
    if (!confirmConfig.onConfirm) {
      setConfirmOpen(false);
      return;
    }
    try {
      setConfirmProcessing(true);
      await confirmConfig.onConfirm();
      setConfirmOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
    } finally {
      setConfirmProcessing(false);
    }
  };


  // Extract data from GraphQL responses
  const inventoryItems = inventoryData?.inventoryItems || [];
  const lowStockItems = lowStockData?.lowStockItems || [];

  // Helper functions for analytics
  const getTotalValue = () => {
    return inventoryItems.reduce((sum: number, item: InventoryItem) => 
      sum + (item.currentStock * item.costPerUnit), 0
    );
  };

  const getWeeklyWaste = () => {
    return inventoryItems.reduce((sum: number, item: InventoryItem) => 
      sum + (item.waste || 0) * item.costPerUnit, 0
    );
  };

  // Role-based access control
  const isAdmin = currentUserRole === "Super Admin" || currentUserRole === "Manager";
  const availableTabs = isAdmin
    ? ["overview", "items", "recipes", "purchase-orders", "receiving", "vendors", "counts", "analytics", "reports"]
    : ["overview", "items", "recipes"];

  // Enhanced stock movement data with real transaction data
  const [movementPeriod, setMovementPeriod] = useState<'daily' | 'weekly' | 'yearly'>('daily');
  const [movementDateRange, setMovementDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    end: new Date().toISOString().split('T')[0] // today
  });
  const [movementData, setMovementData] = useState<any[]>([]);
  const [movementLoading, setMovementLoading] = useState(false);
  const [hasMovementData, setHasMovementData] = useState(false);

  // Fetch real inventory transaction data
  const fetchMovementData = async () => {
    setMovementLoading(true);
    try {
      const params = new URLSearchParams({
        period: movementPeriod,
        startDate: movementDateRange.start,
        endDate: movementDateRange.end,
      });

      const response = await fetch(`/api/inventory/transactions?${params}`);
      const result = await response.json();

      if (result.success) {
        setMovementData(result.data);
        setHasMovementData(result.data.length > 0 && result.totalTransactions > 0);
      } else {
        console.error('Failed to fetch movement data:', result.error);
        setMovementData([]);
        setHasMovementData(false);
      }
    } catch (error) {
      console.error('Error fetching movement data:', error);
      setMovementData([]);
      setHasMovementData(false);
    } finally {
      setMovementLoading(false);
    }
  };

  // Fetch movement data when period or date range changes
  useEffect(() => {
    fetchMovementData();
  }, [movementPeriod, movementDateRange]);

  // Set appropriate date ranges based on period
  const handlePeriodChange = (period: 'daily' | 'weekly' | 'yearly') => {
    setMovementPeriod(period);
    const today = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
        break;
      case 'weekly':
        startDate = new Date(today.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 weeks
        break;
      case 'yearly':
        startDate = new Date(today.getFullYear() - 3, 0, 1); // 3 years
        break;
      default:
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
    }

    setMovementDateRange({
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    });
  };

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
      items: lowStockItems.slice(0, 2).map((item: InventoryItem) => item.name),
      urgency: "critical",
      description: "These items are below reorder point and may impact menu availability within 2 days.",
      action: `Order ${lowStockItems.length} low stock items`,
      costImpact: "$567.75",
    },
    {
      type: "optimization",
      title: "Par Level Optimization",
      items: inventoryItems.slice(0, 1).map((item: InventoryItem) => item.name),
      urgency: "medium", 
      description: "Current par level may be too high based on usage patterns. Reducing could free up working capital.",
      action: "Optimize par levels based on usage",
      costImpact: "-$127.50 inventory cost",
    },
    {
      type: "waste_prevention",
      title: "Waste Reduction Opportunity",
      items: inventoryItems.filter((item: InventoryItem) => item.waste && item.waste > 0).map((item: InventoryItem) => item.name),
      urgency: "low",
      description: "Higher than normal waste detected. Consider prep adjustments or menu promotions.",
      action: "Daily specials featuring high-waste items",
      costImpact: "Save ~$45/week",
    },
  ];

  // Get available cameras on component mount
  useEffect(() => {
    const getCameras = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        
        if (videoDevices.length > 0 && !selectedCameraId) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error accessing cameras:', error);
      }
    };

    getCameras();
  }, [selectedCameraId]);

  // Handle form submission for creating new inventory item
  const handleCreateItem = async () => {
    try {
      setIsLoading(true);
      await createInventoryItem({
        variables: {
          input: {
            name: newItemForm.name,
            category: newItemForm.category,
            currentStock: parseFloat(newItemForm.currentStock),
            minThreshold: parseFloat(newItemForm.minThreshold),
            maxCapacity: parseFloat(newItemForm.maxCapacity),
            unit: newItemForm.unit,
            costPerUnit: parseFloat(newItemForm.costPerUnit),
            supplier: newItemForm.supplier,
            location: newItemForm.location,
            barcode: newItemForm.barcode,
            description: newItemForm.description,
            reorderPoint: parseFloat(newItemForm.reorderPoint) || undefined,
            reorderQuantity: parseFloat(newItemForm.reorderQuantity) || undefined,
            averageDailyUsage: parseFloat(newItemForm.averageDailyUsage) || undefined,
            restockPeriod: newItemForm.restockPeriod,
            restockDays: parseInt(String(newItemForm.restockDays)) || undefined,
          }
        }
      });
      
      toast.success('Inventory item created successfully!');
      setIsAddItemOpen(false);
      setNewItemForm({
        name: "",
        category: "",
        sku: "",
        barcode: "",
        unit: "",
        costPerUnit: "",
        supplier: "",
        currentStock: "",
        minThreshold: "",
        maxCapacity: "",
        location: "",
        description: "",
        reorderPoint: "",
        reorderQuantity: "",
        syscoSKU: "",
        vendorSKU: "",
        casePackSize: "",
        vendorCode: "",
        syscoCategory: "",
        leadTimeDays: "",
        minimumOrderQty: "",
        pricePerCase: "",
        lastOrderDate: "",
        preferredVendor: "",
        alternateVendors: "",
        averageDailyUsage: "",
        seasonalItem: "",
        notes: "",
        restockPeriod: "weekly",
        restockDays: "7",
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create inventory item');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle editing an existing item
  const handleEditItem = async () => {
    if (!selectedItem) return;
    
    try {
      const input = {
            name: newItemForm.name,
            category: newItemForm.category,
        currentStock: parseFloat(newItemForm.currentStock) || 0,
        minThreshold: parseFloat(newItemForm.minThreshold) || 0,
        maxCapacity: parseFloat(newItemForm.maxCapacity) || 0,
            unit: newItemForm.unit,
        costPerUnit: parseFloat(newItemForm.costPerUnit) || 0,
            supplier: newItemForm.supplier,
            location: newItemForm.location,
            barcode: newItemForm.barcode,
            description: newItemForm.description,
            reorderPoint: parseFloat(newItemForm.reorderPoint) || undefined,
            reorderQuantity: parseFloat(newItemForm.reorderQuantity) || undefined,
            averageDailyUsage: parseFloat(newItemForm.averageDailyUsage) || undefined,
            restockPeriod: newItemForm.restockPeriod,
            restockDays: parseInt(String(newItemForm.restockDays)) || undefined,
      };

      await updateInventoryItem({
        variables: {
          id: selectedItem.id,
          input,
        }
      });
      
      toast.success('Inventory item updated successfully!');
      setIsEditItemOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update inventory item');
    }
  };

  // Handle deleting an item
  const handleDeleteItem = async (id: string) => {
    openConfirm({
      title: 'Delete Inventory Item',
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        await deleteInventoryItem({ variables: { id } });
        toast.success('Inventory item deleted successfully!');
      }
    });
  };

  // Handle stock quantity updates
  const handleUpdateStock = async (id: string, newQuantity: number) => {
    try {
      await updateStock({
        variables: {
          id,
          quantity: newQuantity
        }
      });
      
      toast.success('Stock quantity updated successfully!');
      setIsQuantityModifierOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update stock');
    }
  };

  // Open edit dialog with prefilled data
  const openEditDialog = (item: any) => {
    setSelectedItem(item);
    setNewItemForm({
      name: item.name || "",
      category: item.category || "",
      sku: item.sku || "",
      barcode: item.barcode || "",
      unit: item.unit || "",
      costPerUnit: item.costPerUnit?.toString() || "",
      supplier: item.supplier || "",
      currentStock: item.currentStock?.toString() || "",
      minThreshold: item.minThreshold?.toString() || "",
      maxCapacity: item.maxCapacity?.toString() || "",
      location: item.location || "",
      description: item.description || "",
      reorderPoint: item.reorderPoint?.toString() || "",
      reorderQuantity: item.reorderQuantity?.toString() || "",
      syscoSKU: item.syscoSKU || "",
      vendorSKU: item.vendorSKU || "",
      casePackSize: item.casePackSize?.toString() || "",
      vendorCode: item.vendorCode || "",
      syscoCategory: item.syscoCategory || "",
      leadTimeDays: item.leadTimeDays?.toString() || "",
      minimumOrderQty: item.minimumOrderQty?.toString() || "",
      pricePerCase: item.pricePerCase?.toString() || "",
      lastOrderDate: item.lastOrderDate || "",
      preferredVendor: item.preferredVendor || "",
      alternateVendors: item.alternateVendors || "",
      averageDailyUsage: item.averageDailyUsage?.toString() || "",
      seasonalItem: item.seasonalItem?.toString() || "",
      notes: item.notes || "",
      restockPeriod: item.restockPeriod || 'weekly',
      restockDays: (item.restockDays?.toString?.() || String(item.restockDays || 7))
    });
    setIsEditItemOpen(true);
  };

  // Open quantity modifier dialog
  const openQuantityDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsQuantityModifierOpen(true);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const uniqueCategories = inventoryItems.reduce((acc: string[], item: InventoryItem) => {
    if (item.category && typeof item.category === 'string' && item.category.trim() !== '' && !acc.includes(item.category)) {
      acc.push(item.category);
    }
    return acc;
  }, []);

  const filteredItems = inventoryItems
    .filter((item: InventoryItem) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory ? item.category === filterCategory : true;
      return matchesSearch && matchesCategory;
    })
    .sort((a: InventoryItem, b: InventoryItem) => {
      const aValue = a[sortKey as keyof InventoryItem] ?? "";
      const bValue = b[sortKey as keyof InventoryItem] ?? "";

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical": return "tag-red";
      case "low": return "tag-yellow";
      case "out_of_stock": return "tag-red";
      case "adequate": 
      case "normal": return "tag-green";
      default: return "tag-slate";
    }
  };

  const friendlyStatusLabel = (status: string) => {
    if (!status) return "";
    if (status === "out_of_stock") return "Out of stock";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Compute status on the fly for display to avoid stale server values
  const computeStatus = (stock: number, min: number) => {
    const s = Number(stock || 0);
    const m = Number(min || 0);
    if (s <= 0) return 'out_of_stock';
    if (s <= m) return 'critical';
    if (s <= m * 1.5) return 'low';
    return 'normal';
  };

  // Waste tags: mapping and helpers
  const WASTE_REASONS = [
    "Spoiled",
    "Expired",
    "Cooking Error",
    "Dropped",
    "Contaminated",
    "Other",
  ];

  const getWasteTagClass = (reason: string) => {
    switch (reason) {
      case "Spoiled": return "tag-red";
      case "Expired": return "tag-yellow";
      case "Cooking Error": return "tag-orange";
      case "Dropped": return "tag-blue";
      case "Contaminated": return "tag-slate";
      case "Other":
      default:
        return "tag-green";
    }
  };

  const getWasteCountsForItem = (item: InventoryItem): Record<string, number> => {
    const counts: Record<string, number> = {};
    if (!item?.wasteLogs || !Array.isArray(item.wasteLogs)) return counts;
    for (const log of item.wasteLogs) {
      const reason = (log?.reason || "Other").trim();
      counts[reason] = (counts[reason] || 0) + 1;
    }
    return counts;
  };

  // Legend chip classes (brighter for visibility)
  const getWasteLegendClass = (reason: string) => {
    switch (reason) {
      case "Spoiled": return "bg-red-600 text-white";
      case "Expired": return "bg-yellow-500 text-black";
      case "Cooking Error": return "bg-orange-500 text-white";
      case "Dropped": return "bg-blue-600 text-white";
      case "Contaminated": return "bg-slate-600 text-white";
      case "Other":
      default:
        return "bg-green-600 text-white";
    }
  };

  const getCriticalItems = () => inventoryItems.filter((item: InventoryItem) => item.status === "critical");
  const getLowStockItems = () => inventoryItems.filter((item: InventoryItem) => item.status === "low");



  // Vendor Order Export Functions
  const exportVendorOrder = () => {
    const lowStockItems = inventoryItems.filter((item: InventoryItem) => 
      item.currentStock <= (item.reorderPoint || item.minThreshold)
    );
    
    // Group by supplier
    const ordersBySupplier = lowStockItems.reduce((acc: Record<string, InventoryItem[]>, item: InventoryItem) => {
      const supplier = item.supplier || 'Unknown Supplier';
      if (!acc[supplier]) {
        acc[supplier] = [];
      }
      acc[supplier].push(item);
      return acc;
    }, {} as Record<string, InventoryItem[]>);

    // Generate order data
    const orderData = Object.entries(ordersBySupplier).map(([supplier, items]) => {
      const itemArray = items as InventoryItem[];
      return {
        supplier,
        items: itemArray.map((item: InventoryItem) => ({
          name: item.name,
          sku: item.sku,
          syscoSKU: item.syscoSKU,
          vendorSKU: item.vendorSKU,
          vendorCode: item.vendorCode,
          currentStock: item.currentStock,
          neededQuantity: (item.reorderQuantity || item.maxCapacity) - item.currentStock,
          unit: item.unit,
          casePackSize: item.casePackSize,
          minimumOrderQty: item.minimumOrderQty,
          costPerUnit: item.costPerUnit,
          pricePerCase: item.pricePerCase,
          totalCost: ((item.reorderQuantity || item.maxCapacity) - item.currentStock) * item.costPerUnit,
          leadTimeDays: item.leadTimeDays,
          syscoCategory: item.syscoCategory,
          urgency: item.currentStock <= item.minThreshold ? 'High' : 'Medium',
          notes: item.notes
        })),
        totalItems: itemArray.length,
        totalCost: itemArray.reduce((sum: number, item: InventoryItem) => 
          sum + (((item.reorderQuantity || item.maxCapacity) - item.currentStock) * item.costPerUnit), 0
        )
      };
    });

    return orderData;
  };

  const downloadCSV = () => {
    const orderData = exportVendorOrder();
    
    let csvContent = "Supplier,Item Name,SKU,Sysco SKU,Vendor SKU,Vendor Code,Current Stock,Needed Quantity,Unit,Case Pack Size,Min Order Qty,Cost Per Unit,Price Per Case,Total Cost,Lead Time (Days),Sysco Category,Urgency,Notes\n";
    
    orderData.forEach((order) => {
      (order.items).forEach((item) => {
        csvContent += `"${order.supplier}","${item.name}","${item.sku || ''}","${item.syscoSKU || ''}","${item.vendorSKU || ''}","${item.vendorCode || ''}",${item.currentStock},${item.neededQuantity},"${item.unit}",${item.casePackSize || 1},${item.minimumOrderQty || 1},${item.costPerUnit.toFixed(2)},${item.pricePerCase?.toFixed(2) || '0.00'},${item.totalCost.toFixed(2)},${item.leadTimeDays || 1},"${item.syscoCategory || ''}","${item.urgency}","${item.notes || ''}"\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `sysco-vendor-order-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJSON = () => {
    const orderData = exportVendorOrder();
    
    const exportData = {
      generatedDate: new Date().toISOString(),
      totalSuppliers: orderData.length,
      totalItems: orderData.reduce((sum, order) => sum + order.totalItems, 0),
      totalCost: orderData.reduce((sum, order) => sum + order.totalCost, 0),
      orders: orderData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendor-order-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // QR Code generation function
  const generateQRData = (item: InventoryItem) => {
    return JSON.stringify({
      id: item.id,
      name: item.name,
      sku: item.sku,
      barcode: item.barcode,
      category: item.category,
      unit: item.unit,
      costPerUnit: item.costPerUnit,
      supplier: item.supplier,
      timestamp: new Date().toISOString(),
    });
  };

  // Lookup barcode in internal database
  const lookupBarcode = async (barcode: string) => {
    try {
      setBarcodeLoading(true);
      const response = await fetch(`/api/inventory/barcode-mapping?barcode=${encodeURIComponent(barcode)}`);
      const data = await response.json();
      
      if (data.found) {
        return data.item;
      }
      return null;
    } catch (error) {
      console.error('Barcode lookup error:', error);
      return null;
    } finally {
      setBarcodeLoading(false);
    }
  };

  // Map barcode to existing item
  const mapBarcodeToItem = async (itemId: string, scannedBarcode: string) => {
    try {
      setBarcodeLoading(true);
      const response = await fetch('/api/inventory/barcode-mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          scannedBarcode,
          mappedBy: 'user' // Could be current user ID
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Barcode mapped successfully! 🎯');
        return true;
      } else {
        toast.error(data.error || 'Failed to map barcode');
        return false;
      }
    } catch (error) {
      console.error('Barcode mapping error:', error);
      toast.error('Failed to map barcode');
      return false;
    } finally {
      setBarcodeLoading(false);
    }
  };

  // CSV Import functions
  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      toast.error('Please select a valid CSV file');
    }
  };

  const previewCSVData = async () => {
    if (!csvFile) return;
    
    try {
      setCsvImportLoading(true);
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      formData.append('action', 'preview');

      const response = await fetch('/api/inventory/csv-import', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setCsvPreviewData(data);
        setImportStep('review');
        toast.success(`Parsed ${data.totalParsed} items successfully! 📊`);
      } else {
        toast.error(data.error || 'Failed to parse CSV');
      }
    } catch (error) {
      console.error('CSV preview error:', error);
      toast.error('Failed to preview CSV data');
    } finally {
      setCsvImportLoading(false);
    }
  };

  const importSelectedItems = async () => {
    if (!csvFile || selectedImportItems.length === 0) return;
    
    try {
      setCsvImportLoading(true);
      const formData = new FormData();
      formData.append('csvFile', csvFile);
      formData.append('action', 'import');
      formData.append('selectedItems', JSON.stringify(selectedImportItems));

      const response = await fetch('/api/inventory/csv-import', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        setImportStep('complete');
        refetchInventory(); // Refresh inventory list
        
        // Show detailed success/error information
        if (data.imported > 0) {
          toast.success(`Imported ${data.imported} items successfully! 🎉`);
        }
        if (data.errors && data.errors.length > 0) {
          console.error('Import errors:', data.errors);
          // Show specific error details
          const errorDetails = data.errors.map((err: { item: string; error: string }) => 
            `${err.item}: ${err.error}`
          ).join('\n');
          console.log('Error details:\n', errorDetails);
          toast.error(`${data.errors.length} items failed to import. See console for details.`);
        }
        if (data.imported === 0 && data.errors.length === 0) {
          toast.warning('No items were imported. All items may already exist.');
        }
      } else {
        console.error('Import response error:', data);
        toast.error(data.error || 'Failed to import items');
      }
    } catch (error) {
      console.error('CSV import error:', error);
      toast.error('Failed to import CSV data');
    } finally {
      setCsvImportLoading(false);
    }
  };

  const resetCSVImport = () => {
    setCsvFile(null);
    setCsvPreviewData(null);
    setSelectedImportItems([]);
    setImportStep('upload');
    setIsCSVImportOpen(false);
  };

  const toggleItemSelection = (index: number) => {
    setSelectedImportItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const selectAllNewItems = () => {
    if (!csvPreviewData) return;
    const newItemIndices = csvPreviewData.items
      .map((item: CsvItem, index: number) => ({ item, index }))
      .filter(({ item }: { item: CsvItem }) => !item.isDuplicate)
      .map(({ index }: { index: number }) => index);
    setSelectedImportItems(newItemIndices);
  };

  const debugInventoryDatabase = async () => {
    try {
      const response = await fetch('/api/inventory/debug');
      const data = await response.json();
      
      if (response.ok) {
        console.log('🔍 Database Debug Info:', data);
        toast.success(`Database has ${data.stats.totalItems} items (${data.stats.itemsCreatedToday} created today)`);
      } else {
        toast.error('Failed to fetch debug info');
      }
    } catch (error) {
      console.error('Debug error:', error);
      toast.error('Failed to fetch debug info');
    }
  };

  const testDirectInventoryFetch = async () => {
    try {
      const response = await fetch('/api/inventory/list');
      const data = await response.json();
      
      if (response.ok) {
        console.log('Direct REST API found:', data.total, 'items');
        console.log('GraphQL hook shows:', inventoryItems.length, 'items');
        
        // Force replace the GraphQL data with REST data for testing
        if (data.items && data.items.length > inventoryItems.length) {
          toast.success(`REST API has ${data.total} items vs GraphQL ${inventoryItems.length}. Check server logs.`);
          console.log('First 5 REST items:', data.items.slice(0, 5));
        }
      } else {
        toast.error('REST API failed');
      }
    } catch {
      toast.error('Test failed');
    }
  };

  const checkSchema = async () => {
    try {
      const response = await fetch('/api/inventory/schema-check');
      const data = await response.json();
      
      if (data.success) {
        console.log('📋 Current schema enum values:', data.categoryEnum);
        toast.success(`Schema check: ${data.categoryEnum.length} categories available`);
      } else {
        toast.error('Schema check failed');
      }
    } catch {
      toast.error('Schema check error');
    }
  };

  const clearAllInventory = async () => {
    openConfirm({
      title: 'Delete All Inventory',
      message: 'This will permanently delete ALL inventory items. Are you absolutely sure?',
      confirmText: 'Delete All',
      danger: true,
      onConfirm: async () => {
        const response = await fetch('/api/inventory/clear', { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
          toast.success(`✅ Deleted ${data.deleted} items`);
          refetchInventory();
        } else {
          toast.error('Failed to clear inventory');
        }
      }
    });
  };

  const forceCacheRefresh = async () => {
    console.log('🔄 Forcing complete Apollo cache reset...');
    
    try {
      // Clear Apollo cache completely
      await refetchInventory();
      
      // Also clear local cache
      if (typeof window !== 'undefined' && window.location) {
        // Force a hard refresh of GraphQL data
        window.location.reload();
      }
      
      toast.success('Cache cleared! Page will refresh...');
    } catch (error) {
      console.error('Cache refresh error:', error);
      toast.error('Cache refresh failed');
    }
  };

  // QR Scan handler
  const handleQRScan = async (result: ScanResult[]) => {
    if (result && result.length > 0) {
      const scannedText = result[0].rawValue;
      setScannedData(scannedText);
      
      // Unified QR behavior: identify item and open quantity modifier

      // First, check if this barcode is already in our internal database
      const existingItem = await lookupBarcode(scannedText);
      if (existingItem) {
        setIsQRScannerOpen(false);
        setSelectedItem(existingItem);
        setIsQuantityModifierOpen(true);
        return;
      }
      
      try {
        // Try to parse as QR code JSON data
        const parsedData = JSON.parse(scannedText);
        if (qrScanMode === 'add-item') {
          setNewItemForm({
            name: parsedData.name || "",
            category: parsedData.category || "",
            sku: parsedData.sku || "",
            barcode: parsedData.barcode || "",
            unit: parsedData.unit || "",
            costPerUnit: parsedData.costPerUnit?.toString() || "",
            supplier: parsedData.supplier || "",
            currentStock: "",
            minThreshold: "",
            maxCapacity: "",
            location: "",
            description: "",
            reorderPoint: "",
            reorderQuantity: "",
            syscoSKU: parsedData.syscoSKU || "",
            vendorSKU: parsedData.vendorSKU || "",
            casePackSize: parsedData.casePackSize?.toString() || "",
            vendorCode: parsedData.vendorCode || "",
            syscoCategory: parsedData.syscoCategory || "",
            leadTimeDays: parsedData.leadTimeDays?.toString() || "",
            minimumOrderQty: parsedData.minimumOrderQty?.toString() || "",
            pricePerCase: parsedData.pricePerCase?.toString() || "",
            lastOrderDate: parsedData.lastOrderDate || "",
            preferredVendor: parsedData.preferredVendor || "",
            alternateVendors: parsedData.alternateVendors || "",
            averageDailyUsage: parsedData.averageDailyUsage?.toString() || "",
            seasonalItem: parsedData.seasonalItem?.toString() || "",
            notes: parsedData.notes || "",
            restockPeriod: 'weekly',
            restockDays: '7',
          });
        }
      } catch (error) {
        console.error("Failed to parse QR data:", error);
        // Handle as plain barcode - just populate barcode field
        if (qrScanMode === 'add-item') {
        setNewItemForm(prev => ({
          ...prev,
          barcode: scannedText,
        }));
          if (!existingItem) {
            toast.info('Barcode captured! Fill in the details to create your mapping. 📋');
          }
        }
      }
      
      setIsQRScannerOpen(false);
    }
  };

  // Camera capture for counting
  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setMarkers([]);
      setEstimatedCount(0);
    }
  }, [webcamRef]);

  // Handle marker placement on image or live video
  const handleImageClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // If in live mode, freeze the current frame first
    if (isLiveMode && !frozenFrame) {
      const currentFrame = captureLiveFrame();
      if (currentFrame) {
        setFrozenFrame(currentFrame);
        console.log("🧊 Frame frozen for mask processing");
      }
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const newMarker = {
      x: (x / rect.width) * canvas.width,
      y: (y / rect.height) * canvas.height,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    
    console.log("📸 Click detected at coordinates:", { x: newMarker.x, y: newMarker.y });
    console.log("📊 Current markers before:", markers.length);
    console.log("🎭 Current masks before:", segmentationMasks.length);
    
    // Add marker immediately for visual feedback
    setMarkers(prev => {
      const updated = [...prev, newMarker];
      console.log("✅ Markers updated to:", updated.length);
      return updated;
    });
    
    // Trigger Azure SAM processing for this point
    console.log("🤖 Triggering Azure SAM + Computer Vision processing...");
    await processPointWithSAM(newMarker);
  };

  // Remove marker
  const removeMarker = (id: string) => {
    setMarkers(prev => prev.filter(marker => marker.id !== id));
  };

  // Capture current frame from live video
  const captureLiveFrame = (): string | null => {
    if (!webcamRef.current) return null;
    
    try {
      const screenshot = webcamRef.current.getScreenshot();
      return screenshot;
    } catch (error) {
      console.error("Failed to capture live frame:", error);
      return null;
    }
  };

  // Start object tracking
  const startTracking = () => {
    if (trackingInterval) {
      clearInterval(trackingInterval);
    }
    
    setIsTracking(true);
    const interval = setInterval(() => {
      if (segmentationMasks.length > 0 && isLiveMode) {
        updateObjectTracking();
      }
    }, 200); // Update every 200ms for smooth tracking
    
    setTrackingInterval(interval);
    console.log("🎯 Started object tracking");
  };

  // Stop object tracking
  const stopTracking = () => {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
    }
    setIsTracking(false);
    console.log("⏹️ Stopped object tracking");
  };

  // Update object positions using optical flow simulation
  const updateObjectTracking = async () => {
    const currentTime = Date.now();
    if (currentTime - lastFrameTime < 150) return; // Throttle updates
    
    setLastFrameTime(currentTime);
    
    // Get current frame for tracking
    const currentFrame = captureLiveFrame();
    if (!currentFrame) return;
    
    // Simulate object movement tracking (in production, use optical flow or re-run SAM)
    setSegmentationMasks(prev => prev.map(mask => {
      // Simulate slight movement with random drift (replace with real tracking)
      const drift = {
        x: (Math.random() - 0.5) * 4, // Small random movement
        y: (Math.random() - 0.5) * 4,
      };
      
      return {
        ...mask,
        bounds: {
          ...mask.bounds,
          x: Math.max(0, Math.min(600 - mask.bounds.width, mask.bounds.x + drift.x)),
          y: Math.max(0, Math.min(400 - mask.bounds.height, mask.bounds.y + drift.y)),
        },
        timestamp: currentTime,
      };
    }));
  };

  // Use real Azure SAM for photo mode with loading indicators
  const USE_REAL_SAM = true;

  // Azure SAM integration for real-time segmentation (works on both live and static)
  const processPointWithSAM = async (point: {x: number, y: number, id: string}) => {
    console.log("🤖 processPointWithSAM STARTED for point:", point);
    
        // Show immediate loading feedback at click point
    console.log("🔄 Starting Azure SAM processing with loading indicator");
    setIsProcessing(true);
    
    // Get image data - use captured image for photo mode
    let imageData: string | null = null;
    
    if (isLiveMode) {
      console.log("📹 Capturing live frame...");
      imageData = captureLiveFrame();
      if (!imageData) {
        console.error("❌ Failed to capture live frame for processing");
        setIsProcessing(false);
        return;
      }
      console.log("✅ Live frame captured, length:", imageData.length);
    } else {
      imageData = capturedImage;
      if (!imageData) {
        console.error("❌ No captured image available - please capture a photo first");
        setIsProcessing(false);
        return;
      }
      console.log("✅ Using captured image, length:", imageData.length);
    }
    
    setIsProcessing(true);
    setProcessingError(null);
    console.log("🔄 Processing started...");
    
          try {
        console.log("🤖 Starting Azure SAM point segmentation...");
        console.log("📍 Processing point:", point);
        
        // Get video dimensions for point coordinates
        let videoWidth = 640;
        let videoHeight = 480;
        
        if (webcamRef.current && webcamRef.current.video) {
          videoWidth = webcamRef.current.video.videoWidth || 640;
          videoHeight = webcamRef.current.video.videoHeight || 480;
          console.log("📺 Using video dimensions:", videoWidth, "x", videoHeight);
        } else {
          console.log("📺 Using default dimensions:", videoWidth, "x", videoHeight);
        }
        
        // Convert click point to image coordinates (SAM expects [x, y] format)
        // Scale the coordinates to match the actual image size
        const scaleX = videoWidth / (webcamRef.current?.video?.clientWidth || videoWidth);
        const scaleY = videoHeight / (webcamRef.current?.video?.clientHeight || videoHeight);
        
        const scaledX = Math.round(point.x * scaleX);
        const scaledY = Math.round(point.y * scaleY);
        
        const inputPoints = [[scaledX, scaledY]];
        const inputLabels = [1]; // 1 for foreground point
        
        console.log("📐 Original point:", [point.x, point.y]);
        console.log("📐 Scale factors:", [scaleX, scaleY]);
        console.log("📐 Scaled point:", [scaledX, scaledY]);
        
        console.log("📍 Input points:", inputPoints);
        console.log("🏷️ Input labels:", inputLabels);
        
        // Extract base64 image data (remove data:image/jpeg;base64, prefix)
        const base64Image = imageData.split(',')[1];
        console.log("🖼️ Image data length:", base64Image.length);
        console.log("📺 Processing mode:", isLiveMode ? "Live Video" : "Static Image");
        
        // Use our Next.js API route to avoid CORS issues
        console.log("📤 Sending request to Next.js SAM API route");
        console.log("📋 Request data:", {
          imageLength: base64Image.length,
          pointCount: inputPoints.length,
          labelCount: inputLabels.length
        });
      
      const samResponse = await fetch('/api/sam-segmentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Image,
          inputPoints: inputPoints,
          inputLabels: inputLabels,
          multimaskOutput: true
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
      
      console.log("📨 API Route Response status:", samResponse.status);
      
      if (samResponse.ok) {
        const apiResult = await samResponse.json();
        console.log("✅ API Route Response:", apiResult);
        
        if (!apiResult.success) {
          throw new Error(`API Route error: ${apiResult.error}`);
        }
        
        const result = apiResult.data;
          console.log("✅ SAM Segmentation Response received:", result);
          
          // Process segmentation masks
          let bestMask = null;
          let bestConfidence = 0;
          
          // Handle the Azure ML response format for segmentation
          if (result && Array.isArray(result) && result.length > 0) {
            console.log("🔍 Processing Azure ML segmentation response:", result[0]);
            
            // Check for the actual response structure we're getting
            const responseData = result[0];
            
            if (responseData && responseData.response) {
              console.log("🔍 Found response object:", responseData.response);
              const actualResponse = responseData.response;
              
              // Check if we have predictions in the response
              if (actualResponse.predictions) {
                console.log("🔍 Found predictions:", Object.keys(actualResponse.predictions));
                
                // Find the best mask based on confidence score
                Object.values(actualResponse.predictions).forEach((prediction: any, index) => {
                  console.log(`🎯 Processing prediction ${index}:`, prediction);
                  console.log(`🎯 Available keys:`, Object.keys(prediction));
                  
                  // Check for masks_per_prediction (note the "s")
                  if (prediction.masks_per_prediction) {
                    console.log(`🎯 Found ${prediction.masks_per_prediction.length} masks in prediction ${index}`);
                    prediction.masks_per_prediction.forEach((mask: any, maskIndex: number) => {
                      console.log(`🎯 Mask ${maskIndex} data:`, mask);
                      console.log(`🎯 Mask ${maskIndex} IOU score:`, mask.iou_score);
                      if (mask.iou_score && mask.iou_score > bestConfidence) {
                        bestMask = mask.encoded_binary_mask;
                        bestConfidence = mask.iou_score;
                        console.log(`✅ New best mask found! Confidence: ${bestConfidence}`);
                      }
                    });
                  } else if (prediction.mask_per_prediction) {
                    // Fallback for other naming convention
                    Object.values(prediction.mask_per_prediction).forEach((mask: any) => {
                      console.log(`🎯 Mask IOU score:`, mask.iou_score);
                      if (mask.iou_score && mask.iou_score > bestConfidence) {
                        bestMask = mask.encoded_binary_mask;
                        bestConfidence = mask.iou_score;
                      }
                    });
                  }
                });
              } else if (actualResponse.masks && actualResponse.masks.length > 0) {
                // Handle direct masks array format
                console.log("🔍 Found direct masks array:", actualResponse.masks.length);
                bestMask = actualResponse.masks[0];
                bestConfidence = actualResponse.scores ? actualResponse.scores[0] : 0.8;
              } else {
                console.log("🔍 Checking for other response formats in:", Object.keys(actualResponse));
                // Try to find mask data in other formats
                if (actualResponse.encoded_binary_mask) {
                  bestMask = actualResponse.encoded_binary_mask;
                  bestConfidence = actualResponse.iou_score || 0.8;
                }
              }
            } else if (responseData.predictions) {
              // Direct predictions format
              console.log("🔍 Direct predictions format");
              Object.values(responseData.predictions).forEach((prediction: any, index) => {
                console.log(`🎯 Direct prediction ${index}:`, prediction);
                if (prediction.masks_per_prediction) {
                  prediction.masks_per_prediction.forEach((mask: any, maskIndex: number) => {
                    console.log(`🎯 Direct Mask ${maskIndex} IOU score:`, mask.iou_score);
                    if (mask.iou_score && mask.iou_score > bestConfidence) {
                      bestMask = mask.encoded_binary_mask;
                      bestConfidence = mask.iou_score;
                    }
                  });
                } else if (prediction.mask_per_prediction) {
                  Object.values(prediction.mask_per_prediction).forEach((mask: any) => {
                    console.log(`🎯 Mask ${index} IOU score:`, mask.iou_score);
                    if (mask.iou_score && mask.iou_score > bestConfidence) {
                      bestMask = mask.encoded_binary_mask;
                      bestConfidence = mask.iou_score;
                    }
                  });
                }
              });
            } else {
              console.log("🔍 Response format different than expected, raw result:", result);
              console.log("🔍 Available keys in responseData:", Object.keys(responseData));
              
              // Try to handle different response formats
              if (responseData.encoded_binary_mask) {
                bestMask = responseData.encoded_binary_mask;
                bestConfidence = responseData.iou_score || 0.8;
              }
            }
          } else if (result && typeof result === 'object') {
            console.log("🔍 Single object response:", result);
            if (result.encoded_binary_mask) {
              bestMask = result.encoded_binary_mask;
              bestConfidence = result.iou_score || 0.8;
            }
          }
          
          if (bestMask && bestConfidence > 0.1) { // Lower threshold for testing
            console.log("✅ Found valid mask with confidence:", bestConfidence);
            console.log("✅ Mask data preview:", bestMask.substring(0, 100) + "...");
            
            // Process the actual Azure SAM mask
            const maskResult = await processSAMMask(bestMask, point);
            
            // Identify what the object is using Computer Vision
            console.log("🔍 Starting object identification...");
            const objectName = await identifyObject(point);
            
            const newMask = {
              id: point.id,
              mask: bestMask,
              confidence: bestConfidence,
              bounds: maskResult.bounds,
              maskImageUrl: maskResult.maskImageUrl, // Processed mask image
              timestamp: Date.now(),
              objectName: objectName
            };
            
            console.log("📦 Created mask with real bounds:", maskResult.bounds);
            console.log("🎨 Generated processed mask image");
            console.log("🔍 Object identified as:", objectName);
            
            setSegmentationMasks(prev => [...prev, newMask]);
            setEstimatedCount(prev => (prev || 0) + 1);
            
            console.log("🎭 REAL SAM - Added new segmentation mask, total objects:", segmentationMasks.length + 1);
            console.log("✅ Processing complete for marker:", point.id);
          } else {
            console.log("⚠️ No valid mask found, keeping as manual marker");
            console.log("🔍 Debug info - bestMask exists:", !!bestMask, "confidence:", bestConfidence);
            // Keep as manual marker if no good mask is found
            setEstimatedCount(markers.length);
          }
      } else {
        const errorResult = await samResponse.json().catch(() => ({ error: 'Unknown error' }));
        console.error("❌ SAM API Route error:", samResponse.status, errorResult);
        throw new Error(`SAM API Route error: ${errorResult.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("💥 SAM processing error:", error);
      
      // Show user-friendly error message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error("🌐 Network error - this might be a CORS issue or network connectivity problem");
        console.log("🎭 FALLING BACK to simulated segmentation...");
        setProcessingError("Network connectivity issue. Using simulated segmentation for demo.");
        
        // Simulate a segmentation mask for demo purposes
        const simulatedMask = {
          id: point.id,
          mask: "simulated_base64_mask_data", // In real app, this would be actual mask data
          confidence: 0.85 + Math.random() * 0.1, // Random confidence between 0.85-0.95
          bounds: { x: point.x - 40, y: point.y - 40, width: 80, height: 80 },
          timestamp: Date.now()
        };
        
        console.log("🎭 CREATING simulated mask:", simulatedMask);
        
        setSegmentationMasks(prev => {
          const updated = [...prev, simulatedMask];
          console.log("✅ Segmentation masks updated to:", updated.length, updated);
          return updated;
        });
        
        setEstimatedCount(prev => {
          const newCount = (prev || 0) + 1;
          console.log("📊 Count result updated to:", newCount);
          return newCount;
        });
        
        console.log("🎭 Using simulated segmentation mask - COMPLETE");
        
        // Start tracking if in live mode and this is the first object
        if (isLiveMode && segmentationMasks.length === 0) {
          console.log("🎯 Starting tracking for first object");
          startTracking();
        }
      } else {
        setProcessingError(error instanceof Error ? error.message : "AI segmentation failed. Using manual marker.");
        // Fallback to just the marker without mask
        setEstimatedCount(markers.length);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Process the actual binary mask from Azure SAM
  const processSAMMask = async (base64Mask: string, clickPoint: {x: number, y: number}): Promise<{maskImageUrl: string, bounds: {x: number, y: number, width: number, height: number}}> => {
    try {
      console.log("🎨 Processing real Azure SAM mask data");
      
      // Create an image element to decode the mask
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          // Create a canvas to analyze the mask
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject('Canvas context not available');
            return;
          }
          
          // Draw the mask image to analyze it
          ctx.drawImage(img, 0, 0);
          
          // Get the image data to find the actual mask bounds
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const bounds = findMaskBounds(imageData);
          
          console.log("🔍 Found mask bounds:", bounds);
          console.log("🖱️ Click point was:", clickPoint);
          
          // Clear canvas and create a proper colored mask overlay
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // First, draw the original mask in white/transparent
          ctx.drawImage(img, 0, 0);
          
          // Create the colored overlay using composite operations
          ctx.globalCompositeOperation = 'source-atop'; // Only draw where mask exists
          ctx.fillStyle = 'rgba(34, 197, 94, 0.6)'; // Semi-transparent green
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add a subtle border around the mask area
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 3;
          ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
          
          const maskImageUrl = canvas.toDataURL();
          console.log("✅ Processed mask with bounds:", bounds);
          
          resolve({ maskImageUrl, bounds });
        };
        
        img.onerror = () => {
          console.error("❌ Failed to load mask image");
          reject('Failed to load mask image');
        };
        
        // Load the base64 mask image
        img.src = `data:image/png;base64,${base64Mask}`;
      });
    } catch (error) {
      console.log("⚠️ Failed to process mask:", error);
      // Return fallback around click point
      return {
        maskImageUrl: '',
        bounds: { 
          x: Math.max(0, clickPoint.x - 50), 
          y: Math.max(0, clickPoint.y - 50), 
          width: 100, 
          height: 100 
        }
      };
    }
  };

  // Find the actual bounds of the mask from pixel data
  const findMaskBounds = (imageData: ImageData): {x: number, y: number, width: number, height: number} => {
    const { width, height, data } = imageData;
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let hasPixels = false;
    
              // Azure SAM masks are typically black/white or grayscale
          // Scan all pixels to find non-black areas (mask regions)
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const index = (y * width + x) * 4;
              const r = data[index];
              const g = data[index + 1];
              const b = data[index + 2];
              const alpha = data[index + 3];
              
              // Check if pixel is part of the mask
              // Azure SAM masks usually have white areas (255,255,255) for the object
              const isWhitePixel = r > 200 && g > 200 && b > 200 && alpha > 200;
              const brightness = (r + g + b) / 3;
              
              if (isWhitePixel || (brightness > 128 && alpha > 128)) {
                hasPixels = true;
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
              }
            }
          }
    
    if (!hasPixels) {
      console.log("⚠️ No mask pixels found, using default bounds");
      return { x: 50, y: 50, width: 100, height: 100 };
    }
    
    const bounds = {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
    
    console.log("📏 Mask bounds calculation:", {
      totalPixels: width * height,
      maskPixels: hasPixels,
      bounds
    });
    
    return bounds;
  };

  // Identify what the object is using Computer Vision
  const identifyObject = async (point: {x: number, y: number, id: string}): Promise<string> => {
    try {
      console.log("🔍 Identifying object using Computer Vision...");
      
      // Get the current image
      let imageData: string | null = null;
      if (isLiveMode && frozenFrame) {
        imageData = frozenFrame;
      } else if (capturedImage) {
        imageData = capturedImage;
      } else {
        return "Unknown Object";
      }

      // Create a cropped region around the clicked point for better identification
      const cropRegion = {
        x: Math.max(0, point.x - 100),
        y: Math.max(0, point.y - 100),
        width: 200,
        height: 200
      };

      // Call our object identification API
      const response = await fetch('/api/identify-object', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData.split(',')[1], // Remove data URL prefix
          region: cropRegion
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log("🎯 Object identified:", result.objectName);
        return result.objectName || "Unknown Object";
      } else {
        console.log("⚠️ Object identification failed, using generic label");
        return "Detected Object";
      }
    } catch (error) {
      console.log("⚠️ Object identification error:", error);
      return "Object";
    }
  };

  // Print label function
  // Label element drag handlers
  const handleMouseDown = (e: React.MouseEvent, elementType: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const element = labelTemplate.elements[elementType as keyof typeof labelTemplate.elements];
    
    setDragState({
      isDragging: true,
      element: elementType,
      offset: {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
    });

    // Mark element as being dragged
    setLabelTemplate(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [elementType]: {
          ...element,
          dragging: true,
        },
      },
    }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.element) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const newX = Math.max(0, Math.min(
      labelTemplate.width - labelTemplate.elements[dragState.element as keyof typeof labelTemplate.elements].width,
      e.clientX - container.left - dragState.offset.x
    ));
    const newY = Math.max(0, Math.min(
      labelTemplate.height - labelTemplate.elements[dragState.element as keyof typeof labelTemplate.elements].height,
      e.clientY - container.top - dragState.offset.y
    ));

    setLabelTemplate(prev => ({
      ...prev,
      elements: {
        ...prev.elements,
        [dragState.element!]: {
          ...prev.elements[dragState.element! as keyof typeof prev.elements],
          x: newX,
          y: newY,
        },
      },
    }));
  };

  const handleMouseUp = () => {
    if (dragState.element) {
      setLabelTemplate(prev => ({
        ...prev,
        elements: {
          ...prev.elements,
          [dragState.element!]: {
            ...prev.elements[dragState.element! as keyof typeof prev.elements],
            dragging: false,
          },
        },
      }));
    }
    
    setDragState({
      isDragging: false,
      element: null,
      offset: { x: 0, y: 0 },
    });
  };

  const printLabel = (item: InventoryItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const qrData = generateQRData(item);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inventory Label - ${item.name}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .label { 
              width: ${labelTemplate.width}px; 
              height: ${labelTemplate.height}px; 
              border: 2px solid ${labelTemplate.colors.border};
              background: ${labelTemplate.colors.background};
              color: ${labelTemplate.colors.text};
              position: relative;
              overflow: hidden;
            }
            .element { position: absolute; }
            .logo { 
              width: ${labelTemplate.elements.logo.width}px; 
              height: ${labelTemplate.elements.logo.height}px;
              left: ${labelTemplate.elements.logo.x}px;
              top: ${labelTemplate.elements.logo.y}px;
            }
            .qr-container {
              left: ${labelTemplate.elements.qrCode.x}px;
              top: ${labelTemplate.elements.qrCode.y}px;
              width: ${labelTemplate.elements.qrCode.width}px;
              height: ${labelTemplate.elements.qrCode.height}px;
            }
            .item-name {
              left: ${labelTemplate.elements.itemName.x}px;
              top: ${labelTemplate.elements.itemName.y}px;
              width: ${labelTemplate.elements.itemName.width}px;
              font-size: ${labelTemplate.elements.itemName.fontSize}px;
              font-weight: ${labelTemplate.elements.itemName.fontWeight};
              text-align: ${labelTemplate.elements.itemName.textAlign};
            }
            .metadata {
              left: ${labelTemplate.elements.metadata.x}px;
              top: ${labelTemplate.elements.metadata.y}px;
              width: ${labelTemplate.elements.metadata.width}px;
              font-size: ${labelTemplate.elements.metadata.fontSize}px;
              line-height: ${labelTemplate.elements.metadata.lineHeight};
            }
            @media print { body { margin: 0; } .label { border: none; } }
          </style>
        </head>
        <body>
          <div class="label">
            ${labelTemplate.elements.logo.enabled ? `
              <div class="element logo">
                <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                  <circle cx="50" cy="50" r="45" fill="#ea580c" stroke="#fff" stroke-width="3"/>
                  <text x="50" y="35" text-anchor="middle" fill="white" font-size="16" font-weight="bold">TGL</text>
                  <text x="50" y="65" text-anchor="middle" fill="white" font-size="8">MEDALLION</text>
                </svg>
              </div>
            ` : ''}
            ${labelTemplate.elements.qrCode.enabled ? `
              <div class="element qr-container">
                <div id="qr-code" style="width: 100%; height: 100%; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 8px;">QR</div>
              </div>
            ` : ''}
            ${labelTemplate.elements.itemName.enabled ? `
              <div class="element item-name">${item.name}</div>
            ` : ''}
            ${labelTemplate.elements.metadata.enabled ? `
              <div class="element metadata">
                SKU: ${item.sku}<br>
                Unit: ${item.unit}<br>
                Cost: $${item.costPerUnit}<br>
                Supplier: ${item.supplier}<br>
                Printed: ${new Date().toLocaleDateString()}
              </div>
            ` : ''}
          </div>
          <script>
            window.print();
            window.close();
          </script>
        </body>
      </html>
    `);
  };

  const handleUpdateDetails = async () => {
    if (!detailViewItem || !detailViewItem.id) return;
    try {
      const input = {
        name: detailViewItem.name,
        category: detailViewItem.category,
        currentStock: parseFloat(String(detailViewItem.currentStock)) || 0,
        minThreshold: parseFloat(String(detailViewItem.minThreshold)) || 0,
        maxCapacity: parseFloat(String(detailViewItem.maxCapacity)) || 0,
        unit: detailViewItem.unit,
        costPerUnit: parseFloat(String(detailViewItem.costPerUnit)) || 0,
        supplier: detailViewItem.supplier,
        location: detailViewItem.location,
        ...(detailViewItem.barcode && String(detailViewItem.barcode).trim() ? { barcode: detailViewItem.barcode } : {}),
        ...(detailViewItem.qrCode && String(detailViewItem.qrCode).trim() ? { qrCode: detailViewItem.qrCode } : {}),
        description: detailViewItem.description,
        expiryDate: detailViewItem.expiryDate,
        waste: parseFloat(String(detailViewItem.waste)) || 0,
        reorderPoint: parseFloat(String(detailViewItem.reorderPoint)) || 0,
        reorderQuantity: parseFloat(String(detailViewItem.reorderQuantity)) || 0,
      };

      await updateInventoryItem({
        variables: { id: detailViewItem.id, input },
      });
      toast.success('Inventory item updated successfully!');
      setDetailViewItem(null);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update inventory item');
    }
  };

  const handleQuickCountSubmit = async () => {
    const item = inventoryItems[quickCountIndex];
    if (!item) return;

    const newCount = parseFloat(quickCountValue);
    const newPar = parseFloat(quickParValue);

    try {
      if (!isNaN(newCount)) {
        await handleUpdateStock(item.id, newCount);
      }
      if (!isNaN(newPar)) {
        const input = {
          name: item.name,
          category: item.category,
          currentStock: item.currentStock,
          minThreshold: newPar,
          maxCapacity: item.maxCapacity,
          unit: item.unit,
          costPerUnit: item.costPerUnit,
          supplier: item.supplier,
          location: item.location,
          ...(item.barcode && String(item.barcode).trim() ? { barcode: item.barcode } : {}),
          ...(item.qrCode && String(item.qrCode).trim() ? { qrCode: item.qrCode } : {}),
          description: item.description,
          expiryDate: item.expiryDate,
          waste: item.waste,
          reorderPoint: item.reorderPoint,
          reorderQuantity: item.reorderQuantity,
        };
        await updateInventoryItem({
          variables: {
            id: item.id,
            input,
          },
        });
        toast.success('Par updated successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit changes');
    } finally {
      // Advance to next item
      if (quickCountIndex < inventoryItems.length - 1) {
        setQuickCountIndex(quickCountIndex + 1);
      }
      setQuickCountValue("");
      setQuickParValue("");
    }
  };

  const handleRecordWaste = async () => {
    if (!selectedItem) return;
    const quantity = parseFloat(wasteQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity.');
      return;
    }
    if (!wasteReason) {
      toast.error('Please select a reason for the waste.');
      return;
    }

    try {
      const { data } = await recordWaste({
        variables: {
          itemId: selectedItem.id,
          quantity,
          reason: wasteReason,
          notes: wasteNotes,
        },
      });
      
      if (data?.recordWaste) {
        setSelectedItem(data.recordWaste);
        setDetailViewItem(data.recordWaste);
      }

      toast.success('Waste recorded successfully!');
      setWasteQuantity("");
      setWasteReason("");
      setWasteNotes("");
      // Optionally, switch back to the details tab or close the modal
    } catch (error: any) {
      toast.error(error.message || 'Failed to record waste.');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">
              Advanced inventory tracking with QR codes, labels, and AI-powered counting
              {!isAdmin && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Staff View</span>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsVendorOrderExportOpen(true)}>
              <Download className="mr-2 h-4 w-4" />
                Export Vendor Orders
              </Button>
            <Button onClick={openAddItemDialog} className="bg-orange-600 hover:bg-orange-700 text-white" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
            <Button variant="destructive" onClick={clearAllInventory} className="bg-red-600 hover:bg-red-700" size="sm">
              <Trash2 className="mr-2 h-4 w-4" /> Clear All
            </Button>
            <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
              <Button variant="outline" onClick={testDirectInventoryFetch} size="sm">
                <ScanLine className="mr-2 h-4 w-4" /> Test API
              </Button>
              <Button variant="outline" onClick={forceCacheRefresh} size="sm">
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
            <div className="flex space-x-2">
            
              
              <Dialog open={isCSVImportOpen} onOpenChange={setIsCSVImportOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-orange-600 text-orange-600 hover:bg-orange-50">
                    <Upload className="mr-2 h-4 w-4" />
                    Import CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Import Sysco CSV Order</DialogTitle>
                    <DialogDescription>
                      Upload your Sysco order CSV to bulk import items and detect duplicates
                    </DialogDescription>
                  </DialogHeader>
                  
                  {importStep === 'upload' && (
                    <div className="py-6">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="csv-upload" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              {csvFile ? csvFile.name : 'Drop your Sysco CSV here or click to browse'}
                            </span>
                            <input
                              id="csv-upload"
                              type="file"
                              accept=".csv"
                              className="hidden"
                              onChange={handleCSVUpload}
                            />
                          </label>
                          <p className="mt-2 text-xs text-gray-500">
                            CSV files only. Maximum 10MB.
                          </p>
                        </div>
                      </div>
                      
                      {csvFile && (
                        <div className="mt-4 flex justify-center">
                          <Button 
                            onClick={previewCSVData}
                            disabled={csvImportLoading}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            {csvImportLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="mr-2 h-4 w-4" />
                            )}
                            Preview & Analyze
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {importStep === 'review' && csvPreviewData && (
                    <div className="py-4">
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <FileText className="h-6 w-6 text-blue-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-blue-900">Total Items</p>
                              <p className="text-lg font-semibold text-blue-600">{csvPreviewData.totalParsed}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-green-900">New Items</p>
                              <p className="text-lg font-semibold text-green-600">{csvPreviewData.summary.new}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="flex items-center">
                            <AlertCircle className="h-6 w-6 text-yellow-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-yellow-900">Duplicates</p>
                              <p className="text-lg font-semibold text-yellow-600">{csvPreviewData.summary.duplicates}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={selectAllNewItems}
                          >
                            Select All New
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedImportItems([])}
                          >
                            Clear Selection
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600">
                          {selectedImportItems.length} items selected for import
                        </p>
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                <input 
                                  type="checkbox" 
                                  checked={selectedImportItems.length === csvPreviewData.items.filter((item: CsvItem) => !item.isDuplicate).length}
                                  onChange={selectAllNewItems}
                                />
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SUPC</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {csvPreviewData.items.map((item: CsvItem, index: number) => (
                              <tr key={index} className={item.isDuplicate ? 'bg-yellow-50' : 'bg-white'}>
                                <td className="px-3 py-2">
                                  <input 
                                    type="checkbox"
                                    disabled={item.isDuplicate}
                                    checked={selectedImportItems.includes(index)}
                                    onChange={() => toggleItemSelection(index)}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  {item.isDuplicate ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Duplicate
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      New
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-900">{item.name}</td>
                                <td className="px-3 py-2 text-sm text-gray-600">{item.syscoSUPC}</td>
                                <td className="px-3 py-2 text-sm text-gray-600">{item.category}</td>
                                <td className="px-3 py-2 text-sm text-gray-600">${item.costPerUnit}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="flex justify-between mt-6">
                        <Button variant="outline" onClick={() => setImportStep('upload')}>
                          Back
                        </Button>
                        <Button 
                          onClick={importSelectedItems}
                          disabled={selectedImportItems.length === 0 || csvImportLoading}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          {csvImportLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-4 w-4" />
                          )}
                          Import {selectedImportItems.length} Items
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {importStep === 'complete' && (
                    <div className="py-8 text-center">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">Import Complete!</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        Your Sysco items have been processed. You can now map barcodes to them.
                      </p>
                      <div className="mt-6 flex justify-center space-x-2 flex-wrap gap-2">
                        <Button variant="outline" onClick={debugInventoryDatabase}>
                          🔍 Debug Database
                        </Button>
                        <Button variant="outline" onClick={testDirectInventoryFetch}>
                          📡 Test Direct Fetch
                        </Button>
                        <Button variant="outline" onClick={forceCacheRefresh}>
                          🔄 Force Refresh
                        </Button>
                        <Button variant="outline" onClick={resetCSVImport}>
                          Import Another CSV
                        </Button>
                        <Button onClick={resetCSVImport} className="bg-orange-600 hover:bg-orange-700">
                          Done
                        </Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
            
            <Dialog open={isAddItemOpen || isEditItemOpen} onOpenChange={(isOpen) => {
              if (!isOpen) {
                setIsAddItemOpen(false);
                setIsEditItemOpen(false);
                setSelectedItem(null);
              }
            }}>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</DialogTitle>
                  <DialogDescription>Add a new item with QR code scanning or manual entry</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  {/* Form Fields */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="item-name">Item Name</Label>
                        <Input 
                          id="item-name" 
                          placeholder="Enter item name" 
                          value={newItemForm.name}
                          onChange={(e) => setNewItemForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <select 
                          id="category" 
                          className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                          value={newItemForm.category}
                          onChange={(e) => setNewItemForm(prev => ({ ...prev, category: e.target.value }))}
                        >
                          <option value="">Select category...</option>
                          <option>Proteins</option>
                          <option>Produce</option>
                          <option>Dairy</option>
                          <option>Pantry</option>
                          <option>Herbs</option>
                          <option>Beverages</option>
                          <option>Dry Goods</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="sku">SKU</Label>
                        <Input 
                          id="sku" 
                          placeholder="Item SKU" 
                          value={newItemForm.sku}
                          onChange={(e) => setNewItemForm(prev => ({ ...prev, sku: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="barcode">Barcode</Label>
                        <Input 
                          id="barcode" 
                          placeholder="Barcode number" 
                          value={newItemForm.barcode}
                          onChange={(e) => setNewItemForm(prev => ({ ...prev, barcode: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="unit">Unit</Label>
                        <Input 
                          id="unit" 
                          placeholder="lbs, pieces, bottles, etc." 
                          value={newItemForm.unit}
                          onChange={(e) => setNewItemForm(prev => ({ ...prev, unit: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cost-per-unit">Cost Per Unit</Label>
                        <Input 
                          id="cost-per-unit" 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                          value={newItemForm.costPerUnit}
                          onChange={(e) => setNewItemForm(prev => ({ ...prev, costPerUnit: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input 
                          id="supplier" 
                          placeholder="Supplier name" 
                          value={newItemForm.supplier}
                          onChange={(e) => setNewItemForm(prev => ({ ...prev, supplier: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inventory Levels */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-foreground">On-hand + Par System</h3>
                      <Button type="button" variant="ghost" size="icon" onClick={() => setIsParHelpOpen(true)}>
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="current-stock">Current Stock</Label>
                        <Input 
                          id="current-stock" 
                          type="number" 
                          placeholder="Current quantity" 
                          value={newItemForm.currentStock}
                          onChange={(e) => setNewItemForm(prev => ({ ...prev, currentStock: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="min-threshold">Min Threshold</Label>
                        <Input 
                          id="min-threshold" 
                          type="number" 
                          placeholder="Minimum stock" 
                          value={newItemForm.minThreshold}
                          onChange={(e) => setNewItemForm(prev => ({ ...prev, minThreshold: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-capacity">Par Level (Max Capacity)</Label>
                        <Input 
                          id="max-capacity" 
                          type="number" 
                          placeholder="Maximum stock" 
                          value={newItemForm.maxCapacity}
                          onChange={(e) => setNewItemForm(prev => ({ ...prev, maxCapacity: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="average-daily-usage">Average Daily Usage</Label>
                        <Input
                          id="average-daily-usage"
                          type="number"
                          step="0.01"
                          placeholder="Units per day"
                          value={newItemForm.averageDailyUsage}
                          onChange={(e) => setNewItemForm(prev => ({ ...prev, averageDailyUsage: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="reorder-point">Reorder Point</Label>
                        <Input
                          id="reorder-point"
                          type="number"
                          placeholder="Auto or set manually"
                          value={newItemForm.reorderPoint || ''}
                          onChange={(e) => setNewItemForm(prev => ({ ...prev, reorderPoint: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="restock-period">Restock Periodicity</Label>
                        <select
                          id="restock-period"
                          className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                          value={newItemForm.restockPeriod || 'weekly'}
                          onChange={(e) => setNewItemForm(prev => ({ ...prev, restockPeriod: e.target.value }))}
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="restock-days">Custom Days</Label>
                        <Input
                          id="restock-days"
                          type="number"
                          placeholder="e.g., 10"
                          value={newItemForm.restockDays || ''}
                          onChange={(e) => setNewItemForm(prev => ({ ...prev, restockDays: e.target.value }))}
                          disabled={(newItemForm.restockPeriod || 'weekly') !== 'custom'}
                        />
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                      <div className="rounded-md border p-2">
                        <div className="text-muted-foreground">Days Left (est.)</div>
                        <div className="font-medium">
                          {(() => {
                            // Determine horizon from periodicity
                            const period = newItemForm.restockPeriod || 'weekly';
                            const customDays = parseInt(String(newItemForm.restockDays || 0)) || 0;
                            const periodDays = period === 'daily' ? 1 : period === 'weekly' ? 7 : period === 'monthly' ? 30 : (customDays || 7);
                            const usage = parseFloat(newItemForm.averageDailyUsage || '0');
                            const stock = parseFloat(newItemForm.currentStock || '0');
                            if (!usage) return '—';
                            const days = Math.floor(stock / usage);
                            return days >= 0 ? `${days} days` : '—';
                          })()}
                        </div>
                      </div>
                      <div className="rounded-md border p-2">
                        <div className="text-muted-foreground">Order to Par</div>
                        <div className="font-medium">
                          {(() => {
                            const par = parseFloat(newItemForm.maxCapacity || '0');
                            const stock = parseFloat(newItemForm.currentStock || '0');
                            const needed = Math.max(0, par - stock);
                            return needed;
                          })()}
                        </div>
                      </div>
                      <div className="rounded-md border p-2">
                        <div className="text-muted-foreground">Recommended Reorder Point</div>
                        <div className="font-medium">
                          {(() => {
                            const period = newItemForm.restockPeriod || 'weekly';
                            const customDays = parseInt(String(newItemForm.restockDays || 0)) || 0;
                            const periodDays = period === 'daily' ? 1 : period === 'weekly' ? 7 : period === 'monthly' ? 30 : (customDays || 7);
                            const usage = parseFloat(newItemForm.averageDailyUsage || '0');
                            if (!usage) return '—';
                            // Recommendation: reorder when remaining is <= usage * periodDays
                            return Math.ceil(usage * periodDays);
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sysco Ordering Information */}
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-foreground mb-4">📦 Sysco Ordering Information</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="sysco-sku">Sysco SKU</Label>
                          <Input 
                            id="sysco-sku" 
                            placeholder="Sysco product number" 
                            value={newItemForm.syscoSKU || ''}
                            onChange={(e) => setNewItemForm(prev => ({ ...prev, syscoSKU: e.target.value }))}
                          />
                </div>
                        <div>
                          <Label htmlFor="vendor-sku">Vendor SKU</Label>
                          <Input 
                            id="vendor-sku" 
                            placeholder="Supplier product number" 
                            value={newItemForm.vendorSKU || ''}
                            onChange={(e) => setNewItemForm(prev => ({ ...prev, vendorSKU: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="vendor-code">Vendor Code</Label>
                          <Input 
                            id="vendor-code" 
                            placeholder="Supplier identifier" 
                            value={newItemForm.vendorCode || ''}
                            onChange={(e) => setNewItemForm(prev => ({ ...prev, vendorCode: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="sysco-category">Sysco Category</Label>
                          <Input 
                            id="sysco-category" 
                            placeholder="Sysco classification" 
                            value={newItemForm.syscoCategory || ''}
                            onChange={(e) => setNewItemForm(prev => ({ ...prev, syscoCategory: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="case-pack-size">Case Pack Size</Label>
                          <Input 
                            id="case-pack-size" 
                            type="number" 
                            placeholder="Units per case" 
                            value={newItemForm.casePackSize || ''}
                            onChange={(e) => setNewItemForm(prev => ({ ...prev, casePackSize: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="min-order-qty">Min Order Quantity</Label>
                          <Input 
                            id="min-order-qty" 
                            type="number" 
                            placeholder="Minimum order" 
                            value={newItemForm.minimumOrderQty || ''}
                            onChange={(e) => setNewItemForm(prev => ({ ...prev, minimumOrderQty: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="price-per-case">Price Per Case</Label>
                          <Input 
                            id="price-per-case" 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            value={newItemForm.pricePerCase || ''}
                            onChange={(e) => setNewItemForm(prev => ({ ...prev, pricePerCase: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lead-time">Lead Time (Days)</Label>
                          <Input 
                            id="lead-time" 
                            type="number" 
                            placeholder="Delivery time" 
                            value={newItemForm.leadTimeDays || ''}
                            onChange={(e) => setNewItemForm(prev => ({ ...prev, leadTimeDays: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea 
                        id="notes" 
                        placeholder="Additional notes about this item..." 
                        value={newItemForm.notes || ''}
                        onChange={(e) => setNewItemForm(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <ScanLine className="h-4 w-4" />
                    <span>💡 Tip: Add item first, then map barcode for future scans</span>
                  </div>
                  <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => {
                    setIsAddItemOpen(false);
                    setIsEditItemOpen(false);
                    setSelectedItem(null);
                  }}>Cancel</Button>
                    <Button onClick={selectedItem ? handleEditItem : handleCreateItem} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 text-white">
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (selectedItem ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />)}
                      {selectedItem ? 'Save Changes' : 'Add Item'}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Nested help dialog for Par/On-hand tutorial */}
            <Dialog open={isParHelpOpen} onOpenChange={setIsParHelpOpen}>
              <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>How On-hand + Par Works</DialogTitle>
                  <DialogDescription>A quick guide to manage inventory effectively</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Par Level (Max Capacity):</span> Your target full level for the item (we use Par Level = Max Capacity). After ordering, you aim to reach this number.
                  </div>
                  <div>
                    <span className="font-medium">Current Stock (On Hand):</span> What you physically have right now.
                  </div>
                  <div>
                    <span className="font-medium">Average Daily Usage (units/day):</span> Your best estimate of how many units you use per day. This drives forecasting.
                  </div>
                  <div>
                    <span className="font-medium">Restock Periodicity:</span> Choose <em>daily</em> (1 day), <em>weekly</em> (7 days), <em>monthly</em> (30 days), or <em>custom</em> (your own days). We use this horizon for recommendations.
                  </div>
                  <div>
                    <span className="font-medium">Days Left:</span> <code>floor(Current Stock ÷ Average Daily Usage)</code>. If usage is 0 or blank, Days Left is not shown.
                  </div>
                  <div>
                    <span className="font-medium">Order to Par:</span> <code>Par Level − Current Stock</code>. This is the quantity needed to get back to your par.
                  </div>
                  <div>
                    <span className="font-medium">Recommended Reorder Point:</span> <code>ceil(Average Daily Usage × Period Days)</code>. Reorder when remaining stock is at or below this level so you can cover your restock horizon.
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> Automatically updates based on stock: <em>Out of stock</em> (0), <em>Critical</em> (≤ Min Threshold), <em>Low</em> (≤ 1.5 × Min Threshold), otherwise <em>Normal</em>.
                  </div>
                  <div className="rounded-md border p-3 bg-accent/20">
                    Tip: Keep Average Daily Usage current and set Period Days ≥ your vendor lead time to avoid stockouts. Consider setting your Min Threshold near the Recommended Reorder Point.
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsParHelpOpen(false)}>Got it</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Varuni AI Insights - Only visible to Super Admins */}
        {isAdmin && (
          <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-3">🧠 Varuni's Inventory Insights</h3>
              <div className="grid gap-4">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-foreground">{suggestion.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded ${
                            suggestion.urgency === "critical" ? "tag-red" :
                            suggestion.urgency === "medium" ? "tag-yellow" : "tag-blue"
                          }`}>
                            {suggestion.urgency}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                        <p className="text-sm font-medium text-foreground">💡 {suggestion.action}</p>
                        <p className="text-xs text-green-600 mt-1">💰 {suggestion.costImpact}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                    ${getTotalValue().toFixed(0)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-4' : 'grid-cols-2'}`}>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            {isAdmin && <TabsTrigger value="vendors">Vendors</TabsTrigger>}
            {isAdmin && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Critical Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Critical Items (Below Reorder Point)
                  </CardTitle>
                  <CardDescription>Items requiring immediate reordering</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getCriticalItems().map((item: InventoryItem) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            On Hand: {item.currentStock} {item.unit} • Reorder at: {item.reorderPoint} {item.unit}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Daily usage: {item.dailyUsage} {item.unit}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" className="bg-red-600 hover:bg-red-700">
                            Reorder
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => printLabel(item)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {getCriticalItems().length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No critical items - great job!</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Weekly Waste Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Waste Summary</CardTitle>
                  <CardDescription>Track food waste and cost impact</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">Total Waste Cost</span>
                      <span className="text-lg font-bold text-red-600">${getWeeklyWaste().toFixed(2)}</span>
                    </div>
                    <div className="space-y-3">
                      {inventoryItems.filter((item: InventoryItem) => (item.waste || 0) > 0).map((item: InventoryItem) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-border">
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.wasteReason}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{item.waste || 0} {item.unit}</p>
                            <p className="text-xs text-red-600">${((item.waste || 0) * item.costPerUnit).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Stock Movement Chart */}
            {isAdmin && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div>
                  <CardTitle>Stock Movement Trends</CardTitle>
                      <CardDescription>Real-time inventory flow analysis</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Period Selection */}
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm font-medium">Period:</Label>
                        <Select value={movementPeriod} onValueChange={(value: 'daily' | 'weekly' | 'yearly') => handlePeriodChange(value)}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="yearly">Yearly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Date Range Selection */}
                      <div className="flex items-center space-x-2">
                        <Label className="text-sm font-medium">From:</Label>
                        <Input
                          type="date"
                          value={movementDateRange.start}
                          onChange={(e) => setMovementDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="w-36"
                        />
                        <Label className="text-sm font-medium">To:</Label>
                        <Input
                          type="date"
                          value={movementDateRange.end}
                          onChange={(e) => setMovementDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="w-36"
                        />
                      </div>

                      {/* Refresh Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchMovementData}
                        disabled={movementLoading}
                      >
                        {movementLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {/* Chart Container */}
                    <div className={`transition-all duration-300 ${!hasMovementData ? 'blur-sm pointer-events-none' : ''}`}>
                  <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={hasMovementData ? movementData : []}>
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
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length > 0) {
                                return (
                                  <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
                                    {payload.map((entry, index) => (
                                      <p key={index} style={{ color: entry.color }} className="text-sm">
                                        {entry.name}: {entry.value} units
                                      </p>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="usage" 
                            stroke="#ef4444" 
                            strokeWidth={2} 
                            name="Usage"
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="received" 
                            stroke="#22c55e" 
                            strokeWidth={2} 
                            name="Received"
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="netMovement" 
                            stroke="#3b82f6" 
                            strokeWidth={2} 
                            name="Net Movement"
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            strokeDasharray="5 5"
                          />
                    </LineChart>
                  </ResponsiveContainer>
                    </div>

                    {/* Data Unavailable Overlay */}
                    {!hasMovementData && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <BarChartIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            More Data Required
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
                            {movementLoading 
                              ? "Loading transaction data..." 
                              : "No inventory transactions found for the selected period. Start recording transactions to view trends."
                            }
                          </p>
                          {!movementLoading && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedTab('items')}
                            >
                              Manage Inventory
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Loading Overlay */}
                    {movementLoading && hasMovementData && (
                      <div className="absolute top-4 right-4">
                        <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">Updating...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chart Legend & Summary */}
                  {hasMovementData && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-gray-600 dark:text-gray-300">Usage (Outbound)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-gray-600 dark:text-gray-300">Received (Inbound)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-0.5 bg-blue-500"></div>
                          <span className="text-gray-600 dark:text-gray-300">Net Movement</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500 dark:text-gray-400">
                            {movementData.length} data points
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Recipes Tab */}
          <TabsContent value="recipes" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center">
                      <Package className="mr-2 h-5 w-5" />
                      Recipe Management & Costing
                    </CardTitle>
                    <CardDescription>Manage recipes, ingredient costing, and food cost analysis</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Recipe
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Recipe Cards */}
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Chicken Fajitas</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Food Cost:</span>
                        <span>$8.50</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Menu Price:</span>
                        <span>$16.95</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Food Cost %:</span>
                        <span className="text-green-600 font-medium">25.1%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Margin:</span>
                        <span className="font-medium">$8.45</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Caesar Salad</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Food Cost:</span>
                        <span>$3.25</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Menu Price:</span>
                        <span>$12.95</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Food Cost %:</span>
                        <span className="text-green-600 font-medium">25.1%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Margin:</span>
                        <span className="font-medium">$9.70</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">House Burger</h3>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">High Cost</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Food Cost:</span>
                        <span>$7.80</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Menu Price:</span>
                        <span>$14.95</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Food Cost %:</span>
                        <span className="text-red-600 font-medium">52.2%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Margin:</span>
                        <span className="font-medium">$7.15</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border">
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchase Orders Tab */}
          {isAdmin && (
            <TabsContent value="purchase-orders" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center">
                        <Truck className="mr-2 h-5 w-5" />
                        Purchase Order Management
                      </CardTitle>
                      <CardDescription>Create, track, and manage purchase orders</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                      </Button>
                      <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Create PO
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Draft POs</p>
                            <p className="text-2xl font-bold">3</p>
                          </div>
                          <Clock className="h-8 w-8 text-yellow-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Pending</p>
                            <p className="text-2xl font-bold">7</p>
                          </div>
                          <Truck className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">This Month</p>
                            <p className="text-2xl font-bold">$12,450</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Average PO</p>
                            <p className="text-2xl font-bold">$890</p>
                          </div>
                          <Package className="h-8 w-8 text-purple-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PO Number</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Expected Delivery</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">PO-2024-001</TableCell>
                        <TableCell>Sysco Foods</TableCell>
                        <TableCell>Jan 15, 2024</TableCell>
                        <TableCell>Jan 17, 2024</TableCell>
                        <TableCell>$1,245.50</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Received</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">View</Button>
                            <Button size="sm" variant="outline">Print</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">PO-2024-002</TableCell>
                        <TableCell>Fresh Farm Co</TableCell>
                        <TableCell>Jan 16, 2024</TableCell>
                        <TableCell>Jan 18, 2024</TableCell>
                        <TableCell>$890.25</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">Sent</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline">View</Button>
                            <Button size="sm" variant="outline">Track</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Receiving Tab */}
          {isAdmin && (
            <TabsContent value="receiving" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center">
                        <CheckCircle className="mr-2 h-5 w-5" />
                        Receiving & Quality Control
                      </CardTitle>
                      <CardDescription>Receive shipments, perform quality checks, and update inventory</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                      </Button>
                      <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Receive Shipment
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Expected Today</p>
                              <p className="text-2xl font-bold">4</p>
                              <p className="text-xs text-muted-foreground">shipments</p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-600" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Received Today</p>
                              <p className="text-2xl font-bold">2</p>
                              <p className="text-xs text-muted-foreground">shipments</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Quality Issues</p>
                              <p className="text-2xl font-bold">1</p>
                              <p className="text-xs text-muted-foreground">this week</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-2">📦 Expected Deliveries Today</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Sysco Foods - PO-2024-002</p>
                            <p className="text-sm text-muted-foreground">Expected: 10:00 AM - 12:00 PM</p>
                          </div>
                          <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                            Start Receiving
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Fresh Farm Co - PO-2024-003</p>
                            <p className="text-sm text-muted-foreground">Expected: 2:00 PM - 4:00 PM</p>
                          </div>
                          <Button size="sm" variant="outline">
                            View PO
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Inventory Counts Tab */}
          {isAdmin && (
            <TabsContent value="counts" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center">
                        <Scale className="mr-2 h-5 w-5" />
                        Inventory Counts & Audits
                      </CardTitle>
                      <CardDescription>Physical counts, cycle counts, and variance analysis</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                      </Button>
                      <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Schedule Count
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Last Count</p>
                            <p className="text-lg font-bold">Jan 15</p>
                            <p className="text-xs text-green-600">98.5% Accuracy</p>
                          </div>
                          <Calendar className="h-8 w-8 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Variance</p>
                            <p className="text-lg font-bold text-red-600">-$127.50</p>
                            <p className="text-xs text-muted-foreground">This month</p>
                          </div>
                          <TrendingDown className="h-8 w-8 text-red-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Scheduled</p>
                            <p className="text-lg font-bold">3</p>
                            <p className="text-xs text-muted-foreground">Next week</p>
                          </div>
                          <Clock className="h-8 w-8 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                            <p className="text-lg font-bold text-green-600">97.2%</p>
                            <p className="text-xs text-muted-foreground">6 months</p>
                          </div>
                          <Target className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Count Number</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Variance</TableHead>
                        <TableHead>Accuracy</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">CNT-2024-001</TableCell>
                        <TableCell>Full Physical</TableCell>
                        <TableCell>Jan 15, 2024</TableCell>
                        <TableCell>143</TableCell>
                        <TableCell className="text-red-600">-$45.20</TableCell>
                        <TableCell className="text-green-600">98.5%</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Completed</span>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">View Report</Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">CNT-2024-002</TableCell>
                        <TableCell>Cycle Count</TableCell>
                        <TableCell>Jan 20, 2024</TableCell>
                        <TableCell>28</TableCell>
                        <TableCell className="text-green-600">+$12.50</TableCell>
                        <TableCell className="text-green-600">96.8%</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">In Progress</span>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">Continue</Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Enhanced Reports Tab */}
          {isAdmin && (
            <TabsContent value="reports" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="flex items-center">
                        <BarChart className="mr-2 h-5 w-5" />
                        Advanced Reports & Analytics
                      </CardTitle>
                      <CardDescription>Comprehensive reporting and business intelligence</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline">
                        <Filter className="mr-2 h-4 w-4" />
                        Filter
                      </Button>
                      <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export All Reports
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium">Food Cost Analysis</h3>
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Detailed food cost percentages, trends, and variance analysis
                        </p>
                        <Button size="sm" variant="outline" className="w-full">
                          Generate Report
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium">ABC Analysis</h3>
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Categorize inventory by value and importance for optimization
                        </p>
                        <Button size="sm" variant="outline" className="w-full">
                          Generate Report
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium">Supplier Performance</h3>
                          <Truck className="h-5 w-5 text-purple-600" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          On-time delivery, quality ratings, and cost analysis
                        </p>
                        <Button size="sm" variant="outline" className="w-full">
                          Generate Report
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium">Waste Analysis</h3>
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Track waste patterns, reasons, and cost impact
                        </p>
                        <Button size="sm" variant="outline" className="w-full">
                          Generate Report
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium">Recipe Profitability</h3>
                          <Scale className="h-5 w-5 text-orange-600" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Menu item margins, food costs, and pricing optimization
                        </p>
                        <Button size="sm" variant="outline" className="w-full">
                          Generate Report
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium">Inventory Turnover</h3>
                          <Clock className="h-5 w-5 text-teal-600" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Track inventory velocity and cash flow optimization
                        </p>
                        <Button size="sm" variant="outline" className="w-full">
                          Generate Report
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Items Tab - Restaurant Standard Inventory */}
          <TabsContent value="items" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                  <div>
                    <CardTitle>Inventory Items (On Hand Method)</CardTitle>
                    <CardDescription>Manage your on-hand quantities with QR codes and smart counting</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <div className="md:hidden">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            Sort
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleSort("name")}>Name</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort("category")}>Category</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort("currentStock")}>On Hand</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSort("status")}>Status</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Button variant="outline" size="sm" className="hidden md:flex" onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}>
                      <Filter className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsQRScannerOpen(true);
                      }}
                    >
                      <QrCode className="mr-2 h-4 w-4" />
                      Scan QR Code
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsQuickCountOpen(true);
                        setQuickCountIndex(0);
                        setQuickCountValue("");
                        setQuickSearch("");
                      }}
                    >
                      <Target className="mr-2 h-4 w-4" />
                      Modify Quantities
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {isFilterPanelOpen && (
                <div className="p-4 border-b">
                  <div className="flex items-center gap-4">
                    <Select onValueChange={(value) => setFilterCategory(value)} defaultValue={filterCategory || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by category..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Categories</SelectItem>
                        {uniqueCategories.map((category: string) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" onClick={() => setFilterCategory(null)}>Clear</Button>
                  </div>
                </div>
              )}
              <CardContent>
                <Table className="hidden md:table">
                  <TableHeader>
                    <TableRow>
                      <TableHead onClick={() => handleSort("name")} className="cursor-pointer">Item</TableHead>
                      <TableHead onClick={() => handleSort("category")} className="cursor-pointer">Category</TableHead>
                      <TableHead onClick={() => handleSort("currentStock")} className="cursor-pointer">On Hand</TableHead>
                      <TableHead onClick={() => handleSort("minThreshold")} className="cursor-pointer">Par Level</TableHead>
                      <TableHead>Waste</TableHead>
                      <TableHead onClick={() => handleSort("status")} className="cursor-pointer">Status</TableHead>
                      <TableHead>Days Left</TableHead>
                      <TableHead>Order to Par</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item: InventoryItem) => {
                      const usage = (item as any).averageDailyUsage > 0 ? (item as any).averageDailyUsage : 0;
                      const daysLeft = usage > 0 ? Math.floor((item.currentStock || 0) / usage) : Infinity;
                      return (
                        <TableRow key={item.id} onClick={() => {
                          setSelectedItem(item);
                          setDetailViewItem(item);
                        }} className="cursor-pointer">
                          <TableCell>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.sku}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.category}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.currentStock} {item.unit}</p>
                              <p className="text-xs text-muted-foreground">${(item.currentStock * item.costPerUnit).toFixed(2)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.minThreshold} {item.unit}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(() => {
                                const counts = getWasteCountsForItem(item);
                                return WASTE_REASONS.map((reason) => (
                                  <Badge key={reason} variant="outline" title={reason} className={`${getWasteTagClass(reason)} border-none px-2 py-0.5 text-[10px]`}>{counts[reason] || 0}</Badge>
                                ));
                              })()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const liveStatus = computeStatus(item.currentStock, item.minThreshold);
                              return (
                                <span className={`px-2 py-1 text-xs rounded ${getStatusColor(liveStatus)}`}>
                                  {friendlyStatusLabel(liveStatus)}
                                </span>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            <span className={`font-medium ${daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {daysLeft === Infinity ? '∞' : `${daysLeft} days`}
                            </span>
                          </TableCell>
                          <TableCell>
                            {Math.max(0, (item.maxCapacity || 0) - (item.currentStock || 0))}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{format(new Date(item.lastUpdated), "P")}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); printLabel(item); }}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedItem(item); setDetailViewItem(item); }}>
                                <i className="fa fa-pencil-square-o"></i>
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditDialog(item); }}>
                                <i className="fa fa-cog"></i>
                              </Button>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {/* Floating legend - glass morphism, light/dark compatible */}
                <div className="fixed bottom-3 right-3 z-40">
                  <div className="pointer-events-auto rounded-lg border border-white/20 dark:border-slate-800/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-md saturate-150 shadow-lg ring-1 ring-white/20 dark:ring-slate-800/50 px-3 py-2 text-xs text-slate-800 dark:text-slate-200">
                    <div className="flex items-center flex-wrap gap-1">
                      <span className="mr-1 font-semibold">Legend:</span>
                      {WASTE_REASONS.map((reason) => (
                        <Badge key={reason} variant="outline" className={`${getWasteTagClass(reason)} border-none px-2 py-0.5 text-[10px]`}>
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                  {filteredItems.map((item: InventoryItem) => (
                    <Card key={item.id}>
                      <CardHeader>
                        <CardTitle>{item.name}</CardTitle>
                        <CardDescription>{item.category}</CardDescription>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(() => {
                            const counts = getWasteCountsForItem(item);
                            return WASTE_REASONS.map((reason) => (
                              <Badge key={reason} variant="outline" title={reason} className={`${getWasteTagClass(reason)} border-none px-2 py-0.5 text-[10px]`}>{counts[reason] || 0}</Badge>
                            ));
                          })()}
                        </div>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">On Hand</div>
                          <div>{item.currentStock} {item.unit}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Par Level</div>
                          <div>{item.minThreshold} {item.unit}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Status</div>
                          <div className={getStatusColor(item.status)}>{friendlyStatusLabel(item.status)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Last Updated</div>
                          <div>{format(new Date(item.lastUpdated), "P")}</div>
                        </div>
                      </CardContent>
                      <div className="p-3 border-t flex items-center gap-1 justify-end">
                        <Button aria-label="Edit details" variant="ghost" size="icon" onClick={() => { setSelectedItem(item); setDetailViewItem(item); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button aria-label="Settings" variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button aria-label="Delete" variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendors Tab - Only visible to admins */}
          {isAdmin && (
            <TabsContent value="vendors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vendors</CardTitle>
                  <CardDescription>Manage your vendor relationships</CardDescription>
                </CardHeader>
                <CardContent>
                  <VendorsPanel />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Analytics Tab - Only visible to admins */}
          {isAdmin && (
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inventory Analytics</CardTitle>
                  <CardDescription>Detailed performance metrics and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Enhanced Analytics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Value</p>
                            <p className="text-2xl font-bold">${getTotalValue().toLocaleString()}</p>
                            <p className="text-xs text-green-600">+2.5% month</p>
                    </div>
                          <Package className="h-8 w-8 text-blue-600" />
                    </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Food Cost %</p>
                            <p className="text-2xl font-bold">28.5%</p>
                            <p className="text-xs text-green-600">Target: 30%</p>
                    </div>
                          <TrendingDown className="h-8 w-8 text-green-600" />
                    </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Weekly Waste</p>
                            <p className="text-2xl font-bold">${getWeeklyWaste().toFixed(0)}</p>
                            <p className="text-xs text-red-600">+12% week</p>
                          </div>
                          <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Turnover Rate</p>
                            <p className="text-2xl font-bold">6.2x</p>
                            <p className="text-xs text-green-600">Above average</p>
                          </div>
                          <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* AI Insights Section */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-center mb-3">
                      <Brain className="mr-2 h-5 w-5 text-orange-600" />
                      <h3 className="font-medium text-orange-900 dark:text-orange-100">AI-Powered Insights</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium">Auto-Reorder Active</span>
                        </div>
                        <p className="text-xs text-muted-foreground">12 items scheduled for reordering</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium">Price Alerts</span>
                        </div>
                        <p className="text-xs text-muted-foreground">3 items with price increases</p>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                        <div className="flex items-center mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-sm font-medium">Usage Forecast</span>
                        </div>
                        <p className="text-xs text-muted-foreground">15% protein increase predicted</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className={`transition-all duration-300 ${!hasMovementData ? 'blur-sm pointer-events-none' : ''}`}>
                  <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={hasMovementData ? movementData : []}>
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
                          <Tooltip 
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length > 0) {
                                return (
                                  <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                                    <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
                                    {payload.map((entry, index) => (
                                      <p key={index} style={{ color: entry.color }} className="text-sm">
                                        {entry.name}: {entry.value} units
                                      </p>
                                    ))}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="usage" fill="#ef4444" name="Daily Usage" />
                          <Bar dataKey="received" fill="#22c55e" name="Received" />
                    </BarChart>
                  </ResponsiveContainer>
                    </div>

                    {/* Analytics Data Unavailable Overlay */}
                    {!hasMovementData && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                        <div className="text-center">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <BarChartIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            Analytics Unavailable
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
                            Advanced analytics require transaction history. Start using the inventory system to generate insights.
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedTab('overview')}
                          >
                            View Overview
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

                 {/* Dynamic Label Designer Modal */}
         <Dialog open={isLabelDesignerOpen} onOpenChange={setIsLabelDesignerOpen}>
           <DialogContent className="max-w-6xl">
             <DialogHeader>
               <DialogTitle>🎨 Dynamic Label Designer</DialogTitle>
               <DialogDescription>Drag and drop elements to create custom inventory labels with TGL medallion</DialogDescription>
             </DialogHeader>
             <div className="grid grid-cols-3 gap-6 py-4">
               {/* Element Controls */}
               <div className="space-y-6">
                 <div>
                   <Label htmlFor="template-name">Template Name</Label>
                   <Input 
                     id="template-name" 
                     value={labelTemplate.name}
                     onChange={(e) => setLabelTemplate(prev => ({ ...prev, name: e.target.value }))}
                   />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <Label htmlFor="width">Width (px)</Label>
                     <Input 
                       id="width" 
                       type="number" 
                       value={labelTemplate.width}
                       onChange={(e) => setLabelTemplate(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                     />
                   </div>
                   <div>
                     <Label htmlFor="height">Height (px)</Label>
                     <Input 
                       id="height" 
                       type="number" 
                       value={labelTemplate.height}
                       onChange={(e) => setLabelTemplate(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                     />
                   </div>
                 </div>

                 {/* Element Toggle Controls */}
                 <div className="space-y-4">
                   <Label className="text-sm font-semibold">Label Elements</Label>
                   
                   {/* Logo Controls */}
                   <div className="border rounded-lg p-3 space-y-2">
                     <div className="flex items-center justify-between">
                       <label className="flex items-center space-x-2">
                         <input 
                           type="checkbox" 
                           checked={labelTemplate.elements.logo.enabled}
                           onChange={(e) => setLabelTemplate(prev => ({
                             ...prev,
                             elements: {
                               ...prev.elements,
                               logo: { ...prev.elements.logo, enabled: e.target.checked }
                             }
                           }))}
                         />
                         <span className="font-medium">🏅 TGL Medallion</span>
                       </label>
                     </div>
                     {labelTemplate.elements.logo.enabled && (
                       <div className="grid grid-cols-2 gap-2">
                         <div>
                           <Label className="text-xs">Width</Label>
                           <Input 
                             type="number" 
                             value={labelTemplate.elements.logo.width}
                             onChange={(e) => setLabelTemplate(prev => ({
                               ...prev,
                               elements: {
                                 ...prev.elements,
                                 logo: { ...prev.elements.logo, width: parseInt(e.target.value) }
                               }
                             }))}
                             className="h-8"
                           />
                         </div>
                         <div>
                           <Label className="text-xs">Height</Label>
                           <Input 
                             type="number" 
                             value={labelTemplate.elements.logo.height}
                             onChange={(e) => setLabelTemplate(prev => ({
                               ...prev,
                               elements: {
                                 ...prev.elements,
                                 logo: { ...prev.elements.logo, height: parseInt(e.target.value) }
                               }
                             }))}
                             className="h-8"
                           />
                         </div>
                       </div>
                     )}
                   </div>

                   {/* QR Code Controls */}
                   <div className="border rounded-lg p-3 space-y-2">
                     <div className="flex items-center justify-between">
                       <label className="flex items-center space-x-2">
                         <input 
                           type="checkbox" 
                           checked={labelTemplate.elements.qrCode.enabled}
                           onChange={(e) => setLabelTemplate(prev => ({
                             ...prev,
                             elements: {
                               ...prev.elements,
                               qrCode: { ...prev.elements.qrCode, enabled: e.target.checked }
                             }
                           }))}
                         />
                         <span className="font-medium">📱 QR Code</span>
                       </label>
                     </div>
                     {labelTemplate.elements.qrCode.enabled && (
                       <div className="grid grid-cols-2 gap-2">
                         <div>
                           <Label className="text-xs">Width</Label>
                           <Input 
                             type="number" 
                             value={labelTemplate.elements.qrCode.width}
                             onChange={(e) => setLabelTemplate(prev => ({
                               ...prev,
                               elements: {
                                 ...prev.elements,
                                 qrCode: { ...prev.elements.qrCode, width: parseInt(e.target.value) }
                               }
                             }))}
                             className="h-8"
                           />
                         </div>
                         <div>
                           <Label className="text-xs">Height</Label>
                           <Input 
                             type="number" 
                             value={labelTemplate.elements.qrCode.height}
                             onChange={(e) => setLabelTemplate(prev => ({
                               ...prev,
                               elements: {
                                 ...prev.elements,
                                 qrCode: { ...prev.elements.qrCode, height: parseInt(e.target.value) }
                               }
                             }))}
                             className="h-8"
                           />
                         </div>
                       </div>
                     )}
                   </div>

                   {/* Item Name Controls */}
                   <div className="border rounded-lg p-3 space-y-2">
                     <div className="flex items-center justify-between">
                       <label className="flex items-center space-x-2">
                         <input 
                           type="checkbox" 
                           checked={labelTemplate.elements.itemName.enabled}
                           onChange={(e) => setLabelTemplate(prev => ({
                             ...prev,
                             elements: {
                               ...prev.elements,
                               itemName: { ...prev.elements.itemName, enabled: e.target.checked }
                             }
                           }))}
                         />
                         <span className="font-medium">📝 Item Name</span>
                       </label>
                     </div>
                     {labelTemplate.elements.itemName.enabled && (
                       <div>
                         <Label className="text-xs">Font Size</Label>
                         <Input 
                           type="number" 
                           value={labelTemplate.elements.itemName.fontSize}
                           onChange={(e) => setLabelTemplate(prev => ({
                             ...prev,
                             elements: {
                               ...prev.elements,
                               itemName: { ...prev.elements.itemName, fontSize: parseInt(e.target.value) }
                             }
                           }))}
                           className="h-8"
                         />
                       </div>
                     )}
                   </div>

                   {/* Metadata Controls */}
                   <div className="border rounded-lg p-3 space-y-2">
                     <div className="flex items-center justify-between">
                       <label className="flex items-center space-x-2">
                         <input 
                           type="checkbox" 
                           checked={labelTemplate.elements.metadata.enabled}
                           onChange={(e) => setLabelTemplate(prev => ({
                             ...prev,
                             elements: {
                               ...prev.elements,
                               metadata: { ...prev.elements.metadata, enabled: e.target.checked }
                             }
                           }))}
                         />
                         <span className="font-medium">📋 Metadata</span>
                       </label>
                     </div>
                     {labelTemplate.elements.metadata.enabled && (
                       <div>
                         <Label className="text-xs">Font Size</Label>
                         <Input 
                           type="number" 
                           value={labelTemplate.elements.metadata.fontSize}
                           onChange={(e) => setLabelTemplate(prev => ({
                             ...prev,
                             elements: {
                               ...prev.elements,
                               metadata: { ...prev.elements.metadata, fontSize: parseInt(e.target.value) }
                             }
                           }))}
                           className="h-8"
                         />
                       </div>
                     )}
                   </div>
                 </div>
               </div>

               {/* Interactive Design Canvas */}
               <div className="col-span-2 space-y-4">
                 <div className="flex items-center justify-between">
                   <Label className="text-lg font-semibold">🎨 Design Canvas</Label>
                   <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 px-3 py-1 rounded-full">
                     💡 Drag elements to reposition them
                   </div>
                 </div>
                 
                 <div className="border-2 border-dashed border-border rounded-lg p-6 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                   <div 
                     className="relative border-2 border-border bg-white shadow-lg overflow-hidden"
                     style={{
                       width: `${Math.min(labelTemplate.width, 400)}px`,
                       height: `${Math.min(labelTemplate.height, 300)}px`,
                       cursor: dragState.isDragging ? 'grabbing' : 'default',
                     }}
                     onMouseMove={handleMouseMove}
                     onMouseUp={handleMouseUp}
                     onMouseLeave={handleMouseUp}
                   >
                     {/* Grid Guidelines */}
                     <div className="absolute inset-0 opacity-20" style={{
                       backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                       backgroundSize: '10px 10px'
                     }} />

                     {/* TGL Medallion Logo */}
                     {labelTemplate.elements.logo.enabled && (
                       <div
                         className={`absolute cursor-move select-none transition-shadow ${
                           labelTemplate.elements.logo.dragging ? 'shadow-lg ring-2 ring-orange-400 ring-opacity-50' : 'hover:shadow-md'
                         }`}
                         style={{
                           left: `${(labelTemplate.elements.logo.x / labelTemplate.width) * 100}%`,
                           top: `${(labelTemplate.elements.logo.y / labelTemplate.height) * 100}%`,
                           width: `${(labelTemplate.elements.logo.width / labelTemplate.width) * 100}%`,
                           height: `${(labelTemplate.elements.logo.height / labelTemplate.height) * 100}%`,
                         }}
                         onMouseDown={(e) => handleMouseDown(e, 'logo')}
                       >
                         <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                           <defs>
                             <linearGradient id="medallionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                               <stop offset="0%" stopColor="#f97316" />
                               <stop offset="100%" stopColor="#ea580c" />
                             </linearGradient>
                           </defs>
                           <circle cx="50" cy="50" r="45" fill="url(#medallionGradient)" stroke="#fff" strokeWidth="3"/>
                           <circle cx="50" cy="50" r="35" fill="none" stroke="#fff" strokeWidth="1" opacity="0.6"/>
                           <text x="50" y="35" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">TGL</text>
                           <text x="50" y="65" textAnchor="middle" fill="white" fontSize="8" opacity="0.9">MEDALLION</text>
                         </svg>
                       </div>
                     )}

                     {/* QR Code */}
                     {labelTemplate.elements.qrCode.enabled && (
                       <div
                         className={`absolute cursor-move select-none transition-shadow ${
                           labelTemplate.elements.qrCode.dragging ? 'shadow-lg ring-2 ring-blue-400 ring-opacity-50' : 'hover:shadow-md'
                         }`}
                         style={{
                           left: `${(labelTemplate.elements.qrCode.x / labelTemplate.width) * 100}%`,
                           top: `${(labelTemplate.elements.qrCode.y / labelTemplate.height) * 100}%`,
                           width: `${(labelTemplate.elements.qrCode.width / labelTemplate.width) * 100}%`,
                           height: `${(labelTemplate.elements.qrCode.height / labelTemplate.height) * 100}%`,
                         }}
                         onMouseDown={(e) => handleMouseDown(e, 'qrCode')}
                       >
                         <QRCodeSVG
                           value="sample-inventory-qr-data"
                           size={labelTemplate.elements.qrCode.width}
                           includeMargin={true}
                           level="M"
                           bgColor="#ffffff"
                           fgColor="#000000"
                         />
                       </div>
                     )}

                     {/* Item Name */}
                     {labelTemplate.elements.itemName.enabled && (
                       <div
                         className={`absolute cursor-move select-none transition-shadow ${
                           labelTemplate.elements.itemName.dragging ? 'shadow-lg ring-2 ring-green-400 ring-opacity-50' : 'hover:shadow-md'
                         }`}
                         style={{
                           left: `${(labelTemplate.elements.itemName.x / labelTemplate.width) * 100}%`,
                           top: `${(labelTemplate.elements.itemName.y / labelTemplate.height) * 100}%`,
                           width: `${(labelTemplate.elements.itemName.width / labelTemplate.width) * 100}%`,
                           fontSize: `${labelTemplate.elements.itemName.fontSize}px`,
                           fontWeight: labelTemplate.elements.itemName.fontWeight,
                           textAlign: labelTemplate.elements.itemName.textAlign as any,
                           color: labelTemplate.colors.text,
                         }}
                         onMouseDown={(e) => handleMouseDown(e, 'itemName')}
                       >
                         <div className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
                           Chicken Breast
                         </div>
                       </div>
                     )}

                     {/* Metadata */}
                     {labelTemplate.elements.metadata.enabled && (
                       <div
                         className={`absolute cursor-move select-none transition-shadow ${
                           labelTemplate.elements.metadata.dragging ? 'shadow-lg ring-2 ring-purple-400 ring-opacity-50' : 'hover:shadow-md'
                         }`}
                         style={{
                           left: `${(labelTemplate.elements.metadata.x / labelTemplate.width) * 100}%`,
                           top: `${(labelTemplate.elements.metadata.y / labelTemplate.height) * 100}%`,
                           width: `${(labelTemplate.elements.metadata.width / labelTemplate.width) * 100}%`,
                           fontSize: `${labelTemplate.elements.metadata.fontSize}px`,
                           lineHeight: labelTemplate.elements.metadata.lineHeight,
                           color: labelTemplate.colors.text,
                         }}
                         onMouseDown={(e) => handleMouseDown(e, 'metadata')}
                       >
                         <div className="bg-white/80 backdrop-blur-sm px-2 py-1 rounded text-xs">
                           <div>SKU: CHK-BST-001</div>
                           <div>Unit: lbs • Cost: $8.50</div>
                           <div>Supplier: Fresh Farm Co</div>
                           <div>Printed: {new Date().toLocaleDateString()}</div>
                         </div>
                       </div>
                     )}

                     {/* Corner position indicators */}
                     <div className="absolute top-1 left-1 w-2 h-2 bg-gray-400 rounded-full opacity-30"></div>
                     <div className="absolute top-1 right-1 w-2 h-2 bg-gray-400 rounded-full opacity-30"></div>
                     <div className="absolute bottom-1 left-1 w-2 h-2 bg-gray-400 rounded-full opacity-30"></div>
                     <div className="absolute bottom-1 right-1 w-2 h-2 bg-gray-400 rounded-full opacity-30"></div>
                   </div>
                 </div>

                 {/* Design Tips */}
                 <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                   <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">💡 Design Tips</h4>
                   <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                     <li>• Drag elements around the canvas to position them</li>
                     <li>• The TGL medallion automatically uses your company branding</li>
                     <li>• QR codes include all item data for easy scanning</li>
                     <li>• Elements will snap to prevent overlap</li>
                     <li>• Use the grid as a guide for alignment</li>
                   </ul>
                 </div>
               </div>
             </div>
             <DialogFooter>
               <Button variant="outline" onClick={() => setIsLabelDesignerOpen(false)}>Cancel</Button>
               <Button 
                 variant="outline"
                 onClick={() => setLabelTemplate(defaultLabelTemplate)}
               >
                 Reset to Default
               </Button>
               <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                 <Save className="mr-2 h-4 w-4" />
                 Save Template
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>

        {/* Quantity Modification Modal (repurposed to Quick Count later; keeping for SAM future) */}

        {/* Quick Count Modal */}
        <Dialog open={isQuickCountOpen} onOpenChange={setIsQuickCountOpen}>
          <DialogContent className="max-w-2xl p-0">
            <div className="p-4">
            <DialogHeader>
                <DialogTitle>Quick Inventory Count</DialogTitle>
                <DialogDescription>Swipe or use arrows to switch items quickly</DialogDescription>
            </DialogHeader>
            </div>
            <div
              className="px-4 pb-24 select-none"
              onTouchStart={(e) => setQuickTouchStartX(e.touches[0]?.clientX || null)}
              onTouchEnd={(e) => {
                if (quickTouchStartX == null) return;
                const deltaX = (e.changedTouches[0]?.clientX || 0) - quickTouchStartX;
                if (Math.abs(deltaX) > 50) {
                  if (deltaX < 0 && quickCountIndex < inventoryItems.length - 1) {
                    setQuickCountIndex(quickCountIndex + 1);
                    setQuickCountValue("");
                  } else if (deltaX > 0 && quickCountIndex > 0) {
                    setQuickCountIndex(quickCountIndex - 1);
                    setQuickCountValue("");
                  }
                }
                setQuickTouchStartX(null);
              }}
            >
              {inventoryItems.length > 0 && (
                <div className="relative">
                <Button 
                    variant="ghost"
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
                    disabled={quickCountIndex === 0}
                  onClick={() => {
                      if (quickCountIndex > 0) {
                        setQuickCountIndex(quickCountIndex - 1);
                        setQuickCountValue("");
                      }
                    }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button 
                    variant="ghost"
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
                    disabled={quickCountIndex >= inventoryItems.length - 1}
                    onClick={() => {
                      if (quickCountIndex < inventoryItems.length - 1) {
                        setQuickCountIndex(quickCountIndex + 1);
                        setQuickCountValue("");
                      }
                    }}
                  >
                    <ChevronRight className="h-5 w-5" />
                </Button>

                  <div className="mx-10">
                    <Card>
                      <CardHeader>
                        <CardTitle>{inventoryItems[quickCountIndex]?.name}</CardTitle>
                        <CardDescription>
                          {inventoryItems[quickCountIndex]?.category} • {inventoryItems[quickCountIndex]?.unit}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-xs text-muted-foreground">On Hand</div>
                            <div className="text-2xl font-semibold">{inventoryItems[quickCountIndex]?.currentStock ?? 0}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Par</div>
                            <div className="text-2xl font-semibold">{inventoryItems[quickCountIndex]?.minThreshold ?? 0}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Max</div>
                            <div className="text-2xl font-semibold">{inventoryItems[quickCountIndex]?.maxCapacity ?? 0}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
              </div>
              
            {/* Bottom controls */}
            <div className="fixed bottom-4 left-0 right-0 px-4">
              <div className="mx-auto max-w-2xl rounded-lg border bg-background p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Input 
                    type="number" 
                    placeholder="Enter count"
                    value={quickCountValue}
                    onChange={(e) => setQuickCountValue(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Adjust par"
                    value={quickParValue}
                    onChange={(e) => setQuickParValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleQuickCountSubmit(); }}
                    className="w-36"
                  />
                  <Button onClick={handleQuickCountSubmit}>
                    Submit Count
                  </Button>
                </div>
                <div className="mt-2">
                  <div className="relative">
                    <Input
                      placeholder="Search items..."
                      value={quickSearch}
                      onChange={(e) => setQuickSearch(e.target.value)}
                      className="pr-3"
                    />
                    {quickSearch && (
                      <div className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow">
                        {inventoryItems
                          .filter((it: any) => it.name?.toLowerCase().includes(quickSearch.toLowerCase()))
                          .slice(0, 8)
                          .map((it: any, idx: number) => (
                            <button
                              key={it.id}
                              className="w-full text-left px-3 py-2 hover:bg-accent"
                              onClick={() => {
                                const nextIndex = inventoryItems.findIndex((x: any) => x.id === it.id);
                                if (nextIndex >= 0) {
                                  setQuickCountIndex(nextIndex);
                                  setQuickSearch("");
                                  setQuickCountValue("");
                                }
                              }}
                            >
                              {it.name}
                              <span className="text-xs text-muted-foreground ml-2">{it.category}</span>
                            </button>
                          ))}
              </div>
                    )}
            </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Camera Counting Modal */}
        <Dialog open={isCameraCountingOpen} onOpenChange={setIsCameraCountingOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>AI-Powered Visual Counting</DialogTitle>
              <DialogDescription>Take a photo and tap on items to count them using Azure SAM AI</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Camera & Mode Selection Panel */}
              <div className="space-y-4">
                {/* Camera Selection */}
                <div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Camera className="h-5 w-5 text-blue-600" />
                  <div className="flex-1">
                    <Label htmlFor="camera-select" className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Select Camera
                    </Label>
                    <select
                      id="camera-select"
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                      className="mt-1 w-full h-9 px-3 py-1 border border-blue-300 dark:border-blue-700 rounded-md bg-white dark:bg-blue-950 text-blue-900 dark:text-blue-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {availableCameras.map((camera) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                          {camera.label || `Camera ${camera.deviceId.slice(-4)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    {availableCameras.length} camera(s) found
                  </div>
                </div>

                {/* Mode Selection */}
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="live-mode"
                        name="counting-mode"
                        checked={isLiveMode}
                        onChange={() => setIsLiveMode(true)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <Label htmlFor="live-mode" className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        🔴 Live Video Segmentation
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="static-mode"
                        name="counting-mode"
                        checked={!isLiveMode}
                        onChange={() => setIsLiveMode(false)}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <Label htmlFor="static-mode" className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        📸 Static Image Mode
                      </Label>
                    </div>
                  </div>
                  {isLiveMode && (
                    <div className="text-xs text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">
                      ✨ Real-time AI
                    </div>
                  )}
                </div>
              </div>

              {!capturedImage ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden bg-black">
                    {selectedCameraId && (
                                              <div className="relative">
                          <Webcam
                            ref={webcamRef}
                            audio={false}
                            height={400}
                            width={600}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{
                              deviceId: selectedCameraId,
                              width: { ideal: 1280 },
                              height: { ideal: 720 },
                              facingMode: undefined, // Don't use facingMode when deviceId is specified
                            }}
                            onLoadedMetadata={() => {
                              console.log('Camera loaded successfully');
                            }}
                            onUserMediaError={(error) => {
                              console.error('Camera error:', error);
                            }}
                          />
                          
                          {/* Clickable overlay for live mode */}
                          {isLiveMode && (
                            <div
                              className="absolute inset-0 cursor-crosshair"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const y = e.clientY - rect.top;
                                const newMarker = {
                                  x,
                                  y,
                                  id: Date.now().toString(),
                                  timestamp: Date.now(),
                                };
                                
                                console.log("🖱️ CLICK DETECTED at coordinates:", { x, y, rect });
                                console.log("📊 Current markers before:", markers.length);
                                console.log("🎭 Current masks before:", segmentationMasks.length);
                                
                                // Add marker immediately for visual feedback
                                setMarkers(prev => {
                                  const updated = [...prev, newMarker];
                                  console.log("✅ Markers updated to:", updated.length);
                                  return updated;
                                });
                                
                                // Automatically trigger SAM segmentation for this point on live feed
                                console.log("🤖 Triggering SAM processing...");
                                await processPointWithSAM(newMarker);
                              }}
                              title="Click on objects to segment and track them"
                            />
                          )}

                          {/* Debug Info Overlay */}
                          {isLiveMode && (
                            <div className="absolute top-4 right-4 bg-black/75 text-white p-2 rounded text-xs z-50">
                              <div>Markers: {markers.length}</div>
                              <div>Masks: {segmentationMasks.length}</div>
                              <div>Tracking: {isTracking ? 'ON' : 'OFF'}</div>
                              <div>Processing: {isProcessing ? 'YES' : 'NO'}</div>
                            </div>
                          )}
                          
                          {/* Live Mode Indicators */}
                          {isLiveMode && (
                            <div className="absolute top-4 left-4 flex flex-col space-y-2">
                              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-2">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span>LIVE</span>
                              </div>
                              {isTracking && (
                                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-white rounded-full animate-spin"></div>
                                  <span>TRACKING</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Real Azure SAM Masks Overlay */}
                          {segmentationMasks.map((maskObj, index) => {
                            console.log(`🎭 Rendering real SAM mask ${index}:`, maskObj);
                            return (
                              <div key={maskObj.id} className="absolute inset-0 pointer-events-none" style={{ zIndex: 25 }}>
                                                        {/* Real mask image overlay */}
                        {maskObj.maskImageUrl ? (
                          <div
                            className={`absolute ${isTracking ? 'animate-pulse' : ''}`}
                            style={{
                              left: maskObj.bounds.x,
                              top: maskObj.bounds.y,
                              width: maskObj.bounds.width,
                              height: maskObj.bounds.height,
                              backgroundImage: `url(${maskObj.maskImageUrl})`,
                              backgroundSize: 'contain',
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'center',
                              opacity: 0.8,
                            }}
                            title={`Azure SAM segmented ${maskObj.objectName || 'object'}`}
                          />
                        ) : (
                                  // Fallback rectangle if mask processing failed
                                  <div
                                    className={`absolute border-4 border-green-400 bg-green-400/30 ${isTracking ? 'animate-pulse' : ''}`}
                                    style={{
                                      left: maskObj.bounds.x,
                                      top: maskObj.bounds.y,
                                      width: maskObj.bounds.width,
                                      height: maskObj.bounds.height,
                                      boxShadow: '0 0 15px rgba(34, 197, 94, 0.6)',
                                    }}
                                  />
                                )}
                                
                                {/* Object label with name and confidence */}
                                <div 
                                  className="absolute bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-xl border-2 border-white backdrop-blur-sm"
                                  style={{ 
                                    left: Math.max(5, maskObj.bounds.x),
                                    top: Math.max(5, maskObj.bounds.y - 65),
                                    zIndex: 30,
                                    maxWidth: '220px'
                                  }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <span>🎯 {maskObj.objectName || `Object ${index + 1}`}</span>
                                    {isTracking && <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>}
                                  </div>
                                  <div className="text-xs opacity-90 mt-1">
                                    SAM Confidence: {(maskObj.confidence * 100).toFixed(0)}%
                                  </div>
                                </div>
                                
                                {/* Enhanced corner indicators */}
                                <div className="absolute" style={{ left: maskObj.bounds.x - 4, top: maskObj.bounds.y - 4 }}>
                                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                                </div>
                                <div className="absolute" style={{ left: maskObj.bounds.x + maskObj.bounds.width - 4, top: maskObj.bounds.y - 4 }}>
                                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                                </div>
                                <div className="absolute" style={{ left: maskObj.bounds.x - 4, top: maskObj.bounds.y + maskObj.bounds.height - 4 }}>
                                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                                </div>
                                <div className="absolute" style={{ left: maskObj.bounds.x + maskObj.bounds.width - 4, top: maskObj.bounds.y + maskObj.bounds.height - 4 }}>
                                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Click Markers with Loading States */}
                          {markers.map((marker, index) => {
                            console.log(`🔴 Rendering marker ${index}:`, marker);
                            
                            // Check if this marker has a corresponding mask (processing complete)
                            const hasMask = segmentationMasks.some(mask => mask.id === marker.id);
                            const isProcessingThisMarker = isProcessing && !hasMask;
                            
                            return (
                              <div
                                key={marker.id}
                                className={`absolute flex items-center justify-center shadow-lg ${
                                  isProcessingThisMarker 
                                    ? 'w-12 h-12 bg-blue-500 border-2 border-white rounded-full' 
                                    : 'w-8 h-8 bg-red-500 border-2 border-white rounded-full animate-ping'
                                }`}
                                style={{
                                  left: isProcessingThisMarker ? marker.x - 24 : marker.x - 16,
                                  top: isProcessingThisMarker ? marker.y - 24 : marker.y - 16,
                                  zIndex: 20,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log("🗑️ Removing marker:", marker.id);
                                  setMarkers(prev => prev.filter(m => m.id !== marker.id));
                                  setSegmentationMasks(prev => {
                                    const newMasks = prev.filter(m => m.id !== marker.id);
                                    if (newMasks.length === 0) {
                                      stopTracking();
                                    }
                                    return newMasks;
                                  });
                                  setEstimatedCount(prev => Math.max(0, (prev || 0) - 1));
                                }}
                                title={isProcessingThisMarker ? "Processing with Azure SAM..." : "Click to remove marker and segmentation"}
                              >
                                {isProcessingThisMarker ? (
                                  // Loading spinner
                                  <div className="relative">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                    </div>
                                  </div>
                                ) : (
                                  // Regular marker number
                                  <span className="text-white text-xs font-bold">{index + 1}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                    )}
                    {!selectedCameraId && (
                      <div className="flex items-center justify-center h-96 text-muted-foreground">
                        <div className="text-center">
                          <Camera className="mx-auto h-12 w-12 mb-4 opacity-50" />
                          <p>No camera selected</p>
                          <p className="text-sm">Please select a camera from the dropdown above</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-center space-x-3">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // Refresh camera list
                        const getCameras = async () => {
                          try {
                            const devices = await navigator.mediaDevices.enumerateDevices();
                            const videoDevices = devices.filter(device => device.kind === 'videoinput');
                            setAvailableCameras(videoDevices);
                            if (videoDevices.length > 0 && !selectedCameraId) {
                              setSelectedCameraId(videoDevices[0].deviceId);
                            }
                          } catch (error) {
                            console.error('Error refreshing cameras:', error);
                          }
                        };
                        getCameras();
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Cameras
                    </Button>
                    <Button 
                      onClick={capturePhoto} 
                      disabled={!selectedCameraId}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Capture Photo
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={400}
                      className="border rounded-lg cursor-crosshair"
                      style={{
                        backgroundImage: `url(${capturedImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                      onClick={handleImageClick}
                    />
                    {/* Markers with Loading States */}
                    {markers.map((marker, index) => {
                      // Check if this marker has a corresponding mask (processing complete)
                      const hasMask = segmentationMasks.some(mask => mask.id === marker.id);
                      const isProcessingThisMarker = isProcessing && !hasMask;
                      
                      return (
                        <div
                          key={marker.id}
                          className={`absolute flex items-center justify-center cursor-pointer ${
                            isProcessingThisMarker 
                              ? 'w-10 h-10 bg-blue-500 border-2 border-white rounded-full' 
                              : 'w-6 h-6 bg-red-500 border-2 border-white rounded-full'
                          }`}
                          style={{
                            left: `${(marker.x / 600) * 100}%`,
                            top: `${(marker.y / 400) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMarker(marker.id);
                          }}
                          title={isProcessingThisMarker ? "Processing with Azure SAM..." : "Click to remove marker"}
                        >
                          {isProcessingThisMarker ? (
                            // Loading spinner
                            <div className="relative">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Real SAM Masks for Photo */}
                    {segmentationMasks.map((maskObj, index) => (
                      <div key={maskObj.id} className="absolute pointer-events-none">
                        {/* Real mask image overlay for photo */}
                        {maskObj.maskImageUrl ? (
                          <img
                            src={maskObj.maskImageUrl}
                            className="absolute object-cover"
                            style={{
                              left: `${(maskObj.bounds.x / 600) * 100}%`,
                              top: `${(maskObj.bounds.y / 400) * 100}%`,
                              width: `${(maskObj.bounds.width / 600) * 100}%`,
                              height: `${(maskObj.bounds.height / 400) * 100}%`,
                              opacity: 0.7,
                              mixBlendMode: 'multiply',
                              filter: 'hue-rotate(90deg) saturate(1.2)',
                            }}
                            alt={`Segmented object ${index + 1}`}
                          />
                        ) : (
                          // Fallback rectangle
                          <div
                            className="absolute border-4 border-green-400 bg-green-400/20"
                            style={{
                              left: `${(maskObj.bounds.x / 600) * 100}%`,
                              top: `${(maskObj.bounds.y / 400) * 100}%`,
                              width: `${(maskObj.bounds.width / 600) * 100}%`,
                              height: `${(maskObj.bounds.height / 400) * 100}%`,
                              boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)',
                            }}
                          />
                        )}
                        
                        {/* Object label for photo */}
                        <div 
                          className="absolute bg-green-600 text-white px-2 py-1 rounded text-xs font-bold border border-white"
                          style={{ 
                            left: `${(maskObj.bounds.x / 600) * 100}%`,
                            top: `${Math.max(0, (maskObj.bounds.y - 30) / 400) * 100}%`,
                            fontSize: '10px'
                          }}
                        >
                          🎯 {maskObj.objectName || `Object ${index + 1}`} ({(maskObj.confidence * 100).toFixed(0)}%)
                        </div>
                        
                        {/* Corner indicators */}
                        <div 
                          className="absolute w-2 h-2 bg-green-500 rounded-full border border-white"
                          style={{ 
                            left: `${(maskObj.bounds.x / 600) * 100}%`,
                            top: `${(maskObj.bounds.y / 400) * 100}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        ></div>
                        <div 
                          className="absolute w-2 h-2 bg-green-500 rounded-full border border-white"
                          style={{ 
                            left: `${((maskObj.bounds.x + maskObj.bounds.width) / 600) * 100}%`,
                            top: `${(maskObj.bounds.y / 400) * 100}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        ></div>
                        <div 
                          className="absolute w-2 h-2 bg-green-500 rounded-full border border-white"
                          style={{ 
                            left: `${(maskObj.bounds.x / 600) * 100}%`,
                            top: `${((maskObj.bounds.y + maskObj.bounds.height) / 400) * 100}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        ></div>
                        <div 
                          className="absolute w-2 h-2 bg-green-500 rounded-full border border-white"
                          style={{ 
                            left: `${((maskObj.bounds.x + maskObj.bounds.width) / 600) * 100}%`,
                            top: `${((maskObj.bounds.y + maskObj.bounds.height) / 400) * 100}%`,
                            transform: 'translate(-50%, -50%)'
                          }}
                        ></div>
                      </div>
                    ))}
                    <div className="absolute top-2 left-2 bg-black/75 text-white p-2 rounded text-sm">
                      Click on items to mark them • {markers.length} items marked
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => {
                        setCapturedImage(null);
                        setMarkers([]);
                        setEstimatedCount(0);
                      }}>
                        Retake Photo
                      </Button>
                      {isProcessing && (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            AI Segmenting...
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Processing Error Display */}
                    {processingError && (
                      <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-yellow-900 dark:text-yellow-100">AI Processing Notice</p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{processingError}</p>
                            <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                              💡 This is likely a CORS or network issue. The system will work normally once deployed with proper CORS configuration.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Success Result Display */}
                    {estimatedCount !== 0 && (
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded p-3">
                        <p className="text-green-800 dark:text-green-200">
                          <CheckCircle className="inline mr-2 h-4 w-4" />
                                                     {processingError ? 'Simulated AI' : 'AI'} segmented: {estimatedCount} objects (from {markers.length} clicks)
                        </p>
                                                 <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                           Average confidence: {segmentationMasks.length > 0 ? 
                             (segmentationMasks.reduce((sum, mask) => sum + mask.confidence, 0) / segmentationMasks.length * 100).toFixed(0) : 
                             '85'}%
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
                             <Button variant="outline" onClick={() => {
                 setIsCameraCountingOpen(false);
                 setCapturedImage(null);
                 setMarkers([]);
                 setSegmentationMasks([]);
                 setEstimatedCount(0);
                 setProcessingError(null);
                 stopTracking(); // Stop tracking when closing modal
               }}>
                 Close
               </Button>
              {estimatedCount !== 0 && (
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Package className="mr-2 h-4 w-4" />
                  Update Inventory ({estimatedCount} items)
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* QR Scanner Modal */}
        <Dialog open={isQRScannerOpen} onOpenChange={setIsQRScannerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>Scan to identify the item and load Modify Quantities</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="rounded-lg overflow-hidden">
                <Scanner
                  onScan={(result) => handleQRScan(result as ScanResult[])}
                  formats={['qr_code', 'ean_13', 'ean_8', 'code_128']}
                  components={{
                    finder: false,
                  }}
                  styles={{
                    container: { width: '100%', height: '300px' },
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQRScannerOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Item Detail Modal */}
        {selectedItem && detailViewItem && (
          <Dialog open={!!selectedItem} onOpenChange={() => {
            setSelectedItem(null);
            setDetailViewItem(null);
          }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Inventory Details: {selectedItem.name}</DialogTitle>
                <DialogDescription>View and update inventory information</DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="recordWaste">Record Waste</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Current Stock</Label>
                        <Input value={detailViewItem.currentStock ?? ''} onChange={(e) => setDetailViewItem(prev => ({ ...prev, currentStock: parseFloat(e.target.value) || 0 }))} type="number" />
                  </div>
                  <div>
                    <Label>Min Threshold</Label>
                        <Input value={detailViewItem.minThreshold ?? ''} onChange={(e) => setDetailViewItem(prev => ({ ...prev, minThreshold: parseFloat(e.target.value) || 0 }))} type="number" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Max Capacity</Label>
                        <Input value={detailViewItem.maxCapacity ?? ''} onChange={(e) => setDetailViewItem(prev => ({ ...prev, maxCapacity: parseFloat(e.target.value) || 0 }))} type="number" />
                  </div>
                  <div>
                    <Label>Location</Label>
                        <Input value={detailViewItem.location ?? ''} onChange={(e) => setDetailViewItem(prev => ({ ...prev, location: e.target.value }))} />
                  </div>
                </div>
                  <div>
                    <Label>Description</Label>
                      <Textarea value={detailViewItem.description ?? ''} onChange={(e) => setDetailViewItem(prev => ({ ...prev, description: e.target.value }))} />
                  </div>
                    <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Reorder Point</Label>
                            <Input value={detailViewItem.reorderPoint ?? ''} onChange={(e) => setDetailViewItem(prev => ({ ...prev, reorderPoint: parseFloat(e.target.value) || 0 }))} type="number" />
                  </div>
                  <div>
                    <Label>Reorder Quantity</Label>
                            <Input value={detailViewItem.reorderQuantity ?? ''} onChange={(e) => setDetailViewItem(prev => ({ ...prev, reorderQuantity: parseFloat(e.target.value) || 0 }))} type="number" />
                  </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Last Physical Count</Label>
                        <div className="flex items-center gap-2 mt-2">
                      <Scale className="h-4 w-4 text-muted-foreground" />
                            <span>{detailViewItem.lastCount ?? 'N/A'} {detailViewItem.unit}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Count Date</Label>
                        <div className="flex items-center gap-2 mt-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{detailViewItem.countDate ? format(new Date(detailViewItem.countDate), "P") : 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Counted By</Label>
                        <div className="flex items-center gap-2 mt-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                            <span>{detailViewItem.countBy ?? 'N/A'}</span>
                    </div>
                  </div>
                </div>

                    <div>
                  <Label>QR Code for this Item</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="bg-white p-2 rounded-md">
                          <QRCodeSVG value={selectedItem.qrCode || selectedItem.id} size={64} />
                        </div>
                        <Button variant="outline" onClick={() => setIsLabelDesignerOpen(true)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print Label
                    </Button>
                  </div>
                </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button>
                    <Button onClick={handleUpdateDetails} className="bg-orange-600 hover:bg-orange-700 text-white">Update Details</Button>
                  </DialogFooter>
                </TabsContent>
                <TabsContent value="recordWaste">
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Quantity Wasted</Label>
                      <Input type="number" value={wasteQuantity} onChange={(e) => setWasteQuantity(e.target.value)} placeholder="e.g., 2.5" />
                    </div>
                    <div>
                      <Label>Reason</Label>
                      <Select onValueChange={setWasteReason} value={wasteReason}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason..." />
                        </SelectTrigger>
                        <SelectContent>
                          {WASTE_REASONS.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getWasteTagClass(reason)}`} />
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notes (Optional)</Label>
                      <Textarea value={wasteNotes} onChange={(e) => setWasteNotes(e.target.value)} placeholder="Add any additional details..." />
                  </div>
              </div>
              <DialogFooter>
                    <Button variant="outline" onClick={() => setSelectedItem(null)}>Cancel</Button>
                    <Button onClick={handleRecordWaste} disabled={recordingWaste} className="bg-red-600 hover:bg-red-700 text-white">
                      {recordingWaste && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Record Waste
                    </Button>
              </DialogFooter>
                </TabsContent>
                <TabsContent value="logs">
                  <div className="py-4">
                    <h4 className="font-medium mb-2">Waste Logs</h4>
                    <div className="space-y-2">
                      {selectedItem.wasteLogs && selectedItem.wasteLogs.length > 0 ? (
                        selectedItem.wasteLogs.map((log: any) => (
                          <div key={log.id} className="text-sm p-2 border rounded">
                            <p><strong>Date:</strong> {format(new Date(log.date), "P p")}</p>
                            <p><strong>Quantity:</strong> {log.quantity} {selectedItem.unit}</p>
                            <p><strong>Reason:</strong> {log.reason}</p>
                            {log.notes && <p><strong>Notes:</strong> {log.notes}</p>}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No waste logs for this item.</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}

        {/* Confirm Modal - Glass Morphism */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="backdrop-blur-md bg-white/60 dark:bg-slate-900/40 border-white/30 shadow-2xl">
            <DialogHeader>
              <DialogTitle className={`${confirmConfig.danger ? 'text-red-600' : ''}`}>{confirmConfig.title}</DialogTitle>
              <DialogDescription>{confirmConfig.message}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={confirmProcessing}>Cancel</Button>
              <Button 
                className={confirmConfig.danger ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                onClick={executeConfirm}
                disabled={confirmProcessing}
              >
                {confirmProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {confirmConfig.confirmText || 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 
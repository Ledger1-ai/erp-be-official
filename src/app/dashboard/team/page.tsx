"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useToastIntegration } from "@/lib/hooks/use-toast-integration";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Plus,
  Search,
  Filter,
  Star,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  UserPlus,
  Smartphone,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Sample data
const teamMembers = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Head Chef",
    department: "Kitchen",
    email: "sarah@thegraineledger.com",
    phone: "(555) 123-4567",
    avatar: "",
    status: "active",
    joinDate: "2023-01-15",
    lastLogin: "2025-01-22 14:30",
    performance: {
      rating: 4.9,
      completedShifts: 156,
      onTimeRate: 98,
      customerRating: 4.8,
      salesGenerated: 125000,
    },
    skills: ["Kitchen Management", "Inventory", "Training", "Menu Development"],
    availability: "Full-time",
    hourlyRate: 28.50,
    toastId: "TOAST_EMP_001",
  },
  {
    id: 2,
    name: "Mike Chen",
    role: "Sous Chef",
    department: "Kitchen",
    email: "mike@thegraineledger.com",
    phone: "(555) 234-5678",
    avatar: "",
    status: "active",
    joinDate: "2023-03-20",
    lastLogin: "2025-01-22 13:45",
    performance: {
      rating: 4.7,
      completedShifts: 142,
      onTimeRate: 95,
      customerRating: 4.6,
      salesGenerated: 95000,
    },
    skills: ["Food Prep", "Line Cooking", "Plating", "Inventory"],
    availability: "Full-time",
    hourlyRate: 22.00,
    toastId: "TOAST_EMP_002",
  },
  {
    id: 3,
    name: "Emma Davis",
    role: "Server",
    department: "Front of House",
    email: "emma@thegraineledger.com",
    phone: "(555) 345-6789",
    avatar: "",
    status: "active",
    joinDate: "2023-06-10",
    lastLogin: "2025-01-22 12:15",
    performance: {
      rating: 4.8,
      completedShifts: 128,
      onTimeRate: 97,
      customerRating: 4.9,
      salesGenerated: 78000,
    },
    skills: ["Customer Service", "POS Systems", "Wine Knowledge"],
    availability: "Part-time",
    hourlyRate: 18.50,
    toastId: "TOAST_EMP_003",
  },
  {
    id: 4,
    name: "Alex Rivera",
    role: "Bartender",
    department: "Bar",
    email: "alex@thegraineledger.com",
    phone: "(555) 456-7890",
    avatar: "",
    status: "active",
    joinDate: "2023-08-01",
    lastLogin: "2025-01-21 18:30",
    performance: {
      rating: 4.6,
      completedShifts: 118,
      onTimeRate: 93,
      customerRating: 4.7,
      salesGenerated: 65000,
    },
    skills: ["Mixology", "Customer Service", "Inventory", "Cash Handling"],
    availability: "Full-time",
    hourlyRate: 20.00,
    toastId: "TOAST_EMP_004",
  },
  {
    id: 5,
    name: "Jessica Wong",
    role: "Server",
    department: "Front of House",
    email: "jessica@thegraineledger.com",
    phone: "(555) 567-8901",
    avatar: "",
    status: "inactive",
    joinDate: "2023-11-15",
    lastLogin: "2025-01-18 16:45",
    performance: {
      rating: 4.5,
      completedShifts: 89,
      onTimeRate: 91,
      customerRating: 4.4,
      salesGenerated: 42000,
    },
    skills: ["Customer Service", "Table Management"],
    availability: "Part-time",
    hourlyRate: 17.50,
    toastId: "TOAST_EMP_005",
  },
];

const departmentStats = [
  { name: "Kitchen", members: 8, avgRating: 4.7, totalSales: 445000 },
  { name: "Front of House", members: 12, avgRating: 4.6, totalSales: 320000 },
  { name: "Bar", members: 4, avgRating: 4.8, totalSales: 185000 },
  { name: "Management", members: 3, avgRating: 4.9, totalSales: 0 },
];

// Toast sync data is now provided by the hook

export default function TeamPage() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<any>(null);
  
  const { 
    syncStatus: toastSync, 
    employees,
    syncEmployees,
    loadEmployees,
    deleteEmployeeLocally,
    selectedRestaurant,
    setSelectedRestaurant,
    isAuthenticated,
    isLoading: toastLoading,
    restaurants,
    checkAuthStatus
  } = useToastIntegration();
  
  // Auto-load employees when component mounts if authenticated
  useEffect(() => {
    if (isAuthenticated && selectedRestaurant) {
      console.log('Team page auto-loading employees for restaurant:', selectedRestaurant);
    }
  }, [isAuthenticated, selectedRestaurant]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [sortKey, setSortKey] = useState<'name' | 'role' | 'department' | 'lastSync'>("name");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [stableEmployees, setStableEmployees] = useState<any[]>([]);
  const [initializing, setInitializing] = useState<boolean>(true);
  
  // Simple permission check placeholder: allow write if token perms include manager/admin; default true
  const getCanWritePerformance = () => {
    try {
      const raw = typeof window !== 'undefined' ? sessionStorage.getItem('permissions') : null;
      if (!raw) return true; // default allow to avoid blocking usage in dev
      const perms: string[] = JSON.parse(raw);
      return perms.includes('admin') || perms.includes('team') || perms.includes('manager');
    } catch { return true; }
  };
  const canWritePerformance = getCanWritePerformance();

  // Use real Toast employee data instead of dummy data
  const employeeData = employees || [];
  const activeEmployeeData = employeeData.filter((e: any) => e.isActive === true);

  // Keep HUD numbers stable while sync is in progress
  useEffect(() => {
    if (!toastSync.isLoading && Array.isArray(employees)) {
      setStableEmployees(employees);
    }
  }, [toastSync.isLoading, employees]);
  const hudEmployees = (toastSync.isLoading ? stableEmployees : employees) || [];
  const hudActiveCount = hudEmployees.filter((e: any) => e?.isActive === true).length;
  
  // Track first successful employees load to gate UI with skeletons
  useEffect(() => {
    if (Array.isArray(employees) && employees.length >= 0) {
      setInitializing(false);
    }
  }, [employees]);
  
  // Hoisted helpers (used by filters below)
  function getDepartmentFromJobs(jobs: any[]): string {
    const titles = (jobs || []).map(j => (j.title || '').toLowerCase());
    const has = (k: string) => titles.some(t => t.includes(k));

    if (has('manager') || has('admin') || has('supervisor') || has('owner') || has('director')) return 'Admin';
    if (has('server') || has('bartender') || has('host') || has('hostess') || has('runner') || has('busser') || has('barback') || has('cashier') || has('expo')) return 'Front of House';
    if (has('chef') || has('cook') || has('kitchen') || has('prep') || has('dish') || has('line') || has('sous') || has('pastry')) return 'Back of House';
    return 'Other';
  }

  function getDepartmentBadgeClasses(dept: string): string {
    switch (dept) {
      case 'Front of House':
        return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'Back of House':
        return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Admin':
        return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800';
      default:
        return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-slate-200 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700';
    }
  }

  function RoleTags({ jobs }: { jobs: any[] }) {
    return (
      <div className="flex flex-wrap gap-1">
        {(jobs?.length ? jobs : [{ title: 'Employee', guid: 'default' }]).map((job: any, idx: number) => (
          <span key={`${job.guid || job.title}-${idx}`} className={getRoleBadgeClasses(job.title || 'Employee')}>
            {job.title || 'Employee'}
          </span>
        ))}
      </div>
    );
  }

  function PerformanceCell({ employee, selectedRestaurant, mode = 'full' }: { employee: any, selectedRestaurant: string | null, mode?: 'summary' | 'full' }) {
    const [avg, setAvg] = useState<number | null>(null);
    const [ratingCount, setRatingCount] = useState<number>(0);
    const [flags, setFlags] = useState<number>(0);
    const [red, setRed] = useState<number>(0);
    const [yellow, setYellow] = useState<number>(0);
    const [blue, setBlue] = useState<number>(0);
    const [entries, setEntries] = useState<any[]>([]);
    const [logOpen, setLogOpen] = useState(false);
    const [tip, setTip] = useState<{show:boolean;x:number;y:number;text:string}>({show:false,x:0,y:0,text:''});
    const heatRef = useRef<SVGSVGElement | null>(null);
    const svgContainerRef = useRef<HTMLDivElement | null>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [isDark, setIsDark] = useState<boolean>(false);
    const [open, setOpen] = useState(false);
    const [flagOpen, setFlagOpen] = useState(false);
    const [flagType, setFlagType] = useState<'red' | 'yellow' | 'blue'>('blue');
    const [rating, setRating] = useState<number>(5);
    const [details, setDetails] = useState<string>("");

    const reloadPerformance = async () => {
      try {
        if (!selectedRestaurant) return;
        const res = await fetch(`/api/performance?restaurantGuid=${selectedRestaurant}&employeeToastGuid=${employee.toastGuid}`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          const agg = (data.data.aggregates || []).find((a: any) => a._id === employee.toastGuid);
          const cnt = agg ? (agg.count || 0) : 0;
          setRatingCount(cnt);
          setAvg(agg && cnt > 0 && typeof agg.avg === 'number' ? Number(agg.avg.toFixed(2)) : null);
          setFlags(agg ? (agg.flags || ((agg.red||0)+(agg.yellow||0)+(agg.blue||0))) : 0);
          setRed(agg ? (agg.red || 0) : 0);
          setYellow(agg ? (agg.yellow || 0) : 0);
          setBlue(agg ? (agg.blue || 0) : 0);
          setEntries(data.data.entries || []);
        }
      } catch {}
    };

    useEffect(() => {
      reloadPerformance();
    }, [employee.toastGuid, selectedRestaurant]);

    const submit = async (flagOnly = false) => {
      if (!selectedRestaurant) return;
      await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantGuid: selectedRestaurant,
          employeeToastGuid: employee.toastGuid,
          rating: flagOnly ? undefined : rating,
          isFlag: flagOnly,
          flagType: flagOnly ? flagType : undefined,
          details,
        })
      });
      setOpen(false);
      setDetails("");
      // reload aggregate
      await reloadPerformance();
    };

    // GitHub-style contribution heatmap (SVG) — crisp, non-overlapping squares
    const [quarterOffset, setQuarterOffset] = useState(0); // 0=current, -1=prev, +1=next
    const weeks = 52; // full year
    const rows = 7;   // days of week, Sun (row 0) -> Sat (row 6)

    const startOfWeek = (d: Date) => {
      const r = new Date(d);
      const day = r.getDay(); // 0 = Sun
      r.setHours(0,0,0,0);
      r.setDate(r.getDate() - day);
      return r;
    };
    const addDays = (d: Date, num: number) => {
      const r = new Date(d);
      r.setDate(r.getDate() + num);
      return r;
    };
    // Compute the visible window aligned to weeks and quarterOffset
    const today = new Date();
    const endWeekStart = startOfWeek(addDays(today, quarterOffset * weeks * rows));
    const startDate = addDays(endWeekStart, -(weeks - 1) * rows);
    const endDate = addDays(endWeekStart, rows - 1);

    const dayCount = weeks * rows;
    const buckets: { score: number; ratingTotal: number; ratingCount: number; red: number; yellow: number; blue: number }[] = Array.from({ length: dayCount }, () => ({ score: 0, ratingTotal: 0, ratingCount: 0, red: 0, yellow: 0, blue: 0 }));
    if (entries && entries.length) {
      entries.forEach((e: any) => {
        const d = new Date(e.createdAt);
        if (d >= startDate && d <= endDate) {
          const diffDays = Math.floor((d.getTime() - startDate.getTime()) / (24 * 3600 * 1000));
          const idx = Math.min(dayCount - 1, Math.max(0, diffDays));
          let add = 0;
          if (e.rating) { add += 1; buckets[idx].ratingTotal += e.rating; buckets[idx].ratingCount += 1; }
          if (e.isFlag) {
            if (e.flagType === 'red') { add += 3; buckets[idx].red += 1; }
            else if (e.flagType === 'yellow') { add += 2; buckets[idx].yellow += 1; }
            else { add += 1; buckets[idx].blue += 1; }
          }
          buckets[idx].score += add;
        }
      });
    }

    // Colors for SVG fills (light/dark palettes)
    const getHeatFillByBucket = (b: { score: number; ratingTotal: number; ratingCount: number; red: number; yellow: number; blue: number }) => {
      if (b.red > 0) return '#ef4444';
      const weight = Math.min(10, (b.ratingCount || 0) + (b.yellow || 0) * 3 + (b.blue || 0) * 2);
      if (isDark) {
        if (weight <= 0) return '#334155'; // slate-700 base in dark
        if (weight <= 2) return '#7c2d12'; // orange-900
        if (weight <= 4) return '#9a3412'; // orange-800
        if (weight <= 7) return '#c2410c'; // orange-700
        return '#ea580c'; // orange-600
      } else {
        if (weight <= 0) return '#e2e8f0'; // slate-200 base in light
        if (weight <= 2) return '#fed7aa'; // orange-200
        if (weight <= 4) return '#fdba74'; // orange-300
        if (weight <= 7) return '#fb923c'; // orange-400
        return '#f97316'; // orange-500
      }
    };

    // Month labels at the start of each month column
    const monthLabels: { col: number; name: string }[] = [];
    let lastMonth = -1;
    for (let cx = 0; cx < weeks; cx++) {
      const colDate = addDays(startDate, cx * 7);
      const m = colDate.getMonth();
      if (m !== lastMonth) {
        monthLabels.push({ col: cx, name: colDate.toLocaleString(undefined, { month: 'short' }) });
        lastMonth = m;
      }
    }

    useEffect(() => {
      const handleResize = () => {
        if (svgContainerRef.current) {
          setContainerWidth(svgContainerRef.current.clientWidth || 0);
        }
      };
      const applyTheme = () => {
        try {
          const darkClass = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
          const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
          setIsDark(Boolean(darkClass || (mq && mq.matches)));
        } catch {}
      };
      handleResize();
      applyTheme();
      window.addEventListener('resize', handleResize);
      const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
      const mqHandler = (e: any) => applyTheme();
      if (mq && mq.addEventListener) mq.addEventListener('change', mqHandler);
      return () => {
        window.removeEventListener('resize', handleResize);
        if (mq && mq.removeEventListener) mq.removeEventListener('change', mqHandler);
      };
    }, []);

    return (
      <div className="w-full space-y-2">
        {/* Summary row (independent from visualization) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span className="font-medium text-green-600">{avg ?? '—'}</span>
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" title="Red flags">{red}</span>
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" title="Yellow flags">{yellow}</span>
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300" title="Blue flags">{blue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" title="Refresh stats" aria-label="Refresh stats" onClick={reloadPerformance}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            {canWritePerformance && (
              <Button type="button" variant="outline" size="sm" onClick={()=> setOpen(true)}>Rate</Button>
            )}
            {canWritePerformance && (
              <Button type="button" variant="outline" size="icon" title="Add flag" aria-label="Add flag" onClick={(e)=>{ e.preventDefault(); setFlagOpen(true); }}>+</Button>
            )}
          </div>
        </div>
        {/* Heatmap (GitHub commit style) — its own row */}
        {mode === 'full' && (() => {
          const gap = 3; // slightly larger gap to reduce visual artifacting
          let cellSize = containerWidth > 0 ? Math.floor((containerWidth - (weeks - 1) * gap) / weeks) : 10;
          if (cellSize % 2 !== 0) cellSize -= 1; // enforce even cell size for crisp grid
          cellSize = Math.max(6, Math.min(16, cellSize));
          const svgWidth = weeks * cellSize + (weeks - 1) * gap;
          const svgHeight = rows * cellSize + (rows - 1) * gap;
          return (
            <div className="mt-1 w-full">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[12px] text-muted-foreground">
                  <span className="font-medium">{startDate.toLocaleDateString()}</span> – <span className="font-medium">{endDate.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=> setQuarterOffset(o=> o-1)} title="Previous">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={()=> setQuarterOffset(0)}>Today</Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=> setQuarterOffset(o=> o+1)} title="Next">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="overflow-x-auto ml-auto" ref={svgContainerRef}>
                  <div className="min-w-max">
                    <div className="flex" style={{ width: `${svgWidth}px`, marginLeft: 'auto' }}>
                      <div className="grid text-[10px] leading-none text-muted-foreground mb-2 ml-auto" style={{ gridTemplateColumns: `repeat(${weeks}, ${cellSize}px)`, gridAutoRows: `${cellSize}px`, gap: `${gap}px` }}>
                        {monthLabels.map((l, i) => {
                          const nextCol = i < monthLabels.length - 1 ? monthLabels[i+1].col : weeks;
                          const span = Math.max(1, nextCol - l.col);
                          return (
                            <div key={`${l.name}-${l.col}`} style={{ gridColumn: `${l.col + 1} / span ${span}` }} className="truncate text-right">
                              {l.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="relative inline-block" style={{ width: `${svgWidth}px`, marginLeft: 'auto' }}>
                      <svg ref={heatRef} width={svgWidth} height={svgHeight} shapeRendering="crispEdges">
                        {(() => {
                          const step = cellSize + gap;
                          const offset = (typeof window !== 'undefined' && (Math.round(window.devicePixelRatio) % 2 === 1)) ? 0.5 : 0;
                          return (
                            <g transform={`translate(${offset},${offset})`}>
                              {Array.from({ length: weeks }).map((_, cx) => (
                                Array.from({ length: rows }).map((_, ry) => {
                                  const idx = cx * rows + ry;
                                  const b = buckets[idx] || { score: 0, ratingTotal: 0, ratingCount: 0, red: 0, yellow: 0, blue: 0 };
                                  const cellDate = addDays(startDate, idx);
                                  const avgDay = b.ratingCount ? (b.ratingTotal / b.ratingCount).toFixed(2) : '—';
                                  const title = `${cellDate.toLocaleDateString()}\nAvg rating: ${avgDay} (${b.ratingCount})\nFlags  R:${b.red}  Y:${b.yellow}  B:${b.blue}`;
                                  const x = cx * step;
                                  const y = ry * step;
                                  return (
                                    <rect
                                      key={`${cx}-${ry}`}
                                      x={x}
                                      y={y}
                                      width={cellSize}
                                      height={cellSize}
                                      fill={getHeatFillByBucket(b)}
                                      onMouseEnter={(e)=>{
                                        const rect = heatRef.current?.getBoundingClientRect();
                                        const xPos = rect ? (e.clientX - rect.left) : 0;
                                        const yPos = rect ? (e.clientY - rect.top) : 0;
                                        setTip({ show: true, x: xPos, y: yPos, text: title });
                                      }}
                                      onMouseLeave={()=> setTip(s=>({ ...s, show:false }))}
                                    />
                                  );
                                })
                              ))}
                            </g>
                          );
                        })()}
                      </svg>
                      {tip.show && (
                        <div className="pointer-events-none absolute z-10 px-2 py-1 rounded-md backdrop-blur-md bg-white/70 dark:bg-slate-800/60 border border-white/40 dark:border-slate-700/60 shadow-sm text-[10px] text-foreground"
                             style={{ left: Math.min(Math.max(0, tip.x + 8), svgWidth - 120), top: Math.max(0, tip.y - 28) }}>
                          {tip.text.split('\n').map((line, i)=> (<div key={i}>{line}</div>))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Vertical Legend beside visualization */}
                <div className="flex flex-col items-end gap-1 mt-1 text-[10px] text-muted-foreground">
                  <span>Less</span>
                  <span className="h-3 w-3 rounded-sm bg-slate-200 dark:bg-slate-700" />
                  <span className="h-3 w-3 rounded-sm bg-orange-200 dark:bg-orange-900/60" />
                  <span className="h-3 w-3 rounded-sm bg-orange-300 dark:bg-orange-800/70" />
                  <span className="h-3 w-3 rounded-sm bg-orange-400 dark:bg-orange-700/80" />
                  <span className="h-3 w-3 rounded-sm bg-orange-500 dark:bg-orange-600" />
                  <span>More</span>
                </div>
              </div>
              {/* Legend moved under navigation on the right (see above) */}
            </div>
          );
        })()}
        {/* Rating dialog (triggered by Rate button) */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Performance Entry</DialogTitle>
              <DialogDescription>Rate or flag this team member. Average updates immediately.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map((n)=> (
                  <button key={n} onClick={()=> setRating(n)} className={`p-1 ${rating>=n ? 'text-yellow-500' : 'text-slate-400'}`}>
                    <Star className="h-5 w-5" />
                  </button>
                ))}
                <span className="text-sm text-muted-foreground">{rating} / 5</span>
              </div>
              <textarea className="w-full border rounded p-2 bg-background text-foreground" rows={4} placeholder="Details (optional)" value={details} onChange={(e)=> setDetails(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={()=> submit(false)} type="button">Save Rating</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Separate Flag Modal */}
        <Dialog open={flagOpen} onOpenChange={setFlagOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Flag</DialogTitle>
              <DialogDescription>Choose a flag type and add details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button variant={flagType==='red' ? 'default' : 'outline'} className={`border-red-300 text-red-700 dark:text-red-300 ${flagType==='red' ? 'bg-red-600 text-white' : ''}`} onClick={()=> setFlagType('red')}>Red</Button>
                <Button variant={flagType==='yellow' ? 'default' : 'outline'} className={`border-amber-300 text-amber-700 dark:text-amber-300 ${flagType==='yellow' ? 'bg-amber-500 text-white' : ''}`} onClick={()=> setFlagType('yellow')}>Yellow</Button>
                <Button variant={flagType==='blue' ? 'default' : 'outline'} className={`border-sky-300 text-sky-700 dark:text-sky-300 ${flagType==='blue' ? 'bg-sky-600 text-white' : ''}`} onClick={()=> setFlagType('blue')}>Blue</Button>
              </div>
              <textarea className="w-full border rounded p-2 bg-background text-foreground" rows={4} placeholder="Details (optional)" value={details} onChange={(e)=> setDetails(e.target.value)} />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={()=> setFlagOpen(false)} type="button">Cancel</Button>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={async ()=>{ await submit(true); setFlagOpen(false); }} type="button">Save Flag</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const filteredMembers = employeeData
    .filter((employee: any) => (employee.firstName + ' ' + employee.lastName).toLowerCase().includes(searchTerm.toLowerCase())
      || (employee.jobTitles?.some((j:any)=> (j.title||'').toLowerCase().includes(searchTerm.toLowerCase()))) )
    .filter((employee: any) => !selectedRole || (employee.jobTitles||[]).some((j:any)=> j.title === selectedRole))
    .filter((employee: any) => {
      if (!selectedDept) return true;
      return getDepartmentFromJobs(employee.jobTitles||[]) === selectedDept;
    })
    .sort((a:any,b:any)=>{
      const dir = sortAsc ? 1 : -1;
      switch (sortKey) {
        case 'role': {
          const ar = (a.jobTitles?.[0]?.title || '').localeCompare(b.jobTitles?.[0]?.title || '');
          return ar * dir;
        }
        case 'department': {
          const ad = getDepartmentFromJobs(a.jobTitles||[]).localeCompare(getDepartmentFromJobs(b.jobTitles||[]));
          return ad * dir;
        }
        case 'lastSync': {
          const at = new Date(a.lastSyncDate || 0).getTime();
          const bt = new Date(b.lastSyncDate || 0).getTime();
          return (at - bt) * dir;
        }
        case 'name':
        default:
          return ((a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName)) * dir;
      }
    });

  const getStatusColor = (status: string) => {
    return status === "active" ? "tag-green" : "tag-red";
  };

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-yellow-600";
    return "text-red-600";
  };

  // Role tag styling (light/dark friendly) with deterministic color choices
  const getRoleBadgeClasses = (title: string) => {
    const palette = [
      { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-slate-900 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-800' },
      { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-slate-900 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800' },
      { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-slate-900 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-800' },
      { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-slate-900 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-800' },
      { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-slate-900 dark:text-violet-300', border: 'border-violet-300 dark:border-violet-800' },
      { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30', text: 'text-slate-900 dark:text-fuchsia-300', border: 'border-fuchsia-300 dark:border-fuchsia-800' },
      { bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-slate-900 dark:text-lime-300', border: 'border-lime-300 dark:border-lime-800' },
      { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-slate-900 dark:text-cyan-300', border: 'border-cyan-300 dark:border-cyan-800' },
      { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-slate-900 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-800' },
      { bg: 'bg-slate-200 dark:bg-slate-800/60', text: 'text-slate-900 dark:text-slate-200', border: 'border-slate-300 dark:border-slate-700' },
    ];
    let hash = 0;
    for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
    const c = palette[hash % palette.length];
    return `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`;
  };

  // previous duplicated helpers removed (hoisted earlier)

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
            <p className="text-muted-foreground mt-1">Manage your team members, track performance, and sync with Toast</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">
              {toastLoading ? 'Syncing…' : `Last sync: ${toastSync.lastSync || 'Never'}`}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Sync"
              onClick={() => selectedRestaurant && syncEmployees(selectedRestaurant)}
              disabled={toastLoading}
            >
              <RefreshCw className={`h-4 w-4 ${toastLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
              <DialogTrigger asChild>
                                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Member
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Team Member</DialogTitle>
                  <DialogDescription>Add a new member to your team</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="member-name">Full Name</Label>
                      <Input id="member-name" placeholder="Enter full name" />
                    </div>
                    <div>
                      <Label htmlFor="member-email">Email</Label>
                      <Input id="member-email" type="email" placeholder="email@example.com" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="member-role">Role</Label>
                      <select 
                        id="member-role" 
                        className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                        defaultValue=""
                      >
                        <option value="">Select role...</option>
                        <option>Head Chef</option>
                        <option>Sous Chef</option>
                        <option>Line Cook</option>
                        <option>Server</option>
                        <option>Bartender</option>
                        <option>Host/Hostess</option>
                        <option>Manager</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="member-department">Department</Label>
                      <select 
                        id="member-department" 
                        className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                        defaultValue=""
                      >
                        <option value="">Select department...</option>
                        <option>Kitchen</option>
                        <option>Front of House</option>
                        <option>Bar</option>
                        <option>Management</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="member-phone">Phone</Label>
                      <Input id="member-phone" placeholder="(555) 123-4567" />
                    </div>
                    <div>
                      <Label htmlFor="member-rate">Hourly Rate</Label>
                      <Input id="member-rate" type="number" placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="member-availability">Availability</Label>
                    <select 
                      id="member-availability" 
                      className="w-full h-10 px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                      defaultValue=""
                    >
                      <option value="">Select availability...</option>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Seasonal</option>
                      <option>On-call</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">Add Member</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Toast Sync Status */}
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-orange-600 rounded-full p-2">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Toast POS Integration</h3>
                  <p className="text-muted-foreground text-sm">
                    Last sync: {toastSync.lastSync} • {hudActiveCount} employees
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-muted-foreground font-medium">New: {toastSync.newEmployees}</span>
                    <span className="text-muted-foreground font-medium">Updated: {toastSync.updatedProfiles}</span>
                    <span className="text-green-600 font-medium">Errors: {toastSync.errors}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                                      <p className="text-sm font-medium text-muted-foreground">Total Team Members</p>
                    <p className="text-2xl font-bold text-foreground">
                      {initializing || toastSync.isLoading ? (
                        <span className="inline-block h-6 w-24 bg-slate-200 dark:bg-slate-800 animate-pulse rounded" />
                      ) : (
                        hudActiveCount
                      )}
                    </p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +2 this month
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                                      <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                    <p className="text-2xl font-bold text-foreground">4.7</p>
                                      <p className="text-xs text-muted-foreground mt-1">Team performance</p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                                      <p className="text-sm font-medium text-muted-foreground">On-Time Rate</p>
                    <p className="text-2xl font-bold text-foreground">95%</p>
                                      <p className="text-xs text-muted-foreground mt-1">Average attendance</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                                      <p className="text-sm font-medium text-muted-foreground">Total Sales Generated</p>
                    <p className="text-2xl font-bold text-foreground">$405K</p>
                                      <p className="text-xs text-muted-foreground mt-1">This quarter</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Team Overview</TabsTrigger>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Overview</CardTitle>
                  <CardDescription>Team distribution by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departmentStats.map((dept, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                                                                                  <span className="font-medium text-foreground">{dept.name}</span>
                            <span className="text-sm text-muted-foreground">{dept.members} members</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${(dept.members / 27) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Avg Rating: {dept.avgRating}/5</span>
                          {dept.totalSales > 0 && <span>Sales: ${dept.totalSales.toLocaleString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Highest rated team members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {employeeData
                      .slice(0, 5)
                      .map((employee, index) => (
                        <div key={employee.toastGuid} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-orange-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-semibold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{employee.firstName} {employee.lastName}</p>
                              <p className="text-xs text-muted-foreground">{employee.jobTitles?.[0]?.title || 'Employee'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-500 mr-1" />
                              <span className="text-sm font-medium">4.5</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage your team member profiles</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9" title="Filters">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-72 p-2 space-y-2">
                        <DropdownMenuLabel>Filter Members</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Role</label>
                          <select
                            className="h-9 w-full px-2 border rounded-md bg-background text-foreground"
                            onChange={(e) => setSelectedRole(e.target.value)}
                            value={selectedRole}
                          >
                            <option value="">All roles</option>
                            {[...new Set(employeeData.flatMap((e:any)=> (e.jobTitles||[]).map((j:any)=> j.title).filter(Boolean)))]
                              .sort()
                              .map((title:string)=> (
                                <option key={title} value={title}>{title}</option>
                              ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Department</label>
                          <select
                            className="h-9 w-full px-2 border rounded-md bg-background text-foreground"
                            onChange={(e) => setSelectedDept(e.target.value)}
                            value={selectedDept}
                          >
                            <option value="">All departments</option>
                            <option>Front of House</option>
                            <option>Back of House</option>
                            <option>Admin</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">Sort by</label>
                          <div className="flex items-center space-x-2">
                            <select
                              className="h-9 flex-1 px-2 border rounded-md bg-background text-foreground"
                              onChange={(e) => setSortKey(e.target.value as any)}
                              value={sortKey}
                            >
                              <option value="name">Name</option>
                              <option value="role">Role</option>
                              <option value="department">Department</option>
                              <option value="lastSync">Last Sync</option>
                            </select>
                            <Button variant="outline" size="sm" onClick={()=> setSortAsc((v)=> !v)} title="Toggle sort order">
                              {sortAsc ? 'Asc' : 'Desc'}
                            </Button>
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active" onValueChange={(v)=>{
                  // When switching to inactive, ensure we have those records loaded
                  if (v === 'inactive' && typeof window !== 'undefined' && selectedRestaurant) {
                    // Request inactive from server
                    // @ts-ignore using hook function that accepts options
                    loadEmployees(selectedRestaurant, { includeInactive: true });
                  }
                }}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="inactive">Inactive</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Performance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMembers
                          .filter((employee: any) => employee.isActive === true)
                          .map((employee) => (
                            <TableRow key={employee.toastGuid}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar>
                                    <AvatarFallback className="bg-orange-600 text-white">
                                      {(employee.firstName?.[0] || '') + (employee.lastName?.[0] || '')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-foreground">{employee.firstName} {employee.lastName}</div>
                                    <div className="text-sm text-muted-foreground">{employee.email || 'No email'}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {(employee.jobTitles?.length ? employee.jobTitles : [{ title: 'Employee', guid: 'default' }]).map((job: any, idx: number) => (
                                    <span key={`${job.guid || job.title}-${idx}`} className={getRoleBadgeClasses(job.title || 'Employee')}>
                                      {job.title || 'Employee'}
                                    </span>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const dept = getDepartmentFromJobs(employee.jobTitles || []);
                                  return <span className={getDepartmentBadgeClasses(dept)}>{dept}</span>;
                                })()}
                              </TableCell>
                              <TableCell>
                                <PerformanceCell employee={employee} selectedRestaurant={selectedRestaurant} mode="summary" />
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs capitalize ${employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {employee.isActive ? 'active' : 'inactive'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedMember(employee)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setEmployeeToDelete(employee);
                                      setDeleteModalOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="inactive">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMembers
                          .filter((employee: any) => employee.isActive !== true)
                          .map((employee) => (
                            <TableRow key={employee.toastGuid}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <Avatar>
                                    <AvatarFallback className="bg-slate-400 text-white">
                                      {(employee.firstName?.[0] || '') + (employee.lastName?.[0] || '')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-foreground">{employee.firstName} {employee.lastName}</div>
                                    <div className="text-sm text-muted-foreground">{employee.email || 'No email'}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {(employee.jobTitles?.length ? employee.jobTitles : [{ title: 'Employee', guid: 'default' }]).map((job: any, idx: number) => (
                                    <span key={`${job.guid || job.title}-${idx}`} className={getRoleBadgeClasses(job.title || 'Employee')}>
                                      {job.title || 'Employee'}
                                    </span>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const dept = getDepartmentFromJobs(employee.jobTitles || []);
                                  return <span className={getDepartmentBadgeClasses(dept)}>{dept}</span>;
                                })()}
                              </TableCell>
                              <TableCell>
                                <span className="px-2 py-1 rounded-full text-xs capitalize bg-red-100 text-red-800">inactive</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedMember(employee)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            {/* Simple visualizations with controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Average Rating</CardTitle>
                  <CardDescription>Across active members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded mb-2" />
                  <div className="text-xs text-muted-foreground">No data yet • choose a date window to view trends</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Flags</CardTitle>
                  <CardDescription>All members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded mb-2" />
                  <div className="text-xs text-muted-foreground">Split by red/yellow/blue</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Ratings and flags</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-24 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded mb-2" />
                  <div className="flex items-center gap-2 text-xs">
                    <span>Date window:</span>
                    <select className="h-7 px-2 border rounded bg-background text-foreground">
                      <option>7 days</option>
                      <option>30 days</option>
                      <option>90 days</option>
                    </select>
                    <span>Show:</span>
                    <label className="flex items-center gap-1"><input type="checkbox" defaultChecked /> Rating</label>
                    <label className="flex items-center gap-1"><input type="checkbox" defaultChecked /> Flags</label>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {employeeData.filter(emp => emp.isActive).map((employee) => (
                <Card key={employee.toastGuid}>
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-orange-600 text-white">
                          {(employee.firstName?.[0] || '') + (employee.lastName?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{employee.firstName} {employee.lastName}</CardTitle>
                        <CardDescription>
                          <RoleTags jobs={employee.jobTitles || []} />
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Toast Employee ID</p>
                        <p className="font-semibold text-foreground text-xs">{employee.toastGuid}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold text-foreground text-sm">{employee.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Sync</p>
                        <p className="font-semibold text-foreground text-xs">{employee.lastSyncDate ? new Date(employee.lastSyncDate).toLocaleDateString() : 'Never'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Performance</p>
                      <PerformanceCell employee={employee} selectedRestaurant={selectedRestaurant} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Member Details Modal */}
        {selectedMember && (
          <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-orange-600 text-white">
                      {(selectedMember.firstName?.[0] || '') + (selectedMember.lastName?.[0] || '')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle>{selectedMember.firstName} {selectedMember.lastName}</DialogTitle>
                    <DialogDescription>{selectedMember.jobTitles?.[0]?.title || 'Employee'} • Toast POS</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedMember.email || 'Not provided'}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Toast Employee ID</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-mono">{selectedMember.toastGuid}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Created Date</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedMember.createdDate ? new Date(selectedMember.createdDate).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Last Sync</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedMember.lastSyncDate ? new Date(selectedMember.lastSyncDate).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Job Titles</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedMember.jobTitles?.length > 0 ? 
                      selectedMember.jobTitles.map((job: any, index: number) => (
                        <span key={index} className={getRoleBadgeClasses(job.title || 'Employee')}>
                          {job.title || 'Employee'}
                        </span>
                      )) : 
                      <span className="text-xs text-muted-foreground">No job titles assigned</span>
                    }
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedMember.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {selectedMember.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMember(null)}>Close</Button>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white" disabled>
                  Sync from Toast
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Employee Modal */}
        {employeeToDelete && (
          <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 rounded-full p-3">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <DialogTitle>Hide Employee</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to hide this employee from your team list?
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="py-4">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-orange-600 text-white">
                        {(employeeToDelete.firstName?.[0] || '') + (employeeToDelete.lastName?.[0] || '')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{employeeToDelete.firstName} {employeeToDelete.lastName}</p>
                      <p className="text-sm text-muted-foreground">{employeeToDelete.jobTitles?.[0]?.title || 'Employee'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="text-blue-600 mt-0.5">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">What happens when you hide an employee?</p>
                      <ul className="text-xs text-blue-700 mt-1 space-y-1">
                        <li>• They will be hidden from all team lists in Varuni</li>
                        <li>• They can still be synced from Toast POS</li>
                        <li>• You can unhide them later if needed</li>
                        <li>• No data is permanently deleted</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setEmployeeToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={async () => {
                    await deleteEmployeeLocally(employeeToDelete.toastGuid);
                    setDeleteModalOpen(false);
                    setEmployeeToDelete(null);
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hide Employee
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
} 
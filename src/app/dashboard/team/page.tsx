"use client";

import { useState, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { useToastIntegration } from "@/lib/hooks/use-toast-integration";
import { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Plus,
  Search,
  Filter,
  Star,
  Clock,
  Edit,
  Trash2,
  Mail,
  Calendar,
  Award,
  TrendingUp,
  Smartphone,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from "lucide-react";
import { gql, useQuery } from "@apollo/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
 

const GET_TEAM_DASHBOARD_DATA = gql`
  query TeamDashboardData {
    activeRosterConfiguration {
      id
      name
      nodes {
        assigned {
          rating
        }
        children {
          assigned {
            rating
          }
        }
      }
    }
  }
`;

// (sample data removed)

// Toast sync data is now provided by the hook

interface Job {
  title: string;
  guid: string;
}

interface Employee {
  toastGuid: string;
  firstName: string;
  lastName: string;
  email?: string;
  isActive: boolean;
  jobTitles?: Job[];
  lastSyncDate?: string;
  createdDate?: string;
}

interface PerformanceHistory {
  date: string;
  rating: number;
}

interface TeamMember {
  performance: {
    history: PerformanceHistory[];
  };
  // ... other fields
}

export default function TeamPage() {
  const RosterPanel = dynamic(() => import("@/components/team/RosterPanel"), { ssr: false });
  const [selectedTab, setSelectedTab] = useState("overview");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  
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
  const [selectedMember, setSelectedMember] = useState<Employee | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [sortKey, setSortKey] = useState<'name' | 'role' | 'department' | 'lastSync' | 'performance'>("name");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [stableEmployees, setStableEmployees] = useState<Employee[]>([]);
  const [initializing, setInitializing] = useState<boolean>(true);
  // Performance HUD summary (team-wide)
  const [perfWindow, setPerfWindow] = useState<'7d'|'30d'|'90d'>('7d');
  const [perfLoading, setPerfLoading] = useState<boolean>(false);
  const [perfAggregates, setPerfAggregates] = useState<{ _id: string; avg: number; count: number; red: number; yellow: number; blue: number }[]>([]);
  const [perfAggregatesPrev, setPerfAggregatesPrev] = useState<{ _id: string; avg: number; count: number; red: number; yellow: number; blue: number }[]>([]);
  const [perfSummary, setPerfSummary] = useState<{ avg: number | null; red: number; yellow: number; blue: number; count: number }>({ avg: null, red: 0, yellow: 0, blue: 0, count: 0 });
  const [recentPerfEntries, setRecentPerfEntries] = useState<{ isFlag: boolean; flagType: 'red' | 'yellow' | 'blue'; rating: number; employeeToastGuid: string; createdAt: string; details: string; }[]>([]);
  const [showRatingFeed, setShowRatingFeed] = useState<boolean>(true);
  const [showFlagFeed, setShowFlagFeed] = useState<boolean>(true);
  const [perfSearchTerm, setPerfSearchTerm] = useState("");
  const [perfSelectedRole, setPerfSelectedRole] = useState<string>("");
  const [perfSelectedDept, setPerfSelectedDept] = useState<string>("");
  const [perfSortKey, setPerfSortKey] = useState<'name' | 'performance'>("performance");
  const [perfSortAsc, setPerfSortAsc] = useState<boolean>(false);
  const [timeWindow, setTimeWindow] = useState('7d');
  
  const [sevenDept, setSevenDept] = useState<Array<{ name: string; members: number; toastGuids: string[] }>>([]);
  const [sevenDeptLoading, setSevenDeptLoading] = useState<boolean>(false);
  const [sevenDeptError, setSevenDeptError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setSevenDeptLoading(true);
        setSevenDeptError(null);
        const res = await fetch('/api/7shifts/department-overview', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json?.success) setSevenDept(Array.isArray(json.data) ? json.data : []);
        else setSevenDeptError(json?.error || 'Failed to load');
      } catch (e: any) {
        setSevenDeptError(e?.message || 'Failed to load 7shifts departments');
      } finally {
        setSevenDeptLoading(false);
      }
    };
    load();
  }, []);
  
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
  const employeeData: Employee[] = employees || [];
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

  const getWindowDates = (w: '7d'|'30d'|'90d') => {
    const end = new Date();
    const start = new Date();
    const days = w === '7d' ? 6 : w === '30d' ? 29 : 89;
    start.setDate(end.getDate() - days);
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
    return { start, end };
  };

  const reloadPerfSummary = useCallback(async () => {
    try {
      if (!selectedRestaurant) return;
      setPerfLoading(true);
      const { start, end } = getWindowDates(perfWindow);
      const qs = new URLSearchParams({ restaurantGuid: String(selectedRestaurant), start: start.toISOString(), end: end.toISOString() }).toString();
      const res = await fetch(`/api/performance?${qs}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        const entries: { isFlag: boolean; flagType: 'red' | 'yellow' | 'blue'; rating: number; employeeToastGuid: string; createdAt: string; details: string; }[] = data.data.entries || [];
        const aggregates: { _id: string; red: number; yellow: number; blue: number; count: number; avg: number }[] = data.data.aggregates || [];
        setPerfAggregates(aggregates);
        const ratingEntries = entries.filter((e)=> typeof e.rating === 'number' && e.rating > 0);
        const totalRatings = ratingEntries.reduce((s: number, e)=> s + (e.rating || 0), 0);
        const ratingCount = ratingEntries.length;
        const avg = ratingCount ? Number((totalRatings / ratingCount).toFixed(2)) : null;
        // Use only aggregates for flag totals to avoid undercount from entry limit
        const sumsAgg = aggregates.reduce((s, a)=> ({ red: s.red + (a.red||0), yellow: s.yellow + (a.yellow||0), blue: s.blue + (a.blue||0) }), { red: 0, yellow: 0, blue: 0 });
        setPerfSummary({ avg, red: sumsAgg.red, yellow: sumsAgg.yellow, blue: sumsAgg.blue, count: ratingCount });
        setRecentPerfEntries(entries.slice(0, 20));
      }

      // Fetch previous window aggregates for improvement calculations
      const days = perfWindow === '7d' ? 6 : perfWindow === '30d' ? 29 : 89;
      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevEnd.setHours(23,59,59,999);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - days);
      prevStart.setHours(0,0,0,0);
      const qsPrev = new URLSearchParams({ restaurantGuid: String(selectedRestaurant), start: prevStart.toISOString(), end: prevEnd.toISOString() }).toString();
      const resPrev = await fetch(`/api/performance?${qsPrev}`, { cache: 'no-store' });
      const dataPrev = await resPrev.json();
      if (dataPrev.success) {
        const prevAggregates: { _id: string; red: number; yellow: number; blue: number; count: number; avg: number }[] = dataPrev.data.aggregates || [];
        setPerfAggregatesPrev(prevAggregates);
      }
    } finally { setPerfLoading(false); }
  }, [selectedRestaurant, perfWindow]);

  useEffect(() => { reloadPerfSummary(); }, [reloadPerfSummary]);
  useEffect(() => {
    const h = () => reloadPerfSummary();
    try { window.addEventListener('performance-updated', h as EventListener); } catch {}
    return () => { try { window.removeEventListener('performance-updated', h as EventListener); } catch {} };
  }, [reloadPerfSummary]);
  
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

  function PerformanceCell({ employee, selectedRestaurant, mode = 'full' }: { employee: Employee, selectedRestaurant: string | null, mode?: 'summary' | 'full' }) {
    const [avg, setAvg] = useState<number | null>(null);
    const [ratingCount, setRatingCount] = useState<number>(0);
    const [flags, setFlags] = useState<number>(0);
    const [red, setRed] = useState<number>(0);
    const [yellow, setYellow] = useState<number>(0);
    const [blue, setBlue] = useState<number>(0);
    const [entries, setEntries] = useState<{ isFlag: boolean; flagType: 'red' | 'yellow' | 'blue'; rating: number; employeeToastGuid: string; createdAt: string; details: string; }[]>([]);
    const [logOpen, setLogOpen] = useState(false);
    const [hoverInfo, setHoverInfo] = useState<{ date: string; avg: string; ratingCount: number; red: number; yellow: number; blue: number } | null>(null);
    const heatRef = useRef<SVGSVGElement | null>(null);
    const svgContainerRef = useRef<HTMLDivElement | null>(null);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const [isDark, setIsDark] = useState<boolean>(false);
    const [open, setOpen] = useState(false);
    const [flagOpen, setFlagOpen] = useState(false);
    const [flagType, setFlagType] = useState<'red' | 'yellow' | 'blue'>('blue');
    const [rating, setRating] = useState<number>(5);
    const [details, setDetails] = useState<string>("");
    const [cellOpen, setCellOpen] = useState(false);
    const [cellInfo, setCellInfo] = useState<{ date: Date; items: { isFlag: boolean; flagType: 'red' | 'yellow' | 'blue'; rating: number; employeeToastGuid: string; createdAt: string; details: string; }[] } | null>(null);

    const reloadPerformance = useCallback(async (opts?: { broadcast?: boolean }) => {
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
          // optionally broadcast so other instances (e.g., members tab) can refresh
          if (opts?.broadcast) {
            try { window.dispatchEvent(new CustomEvent('performance-updated', { detail: { employeeToastGuid: employee.toastGuid } })); } catch {}
          }
        }
      } catch {}
    }, [employee.toastGuid, selectedRestaurant]);

    useEffect(() => {
      reloadPerformance();
    }, [reloadPerformance]);

    // Listen for global updates (refresh other cells when a card updates)
    useEffect(() => {
      const handler = (e: CustomEvent) => {
        if (e?.detail?.employeeToastGuid === employee.toastGuid) reloadPerformance();
      };
      try { window.addEventListener('performance-updated', handler as EventListener); } catch {}
      return () => { try { window.removeEventListener('performance-updated', handler as EventListener); } catch {} };
    }, [employee.toastGuid, reloadPerformance]);

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
      // broadcast global refresh so team-wide HUD/flags update in real-time
      try { window.dispatchEvent(new CustomEvent('performance-updated', { detail: { employeeToastGuid: employee.toastGuid } })); } catch {}
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
            const t = String(e.flagType || '').trim().toLowerCase();
            if (t === 'red') { add += 3; buckets[idx].red += 1; }
            else if (t === 'yellow') { add += 2; buckets[idx].yellow += 1; }
            else { add += 1; buckets[idx].blue += 1; }
          }
          buckets[idx].score += add;
        }
      });
    }

    // Window totals used for counters in both performance and members tabs
    const redWindowTotal = buckets.reduce((sum, b) => sum + (b.red || 0), 0);
    const yellowWindowTotal = buckets.reduce((sum, b) => sum + (b.yellow || 0), 0);
    const blueWindowTotal = buckets.reduce((sum, b) => sum + (b.blue || 0), 0);

    // Gradient helpers for smooth intensity between 1..5 stars
    const hexToRgb = (hex: string) => {
      const h = hex.replace('#','');
      const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
      return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
    };
    const rgbToHex = (r: number, g: number, b: number) => {
      const toHex = (n: number) => n.toString(16).padStart(2,'0');
      return `#${toHex(Math.max(0,Math.min(255,Math.round(r))))}${toHex(Math.max(0,Math.min(255,Math.round(g))))}${toHex(Math.max(0,Math.min(255,Math.round(b))))}`;
    };
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const lerpColor = (c1: string, c2: string, t: number) => {
      const a = hexToRgb(c1); const b = hexToRgb(c2);
      return rgbToHex(lerp(a.r,b.r,t), lerp(a.g,b.g,t), lerp(a.b,b.b,t));
    };
    // Colors for SVG fills based on average rating (1..5).
    const getHeatFillByBucket = (b: { score: number; ratingTotal: number; ratingCount: number; red: number; yellow: number; blue: number }) => {
      if (!(b.ratingCount > 0)) return isDark ? '#334155' : '#e2e8f0';
      const avg = Math.max(1, Math.min(5, b.ratingTotal / (b.ratingCount || 1)));
      const t = (avg - 1) / 4; // 0..1
      const low = isDark ? '#334155' : '#ffedd5';
      const high = '#ea580c'; // brand orange
      return lerpColor(low, high, t);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span className="font-medium text-green-600">{avg ?? '—'}</span>
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" title="Red flags">{redWindowTotal}</span>
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" title="Yellow flags">{yellowWindowTotal}</span>
            <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300" title="Blue flags">{blueWindowTotal}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" title="Refresh stats" aria-label="Refresh stats" onClick={()=> reloadPerformance({ broadcast: true })}>
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
          const gap = 3; 
          const cellSize = 12; // Fixed cell size
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
                <div className="overflow-x-auto w-full pb-2">
                  <div style={{ width: `${svgWidth}px` }}>
                    <div className="grid text-[10px] leading-none text-muted-foreground mb-2" style={{ gridTemplateColumns: `repeat(${weeks}, ${cellSize}px)`, gridAutoRows: `${cellSize}px`, gap: `${gap}px` }}>
                      {monthLabels.map((l, i) => {
                        const nextCol = i < monthLabels.length - 1 ? monthLabels[i+1].col : weeks;
                        const span = Math.max(1, nextCol - l.col);
                        return (
                          <div key={`${l.name}-${l.col}`} style={{ gridColumn: `${l.col + 1} / span ${span}` }} className="truncate">
                            {l.name}
                          </div>
                        );
                      })}
                    </div>
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
                                  <g key={`${cx}-${ry}`}>
                                    <defs>
                                      <clipPath id={`clip-${cx}-${ry}`} clipPathUnits="userSpaceOnUse">
                                        <rect x={x} y={y} width={cellSize} height={cellSize} />
                                      </clipPath>
                                    </defs>
                                    <rect
                                      x={x}
                                      y={y}
                                      width={cellSize}
                                      height={cellSize}
                                      fill={getHeatFillByBucket(b)}
                                      onMouseEnter={()=>{
                                        setHoverInfo({ date: cellDate.toLocaleDateString(), avg: avgDay, ratingCount: b.ratingCount || 0, red: b.red||0, yellow: b.yellow||0, blue: b.blue||0 });
                                      }}
                                      onClick={()=>{
                                        const startD = new Date(cellDate); startD.setHours(0,0,0,0);
                                        const endD = new Date(cellDate); endD.setHours(23,59,59,999);
                                        const items = (entries||[]).filter((e: { createdAt: string | number | Date; })=>{ const d=new Date(e.createdAt); return d>=startD && d<=endD; });
                                        setCellInfo({ date: new Date(cellDate), items });
                                        setCellOpen(true);
                                      }}
                                    />
                                    {(() => {
                                      const flags: string[] = [];
                                      if (b.red > 0) flags.push('red');
                                      if (b.yellow > 0) flags.push('yellow');
                                      if (b.blue > 0) flags.push('blue');
                                      if (!flags.length) return null;
                                      const strokeFor = (t: string) => t==='red' ? '#ef4444' : (t==='yellow' ? '#f59e0b' : '#0ea5e9');
                                      return flags.map((t, i) => {
                                        const inset = 1 + i * 2; // integer inset to avoid half-pixel gaps
                                        return (
                                          <rect
                                            key={`${cx}-${ry}-${t}`}
                                            x={x + inset}
                                            y={y + inset}
                                            width={Math.max(0, cellSize - inset * 2)}
                                            height={Math.max(0, cellSize - inset * 2)}
                                            fill="none"
                                            stroke={strokeFor(t)}
                                            strokeWidth={1}
                                            vectorEffect="non-scaling-stroke"
                                            clipPath={`url(#clip-${cx}-${ry})`}
                                          />
                                        );
                                      });
                                    })()}
                                  </g>
                                );
                              })
                            ))}
                          </g>
                        );
                      })()}
                    </svg>
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
              {/* Inline info bar instead of floating tooltip */}
              <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
                <div>
                  {hoverInfo ? (
                    <>
                      <span className="text-foreground/80 mr-2">{hoverInfo.date}</span>
                      <span className="mr-3">Avg: <span className="text-foreground font-medium">{hoverInfo.avg}</span> ({hoverInfo.ratingCount})</span>
                      <span className="mr-2"><span className="inline-block w-2 h-2 rounded-sm bg-red-500 mr-1"></span>{hoverInfo.red}</span>
                      <span className="mr-2"><span className="inline-block w-2 h-2 rounded-sm bg-amber-500 mr-1"></span>{hoverInfo.yellow}</span>
                      <span className="mr-2"><span className="inline-block w-2 h-2 rounded-sm bg-sky-500 mr-1"></span>{hoverInfo.blue}</span>
                    </>
                  ) : (
                    <span>Hover a day to see details</span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground">Click a square for full details</div>
              </div>
            </div>
          );
        })()}
        {/* Day details modal */}
        <Dialog open={cellOpen} onOpenChange={setCellOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Day details{cellInfo?.date ? ` • ${cellInfo.date.toLocaleDateString()}` : ''}</DialogTitle>
              <DialogDescription>Ratings and flags for the selected day</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              {(cellInfo?.items||[]).length === 0 && (
                <div className="text-sm text-muted-foreground">No entries for this date.</div>
              )}
              {(cellInfo?.items||[]).map((e:any, i:number)=> (
                <div key={i} className="border rounded-md p-3 bg-background/60">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${e.isFlag ? (e.flagType==='red'?'bg-red-500': e.flagType==='yellow'?'bg-amber-500':'bg-sky-500') : 'bg-orange-500'}`}></span>
                      {e.isFlag ? (
                        <span className="font-medium capitalize">{e.flagType} flag</span>
                      ) : (
                        <span className="font-medium">Rating {e.rating}/5</span>
                      )}
                      {e.employeeToastGuid ? (
                        <span className="text-muted-foreground">• {(employees||[]).find((m:any)=> m.toastGuid===e.employeeToastGuid)?.firstName} {(employees||[]).find((m:any)=> m.toastGuid===e.employeeToastGuid)?.lastName}</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString()}</div>
                  </div>
                  {e.details ? <div className="mt-2 text-[12px] text-foreground/80">{e.details}</div> : null}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
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
        case 'performance': {
          const getAvg = (guid: string) => {
            const agg = perfAggregates.find(a => a._id === guid);
            return agg ? agg.avg || 0 : 0;
          };
          const avgA = getAvg(a.toastGuid);
          const avgB = getAvg(b.toastGuid);
          return (avgB - avgA) * dir;
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

  const filteredPerformanceMembers = employeeData
    .filter((employee: any) => (employee.firstName + ' ' + employee.lastName).toLowerCase().includes(perfSearchTerm.toLowerCase())
      || (employee.jobTitles?.some((j:any)=> (j.title||'').toLowerCase().includes(perfSearchTerm.toLowerCase()))) )
    .filter((employee: any) => !perfSelectedRole || (employee.jobTitles||[]).some((j:any)=> j.title === perfSelectedRole))
    .filter((employee: any) => {
      if (!perfSelectedDept) return true;
      return getDepartmentFromJobs(employee.jobTitles||[]) === perfSelectedDept;
    })
    .sort((a:any,b:any)=>{
      const dir = perfSortAsc ? 1 : -1;
      switch (perfSortKey) {
        case 'performance': {
          const getAvg = (guid: string) => {
            const agg = perfAggregates.find(a => a._id === guid);
            return agg ? agg.avg || 0 : 0;
          };
          const avgA = getAvg(a.toastGuid);
          const avgB = getAvg(b.toastGuid);
          // High-to-low is the natural sort for performance
          return (avgB - avgA) * dir;
        }
        case 'name':
        default:
          return ((a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName)) * dir;
      }
    });

  const { data } = useQuery(GET_TEAM_DASHBOARD_DATA);

  const activeRosterRating = useMemo(() => {
    if (!data?.activeRosterConfiguration) return 0;

    let totalRating = 0;
    let totalAssignments = 0;

    const calculateRating = (nodes: any[]) => {
      if (!nodes) return;
      nodes.forEach(node => {
        if (node.assigned) {
          node.assigned.forEach((assignment: any) => {
            totalRating += assignment.rating || 0;
            totalAssignments++;
          });
        }
        if (node.children) {
          calculateRating(node.children);
        }
      });
    };

    calculateRating(data.activeRosterConfiguration.nodes);

    return totalAssignments > 0 ? totalRating / totalAssignments : 0;
  }, [data]);

  // Build fast lookups for aggregates
  const aggregateById = useMemo(() => {
    const map = new Map<string, { _id: string; avg: number; count: number; red: number; yellow: number; blue: number }>();
    for (const a of perfAggregates) map.set(a._id, a);
    return map;
  }, [perfAggregates]);

  const prevAggregateById = useMemo(() => {
    const map = new Map<string, { _id: string; avg: number; count: number; red: number; yellow: number; blue: number }>();
    for (const a of perfAggregatesPrev) map.set(a._id, a);
    return map;
  }, [perfAggregatesPrev]);

  const departmentOverview = useMemo(() => {
    // Build from 7shifts counts, compute avg rating from aggregates using toastGuids
    if (!sevenDept || sevenDept.length === 0) return [] as Array<{ name: string; members: number; avgRating: number | null }>;

    // Include Toast-only employees for rating aggregation by unioning their guids per department
    const toastGuidsByDept = new Map<string, Set<string>>();
    for (const emp of (hudEmployees as any[])) {
      const dept = getDepartmentFromJobs(emp?.jobTitles || []);
      if (!toastGuidsByDept.has(dept)) toastGuidsByDept.set(dept, new Set());
      if (emp?.toastGuid) toastGuidsByDept.get(dept)!.add(emp.toastGuid);
    }

    return sevenDept.map((row) => {
      let ratingSum = 0;
      let ratingCount = 0;

      // Union of 7shifts-mapped toastGuids and Toast employee guids for this dept
      const unionGuids = new Set<string>(row.toastGuids || []);
      const extra = toastGuidsByDept.get(row.name);
      if (extra) for (const g of extra) unionGuids.add(g);

      // Primary window aggregates
      for (const guid of unionGuids) {
        const agg = aggregateById.get(guid);
        if (agg && agg.count > 0 && typeof agg.avg === 'number') {
          ratingSum += agg.avg;
          ratingCount += 1;
        }
      }
      // Fallback to previous window aggregates if current window has no coverage at all
      if (ratingCount === 0) {
        for (const guid of unionGuids) {
          const aggPrev = prevAggregateById.get(guid);
          if (aggPrev && aggPrev.count > 0 && typeof aggPrev.avg === 'number') {
            ratingSum += aggPrev.avg;
            ratingCount += 1;
          }
        }
      }
      const avgRating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : null;
      return { name: row.name, members: row.members, avgRating };
    }).sort((a,b)=> b.members - a.members);
  }, [sevenDept, aggregateById, prevAggregateById, hudEmployees]);

  const maxDeptMembers = useMemo(()=> Math.max(1, ...departmentOverview.map(d=> d.members)), [departmentOverview]);

  const leaderboardTop = useMemo(() => {
    const rows: { id: string; name: string; role: string; avg: number }[] = [];
    const active = hudEmployees.filter((e:any)=> e?.isActive === true);
    active.forEach((emp:any) => {
      const agg = aggregateById.get(emp.toastGuid);
      const avg = agg && agg.count > 0 ? Number((agg.avg || 0).toFixed(2)) : 0;
      rows.push({ id: emp.toastGuid, name: `${emp.firstName} ${emp.lastName}`.trim(), role: emp.jobTitles?.[0]?.title || 'Employee', avg });
    });
    return rows
      .filter(r => r.avg > 0)
      .sort((a,b)=> b.avg - a.avg)
      .slice(0,5);
  }, [hudEmployees, aggregateById]);

  const mostImprovedList = useMemo(() => {
    const items: { id: string; name: string; role: string; delta: number; prev: number; curr: number }[] = [];
    const active = hudEmployees.filter((e:any)=> e?.isActive === true);
    active.forEach((emp:any)=>{
      const curr = aggregateById.get(emp.toastGuid);
      const prev = prevAggregateById.get(emp.toastGuid);
      const currAvg = curr && curr.count > 0 ? curr.avg || 0 : 0;
      const prevAvg = prev && prev.count > 0 ? prev.avg || 0 : 0;
      const delta = Number((currAvg - prevAvg).toFixed(2));
      if (delta > 0) items.push({ id: emp.toastGuid, name: `${emp.firstName} ${emp.lastName}`.trim(), role: emp.jobTitles?.[0]?.title || 'Employee', delta, prev: prevAvg, curr: currAvg });
    });
    return items.sort((a,b)=> b.delta - a.delta).slice(0,5);
  }, [hudEmployees, aggregateById, prevAggregateById]);

  const criticalMembersList = useMemo(() => {
    const items: { id: string; name: string; role: string; red: number }[] = [];
    const active = hudEmployees.filter((e:any)=> e?.isActive === true);
    active.forEach((emp:any)=>{
      const agg = aggregateById.get(emp.toastGuid);
      const red = agg ? (agg.red || 0) : 0;
      if (red >= 2) items.push({ id: emp.toastGuid, name: `${emp.firstName} ${emp.lastName}`.trim(), role: emp.jobTitles?.[0]?.title || 'Employee', red });
    });
    return items.sort((a,b)=> b.red - a.red).slice(0,10);
  }, [hudEmployees, aggregateById]);

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
                    <p className="text-2xl font-bold text-foreground">{hudActiveCount}</p>
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
                    <p className="text-2xl font-bold text-foreground">{perfSummary.avg ?? '—'}</p>
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
                                      <p className="text-sm font-medium text-muted-foreground">Current Roster Rating</p>
                    <div className="flex items-center">
                        <Star className="h-6 w-6 text-yellow-500 mr-2" />
                        <p className="text-2xl font-bold text-foreground">{activeRosterRating.toFixed(2)}</p>
                    </div>
                                      <p className="text-xs text-muted-foreground mt-1">Average of active roster</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical Members</p>
                  <p className="text-2xl font-bold text-foreground">{criticalMembersList.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">With 2+ red flags</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <div className="overflow-x-auto md:overflow-visible">
            <TabsList className="w-max md:w-full gap-2 flex-nowrap">
              <TabsTrigger value="overview" className="flex-none md:flex-1">Team Overview</TabsTrigger>
              <TabsTrigger value="members" className="flex-none md:flex-1">Team Members</TabsTrigger>
              <TabsTrigger value="performance" className="flex-none md:flex-1">Performance</TabsTrigger>
              <TabsTrigger value="roster" className="flex-none md:flex-1">Roster</TabsTrigger>
            </TabsList>
          </div>

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
                    {departmentOverview.map((dept, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-foreground">{dept.name}</span>
                          <span className="text-sm text-muted-foreground">{dept.members} members</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${(dept.members / maxDeptMembers) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Avg Rating: {dept.avgRating === null ? '—' : dept.avgRating.toFixed(2)}/5</span>
                        </div>
                      </div>
                    ))}
                    {departmentOverview.length === 0 && (
                      <div className="text-sm text-muted-foreground">{sevenDeptLoading ? 'Loading…' : sevenDeptError ? `Error: ${sevenDeptError}` : 'No active members.'}</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Highest average ratings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leaderboardTop.map((row, index) => (
                      <div key={row.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{row.name}</p>
                            <p className="text-xs text-muted-foreground">{row.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium">{row.avg.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {leaderboardTop.length === 0 && (
                      <div className="text-sm text-muted-foreground">No ratings in the selected window.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Roster Tab */}
          <TabsContent value="roster" className="space-y-6">
            <RosterPanel />
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
                        className="pl-10 w-full sm:w-64"
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
                              <option value="performance">Performance</option>
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
                  <div className="h-24 w-full rounded mb-2 flex items-center justify-center bg-gradient-to-r from-orange-900/30 via-orange-600/20 to-orange-500/10 border border-orange-900/20">
                    <div className="text-3xl font-semibold text-foreground">{perfSummary.avg ?? '—'}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{perfLoading ? 'Loading…' : 'Live over last ' + (perfWindow==='7d'?'7 days':perfWindow==='30d'?'30 days':'90 days')}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Flags</CardTitle>
                  <CardDescription>All members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-24 w-full rounded mb-2 grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center justify-center rounded border border-red-900/30 bg-red-900/10">
                      <div className="text-lg font-semibold text-red-500">{perfSummary.red}</div>
                      <div className="text-[10px] text-muted-foreground">Red</div>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded border border-amber-900/30 bg-amber-900/10">
                      <div className="text-lg font-semibold text-amber-400">{perfSummary.yellow}</div>
                      <div className="text-[10px] text-muted-foreground">Yellow</div>
                    </div>
                    <div className="flex flex-col items-center justify-center rounded border border-sky-900/30 bg-sky-900/10">
                      <div className="text-lg font-semibold text-sky-400">{perfSummary.blue}</div>
                      <div className="text-[10px] text-muted-foreground">Blue</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">Split by red/yellow/blue</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Ratings and flags</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32 w-full rounded mb-2 overflow-auto border border-orange-900/20 bg-background/50">
                    <ul className="divide-y divide-border/60">
                      {recentPerfEntries
                        .filter((e:any)=> (showRatingFeed && typeof e.rating==='number') || (showFlagFeed && e.isFlag))
                        .slice(0,50)
                        .map((e:any, i:number)=> (
                          <li key={i} className="px-3 py-2 text-[11px] flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`inline-block w-2 h-2 rounded-full ${e.isFlag ? (e.flagType==='red'?'bg-red-500': e.flagType==='yellow'?'bg-amber-500':'bg-sky-500') : 'bg-orange-500'}`}></span>
                              <div className="text-foreground/90">
                                {e.isFlag ? (
                                  <span className="font-medium capitalize">{e.flagType} flag</span>
                                ) : (
                                  <span className="font-medium">Rating {e.rating}/5</span>
                                )}
                                {e.details ? <span className="text-muted-foreground ml-2">{e.details}</span> : null}
                                {e.employeeToastGuid ? <span className="ml-2 text-muted-foreground">• <span className="font-medium text-foreground/80">{(employees||[]).find((m:any)=> m.toastGuid===e.employeeToastGuid)?.firstName} {(employees||[]).find((m:any)=> m.toastGuid===e.employeeToastGuid)?.lastName}</span></span> : null}
                              </div>
                            </div>
                            <div className="text-muted-foreground tabular-nums">{new Date(e.createdAt).toLocaleString()}</div>
                          </li>
                        ))}
                      {recentPerfEntries.length === 0 && (
                        <li className="px-3 py-6 text-center text-muted-foreground">No recent activity</li>
                      )}
                    </ul>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span>Date window:</span>
                    <select className="h-7 px-2 border rounded bg-background text-foreground" value={perfWindow} onChange={(e)=> setPerfWindow(e.target.value as any)}>
                      <option value="7d">7 days</option>
                      <option value="30d">30 days</option>
                      <option value="90d">90 days</option>
                    </select>
                    <span>Show:</span>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={showRatingFeed} onChange={(e)=> setShowRatingFeed(e.target.checked)} /> Rating</label>
                    <label className="flex items-center gap-1"><input type="checkbox" checked={showFlagFeed} onChange={(e)=> setShowFlagFeed(e.target.checked)} /> Flags</label>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Performance Details by Member</CardTitle>
                    <CardDescription>Individual performance metrics and activity heatmap</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        placeholder="Search members..."
                        value={perfSearchTerm}
                        onChange={(e) => setPerfSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-64"
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
                            onChange={(e) => setPerfSelectedRole(e.target.value)}
                            value={perfSelectedRole}
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
                            onChange={(e) => setPerfSelectedDept(e.target.value)}
                            value={perfSelectedDept}
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
                              onChange={(e) => setPerfSortKey(e.target.value as any)}
                              value={perfSortKey}
                            >
                              <option value="name">Name</option>
                              <option value="performance">Performance</option>
                            </select>
                            <Button variant="outline" size="sm" onClick={()=> setPerfSortAsc((v)=> !v)} title="Toggle sort order">
                              {perfSortAsc ? 'Asc' : 'Desc'}
                            </Button>
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredPerformanceMembers.filter(emp => emp.isActive).map((employee) => (
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
                            <p className="font-semibold text-foreground text-xs break-all">{employee.toastGuid}</p>
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
              </CardContent>
            </Card>
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
                    {(selectedMember.jobTitles?.length || 0) > 0 ?
                      selectedMember.jobTitles?.map((job: Job, index: number) => (
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

        <Card>
          <CardHeader>
            <CardTitle>Critical Members</CardTitle>
            <CardDescription>Members with 2 or more red flags</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalMembersList.map((member: any, index: number) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-red-500">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">{member.red}</span>
                    </div>
                  </div>
                </div>
              ))}
              {criticalMembersList.length === 0 && (
                <div className="text-sm text-muted-foreground">No critical members in the selected window.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 
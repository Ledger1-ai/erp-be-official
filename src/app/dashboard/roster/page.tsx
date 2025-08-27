"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const GET_ROSTER_DATA = gql`
  query RosterData($includeToastOnly: Boolean, $onlySevenShiftsActive: Boolean) {
    rosterCandidates(includeToastOnly: $includeToastOnly, onlySevenShiftsActive: $onlySevenShiftsActive) {
      id
      name
      email
      role
      department
      toastEnrolled
      sevenShiftsEnrolled
      rating
    }
    rosterConfigurations {
      id
      name
      description
      isActive
      nodes { id name department stratum capacity assigned { userId source displayName rating } children { id name department stratum capacity assigned { userId source displayName rating } } }
      createdAt
      updatedAt
    }
    activeRosterConfiguration { id name isActive }
  }
`;

const CREATE_ROSTER = gql`
  mutation CreateRoster($input: CreateRosterInput!) {
    createRosterConfiguration(input: $input) { id name isActive }
  }
`;

const UPDATE_ROSTER = gql`
  mutation UpdateRoster($id: ID!, $input: UpdateRosterInput!) {
    updateRosterConfiguration(id: $id, input: $input) { id name isActive }
  }
`;

const SET_ACTIVE_ROSTER = gql`
  mutation SetActiveRoster($id: ID!) {
    setActiveRosterConfiguration(id: $id) { id name isActive }
  }
`;

type Stratum = "ADMIN" | "BOH" | "FOH";

type Candidate = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  department?: string;
  toastEnrolled: boolean;
  sevenShiftsEnrolled: boolean;
  rating?: number;
};

type Assignment = {
  userId: string;
  source: "TOAST" | "SEVEN_SHIFTS";
  displayName?: string;
  rating?: number;
};

type Node = {
  id: string;
  name: string;
  department: string;
  stratum: Stratum;
  capacity: number;
  assigned: Assignment[];
  children?: Node[];
};

const PRESETS: { key: string; name: string; description: string; nodes: Node[] }[] = [
  {
    key: "classic",
    name: "Classic Full-Service",
    description: "Admin, Back of House, Front of House",
    nodes: [
      { id: "admin_mgr", name: "General Manager", department: "Admin", stratum: "ADMIN", capacity: 1, assigned: [] },
      { id: "boh", name: "Back of House", department: "Kitchen", stratum: "BOH", capacity: 0, assigned: [], children: [
        { id: "chef", name: "Chef", department: "Kitchen", stratum: "BOH", capacity: 1, assigned: [] },
        { id: "line", name: "Line Cooks", department: "Kitchen", stratum: "BOH", capacity: 3, assigned: [] },
        { id: "prep", name: "Prep", department: "Kitchen", stratum: "BOH", capacity: 2, assigned: [] }
      ]},
      { id: "foh", name: "Front of House", department: "Front of House", stratum: "FOH", capacity: 0, assigned: [], children: [
        { id: "host", name: "Hosts", department: "Front of House", stratum: "FOH", capacity: 2, assigned: [] },
        { id: "server", name: "Servers", department: "Front of House", stratum: "FOH", capacity: 5, assigned: [] },
        { id: "bar", name: "Bartenders", department: "Front of House", stratum: "FOH", capacity: 2, assigned: [] }
      ]}
    ]
  },
  {
    key: "fast_casual",
    name: "Fast Casual",
    description: "Lean BOH and FOH",
    nodes: [
      { id: "admin_shift", name: "Shift Lead", department: "Admin", stratum: "ADMIN", capacity: 1, assigned: [] },
      { id: "boh_fc", name: "Kitchen", department: "Kitchen", stratum: "BOH", capacity: 0, assigned: [], children: [
        { id: "cook", name: "Cooks", department: "Kitchen", stratum: "BOH", capacity: 3, assigned: [] },
        { id: "dish", name: "Dish", department: "Kitchen", stratum: "BOH", capacity: 1, assigned: [] }
      ]},
      { id: "foh_fc", name: "FOH", department: "Front of House", stratum: "FOH", capacity: 0, assigned: [], children: [
        { id: "cash", name: "Cashiers", department: "Front of House", stratum: "FOH", capacity: 2, assigned: [] },
        { id: "runner", name: "Runners", department: "Front of House", stratum: "FOH", capacity: 2, assigned: [] }
      ]}
    ]
  }
];

function flattenNodes(nodes: Node[]): Node[] {
  const list: Node[] = [];
  const walk = (n: Node) => {
    list.push(n);
    (n.children || []).forEach(walk);
  };
  nodes.forEach(walk);
  return list;
}

function computeRatings(nodes: Node[]) {
  const flat = flattenNodes(nodes);
  const deptMap: Record<string, { sum: number; count: number }> = {};
  let total = 0, count = 0;
  flat.forEach(n => {
    const r = n.assigned.reduce((acc, a) => acc + (a.rating || 0), 0);
    const c = n.assigned.length;
    if (!deptMap[n.department]) deptMap[n.department] = { sum: 0, count: 0 };
    deptMap[n.department].sum += r;
    deptMap[n.department].count += c;
    total += r; count += c;
  });
  const byDepartment = Object.entries(deptMap).map(([department, v]) => ({ department, rating: v.count ? (v.sum / v.count) : 0 }));
  const overall = count ? (total / count) : 0;
  return { byDepartment, overall };
}

export default function RosterPage() {
  const [onlySevenShifts, setOnlySevenShifts] = useState(true);
  const [includeToastOnly, setIncludeToastOnly] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedPreset, setSelectedPreset] = useState<string>(PRESETS[0].key);
  const [nodes, setNodes] = useState<Node[]>(PRESETS[0].nodes);
  const [configName, setConfigName] = useState("");

  const { data, refetch } = useQuery(GET_ROSTER_DATA, {
    variables: { includeToastOnly, onlySevenShiftsActive: onlySevenShifts },
    fetchPolicy: "cache-and-network",
  });

  const [createRoster] = useMutation(CREATE_ROSTER, { onCompleted: () => { toast.success("Roster saved"); refetch(); } });
  const [updateRoster] = useMutation(UPDATE_ROSTER, { onCompleted: () => { toast.success("Roster updated"); refetch(); } });
  const [setActive] = useMutation(SET_ACTIVE_ROSTER, { onCompleted: () => { toast.success("Active roster set"); refetch(); } });

  const candidates: Candidate[] = data?.rosterCandidates || [];
  const configurations = data?.rosterConfigurations || [];
  const active = data?.activeRosterConfiguration?.id || null;

  useEffect(() => {
    const preset = PRESETS.find(p => p.key === selectedPreset);
    if (preset) setNodes(JSON.parse(JSON.stringify(preset.nodes)) as Node[]);
  }, [selectedPreset]);

  const onDragStart = useCallback((e: React.DragEvent, cand: Candidate) => {
    e.dataTransfer.setData("application/json", JSON.stringify(cand));
  }, []);

  const onDropOnNode = useCallback((e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    const cand: Candidate = JSON.parse(e.dataTransfer.getData("application/json"));
    setNodes(prev => {
      const clone: Node[] = JSON.parse(JSON.stringify(prev));
      const all = flattenNodes(clone);
      const node = all.find(n => n.id === nodeId);
      if (!node) return prev;
      if (node.capacity && node.assigned.length >= node.capacity) {
        toast.error("Capacity reached for this node");
        return prev;
      }
      if (node.assigned.some(a => a.userId === cand.id)) return prev;
      node.assigned.push({ userId: cand.id, source: cand.sevenShiftsEnrolled ? "SEVEN_SHIFTS" : "TOAST", displayName: cand.name, rating: cand.rating || 0 });
      return clone;
    });
  }, []);

  const onRemoveFromNode = useCallback((nodeId: string, userId: string) => {
    setNodes(prev => {
      const clone: Node[] = JSON.parse(JSON.stringify(prev));
      const all = flattenNodes(clone);
      const node = all.find(n => n.id === nodeId);
      if (!node) return prev;
      node.assigned = node.assigned.filter(a => a.userId !== userId);
      return clone;
    });
  }, []);

  const ratings = useMemo(() => computeRatings(nodes), [nodes]);

  const handleSave = async () => {
    if (!configName.trim()) {
      toast.error("Please enter a name for the configuration");
      return;
    }
    await createRoster({ variables: { input: { name: configName.trim(), description: "Custom roster", nodes } } });
    setConfigName("");
  };

  const handleSetActive = async (id: string) => {
    await setActive({ variables: { id } });
  };

  const toggleOnlySevenShifts = () => setOnlySevenShifts(v => !v);
  const toggleIncludeToastOnly = () => setIncludeToastOnly(v => !v);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant={onlySevenShifts ? "default" : "outline"} onClick={toggleOnlySevenShifts}>Only 7shifts Active</Button>
          <Button variant={includeToastOnly ? "default" : "outline"} onClick={toggleIncludeToastOnly}>Include Toast-only</Button>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPreset} onValueChange={setSelectedPreset}>
            <SelectTrigger className="w-[240px]"><SelectValue placeholder="Select preset" /></SelectTrigger>
            <SelectContent>
              {PRESETS.map(p => (<SelectItem key={p.key} value={p.key}>{p.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Input placeholder="Configuration name" value={configName} onChange={(e) => setConfigName(e.target.value)} className="w-[240px]" />
          <Button onClick={handleSave}>Save Configuration</Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Card className="p-3">
          <div className="text-sm font-medium">Overall Rating</div>
          <div className="text-2xl font-semibold">{ratings.overall.toFixed(2)}</div>
        </Card>
        {ratings.byDepartment.map(d => (
          <Card key={d.department} className="p-3">
            <div className="text-sm font-medium">{d.department || 'Unknown'} Rating</div>
            <div className="text-xl font-semibold">{d.rating.toFixed(2)}</div>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="tree">Tree View</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Candidates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {candidates.map(c => (
                  <div key={c.id} draggable onDragStart={(e) => onDragStart(e, c)} className="p-2 border rounded flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.role || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div title="Toast" className={`w-2.5 h-2.5 rounded-full ${c.toastEnrolled ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div title="7shifts" className={`w-2.5 h-2.5 rounded-full ${c.sevenShiftsEnrolled ? 'bg-green-500' : 'bg-red-500'}`} />
                      <Badge variant="secondary">{(c.rating || 0).toFixed(1)}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>By Department</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flattenNodes(nodes).filter(n => !n.children || n.children.length === 0).map(n => (
                  <div key={n.id} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDropOnNode(e, n.id)} className="p-3 border rounded min-h-[100px]">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{n.name}</div>
                      <Badge variant="outline">{n.assigned.length}/{n.capacity || '∞'}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">{n.department} • {n.stratum}</div>
                    <div className="flex flex-wrap gap-2">
                      {n.assigned.map(a => (
                        <Badge key={a.userId} className="gap-1" onClick={() => onRemoveFromNode(n.id, a.userId)}>
                          {a.displayName || a.userId} <span className="opacity-60">({(a.rating || 0).toFixed(1)})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tree">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Candidates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {candidates.map(c => (
                  <div key={c.id} draggable onDragStart={(e) => onDragStart(e, c)} className="p-2 border rounded flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.role || '—'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div title="Toast" className={`w-2.5 h-2.5 rounded-full ${c.toastEnrolled ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div title="7shifts" className={`w-2.5 h-2.5 rounded-full ${c.sevenShiftsEnrolled ? 'bg-green-500' : 'bg-red-500'}`} />
                      <Badge variant="secondary">{(c.rating || 0).toFixed(1)}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Roster Tree</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nodes.map(root => (
                    <TreeNode key={root.id} node={root} onDropOnNode={onDropOnNode} onRemove={onRemoveFromNode} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Select onValueChange={(id) => handleSetActive(id)}>
              <SelectTrigger className="w-[280px]"><SelectValue placeholder="Set active configuration" /></SelectTrigger>
              <SelectContent>
                {configurations.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name} {c.id === active ? '(Active)' : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TreeNode({ node, onDropOnNode, onRemove }: { node: Node; onDropOnNode: (e: React.DragEvent, id: string) => void; onRemove: (nodeId: string, userId: string) => void }) {
  return (
    <div className="border rounded p-3">
      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDropOnNode(e, node.id)}>
        <div className="flex items-center justify-between">
          <div className="font-semibold">{node.name}</div>
          <Badge variant="outline">{node.assigned.length}/{node.capacity || '∞'}</Badge>
        </div>
        <div className="text-xs text-muted-foreground mb-2">{node.department} • {node.stratum}</div>
        <div className="flex flex-wrap gap-2 mb-2">
          {node.assigned.map(a => (
            <Badge key={a.userId} className="gap-1" onClick={() => onRemove(node.id, a.userId)}>
              {a.displayName || a.userId} <span className="opacity-60">({(a.rating || 0).toFixed(1)})</span>
            </Badge>
          ))}
        </div>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="ml-4 space-y-3">
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} onDropOnNode={onDropOnNode} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}



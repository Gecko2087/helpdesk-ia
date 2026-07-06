import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Loader2,
  Search,
  Settings,
  Sparkles,
  Ticket,
  Wrench
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from "recharts";

const TRANSLATIONS = {
  // Prioridades
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
  
  // Estados
  open: "Abierto",
  in_progress: "En progreso",
  resolved: "Resuelto",
  closed: "Cerrado",
  
  // Canales
  whatsapp: "WhatsApp",
  email: "Email",
  llamada: "Llamada telefónica",
  presencial: "Presencial",
  sistema_interno: "Sistema Interno",

  // Confianza
  high_confidence: "Alta",
  medium_confidence: "Media",
  low_confidence: "Baja"
};

const translate = (key) => TRANSLATIONS[key] ?? key;

const formatDate = (isoString) => {
  if (!isoString) return "-";
  const date = new Date(isoString);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }) + " " + date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

function PriorityBadge({ priority }) {
  const translations = {
    low: { label: "Baja", styles: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    medium: { label: "Media", styles: "bg-amber-50 text-amber-700 border-amber-200" },
    high: { label: "Alta", styles: "bg-rose-50 text-rose-700 border-rose-200" },
    critical: { label: "Crítica", styles: "bg-red-100 text-red-800 border-red-300 font-bold" }
  };

  const item = translations[priority.toLowerCase()] ?? { label: priority, styles: "bg-gray-50 text-gray-600 border-gray-200" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${item.styles}`}>
      {item.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const translations = {
    open: { label: "Abierto", styles: "bg-blue-50 text-blue-700 border-blue-200" },
    in_progress: { label: "En progreso", styles: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    resolved: { label: "Resuelto", styles: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    closed: { label: "Cerrado", styles: "bg-gray-100 text-gray-700 border-gray-300" }
  };

  const item = translations[status.toLowerCase()] ?? { label: status, styles: "bg-gray-50 text-gray-600 border-gray-200" };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${item.styles}`}>
      {item.label}
    </span>
  );
}

// En producción Railway, el frontend y el backend comparten dominio → usar ruta relativa /api.
// En desarrollo local, VITE_API_URL puede apuntar a http://localhost:3001/api.
const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "new", label: "Nuevo ticket", icon: Ticket },
  { id: "tickets", label: "Tickets", icon: Wrench },
  { id: "categories", label: "Categorías", icon: CheckCircle2 },
  { id: "ai", label: "Configuración IA", icon: Sparkles },
  { id: "docs", label: "Documentación", icon: FileText }
];

const examples = [
  {
    label: "CRM",
    title: "No puedo ingresar al CRM",
    description: "El sistema indica usuario bloqueado y no puedo trabajar desde esta mañana.",
    requesterName: "Usuario Demo",
    requesterArea: "Ventas",
    sourceChannel: "email",
    impact: "medium",
    urgency: "high"
  },
  {
    label: "Internet",
    title: "No tengo internet",
    description: "No tengo conexión a internet en mi computadora desde esta mañana.",
    requesterName: "Usuario Demo",
    requesterArea: "Administración",
    sourceChannel: "whatsapp",
    impact: "high",
    urgency: "medium"
  },
  {
    label: "Impresora",
    title: "Impresora no responde",
    description: "La impresora de administración no responde al enviar documentos.",
    requesterName: "Usuario Demo",
    requesterArea: "Administración",
    sourceChannel: "presencial",
    impact: "medium",
    urgency: "medium"
  }
];

const emptyTicket = {
  title: "",
  description: "",
  requesterName: "",
  requesterArea: "",
  sourceChannel: "email",
  impact: "medium",
  urgency: "medium"
};

function requestJson(path, options) {
  return fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  }).then(async (response) => {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error ?? "No se pudo completar la operación");
    }
    return payload;
  });
}

export function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [dashboard, setDashboard] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [ticketForm, setTicketForm] = useState(emptyTicket);
  const [analysis, setAnalysis] = useState(null);
  const [working, setWorking] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardResponse, ticketsResponse, categoriesResponse, aiResponse] = await Promise.all([
        requestJson("/dashboard"),
        requestJson("/tickets"),
        requestJson("/categories"),
        requestJson("/ai/status")
      ]);
      setDashboard(dashboardResponse.data);
      setTickets(ticketsResponse.data);
      setCategories(categoriesResponse.data);
      setAiStatus(aiResponse);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTickets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return tickets;
    return tickets.filter((item) =>
      `${item.code} ${item.title} ${item.requesterName} ${item.description}`.toLowerCase().includes(normalized)
    );
  }, [query, tickets]);

  const pageTitle = navItems.find((item) => item.id === activeView)?.label ?? "Dashboard";

  async function analyzeCurrentTicket() {
    setWorking(true);
    setError("");
    try {
      const response = await requestJson("/tickets/analyze", {
        method: "POST",
        body: JSON.stringify(ticketForm)
      });
      setAnalysis(response.data);
    } catch (analyzeError) {
      setError(analyzeError.message);
    } finally {
      setWorking(false);
    }
  }

  async function saveCurrentTicket() {
    setWorking(true);
    setError("");
    try {
      await requestJson("/tickets", {
        method: "POST",
        body: JSON.stringify({ ...ticketForm, analysis })
      });
      setTicketForm(emptyTicket);
      setAnalysis(null);
      await loadData();
      setActiveView("tickets");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen bg-app-background text-app-text lg:flex">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <div className="min-w-0 flex-1">
        <Topbar
          title={pageTitle}
          aiStatus={aiStatus}
          query={query}
          onQueryChange={setQuery}
          onNewTicket={() => setActiveView("new")}
        />
        {error ? <ErrorBanner message={error} /> : null}
        {loading ? (
          <LoadingState />
        ) : (
          <main className="p-4 lg:p-6">
            {activeView === "dashboard" ? <DashboardView dashboard={dashboard} tickets={filteredTickets} categories={categories} /> : null}
            {activeView === "new" ? (
              <NewTicketView
                form={ticketForm}
                setForm={setTicketForm}
                analysis={analysis}
                categories={categories}
                working={working}
                onAnalyze={analyzeCurrentTicket}
                onSave={saveCurrentTicket}
                onClear={() => {
                  setTicketForm(emptyTicket);
                  setAnalysis(null);
                }}
              />
            ) : null}
            {activeView === "tickets" ? <TicketsView tickets={filteredTickets} /> : null}
            {activeView === "categories" ? <CategoriesView categories={categories} /> : null}
            {activeView === "ai" ? <AiConfigView aiStatus={aiStatus} /> : null}
            {activeView === "docs" ? <DocsView /> : null}
          </main>
        )}
      </div>
    </div>
  );
}

function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className="hidden min-h-screen w-[248px] shrink-0 bg-app-sidebar px-4 py-5 text-white lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/5">
          <Ticket size={21} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-5">HelpDesk IA</p>
          <p className="text-xs text-white/55">IT Command Desk</p>
        </div>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeView;
          return (
            <button
              key={item.id}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition ${
                active ? "bg-app-accent text-white" : "text-white/72 hover:bg-white/10 hover:text-white"
              }`}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function Topbar({ title, aiStatus, query, onQueryChange, onNewTicket }) {
  return (
    <header className="flex flex-col gap-3 border-b border-app-border bg-app-background/95 px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
      <div>
        <h1 className="text-2xl font-bold leading-tight text-app-text">{title}</h1>
        <p className="text-sm text-app-secondary">Vista operativa para seguimiento y análisis de tickets.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex h-10 items-center gap-2 rounded-md border border-app-border bg-app-surface px-3 text-sm text-app-secondary shadow-subtle">
          <Search size={16} />
          <input
            className="w-full bg-transparent outline-none sm:w-48"
            placeholder="Buscar ticket"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </label>
        <AiStatusIndicator aiStatus={aiStatus} />
        <button
          className="h-10 rounded-md bg-app-accent px-4 text-sm font-semibold text-white transition hover:bg-[#14874b]"
          type="button"
          onClick={onNewTicket}
        >
          Nuevo ticket
        </button>
      </div>
    </header>
  );
}

function AiStatusIndicator({ aiStatus }) {
  const demoMode = aiStatus?.demoMode ?? true;
  return (
    <div className="flex items-center gap-2 rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text shadow-subtle">
      <span className={`h-2.5 w-2.5 rounded-full ${demoMode ? "bg-app-medium" : "bg-app-accent"}`} />
      <span className="font-semibold">{demoMode ? "Modo demo" : "Gemini activo"}</span>
      <span className="hidden text-app-secondary sm:inline">{aiStatus?.model ?? "Sin modelo"}</span>
    </div>
  );
}

function DashboardView({ dashboard, tickets, categories }) {
  const metrics = dashboard?.metrics ?? {};

  const priorityColors = {
    low: "#10b981",
    medium: "#f59e0b",
    high: "#e56b2f",
    critical: "#d92d20"
  };

  const getCategoryColor = (name) => {
    const cat = categories.find((c) => c.name === name);
    return cat ? cat.color : "#9ca3af";
  };

  const categoryChartData = useMemo(() => {
    if (!dashboard?.byCategory) return [];
    return dashboard.byCategory;
  }, [dashboard]);

  const priorityChartData = useMemo(() => {
    if (!dashboard?.byPriority) return [];
    const priorityLabels = {
      low: "Baja",
      medium: "Media",
      high: "Alta",
      critical: "Crítica"
    };
    return dashboard.byPriority.map((item) => ({
      name: priorityLabels[item.name.toLowerCase()] ?? item.name,
      count: item.count,
      rawName: item.name.toLowerCase()
    }));
  }, [dashboard]);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Total tickets" value={metrics.totalTickets ?? 0} detail="Tickets registrados" />
        <MetricTile label="Abiertos" value={metrics.openTickets ?? 0} detail="Pendientes de atención" />
        <MetricTile label="En progreso" value={metrics.inProgressTickets ?? 0} detail="En tratamiento" />
        <MetricTile label="Analizados IA" value={metrics.analyzedTickets ?? 0} detail="Gemini o demo" />
      </div>

      {/* Gráficos de Recharts */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle flex flex-col min-h-[300px]">
          <h2 className="text-sm font-bold text-app-text mb-4 uppercase tracking-wider text-slate-500">Distribución por Categoría</h2>
          <div className="flex-1 w-full min-h-[200px] flex items-center justify-center">
            {categoryChartData.length === 0 ? (
              <p className="text-sm text-app-secondary">Sin datos de categorías</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tickets`, "Cantidad"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle flex flex-col min-h-[300px]">
          <h2 className="text-sm font-bold text-app-text mb-4 uppercase tracking-wider text-slate-500">Distribución por Prioridad</h2>
          <div className="flex-1 w-full min-h-[200px] flex items-center justify-center">
            {priorityChartData.length === 0 ? (
              <p className="text-sm text-app-secondary">Sin datos de prioridad</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityChartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip formatter={(value) => [`${value} tickets`, "Cantidad"]} cursor={{ fill: 'rgba(0, 0, 0, 0.02)' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={priorityColors[entry.rawName] ?? "#9ca3af"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_340px]">
        <section className="rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
          <h2 className="text-base font-bold text-app-text">Tickets recientes</h2>
          <TicketList tickets={tickets.slice(0, 6)} compact />
        </section>
        <section className="rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-app-high" size={18} />
            <h2 className="text-base font-bold text-app-text">Riesgos del día</h2>
          </div>
          <TicketList tickets={dashboard?.dailyRisks ?? []} compact />
        </section>
      </div>
    </>
  );
}

function NewTicketView({ form, setForm, analysis, working, onAnalyze, onSave, onClear }) {
  const canAnalyze = form.title.length >= 5 && form.description.length >= 20 && form.requesterName && form.requesterArea;
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <section className="rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
        <div className="mb-4 flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example.label}
              className="rounded-md border border-app-border px-3 py-2 text-sm font-semibold hover:border-app-accent"
              type="button"
              onClick={() => {
                setForm(example);
              }}
            >
              {example.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Título" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <Field
            label="Solicitante"
            value={form.requesterName}
            onChange={(value) => setForm({ ...form, requesterName: value })}
          />
          <Field
            label="Área"
            value={form.requesterArea}
            onChange={(value) => setForm({ ...form, requesterArea: value })}
          />
          <SelectField
            label="Canal"
            value={form.sourceChannel}
            options={["whatsapp", "email", "llamada", "presencial", "sistema_interno"]}
            onChange={(value) => setForm({ ...form, sourceChannel: value })}
          />
          <SelectField
            label="Impacto"
            value={form.impact}
            options={["low", "medium", "high"]}
            onChange={(value) => setForm({ ...form, impact: value })}
          />
          <SelectField
            label="Urgencia"
            value={form.urgency}
            options={["low", "medium", "high"]}
            onChange={(value) => setForm({ ...form, urgency: value })}
          />
        </div>
        <label className="mt-3 block">
          <span className="text-[13px] font-semibold text-app-secondary">Descripción</span>
          <textarea
            className="mt-1 min-h-28 w-full rounded-md border border-app-border bg-white px-3 py-2 text-sm outline-none focus:border-app-accent"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-md bg-app-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!canAnalyze || working} type="button" onClick={onAnalyze}>
            {working ? "Procesando..." : "Analizar con IA"}
          </button>
          <button className="rounded-md border border-app-border px-4 py-2 text-sm font-semibold disabled:opacity-50" disabled={!analysis || working} type="button" onClick={onSave}>
            Guardar ticket
          </button>
          <button className="rounded-md border border-app-border px-4 py-2 text-sm font-semibold" type="button" onClick={onClear}>
            Limpiar
          </button>
        </div>
      </section>
      <AnalysisPanel analysis={analysis} />
    </div>
  );
}

function TicketsView({ tickets }) {
  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
      <h2 className="mb-3 text-base font-bold">Historial de tickets</h2>
      <TicketList tickets={tickets} />
    </section>
  );
}

function TicketList({ tickets, compact = false }) {
  if (!tickets.length) {
    return <div className="mt-3 rounded-md border border-dashed border-app-border bg-app-muted p-4 text-sm text-app-secondary">Sin datos para mostrar.</div>;
  }

  if (compact) {
    return (
      <div className="mt-3 divide-y divide-app-border overflow-hidden rounded-md border border-app-border bg-white">
        {tickets.map((ticketItem) => (
          <div key={ticketItem.id} className="flex items-center justify-between p-3 text-sm hover:bg-slate-50 transition-colors">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1 pr-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">{ticketItem.code}</span>
                <span className="truncate text-slate-800 font-medium">{ticketItem.title}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-app-secondary">
                <span>{ticketItem.requesterName}</span>
                <span>•</span>
                <span>{formatDate(ticketItem.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <PriorityBadge priority={ticketItem.priority} />
              <StatusBadge status={ticketItem.status} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-x-auto rounded-md border border-app-border bg-white shadow-sm">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-app-border text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="py-3 px-4 font-semibold">Código</th>
            <th className="py-3 px-4 font-semibold">Título</th>
            <th className="py-3 px-4 font-semibold hidden md:table-cell">Solicitante</th>
            <th className="py-3 px-4 font-semibold hidden sm:table-cell">Categoría</th>
            <th className="py-3 px-4 font-semibold">Prioridad</th>
            <th className="py-3 px-4 font-semibold">Estado</th>
            <th className="py-3 px-4 font-semibold hidden lg:table-cell">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-app-border text-slate-700">
          {tickets.map((ticketItem) => (
            <tr key={ticketItem.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{ticketItem.code}</td>
              <td className="py-3 px-4 font-medium text-slate-800">
                <div>{ticketItem.title}</div>
                <div className="text-xs text-app-secondary md:hidden mt-0.5">
                  Solicitado por {ticketItem.requesterName} ({ticketItem.requesterArea})
                </div>
                <div className="text-xs text-app-secondary sm:hidden mt-0.5">
                  Categoría: {ticketItem.category?.name ?? "Sin categoría"}
                </div>
                <div className="text-xs text-app-secondary lg:hidden mt-0.5">
                  Fecha: {formatDate(ticketItem.createdAt)}
                </div>
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                <div>{ticketItem.requesterName}</div>
                <div className="text-xs text-app-secondary">{ticketItem.requesterArea}</div>
              </td>
              <td className="py-3 px-4 hidden sm:table-cell whitespace-nowrap">
                {ticketItem.category ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ticketItem.category.color }} />
                    {ticketItem.category.name}
                  </span>
                ) : (
                  <span className="text-slate-400">Sin categoría</span>
                )}
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <PriorityBadge priority={ticketItem.priority} />
              </td>
              <td className="py-3 px-4 whitespace-nowrap">
                <StatusBadge status={ticketItem.status} />
              </td>
              <td className="py-3 px-4 hidden lg:table-cell text-slate-500 whitespace-nowrap">
                {formatDate(ticketItem.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoriesView({ categories }) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => (
        <div key={category.id} className="rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: category.color }} />
            <h2 className="font-bold">{category.name}</h2>
          </div>
          <p className="text-sm text-app-secondary">{category.description}</p>
          <p className="mt-3 text-xs font-semibold text-app-text">{category.responsibleArea}</p>
        </div>
      ))}
    </section>
  );
}

function AiConfigView({ aiStatus }) {
  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
      <h2 className="text-base font-bold">Configuración IA</h2>
      <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
        <Info label="Proveedor" value={aiStatus?.provider ?? "No configurado"} />
        <Info label="Modelo" value={aiStatus?.model ?? "-"} />
        <Info label="Modo demo" value={aiStatus?.demoMode ? "Activo" : "Inactivo"} />
      </dl>
      <p className="mt-4 text-sm text-app-secondary">La API key se guarda solamente en el backend mediante variable de entorno.</p>
    </section>
  );
}

function DocsView() {
  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
      <h2 className="text-base font-bold">Documentación del proyecto</h2>
      <p className="mt-2 text-sm text-app-secondary">HelpDesk IA centraliza tickets internos, usa Gemini desde backend y mantiene modo demo como respaldo para la defensa.</p>
    </section>
  );
}

function AnalysisPanel({ analysis }) {
  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
      <div className="flex items-center gap-2">
        <Sparkles className="text-app-accent" size={18} />
        <h2 className="text-base font-bold text-app-text">Diagnóstico IA</h2>
      </div>
      {!analysis ? (
        <p className="mt-3 text-sm text-app-secondary">Carga un caso y presiona Analizar con IA.</p>
      ) : (
        <div className="mt-4 space-y-3 text-sm">
          <Info label="Proveedor" value={analysis.provider} />
          <Info label="Categoría" value={analysis.category} />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase text-app-secondary">Prioridad</span>
            <div>
              <PriorityBadge priority={analysis.priority} />
            </div>
          </div>
          <Info label="Confianza" value={translate(analysis.confidence + "_confidence")} />
          {analysis.warning ? <p className="rounded-md bg-app-muted p-3 text-app-high">{analysis.warning}</p> : null}
          <p className="text-app-secondary">{analysis.summary}</p>
          <ol className="list-decimal space-y-1 pl-5">
            {analysis.suggestedSteps?.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="rounded-md bg-app-muted p-3">{analysis.suggestedReply}</p>
        </div>
      )}
    </section>
  );
}

function MetricTile({ label, value, detail }) {
  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
      <p className="text-[13px] font-semibold text-app-secondary">{label}</p>
      <p className="mt-2 text-[28px] font-bold leading-none text-app-text">{value}</p>
      <p className="mt-2 text-xs text-app-secondary">{detail}</p>
    </section>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-app-secondary">{label}</span>
      <input className="mt-1 h-10 w-full rounded-md border border-app-border px-3 text-sm outline-none focus:border-app-accent" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-app-secondary">{label}</span>
      <select className="mt-1 h-10 w-full rounded-md border border-app-border bg-white px-3 text-sm outline-none focus:border-app-accent" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {TRANSLATIONS[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-app-secondary">{label}</p>
      <p className="text-sm font-semibold text-app-text">{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center gap-2 p-6 text-sm text-app-secondary">
      <Loader2 className="animate-spin" size={18} />
      Cargando datos del backend...
    </div>
  );
}

function ErrorBanner({ message }) {
  return <div className="border-b border-app-border bg-[#fff4ed] px-6 py-3 text-sm font-semibold text-app-high">{message}</div>;
}

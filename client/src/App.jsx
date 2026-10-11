import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  Loader2,
  Menu,
  Search,
  Sparkles,
  Ticket,
  Wrench,
  X
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
  waiting_user: "Esperando usuario",
  resolved: "Resuelto",
  closed: "Cerrado",
  
  // Canales
  whatsapp: "WhatsApp",
  email: "Correo electrónico",
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
    waiting_user: { label: "Esperando usuario", styles: "bg-amber-50 text-amber-700 border-amber-200" },
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
  { id: "dashboard", label: "Resumen", icon: LayoutDashboard },
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
    credentials: "include",
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
  const [initialLoadFailed, setInitialLoadFailed] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [ticketForm, setTicketForm] = useState(emptyTicket);
  const [analysis, setAnalysis] = useState(null);
  const [working, setWorking] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailFeedback, setDetailFeedback] = useState("");
  const [statusDraft, setStatusDraft] = useState("open");
  const [noteDraft, setNoteDraft] = useState("");
  const [detailMutation, setDetailMutation] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavTriggerRef = useRef(null);
  const mobileNavFirstItemRef = useRef(null);
  const mobileNavDestinationRef = useRef(null);
  const formRevision = useRef(0);
  const detailRevision = useRef(0);
  const detailMutationRef = useRef(null);
  const detailHeadingRef = useRef(null);
  const detailTriggerRef = useRef(null);
  const hasLoaded = useRef(false);

  function updateTicketForm(nextForm) {
    formRevision.current += 1;
    setTicketForm(nextForm);
    setAnalysis(null);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    setInitialLoadFailed(false);
    setError("");
    try {
      await requestJson('/demo/session', { method: 'POST' });
      const [dashboardResponse, ticketsResponse, categoriesResponse, aiResponse] = await Promise.all([
        requestJson("/dashboard"),
        requestJson("/tickets"),
        requestJson("/categories"),
        requestJson("/ai/status")
      ]);
      if (!dashboardResponse.data?.metrics || !Array.isArray(ticketsResponse.data) || !Array.isArray(categoriesResponse.data) || typeof aiResponse?.demoMode !== "boolean") {
        throw new Error("No se pudieron cargar todos los datos del espacio de prueba");
      }
      setDashboard(dashboardResponse.data);
      setTickets(ticketsResponse.data);
      setCategories(categoriesResponse.data);
      setAiStatus(aiResponse);
      hasLoaded.current = true;
    } catch (loadError) {
      if (hasLoaded.current) {
        setError(loadError.message);
      } else {
        setInitialLoadFailed(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    mobileNavFirstItemRef.current?.focus();
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
        mobileNavTriggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileNavOpen]);

  useEffect(() => {
    if (activeView === "tickets" && selectedTicketId !== null) {
      requestAnimationFrame(() => detailHeadingRef.current?.focus());
    }
  }, [selectedTicketId]);

  useEffect(() => {
    if (activeView !== "tickets" || selectedTicketId === null || mobileNavOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === "Escape") closeTicketDetail();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [activeView, mobileNavOpen, selectedTicketId]);

  const filteredTickets = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return tickets;
    return tickets.filter((item) =>
      `${item.code} ${item.title} ${item.requesterName} ${item.description}`.toLowerCase().includes(normalized)
    );
  }, [query, tickets]);

  const pageTitle = navItems.find((item) => item.id === activeView)?.label ?? "Dashboard";

  async function analyzeCurrentTicket() {
    const revision = formRevision.current;
    setWorking(true);
    setError("");
    setAnalysis(null);
    try {
      const response = await requestJson("/tickets/analyze", {
        method: "POST",
        body: JSON.stringify(ticketForm)
      });
      if (revision === formRevision.current) setAnalysis(response.data);
    } catch (analyzeError) {
      if (revision === formRevision.current) setError(analyzeError.message);
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
      updateTicketForm(emptyTicket);
      await loadData();
      navigateView("tickets");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setWorking(false);
    }
  }

  async function openTicketDetail(id, trigger) {
    const revision = ++detailRevision.current;
    detailTriggerRef.current = trigger;
    setSelectedTicketId(id);
    setTicketDetail(null);
    setDetailLoading(true);
    setDetailError("");
    setDetailFeedback("");
    setNoteDraft("");
    detailMutationRef.current = null;
    setDetailMutation(null);
    try {
      const response = await requestJson(`/tickets/${id}`);
      if (revision !== detailRevision.current) return;
      setTicketDetail(response.data);
      setStatusDraft(response.data.status);
    } catch (loadError) {
      if (revision === detailRevision.current) setDetailError(loadError.message);
    } finally {
      if (revision === detailRevision.current) setDetailLoading(false);
    }
  }

  function clearTicketDetail({ restoreFocus = false } = {}) {
    const trigger = detailTriggerRef.current;
    detailTriggerRef.current = null;
    detailRevision.current += 1;
    detailMutationRef.current = null;
    setSelectedTicketId(null);
    setTicketDetail(null);
    setDetailLoading(false);
    setDetailError("");
    setDetailFeedback("");
    setDetailMutation(null);
    if (restoreFocus && trigger) {
      requestAnimationFrame(() => {
        if (trigger.isConnected && trigger.getClientRects().length > 0) trigger.focus();
      });
    }
  }

  function closeTicketDetail() {
    clearTicketDetail({ restoreFocus: true });
  }

  function navigateView(view) {
    if (view !== "tickets" && selectedTicketId !== null) clearTicketDetail();
    setActiveView(view);
  }

  function mergeTicket(updatedTicket) {
    setTickets((current) => current.map((item) => item.id === updatedTicket.id ? { ...item, ...updatedTicket } : item));
  }

  async function saveTicketStatus(event) {
    event.preventDefault();
    if (!ticketDetail || statusDraft === ticketDetail.status || detailMutationRef.current) return;
    const revision = detailRevision.current;
    const mutation = { revision };
    detailMutationRef.current = mutation;
    setDetailMutation("status");
    setDetailError("");
    setDetailFeedback("");
    try {
      const response = await requestJson(`/tickets/${ticketDetail.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: statusDraft })
      });
      if (revision !== detailRevision.current) return;
      setTicketDetail(response.data);
      mergeTicket(response.data);
      setDetailFeedback("Estado guardado.");
      try {
        const dashboardResponse = await requestJson("/dashboard");
        if (revision === detailRevision.current) setDashboard(dashboardResponse.data);
      } catch {
        if (revision === detailRevision.current) setDetailFeedback("Estado guardado. Las métricas se actualizarán al recargar.");
      }
    } catch (statusError) {
      if (revision === detailRevision.current) setDetailError(statusError.message);
    } finally {
      if (detailMutationRef.current === mutation) {
        detailMutationRef.current = null;
        if (revision === detailRevision.current) setDetailMutation(null);
      }
    }
  }

  async function addTicketNote(event) {
    event.preventDefault();
    const content = noteDraft.trim();
    if (!ticketDetail || content.length < 2 || detailMutationRef.current) return;
    const revision = detailRevision.current;
    const mutation = { revision };
    detailMutationRef.current = mutation;
    setDetailMutation("note");
    setDetailError("");
    setDetailFeedback("");
    try {
      const response = await requestJson(`/tickets/${ticketDetail.id}/notes`, {
        method: "POST",
        body: JSON.stringify({ content })
      });
      if (revision !== detailRevision.current) return;
      setTicketDetail(response.data);
      mergeTicket(response.data);
      setNoteDraft("");
      setDetailFeedback("Nota ficticia agregada.");
    } catch (noteError) {
      if (revision === detailRevision.current) setDetailError(noteError.message);
    } finally {
      if (detailMutationRef.current === mutation) {
        detailMutationRef.current = null;
        if (revision === detailRevision.current) setDetailMutation(null);
      }
    }
  }

  if (!hasLoaded.current && (loading || initialLoadFailed)) {
    return <InitialAccessState loading={loading} onRetry={loadData} />;
  }

  return (
    <div className="min-h-screen bg-app-background text-app-text lg:flex">
      <Sidebar activeView={activeView} onNavigate={navigateView} />
      <div className="min-w-0 flex-1">
        <Topbar
          title={pageTitle}
          activeView={activeView}
          mobileNavOpen={mobileNavOpen}
          onMobileNavOpenChange={setMobileNavOpen}
          mobileNavTriggerRef={mobileNavTriggerRef}
          mobileNavFirstItemRef={mobileNavFirstItemRef}
          mobileNavDestinationRef={mobileNavDestinationRef}
          onNavigate={(view) => {
            navigateView(view);
            setMobileNavOpen(false);
            requestAnimationFrame(() => mobileNavDestinationRef.current?.focus());
          }}
          aiStatus={aiStatus}
          query={query}
          onQueryChange={setQuery}
          onNewTicket={() => {
            navigateView("new");
            setMobileNavOpen(false);
          }}
        />
        {error ? <ErrorBanner message={error} /> : null}
        {loading ? (
          <LoadingState />
        ) : (
          <main className="p-4 lg:p-6">
            {activeView === "dashboard" ? <DashboardView dashboard={dashboard} tickets={filteredTickets} categories={categories} aiStatus={aiStatus} onNewTicket={() => navigateView("new")} /> : null}
            {activeView === "new" ? (
              <NewTicketView
                form={ticketForm}
                setForm={updateTicketForm}
                analysis={analysis}
                aiStatus={aiStatus}
                categories={categories}
                working={working}
                onAnalyze={analyzeCurrentTicket}
                onSave={saveCurrentTicket}
                onClear={() => {
                  updateTicketForm(emptyTicket);
                }}
              />
            ) : null}
            {activeView === "tickets" ? (
              <TicketsView
                tickets={filteredTickets}
                selectedTicketId={selectedTicketId}
                ticketDetail={ticketDetail}
                detailLoading={detailLoading}
                detailError={detailError}
                detailFeedback={detailFeedback}
                detailHeadingRef={detailHeadingRef}
                statusDraft={statusDraft}
                noteDraft={noteDraft}
                detailMutation={detailMutation}
                onOpenTicket={openTicketDetail}
                onCloseTicket={closeTicketDetail}
                onRetryTicket={() => openTicketDetail(selectedTicketId, detailTriggerRef.current)}
                onStatusDraftChange={setStatusDraft}
                onSaveStatus={saveTicketStatus}
                onNoteDraftChange={setNoteDraft}
                onAddNote={addTicketNote}
              />
            ) : null}
            {activeView === "categories" ? <CategoriesView categories={categories} /> : null}
            {activeView === "ai" ? <AiConfigView aiStatus={aiStatus} /> : null}
            {activeView === "docs" ? <DocsView /> : null}
          </main>
        )}
      </div>
    </div>
  );
}

function InitialAccessState({ loading, onRetry }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-app-background p-4 text-app-text">
      <section className="w-full max-w-lg rounded-lg border border-app-border bg-app-surface p-6 shadow-subtle">
        <p className="text-xs font-bold uppercase tracking-wider text-app-accent">HelpDesk IA · espacio de prueba</p>
        {loading ? (
          <div className="mt-5 flex items-center gap-3 text-sm text-app-secondary" role="status">
            <Loader2 className="animate-spin" size={20} />
            Abriendo tu espacio de prueba...
          </div>
        ) : (
          <div role="alert">
            <h1 className="mt-3 text-xl font-bold">No pudimos abrir tu espacio de prueba</h1>
            <p className="mt-2 text-sm text-app-secondary">Los datos todavía no están disponibles. Reintentá en unos momentos; si el problema continúa, volvé más tarde.</p>
            <button className="mt-5 rounded-md bg-app-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#14874b]" type="button" onClick={onRetry}>
              Reintentar
            </button>
          </div>
        )}
      </section>
    </main>
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
              aria-current={active ? "page" : undefined}
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

function Topbar({ title, activeView, mobileNavOpen, onMobileNavOpenChange, mobileNavTriggerRef, mobileNavFirstItemRef, mobileNavDestinationRef, onNavigate, aiStatus, query, onQueryChange, onNewTicket }) {
  return (
    <header className="flex flex-col gap-3 border-b border-app-border bg-app-background/95 px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-6">
      <div>
        <div className="flex items-start gap-3">
          <div className="relative lg:hidden">
            <button
              ref={mobileNavTriggerRef}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-app-border bg-app-surface text-app-text shadow-subtle"
              type="button"
              aria-label={mobileNavOpen ? "Cerrar navegación" : "Abrir navegación"}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-primary-navigation"
              onClick={() => onMobileNavOpenChange(!mobileNavOpen)}
            >
              {mobileNavOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
            {mobileNavOpen ? (
              <nav
                id="mobile-primary-navigation"
                aria-label="Navegación principal"
                className="absolute left-0 top-full z-40 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-app-border bg-app-sidebar p-2 text-white shadow-subtle"
              >
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = item.id === activeView;
                  return (
                    <button
                      key={item.id}
                      ref={index === 0 ? mobileNavFirstItemRef : undefined}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition ${
                        active ? "bg-app-accent text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                      type="button"
                      onClick={() => onNavigate(item.id)}
                    >
                      <Icon size={18} aria-hidden="true" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            ) : null}
          </div>
          <h1 ref={mobileNavDestinationRef} tabIndex={-1} className="text-2xl font-bold leading-tight text-app-text">{title}</h1>
        </div>
        <p className="text-sm text-app-secondary">Demo con API y base de datos. Tu espacio vence en una hora. Usá datos ficticios.</p>
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
  const knownMode = typeof aiStatus?.demoMode === "boolean";
  const label = !knownMode ? "Estado IA no disponible" : aiStatus.demoMode ? "Modo demo" : "Gemini configurado";
  return (
    <div className="flex items-center gap-2 rounded-md border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text shadow-subtle">
      <span className={`h-2.5 w-2.5 rounded-full ${knownMode && !aiStatus.demoMode ? "bg-app-accent" : "bg-app-medium"}`} />
      <span className="font-semibold">{label}</span>
      {aiStatus?.model ? <span className="hidden text-app-secondary sm:inline">{aiStatus.model}</span> : null}
    </div>
  );
}

function DashboardView({ dashboard, tickets, categories, aiStatus, onNewTicket }) {
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
  const totalCategoryTickets = categoryChartData.reduce((total, entry) => total + entry.count, 0);

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
      <section className="mb-4 flex flex-col gap-4 rounded-lg border border-app-border bg-app-surface p-5 shadow-subtle md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-app-accent">Espacio de prueba · datos ficticios</p>
          <h2 className="mt-1 text-xl font-bold text-app-text">Explorá una mesa de ayuda en funcionamiento</h2>
          <p className="mt-2 max-w-2xl text-sm text-app-secondary">
            Este espacio empieza con tres tickets de ejemplo y sus categorías. Revisá el tablero y probá el análisis con un caso ficticio.
            {typeof aiStatus?.demoMode === "boolean" ? (aiStatus.demoMode ? " El modo demo usa reglas locales." : " Gemini está configurado para nuevos análisis; cada resultado indica el proveedor que respondió.") : " El estado del análisis no está disponible."}
          </p>
        </div>
        <button className="shrink-0 rounded-md bg-app-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#14874b]" type="button" onClick={onNewTicket}>
          Probar un análisis
        </button>
      </section>
      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile label="Total tickets" value={metrics.totalTickets ?? 0} detail="Tickets registrados" />
        <MetricTile label="Abiertos" value={metrics.openTickets ?? 0} detail="Pendientes de atención" />
        <MetricTile label="En progreso" value={metrics.inProgressTickets ?? 0} detail="En tratamiento" />
        <MetricTile label="Con análisis" value={metrics.analyzedTickets ?? 0} detail="Gemini o reglas" />
      </div>

      {/* Gráficos de Recharts */}
      <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
        <section className="min-w-0 rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle flex flex-col min-h-[300px]">
          <h2 className="text-sm font-bold text-app-text mb-4 uppercase tracking-wider text-slate-500">Distribución por Categoría</h2>
          <div className="flex min-w-0 w-full flex-1 flex-col items-center justify-center gap-3">
            {categoryChartData.length === 0 ? (
              <p className="text-sm text-app-secondary">Sin datos de categorías</p>
            ) : (
              <>
                <div className="h-[190px] w-full min-w-0">
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
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} tickets`, "Cantidad"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="grid w-full min-w-0 grid-cols-1 gap-x-3 gap-y-1.5 sm:grid-cols-2" aria-label="Categorías y cantidad de tickets">
                  {categoryChartData.map((entry, index) => (
                    <li key={`category-legend-${index}`} className="flex min-w-0 items-start gap-2 text-xs text-app-secondary">
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getCategoryColor(entry.name) }} aria-hidden="true" />
                      <span className="min-w-0 flex-1 break-words">{entry.name}</span>
                      <span className="shrink-0 font-semibold text-app-text">
                        {entry.count} ({totalCategoryTickets ? Math.round((entry.count / totalCategoryTickets) * 100) : 0}%)
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        <section className="min-w-0 rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle flex flex-col min-h-[300px]">
          <h2 className="text-sm font-bold text-app-text mb-4 uppercase tracking-wider text-slate-500">Distribución por Prioridad</h2>
          <div className="flex h-[220px] min-w-0 w-full items-center justify-center">
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

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[1fr_340px]">
        <section className="min-w-0 rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
          <h2 className="text-base font-bold text-app-text">Tickets recientes</h2>
          <TicketList tickets={tickets.slice(0, 6)} compact />
        </section>
        <section className="min-w-0 rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
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

function NewTicketView({ form, setForm, analysis, aiStatus, working, onAnalyze, onSave, onClear }) {
  const canAnalyze = form.title.trim().length >= 5 && form.description.trim().length >= 20 &&
    form.requesterName.trim().length >= 2 && form.requesterArea.trim().length >= 2;
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <section className="rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
        <h2 className="text-base font-bold text-app-text">Nuevo caso de prueba</h2>
        <p className="mb-4 mt-1 text-sm text-app-secondary">Elegí un ejemplo o escribí un caso ficticio. Analizalo y guardalo para ver cómo aparece en el tablero.</p>
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
        <div className="mt-4 rounded-md border border-app-border bg-app-muted p-3 text-sm text-app-secondary">
          {typeof aiStatus?.demoMode !== "boolean" ? (
            <p>El estado del análisis no está disponible. Volvé a cargar la página antes de analizar un caso.</p>
          ) : aiStatus.demoMode ? (
            <p>Modo demo: el análisis usa reglas locales y no envía el ticket a Gemini. Usá solo datos ficticios en este espacio público.</p>
          ) : (
            <p>
              Antes de analizar: usá solo datos ficticios. El título, la descripción, el área y otros detalles del caso se envían desde el servidor a Google Gemini.
              Google indica que el contenido del nivel gratuito puede usarse para mejorar sus productos.{' '}
              <a className="font-semibold text-app-accent underline" href="https://ai.google.dev/gemini-api/docs/pricing" target="_blank" rel="noreferrer">Ver política de Google</a>.
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-md bg-app-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!canAnalyze || working || typeof aiStatus?.demoMode !== "boolean"} type="button" onClick={onAnalyze}>
            {working ? "Procesando..." : aiStatus?.demoMode === true ? "Analizar con reglas" : aiStatus?.demoMode === false ? "Analizar con Gemini" : "Análisis no disponible"}
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

const ticketStatuses = ["open", "in_progress", "waiting_user", "resolved", "closed"];

function TicketsView({
  tickets,
  selectedTicketId,
  ticketDetail,
  detailLoading,
  detailError,
  detailFeedback,
  detailHeadingRef,
  statusDraft,
  noteDraft,
  detailMutation,
  onOpenTicket,
  onCloseTicket,
  onRetryTicket,
  onStatusDraftChange,
  onSaveStatus,
  onNoteDraftChange,
  onAddNote
}) {
  return (
    <section className="min-w-0 rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
      <h2 className="mb-3 text-base font-bold">Historial de tickets</h2>
      {selectedTicketId !== null ? (
        <TicketDetail
          ticket={ticketDetail}
          loading={detailLoading}
          error={detailError}
          feedback={detailFeedback}
          headingRef={detailHeadingRef}
          statusDraft={statusDraft}
          noteDraft={noteDraft}
          detailMutation={detailMutation}
          onClose={onCloseTicket}
          onRetry={onRetryTicket}
          onStatusDraftChange={onStatusDraftChange}
          onSaveStatus={onSaveStatus}
          onNoteDraftChange={onNoteDraftChange}
          onAddNote={onAddNote}
        />
      ) : null}
      <TicketList tickets={tickets} onOpenTicket={onOpenTicket} />
    </section>
  );
}

function TicketDetail({
  ticket,
  loading,
  error,
  feedback,
  headingRef,
  statusDraft,
  noteDraft,
  detailMutation,
  onClose,
  onRetry,
  onStatusDraftChange,
  onSaveStatus,
  onNoteDraftChange,
  onAddNote
}) {
  const provider = ticket?.aiStatus === "not_analyzed"
    ? "No analizado"
    : ticket?.aiProvider === "gemini" ? "Gemini" : ticket?.aiProvider === "demo" ? "Reglas locales" : "No informado";

  return (
    <section className="mb-4 rounded-lg border border-app-accent bg-white p-4" aria-labelledby="ticket-detail-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-app-accent">Detalle del ticket</p>
          <h3 id="ticket-detail-title" ref={headingRef} tabIndex={-1} className="mt-1 break-words text-lg font-bold">
            {ticket ? `${ticket.code} · ${ticket.title}` : error ? "No se pudo cargar el ticket" : "Cargando ticket"}
          </h3>
        </div>
        <button className="rounded-md border border-app-border px-3 py-2 text-sm font-semibold" type="button" onClick={onClose}>
          Volver al historial
        </button>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-app-secondary" role="status">
          <Loader2 className="animate-spin" size={18} />
          Cargando detalle...
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
          <p>{error}</p>
          {!ticket ? <button className="mt-2 font-semibold underline" type="button" onClick={onRetry}>Reintentar</button> : null}
        </div>
      ) : null}
      <div aria-live="polite">
        {feedback ? <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{feedback}</p> : null}
      </div>

      {ticket ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
            {ticket.category ? <span className="rounded border border-app-border px-2 py-0.5 text-xs font-semibold">{ticket.category.name}</span> : null}
          </div>

          <div className="grid gap-3 rounded-md bg-app-muted p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <DetailInfo label="Solicitante" value={`${ticket.requesterName} · ${ticket.requesterArea}`} />
            <DetailInfo label="Canal" value={translate(ticket.sourceChannel)} />
            <DetailInfo label="Impacto / urgencia" value={`${translate(ticket.impact)} / ${translate(ticket.urgency)}`} />
            <DetailInfo label="Creado" value={formatDate(ticket.createdAt)} />
          </div>
          <div>
            <h4 className="text-sm font-bold">Descripción</h4>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-app-secondary">{ticket.description}</p>
          </div>

          <section className="rounded-md border border-app-border p-3" aria-labelledby="saved-analysis-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 id="saved-analysis-title" className="text-sm font-bold">Análisis guardado</h4>
              <span className="rounded bg-app-muted px-2 py-1 text-xs font-semibold">Proveedor: {provider}</span>
            </div>
            {ticket.aiStatus === "not_analyzed" ? (
              <p className="mt-2 text-sm text-app-secondary">Este ticket no tiene un análisis guardado.</p>
            ) : (
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <DetailInfo label="Confianza" value={ticket.aiConfidence ? translate(`${ticket.aiConfidence}_confidence`) : "No informada"} />
                <DetailInfo label="Área responsable" value={ticket.responsibleArea ?? "No informada"} />
                <DetailInfo label="Resumen" value={ticket.summary ?? "No informado"} />
                <DetailInfo label="Posible causa" value={ticket.possibleCause ?? "No informada"} />
                <div className="md:col-span-2">
                  <DetailInfo label="Respuesta sugerida" value={ticket.suggestedReply ?? "No informada"} />
                </div>
                {ticket.suggestedSteps?.length ? (
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold uppercase text-app-secondary">Pasos sugeridos</p>
                    <ol className="mt-1 list-decimal space-y-1 pl-5 text-app-text">
                      {ticket.suggestedSteps.map((step) => <li key={step.id}>{step.text}</li>)}
                    </ol>
                  </div>
                ) : null}
              </div>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <form className="rounded-md border border-app-border p-3" onSubmit={onSaveStatus}>
              <label className="block text-sm font-bold" htmlFor="ticket-status">Estado</label>
              <select id="ticket-status" className="mt-2 h-10 w-full rounded-md border border-app-border bg-white px-3 text-sm disabled:opacity-50" value={statusDraft} disabled={detailMutation !== null} onChange={(event) => onStatusDraftChange(event.target.value)}>
                {ticketStatuses.map((status) => <option key={status} value={status}>{translate(status)}</option>)}
              </select>
              <button className="mt-3 rounded-md bg-app-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" type="submit" disabled={detailMutation !== null || statusDraft === ticket.status}>
                {detailMutation === "status" ? "Guardando..." : "Guardar estado"}
              </button>
            </form>

            <form className="rounded-md border border-app-border p-3" onSubmit={onAddNote}>
              <label className="block text-sm font-bold" htmlFor="ticket-note">Nota interna ficticia</label>
              <textarea id="ticket-note" className="mt-2 min-h-24 w-full rounded-md border border-app-border px-3 py-2 text-sm disabled:opacity-50" maxLength={2000} value={noteDraft} disabled={detailMutation !== null} onChange={(event) => onNoteDraftChange(event.target.value)} />
              <div className="mt-1 flex justify-between gap-3 text-xs text-app-secondary">
                <span>Usá solo datos ficticios.</span>
                <span>{noteDraft.length}/2000</span>
              </div>
              <button className="mt-3 rounded-md bg-app-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" type="submit" disabled={detailMutation !== null || noteDraft.trim().length < 2}>
                {detailMutation === "note" ? "Agregando..." : "Agregar nota"}
              </button>
            </form>
          </div>

          <section aria-labelledby="ticket-notes-title">
            <h4 id="ticket-notes-title" className="text-sm font-bold">Notas internas</h4>
            {ticket.notes?.length ? (
              <ul className="mt-2 space-y-2">
                {ticket.notes.map((note) => (
                  <li key={note.id} className="rounded-md bg-app-muted p-3 text-sm">
                    <p className="whitespace-pre-wrap break-words">{note.content}</p>
                    <p className="mt-1 text-xs text-app-secondary">{formatDate(note.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-app-secondary">Todavía no hay notas.</p>}
          </section>
        </div>
      ) : null}
    </section>
  );
}

function DetailInfo({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase text-app-secondary">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap break-words font-medium text-app-text">{value}</p>
    </div>
  );
}

function TicketList({ tickets, compact = false, onOpenTicket }) {
  if (!tickets.length) {
    return <div className="mt-3 rounded-md border border-dashed border-app-border bg-app-muted p-4 text-sm text-app-secondary">Sin datos para mostrar.</div>;
  }

  if (compact) {
    return (
      <div className="mt-3 min-w-0 divide-y divide-app-border overflow-hidden rounded-md border border-app-border bg-white">
        {tickets.map((ticketItem) => (
          <div key={ticketItem.id} className="flex min-w-0 flex-col gap-2 p-3 text-sm transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 w-full flex-1 flex-col gap-1 sm:pr-3">
              <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                <span className="min-w-0 max-w-full break-all font-semibold text-slate-700">{ticketItem.code}</span>
                <span className="min-w-0 break-words font-medium text-slate-800">{ticketItem.title}</span>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-app-secondary">
                <span className="min-w-0 break-words">{ticketItem.requesterName}</span>
                <span>•</span>
                <span className="min-w-0 break-words">{formatDate(ticketItem.createdAt)}</span>
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-wrap items-center gap-1.5 sm:w-auto sm:justify-end">
              <PriorityBadge priority={ticketItem.priority} />
              <StatusBadge status={ticketItem.status} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <ul className="mt-3 grid min-w-0 gap-3 md:hidden" aria-label="Tickets">
        {tickets.map((ticketItem) => (
          <li key={ticketItem.id} className="min-w-0 rounded-lg border border-app-border bg-white p-4 shadow-subtle">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="max-w-full break-all text-xs font-bold uppercase tracking-wide text-app-secondary">{ticketItem.code}</p>
                <h3 className="mt-1 break-words font-semibold text-app-text">{ticketItem.title}</h3>
              </div>
              <div className="shrink-0"><StatusBadge status={ticketItem.status} /></div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <PriorityBadge priority={ticketItem.priority} />
              {ticketItem.category ? (
                <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded border border-app-border px-2 py-0.5 text-xs text-app-secondary">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ticketItem.category.color }} aria-hidden="true" />
                  <span className="min-w-0 break-words">{ticketItem.category.name}</span>
                </span>
              ) : <span className="text-xs text-app-secondary">Sin categoría</span>}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-app-border pt-3 text-sm">
              <div className="min-w-0">
                <dt className="text-xs text-app-secondary">Solicitante</dt>
                <dd className="break-words font-medium text-app-text">{ticketItem.requesterName}</dd>
                <dd className="break-words text-xs text-app-secondary">{ticketItem.requesterArea}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-xs text-app-secondary">Fecha</dt>
                <dd className="break-words font-medium text-app-text">{formatDate(ticketItem.createdAt)}</dd>
              </div>
            </dl>
            <button className="mt-3 rounded-md border border-app-border px-3 py-2 text-sm font-semibold" type="button" onClick={(event) => onOpenTicket(ticketItem.id, event.currentTarget)}>
              Ver detalle
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 hidden w-full min-w-0 max-w-full overflow-x-auto rounded-md border border-app-border bg-white shadow-sm md:block">
      <table className="w-full table-fixed text-left border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-app-border text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="py-3 px-4 font-semibold">Código</th>
            <th className="py-3 px-4 font-semibold">Título</th>
            <th className="py-3 px-4 font-semibold hidden md:table-cell">Solicitante</th>
            <th className="py-3 px-4 font-semibold hidden sm:table-cell">Categoría</th>
            <th className="py-3 px-4 font-semibold">Prioridad</th>
            <th className="py-3 px-4 font-semibold">Estado</th>
            <th className="py-3 px-4 font-semibold hidden lg:table-cell">Fecha</th>
            <th className="py-3 px-4 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-app-border text-slate-700">
          {tickets.map((ticketItem) => (
            <tr key={ticketItem.id} className="hover:bg-slate-50 transition-colors">
              <td className="break-all py-3 px-4 font-bold text-slate-900">{ticketItem.code}</td>
              <td className="break-words py-3 px-4 font-medium text-slate-800">
                <div className="break-words">{ticketItem.title}</div>
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
              <td className="break-words py-3 px-4 hidden md:table-cell">
                <div className="break-words">{ticketItem.requesterName}</div>
                <div className="break-words text-xs text-app-secondary">{ticketItem.requesterArea}</div>
              </td>
              <td className="break-words py-3 px-4 hidden sm:table-cell">
                {ticketItem.category ? (
                  <span className="inline-flex min-w-0 items-start gap-1.5">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ticketItem.category.color }} />
                    <span className="min-w-0 break-words">{ticketItem.category.name}</span>
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
              <td className="py-3 px-4 hidden lg:table-cell text-xs text-slate-500 whitespace-nowrap">
                {formatDate(ticketItem.createdAt)}
              </td>
              <td className="py-3 px-4 text-right whitespace-nowrap">
                <button className="rounded-md border border-app-border px-3 py-2 text-sm font-semibold" type="button" aria-label={`Ver detalle de ${ticketItem.code}`} onClick={(event) => onOpenTicket(ticketItem.id, event.currentTarget)}>
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}

function CategoriesView({ categories }) {
  return (
    <section className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {categories.map((category) => (
        <div key={category.id} className="min-w-0 rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: category.color }} />
            <h2 className="min-w-0 break-words font-bold">{category.name}</h2>
          </div>
          <p className="break-words text-sm text-app-secondary">{category.description}</p>
          <p className="mt-3 break-words text-xs font-semibold text-app-text">{category.responsibleArea}</p>
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
        <Info label="Modo demo" value={typeof aiStatus?.demoMode === "boolean" ? (aiStatus.demoMode ? "Activo" : "Inactivo") : "Sin datos"} />
      </dl>
      <p className="mt-4 text-sm text-app-secondary">
        {typeof aiStatus?.demoMode !== "boolean"
          ? "El estado del proveedor todavía no está disponible."
          : aiStatus.demoMode
            ? "Los análisis nuevos usan reglas locales. No representan respuestas de Gemini."
            : "Los análisis nuevos intentan usar Gemini desde el servidor. Si el proveedor falla, la respuesta muestra el respaldo por reglas."}
        {" "}La clave se configura solo en el backend.
      </p>
    </section>
  );
}

function DocsView() {
  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
      <h2 className="text-base font-bold">Documentación del proyecto</h2>
      <p className="mt-2 text-sm text-app-secondary">Cada visitante recibe un espacio aislado de una hora con tres tickets ficticios. Podés analizar un ejemplo, guardar otro ticket y ver cómo cambia el tablero.</p>
      <p className="mt-2 text-sm text-app-secondary">El modo demo genera sugerencias con reglas. Si Gemini está configurado, el servidor intenta enviar los datos del caso a Google y muestra el proveedor real en cada resultado. Revisá siempre la sugerencia antes de usarla.</p>
    </section>
  );
}

function AnalysisPanel({ analysis }) {
  return (
    <section className="rounded-lg border border-app-border bg-app-surface p-4 shadow-subtle">
      <div className="flex items-center gap-2">
        <Sparkles className="text-app-accent" size={18} />
        <h2 className="text-base font-bold text-app-text">Diagnóstico sugerido</h2>
      </div>
      {!analysis ? (
        <p className="mt-3 text-sm text-app-secondary">Cargá un caso ficticio y presioná Analizar.</p>
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

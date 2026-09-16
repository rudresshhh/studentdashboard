import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Home, CheckSquare, ListTodo, BookOpen, CalendarDays, GraduationCap,
  StickyNote, Star, Bot, Settings as SettingsIcon, Plus, Trash2, Pencil,
  X, Check, ChevronUp, ChevronDown, Upload, ZoomIn, Send, Copy,
  RotateCcw, AlertTriangle, Sparkles, Menu, Search, Image as ImageIcon,
  Flame, Clock, Pin
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/* Utilities                                                              */
/* ---------------------------------------------------------------------- */

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return todayKey(d);
}

function daysBetween(fromKey, toKey) {
  const a = new Date(fromKey + "T00:00:00");
  const b = new Date(toKey + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

function formatNice(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

function dueLabel(dateStr) {
  if (!dateStr) return { text: "No date", tone: "muted" };
  const t = todayKey();
  const diff = daysBetween(t, dateStr);
  if (diff < 0) return { text: `Overdue · ${formatNice(dateStr)}`, tone: "danger" };
  if (diff === 0) return { text: "Due today", tone: "warning" };
  if (diff === 1) return { text: "Due tomorrow", tone: "warning" };
  return { text: formatNice(dateStr), tone: "muted" };
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayNameFor = (date) => date.toLocaleDateString(undefined, { weekday: "long" });

function greetingWord() {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

/* ---------------------------------------------------------------------- */
/* Persistent storage hook                                                */
/* ---------------------------------------------------------------------- */

function usePersisted(key, initialValue) {
  // Use normal browser localStorage so the app works on Vercel/GitHub
  // and survives refreshes and browser restarts.
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) setValue(JSON.parse(stored));
    } catch (e) {
      console.warn(`Could not load ${key} from localStorage`, e);
    } finally {
      setLoaded(true);
    }
  }, [key]);

  const update = (updater) => {
    setValue((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch (e) {
        console.warn(`Could not save ${key} to localStorage`, e);
      }
      return next;
    });
  };

  return [value, update, loaded];
}

/* ---------------------------------------------------------------------- */
/* Sample data                                                            */
/* ---------------------------------------------------------------------- */

const SAMPLE_TODOS = [
  { id: uid(), title: "Finish English chapter summary", notes: "", dueDate: todayKey(), priority: "medium", completed: false, createdAt: Date.now() },
  { id: uid(), title: "Complete Maths exercise 5.2", notes: "", dueDate: addDays(todayKey(), 1), priority: "high", completed: false, createdAt: Date.now() },
  { id: uid(), title: "Revise Biology chapter 2", notes: "", dueDate: addDays(todayKey(), -1), priority: "low", completed: true, createdAt: Date.now() },
];

const SAMPLE_DAILY = [
  { id: uid(), title: "Pack school bag" },
  { id: uid(), title: "Complete homework" },
  { id: uid(), title: "Read for 20 minutes" },
  { id: uid(), title: "Drink enough water" },
  { id: uid(), title: "Prepare uniform for tomorrow" },
];

const SAMPLE_HOMEWORK = [
  { id: uid(), subject: "Maths", title: "Exercise 5.2", description: "Q1 to Q10, show all steps.", assignedDate: addDays(todayKey(), -2), dueDate: addDays(todayKey(), 1), priority: "high", status: "In Progress" },
  { id: uid(), subject: "Science", title: "Chapter 7 questions", description: "Answer all back-of-chapter questions.", assignedDate: addDays(todayKey(), -1), dueDate: addDays(todayKey(), 3), priority: "medium", status: "Not Started" },
];

const SAMPLE_EXAMS = [
  { id: uid(), subject: "Mathematics", date: addDays(todayKey(), 5), time: "09:00", syllabus: ["Linear Equations", "Polynomials", "Coordinate Geometry"], room: "", notes: "" },
];

const SAMPLE_NOTES = [
  { id: uid(), title: "Science — important definitions", content: "Photosynthesis: the process by which green plants use sunlight to make food from CO2 and water.", subject: "Science", pinned: true, createdAt: Date.now(), updatedAt: Date.now() },
];

const SAMPLE_WISHLIST = [
  { id: uid(), name: "Wireless earphones", description: "For studying and travel", image: "", price: "2500", priority: "medium", category: "Gadgets", status: "Want" },
];

const emptyTimetable = () => Object.fromEntries(DAYS.map((d) => [d, []]));

/* ---------------------------------------------------------------------- */
/* Small shared UI                                                        */
/* ---------------------------------------------------------------------- */

function Badge({ tone = "muted", children }) {
  const map = {
    danger: "bg-red-950 text-red-300 border-red-900",
    warning: "bg-amber-950 text-amber-300 border-amber-900",
    success: "bg-emerald-950 text-emerald-300 border-emerald-900",
    muted: "bg-zinc-800 text-zinc-400 border-zinc-700",
    accent: "bg-amber-950 text-amber-300 border-amber-900",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${map[tone] || map.muted}`}>
      {children}
    </span>
  );
}

function IconButton({ onClick, title, children, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors ${danger ? "hover:text-red-400 hover:border-red-900" : ""}`}
    >
      {children}
    </button>
  );
}

function PrimaryButton({ onClick, children, type = "button", full }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 text-zinc-950 font-medium px-4 py-2 hover:bg-amber-300 active:scale-[0.98] transition ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

function GhostButton({ onClick, children, full }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 text-zinc-300 px-4 py-2 hover:border-zinc-500 hover:text-white transition ${full ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 border border-dashed border-zinc-800 rounded-2xl">
      <div className="text-zinc-600 mb-3">{icon}</div>
      <p className="text-white font-medium mb-1">{title}</p>
      <p className="text-zinc-500 text-sm max-w-xs">{body}</p>
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
      <div
        className={`bg-zinc-900 border border-zinc-800 w-full ${wide ? "sm:max-w-lg" : "sm:max-w-md"} rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900">
          <h3 className="text-white font-medium">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-zinc-500 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, message, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <p className="text-white mb-5">{message}</p>
        <div className="flex gap-3 justify-end">
          <GhostButton onClick={onCancel}>Cancel</GhostButton>
          <button onClick={onConfirm} className="rounded-lg bg-red-500 text-white px-4 py-2 font-medium hover:bg-red-400">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-4">
      <span className="block text-xs text-zinc-400 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full rounded-lg bg-zinc-800 border border-zinc-700 text-white px-3 py-2 text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-400";

/* ---------------------------------------------------------------------- */
/* Navigation config                                                      */
/* ---------------------------------------------------------------------- */

const NAV = [
  { key: "home", label: "Home", icon: Home },
  { key: "todo", label: "To-Do", icon: CheckSquare },
  { key: "daily", label: "Daily Tasks", icon: ListTodo },
  { key: "homework", label: "Homework", icon: BookOpen },
  { key: "timetable", label: "Timetable", icon: CalendarDays },
  { key: "exams", label: "Exams", icon: GraduationCap },
  { key: "notes", label: "Notes", icon: StickyNote },
  { key: "wishlist", label: "Wishlist", icon: Star },
  { key: "ai", label: "Doubt Solver", icon: Bot },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

const MOBILE_NAV = ["home", "todo", "homework", "ai", "settings"];

/* ---------------------------------------------------------------------- */
/* Main App                                                               */
/* ---------------------------------------------------------------------- */

export default function App() {
  const [view, setView] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [settings, setSettings, lSettings] = usePersisted("settings", { name: "there", avatar: "🎓" });
  const [todos, setTodos, lTodos] = usePersisted("todos", SAMPLE_TODOS);
  const [dailyTasks, setDailyTasks, lDaily] = usePersisted("dailyTasks", SAMPLE_DAILY);
  const [dailyCompletions, setDailyCompletions, lDC] = usePersisted("dailyCompletions", {});
  const [homework, setHomework, lHw] = usePersisted("homework", SAMPLE_HOMEWORK);
  const [timetable, setTimetable, lTt] = usePersisted("timetable", emptyTimetable());
  const [timetableImage, setTimetableImage, lTtImg] = usePersisted("timetableImage", null);
  const [exams, setExams, lExams] = usePersisted("exams", SAMPLE_EXAMS);
  const [notes, setNotes, lNotes] = usePersisted("notes", SAMPLE_NOTES);
  const [wishlist, setWishlist, lWish] = usePersisted("wishlist", SAMPLE_WISHLIST);
  const [chatMessages, setChatMessages, lChat] = usePersisted("chatMessages", []);
  // Date-based rollover: when the app is opened on a new local calendar day,
  // it naturally starts with a fresh completion list while preserving history.
  useEffect(() => {
    const today = todayKey();
    const raw = window.localStorage.getItem("dailyCompletions");
    if (!raw) return;
    try {
      const history = JSON.parse(raw);
      if (!history[today]) {
        // We intentionally create an empty entry for the new day.
        // Previous dates remain available as completion history.
        const next = { ...history, [today]: [] };
        window.localStorage.setItem("dailyCompletions", JSON.stringify(next));
        setDailyCompletions(next);
      }
    } catch (e) {
      console.warn("Could not roll over daily checklist", e);
    }
  }, [setDailyCompletions]);


  const allLoaded = lSettings && lTodos && lDaily && lDC && lHw && lTt && lTtImg && lExams && lNotes && lWish && lChat;

  if (!allLoaded) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Loading your dashboard…</p>
      </div>
    );
  }

  const currentNav = NAV.find((n) => n.key === view);

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-56 shrink-0 border-r border-zinc-800 p-4">
        <div className="flex items-center gap-2 px-2 mb-6">
          <span className="text-xl">{settings.avatar || "🎓"}</span>
          <span className="font-medium">{settings.name || "Student"}'s Space</span>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = view === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setView(n.key)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-amber-400 text-zinc-950 font-medium" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <Icon size={17} />
                {n.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xl">{settings.avatar || "🎓"}</span>
                <span className="font-medium">{settings.name || "Student"}'s Space</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18} className="text-zinc-400" /></button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => {
                const Icon = n.icon;
                const active = view === n.key;
                return (
                  <button
                    key={n.key}
                    onClick={() => { setView(n.key); setSidebarOpen(false); }}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      active ? "bg-amber-400 text-zinc-950 font-medium" : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    <Icon size={17} />
                    {n.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col pb-16 md:pb-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-30">
          <button onClick={() => setSidebarOpen(true)} aria-label="Open menu" className="text-zinc-400">
            <Menu size={20} />
          </button>
          <span className="font-medium text-sm">{currentNav?.label}</span>
          <span className="text-lg">{settings.avatar || "🎓"}</span>
        </div>

        <main className="flex-1 p-4 md:p-8 max-w-4xl w-full mx-auto">
          {view === "home" && (
            <HomePage
              settings={settings}
              todos={todos} homework={homework} exams={exams}
              timetable={timetable} dailyTasks={dailyTasks} dailyCompletions={dailyCompletions}
              setDailyCompletions={setDailyCompletions}
              goTo={setView}
            />
          )}
          {view === "todo" && <TodoPage todos={todos} setTodos={setTodos} />}
          {view === "daily" && (
            <DailyTasksPage
              dailyTasks={dailyTasks} setDailyTasks={setDailyTasks}
              dailyCompletions={dailyCompletions} setDailyCompletions={setDailyCompletions}
            />
          )}
          {view === "homework" && <HomeworkPage homework={homework} setHomework={setHomework} />}
          {view === "timetable" && (
            <TimetablePage timetable={timetable} setTimetable={setTimetable} timetableImage={timetableImage} setTimetableImage={setTimetableImage} />
          )}
          {view === "exams" && <ExamsPage exams={exams} setExams={setExams} />}
          {view === "notes" && <NotesPage notes={notes} setNotes={setNotes} />}
          {view === "wishlist" && <WishlistPage wishlist={wishlist} setWishlist={setWishlist} />}
          {view === "ai" && <AIChatPage settings={settings} chatMessages={chatMessages} setChatMessages={setChatMessages} />}
          {view === "settings" && <SettingsPage settings={settings} setSettings={setSettings} />}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-zinc-950 border-t border-zinc-800 flex justify-around py-2">
        {NAV.filter((n) => MOBILE_NAV.includes(n.key)).map((n) => {
          const Icon = n.icon;
          const active = view === n.key;
          return (
            <button key={n.key} onClick={() => setView(n.key)} className="flex flex-col items-center gap-0.5 px-2 py-1">
              <Icon size={20} className={active ? "text-amber-400" : "text-zinc-500"} />
              <span className={`text-[10px] ${active ? "text-amber-400" : "text-zinc-500"}`}>{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* HOME                                                                    */
/* ---------------------------------------------------------------------- */

function HomePage({ settings, todos, homework, exams, timetable, dailyTasks, dailyCompletions, setDailyCompletions, goTo }) {
  const today = todayKey();
  const now = new Date();
  const dayName = dayNameFor(now);
  const todaysClasses = (timetable[dayName] || []).length;
  const pendingTodos = todos.filter((t) => !t.completed);
  const pendingHomework = homework.filter((h) => h.status !== "Completed");
  const overdueTodos = pendingTodos.filter((t) => t.dueDate && t.dueDate < today);
  const overdueHomework = pendingHomework.filter((h) => h.dueDate && h.dueDate < today);
  const upcomingExam = [...exams].sort((a, b) => a.date.localeCompare(b.date)).find((e) => e.date >= today);

  const deadlines = useMemo(() => {
    const items = [];
    homework.forEach((h) => {
      if (h.status !== "Completed" && h.dueDate) {
        items.push({ id: "hw-" + h.id, date: h.dueDate, label: `${h.subject} — ${h.title}`, kind: "Homework" });
      }
    });
    exams.forEach((e) => {
      if (e.date >= today) items.push({ id: "ex-" + e.id, date: e.date, label: `${e.subject} exam`, kind: "Exam" });
    });
    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  }, [homework, exams, today]);

  const dailyDone = dailyCompletions[today] || [];
  const dailyTotal = dailyTasks.length;

  let banner = null;
  const dueTomorrowHw = pendingHomework.find((h) => h.dueDate === addDays(today, 1));
  if (overdueTodos.length + overdueHomework.length > 0) {
    banner = { tone: "danger", icon: <AlertTriangle size={18} />, text: `${overdueTodos.length + overdueHomework.length} item${overdueTodos.length + overdueHomework.length > 1 ? "s are" : " is"} overdue` };
  } else if (dueTomorrowHw) {
    banner = { tone: "warning", icon: <BookOpen size={18} />, text: `Homework due tomorrow — ${dueTomorrowHw.subject}: ${dueTomorrowHw.title}` };
  } else if (upcomingExam && daysBetween(today, upcomingExam.date) <= 3) {
    banner = { tone: "warning", icon: <GraduationCap size={18} />, text: `${upcomingExam.subject} exam in ${daysBetween(today, upcomingExam.date)} day${daysBetween(today, upcomingExam.date) === 1 ? "" : "s"}` };
  } else if (pendingTodos.length === 0 && pendingHomework.length === 0) {
    banner = { tone: "success", icon: <Sparkles size={18} />, text: "You're all caught up!" };
  }

  const toggleDaily = (id) => {
    setDailyCompletions((prev) => {
      const list = prev[today] || [];
      const has = list.includes(id);
      return { ...prev, [today]: has ? list.filter((x) => x !== id) : [...list, id] };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-white">{greetingWord()}, {settings.name || "there"} 👋</h1>
        <p className="text-zinc-500 text-sm mt-1">Ready to make today a good one?</p>
      </div>

      {banner && (
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          banner.tone === "danger" ? "bg-red-950 border-red-900 text-red-300" :
          banner.tone === "warning" ? "bg-amber-950 border-amber-900 text-amber-300" :
          "bg-emerald-950 border-emerald-900 text-emerald-300"
        }`}>
          {banner.icon}
          <span className="text-sm">{banner.text}</span>
        </div>
      )}

      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
        <p className="text-white font-medium mb-3">{now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat icon={<BookOpen size={15} />} label={`${todaysClasses} classes today`} onClick={() => goTo("timetable")} />
          <Stat icon={<CheckSquare size={15} />} label={`${pendingTodos.length} tasks remaining`} onClick={() => goTo("todo")} />
          <Stat icon={<GraduationCap size={15} />} label={pendingHomework.length ? `${pendingHomework.length} homework pending` : "No homework pending"} onClick={() => goTo("homework")} />
          <Stat
            icon={<Clock size={15} />}
            label={upcomingExam ? `${upcomingExam.subject} in ${daysBetween(today, upcomingExam.date)}d` : "No exams scheduled"}
            onClick={() => goTo("exams")}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white font-medium">Daily checklist</p>
          <span className="text-xs text-zinc-500">{dailyDone.length} / {dailyTotal} done</span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden mb-3">
          <div className="h-full bg-amber-400 transition-all" style={{ width: dailyTotal ? `${(dailyDone.length / dailyTotal) * 100}%` : "0%" }} />
        </div>
        <div className="space-y-1.5">
          {dailyTasks.slice(0, 5).map((t) => {
            const done = dailyDone.includes(t.id);
            return (
              <button key={t.id} onClick={() => toggleDaily(t.id)} className="flex items-center gap-2 w-full text-left group">
                <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${done ? "bg-amber-400 border-amber-400" : "border-zinc-600"}`}>
                  {done && <Check size={11} className="text-zinc-950" />}
                </span>
                <span className={`text-sm ${done ? "text-zinc-600 line-through" : "text-zinc-300"}`}>{t.title}</span>
              </button>
            );
          })}
        </div>
        {dailyTasks.length === 0 && <p className="text-zinc-500 text-sm">No daily tasks yet — add some in Daily Tasks.</p>}
      </div>

      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
        <p className="text-white font-medium mb-3">Coming up</p>
        {deadlines.length === 0 ? (
          <p className="text-zinc-500 text-sm">Nothing on the horizon. Enjoy the calm.</p>
        ) : (
          <div className="space-y-2">
            {deadlines.map((d) => {
              const lbl = dueLabel(d.date);
              return (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{d.label}</span>
                  <Badge tone={lbl.tone === "muted" ? "muted" : lbl.tone}>{lbl.text}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-left hover:bg-zinc-700 transition">
      <span className="text-amber-400">{icon}</span>
      <span className="text-zinc-300 text-xs">{label}</span>
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* TO-DO                                                                   */
/* ---------------------------------------------------------------------- */

function TodoPage({ todos, setTodos }) {
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(null); // null | {} | todo object
  const [confirmId, setConfirmId] = useState(null);

  const today = todayKey();
  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    if (filter === "today") return t.dueDate === today;
    if (filter === "upcoming") return t.dueDate && t.dueDate > today;
    return true;
  }).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));

  const save = (task) => {
    if (task.id) {
      setTodos((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    } else {
      setTodos((prev) => [...prev, { ...task, id: uid(), completed: false, createdAt: Date.now() }]);
    }
    setModal(null);
  };

  const toggle = (id) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  const remove = (id) => { setTodos((prev) => prev.filter((t) => t.id !== id)); setConfirmId(null); };

  const priorityTone = { high: "danger", medium: "warning", low: "muted" };

  return (
    <div className="space-y-5">
      <PageHeader title="To-Do" onAdd={() => setModal({})} addLabel="Add task" />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", "active", "completed", "today", "upcoming"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs border ${filter === f ? "bg-amber-400 text-zinc-950 border-amber-400" : "border-zinc-700 text-zinc-400 hover:text-white"}`}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<CheckSquare size={28} />} title="No tasks yet" body="Add something you want to get done today." />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const lbl = dueLabel(t.dueDate);
            return (
              <div key={t.id} className="flex items-start gap-3 rounded-xl bg-zinc-900 border border-zinc-800 p-3">
                <button onClick={() => toggle(t.id)} className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center shrink-0 ${t.completed ? "bg-amber-400 border-amber-400" : "border-zinc-600"}`}>
                  {t.completed && <Check size={13} className="text-zinc-950" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${t.completed ? "text-zinc-600 line-through" : "text-white"}`}>{t.title}</p>
                  {t.notes && <p className="text-xs text-zinc-500 mt-0.5">{t.notes}</p>}
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {t.dueDate && <Badge tone={t.completed ? "muted" : lbl.tone}>{lbl.text}</Badge>}
                    <Badge tone={priorityTone[t.priority] || "muted"}>{t.priority || "medium"} priority</Badge>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <IconButton title="Edit" onClick={() => setModal(t)}><Pencil size={14} /></IconButton>
                  <IconButton title="Delete" danger onClick={() => setConfirmId(t.id)}><Trash2 size={14} /></IconButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Edit task" : "Add task"}>
        {modal && <TodoForm initial={modal} onSave={save} />}
      </Modal>
      <ConfirmDialog open={!!confirmId} message="Delete this task?" onCancel={() => setConfirmId(null)} onConfirm={() => remove(confirmId)} />
    </div>
  );
}

function TodoForm({ initial, onSave }) {
  const [title, setTitle] = useState(initial.title || "");
  const [notes, setNotes] = useState(initial.notes || "");
  const [dueDate, setDueDate] = useState(initial.dueDate || "");
  const [priority, setPriority] = useState(initial.priority || "medium");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) { setError("Give the task a name."); return; }
    onSave({ ...initial, title: title.trim(), notes, dueDate, priority });
  };

  return (
    <form onSubmit={submit}>
      <Field label="Task name">
        <input className={inputCls} value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder="Finish English chapter" autoFocus />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </Field>
      <Field label="Notes (optional)">
        <textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any extra detail" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Due date">
          <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Priority">
          <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
      </div>
      <PrimaryButton type="submit" full>Save task</PrimaryButton>
    </form>
  );
}

function PageHeader({ title, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-medium text-white">{title}</h1>
      {onAdd && <PrimaryButton onClick={onAdd}><Plus size={16} />{addLabel}</PrimaryButton>}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* DAILY TASKS                                                             */
/* ---------------------------------------------------------------------- */

function DailyTasksPage({ dailyTasks, setDailyTasks, dailyCompletions, setDailyCompletions }) {
  const [modal, setModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const today = todayKey();
  const done = dailyCompletions[today] || [];

  const toggle = (id) => {
    setDailyCompletions((prev) => {
      const list = prev[today] || [];
      const has = list.includes(id);
      return { ...prev, [today]: has ? list.filter((x) => x !== id) : [...list, id] };
    });
  };

  const move = (id, dir) => {
    setDailyTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      const swap = idx + dir;
      if (swap < 0 || swap >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const save = (task) => {
    if (task.id) {
      setDailyTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    } else {
      setDailyTasks((prev) => [...prev, { ...task, id: uid() }]);
    }
    setModal(null);
  };

  const remove = (id) => {
    setDailyTasks((prev) => prev.filter((t) => t.id !== id));
    setConfirmId(null);
  };

  const streak = useMemo(() => {
    if (dailyTasks.length === 0) return 0;
    let count = 0;
    let cursor = today;
    const todayFull = (dailyCompletions[today] || []).length >= dailyTasks.length;
    if (todayFull) count++;
    cursor = addDays(cursor, -1);
    while (true) {
      const list = dailyCompletions[cursor] || [];
      if (list.length >= dailyTasks.length) { count++; cursor = addDays(cursor, -1); } else break;
    }
    return count;
  }, [dailyCompletions, dailyTasks, today]);

  return (
    <div className="space-y-5">
      <PageHeader title="Daily Tasks" onAdd={() => setModal({})} addLabel="Add daily task" />
      <p className="text-zinc-500 text-sm -mt-3">Everyday habits that reset fresh each morning.</p>

      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium text-sm">Today's progress: {done.length} / {dailyTasks.length}</span>
          {streak > 0 && (
            <span className="flex items-center gap-1 text-amber-400 text-xs"><Flame size={14} /> {streak} day streak</span>
          )}
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full bg-amber-400" style={{ width: dailyTasks.length ? `${(done.length / dailyTasks.length) * 100}%` : "0%" }} />
        </div>
      </div>

      {dailyTasks.length === 0 ? (
        <EmptyState icon={<ListTodo size={28} />} title="No daily tasks yet" body="Add habits like packing your bag or reading for 20 minutes." />
      ) : (
        <div className="space-y-2">
          {dailyTasks.map((t, i) => {
            const isDone = done.includes(t.id);
            return (
              <div key={t.id} className="flex items-center gap-3 rounded-xl bg-zinc-900 border border-zinc-800 p-3">
                <button onClick={() => toggle(t.id)} className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${isDone ? "bg-amber-400 border-amber-400" : "border-zinc-600"}`}>
                  {isDone && <Check size={13} className="text-zinc-950" />}
                </button>
                <span className={`flex-1 text-sm ${isDone ? "text-zinc-600 line-through" : "text-white"}`}>{t.title}</span>
                <div className="flex gap-1 shrink-0">
                  <IconButton title="Move up" onClick={() => move(t.id, -1)}><ChevronUp size={14} /></IconButton>
                  <IconButton title="Move down" onClick={() => move(t.id, 1)}><ChevronDown size={14} /></IconButton>
                  <IconButton title="Edit" onClick={() => setModal(t)}><Pencil size={14} /></IconButton>
                  <IconButton title="Delete" danger onClick={() => setConfirmId(t.id)}><Trash2 size={14} /></IconButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Edit daily task" : "Add daily task"}>
        {modal && (
          <SimpleTitleForm
            initial={modal.title || ""}
            placeholder="Drink enough water"
            label="Task name"
            onSave={(title) => save({ ...modal, title })}
          />
        )}
      </Modal>
      <ConfirmDialog open={!!confirmId} message="Delete this daily task?" onCancel={() => setConfirmId(null)} onConfirm={() => remove(confirmId)} />
    </div>
  );
}

function SimpleTitleForm({ initial, placeholder, label, onSave }) {
  const [title, setTitle] = useState(initial);
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) { setError("This can't be empty."); return; }
    onSave(title.trim());
  };
  return (
    <form onSubmit={submit}>
      <Field label={label}>
        <input className={inputCls} value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder={placeholder} autoFocus />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </Field>
      <PrimaryButton type="submit" full>Save</PrimaryButton>
    </form>
  );
}

/* ---------------------------------------------------------------------- */
/* HOMEWORK                                                                */
/* ---------------------------------------------------------------------- */

function HomeworkPage({ homework, setHomework }) {
  const [modal, setModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const subjects = ["all", ...Array.from(new Set(homework.map((h) => h.subject).filter(Boolean)))];
  const today = todayKey();

  const filtered = homework
    .filter((h) => subjectFilter === "all" || h.subject === subjectFilter)
    .filter((h) => statusFilter === "all" || h.status === statusFilter)
    .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));

  const save = (item) => {
    if (item.id) setHomework((prev) => prev.map((h) => (h.id === item.id ? item : h)));
    else setHomework((prev) => [...prev, { ...item, id: uid() }]);
    setModal(null);
  };
  const remove = (id) => { setHomework((prev) => prev.filter((h) => h.id !== id)); setConfirmId(null); };
  const cycleStatus = (h) => {
    const order = ["Not Started", "In Progress", "Completed"];
    const next = order[(order.indexOf(h.status) + 1) % order.length];
    setHomework((prev) => prev.map((x) => (x.id === h.id ? { ...x, status: next } : x)));
  };

  const statusTone = { "Not Started": "muted", "In Progress": "warning", Completed: "success" };

  return (
    <div className="space-y-5">
      <PageHeader title="Homework" onAdd={() => setModal({})} addLabel="Add homework" />

      <div className="flex gap-2 flex-wrap">
        <select className={inputCls + " w-auto"} value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          {subjects.map((s) => <option key={s} value={s}>{s === "all" ? "All subjects" : s}</option>)}
        </select>
        <select className={inputCls + " w-auto"} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {["all", "Not Started", "In Progress", "Completed"].map((s) => <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<BookOpen size={28} />} title="No homework pending" body="Add an assignment to keep track of it here." />
      ) : (
        <div className="space-y-2">
          {filtered.map((h) => {
            const lbl = dueLabel(h.dueDate);
            const overdue = h.status !== "Completed" && h.dueDate && h.dueDate < today;
            return (
              <div key={h.id} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-amber-400 mb-0.5">{h.subject}</p>
                    <p className="text-white font-medium text-sm">{h.title}</p>
                    {h.description && <p className="text-zinc-500 text-xs mt-1">{h.description}</p>}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Badge tone={overdue ? "danger" : lbl.tone}>{h.status === "Completed" ? "Completed" : lbl.text}</Badge>
                      <button onClick={() => cycleStatus(h)}>
                        <Badge tone={statusTone[h.status]}>{h.status}</Badge>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <IconButton title="Edit" onClick={() => setModal(h)}><Pencil size={14} /></IconButton>
                    <IconButton title="Delete" danger onClick={() => setConfirmId(h.id)}><Trash2 size={14} /></IconButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Edit homework" : "Add homework"}>
        {modal && <HomeworkForm initial={modal} onSave={save} />}
      </Modal>
      <ConfirmDialog open={!!confirmId} message="Delete this homework?" onCancel={() => setConfirmId(null)} onConfirm={() => remove(confirmId)} />
    </div>
  );
}

function HomeworkForm({ initial, onSave }) {
  const [subject, setSubject] = useState(initial.subject || "");
  const [title, setTitle] = useState(initial.title || "");
  const [description, setDescription] = useState(initial.description || "");
  const [dueDate, setDueDate] = useState(initial.dueDate || "");
  const [priority, setPriority] = useState(initial.priority || "medium");
  const [status, setStatus] = useState(initial.status || "Not Started");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !title.trim()) { setError("Subject and title are required."); return; }
    onSave({ ...initial, subject: subject.trim(), title: title.trim(), description, dueDate, priority, status });
  };

  return (
    <form onSubmit={submit}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Subject">
          <input className={inputCls} value={subject} onChange={(e) => { setSubject(e.target.value); setError(""); }} placeholder="Maths" autoFocus />
        </Field>
        <Field label="Due date">
          <input type="date" className={inputCls} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Title">
        <input className={inputCls} value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder="Exercise 5.2" />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </Field>
      <Field label="Description (optional)">
        <textarea className={inputCls} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Priority">
          <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </Field>
        <Field label="Status">
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Not Started</option><option>In Progress</option><option>Completed</option>
          </select>
        </Field>
      </div>
      <PrimaryButton type="submit" full>Save homework</PrimaryButton>
    </form>
  );
}

/* ---------------------------------------------------------------------- */
/* TIMETABLE                                                               */
/* ---------------------------------------------------------------------- */

function TimetablePage({ timetable, setTimetable, timetableImage, setTimetableImage }) {
  const [day, setDay] = useState(dayNameFor(new Date()) in timetable ? dayNameFor(new Date()) : DAYS[0]);
  const [modal, setModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [imgError, setImgError] = useState("");
  const [zoomOpen, setZoomOpen] = useState(false);
  const fileRef = useRef(null);

  const periods = [...(timetable[day] || [])].sort((a, b) => (a.start || "").localeCompare(b.start || ""));

  const save = (p) => {
    setTimetable((prev) => {
      const list = prev[day] || [];
      const next = p.id ? list.map((x) => (x.id === p.id ? p : x)) : [...list, { ...p, id: uid() }];
      return { ...prev, [day]: next };
    });
    setModal(null);
  };
  const remove = (id) => {
    setTimetable((prev) => ({ ...prev, [day]: (prev[day] || []).filter((p) => p.id !== id) }));
    setConfirmId(null);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      setImgError("Please upload a JPG, PNG or WEBP image.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setTimetableImage(reader.result); setImgError(""); };
    reader.onerror = () => setImgError("Something went wrong. Please try again.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Timetable" />

      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
        <p className="text-white font-medium text-sm mb-3">Timetable photo</p>
        {timetableImage ? (
          <div>
            <button onClick={() => setZoomOpen(true)} className="block w-full">
              <img src={timetableImage} alt="Uploaded school timetable" className="rounded-lg border border-zinc-800 max-h-64 w-auto mx-auto" />
            </button>
            <div className="flex gap-2 mt-3">
              <GhostButton onClick={() => fileRef.current?.click()}><Upload size={14} />Replace</GhostButton>
              <GhostButton onClick={() => setTimetableImage(null)}><Trash2 size={14} />Remove</GhostButton>
              <GhostButton onClick={() => setZoomOpen(true)}><ZoomIn size={14} />View large</GhostButton>
            </div>
          </div>
        ) : (
          <GhostButton onClick={() => fileRef.current?.click()}><Upload size={14} />Upload timetable photo</GhostButton>
        )}
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
        {imgError && <p className="text-red-400 text-xs mt-2">{imgError}</p>}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-white font-medium text-sm">Weekly schedule</p>
        <PrimaryButton onClick={() => setModal({})}><Plus size={16} />Add period</PrimaryButton>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {DAYS.map((d) => (
          <button key={d} onClick={() => setDay(d)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs border ${day === d ? "bg-amber-400 text-zinc-950 border-amber-400" : "border-zinc-700 text-zinc-400 hover:text-white"}`}>
            {d.slice(0, 3)}
          </button>
        ))}
      </div>

      {periods.length === 0 ? (
        <EmptyState icon={<CalendarDays size={28} />} title={`No classes added for ${day}`} body="Add a period, or upload a photo of your timetable above." />
      ) : (
        <div className="space-y-2">
          {periods.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl bg-zinc-900 border border-zinc-800 p-3">
              <div>
                <p className="text-white text-sm font-medium">{p.subject}</p>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {p.start}{p.end ? ` – ${p.end}` : ""}{p.teacher ? ` · ${p.teacher}` : ""}{p.room ? ` · Room ${p.room}` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                <IconButton title="Edit" onClick={() => setModal(p)}><Pencil size={14} /></IconButton>
                <IconButton title="Delete" danger onClick={() => setConfirmId(p.id)}><Trash2 size={14} /></IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Edit period" : `Add period · ${day}`}>
        {modal && <PeriodForm initial={modal} onSave={save} />}
      </Modal>
      <ConfirmDialog open={!!confirmId} message="Delete this period?" onCancel={() => setConfirmId(null)} onConfirm={() => remove(confirmId)} />

      {zoomOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setZoomOpen(false)}>
          <img src={timetableImage} alt="Timetable, enlarged" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

function PeriodForm({ initial, onSave }) {
  const [subject, setSubject] = useState(initial.subject || "");
  const [start, setStart] = useState(initial.start || "");
  const [end, setEnd] = useState(initial.end || "");
  const [teacher, setTeacher] = useState(initial.teacher || "");
  const [room, setRoom] = useState(initial.room || "");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !start) { setError("Subject and start time are required."); return; }
    onSave({ ...initial, subject: subject.trim(), start, end, teacher, room });
  };

  return (
    <form onSubmit={submit}>
      <Field label="Subject">
        <input className={inputCls} value={subject} onChange={(e) => { setSubject(e.target.value); setError(""); }} placeholder="Mathematics" autoFocus />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start time"><input type="time" className={inputCls} value={start} onChange={(e) => setStart(e.target.value)} /></Field>
        <Field label="End time"><input type="time" className={inputCls} value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Teacher (optional)"><input className={inputCls} value={teacher} onChange={(e) => setTeacher(e.target.value)} /></Field>
        <Field label="Room (optional)"><input className={inputCls} value={room} onChange={(e) => setRoom(e.target.value)} /></Field>
      </div>
      <PrimaryButton type="submit" full>Save period</PrimaryButton>
    </form>
  );
}

/* ---------------------------------------------------------------------- */
/* EXAMS                                                                   */
/* ---------------------------------------------------------------------- */

function ExamsPage({ exams, setExams }) {
  const [modal, setModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const today = todayKey();
  const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date));

  const save = (item) => {
    const syllabus = typeof item.syllabus === "string" ? item.syllabus.split("\n").map((s) => s.trim()).filter(Boolean) : item.syllabus;
    const payload = { ...item, syllabus };
    if (item.id) setExams((prev) => prev.map((e) => (e.id === item.id ? payload : e)));
    else setExams((prev) => [...prev, { ...payload, id: uid() }]);
    setModal(null);
  };
  const remove = (id) => { setExams((prev) => prev.filter((e) => e.id !== id)); setConfirmId(null); };

  return (
    <div className="space-y-5">
      <PageHeader title="Exams" onAdd={() => setModal({})} addLabel="Add exam" />

      {sorted.length === 0 ? (
        <EmptyState icon={<GraduationCap size={28} />} title="No exams scheduled" body="Add one to see a countdown and syllabus here." />
      ) : (
        <div className="space-y-3">
          {sorted.map((e) => {
            const diff = daysBetween(today, e.date);
            return (
              <div key={e.id} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white font-medium">{e.subject}</p>
                    <p className="text-zinc-500 text-xs mt-1">📅 {formatNice(e.date)}{e.time ? ` · ⏰ ${e.time}` : ""}{e.room ? ` · Room ${e.room}` : ""}</p>
                    {e.syllabus?.length > 0 && (
                      <ul className="mt-2 text-xs text-zinc-400 list-disc list-inside space-y-0.5">
                        {e.syllabus.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    )}
                    {e.notes && <p className="text-xs text-zinc-500 mt-1">{e.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge tone={diff <= 0 ? "danger" : diff <= 3 ? "warning" : "muted"}>
                      {diff < 0 ? "Past" : diff === 0 ? "Today" : `${diff} day${diff === 1 ? "" : "s"} left`}
                    </Badge>
                    <div className="flex gap-1">
                      <IconButton title="Edit" onClick={() => setModal({ ...e, syllabus: (e.syllabus || []).join("\n") })}><Pencil size={14} /></IconButton>
                      <IconButton title="Delete" danger onClick={() => setConfirmId(e.id)}><Trash2 size={14} /></IconButton>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Edit exam" : "Add exam"}>
        {modal && <ExamForm initial={modal} onSave={save} />}
      </Modal>
      <ConfirmDialog open={!!confirmId} message="Delete this exam?" onCancel={() => setConfirmId(null)} onConfirm={() => remove(confirmId)} />
    </div>
  );
}

function ExamForm({ initial, onSave }) {
  const [subject, setSubject] = useState(initial.subject || "");
  const [date, setDate] = useState(initial.date || "");
  const [time, setTime] = useState(initial.time || "");
  const [room, setRoom] = useState(initial.room || "");
  const [syllabus, setSyllabus] = useState(initial.syllabus || "");
  const [notes, setNotes] = useState(initial.notes || "");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !date) { setError("Subject and date are required."); return; }
    onSave({ ...initial, subject: subject.trim(), date, time, room, syllabus, notes });
  };

  return (
    <form onSubmit={submit}>
      <Field label="Subject">
        <input className={inputCls} value={subject} onChange={(e) => { setSubject(e.target.value); setError(""); }} placeholder="Mathematics" autoFocus />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Time"><input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} /></Field>
      </div>
      <Field label="Room (optional)"><input className={inputCls} value={room} onChange={(e) => setRoom(e.target.value)} /></Field>
      <Field label="Syllabus (one item per line)">
        <textarea className={inputCls} rows={3} value={syllabus} onChange={(e) => setSyllabus(e.target.value)} placeholder={"Linear Equations\nPolynomials"} />
      </Field>
      <Field label="Notes (optional)"><textarea className={inputCls} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      <PrimaryButton type="submit" full>Save exam</PrimaryButton>
    </form>
  );
}

/* ---------------------------------------------------------------------- */
/* NOTES                                                                    */
/* ---------------------------------------------------------------------- */

function NotesPage({ notes, setNotes }) {
  const [modal, setModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [query, setQuery] = useState("");

  const filtered = notes
    .filter((n) => !query || (n.title + n.content + (n.subject || "")).toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);

  const save = (n) => {
    const now = Date.now();
    if (n.id) setNotes((prev) => prev.map((x) => (x.id === n.id ? { ...n, updatedAt: now } : x)));
    else setNotes((prev) => [...prev, { ...n, id: uid(), pinned: false, createdAt: now, updatedAt: now }]);
    setModal(null);
  };
  const remove = (id) => { setNotes((prev) => prev.filter((n) => n.id !== id)); setConfirmId(null); };
  const togglePin = (id) => setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));

  return (
    <div className="space-y-5">
      <PageHeader title="Notes" onAdd={() => setModal({})} addLabel="Add note" />

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input className={inputCls + " pl-9"} placeholder="Search notes" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<StickyNote size={28} />} title="No notes yet" body="Jot down definitions, reminders or ideas." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((n) => (
            <div key={n.id} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-white text-sm font-medium">{n.title}</p>
                <button onClick={() => togglePin(n.id)} title={n.pinned ? "Unpin" : "Pin"}>
                  <Pin size={14} className={n.pinned ? "text-amber-400 fill-amber-400" : "text-zinc-600"} />
                </button>
              </div>
              {n.subject && <Badge tone="muted">{n.subject}</Badge>}
              <p className="text-zinc-400 text-xs mt-2 whitespace-pre-wrap flex-1">{n.content}</p>
              <div className="flex gap-1 justify-end mt-3">
                <IconButton title="Edit" onClick={() => setModal(n)}><Pencil size={14} /></IconButton>
                <IconButton title="Delete" danger onClick={() => setConfirmId(n.id)}><Trash2 size={14} /></IconButton>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Edit note" : "Add note"}>
        {modal && <NoteForm initial={modal} onSave={save} />}
      </Modal>
      <ConfirmDialog open={!!confirmId} message="Delete this note?" onCancel={() => setConfirmId(null)} onConfirm={() => remove(confirmId)} />
    </div>
  );
}

function NoteForm({ initial, onSave }) {
  const [title, setTitle] = useState(initial.title || "");
  const [subject, setSubject] = useState(initial.subject || "");
  const [content, setContent] = useState(initial.content || "");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) { setError("Give the note a title."); return; }
    onSave({ ...initial, title: title.trim(), subject, content });
  };

  return (
    <form onSubmit={submit}>
      <Field label="Title">
        <input className={inputCls} value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }} placeholder="Things to ask teacher" autoFocus />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </Field>
      <Field label="Subject / category (optional)">
        <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Science" />
      </Field>
      <Field label="Content">
        <textarea className={inputCls} rows={5} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your note here" />
      </Field>
      <PrimaryButton type="submit" full>Save note</PrimaryButton>
    </form>
  );
}

/* ---------------------------------------------------------------------- */
/* WISHLIST                                                                 */
/* ---------------------------------------------------------------------- */

function WishlistPage({ wishlist, setWishlist }) {
  const [modal, setModal] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const save = (item) => {
    if (item.id) setWishlist((prev) => prev.map((w) => (w.id === item.id ? item : w)));
    else setWishlist((prev) => [...prev, { ...item, id: uid() }]);
    setModal(null);
  };
  const remove = (id) => { setWishlist((prev) => prev.filter((w) => w.id !== id)); setConfirmId(null); };
  const cycleStatus = (w) => {
    const order = ["Want", "Planning", "Bought", "Completed"];
    const next = order[(order.indexOf(w.status) + 1) % order.length];
    setWishlist((prev) => prev.map((x) => (x.id === w.id ? { ...x, status: next } : x)));
  };
  const statusTone = { Want: "muted", Planning: "warning", Bought: "success", Completed: "accent" };

  return (
    <div className="space-y-5">
      <PageHeader title="Wishlist" onAdd={() => setModal({})} addLabel="Add item" />

      {wishlist.length === 0 ? (
        <EmptyState icon={<Star size={28} />} title="Your wishlist is empty" body="Add something you've been wanting." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {wishlist.map((w) => (
            <div key={w.id} className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col">
              {w.image ? (
                <img src={w.image} alt={w.name} className="h-32 w-full object-cover" />
              ) : (
                <div className="h-24 w-full bg-zinc-800 flex items-center justify-center text-zinc-600"><Star size={22} /></div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-white text-sm font-medium">{w.name}</p>
                {w.description && <p className="text-zinc-500 text-xs mt-1">{w.description}</p>}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {w.category && <Badge tone="muted">{w.category}</Badge>}
                  {w.price && <Badge tone="muted">₹{w.price}</Badge>}
                  <button onClick={() => cycleStatus(w)}><Badge tone={statusTone[w.status]}>{w.status}</Badge></button>
                </div>
                <div className="flex gap-1 justify-end mt-auto pt-3">
                  <IconButton title="Edit" onClick={() => setModal(w)}><Pencil size={14} /></IconButton>
                  <IconButton title="Delete" danger onClick={() => setConfirmId(w.id)}><Trash2 size={14} /></IconButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? "Edit item" : "Add wishlist item"}>
        {modal && <WishlistForm initial={modal} onSave={save} />}
      </Modal>
      <ConfirmDialog open={!!confirmId} message="Delete this item?" onCancel={() => setConfirmId(null)} onConfirm={() => remove(confirmId)} />
    </div>
  );
}

function WishlistForm({ initial, onSave }) {
  const [name, setName] = useState(initial.name || "");
  const [description, setDescription] = useState(initial.description || "");
  const [price, setPrice] = useState(initial.price || "");
  const [category, setCategory] = useState(initial.category || "");
  const [priority, setPriority] = useState(initial.priority || "medium");
  const [status, setStatus] = useState(initial.status || "Want");
  const [image, setImage] = useState(initial.image || "");
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result);
    reader.readAsDataURL(file);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError("Give the item a name."); return; }
    onSave({ ...initial, name: name.trim(), description, price, category, priority, status, image });
  };

  return (
    <form onSubmit={submit}>
      <Field label="Name">
        <input className={inputCls} value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="Wireless earphones" autoFocus />
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </Field>
      <Field label="Description (optional)">
        <textarea className={inputCls} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Estimated price"><input className={inputCls} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2500" /></Field>
        <Field label="Category"><input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Gadgets" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Priority">
          <select className={inputCls} value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </Field>
        <Field label="Status">
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>Want</option><option>Planning</option><option>Bought</option><option>Completed</option>
          </select>
        </Field>
      </div>
      <Field label="Image (optional)">
        <GhostButton onClick={() => fileRef.current?.click()}><ImageIcon size={14} />{image ? "Change image" : "Upload image"}</GhostButton>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        {image && <img src={image} alt="" className="h-16 mt-2 rounded" />}
      </Field>
      <PrimaryButton type="submit" full>Save item</PrimaryButton>
    </form>
  );
}

/* ---------------------------------------------------------------------- */
/* AI DOUBT SOLVER                                                          */
/* ---------------------------------------------------------------------- */

const TUTOR_SYSTEM_PROMPT = `You are a friendly, patient tutor for a Class 9 (age 14-15) student in India, helping with Maths, Science, English, Social Science and general school questions.
Rules you must follow:
- Never just give the final answer. Walk through the reasoning step by step.
- Use simple, everyday language. Avoid unnecessarily advanced terminology; if you must use a technical term, briefly explain it.
- Break difficult problems into small, clear steps.
- Give a concrete example when it helps understanding.
- If the student's question is unclear or missing information, ask a short follow-up question instead of guessing.
- Encourage understanding over copying: end with a small check-in question or a suggestion for what to try next when appropriate.
- Keep responses focused and not overly long.
- Be warm and encouraging in tone, like a supportive older tutor.`;

function AIChatPage({ settings, chatMessages, setChatMessages }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, loading]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError("");
    const newMessages = [...chatMessages, { role: "user", text }];
    setChatMessages(newMessages);
    setLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: TUTOR_SYSTEM_PROMPT,
          messages: newMessages.map((m) => ({ role: m.role, content: m.text })),
        }),
      });
      const data = await response.json();
      const reply = data?.content?.map((c) => c.text || "").join("\n").trim() || "I couldn't come up with an answer just now — try asking again.";
      setChatMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text) => navigator.clipboard?.writeText(text).catch(() => {});

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-medium text-white">Doubt Solver</h1>
        <div className="flex gap-2">
          <GhostButton onClick={() => setChatMessages([])}><RotateCcw size={14} />New chat</GhostButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-4">
        {chatMessages.length === 0 && (
          <EmptyState icon={<Bot size={28} />} title="Ask me anything about school" body="Maths, Science, English, Social Science — I'll walk you through it step by step." />
        )}
        {chatMessages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-100"}`}>
              {m.text}
              {m.role === "assistant" && (
                <button onClick={() => copyText(m.text)} className="block mt-2 text-zinc-500 hover:text-white" title="Copy answer">
                  <Copy size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl px-4 py-2.5 text-sm text-zinc-400">Thinking…</div>
          </div>
        )}
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 mt-3">
        <input
          className={inputCls}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a doubt — e.g. how do I factorise x² + 5x + 6?"
        />
        <button type="submit" disabled={loading} className="rounded-lg bg-amber-400 text-zinc-950 px-4 py-2 hover:bg-amber-300 disabled:opacity-50 shrink-0">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* SETTINGS                                                                 */
/* ---------------------------------------------------------------------- */

const AVATARS = ["🎓", "📚", "🌟", "🦋", "🌸", "🐱", "🎨", "⚡"];

function SettingsPage({ settings, setSettings }) {
  const [name, setName] = useState(settings.name || "");
  const [avatar, setAvatar] = useState(settings.avatar || "🎓");
  const [saved, setSaved] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setSettings({ name: name.trim() || "there", avatar });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="space-y-5 max-w-md">
      <PageHeader title="Settings" />
      <form onSubmit={submit} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5">
        <Field label="Your name">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </Field>
        <Field label="Avatar">
          <div className="flex gap-2 flex-wrap">
            {AVATARS.map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => setAvatar(a)}
                className={`h-10 w-10 rounded-lg text-lg flex items-center justify-center border ${avatar === a ? "border-amber-400 bg-amber-950" : "border-zinc-700 hover:border-zinc-500"}`}
              >
                {a}
              </button>
            ))}
          </div>
        </Field>
        <PrimaryButton type="submit" full>{saved ? "Saved" : "Save settings"}</PrimaryButton>
      </form>
      <p className="text-zinc-500 text-xs">The dark theme is fixed by design — no need to configure it.</p>
    </div>
  );
}

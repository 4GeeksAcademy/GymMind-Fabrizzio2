import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { MobileNavbar } from "../components/MobileNavbar.jsx";
import { useLang } from "../context/LanguageContext.jsx";

export const Progress = () => {
  const navigate = useNavigate();
  const { store, dispatch } = useGlobalReducer();
  const { t, lang, toggleLang } = useLang();
  const [weightInput, setWeightInput] = useState("");

  const today = new Date();
  const [dayInput, setDayInput] = useState(String(today.getDate()));
  const [monthInput, setMonthInput] = useState(String(today.getMonth() + 1));
  const [yearInput, setYearInput] = useState(String(today.getFullYear()));
  const getDateStr = () =>
    `${yearInput}-${monthInput.padStart(2, "0")}-${dayInput.padStart(2, "0")}`;

  const [showSuccess, setShowSuccess] = useState(false);
  const [weightError, setWeightError] = useState("");
  const [logs, setLogs] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const user = store.user || JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = store.token || sessionStorage.getItem("token");
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token]);

  useEffect(() => {
    if (!user?.id || !token) return;
    fetchData();
  }, [user?.id, token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [progressRes, workoutRes] = await Promise.all([
        fetch(`${backendUrl}/api/progress/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${backendUrl}/api/workout/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      if (progressRes.ok) setLogs(await progressRes.json());
      if (workoutRes.ok) setWorkouts(await workoutRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    dispatch({ type: "logout" });
    navigate("/");
  };

  const handleLogWeight = async () => {
    if (!weightInput) return;
    setWeightError("");
    try {
      const response = await fetch(`${backendUrl}/api/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: user.id,
          weight: parseFloat(weightInput),
          date: getDateStr()
        })
      });
      if (response.ok) {
        setShowSuccess(true);
        setWeightInput("");
        fetchData();
        setTimeout(() => setShowSuccess(false), 2500);
      } else {
        const data = await response.json();
        setWeightError(data.error || t("pr_error_failed"));
      }
    } catch (error) {
      setWeightError(t("pr_error_connection"));
    }
  };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  const currentWeight = logs.length > 0 ? logs[0].weight : null;
  const firstWeight = logs.length > 0 ? logs[logs.length - 1].weight : null;
  const weightChange = currentWeight && firstWeight ? (currentWeight - firstWeight).toFixed(1) : null;
  const daysTrainedThisMonth = workouts.filter(w => new Date(w.date) >= startOfMonth).length;
  const daysTrainedThisWeek = workouts.filter(w => new Date(w.date) >= startOfWeek).length;

  const trainedDates = new Set(workouts.map(w => w.date));
  const weightDates = {};
  logs.forEach(log => { weightDates[log.date] = log.weight; });

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    const days = [];
    for (let i = 0; i < offset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ day: d, dateStr });
    }
    return days;
  };

  const calendarDays = getCalendarDays();
  const monthName = currentMonth.toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "long", year: "numeric" });
  const todayStr = now.toISOString().split("T")[0];

  const chartLogs = [...logs].reverse().slice(-10);
  const chartPoints = () => {
    if (chartLogs.length < 2) return null;
    const weights = chartLogs.map(l => l.weight);
    const minW = Math.min(...weights) - 1;
    const maxW = Math.max(...weights) + 1;
    const w = 400, h = 140;
    const points = chartLogs.map((log, i) => {
      const x = (i / (chartLogs.length - 1)) * w;
      const y = h - ((log.weight - minW) / (maxW - minW)) * h;
      return { x, y, weight: log.weight, date: log.date };
    });
    const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
    const area = `${path} L${w},${h} L0,${h} Z`;
    return { points, path, area, minW, maxW };
  };
  const chart = chartPoints();

  const weekDayKeys = ["pr_mon", "pr_tue", "pr_wed", "pr_thu", "pr_fri", "pr_sat", "pr_sun"];
  const todayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const getWeekDayDate = (index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + index);
    return date.toISOString().split("T")[0];
  };

  const monthOptions = lang === "es"
    ? ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
    : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        :root { --bg: #080c10; --bg2: #0d1318; --accent: #00e5ff; --accent2: #00ff88; --text: #f0f4f8; --muted: #6b7c8f; --card: rgba(255,255,255,0.04); --border: rgba(255,255,255,0.08); }
        .pr-body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }
        .pr-nav { display: flex; align-items: center; height: 56px; background: rgba(8,12,16,0.97); border-bottom: 1px solid var(--border); padding: 0 20px; width: 100%; position: sticky; top: 0; z-index: 100; }
        .pr-logo { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 2px; color: var(--accent); white-space: nowrap; flex-shrink: 0; margin-right: 24px; cursor: pointer; }
        .pr-nav-links { display: flex; gap: 24px; flex: 1; }
        .pr-nav-links a { color: var(--muted); text-decoration: none; font-size: 13px; font-weight: 500; white-space: nowrap; transition: color 0.2s; cursor: pointer; }
        .pr-nav-links a:hover { color: var(--text); }
        .pr-nav-links a.active { color: var(--accent); }
        .pr-nav-cta { display: flex; gap: 8px; align-items: center; flex-shrink: 0; margin-left: 24px; }
        .pr-btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text); padding: 6px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .pr-btn-danger { background: transparent; border: 1px solid rgba(255,80,80,0.3); color: #ff6b6b; padding: 6px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .pr-lang-btn { background: transparent; border: 1px solid rgba(0,229,255,0.35); color: #00e5ff; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; letter-spacing: 0.5px; transition: background 0.2s; }
        .pr-lang-btn:hover { background: rgba(0,229,255,0.08); }
        .pr-page { padding: 28px 24px; max-width: 1000px; margin: 0 auto; width: 100%; }
        .pr-section-label { font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--accent); margin-bottom: 4px; }
        .pr-page-title { font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: 2px; margin-bottom: 24px; }
        .pr-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
        .pr-stat-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; }
        .pr-stat-icon { font-size: 18px; margin-bottom: 6px; }
        .pr-stat-num { font-family: 'Bebas Neue', sans-serif; font-size: 28px; color: var(--accent); letter-spacing: 1px; }
        .pr-stat-num.green { color: var(--accent2); }
        .pr-stat-num.red { color: #ff6b6b; }
        .pr-stat-label { font-size: 11px; color: var(--muted); margin-top: 2px; }
        .pr-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 16px; }
        .pr-card-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 1px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
        .pr-log-form { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }
        .pr-form-group { flex: 1; min-width: 120px; }
        .pr-form-label { display: block; font-size: 12px; color: var(--muted); margin-bottom: 6px; font-weight: 500; }
        .pr-form-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid var(--border); border-radius: 8px; padding: 9px 12px; font-size: 14px; color: var(--text); font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .pr-form-input:focus { border-color: var(--accent); }
        .pr-form-input[type=number]::-webkit-inner-spin-button,
        .pr-form-input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .pr-form-input[type=number] { -moz-appearance: textfield; }
        .pr-form-input option { background: #0d1318; color: var(--text); }
        select.pr-form-input { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%236b7c8f' d='M0 0l5 6 5-6z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; background-color: rgba(255,255,255,0.04); padding-right: 28px; cursor: pointer; }
        .pr-date-selects { display: flex; gap: 6px; }
        .pr-btn-accent { background: var(--accent); color: #000; padding: 9px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; white-space: nowrap; align-self: flex-end; }
        .pr-success-msg { background: rgba(0,255,136,0.08); border: 1px solid rgba(0,255,136,0.2); border-radius: 8px; padding: 8px 14px; font-size: 13px; color: var(--accent2); margin-top: 10px; }
        .pr-error-msg { background: rgba(255,80,80,0.08); border: 1px solid rgba(255,80,80,0.2); border-radius: 8px; padding: 8px 14px; font-size: 13px; color: #ff6b6b; margin-top: 10px; }
        .pr-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .pr-log-table { width: 100%; border-collapse: collapse; }
        .pr-log-table th { font-size: 11px; color: var(--muted); font-weight: 500; text-align: left; padding: 8px 0; border-bottom: 1px solid var(--border); text-transform: uppercase; }
        .pr-log-table td { font-size: 13px; padding: 10px 0; border-bottom: 1px solid var(--border); }
        .pr-log-table tr:last-child td { border-bottom: none; }
        .pr-weight-val { color: var(--accent); font-weight: 600; }
        .pr-change-pos { color: var(--accent2); font-size: 12px; }
        .pr-change-neg { color: #ff6b6b; font-size: 12px; }
        .pr-change-neutral { color: var(--muted); font-size: 12px; }
        .pr-week-row { display: flex; gap: 6px; }
        .pr-day-chip { flex: 1; text-align: center; padding: 10px 4px; border-radius: 8px; border: 1px solid var(--border); font-size: 11px; }
        .pr-day-chip.trained { background: rgba(0,255,136,0.08); border-color: rgba(0,255,136,0.3); color: var(--accent2); }
        .pr-day-chip.today { border-color: var(--accent); color: var(--accent); }
        .pr-day-name { font-weight: 600; margin-bottom: 2px; }
        .pr-day-status { font-size: 10px; }
        .pr-cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .pr-cal-month { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 1px; }
        .pr-cal-nav { background: transparent; border: 1px solid var(--border); color: var(--text); width: 28px; height: 28px; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; }
        .pr-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
        .pr-cal-day-header { text-align: center; font-size: 9px; color: var(--muted); font-weight: 600; padding: 3px 0; text-transform: uppercase; }
        .pr-cal-day { aspect-ratio: 1; border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; position: relative; min-height: 32px; max-height: 36px; }
        .pr-cal-day:hover:not(.empty) { border-color: var(--border); }
        .pr-cal-day.empty { cursor: default; }
        .pr-cal-day.today { border-color: var(--accent); color: var(--accent); }
        .pr-cal-day.trained { background: rgba(0,255,136,0.12); border-color: rgba(0,255,136,0.3); color: var(--accent2); }
        .pr-cal-day.weighed { background: rgba(0,229,255,0.10); border-color: rgba(0,229,255,0.3); color: var(--accent); }
        .pr-cal-day.trained.weighed { background: rgba(0,229,255,0.14); border-color: rgba(0,229,255,0.4); color: var(--accent); }
        .pr-cal-day.selected { box-shadow: 0 0 0 2px rgba(0,229,255,0.4); }
        .pr-cal-dot { width: 4px; height: 4px; border-radius: 50%; position: absolute; bottom: 3px; }
        .pr-cal-dot.trained { background: var(--accent2); left: 4px; }
        .pr-cal-dot.weighed { background: var(--accent); right: 4px; }
        .pr-cal-legend { display: flex; gap: 16px; margin-top: 12px; font-size: 11px; color: var(--muted); }
        .pr-cal-legend-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 4px; }
        .pr-day-detail { background: rgba(0,229,255,0.04); border: 1px solid rgba(0,229,255,0.15); border-radius: 10px; padding: 14px; margin-top: 12px; font-size: 13px; }
        .pr-day-detail-title { font-weight: 600; color: var(--accent); margin-bottom: 6px; }
        .pr-side-panel { width: 0; overflow: hidden; transition: width 0.3s ease; border-left: 0px solid var(--border); background: rgba(0,0,0,0.2); }
        .pr-side-panel.open { width: 260px; border-left-width: 1px; }
        .pr-side-inner { width: 260px; padding: 16px; height: 100%; overflow-y: auto; }
        .pr-side-close { float: right; background: none; border: none; cursor: pointer; color: var(--muted); font-size: 18px; line-height: 1; padding: 0; }
        .pr-side-close:hover { color: var(--text); }
        .pr-side-date { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 1px; margin-bottom: 4px; clear: both; }
        .pr-side-section { margin-bottom: 16px; }
        .pr-side-section-title { font-size: 11px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid var(--border); }
        .pr-side-ex { padding: 8px 0; border-bottom: 1px solid var(--border); }
        .pr-side-ex:last-child { border-bottom: none; }
        .pr-side-ex-name { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
        .pr-side-ex-detail { font-size: 12px; color: var(--muted); }
        .pr-side-ex-weight { color: var(--accent); font-weight: 600; }
        .pr-diff-badge { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 10px; margin-left: 4px; }
        .pr-diff-easy { background: rgba(0,255,136,0.15); color: var(--accent2); }
        .pr-diff-hard { background: rgba(255,107,107,0.15); color: #ff6b6b; }
        .pr-side-stat { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid var(--border); }
        .pr-side-stat:last-child { border-bottom: none; }
        .pr-side-stat-label { color: var(--muted); }
        .pr-side-stat-val { font-weight: 600; color: var(--accent); }
        .pr-side-empty { text-align: center; padding: 24px 0; color: var(--muted); font-size: 13px; }
        .pr-cal-wrap { display: flex; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: var(--bg2); margin-bottom: 16px; }
        .pr-cal-main { flex: 1; padding: 20px; min-width: 0; }
        .pr-empty { text-align: center; padding: 20px; color: var(--muted); font-size: 13px; }
        .pr-loading { text-align: center; padding: 60px; color: var(--muted); }
        .pr-spinner { width: 36px; height: 36px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: pr-spin 0.8s linear infinite; margin: 0 auto 12px; }
        @keyframes pr-spin { to { transform: rotate(360deg); } }
        @keyframes pr-fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .pr-page > * { animation: pr-fadeUp 0.5s ease both; }
        @media (max-width: 768px) {
          .pr-nav { display: none !important; }
          .pr-stats-row { grid-template-columns: repeat(2, 1fr); }
          .pr-week-row { flex-wrap: wrap; }
          .pr-day-chip { min-width: calc(25% - 6px); }
        }
      `}</style>

      <div className="pr-body">
        <MobileNavbar />

        <nav className="pr-nav">
          <div className="pr-logo" onClick={() => navigate("/")}>GymMind AI</div>
          <div className="pr-nav-links">
            <a onClick={() => navigate("/dashboard")}>{t("nav_dashboard")}</a>
            <a onClick={() => navigate("/workout")}>{t("nav_workout")}</a>
            <a onClick={() => navigate("/moodcheck")}>{t("nav_moodcheck")}</a>
            <a className="active">{t("nav_progress")}</a>
            <a onClick={() => navigate("/nutrition")}>{t("nav_nutrition")}</a>
            <a onClick={() => navigate("/profile")}>{t("nav_profile")}</a>
          </div>
          <div className="pr-nav-cta">
            <button className="pr-btn-ghost" onClick={() => navigate("/profile")}>{t("profile_edit")}</button>
            <button className="pr-lang-btn" onClick={toggleLang}>
              {lang === "en" ? "🌐 ES" : "🌐 EN"}
            </button>
            <button className="pr-btn-danger" onClick={handleLogout}>{t("nav_signout")}</button>
          </div>
        </nav>

        <div className="pr-page">
          <div className="pr-section-label">{t("pr_subtitle")}</div>
          <div className="pr-page-title">{t("pr_title")}</div>

          {loading ? (
            <div className="pr-loading">
              <div className="pr-spinner"></div>
              <div>{t("pr_loading")}</div>
            </div>
          ) : (
            <>
              {/* STATS */}
              <div className="pr-stats-row">
                <div className="pr-stat-card">
                  <div className="pr-stat-icon">⚖️</div>
                  <div className="pr-stat-num">{currentWeight || "—"}</div>
                  <div className="pr-stat-label">{t("pr_stat_current_weight")}</div>
                </div>
                <div className="pr-stat-card">
                  <div className="pr-stat-icon">📉</div>
                  <div className={`pr-stat-num ${weightChange === null ? "" : weightChange < 0 ? "green" : weightChange > 0 ? "red" : ""}`}>
                    {weightChange !== null ? (weightChange > 0 ? `+${weightChange}` : weightChange) : "—"}
                  </div>
                  <div className="pr-stat-label">{t("pr_stat_kg_change")}</div>
                </div>
                <div className="pr-stat-card">
                  <div className="pr-stat-icon">🔥</div>
                  <div className="pr-stat-num">{daysTrainedThisMonth}</div>
                  <div className="pr-stat-label">{t("pr_stat_days_month")}</div>
                </div>
                <div className="pr-stat-card">
                  <div className="pr-stat-icon">📅</div>
                  <div className="pr-stat-num">{daysTrainedThisWeek}</div>
                  <div className="pr-stat-label">{t("pr_stat_days_week")}</div>
                </div>
              </div>

              {/* LOG WEIGHT */}
              <div className="pr-card">
                <div className="pr-card-title">⚖️ {t("pr_log_title")}</div>
                <div className="pr-log-form">
                  <div className="pr-form-group">
                    <label className="pr-form-label">{t("pr_log_weight_label")}</label>
                    <input
                      className="pr-form-input"
                      type="number"
                      placeholder={t("pr_log_weight_placeholder")}
                      step="0.1"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleLogWeight()}
                    />
                  </div>
                  <div className="pr-form-group">
                    <label className="pr-form-label">{t("pr_log_date_label")}</label>
                    <div className="pr-date-selects">
                      <select className="pr-form-input" style={{ flex: 1 }} value={dayInput} onChange={e => setDayInput(e.target.value)}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={String(d)}>{String(d).padStart(2, "0")}</option>
                        ))}
                      </select>
                      <select className="pr-form-input" style={{ flex: 2 }} value={monthInput} onChange={e => setMonthInput(e.target.value)}>
                        {monthOptions.map((m, i) => (
                          <option key={i} value={String(i + 1)}>{m}</option>
                        ))}
                      </select>
                      <select className="pr-form-input" style={{ flex: 2 }} value={yearInput} onChange={e => setYearInput(e.target.value)}>
                        {[2024, 2025, 2026].map(y => (
                          <option key={y} value={String(y)}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button className="pr-btn-accent" onClick={handleLogWeight}>{t("pr_log_save")}</button>
                </div>
                {showSuccess && <div className="pr-success-msg">✅ {t("pr_log_success")}</div>}
                {weightError && <div className="pr-error-msg">⚠️ {weightError}</div>}
              </div>

              {/* CALENDAR */}
              <div className="pr-cal-wrap">
                <div className="pr-cal-main">
                  <div className="pr-card-title">📅 {t("pr_cal_title")}</div>
                  <div className="pr-cal-header">
                    <button className="pr-cal-nav" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>‹</button>
                    <div className="pr-cal-month">{monthName}</div>
                    <button className="pr-cal-nav" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>›</button>
                  </div>
                  <div className="pr-cal-grid">
                    {weekDayKeys.map(k => (
                      <div key={k} className="pr-cal-day-header">{t(k)}</div>
                    ))}
                    {calendarDays.map((day, i) => {
                      if (!day) return <div key={i} className="pr-cal-day empty" />;
                      const isTrained = trainedDates.has(day.dateStr);
                      const hasWeight = !!weightDates[day.dateStr];
                      const isToday = day.dateStr === todayStr;
                      const isSelected = selectedDay === day.dateStr;
                      return (
                        <div
                          key={i}
                          className={["pr-cal-day", isToday ? "today" : "", isTrained ? "trained" : "", hasWeight ? "weighed" : "", isSelected ? "selected" : ""].join(" ")}
                          onClick={() => setSelectedDay(isSelected ? null : day.dateStr)}
                        >
                          {day.day}
                          {isTrained && <div className="pr-cal-dot trained" />}
                          {hasWeight && <div className="pr-cal-dot weighed" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="pr-cal-legend">
                    <span><span className="pr-cal-legend-dot" style={{ background: "var(--accent2)" }}></span>{t("pr_cal_legend_workout")}</span>
                    <span><span className="pr-cal-legend-dot" style={{ background: "var(--accent)" }}></span>{t("pr_cal_legend_weight")}</span>
                  </div>
                </div>

                {/* SIDE PANEL */}
                <div className={`pr-side-panel ${selectedDay ? "open" : ""}`}>
                  {selectedDay && (
                    <div className="pr-side-inner">
                      <button className="pr-side-close" onClick={() => setSelectedDay(null)}>✕</button>
                      <div className="pr-side-date">{selectedDay}</div>
                      <DayDetail
                        date={selectedDay}
                        isTrained={trainedDates.has(selectedDay)}
                        weight={weightDates[selectedDay]}
                        token={token}
                        backendUrl={backendUrl}
                        t={t}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* WEIGHT LOG TABLE */}
              <div className="pr-card">
                <div className="pr-card-title">📋 {t("pr_table_title")}</div>
                {logs.length === 0 ? (
                  <div className="pr-empty">{t("pr_table_empty")}</div>
                ) : (
                  <div style={{ overflowY: "auto", maxHeight: "300px" }}>
                    <table className="pr-log-table">
                      <thead>
                        <tr>
                          <th>{t("pr_table_date")}</th>
                          <th>{t("pr_table_weight")}</th>
                          <th>{t("pr_table_change")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log, i) => {
                          const prev = logs[i + 1];
                          const change = prev ? (log.weight - prev.weight).toFixed(1) : null;
                          return (
                            <tr key={log.id || i}>
                              <td>{new Date(log.date + "T12:00:00").toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                              <td className="pr-weight-val">{log.weight} kg</td>
                              <td className={change === null ? "pr-change-neutral" : change < 0 ? "pr-change-pos" : "pr-change-neg"}>
                                {change !== null ? (change > 0 ? `↑ +${change}` : `↓ ${change}`) : t("pr_table_start")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* CHART */}
              <div className="pr-card">
                <div className="pr-card-title">📈 {t("pr_chart_title")}</div>
                {chart ? (
                  <>
                    <div style={{ position: "relative", height: "160px", marginBottom: "8px" }}>
                      <svg width="100%" height="100%" viewBox="0 0 400 140" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d={chart.area} fill="url(#prGrad)" />
                        <path d={chart.path} fill="none" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        {chart.points.map((p, i) => (
                          <circle key={i} cx={p.x} cy={p.y} r={i === chart.points.length - 1 ? 5 : 4} fill={i === chart.points.length - 1 ? "#00ff88" : "#00e5ff"} />
                        ))}
                      </svg>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--muted)" }}>
                      {chartLogs.map((l, i) => <span key={i}>{l.date?.slice(5)}</span>)}
                    </div>
                  </>
                ) : (
                  <div className="pr-empty">
                    {t("pr_chart_empty")}<br />
                    <span style={{ color: "var(--accent)", cursor: "pointer" }} onClick={() => document.querySelector(".pr-form-input")?.focus()}>
                      {t("pr_chart_cta")}
                    </span>
                  </div>
                )}
              </div>

              {/* WEEK TRACKER */}
              <div className="pr-card">
                <div className="pr-card-title">📅 {t("pr_week_title")}</div>
                <div className="pr-week-row">
                  {weekDayKeys.map((key, index) => {
                    const dayStr = getWeekDayDate(index);
                    const isTrained = trainedDates.has(dayStr);
                    const isToday = index === todayIndex;
                    return (
                      <div key={key} className={`pr-day-chip ${isTrained ? "trained" : ""} ${isToday ? "today" : ""}`}>
                        <div className="pr-day-name">{t(key)}</div>
                        <div className="pr-day-status">{isTrained ? "✅" : isToday ? t("pr_today") : "—"}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const DayDetail = ({ date, isTrained, weight, token, backendUrl, t }) => {
  const [exLogs, setExLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (!date || !isTrained) return;
    setLoadingLogs(true);
    fetch(`${backendUrl}/api/exercise-log/date/${date}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setExLogs(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingLogs(false));
  }, [date]);

  if (!isTrained && !weight) {
    return <div className="pr-side-empty">{t("pr_day_empty")}</div>;
  }

  const totalVolume = exLogs.filter(l => l.weight).reduce((s, l) => s + l.weight * l.sets * l.reps, 0);

  return (
    <>
      {weight && (
        <div className="pr-side-section">
          <div className="pr-side-section-title">{t("pr_day_bodyweight")}</div>
          <div className="pr-side-stat">
            <span className="pr-side-stat-label">{t("pr_day_logged_weight")}</span>
            <span className="pr-side-stat-val">{weight} kg</span>
          </div>
        </div>
      )}
      {isTrained && (
        <div className="pr-side-section">
          <div className="pr-side-section-title">{t("pr_day_exercises")}</div>
          {loadingLogs ? (
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{t("pr_day_loading")}</div>
          ) : exLogs.length > 0 ? (
            <>
              {exLogs.map((log, i) => (
                <div key={i} className="pr-side-ex">
                  <div className="pr-side-ex-name">
                    {log.exercise_name}
                    <span className={`pr-diff-badge ${log.difficulty?.includes("hard") ? "pr-diff-hard" : "pr-diff-easy"}`}>
                      {log.difficulty?.replace("_", " ")}
                    </span>
                  </div>
                  <div className="pr-side-ex-detail">
                    {log.sets} {t("pr_sets")} × {log.reps} {t("pr_reps")}
                    {log.weight ? <> · <span className="pr-side-ex-weight">{log.weight} kg</span></> : ` · ${t("pr_bodyweight")}`}
                  </div>
                </div>
              ))}
              {totalVolume > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <div className="pr-side-section-title">{t("pr_volume")}</div>
                  <div className="pr-side-stat">
                    <span className="pr-side-stat-label">{t("pr_total_volume")}</span>
                    <span className="pr-side-stat-val">{totalVolume.toLocaleString()} kg</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: "12px", color: "var(--muted)" }}>{t("pr_day_no_weight_logs")}</div>
          )}
        </div>
      )}
    </>
  );
};
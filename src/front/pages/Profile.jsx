import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";
import { MobileNavbar } from "../components/MobileNavbar";
import { useLang } from "../context/LanguageContext.jsx";

const Profile = () => {
    const { store } = useGlobalReducer();
    const { t, lang, toggleLang } = useLang();
    const userId = store.user?.id || JSON.parse(sessionStorage.getItem("user") || "{}").id;
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState("Gain muscle");

    const [photos, setPhotos] = useState([]);
    const [photoFilter, setPhotoFilter] = useState("all");
    const [visibleCount, setVisibleCount] = useState(9);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoNotes, setPhotoNotes] = useState("");
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploadError, setUploadError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token || !userId) { navigate("/login"); return; }

        fetch(`${backendUrl}/api/user/${userId}`)
            .then(res => res.json())
            .then(data => { if (data.error) setError(data.error); else setUser(data); })
            .catch(() => setError("Could not connect to server"));

        fetch(`${backendUrl}/api/user/${userId}/progress-photos`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const sorted = [...data].sort((a, b) => new Date(a.taken_at) - new Date(b.taken_at));
                    setPhotos(sorted);
                }
            })
            .catch(() => { });
    }, [userId]);

    const getFilteredPhotos = () => {
        if (photoFilter === "all") return photos;
        const now = new Date();
        const cutoff = new Date();
        if (photoFilter === "biweekly") cutoff.setDate(now.getDate() - 14);
        if (photoFilter === "monthly") cutoff.setMonth(now.getMonth() - 1);
        return photos.filter(p => new Date(p.taken_at) >= cutoff);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleUploadPhoto = async () => {
        if (!photoFile) return;
        setUploadingPhoto(true);
        setUploadError("");
        const token = sessionStorage.getItem("token");
        const formData = new FormData();
        formData.append("photo", photoFile);
        formData.append("notes", photoNotes);
        try {
            const res = await fetch(`${backendUrl}/api/user/${userId}/progress-photo`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                const updated = [...photos, data].sort((a, b) => new Date(a.taken_at) - new Date(b.taken_at));
                setPhotos(updated);
                setShowPhotoModal(false);
                setPhotoFile(null);
                setPhotoNotes("");
                setPreviewUrl(null);
                setUploadError("");
            } else {
                setUploadError(data.error || "Upload failed");
            }
        } catch (e) {
            setUploadError("Connection error: " + e.message);
        }
        setUploadingPhoto(false);
    };

    const closeModal = () => {
        setShowPhotoModal(false);
        setPhotoFile(null);
        setPhotoNotes("");
        setPreviewUrl(null);
        setUploadError("");
    };

    const calculateAge = (dob) => {
        if (!dob) return null;
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const goals = [
        { id: "Lose fat", label: t("goal_losefat"), sub: t("goal_losefat_sub") },
        { id: "Gain muscle", label: t("goal_gainmuscle"), sub: t("goal_gainmuscle_sub") },
        { id: "Body recomposition", label: t("goal_recomp"), sub: t("goal_recomp_sub") },
    ];

    if (error) return <p style={{ color: "#ff4d4d", textAlign: "center", marginTop: "40px" }}>{error}</p>;
    if (!user) return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0a0a" }}>
            <div style={{ width: "48px", height: "48px", border: "4px solid #1a1a2e", borderTop: "4px solid #0066ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
            <p style={{ color: "#666", marginTop: "16px", fontSize: "14px" }}>{t("loading_profile")}</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    const initials = user.first_name[0].toUpperCase() + user.last_name[0].toUpperCase();
    const age = calculateAge(user.date_of_birth);
    const memberSince = "May 2025";

    const filteredPhotos = getFilteredPhotos();
    const firstPhoto = photos[0];
    const visiblePhotos = filteredPhotos.slice(0, visibleCount);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');

                :root {
                    --bg: #080c10; --bg2: #0d1318; --accent: #00e5ff; --accent2: #00ff88;
                    --text: #f0f4f8; --muted: #6b7c8f; --border: rgba(255,255,255,0.08);
                }

                .pf-body { background: var(--bg); color: var(--text); font-family: 'DM Sans', sans-serif; min-height: 100vh; }

                .pf-nav { display: flex; align-items: center; height: 56px; background: rgba(8,12,16,0.97); border-bottom: 1px solid var(--border); padding: 0 20px; width: 100%; }
                .pf-logo { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 2px; color: var(--accent); white-space: nowrap; flex-shrink: 0; margin-right: 24px; }
                .pf-nav-links { display: flex; gap: 24px; flex: 1; }
                .pf-nav-links a { color: var(--muted); text-decoration: none; font-size: 13px; font-weight: 500; white-space: nowrap; transition: color 0.2s; cursor: pointer; }
                .pf-nav-links a.active { color: var(--accent); }
                .pf-nav-cta { display: flex; gap: 8px; align-items: center; flex-shrink: 0; margin-left: 24px; }
                .pf-btn-ghost { background: transparent; border: 1px solid var(--border); color: var(--text); padding: 6px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
                .pf-btn-danger { background: transparent; border: 1px solid rgba(255,80,80,0.3); color: #ff6b6b; padding: 6px 14px; border-radius: 6px; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
                .pf-lang-btn { background: transparent; border: 1px solid rgba(0,229,255,0.35); color: #00e5ff; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; letter-spacing: 0.5px; transition: background 0.2s; }
                .pf-lang-btn:hover { background: rgba(0,229,255,0.08); }

                .pf-page { padding: 32px 24px; max-width: 1000px; margin: 0 auto; }
                .pf-section-label { font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--accent); margin-bottom: 4px; }
                .pf-page-title { font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: 2px; margin-bottom: 24px; }

                .pf-hero { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 28px; display: flex; align-items: center; gap: 24px; margin-bottom: 20px; flex-wrap: wrap; }
                .pf-avatar { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #0066ff, #00c6ff); display: flex; align-items: center; justify-content: center; font-family: 'Bebas Neue', sans-serif; font-size: 32px; color: white; flex-shrink: 0; border: 3px solid var(--accent); overflow: hidden; }
                .pf-hero-info { flex: 1; }
                .pf-hero-name { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 2px; margin-bottom: 2px; }
                .pf-hero-email { color: var(--muted); font-size: 13px; margin-bottom: 10px; }
                .pf-badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
                .pf-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; }
                .pf-badge-goal { background: rgba(0,102,255,0.15); border: 1px solid rgba(0,102,255,0.3); color: #60a5fa; }
                .pf-badge-streak { background: rgba(255,140,0,0.15); border: 1px solid rgba(255,140,0,0.3); color: #fb923c; }
                .pf-member-since { font-size: 12px; color: var(--muted); }
                .pf-hero-stats { display: flex; gap: 32px; margin-left: auto; }
                .pf-hero-stat { text-align: center; }
                .pf-hero-stat-num { font-family: 'Bebas Neue', sans-serif; font-size: 36px; color: var(--accent); letter-spacing: 1px; }
                .pf-hero-stat-label { font-size: 11px; color: var(--muted); margin-top: 2px; }
                .pf-hero-stat-divider { width: 1px; background: var(--border); align-self: stretch; }

                .pf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                .pf-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 24px; }
                .pf-card-title { font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 1px; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }

                .pf-info-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
                .pf-info-row:last-child { border-bottom: none; }
                .pf-info-label { color: var(--muted); }
                .pf-info-value { font-weight: 500; }
                .pf-info-value.accent { color: var(--accent); font-weight: 600; }

                .pf-goal-option { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--border); margin-bottom: 10px; cursor: pointer; transition: all 0.2s; }
                .pf-goal-option:last-child { margin-bottom: 0; }
                .pf-goal-option.selected { border-color: var(--accent); background: rgba(0,229,255,0.06); }
                .pf-goal-dot { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--muted); flex-shrink: 0; transition: all 0.2s; }
                .pf-goal-option.selected .pf-goal-dot { background: var(--accent); border-color: var(--accent); }
                .pf-goal-label { font-size: 13px; font-weight: 600; }
                .pf-goal-sub { font-size: 11px; color: var(--muted); margin-top: 1px; }

                .pf-photos-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 20px; }
                .pf-photos-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
                .pf-btn-add-photo { background: linear-gradient(135deg, #0066ff, #00c6ff); border: none; color: white; padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }

                .pf-filters { display: flex; gap: 8px; margin-bottom: 18px; overflow-x: auto; padding-bottom: 2px; }
                .pf-filter-btn { padding: 5px 16px; border-radius: 20px; border: 1px solid var(--border); background: transparent; color: var(--muted); font-size: 12px; font-weight: 500; cursor: pointer; white-space: nowrap; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
                .pf-filter-btn.active { background: var(--accent); color: #080c10; border-color: var(--accent); font-weight: 700; }
                .pf-filter-btn:hover:not(.active) { border-color: var(--accent); color: var(--accent); }

                .pf-day1-banner { display: flex; align-items: center; gap: 10px; background: rgba(0,229,255,0.05); border: 1px solid rgba(0,229,255,0.15); border-radius: 10px; padding: 8px 14px; margin-bottom: 14px; }
                .pf-day1-thumb { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; border: 1px solid var(--accent); }
                .pf-day1-label { font-size: 11px; font-weight: 700; color: var(--accent); letter-spacing: 1px; text-transform: uppercase; }
                .pf-day1-date { font-size: 11px; color: var(--muted); }

                .pf-photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                @media (max-width: 576px) { .pf-photos-grid { grid-template-columns: repeat(2, 1fr); } }

                .pf-photo-item { position: relative; border-radius: 10px; overflow: hidden; aspect-ratio: 3/4; background: #111; }
                .pf-photo-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
                .pf-photo-badge { position: absolute; top: 6px; left: 6px; background: var(--accent); color: #080c10; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; letter-spacing: 0.5px; }
                .pf-photo-date { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.65); color: #fff; font-size:10px; padding: 5px 7px; text-align: center; }
                .pf-photo-notes { position: absolute; bottom: 22px; left: 0; right: 0; background: rgba(0,0,0,0.45); color: #ccc; font-size: 10px; padding: 3px 7px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

                .pf-load-more { text-align: center; margin-top: 16px; }
                .pf-load-more-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 8px 24px; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
                .pf-load-more-btn:hover { border-color: var(--accent); color: var(--accent); }

                .pf-photos-empty { text-align: center; padding: 32px; color: var(--muted); font-size: 13px; border: 1px dashed var(--border); border-radius: 12px; }

                .pf-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
                .pf-modal { background: #0d1318; border: 1px solid var(--border); border-radius: 16px; padding: 28px; width: 100%; max-width: 420px; }
                .pf-modal-title { font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 1px; margin-bottom: 20px; }
                .pf-modal-preview { width: 100%; aspect-ratio: 1; border-radius: 10px; object-fit: cover; margin-bottom: 14px; border: 1px solid var(--border); }
                .pf-modal-upload-area { border: 2px dashed var(--border); border-radius: 10px; padding: 28px; text-align: center; cursor: pointer; margin-bottom: 14px; color: var(--muted); font-size: 13px; transition: border-color 0.2s; }
                .pf-modal-upload-area:hover { border-color: var(--accent); }
                .pf-modal-input { display: none; }
                .pf-modal-notes { width: 100%; background: #111; border: 1px solid var(--border); border-radius: 8px; color: var(--text); padding: 10px 12px; font-size: 13px; font-family: 'DM Sans', sans-serif; resize: none; box-sizing: border-box; margin-bottom: 12px; }
                .pf-modal-notes:focus { outline: none; border-color: var(--accent); }
                .pf-modal-error { background: rgba(255,80,80,0.1); border: 1px solid rgba(255,80,80,0.3); color: #ff6b6b; border-radius:8px; padding: 8px 12px; font-size: 12px; margin-bottom: 12px; }
                .pf-modal-actions { display: flex; gap: 10px; }
                .pf-modal-cancel { flex: 1; background: transparent; border: 1px solid var(--border); color: var(--muted); padding: 10px; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
                .pf-modal-submit { flex: 2; background: linear-gradient(135deg, #0066ff, #00c6ff); border: none; color: white; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; }
                .pf-modal-submit:disabled { opacity: 0.5; cursor: not-allowed; }

                .pf-danger { background: var(--bg2); border: 1px solid rgba(255,80,80,0.25); border-radius: 16px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; }
                .pf-danger-title { color: #ff6b6b; font-weight: 600; font-size: 14px; margin-bottom: 4px; }
                .pf-danger-sub { color: var(--muted); font-size: 12px; }
                .pf-btn-delete { background: transparent; border: 1px solid rgba(255,80,80,0.4); color: #ff6b6b; padding: 8px 20px; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 500; }
                .pf-btn-delete:hover { background: rgba(255,80,80,0.1); }

                @media (max-width: 768px) {
                    .pf-nav { display: none !important; }
                    .pf-grid { grid-template-columns: 1fr; }
                    .pf-hero-stats { display: none; }
                }
            `}</style>

            <div className="pf-body">
                <MobileNavbar />

                {/* NAVBAR */}
                <nav className="pf-nav">
                    <div className="pf-logo">GymMind AI</div>
                    <div className="pf-nav-links">
                        <a onClick={() => navigate("/dashboard")}>{t("nav_dashboard")}</a>
                        <a onClick={() => navigate("/workout")}>{t("nav_workout")}</a>
                        <a onClick={() => navigate("/moodcheck")}>{t("nav_moodcheck")}</a>
                        <a onClick={() => navigate("/progress")}>{t("nav_progress")}</a>
                        <a onClick={() => navigate("/nutrition")}>{t("nav_nutrition")}</a>
                        <a className="active">{t("nav_profile")}</a>
                    </div>
                    <div className="pf-nav-cta">
                        <button className="pf-btn-ghost" onClick={() => navigate("/edit-profile")}>{t("profile_edit")}</button>
                        <button className="pf-lang-btn" onClick={toggleLang}>
                            {lang === "en" ? "🌐 ES" : "🌐 EN"}
                        </button>
                        <button className="pf-btn-danger" onClick={() => {
                            sessionStorage.removeItem("token");
                            sessionStorage.removeItem("user");
                            navigate("/login");
                        }}>{t("nav_signout")}</button>
                    </div>
                </nav>

                <div className="pf-page">
                    <div className="pf-section-label">{t("profile_myaccount")}</div>
                    <div className="pf-page-title">{t("profile_title")}</div>

                    {/* HERO */}
                    <div className="pf-hero">
                        <div className="pf-avatar">
                            {user.photo_url
                                ? <img src={user.photo_url} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : initials}
                        </div>
                        <div className="pf-hero-info">
                            <div className="pf-hero-name">{user.first_name.toUpperCase()} {user.last_name.toUpperCase()}</div>
                            <div className="pf-hero-email">{user.email}</div>
                            <div className="pf-badges">
                                <span className="pf-badge pf-badge-goal">🎯 {selectedGoal}</span>
                                <span className="pf-badge pf-badge-streak">🔥 12 {t("profile_days_trained")}</span>
                            </div>
                            <div className="pf-member-since">{t("profile_member_since")} {memberSince}</div>
                        </div>
                        <div className="pf-hero-stats">
                            {user.weight && <>
                                <div className="pf-hero-stat">
                                    <div className="pf-hero-stat-num">{user.weight}</div>
                                    <div className="pf-hero-stat-label">{t("profile_weight_kg")}</div>
                                </div>
                                <div className="pf-hero-stat-divider" />
                            </>}
                            {user.height && <>
                                <div className="pf-hero-stat">
                                    <div className="pf-hero-stat-num">{user.height}</div>
                                    <div className="pf-hero-stat-label">{t("profile_height_cm")}</div>
                                </div>
                                <div className="pf-hero-stat-divider" />
                            </>}
                            {age && <div className="pf-hero-stat">
                                <div className="pf-hero-stat-num">{age}</div>
                                <div className="pf-hero-stat-label">{t("profile_age")}</div>
                            </div>}
                        </div>
                    </div>

                    {/* GRID */}
                    <div className="pf-grid">
                        <div className="pf-card">
                            <div className="pf-card-title">🧍 {t("info_title")}</div>
                            {[
                                { label: t("info_fullname"), value: `${user.first_name} ${user.last_name}`, accent: false },
                                { label: t("info_email"), value: user.email, accent: false },
                                { label: t("profile_age"), value: age ? `${age} ${t("info_age")}` : null, accent: false },
                                { label: t("info_height_label"), value: user.height ? `${user.height} cm` : null, accent: true },
                                { label: t("info_weight_label"), value: user.weight ? `${user.weight} kg` : null, accent: true },
                            ].filter(i => i.value).map(item => (
                                <div key={item.label} className="pf-info-row">
                                    <span className="pf-info-label">{item.label}</span>
                                    <span className={`pf-info-value ${item.accent ? "accent" : ""}`}>{item.value}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pf-card">
                            <div className="pf-card-title">🎯 {t("goals_title")}</div>
                            {goals.map(goal => (
                                <div
                                    key={goal.id}
                                    className={`pf-goal-option ${selectedGoal === goal.id ? "selected" : ""}`}
                                    onClick={() => setSelectedGoal(goal.id)}
                                >
                                    <div className="pf-goal-dot" />
                                    <div>
                                        <div className="pf-goal-label">{goal.label}</div>
                                        <div className="pf-goal-sub">{goal.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PROGRESS PHOTOS */}
                    <div className="pf-photos-card">
                        <div className="pf-photos-header">
                            <div className="pf-card-title" style={{ margin: 0 }}>📸 {t("photos_title")}</div>
                            <button className="pf-btn-add-photo" onClick={() => { setShowPhotoModal(true); setUploadError(""); }}>
                                {t("photos_add")}
                            </button>
                        </div>

                        <div className="pf-filters">
                            {[
                                { key: "all", label: t("photos_filter_all") },
                                { key: "biweekly", label: t("photos_filter_biweekly") },
                                { key: "monthly", label: t("photos_filter_monthly") },
                            ].map(f => (
                                <button
                                    key={f.key}
                                    className={`pf-filter-btn ${photoFilter === f.key ? "active" : ""}`}
                                    onClick={() => { setPhotoFilter(f.key); setVisibleCount(9); }}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {filteredPhotos.length === 0 ? (
                            <div className="pf-photos-empty">
                                {photos.length === 0 ? t("photos_empty_first") : t("photos_empty_filter")}
                            </div>
                        ) : (
                            <>
                                {photoFilter !== "all" && firstPhoto && !filteredPhotos.includes(firstPhoto) && (
                                    <div className="pf-day1-banner">
                                        <img src={firstPhoto.photo_url} alt="Day 1" className="pf-day1-thumb" />
                                        <div>
                                            <div className="pf-day1-label">{t("photos_day1_label")}</div>
                                            <div className="pf-day1-date">
                                                {new Date(firstPhoto.taken_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="pf-photos-grid">
                                    {visiblePhotos.map((photo, index) => (
                                        <div key={photo.id} className="pf-photo-item">
                                            {index === 0 && photoFilter === "all" && (
                                                <span className="pf-photo-badge">DAY 1</span>
                                            )}
                                            <img src={photo.photo_url} alt={photo.notes || `Progress ${index + 1}`} />
                                            {photo.notes && <div className="pf-photo-notes">{photo.notes}</div>}
                                            <div className="pf-photo-date">
                                                {new Date(photo.taken_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {visibleCount < filteredPhotos.length && (
                                    <div className="pf-load-more">
                                        <button className="pf-load-more-btn" onClick={() => setVisibleCount(v => v + 9)}>
                                            {t("photos_load_more")} ({filteredPhotos.length - visibleCount} {t("photos_remaining")})
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* DANGER ZONE */}
                    <div className="pf-danger">
                        <div>
                            <div className="pf-danger-title">{t("danger_title")}</div>
                            <div className="pf-danger-sub">{t("danger_sub")}</div>
                        </div>
                        <button className="pf-btn-delete" onClick={() => {
                            if (window.confirm(t("danger_confirm"))) {
                                fetch(`${backendUrl}/api/user/${userId}`, { method: "DELETE" })
                                    .then(res => res.json())
                                    .then(() => {
                                        sessionStorage.removeItem("token");
                                        sessionStorage.removeItem("user");
                                        navigate("/signup");
                                    })
                                    .catch(() => alert(t("error_delete")));
                            }
                        }}>
                            {t("danger_btn")}
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {showPhotoModal && (
                <div className="pf-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="pf-modal">
                        <div className="pf-modal-title">{t("modal_title")}</div>

                        {previewUrl
                            ? <img src={previewUrl} className="pf-modal-preview" alt="preview" />
                            : (
                                <label className="pf-modal-upload-area" htmlFor="photo-input">
                                    {t("modal_click")}
                                    <br />
                                    <span style={{ fontSize: "11px", marginTop: "6px", display: "block" }}>{t("modal_formats")}</span>
                                </label>
                            )
                        }

                        <input id="photo-input" type="file" accept="image/*" className="pf-modal-input" onChange={handleFileChange} />

                        {previewUrl && (
                            <label htmlFor="photo-input" style={{ display: "block", textAlign: "center", color: "var(--accent)", fontSize: "12px", cursor: "pointer", marginBottom: "12px" }}>
                                {t("modal_change")}
                            </label>
                        )}

                        <textarea
                            className="pf-modal-notes"
                            placeholder={t("modal_placeholder")}
                            rows={2}
                            value={photoNotes}
                            onChange={e => setPhotoNotes(e.target.value)}
                        />

                        {uploadError && <div className="pf-modal-error">⚠️ {uploadError}</div>}

                        <div className="pf-modal-actions">
                            <button className="pf-modal-cancel" onClick={closeModal}>{t("modal_cancel")}</button>
                            <button className="pf-modal-submit" onClick={handleUploadPhoto} disabled={!photoFile || uploadingPhoto}>
                                {uploadingPhoto ? t("modal_uploading") : t("modal_save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Profile;
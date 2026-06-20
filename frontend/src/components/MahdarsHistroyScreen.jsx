import { useState, useEffect, useMemo, useCallback } from "react";
import supabase from "../supabase";
import { useNavigate } from "react-router-dom";
import MahdarsActivityChart from "./MahdarsActivityChart";

function MahdarsHistoryScreen() {
    const [token, setToken] = useState(null);
    const [mahdars, setMahdars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState("date");
    const [sortDir, setSortDir] = useState("desc"); // newest first by default
    const [deletingId, setDeletingId] = useState(null);
    const [confirmId, setConfirmId] = useState(null);
    const navigate = useNavigate();

    const API = import.meta.env.VITE_API_URL;

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setToken(session?.access_token ?? null);
        });
    }, []);

    const fetchMahdars = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API}/get-mahdars`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });
            if (!response.ok) throw new Error(`Request failed (${response.status})`);
            const data = await response.json();
            setMahdars(data.mahdars || []);
        } catch {
            setError("Couldn't load your mahdars. Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    }, [API, token]);

    useEffect(() => {
        if (!token) return;
        fetchMahdars();
    }, [token, fetchMahdars]);

    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const handleSort = (key) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(key); setSortDir(key === "date" ? "desc" : "asc"); }
    };

    const handleDownload = (e, url) => {
        e.stopPropagation();
        window.open(url, "_blank", "noreferrer");
    };

    // Requires a POST /delete-mahdar endpoint on the backend that accepts
    // { token, mahdar_id }. Remove this handler and the delete button if
    // you don't want deletion from the UI.
    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (confirmId !== id) {
            setConfirmId(id);
            return;
        }
        setConfirmId(null);
        setDeletingId(id);
        try {
            const response = await fetch(`${API}/delete-mahdar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, mahdar_id: id }),
            });
            if (!response.ok) throw new Error("Delete failed");
            setMahdars((prev) => prev.filter((m) => m.id !== id));
        } catch {
            setError("Couldn't delete that mahdar. Try again.");
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        let rows = mahdars.filter((t) => (t.title || "").toLowerCase().includes(q));
        if (sortKey) {
            rows = [...rows].sort((a, b) => {
                const va = sortKey === "title" ? (a.title || "") : (a.created_at || "");
                const vb = sortKey === "title" ? (b.title || "") : (b.created_at || "");
                return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        }
        return rows;
    }, [mahdars, search, sortKey, sortDir]);

    const openRow = (id) => navigate(`/mahdar/${id}`);

    const SortIcon = ({ col }) => (
        <span style={{ display: "inline-flex", flexDirection: "column", gap: "1px", marginLeft: "5px", verticalAlign: "middle", opacity: sortKey === col ? 1 : 0.35 }}>
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                <path d="M4 0L8 5H0L4 0Z" fill={sortKey === col && sortDir === "asc" ? "currentColor" : "#b0adb5"} />
            </svg>
            <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                <path d="M4 5L0 0H8L4 5Z" fill={sortKey === col && sortDir === "desc" ? "currentColor" : "#b0adb5"} />
            </svg>
        </span>
    );

    const thStyle = { textAlign: "left", padding: "10px 18px", fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#b0adb5", borderBottom: "1px solid #e8e7ea", cursor: "pointer", userSelect: "none" };
    const tdStyle = { padding: "13px 18px", borderBottom: "1px solid #f0eff2", verticalAlign: "middle" };

    return (
        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            <style>{`
                .mh-row { transition: background 0.1s; cursor: pointer; }
                .mh-row:hover, .mh-row:focus-visible { background: #faf9f7; outline: none; }
                .mh-row:focus-visible td:first-child { box-shadow: inset 3px 0 0 #1D9E75; }
                .mh-th { transition: color 0.1s; }
                .mh-th:hover { color: #5a5668 !important; }
                .icon-btn { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:8px; border:1px solid #e8e7ea; background:transparent; color:#888; cursor:pointer; position:relative; transition:background 0.12s, border-color 0.12s, color 0.12s; }
                .icon-btn:hover, .icon-btn:focus-visible { background:#f4f3f6; border-color:#c8c6cc; color:#1a2e22; outline:none; }
                .icon-btn.danger:hover, .icon-btn.danger:focus-visible { background:#fbf1f0; border-color:#e3b8b3; color:#c0564a; }
                .icon-btn.confirm { background:#fbf1f0; border-color:#c0564a; color:#c0564a; }
                .icon-btn .tip { position:absolute; bottom:calc(100% + 6px); left:50%; transform:translateX(-50%); background:#1a2e22; color:#fff; font-size:11px; padding:3px 8px; border-radius:5px; white-space:nowrap; opacity:0; pointer-events:none; transition:opacity 0.12s; font-family:'DM Sans',system-ui,sans-serif; z-index:2; }
                .icon-btn:hover .tip, .icon-btn:focus-visible .tip { opacity:1; }
                .mh-search { width:100%; height:36px; padding:0 12px 0 36px; font-size:13px; border:1px solid #e8e7ea; border-radius:10px; background:#fff; color:#1a2e22; outline:none; font-family:'DM Sans',system-ui,sans-serif; box-sizing:border-box; transition:border-color 0.15s; }
                .mh-search:focus { border-color:#b0adb5; }
                .mh-search::placeholder { color:#c8c6cc; }
                @keyframes mh-shimmer { 0% { opacity: 0.45; } 50% { opacity: 1; } 100% { opacity: 0.45; } }
                .mh-skeleton { height:14px; border-radius:6px; background:#eeedf0; animation: mh-shimmer 1.2s ease-in-out infinite; }
            `}</style>

            {/* Header */}
            <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "17px", fontWeight: "600", color: "#1a2e22", margin: 0 }}>Mahdars</h2>
                <p style={{ fontSize: "13px", color: "#b0adb5", marginTop: "3px" }}>Your generated mahdar history</p>
            </div>

            {/* Mahdar Activity Line Chart */}
            <MahdarsActivityChart mahdars={mahdars} />

            {/* Error banner */}
            {error && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", background: "#fbf1f0", border: "1px solid #e3b8b3", borderRadius: "10px", padding: "10px 14px", marginBottom: "12px", fontSize: "13px", color: "#9c4338" }}>
                    <span>{error}</span>
                    <button onClick={fetchMahdars} style={{ fontSize: "12px", fontWeight: 600, color: "#9c4338", background: "transparent", border: "1px solid #e3b8b3", borderRadius: "7px", padding: "4px 12px", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                        Try again
                    </button>
                </div>
            )}

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <svg style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b0adb5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        className="mh-search"
                        type="text"
                        placeholder="Search mahdars..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        dir="auto"
                    />
                </div>
                <span style={{ fontSize: "12px", color: "#b0adb5", whiteSpace: "nowrap" }}>
                    {filtered.length} of {mahdars.length}
                </span>
            </div>

            {/* Table card */}
            <div style={{
                background: "#fff",
                border: "1px solid #e8e7ea",
                borderRadius: "14px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(26,46,34,0.05)",
            }}>
                {loading ? (
                    <div style={{ padding: "10px 18px" }}>
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 0", borderBottom: i < 3 ? "1px solid #f0eff2" : "none" }}>
                                <div className="mh-skeleton" style={{ width: "28px", height: "28px", borderRadius: "7px", flexShrink: 0 }} />
                                <div className="mh-skeleton" style={{ width: `${46 - i * 7}%` }} />
                                <div className="mh-skeleton" style={{ width: "90px", marginLeft: "auto" }} />
                            </div>
                        ))}
                    </div>
                ) : mahdars.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "52px 20px", color: "#b0adb5", fontSize: "13px" }}>
                        <div style={{ fontSize: "26px", marginBottom: "10px" }}>📄</div>
                        No mahdars yet. Upload a meeting summary to create your first one.
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "52px 20px", color: "#b0adb5", fontSize: "13px" }}>
                        <div style={{ fontSize: "26px", marginBottom: "10px" }}>🔍</div>
                        No results for "{search}"
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                        <colgroup>
                            <col style={{ width: "52%" }} />
                            <col style={{ width: "28%" }} />
                            <col style={{ width: "20%" }} />
                        </colgroup>
                        <thead>
                            <tr style={{ background: "#faf9f7" }}>
                                <th className="mh-th" onClick={() => handleSort("title")} style={thStyle}>
                                    Title <SortIcon col="title" />
                                </th>
                                <th className="mh-th" onClick={() => handleSort("date")} style={thStyle}>
                                    Date created <SortIcon col="date" />
                                </th>
                                <th style={{ padding: "10px 18px", borderBottom: "1px solid #e8e7ea" }} />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((t) => (
                                <tr
                                    key={t.id}
                                    className="mh-row"
                                    onClick={() => openRow(t.id)}
                                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openRow(t.id); } }}
                                    tabIndex={0}
                                    aria-label={`Open ${t.title || "untitled mahdar"}`}
                                >
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "7px", background: "#f4f3f6", flexShrink: 0 }}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                                                </svg>
                                            </div>
                                            <span dir="auto" style={{ fontWeight: "600", color: "#1a2e22", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {t.title || "Untitled"}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ ...tdStyle, fontSize: "12px", color: "#b0adb5", fontFamily: "ui-monospace, Consolas, monospace" }}>
                                        {formatDate(t.created_at)}
                                    </td>
                                    <td style={{ ...tdStyle, textAlign: "right" }}>
                                        <div style={{ display: "inline-flex", gap: "6px" }} onMouseLeave={() => setConfirmId(null)}>
                                            <button className="icon-btn" onClick={(e) => handleDownload(e, t.download_url)} aria-label="Download">
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                <span className="tip">Download</span>
                                            </button>
                                            <button
                                                className={`icon-btn danger${confirmId === t.id ? " confirm" : ""}`}
                                                onClick={(e) => handleDelete(e, t.id)}
                                                disabled={deletingId === t.id}
                                                aria-label={confirmId === t.id ? "Confirm delete" : "Delete"}
                                            >
                                                {deletingId === t.id ? (
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                    </svg>
                                                ) : (
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    </svg>
                                                )}
                                                <span className="tip">{confirmId === t.id ? "Click again to confirm" : "Delete"}</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default MahdarsHistoryScreen;
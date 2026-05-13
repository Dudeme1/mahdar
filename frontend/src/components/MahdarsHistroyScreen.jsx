import { useState, useEffect, useMemo } from "react";
import supabase from "../supabase";
import { useNavigate } from "react-router-dom";
import MahdarsActivityChart from "./MahdarsActivityChart";

function MahdarsHistoryScreen() {
    const [token, setToken] = useState(null);
    const [mahdars, setMahdars] = useState([]);
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState("asc");
    const navigate = useNavigate();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setToken(session?.access_token);
        });
    }, []);

    useEffect(() => {
        if (!token) return;
        const fetchMahdars = async () => {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/get-mahdars`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });
            const data = await response.json();
            setMahdars(data.mahdars || []);
        };
        fetchMahdars();
    }, [token]);

    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
        else { setSortKey(key); setSortDir("asc"); }
    };

    const handleDownload = (e, url) => {
        e.stopPropagation();
        window.open(url, "_blank", "noreferrer");
    };

    const filtered = useMemo(() => {
        let rows = mahdars.filter(t =>
            t.title.toLowerCase().includes(search.toLowerCase())
        );
        if (sortKey) {
            rows = [...rows].sort((a, b) => {
                const va = sortKey === "title" ? a.title : a.created_at;
                const vb = sortKey === "title" ? b.title : b.created_at;
                return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        }
        return rows;
    }, [mahdars, search, sortKey, sortDir]);

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

    return (
        <div style={{ maxWidth: "860px", margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            <style>{`
                .mh-row { transition: background 0.1s; cursor: pointer; }
                .mh-row:hover { background: #faf9f7; }
                .mh-th { transition: color 0.1s; }
                .mh-th:hover { color: #5a5668 !important; }
                .dl-btn { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:8px; border:1px solid #e8e7ea; background:transparent; color:#888; cursor:pointer; position:relative; transition:background 0.12s, border-color 0.12s, color 0.12s; }
                .dl-btn:hover { background:#f4f3f6; border-color:#c8c6cc; color:#1a2e22; }
                .dl-btn .tip { position:absolute; bottom:calc(100% + 6px); left:50%; transform:translateX(-50%); background:#1a2e22; color:#fff; font-size:11px; padding:3px 8px; border-radius:5px; white-space:nowrap; opacity:0; pointer-events:none; transition:opacity 0.12s; font-family:'DM Sans',system-ui,sans-serif; }
                .dl-btn:hover .tip { opacity:1; }
                .mh-search { width:100%; height:36px; padding:0 12px 0 36px; font-size:13px; border:1px solid #e8e7ea; border-radius:10px; background:#fff; color:#1a2e22; outline:none; font-family:'DM Sans',system-ui,sans-serif; box-sizing:border-box; transition:border-color 0.15s; }
                .mh-search:focus { border-color:#b0adb5; }
                .mh-search::placeholder { color:#c8c6cc; }
            `}</style>

            {/* Header */}
            <div style={{ marginBottom: "1.25rem" }}>
                <h2 style={{ fontSize: "17px", fontWeight: "600", color: "#1a2e22", margin: 0 }}>Mahdars</h2>
                <p style={{ fontSize: "13px", color: "#b0adb5", marginTop: "3px" }}>Your generated mahdar history</p>
            </div>

            {/* Mahdar Activity Line Chart */}
            <MahdarsActivityChart mahdars={mahdars} />

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
                        onChange={e => setSearch(e.target.value)}
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
                {mahdars.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "52px 20px", color: "#b0adb5", fontSize: "13px" }}>
                        <div style={{ fontSize: "26px", marginBottom: "10px" }}>📄</div>
                        No mahdars yet.
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "52px 20px", color: "#b0adb5", fontSize: "13px" }}>
                        <div style={{ fontSize: "26px", marginBottom: "10px" }}>🔍</div>
                        No results for "{search}"
                    </div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                        <colgroup>
                            <col style={{ width: "55%" }} />
                            <col style={{ width: "30%" }} />
                            <col style={{ width: "15%" }} />
                        </colgroup>
                        <thead>
                            <tr style={{ background: "#faf9f7" }}>
                                <th
                                    className="mh-th"
                                    onClick={() => handleSort("title")}
                                    style={{ textAlign: "left", padding: "10px 18px", fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#b0adb5", borderBottom: "1px solid #e8e7ea", cursor: "pointer", userSelect: "none" }}
                                >
                                    Title <SortIcon col="title" />
                                </th>
                                <th
                                    className="mh-th"
                                    onClick={() => handleSort("date")}
                                    style={{ textAlign: "left", padding: "10px 18px", fontSize: "11px", fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", color: "#b0adb5", borderBottom: "1px solid #e8e7ea", cursor: "pointer", userSelect: "none" }}
                                >
                                    Date created <SortIcon col="date" />
                                </th>
                                <th style={{ padding: "10px 18px", borderBottom: "1px solid #e8e7ea" }} />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(t => (
                                <tr key={t.id} className="mh-row" onClick={() => navigate(`/mahdar/${t.id}`)}>
                                    <td style={{ padding: "13px 18px", borderBottom: "1px solid #f0eff2", verticalAlign: "middle" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "7px", background: "#f4f3f6", flexShrink: 0 }}>
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                                                </svg>
                                            </div>
                                            <span style={{ fontWeight: "600", color: "#1a2e22", fontSize: "13px" }}>{t.title}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "13px 18px", borderBottom: "1px solid #f0eff2", verticalAlign: "middle", fontSize: "12px", color: "#b0adb5", fontFamily: "ui-monospace, Consolas, monospace" }}>
                                        {formatDate(t.created_at)}
                                    </td>
                                    <td style={{ padding: "13px 18px", borderBottom: "1px solid #f0eff2", verticalAlign: "middle", textAlign: "right" }}>
                                        <button className="dl-btn" onClick={(e) => handleDownload(e, t.download_url)} aria-label="Download">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            <span className="tip">Download</span>
                                        </button>
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
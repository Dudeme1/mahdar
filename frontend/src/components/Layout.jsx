import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import supabase from "../supabase";

const css = `
  * { box-sizing: border-box; }

  /* ── Sidebar transition ── */
  .lay-sidebar {
    transition: width 0.22s cubic-bezier(0.4,0,0.2,1),
                padding 0.22s cubic-bezier(0.4,0,0.2,1);
    overflow: hidden;
  }

  /* ── Nav buttons ── */
  .lay-nav-btn {
    display: flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    padding: 9px 12px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #6b6375;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
    transition: background 0.12s, color 0.12s;
  }
  .lay-nav-btn:hover { background: #f0eff2; color: #08060d; }
  .lay-nav-btn.active {
    background: rgba(170,59,255,0.09);
    color: #aa3bff;
    font-weight: 600;
  }
  .lay-nav-btn.collapsed {
    justify-content: center;
    padding: 9px;
  }
  .lay-nav-icon { font-size: 16px; flex-shrink: 0; }
  .lay-nav-label { transition: opacity 0.15s, width 0.15s; overflow: hidden; }

  /* ── Collapse toggle button ── */
  .lay-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px; height: 28px;
    border: 1px solid #e5e4e7;
    border-radius: 8px;
    background: #fff;
    cursor: pointer;
    color: #6b6375;
    font-size: 13px;
    transition: background 0.12s, color 0.12s, transform 0.22s;
    flex-shrink: 0;
  }
  .lay-toggle-btn:hover { background: #f0eff2; color: #08060d; }
  .lay-toggle-btn.collapsed { transform: rotate(180deg); }

  /* ── Sign out ── */
  .lay-signout-btn {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 8px 12px;
    border: 1px solid #e5e4e7; border-radius: 10px;
    background: #fff; color: #6b6375;
    font-family: inherit; font-size: 12px; font-weight: 500;
    cursor: pointer; white-space: nowrap;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
  }
  .lay-signout-btn:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
  .lay-signout-btn.collapsed { justify-content: center; padding: 8px; }

  /* ── Tooltip on collapsed items ── */
  .lay-nav-wrap { position: relative; }
  .lay-nav-wrap .lay-tooltip {
    display: none;
    position: absolute;
    left: calc(100% + 10px);
    top: 50%; transform: translateY(-50%);
    background: #08060d;
    color: #fff;
    font-size: 12px; font-weight: 500;
    padding: 5px 10px;
    border-radius: 8px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 100;
    font-family: Inter, system-ui, sans-serif;
  }
  .lay-nav-wrap .lay-tooltip::before {
    content: '';
    position: absolute;
    right: 100%; top: 50%; transform: translateY(-50%);
    border: 5px solid transparent;
    border-right-color: #08060d;
  }
  .lay-sidebar.is-collapsed .lay-nav-wrap:hover .lay-tooltip { display: block; }
  .lay-sidebar.is-collapsed .lay-signout-wrap:hover .lay-signout-tooltip { display: block; }
  .lay-signout-wrap { position: relative; }
  .lay-signout-tooltip {
    display: none;
    position: absolute;
    left: calc(100% + 10px);
    top: 50%; transform: translateY(-50%);
    background: #08060d; color: #fff;
    font-size: 12px; font-weight: 500;
    padding: 5px 10px; border-radius: 8px;
    white-space: nowrap; pointer-events: none; z-index: 100;
    font-family: Inter, system-ui, sans-serif;
  }
  .lay-signout-tooltip::before {
    content: '';
    position: absolute;
    right: 100%; top: 50%; transform: translateY(-50%);
    border: 5px solid transparent;
    border-right-color: #08060d;
  }

  /* ── Mobile overlay ── */
  .lay-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.35);
    z-index: 40;
    backdrop-filter: blur(2px);
  }
  .lay-overlay.open { display: block; }

  /* ── Mobile top bar ── */
  .lay-topbar {
    display: none;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid #e5e4e7;
    position: sticky; top: 0; z-index: 30;
    flex-shrink: 0;
  }
  .lay-topbar-logo { font-size: 15px; font-weight: 700; color: #08060d; letter-spacing: -0.3px; }
  .lay-topbar-logo span { color: #aa3bff; }

  .lay-hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 36px; height: 36px;
    border: 1px solid #e5e4e7;
    border-radius: 10px;
    background: #fff;
    cursor: pointer; padding: 8px;
    transition: background 0.12s; flex-shrink: 0;
  }
  .lay-hamburger:hover { background: #f7f7f8; }
  .lay-hamburger span { display: block; height: 2px; background: #08060d; border-radius: 2px; }

  /* ── Mobile breakpoint ── */
  @media (max-width: 768px) {
    .lay-sidebar {
      position: fixed !important;
      left: -240px !important;
      top: 0 !important; bottom: 0 !important;
      z-index: 50 !important;
      width: 220px !important;
      box-shadow: none;
      transition: left 0.25s cubic-bezier(0.4,0,0.2,1) !important;
    }
    .lay-sidebar.mobile-open {
      left: 0 !important;
      box-shadow: rgba(0,0,0,0.15) 4px 0 24px !important;
    }
    .lay-toggle-btn { display: none !important; }
    .lay-hamburger { display: flex; }
    .lay-topbar { display: flex; }
    .lay-nav-label { opacity: 1 !important; width: auto !important; }
    .lay-nav-btn.collapsed { justify-content: flex-start !important; padding: 9px 12px !important; }
    .lay-signout-btn.collapsed { justify-content: flex-start !important; padding: 8px 12px !important; }
  }
`;

const NAV_ITEMS = [
  { label: "New Mahdar", icon: "🎙️", path: "/dashboard" },
  { label: "Attendees",  icon: "👥", path: "/attendees" },
  { label: "Templates",  icon: "📋", path: "/templates" },
];

function Layout({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignout = async () => { await supabase.auth.signOut(); };
  const handleNav = (path) => { navigate(path); setMobileOpen(false); };

  const sidebarWidth = collapsed ? "60px" : "220px";
  const sidebarPadding = collapsed ? "20px 10px" : "20px 14px";

  return (
    <>
      <style>{css}</style>

      {/* Mobile overlay */}
      <div className={`lay-overlay${mobileOpen ? " open" : ""}`} onClick={() => setMobileOpen(false)} />

      <div style={{ display: "flex", height: "100vh", fontFamily: "Inter, system-ui, 'Segoe UI', sans-serif", background: "#f7f7f8" }}>

        {/* ── Sidebar ── */}
        <aside
          className={`lay-sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}
          style={{
            width: sidebarWidth,
            flexShrink: 0,
            background: "#fff",
            borderRight: "1px solid #e5e4e7",
            display: "flex",
            flexDirection: "column",
            padding: sidebarPadding,
            gap: "2px",
          }}
        >
          {/* Logo row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: collapsed ? "4px 0 16px" : "4px 2px 16px",
            marginBottom: "4px",
          }}>
            {!collapsed && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "18px" }}>🎙️</span>
                <span style={{ fontSize: "16px", fontWeight: "700", color: "#08060d", letterSpacing: "-0.4px" }}>
                  Mah<span style={{ color: "#aa3bff" }}>dari</span>
                </span>
              </div>
            )}
            {collapsed && <span style={{ fontSize: "20px" }}>🎙️</span>}

            {/* Desktop collapse toggle */}
            <button
              className={`lay-toggle-btn${collapsed ? " collapsed" : ""}`}
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              ‹
            </button>
          </div>

          {/* Nav items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
            {!collapsed && (
              <div style={{
                fontSize: "10px", fontWeight: "600", letterSpacing: "0.08em",
                textTransform: "uppercase", color: "#c4bfca", padding: "6px 12px 4px",
                whiteSpace: "nowrap", overflow: "hidden",
              }}>
                Menu
              </div>
            )}

            {NAV_ITEMS.map(({ label, icon, path }) => (
              <div key={path} className="lay-nav-wrap">
                <button
                  className={`lay-nav-btn${location.pathname === path ? " active" : ""}${collapsed ? " collapsed" : ""}`}
                  onClick={() => handleNav(path)}
                  title={collapsed ? label : ""}
                >
                  <span className="lay-nav-icon">{icon}</span>
                  {!collapsed && <span className="lay-nav-label">{label}</span>}
                </button>
                <div className="lay-tooltip">{label}</div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid #e5e4e7", paddingTop: "12px", marginTop: "8px" }}>
            {!collapsed && user?.email && (
              <div style={{
                fontSize: "11px", color: "#b0adb5", padding: "0 12px 10px",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {user.email}
              </div>
            )}
            <div className="lay-signout-wrap">
              <button
                className={`lay-signout-btn${collapsed ? " collapsed" : ""}`}
                onClick={handleSignout}
                title={collapsed ? "Sign out" : ""}
              >
                <span style={{ fontSize: "13px", flexShrink: 0 }}>↩</span>
                {!collapsed && <span>Sign out</span>}
              </button>
              <div className="lay-signout-tooltip">Sign out</div>
            </div>
          </div>
        </aside>

        {/* ── Right side ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

          {/* Mobile top bar */}
          <div className="lay-topbar">
            <div className="lay-topbar-logo">Mah<span>dari</span></div>
            <button className="lay-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label="Open menu">
              <span /><span /><span />
            </button>
          </div>

          {/* Page content */}
          <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
            {children}
          </main>
        </div>

      </div>
    </>
  );
}

export default Layout;
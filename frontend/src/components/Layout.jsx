import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import supabase from "../supabase";
import logoUrl from "/icon-512.png"; // adjust path if needed

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');

  * { box-sizing: border-box; }

  /* ── CSS Variables (light sidebar, green/gold accents) ── */
  :root {
    --sidebar-bg: #ffffff;
    --sidebar-border: #e8e7ea;
    --sidebar-text: #7a7585;
    --sidebar-text-hover: #0f1c14;
    --sidebar-active-bg: rgba(195,152,83,0.1);
    --sidebar-active-text: #a07830;
    --sidebar-active-border: rgba(195,152,83,0.5);
    --sidebar-section-label: #c4bfca;
    --sidebar-footer-border: #eeecf0;
    --toggle-bg: #f4f5f2;
    --toggle-border: #e2e0e5;
    --toggle-hover: #ebe9ed;
    --signout-hover-bg: #fef2f2;
    --signout-hover-text: #dc2626;
    --signout-hover-border: #fecaca;
    --topbar-bg: #ffffff;
    --topbar-border: #e8e7ea;
    --topbar-logo-color: #1a2e22;
    --topbar-logo-accent: #a07830;
    --main-bg: #f4f5f2;
    --tooltip-bg: #1a2e22;
    --email-color: #b0adb5;
  }

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
    gap: 10px;
    width: 100%;
    padding: 9px 12px;
    border: none;
    border-radius: 9px;
    background: transparent;
    color: var(--sidebar-text);
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
    transition: background 0.14s, color 0.14s;
    letter-spacing: 0.01em;
  }
  .lay-nav-btn:hover {
    background: rgba(255,255,255,0.06);
    color: var(--sidebar-text-hover);
  }
  .lay-nav-btn.active {
    background: var(--sidebar-active-bg);
    color: var(--sidebar-active-text);
    font-weight: 600;
    box-shadow: inset 2px 0 0 var(--sidebar-active-border);
  }
  .lay-nav-btn.collapsed {
    justify-content: center;
    padding: 9px;
  }
  .lay-nav-icon {
    font-size: 15px;
    flex-shrink: 0;
    opacity: 0.85;
  }
  .lay-nav-btn.active .lay-nav-icon { opacity: 1; }
  .lay-nav-label { transition: opacity 0.15s, width 0.15s; overflow: hidden; }

  /* ── Collapse toggle button ── */
  .lay-toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px; height: 26px;
    border: 1px solid var(--toggle-border);
    border-radius: 7px;
    background: var(--toggle-bg);
    cursor: pointer;
    color: var(--sidebar-text);
    font-size: 12px;
    transition: background 0.12s, color 0.12s, transform 0.22s;
    flex-shrink: 0;
  }
  .lay-toggle-btn:hover { background: var(--toggle-hover); color: var(--sidebar-text-hover); }
  .lay-toggle-btn.collapsed { transform: rotate(180deg); }

  /* ── Sign out ── */
  .lay-signout-btn {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 8px 12px;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 9px;
    background: rgba(255,255,255,0.03);
    color: var(--sidebar-text);
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 12px; font-weight: 500;
    cursor: pointer; white-space: nowrap;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
    letter-spacing: 0.01em;
  }
  .lay-signout-btn:hover {
    background: var(--signout-hover-bg);
    color: var(--signout-hover-text);
    border-color: var(--signout-hover-border);
  }
  .lay-signout-btn.collapsed { justify-content: center; padding: 8px; }

  /* ── Tooltip on collapsed items ── */
  .lay-nav-wrap { position: relative; }
  .lay-nav-wrap .lay-tooltip {
    display: none;
    position: absolute;
    left: calc(100% + 12px);
    top: 50%; transform: translateY(-50%);
    background: var(--tooltip-bg);
    color: #e8f0ea;
    font-size: 12px; font-weight: 500;
    padding: 5px 11px;
    border-radius: 7px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 100;
    font-family: 'DM Sans', system-ui, sans-serif;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .lay-nav-wrap .lay-tooltip::before {
    content: '';
    position: absolute;
    right: 100%; top: 50%; transform: translateY(-50%);
    border: 5px solid transparent;
    border-right-color: var(--tooltip-bg);
  }
  .lay-sidebar.is-collapsed .lay-nav-wrap:hover .lay-tooltip { display: block; }
  .lay-sidebar.is-collapsed .lay-signout-wrap:hover .lay-signout-tooltip { display: block; }

  .lay-signout-wrap { position: relative; }
  .lay-signout-tooltip {
    display: none;
    position: absolute;
    left: calc(100% + 12px);
    top: 50%; transform: translateY(-50%);
    background: var(--tooltip-bg); color: #e8f0ea;
    font-size: 12px; font-weight: 500;
    padding: 5px 11px; border-radius: 7px;
    white-space: nowrap; pointer-events: none; z-index: 100;
    font-family: 'DM Sans', system-ui, sans-serif;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .lay-signout-tooltip::before {
    content: '';
    position: absolute;
    right: 100%; top: 50%; transform: translateY(-50%);
    border: 5px solid transparent;
    border-right-color: var(--tooltip-bg);
  }

  /* ── Mobile overlay ── */
  .lay-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(10,20,13,0.55);
    z-index: 40;
    backdrop-filter: blur(3px);
  }
  .lay-overlay.open { display: block; }

  /* ── Mobile top bar ── */
  .lay-topbar {
    display: none;
    align-items: center;
    justify-content: space-between;
    padding: 11px 16px;
    background: var(--topbar-bg);
    border-bottom: 1px solid var(--topbar-border);
    position: sticky; top: 0; z-index: 30;
    flex-shrink: 0;
  }
  .lay-topbar-logo {
    display: flex; align-items: center; gap: 9px;
    font-family: 'DM Serif Display', serif;
    font-size: 17px;
    color: var(--topbar-logo-color);
    letter-spacing: -0.2px;
  }
  .lay-topbar-logo span { color: var(--topbar-logo-accent); }

  .lay-hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 34px; height: 34px;
    border: 1px solid #e2e0e5;
    border-radius: 9px;
    background: #f4f5f2;
    cursor: pointer; padding: 8px;
    transition: background 0.12s; flex-shrink: 0;
  }
  .lay-hamburger:hover { background: #ebe9ed; }
  .lay-hamburger span { display: block; height: 1.5px; background: #5a6b5e; border-radius: 2px; }

  /* ── Logo image ── */
  .lay-logo-img {
    width: 28px; height: 28px;
    border-radius: 7px;
    object-fit: cover;
    flex-shrink: 0;
  }
  .lay-logo-img-sm {
    width: 24px; height: 24px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
  }

  /* ── Section divider ── */
  .lay-section-label {
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--sidebar-section-label);
    padding: 6px 13px 4px;
    white-space: nowrap;
    overflow: hidden;
    font-family: 'DM Sans', system-ui, sans-serif;
  }

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
      box-shadow: rgba(0,0,0,0.4) 6px 0 32px !important;
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

  const sidebarWidth = collapsed ? "58px" : "220px";
  const sidebarPadding = collapsed ? "18px 10px" : "18px 13px";

  return (
    <>
      <style>{css}</style>

      {/* Mobile overlay */}
      <div className={`lay-overlay${mobileOpen ? " open" : ""}`} onClick={() => setMobileOpen(false)} />

      <div style={{
        display: "flex",
        height: "100vh",
        fontFamily: "'DM Sans', system-ui, 'Segoe UI', sans-serif",
        background: "var(--main-bg)",
      }}>

        {/* ── Sidebar ── */}
        <aside
          className={`lay-sidebar${collapsed ? " is-collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}
          style={{
            width: sidebarWidth,
            flexShrink: 0,
            background: "var(--sidebar-bg)",
            borderRight: "1px solid var(--sidebar-border)",
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
            padding: collapsed ? "4px 0 18px" : "4px 2px 18px",
            marginBottom: "2px",
          }}>
            {!collapsed && (
              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                <img src={logoUrl} alt="Mahdari logo" className="lay-logo-img" />
                <span style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "16px",
                  fontWeight: "400",
                  color: "#1a2e22",
                  letterSpacing: "-0.2px",
                }}>
                  Mah<span style={{ color: "#c39853" }}>dari</span>
                </span>
              </div>
            )}
            {collapsed && (
              <img src={logoUrl} alt="Mahdari" className="lay-logo-img" />
            )}

            {/* Desktop collapse toggle */}
            {!collapsed && (
              <button
                className="lay-toggle-btn"
                onClick={() => setCollapsed(c => !c)}
                title="Collapse sidebar"
              >
                ‹
              </button>
            )}
            {collapsed && (
              <button
                className="lay-toggle-btn collapsed"
                onClick={() => setCollapsed(c => !c)}
                title="Expand sidebar"
                style={{ marginTop: "10px" }}
              >
                ‹
              </button>
            )}
          </div>

          {/* Nav items */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
            {!collapsed && (
              <div className="lay-section-label">Menu</div>
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
          <div style={{
            borderTop: "1px solid var(--sidebar-footer-border)",
            paddingTop: "12px",
            marginTop: "8px",
          }}>
            {!collapsed && user?.email && (
              <div style={{
                fontSize: "11px",
                color: "var(--email-color)",
                padding: "0 13px 10px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                letterSpacing: "0.01em",
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
                <span style={{ fontSize: "12px", flexShrink: 0, opacity: 0.7 }}>↩</span>
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
            <div className="lay-topbar-logo">
              <img src={logoUrl} alt="Mahdari" className="lay-logo-img-sm" />
              Mah<span>dari</span>
            </div>
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
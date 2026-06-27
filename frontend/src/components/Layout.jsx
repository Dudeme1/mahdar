import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import supabase from "../supabase";
import logoUrl from "/icon-512.png";
import { useLanguage } from "../i18n/LanguageContext";

// CSS is generated dynamically so RTL overrides are applied cleanly
function makeCSS(isRTL) {
  const inlineStart = isRTL ? "right" : "left";
  const inlineEnd   = isRTL ? "left"  : "right";
  const activeShadow = isRTL ? "inset -2px 0 0" : "inset 2px 0 0";
  const mobileBoxShadow = isRTL
    ? "rgba(0,0,0,0.4) -6px 0 32px"
    : "rgba(0,0,0,0.4) 6px 0 32px";

  return `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');

  * { box-sizing: border-box; }

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

  .lay-sidebar {
    transition: width 0.22s cubic-bezier(0.4,0,0.2,1),
                padding 0.22s cubic-bezier(0.4,0,0.2,1);
    overflow: hidden;
  }

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
    text-align: ${inlineStart};
    white-space: nowrap;
    transition: background 0.14s, color 0.14s;
    letter-spacing: 0.01em;
  }
  .lay-nav-btn:hover {
    background: rgba(0,0,0,0.03);
    color: var(--sidebar-text-hover);
  }
  .lay-nav-btn.active {
    background: var(--sidebar-active-bg);
    color: var(--sidebar-active-text);
    font-weight: 600;
    box-shadow: ${activeShadow} var(--sidebar-active-border);
  }
  .lay-nav-btn.collapsed {
    justify-content: center;
    padding: 9px;
  }
  .lay-nav-icon {
    flex-shrink: 0;
    opacity: 0.75;
  }
  .lay-nav-btn.active .lay-nav-icon { opacity: 1; }
  .lay-nav-label { transition: opacity 0.15s, width 0.15s; overflow: hidden; }

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

  .lay-signout-btn {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 8px 12px;
    border: 1px solid rgba(0,0,0,0.06);
    border-radius: 9px;
    background: transparent;
    color: var(--sidebar-text);
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 12px; font-weight: 500;
    cursor: pointer; white-space: nowrap;
    transition: background 0.12s, color 0.12s, border-color 0.12s;
    letter-spacing: 0.01em;
    text-align: ${inlineStart};
  }
  .lay-signout-btn:hover {
    background: var(--signout-hover-bg);
    color: var(--signout-hover-text);
    border-color: var(--signout-hover-border);
  }
  .lay-signout-btn.collapsed { justify-content: center; padding: 8px; }

  /* Language toggle button */
  .lay-lang-btn {
    display: flex; align-items: center; justify-content: center;
    gap: 6px;
    width: 100%; padding: 7px 12px;
    border: 1px solid rgba(195,152,83,0.3);
    border-radius: 9px;
    background: rgba(195,152,83,0.06);
    color: #a07830;
    font-family: 'DM Sans', system-ui, sans-serif;
    font-size: 11.5px; font-weight: 600;
    cursor: pointer; white-space: nowrap;
    transition: background 0.12s, border-color 0.12s;
    letter-spacing: 0.03em;
    margin-bottom: 6px;
  }
  .lay-lang-btn:hover {
    background: rgba(195,152,83,0.12);
    border-color: rgba(195,152,83,0.5);
  }
  .lay-lang-btn.collapsed { justify-content: center; padding: 7px; }

  .lay-nav-wrap { position: relative; }
  .lay-nav-wrap .lay-tooltip {
    display: none;
    position: absolute;
    ${inlineStart}: calc(100% + 12px);
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
    ${inlineEnd}: 100%; top: 50%; transform: translateY(-50%);
    border: 5px solid transparent;
    border-${inlineStart}-color: var(--tooltip-bg);
  }
  .lay-sidebar.is-collapsed .lay-nav-wrap:hover .lay-tooltip { display: block; }
  .lay-sidebar.is-collapsed .lay-signout-wrap:hover .lay-signout-tooltip { display: block; }

  .lay-signout-wrap { position: relative; }
  .lay-signout-tooltip {
    display: none;
    position: absolute;
    ${inlineStart}: calc(100% + 12px);
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
    ${inlineEnd}: 100%; top: 50%; transform: translateY(-50%);
    border: 5px solid transparent;
    border-${inlineStart}-color: var(--tooltip-bg);
  }

  .lay-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(10,20,13,0.55);
    z-index: 40;
    backdrop-filter: blur(3px);
  }
  .lay-overlay.open { display: block; }

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
    cursor: pointer;
    border-radius: 8px;
    padding: 4px 8px;
    transition: background 0.14s;
    text-decoration: none;
  }
  .lay-topbar-logo:hover { background: rgba(0,0,0,0.04); }
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

  .lay-logo-btn {
    display: flex;
    align-items: center;
    gap: 9px;
    background: transparent;
    border: none;
    padding: 5px 7px;
    border-radius: 9px;
    cursor: pointer;
    transition: background 0.14s;
    min-width: 0;
    flex: 1;
    text-align: ${inlineStart};
  }
  .lay-logo-btn:hover { background: rgba(0,0,0,0.04); }
  .lay-logo-btn.collapsed {
    flex: unset;
    padding: 5px;
    justify-content: center;
  }

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

  @media (max-width: 768px) {
    .lay-sidebar {
      position: fixed !important;
      ${inlineStart}: -240px !important;
      top: 0 !important; bottom: 0 !important;
      z-index: 50 !important;
      width: 220px !important;
      box-shadow: none;
      transition: ${inlineStart} 0.25s cubic-bezier(0.4,0,0.2,1) !important;
    }
    .lay-sidebar.mobile-open {
      ${inlineStart}: 0 !important;
      box-shadow: ${mobileBoxShadow} !important;
    }
    .lay-toggle-btn { display: none !important; }
    .lay-hamburger { display: flex; }
    .lay-topbar { display: flex; }
    .lay-nav-label { opacity: 1 !important; width: auto !important; }
    .lay-nav-btn.collapsed { justify-content: flex-start !important; padding: 9px 12px !important; }
    .lay-signout-btn.collapsed { justify-content: flex-start !important; padding: 8px 12px !important; }
  }
  `;
}

function TagIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

const NAV_ITEMS = [
  { key: "newMahdar", icon: "/newmahdar_icon.png",    path: "/dashboard" },
  { key: "attendees", icon: "/attendees_icon.png",    path: "/attendees" },
  { key: "templates", icon: "/templates_icon.png",    path: "/templates" },
  { key: "history",   icon: "/history_icon.png",      path: "/history"   },
  { key: "tags",      icon: null, SvgIcon: TagIcon,   path: "/tags"      },
];

const ACCOUNT_ITEMS = [
  { key: "subscription", icon: "/subscription_icon.png", path: "/subscription" },
];

function Layout({ children, user, onNewMahdar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, isRTL, language, setLanguage } = useLanguage();
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignout = async () => { await supabase.auth.signOut(); };
  const handleNav = (path) => {
    if (path === "/dashboard") onNewMahdar?.();
    navigate(path);
    setMobileOpen(false);
  };
  const toggleLanguage = () => setLanguage(language === "en" ? "ar" : "en");

  const sidebarWidth   = collapsed ? "58px" : "220px";
  const sidebarPadding = collapsed ? "18px 10px" : "18px 13px";

  return (
    <>
      <style>{makeCSS(isRTL)}</style>

      <div className={`lay-overlay${mobileOpen ? " open" : ""}`} onClick={() => setMobileOpen(false)} />

      <div style={{
        display: "flex",
        flexDirection: "row",
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
            borderInlineEnd: "1px solid var(--sidebar-border)",
            display: "flex",
            flexDirection: "column",
            padding: sidebarPadding,
            gap: "2px",
          }}
        >

          {/* ── Logo row ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            gap: "6px",
            padding: "4px 2px 18px",
            marginBottom: "2px",
          }}>
            {!collapsed && (
              <button
                className="lay-logo-btn"
                onClick={() => handleNav("/dashboard")}
                title="Go to Dashboard"
              >
                <img src={logoUrl} alt="Mahdari logo" className="lay-logo-img" />
                <span style={{
                  fontFamily: "'DM Serif Display', serif",
                  fontSize: "16px",
                  fontWeight: "400",
                  color: "#1a2e22",
                  letterSpacing: "-0.2px",
                  whiteSpace: "nowrap",
                }}>
                  Mah<span style={{ color: "#c39853" }}>dari</span>
                </span>
              </button>
            )}

            <button
              className={`lay-toggle-btn${collapsed ? " collapsed" : ""}`}
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? t("layout.expandSidebar") : t("layout.collapseSidebar")}
              style={{ transform: isRTL ? (collapsed ? "rotate(0deg)" : "rotate(180deg)") : undefined }}
            >
              ‹
            </button>
          </div>

          {/* ── Nav items ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
            {!collapsed && <div className="lay-section-label">{t("layout.menu")}</div>}

            {NAV_ITEMS.map(({ key, icon, SvgIcon, path }) => (
              <div key={path} className="lay-nav-wrap">
                <button
                  className={`lay-nav-btn${location.pathname === path ? " active" : ""}${collapsed ? " collapsed" : ""}`}
                  onClick={() => handleNav(path)}
                >
                  {SvgIcon
                    ? <span className="lay-nav-icon" style={{ width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><SvgIcon size={17} /></span>
                    : <img src={icon} alt="" className="lay-nav-icon" style={{ width: "18px", height: "18px", objectFit: "contain", flexShrink: 0, opacity: 0.75 }} />
                  }
                  {!collapsed && <span className="lay-nav-label">{t(`layout.nav.${key}`)}</span>}
                </button>
                <div className="lay-tooltip">{t(`layout.nav.${key}`)}</div>
              </div>
            ))}
          </div>

          {/* ── Account section ── */}
          <div style={{ marginTop: "12px" }}>
            {!collapsed && <div className="lay-section-label">{t("layout.account")}</div>}
            {ACCOUNT_ITEMS.map(({ key, icon, path }) => (
              <div key={path} className="lay-nav-wrap">
                <button
                  className={`lay-nav-btn${location.pathname === path ? " active" : ""}${collapsed ? " collapsed" : ""}`}
                  onClick={() => handleNav(path)}
                >
                  <img
                    src={icon}
                    alt=""
                    className="lay-nav-icon"
                    style={{ width: "18px", height: "18px", objectFit: "contain", flexShrink: 0, opacity: 0.75 }}
                  />
                  {!collapsed && <span className="lay-nav-label">{t(`layout.nav.${key}`)}</span>}
                </button>
                <div className="lay-tooltip">{t(`layout.nav.${key}`)}</div>
              </div>
            ))}
          </div>

          {/* ── Footer ── */}
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

            {/* Language switcher */}
            <button
              className={`lay-lang-btn${collapsed ? " collapsed" : ""}`}
              onClick={toggleLanguage}
              title={language === "en" ? "Switch to Arabic" : "Switch to English"}
            >
              <span style={{ fontSize: "13px" }}>{language === "en" ? "🌐" : "🌐"}</span>
              {!collapsed && (
                <span>{language === "en" ? "العربية" : "English"}</span>
              )}
            </button>

            <div className="lay-signout-wrap">
              <button
                className={`lay-signout-btn${collapsed ? " collapsed" : ""}`}
                onClick={handleSignout}
              >
                <span style={{ fontSize: "12px", flexShrink: 0, opacity: 0.7 }}>↩</span>
                {!collapsed && <span>{t("common.signOut")}</span>}
              </button>
              <div className="lay-signout-tooltip">{t("common.signOut")}</div>
            </div>
          </div>
        </aside>

        {/* ── Right side ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

          {/* Mobile top bar */}
          <div className="lay-topbar">
            <button className="lay-topbar-logo" onClick={() => handleNav("/dashboard")}>
              <img src={logoUrl} alt="Mahdari" className="lay-logo-img-sm" />
              Mah<span>dari</span>
            </button>
            <button className="lay-hamburger" onClick={() => setMobileOpen(o => !o)} aria-label={t("layout.openMenu")}>
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

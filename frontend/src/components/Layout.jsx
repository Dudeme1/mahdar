import { useNavigate, useLocation } from "react-router-dom";
import supabase from "../supabase";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; }

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
    transition: background 0.12s, color 0.12s;
  }
  .lay-nav-btn:hover {
    background: #f0eff2;
    color: #08060d;
  }
  .lay-nav-btn.active {
    background: rgba(170,59,255,0.09);
    color: #aa3bff;
    font-weight: 600;
  }
  .lay-nav-btn.active .lay-nav-icon {
    filter: none;
  }
  .lay-nav-icon {
    font-size: 15px;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
  }

  .lay-signout-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e5e4e7;
    border-radius: 10px;
    background: #fff;
    color: #6b6375;
    font-family: inherit;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.12s, color 0.12s;
  }
  .lay-signout-btn:hover {
    background: #fef2f2;
    color: #dc2626;
    border-color: #fecaca;
  }

  .lay-sidebar-divider {
    height: 1px;
    background: #e5e4e7;
    margin: 8px 0;
  }

  /* Active indicator bar */
  .lay-nav-btn.active::before {
    content: '';
    display: block;
    width: 3px;
    height: 16px;
    background: #aa3bff;
    border-radius: 2px;
    margin-right: -3px;
    position: absolute;
    left: 0;
  }
`;

const S = {
  root: {
    display: "flex",
    height: "100vh",
    fontFamily: "Inter, system-ui, 'Segoe UI', sans-serif",
    background: "#f7f7f8",
  },

  // ── Sidebar ──
  sidebar: {
    width: "220px",
    flexShrink: 0,
    background: "#fff",
    borderRight: "1px solid #e5e4e7",
    display: "flex",
    flexDirection: "column",
    padding: "20px 14px",
    gap: "2px",
  },

  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "4px 10px 16px",
    marginBottom: "4px",
  },
  logoIcon: { fontSize: "18px" },
  logoText: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#08060d",
    letterSpacing: "-0.4px",
  },
  logoAccent: { color: "#aa3bff" },

  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  navLabel: {
    fontSize: "10px",
    fontWeight: "600",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#c4bfca",
    padding: "6px 12px 4px",
  },

  // ── User footer ──
  sidebarFooter: {
    borderTop: "1px solid #e5e4e7",
    paddingTop: "12px",
    marginTop: "8px",
  },

  // ── Main content ──
  main: {
    flex: 1,
    overflowY: "auto",
    minWidth: 0,
  },
};

const NAV_ITEMS = [
  { label: "New Mahdar", icon: "🎙️", path: "/dashboard" },
  { label: "Attendees", icon: "👥", path: "/attendees" },
];

function Layout({ children, user }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      <style>{css}</style>
      <div style={S.root}>

        {/* Sidebar */}
        <aside style={S.sidebar}>

          {/* Logo */}
          <div style={S.logoWrap}>
            <span style={S.logoIcon}>🎙️</span>
            <span style={S.logoText}>
              Mah<span style={S.logoAccent}>dari</span>
            </span>
          </div>

          {/* Nav */}
          <div style={S.navSection}>
            <div style={S.navLabel}>Menu</div>
            {NAV_ITEMS.map(({ label, icon, path }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  className={`lay-nav-btn${isActive ? " active" : ""}`}
                  onClick={() => navigate(path)}
                >
                  <span className="lay-nav-icon">{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div style={S.sidebarFooter}>
            {user?.email && (
              <div style={{ fontSize: "11px", color: "#b0adb5", padding: "0 12px 10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.email}
              </div>
            )}
            <button className="lay-signout-btn" onClick={handleSignout}>
              <span style={{ fontSize: "13px" }}>↩</span>
              Sign out
            </button>
          </div>

        </aside>

        {/* Main content */}
        <main style={S.main}>
          {children}
        </main>

      </div>
    </>
  );
}

export default Layout;
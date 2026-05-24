import { useState, useEffect } from "react";
import supabase from "../supabase";

const CUSTOMER_PORTAL = "https://customer.dodopayments.com/login/bus_D9dlIAaRH05nt0RMfWze3";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display&display=swap');

  @keyframes sub-fadein {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sub-page { animation: sub-fadein 0.32s ease; }

  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position: 600px 0; }
  }
  .sub-skeleton {
    background: linear-gradient(90deg, #eeecf0 25%, #f9f8f5 50%, #eeecf0 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
  }

  .sub-plan-card {
    border: 1px solid #e8e7ea;
    border-radius: 16px;
    padding: 24px;
    background: #fff;
    transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s;
    cursor: default;
    position: relative;
    overflow: hidden;
  }
  .sub-plan-card:hover {
    box-shadow: 0 8px 28px rgba(26,46,34,0.09);
    transform: translateY(-2px);
  }
  .sub-plan-card.pro {
    border-color: rgba(195,152,83,0.4);
    background: linear-gradient(135deg, #fffdf7 0%, #fff 60%);
  }
  .sub-plan-card.pro::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #c39853, #e8c47a, #c39853);
    background-size: 200% 100%;
    animation: shimmer 2.5s infinite linear;
  }

  .sub-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    font-family: 'DM Sans', sans-serif;
  }
  .sub-badge.free {
    background: #f4f5f2;
    color: #6b7280;
    border: 1px solid #e2e0e5;
  }
  .sub-badge.pro {
    background: rgba(195,152,83,0.12);
    color: #a07830;
    border: 1px solid rgba(195,152,83,0.3);
  }
  .sub-badge.active {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
  }
  .sub-badge.cancelled {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .sub-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 11px 22px;
    border: none;
    border-radius: 11px;
    background: #1a2e22;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.12s;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }
  .sub-btn-primary:hover { opacity: 0.85; transform: translateY(-1px); }
  .sub-btn-primary:active { transform: translateY(0); }
  .sub-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .sub-btn-gold {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 11px 22px;
    border: none;
    border-radius: 11px;
    background: linear-gradient(135deg, #c39853, #d4aa5e);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.12s, box-shadow 0.15s;
    letter-spacing: 0.01em;
    box-shadow: 0 3px 12px rgba(195,152,83,0.35);
    white-space: nowrap;
  }
  .sub-btn-gold:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: 0 5px 18px rgba(195,152,83,0.45);
  }
  .sub-btn-gold:active { transform: translateY(0); }
  .sub-btn-gold:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

  .sub-btn-outline {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 10px 20px;
    border: 1px solid #e2e0e5;
    border-radius: 11px;
    background: #fff;
    color: #444;
    font-size: 13px;
    font-weight: 500;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    transition: background 0.13s, border-color 0.13s, transform 0.12s;
    white-space: nowrap;
    text-decoration: none;
  }
  .sub-btn-outline:hover {
    background: #f4f5f2;
    border-color: #c4bfca;
    transform: translateY(-1px);
  }

  .sub-progress-bar {
    width: 100%;
    height: 7px;
    background: #eeecf0;
    border-radius: 99px;
    overflow: hidden;
  }
  .sub-progress-fill {
    height: 100%;
    border-radius: 99px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sub-feature-item {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    font-size: 13px;
    color: #444;
    font-family: 'DM Sans', sans-serif;
    line-height: 1.5;
    padding: 3px 0;
  }
  .sub-feature-check {
    width: 17px;
    height: 17px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
    font-size: 9px;
  }
  .sub-feature-check.yes {
    background: #d1fae5;
    color: #065f46;
  }
  .sub-feature-check.no {
    background: #f4f5f2;
    color: #c4bfca;
  }

  .sub-divider {
    width: 100%;
    height: 1px;
    background: #eeecf0;
    margin: 4px 0;
  }

  .sub-meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #f4f5f2;
    font-family: 'DM Sans', sans-serif;
  }
  .sub-meta-row:last-child { border-bottom: none; }
  .sub-meta-label {
    font-size: 12px;
    color: #9ca3a8;
    font-weight: 500;
    letter-spacing: 0.02em;
  }
  .sub-meta-value {
    font-size: 13px;
    color: #1a1a1a;
    font-weight: 600;
  }

  .sub-section-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #c4bfca;
    font-family: 'DM Sans', sans-serif;
    margin-bottom: 12px;
  }
`;

const FREE_FEATURES = [
  { text: "4 mahdars per month", yes: true },
  { text: "All output languages", yes: true },
  { text: "Attendees library", yes: true },
  { text: "250 mahdars per month", yes: false },
  { text: "Custom Word templates", yes: false },
  { text: "Priority support", yes: false },
];

const PRO_FEATURES = [
  { text: "250 mahdars per month", yes: true },
  { text: "All output languages", yes: true },
  { text: "Attendees library", yes: true },
  { text: "Custom Word templates", yes: true },
  { text: "Priority support", yes: true },
  { text: "Early access to new features", yes: true },
];

function SubscriptionScreen({ user }) {
  const [token, setToken] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  const API = import.meta.env.VITE_API_URL;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchSubscription();
  }, [token]);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/get-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      setSubscription(data.subscription);
    } catch (e) {
      console.error("Failed to fetch subscription", e);
    }
    setLoading(false);
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch(`${API}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error("Upgrade failed", e);
    }
    setUpgrading(false);
  };

  const isPro = subscription?.plan === "pro";
  const limit = isPro ? 250 : 4;
  const used = subscription?.mahdar_count_this_month ?? 0;
  const progressPct = Math.min((used / limit) * 100, 100);
  const progressColor = progressPct >= 90 ? "#ef4444" : progressPct >= 70 ? "#f59e0b" : isPro ? "#c39853" : "#1a2e22";

  const formatDate = (isoStr) => {
    if (!isoStr) return "—";
    return new Date(isoStr).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  return (
    <>
      <style>{css}</style>
      <div
        className="sub-page"
        style={{
          minHeight: "100vh",
          backgroundColor: "#f4f5f2",
          padding: "32px 20px 60px",
          boxSizing: "border-box",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: "780px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* ── Page header ── */}
          <div>
            <h1 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "26px",
              fontWeight: "400",
              color: "#1a2e22",
              margin: "0 0 4px",
              letterSpacing: "-0.3px",
            }}>
              Subscription
            </h1>
            <p style={{ margin: 0, fontSize: "13px", color: "#9ca3a8" }}>
              Manage your plan and usage
            </p>
          </div>

          {/* ── Current plan card ── */}
          <div style={{
            background: "#fff",
            border: "1px solid #e8e7ea",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(26,46,34,0.05)",
          }}>
            {/* Card header */}
            <div style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid #f4f5f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="sub-section-title" style={{ margin: 0 }}>Current Plan</div>
              </div>
              {loading ? (
                <div className="sub-skeleton" style={{ width: "64px", height: "22px" }} />
              ) : (
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span className={`sub-badge ${isPro ? "pro" : "free"}`}>
                    {isPro ? "✦ Pro" : "Free"}
                  </span>
                  <span className={`sub-badge ${subscription?.status === "active" ? "active" : "cancelled"}`}>
                    {subscription?.status ?? "active"}
                  </span>
                </div>
              )}
            </div>

            {/* Card body */}
            <div style={{ padding: "20px 24px" }}>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="sub-skeleton" style={{ height: "14px", width: "60%" }} />
                  <div className="sub-skeleton" style={{ height: "7px", width: "100%" }} />
                  <div className="sub-skeleton" style={{ height: "14px", width: "40%" }} />
                </div>
              ) : (
                <>
                  {/* Usage bar */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: "8px",
                    }}>
                      <span style={{ fontSize: "13px", color: "#444", fontWeight: "500" }}>
                        Mahdars this month
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: progressColor }}>
                        {used} <span style={{ fontWeight: "400", color: "#9ca3a8" }}>/ {limit}</span>
                      </span>
                    </div>
                    <div className="sub-progress-bar">
                      <div
                        className="sub-progress-fill"
                        style={{ width: `${progressPct}%`, background: progressColor }}
                      />
                    </div>
                    {progressPct >= 90 && !isPro && (
                      <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#ef4444", fontWeight: "500" }}>
                        Almost at your limit — upgrade to keep going
                      </p>
                    )}
                  </div>

                  {/* Meta rows */}
                  <div style={{ marginBottom: "20px" }}>
                    <div className="sub-meta-row">
                      <span className="sub-meta-label">Plan</span>
                      <span className="sub-meta-value" style={{ color: isPro ? "#a07830" : "#1a1a1a" }}>
                        {isPro ? "Pro" : "Free"}
                      </span>
                    </div>
                    {isPro && subscription?.ends_at && (
                      <div className="sub-meta-row">
                        <span className="sub-meta-label">Renews on</span>
                        <span className="sub-meta-value">{formatDate(subscription.ends_at)}</span>
                      </div>
                    )}
                    <div className="sub-meta-row">
                      <span className="sub-meta-label">Usage resets</span>
                      <span className="sub-meta-value">
                        {subscription?.last_reset_date
                          ? formatDate(
                              new Date(
                                new Date(subscription.last_reset_date).setMonth(
                                  new Date(subscription.last_reset_date).getMonth() + 1
                                )
                              ).toISOString()
                            )
                          : "—"}
                      </span>
                    </div>
                    {user?.email && (
                      <div className="sub-meta-row">
                        <span className="sub-meta-label">Account</span>
                        <span className="sub-meta-value" style={{ fontSize: "12px", color: "#6b7280" }}>
                          {user.email}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {!isPro ? (
                      <button
                        className="sub-btn-gold"
                        onClick={handleUpgrade}
                        disabled={upgrading}
                      >
                        {upgrading ? "Redirecting…" : "✦ Upgrade to Pro"}
                      </button>
                    ) : (
                      <a
                        className="sub-btn-outline"
                        href={CUSTOMER_PORTAL}
                        target="_blank"
                        rel="noreferrer"
                      >
                        ↗ Manage subscription
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Plans comparison ── */}
          <div>
            <div className="sub-section-title">Plans</div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "14px",
            }}>

              {/* Free card */}
              <div className="sub-plan-card">
                <div style={{ marginBottom: "16px" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#1a2e22", fontFamily: "'DM Sans', sans-serif" }}>
                      Free
                    </span>
                    {!isPro && <span className="sub-badge free">Current plan</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                    <span style={{ fontSize: "26px", fontWeight: "700", color: "#1a2e22", fontFamily: "'DM Serif Display', serif" }}>$0</span>
                    <span style={{ fontSize: "12px", color: "#9ca3a8" }}>/month</span>
                  </div>
                </div>
                <div className="sub-divider" />
                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {FREE_FEATURES.map((f, i) => (
                    <div className="sub-feature-item" key={i}>
                      <span className={`sub-feature-check ${f.yes ? "yes" : "no"}`}>
                        {f.yes ? "✓" : "✕"}
                      </span>
                      <span style={{ color: f.yes ? "#444" : "#c4bfca" }}>{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro card */}
              <div className="sub-plan-card pro">
                <div style={{ marginBottom: "16px" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}>
                    <span style={{ fontSize: "15px", fontWeight: "700", color: "#a07830", fontFamily: "'DM Sans', sans-serif" }}>
                      ✦ Pro
                    </span>
                    {isPro && <span className="sub-badge pro">Current plan</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                    <span style={{ fontSize: "26px", fontWeight: "700", color: "#a07830", fontFamily: "'DM Serif Display', serif" }}>$9</span>
                    <span style={{ fontSize: "12px", color: "#c39853" }}>/month</span>
                  </div>
                </div>
                <div className="sub-divider" style={{ background: "rgba(195,152,83,0.2)" }} />
                <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "2px" }}>
                  {PRO_FEATURES.map((f, i) => (
                    <div className="sub-feature-item" key={i}>
                      <span className={`sub-feature-check yes`} style={{ background: "rgba(195,152,83,0.15)", color: "#a07830" }}>
                        ✓
                      </span>
                      <span>{f.text}</span>
                    </div>
                  ))}
                </div>
                {!isPro && (
                  <button
                    className="sub-btn-gold"
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    style={{ marginTop: "20px", width: "100%" }}
                  >
                    {upgrading ? "Redirecting…" : "✦ Upgrade to Pro"}
                  </button>
                )}
                {isPro && (
                  <a
                    className="sub-btn-outline"
                    href={CUSTOMER_PORTAL}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginTop: "20px", width: "100%", boxSizing: "border-box" }}
                  >
                    ↗ Manage / Cancel
                  </a>
                )}
              </div>

            </div>
          </div>

          {/* ── Portal note ── */}
          {isPro && (
            <div style={{
              background: "rgba(195,152,83,0.07)",
              border: "1px solid rgba(195,152,83,0.2)",
              borderRadius: "12px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <span style={{ fontSize: "16px" }}>💳</span>
              <div>
                <p style={{ margin: 0, fontSize: "13px", color: "#6b4c0e", fontWeight: "600", fontFamily: "'DM Sans', sans-serif" }}>
                  Need to update payment or cancel?
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9c7a2e", fontFamily: "'DM Sans', sans-serif" }}>
                  Use the customer portal — enter your purchase email to get instant access.{" "}
                  <a href={CUSTOMER_PORTAL} target="_blank" rel="noreferrer" style={{ color: "#a07830", fontWeight: "600" }}>
                    Open portal ↗
                  </a>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default SubscriptionScreen;

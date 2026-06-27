import { useState, useEffect, useRef } from "react";
import supabase from "../supabase";
import { useLanguage } from "../i18n/LanguageContext";

const API = import.meta.env.VITE_API_URL;

const css = `
  .ts-root { max-width: 640px; margin: 0 auto; padding: 2rem 1.5rem; font-family: 'DM Sans', system-ui, sans-serif; }
  .ts-create-row { display: flex; gap: 8px; margin-bottom: 20px; }
  .ts-create-input {
    flex: 1; height: 38px; padding: 0 12px;
    border: 1px solid #e8e7ea; border-radius: 10px;
    font-size: 13px; font-family: inherit; color: #1a2e22;
    background: #fff; outline: none; transition: border-color 0.15s;
  }
  .ts-create-input:focus { border-color: rgba(195,152,83,0.6); box-shadow: 0 0 0 3px rgba(195,152,83,0.08); }
  .ts-create-input::placeholder { color: #c4bfca; }
  .ts-create-btn {
    height: 38px; padding: 0 16px; border-radius: 10px;
    border: none; background: #1a2e22; color: #fff;
    font-size: 13px; font-weight: 600; font-family: inherit;
    cursor: pointer; white-space: nowrap; transition: opacity 0.15s;
  }
  .ts-create-btn:hover { opacity: 0.85; }
  .ts-create-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .ts-list { display: flex; flex-direction: column; gap: 6px; }
  .ts-row {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: 12px;
    border: 1px solid #e8e7ea; background: #fff;
    transition: box-shadow 0.15s;
  }
  .ts-row:hover { box-shadow: 0 2px 8px rgba(26,46,34,0.06); }

  .ts-stamp {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 11px; border-radius: 5px;
    border: 1.5px dashed rgba(160,120,48,0.65);
    background: rgba(195,152,83,0.06);
    color: #8a6525; font-size: 10px; font-weight: 700;
    letter-spacing: 0.11em; text-transform: uppercase;
    font-family: 'DM Sans', system-ui, sans-serif;
    flex-shrink: 0;
  }

  .ts-rename-input {
    flex: 1; height: 30px; padding: 0 9px;
    border: 1px solid rgba(195,152,83,0.4); border-radius: 7px;
    font-size: 13px; font-family: inherit; color: #1a2e22;
    background: #fffdf8; outline: none;
  }
  .ts-rename-input:focus { border-color: rgba(195,152,83,0.7); box-shadow: 0 0 0 3px rgba(195,152,83,0.08); }

  .ts-spacer { flex: 1; }

  .ts-action-btn {
    display: inline-flex; align-items: center; justify-content: center;
    height: 28px; padding: 0 10px; border-radius: 7px;
    border: 1px solid #e8e7ea; background: transparent;
    font-size: 11px; font-weight: 600; font-family: inherit;
    color: #7a7585; cursor: pointer; transition: all 0.12s; white-space: nowrap;
  }
  .ts-action-btn:hover { background: #f4f3f6; color: #1a2e22; border-color: #d0ccd8; }
  .ts-action-btn.danger { color: #c0564a; border-color: rgba(192,86,74,0.25); }
  .ts-action-btn.danger:hover { background: #fbf1f0; border-color: #e3b8b3; }
  .ts-action-btn.confirm { background: #fbf1f0; border-color: #c0564a; color: #c0564a; }
  .ts-action-btn.save { background: #1a2e22; color: #fff; border-color: #1a2e22; }
  .ts-action-btn.save:hover { opacity: 0.85; }

  .ts-empty { text-align: center; padding: 48px 20px; color: #b0adb5; font-size: 13px; }
  .ts-empty-icon { font-size: 28px; margin-bottom: 10px; }

  .ts-error { background: #fbf1f0; border: 1px solid #e3b8b3; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #9c4338; margin-bottom: 14px; }
`;

function TagRow({ tag, token, onRenamed, onDeleted }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState("view"); // view | rename
  const [renameVal, setRenameVal] = useState(tag.name);
  const [confirmDel, setConfirmDel] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const startRename = () => {
    setRenameVal(tag.name);
    setMode("rename");
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const cancelRename = () => { setMode("view"); setRenameVal(tag.name); };

  const saveRename = async () => {
    const name = renameVal.trim();
    if (!name || name === tag.name) { cancelRename(); return; }
    setSaving(true);
    await fetch(`${API}/rename-tag`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, tag_id: tag.id, name }),
    });
    setSaving(false);
    setMode("view");
    onRenamed(tag.id, name);
  };

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    await fetch(`${API}/delete-tag`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, tag_id: tag.id }),
    });
    onDeleted(tag.id);
  };

  return (
    <div className="ts-row" onMouseLeave={() => setConfirmDel(false)}>
      {mode === "view" ? (
        <>
          <span className="ts-stamp">{tag.name}</span>
          <span className="ts-spacer" />
          <button className="ts-action-btn" onClick={startRename}>Rename</button>
          <button
            className={`ts-action-btn danger${confirmDel ? " confirm" : ""}`}
            onClick={handleDelete}
          >
            {confirmDel ? t("tags.deleteConfirm") : "Delete"}
          </button>
        </>
      ) : (
        <>
          <input
            ref={inputRef}
            className="ts-rename-input"
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") cancelRename(); }}
          />
          <button className="ts-action-btn save" onClick={saveRename} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
          <button className="ts-action-btn" onClick={cancelRename}>{t("common.cancel")}</button>
        </>
      )}
    </div>
  );
}

function TagsScreen() {
  const { t } = useLanguage();
  const [token, setToken] = useState(null);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API}/get-tags`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(d => { setTags(d.tags || []); setLoading(false); })
      .catch(() => { setError(t("tags.loadError")); setLoading(false); });
  }, [token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const res = await fetch(`${API}/create-tag`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name }),
    });
    const data = await res.json();
    if (data.tag) {
      setTags(prev => {
        const exists = prev.find(t => t.id === data.tag.id);
        if (exists) return prev;
        return [...prev, data.tag].sort((a, b) => a.name.localeCompare(b.name));
      });
    }
    setNewName("");
    setCreating(false);
  };

  const handleRenamed = (id, name) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, name } : t).sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleDeleted = (id) => {
    setTags(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="ts-root">
      <style>{css}</style>

      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "17px", fontWeight: "600", color: "#1a2e22", margin: 0 }}>{t("tags.pageTitle")}</h2>
        <p style={{ fontSize: "13px", color: "#b0adb5", marginTop: "3px", margin: "3px 0 0" }}>{t("tags.pageSubtitle")}</p>
      </div>

      {error && <div className="ts-error">{error}</div>}

      <form className="ts-create-row" onSubmit={handleCreate}>
        <input
          className="ts-create-input"
          placeholder={t("tags.newTagPlaceholder")}
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button className="ts-create-btn" type="submit" disabled={!newName.trim() || creating}>
          {creating ? "…" : t("tags.createBtn")}
        </button>
      </form>

      {loading ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: "#b0adb5", fontSize: "13px" }}>Loading…</div>
      ) : tags.length === 0 ? (
        <div className="ts-empty">
          <div className="ts-empty-icon">🏷️</div>
          {t("tags.emptyState")}
        </div>
      ) : (
        <div className="ts-list">
          {tags.map(tag => (
            <TagRow
              key={tag.id}
              tag={tag}
              token={token}
              onRenamed={handleRenamed}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TagsScreen;

import { useState, useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL;

const css = `
  .tp-wrap { display:flex; align-items:center; flex-wrap:wrap; gap:5px; margin-top:5px; }
  .tp-stamp {
    display:inline-flex; align-items:center; gap:4px;
    padding:3px 8px; border-radius:4px;
    border:1.5px dashed rgba(160,120,48,0.6);
    background:rgba(195,152,83,0.06);
    color:#8a6525; font-size:9px; font-weight:700;
    letter-spacing:0.1em; text-transform:uppercase;
    font-family:'DM Sans',system-ui,sans-serif;
  }
  .tp-stamp-remove {
    display:inline-flex; align-items:center; justify-content:center;
    width:11px; height:11px; border:none; background:transparent;
    cursor:pointer; color:rgba(138,101,37,0.5); font-size:11px;
    font-weight:700; padding:0; line-height:1; transition:color 0.12s;
  }
  .tp-stamp-remove:hover { color:#c0564a; }
  .tp-add-btn {
    display:inline-flex; align-items:center; gap:3px;
    padding:3px 8px; border-radius:4px;
    border:1.5px dashed rgba(160,120,48,0.35);
    background:transparent; color:rgba(160,120,48,0.6);
    font-size:9px; font-weight:700; letter-spacing:0.1em;
    text-transform:uppercase; font-family:'DM Sans',system-ui,sans-serif;
    cursor:pointer; transition:border-color 0.13s, background 0.13s, color 0.13s;
  }
  .tp-add-btn:hover { border-color:rgba(160,120,48,0.65); background:rgba(195,152,83,0.06); color:#8a6525; }
  .tp-dropdown-wrap { position:relative; display:inline-flex; }
  .tp-input {
    height:24px; padding:0 8px; border-radius:5px;
    border:1.5px solid rgba(160,120,48,0.5);
    background:#fff; font-size:11px; font-weight:600;
    letter-spacing:0.04em; color:#8a6525;
    font-family:'DM Sans',system-ui,sans-serif;
    outline:none; width:130px;
  }
  .tp-input:focus { border-color:rgba(160,120,48,0.8); box-shadow:0 0 0 3px rgba(195,152,83,0.1); }
  .tp-input::placeholder { color:rgba(160,120,48,0.4); }
  .tp-dropdown {
    position:absolute; top:calc(100% + 4px); left:0; z-index:100;
    background:#fff; border:1px solid #e8e7ea; border-radius:9px;
    box-shadow:0 8px 24px rgba(26,46,34,0.1);
    min-width:160px; max-height:200px; overflow-y:auto; padding:4px;
  }
  .tp-item {
    padding:6px 10px; border-radius:6px;
    font-size:11px; font-weight:700; letter-spacing:0.07em;
    text-transform:uppercase; color:#1a2e22;
    cursor:pointer; font-family:'DM Sans',system-ui,sans-serif;
    transition:background 0.1s;
  }
  .tp-item:hover { background:#f4f3f6; }
  .tp-item.create { color:#a07830; }
  .tp-item.create:hover { background:rgba(195,152,83,0.08); }
  .tp-empty { padding:8px 10px; font-size:11px; color:#b0adb5; font-family:'DM Sans',system-ui,sans-serif; }
`;

let cssInjected = false;
function injectCss() {
  if (cssInjected) return;
  const el = document.createElement("style");
  el.textContent = css;
  document.head.appendChild(el);
  cssInjected = true;
}

function TagPicker({ token, initialTags = [], onUpdate }) {
  const [allTags, setAllTags]           = useState([]);
  const [selected, setSelected]         = useState(initialTags);
  const [inputMode, setInputMode]       = useState(false);
  const [inputVal, setInputVal]         = useState("");
  const wrapRef                         = useRef(null);
  const inputRef                        = useRef(null);

  injectCss();

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/get-tags`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then(r => r.json()).then(d => setAllTags(d.tags || []));
  }, [token]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setInputMode(false);
        setInputVal("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const save = async (tags) => {
    setSelected(tags);
    if (onUpdate) await onUpdate(tags.map(t => t.id));
  };

  const addTag = async (tag) => {
    if (selected.find(s => s.id === tag.id)) return;
    const next = [...selected, tag];
    await save(next);
    setInputVal("");
    setInputMode(false);
  };

  const createAndAdd = async () => {
    const name = inputVal.trim();
    if (!name) return;
    const res = await fetch(`${API}/create-tag`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name }),
    });
    const data = await res.json();
    if (data.tag) {
      setAllTags(prev => prev.find(t => t.id === data.tag.id) ? prev : [...prev, data.tag].sort((a, b) => a.name.localeCompare(b.name)));
      await addTag(data.tag);
    }
  };

  const removeTag = async (id) => {
    const next = selected.filter(t => t.id !== id);
    await save(next);
  };

  const filtered = allTags.filter(t =>
    !selected.find(s => s.id === t.id) &&
    t.name.toLowerCase().includes(inputVal.toLowerCase())
  );
  const showCreate = inputVal.trim() && !allTags.find(t => t.name.toLowerCase() === inputVal.trim().toLowerCase());

  return (
    <div className="tp-wrap" ref={wrapRef}>
      {selected.map(tag => (
        <span key={tag.id} className="tp-stamp">
          {tag.name}
          <button className="tp-stamp-remove" onClick={() => removeTag(tag.id)}>×</button>
        </span>
      ))}

      {!inputMode ? (
        <button className="tp-add-btn" onClick={() => { setInputMode(true); setTimeout(() => inputRef.current?.focus(), 20); }}>
          + tag
        </button>
      ) : (
        <div className="tp-dropdown-wrap">
          <input
            ref={inputRef}
            className="tp-input"
            placeholder="Search or create…"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") { e.preventDefault(); if (showCreate) createAndAdd(); else if (filtered[0]) addTag(filtered[0]); }
              if (e.key === "Escape") { setInputMode(false); setInputVal(""); }
            }}
          />
          {(filtered.length > 0 || showCreate) && (
            <div className="tp-dropdown">
              {filtered.map(tag => (
                <div key={tag.id} className="tp-item" onMouseDown={() => addTag(tag)}>{tag.name}</div>
              ))}
              {showCreate && (
                <div className="tp-item create" onMouseDown={createAndAdd}>+ Create "{inputVal.trim()}"</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TagPicker;

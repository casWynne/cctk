/* ==========================================================================
   Friendly Gorilla — app logic (CCTK)
   Vanilla JS + vendored PapaParse / SheetJS / docx.
   Participant data lives in memory only. localStorage holds preferences only
   (keys prefixed friendlygorilla_*).
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Fallback config (used if config/*.json can't be fetched, e.g. opened via file://) ---------- */
  const FALLBACK = {
    defaults: { statsTool: "SPSS", quantFormat: "csv", qualFormat: "docx", previewRowCap: 500, largeFileRowWarning: 50000 },
    defaultRemove: [
      "Event Index", "UTC Timestamp", "UTC Date and Time", "Local Timestamp", "Local Timezone",
      "Local Date and Time", "Experiment ID", "Experiment Version", "Tree Node Key", "Repeat Key",
      "Schedule ID", "Participant Public ID", "Participant Starting Group", "Participant Status",
      "Participant Completion Code", "Participant External Session ID", "Participant Device Type",
      "Participant Device", "Participant OS", "Participant Browser", "Participant Monitor Size",
      "Participant Viewport Size", "Checkpoint", "Room ID", "Room Order", "Task Name", "Task Version"
    ],
    reserved: ["ALL", "AND", "BY", "EQ", "GE", "GT", "LE", "LT", "NE", "NOT", "OR", "TO", "WITH"],
    citation: {
      authorFamily: "Wynne", authorGiven: "Caspar", authorInitials: "C.", year: "2026",
      title: "Friendly Gorilla: A browser-based cleaner for Gorilla data", version: "1.0",
      publisher: "Caspar's Cool Tool Kit (CCTK)",
      url: "https://caswynne.github.io/psychactivities2/friendly-gorilla/",
      bibtexKey: "wynne2026friendlygorilla"
    }
  };

  const CONFIG = {
    defaults: { ...FALLBACK.defaults },
    defaultRemove: FALLBACK.defaultRemove.slice(),
    reserved: new Set(FALLBACK.reserved),
    citation: { ...FALLBACK.citation }
  };

  const SETTINGS_KEY = "friendlygorilla_settings";
  const ID_NAME = "participant private id";
  const EOF_RE = /^\s*end\s*of\s*file\s*$/i;
  const NUM_RE = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/;

  /* ---------- State ---------- */
  const state = {
    fileName: "",
    fileBase: "",
    original: null,      // { cols: [{key,name}], rows: [[string]] }
    data: null,          // current data — rows are never mutated in place, so snapshots can share them
    log: [],             // [{ op, lines: [string] }]
    history: [],         // [{ data, log }]
    baseHistory: 0,      // history length straight after import (auto-clean)
    idKey: null,
    dataType: null,      // { label, source }
    importWarnings: [],  // [{ id, level, html }]
    dismissed: new Set(),
    tool: null,
    settings: {},
    renameDraft: new Map(),
    renameReview: null,
    scoreDraft: null,
    scoreQueue: [],
    exportDraft: null,
    nextNewKey: 1
  };

  /* ---------- Icons (Lucide set, inlined so there is no CDN dependency) ---------- */
  const ICONS = {
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    reset: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    columns: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/>',
    rows: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
    rename: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
    sigma: '<path d="M18 7V4H6l6 8-6 8h12v-3"/>',
    list: '<line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>',
    fileText: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    ok: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'
  };

  function icon(name) {
    return '<svg class="fg-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
  }

  function hydrateIcons(root) {
    (root || document).querySelectorAll("[data-icon]:not([data-icon-done])").forEach(el => {
      el.insertAdjacentHTML("afterbegin", icon(el.getAttribute("data-icon")));
      el.setAttribute("data-icon-done", "");
    });
  }

  /* ---------- Small helpers ---------- */
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  const norm = s => String(s ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const isBlank = v => String(v ?? "").trim() === "";
  const plural = (n, one, many) => `${n.toLocaleString()} ${n === 1 ? one : (many || one + "s")}`;
  const quoteList = names => names.map(n => `'${n}'`).join(", ");

  function toNum(v) {
    const t = String(v ?? "").trim();
    return NUM_RE.test(t) ? Number(t) : NaN;
  }
  function fmtNum(n) {
    return Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(6)));
  }

  function toast(msg, kind) {
    const el = document.createElement("div");
    el.className = "fg-toast" + (kind === "error" ? " fg-toast--error" : "");
    el.innerHTML = icon(kind === "error" ? "alert" : "check") + "<span>" + esc(msg) + "</span>";
    $("#toasts").appendChild(el);
    setTimeout(() => el.remove(), kind === "error" ? 6000 : 3500);
  }

  function notice(level, html, extra) {
    const ic = { warn: "alert", info: "info", error: "alert", ok: "ok" }[level] || "info";
    const cls = level === "warn" ? "" : " fg-notice--" + level;
    return `<div class="fg-notice${cls}">${icon(ic)}<div>${html}</div>${extra || ""}</div>`;
  }

  function download(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    toast("Copied to clipboard");
  }

  function colIndex(key, data = state.data) {
    return data ? data.cols.findIndex(c => c.key === key) : -1;
  }
  function colByKey(key, data = state.data) {
    return data ? data.cols.find(c => c.key === key) : undefined;
  }
  function idIndex() {
    return state.idKey ? colIndex(state.idKey) : -1;
  }

  /* ---------- Config + settings ---------- */
  async function loadConfig() {
    const get = path => fetch(path, { cache: "no-cache" }).then(r => (r.ok ? r.json() : Promise.reject(r.status)));
    const [defaults, remove, reserved, citation] = await Promise.allSettled([
      get("config/app-defaults.json"), get("config/default-remove.json"),
      get("config/spss-reserved.json"), get("config/citation.json")
    ]);
    if (defaults.status === "fulfilled") Object.assign(CONFIG.defaults, stripComment(defaults.value));
    if (remove.status === "fulfilled" && Array.isArray(remove.value.columns)) CONFIG.defaultRemove = remove.value.columns;
    if (reserved.status === "fulfilled" && Array.isArray(reserved.value.reserved)) {
      CONFIG.reserved = new Set(reserved.value.reserved.map(s => String(s).toUpperCase()));
    }
    if (citation.status === "fulfilled") Object.assign(CONFIG.citation, stripComment(citation.value));
  }
  function stripComment(o) {
    const c = { ...o };
    delete c._comment;
    return c;
  }

  function loadSettings() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {}; } catch (e) { saved = {}; }
    state.settings = {
      statsTool: saved.statsTool || CONFIG.defaults.statsTool,
      quantFormat: saved.quantFormat || CONFIG.defaults.quantFormat,
      qualFormat: saved.qualFormat || CONFIG.defaults.qualFormat
    };
  }
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings)); } catch (e) { /* storage unavailable */ }
  }
  function clearSettings() {
    try {
      Object.keys(localStorage).filter(k => k.startsWith("friendlygorilla_")).forEach(k => localStorage.removeItem(k));
    } catch (e) { /* storage unavailable */ }
    loadSettings();
  }
  const isSpss = () => state.settings.statsTool === "SPSS";

  /* ---------- Theme ---------- */
  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }
  function themeChoice() {
    let saved = null;
    try { saved = localStorage.getItem("cctk_theme"); } catch (e) { /* ignore */ }
    return saved === "light" || saved === "dark" ? saved : "system";
  }
  function setThemeChoice(choice) {
    if (choice === "system") {
      const dark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
      try { localStorage.removeItem("cctk_theme"); } catch (e) { /* ignore */ }
      updateThemeIcon();
    } else if (window.CCTK && window.CCTK.theme) {
      window.CCTK.theme.setTheme(choice);
    }
  }
  function updateThemeIcon() {
    const btn = $("[data-cctk-theme-toggle]");
    if (!btn) return;
    btn.innerHTML = icon(currentTheme() === "dark" ? "sun" : "moon");
  }

  /* ==========================================================================
     IMPORT
     ========================================================================== */
  const ACCEPTED = ["csv", "tsv", "txt", "xlsx", "xls"];

  async function openFile(file) {
    if (!file) return;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!ACCEPTED.includes(ext) || file.name.indexOf(".") === -1) {
      toast(`"${file.name}" isn't a file type Friendly Gorilla can read. Please choose a Gorilla CSV or Excel (.xlsx) export.`, "error");
      return;
    }
    if (file.size === 0) {
      toast(`"${file.name}" is empty.`, "error");
      return;
    }
    if (state.data && state.history.length > state.baseHistory &&
        !confirm("Open a new file? Your changes to the current file will be lost (nothing is saved).")) {
      return;
    }

    const extraWarnings = [];
    let aoa;
    try {
      if (ext === "xlsx" || ext === "xls") {
        const res = await readExcel(file);
        aoa = res.aoa;
        if (res.sheetCount > 1) {
          extraWarnings.push({ id: "sheets", level: "info",
            html: `<p>This workbook has ${res.sheetCount} sheets. Only the first sheet (<strong>${esc(res.sheetName)}</strong>) was loaded.</p>` });
        }
      } else {
        const res = await readCsv(file);
        aoa = res.data;
        const serious = (res.errors || []).filter(e => e.type === "Quotes" || e.type === "Delimiter");
        if (serious.length) {
          extraWarnings.push({ id: "parse", level: "warn",
            html: `<p>Some rows could not be read cleanly (${plural(serious.length, "problem")}, first at row ${(serious[0].row ?? 0) + 2}). Check the preview carefully.</p>` });
        }
      }
    } catch (err) {
      console.error(err);
      toast(`Sorry — "${file.name}" couldn't be read. It may be damaged or not a real ${ext.toUpperCase()} file.`, "error");
      return;
    }

    try {
      ingest(aoa, file, extraWarnings);
    } catch (err) {
      console.error(err);
      toast(err.userMessage || `Sorry — "${file.name}" couldn't be opened.`, "error");
    }
  }

  function readCsv(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        skipEmptyLines: false,
        complete: resolve,
        error: reject
      });
    });
  }

  async function readExcel(file) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) throw new Error("No sheets");
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
      header: 1, raw: false, rawNumbers: true, defval: "", blankrows: true
    });
    return { aoa, sheetName, sheetCount: wb.SheetNames.length };
  }

  function userError(msg) {
    const e = new Error(msg);
    e.userMessage = msg;
    return e;
  }

  function ingest(aoa, file, extraWarnings) {
    if (!Array.isArray(aoa) || aoa.length === 0) throw userError(`"${file.name}" appears to be empty.`);

    // A trailing newline gives one empty artefact row — not a real blank row
    while (aoa.length > 1) {
      const last = aoa[aoa.length - 1];
      if (!last || last.length === 0 || (last.length === 1 && isBlank(last[0]))) aoa.pop();
      else break;
    }

    const header = (aoa[0] || []).map(v => String(v ?? "").replace(/^﻿/, "").trim());
    if (header.every(h => h === "")) throw userError(`"${file.name}" has no column headings in its first row, so it can't be a Gorilla export.`);

    const width = aoa.reduce((m, r) => Math.max(m, (r || []).length), header.length);
    const cols = [];
    for (let i = 0; i < width; i++) {
      cols.push({ key: "c" + i, name: header[i] || `Unnamed column ${i + 1}` });
    }
    const rows = aoa.slice(1).map(r => {
      const out = new Array(width);
      for (let i = 0; i < width; i++) {
        const v = r ? r[i] : "";
        out[i] = v === null || v === undefined ? "" : String(v);
      }
      return out;
    });
    if (rows.length === 0) throw userError(`"${file.name}" has column headings but no data rows.`);

    const base = file.name.replace(/\.[^.]+$/, "");
    state.fileName = file.name;
    state.fileBase = base;
    state.original = { cols, rows };
    state.data = state.original;
    state.log = [];
    state.history = [];
    state.baseHistory = 0;
    state.dismissed = new Set();
    state.renameDraft = new Map();
    state.renameReview = null;
    state.scoreDraft = null;
    state.scoreQueue = [];
    state.exportDraft = null;
    state.nextNewKey = 1;

    const idCol = cols.find(c => norm(c.name) === ID_NAME);
    state.idKey = idCol ? idCol.key : null;
    state.dataType = detectDataType(cols, rows, file.name);

    // Import-time warnings
    const warnings = extraWarnings.slice();
    const names = cols.map(c => norm(c.name));
    const removeSet = new Set(CONFIG.defaultRemove.map(norm));
    const looksGorilla = idCol || names.some(n => removeSet.has(n)) || names.some(n => /quantised$/.test(n));
    if (!looksGorilla) {
      warnings.push({ id: "shape", level: "warn",
        html: "<p><strong>This doesn't look like a Gorilla export.</strong> Friendly Gorilla will still try to help, but features that rely on Gorilla's column names (Default Group Remove, Rating Scales) may find nothing to do.</p>" });
    }
    const seen = new Map();
    names.forEach(n => seen.set(n, (seen.get(n) || 0) + 1));
    const dupes = cols.filter((c, i) => seen.get(names[i]) > 1).map(c => c.name);
    if (dupes.length) {
      warnings.push({ id: "dupes", level: "warn",
        html: `<p>Some column names appear more than once: ${esc(quoteList([...new Set(dupes)]))}. Use <strong>Rename</strong> to make them unique before exporting.</p>` });
    }
    state.importWarnings = warnings;

    // Remove Rows default: strip END OF FILE and blank rows straight away (undoable, logged)
    const found = findRemovableRows(state.data);
    const auto = [...found.eof, ...found.blank, ...found.emptyData];
    if (auto.length) {
      applyRemoveRows(new Set(auto), found, true);
      state.baseHistory = state.history.length;
      toast(`Opened ${file.name}. ${removedRowsSentence(found.eof.length, found.blank.length + found.emptyData.length)} automatically.`);
    } else {
      renderAll();
      toast(`Opened ${file.name}`);
    }
  }

  function detectDataType(cols, rows, fileName) {
    const names = cols.map(c => norm(c.name));
    // 1) Gorilla's Tree Node Key / Task Name values, e.g. "questionnaire-ab12" or "task-cd34"
    for (const colName of ["tree node key", "task name"]) {
      const i = names.indexOf(colName);
      if (i === -1) continue;
      for (let r = 0; r < Math.min(rows.length, 50); r++) {
        const v = norm(rows[r][i]);
        if (v.startsWith("questionnaire")) return { label: "Questionnaire", source: `the '${cols[i].name}' column` };
        if (v.startsWith("task")) return { label: "Task", source: `the '${cols[i].name}' column` };
      }
    }
    // 2) File name — Gorilla names exports e.g. data_exp_123-v4_questionnaire-ab12.csv
    const fn = fileName.toLowerCase();
    if (/questionnaire/.test(fn)) return { label: "Questionnaire", source: "the file name" };
    if (/task/.test(fn)) return { label: "Task", source: "the file name" };
    // 3) Column signatures
    const taskCols = ["reaction time", "response type", "screen name", "trial number", "zone name", "zone type", "spreadsheet row", "display"];
    const qCols = names.filter(n => /quantised$/.test(n) || n === "question key" || n === "object name").length;
    const tCols = names.filter(n => taskCols.includes(n)).length;
    if (tCols >= 2 && tCols >= qCols) return { label: "Task", source: "its column names" };
    if (qCols > 0) return { label: "Questionnaire", source: "its column names" };
    return { label: "Unknown", source: "" };
  }

  /* ---------- Derived info ---------- */
  function participantInfo(data = state.data) {
    const i = state.idKey ? colIndex(state.idKey, data) : -1;
    if (i === -1) return null;
    const counts = new Map();
    let missing = 0;
    for (const r of data.rows) {
      const v = String(r[i]).trim();
      if (!v) { missing++; continue; }
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    let maxRows = 0, multi = 0;
    counts.forEach(n => { if (n > maxRows) maxRows = n; if (n > 1) multi++; });
    return { unique: counts.size, maxRows, multi, missing };
  }

  const statsCache = new WeakMap();
  function colStats(data = state.data) {
    if (statsCache.has(data)) return statsCache.get(data);
    const stats = data.cols.map(() => ({ filled: 0, numeric: 0, nonNumeric: 0, min: Infinity, max: -Infinity, textLen: 0 }));
    for (const r of data.rows) {
      for (let j = 0; j < stats.length; j++) {
        const v = r[j];
        if (isBlank(v)) continue;
        const s = stats[j];
        s.filled++;
        const n = toNum(v);
        if (Number.isFinite(n)) {
          s.numeric++;
          if (n < s.min) s.min = n;
          if (n > s.max) s.max = n;
        } else {
          s.nonNumeric++;
          s.textLen += String(v).trim().length;
        }
      }
    }
    statsCache.set(data, stats);
    return stats;
  }

  /* ==========================================================================
     OPERATIONS (all go through commit so they can be undone)
     ========================================================================== */
  function commit(newData, op, lines) {
    state.history.push({ data: state.data, log: state.log });
    state.data = newData;
    state.log = state.log.concat([{ op, lines }]);
    renderAll();
  }

  function undo() {
    if (!state.history.length) return;
    const prev = state.history.pop();
    const undone = state.log[state.log.length - 1];
    state.data = prev.data;
    state.log = prev.log;
    if (state.history.length < state.baseHistory) state.baseHistory = state.history.length;
    renderAll();
    toast(undone ? `Undid: ${undone.op}` : "Undone");
  }

  function resetToOriginal() {
    if (!state.original || state.data === state.original) return;
    if (!confirm("Reset to the file exactly as it was opened? You can still Undo this.")) return;
    state.history.push({ data: state.data, log: state.log });
    state.data = state.original;
    state.log = [];
    renderAll();
    toast("Reset to the original file");
  }

  function removeColumnsData(keys) {
    const keep = [];
    state.data.cols.forEach((c, i) => { if (!keys.has(c.key)) keep.push(i); });
    return {
      cols: keep.map(i => state.data.cols[i]),
      rows: state.data.rows.map(r => keep.map(i => r[i]))
    };
  }

  function applyRemoveColumns(keys, op, sentence) {
    if (!keys.size) return;
    const names = state.data.cols.filter(c => keys.has(c.key)).map(c => c.name);
    commit(removeColumnsData(keys), op, [sentence || `Removed the following columns: ${names.join(", ")} (${plural(names.length, "column")}).`]);
    toast(`Removed ${plural(names.length, "column")}`);
  }

  function findRemovableRows(data) {
    const removeSet = new Set(CONFIG.defaultRemove.map(norm));
    let dataIdx = [];
    data.cols.forEach((c, i) => { if (!removeSet.has(norm(c.name))) dataIdx.push(i); });
    const housekeepingOnly = dataIdx.length === 0;
    const eof = [], blank = [], emptyData = [];
    data.rows.forEach((r, i) => {
      if (r.some(v => EOF_RE.test(v))) eof.push(i);
      else if (r.every(isBlank)) blank.push(i);
      else if (!housekeepingOnly && dataIdx.every(j => isBlank(r[j]))) emptyData.push(i);
    });
    return { eof, blank, emptyData };
  }

  function removedRowsSentence(eofN, blankN) {
    const parts = [];
    if (eofN) parts.push(plural(eofN, "end-of-file row"));
    if (blankN) parts.push(plural(blankN, "blank row"));
    return "Removed " + parts.join(" and ");
  }

  function applyRemoveRows(indexSet, found, isAuto) {
    const rows = state.data.rows.filter((r, i) => !indexSet.has(i));
    const eofN = found.eof.filter(i => indexSet.has(i)).length;
    const blankN = found.blank.filter(i => indexSet.has(i)).length;
    const emptyN = found.emptyData.filter(i => indexSet.has(i)).length;
    let s = removedRowsSentence(eofN, blankN + emptyN);
    if (emptyN) {
      s += emptyN === blankN + emptyN
        ? " (rows with no data outside Gorilla's housekeeping columns)"
        : ` (${emptyN} of these had no data outside Gorilla's housekeeping columns)`;
    }
    s += ".";
    commit({ cols: state.data.cols, rows }, isAuto ? "Remove rows (automatic on opening)" : "Remove rows", [s]);
  }

  /* ---------- SPSS-safe names ---------- */
  function spssProblems(name) {
    const p = [];
    if (!/^[A-Za-z]/.test(name)) p.push("doesn't start with a letter");
    if (name.length > 64) p.push("is longer than 64 characters");
    if (/\s/.test(name)) p.push("contains spaces");
    if (/[^A-Za-z0-9_.\s]/.test(name)) p.push("contains characters SPSS doesn't allow");
    if (/[._]$/.test(name)) p.push("ends with a full stop or underscore");
    if (CONFIG.reserved.has(name.toUpperCase())) p.push("is a reserved SPSS keyword");
    return p;
  }
  function trimName(s, len) {
    return s.slice(0, len).replace(/[_.]+$/, "");
  }
  function spssSuggest(name, taken) {
    let s = String(name).normalize("NFKD").replace(/[̀-ͯ]/g, "");
    s = s.trim().replace(/\s+/g, "_").replace(/[^A-Za-z0-9_.]/g, "_").replace(/_+/g, "_").replace(/^[_.]+|[_.]+$/g, "");
    if (!s) s = "var";
    if (!/^[A-Za-z]/.test(s)) s = "v_" + s;
    if (CONFIG.reserved.has(s.toUpperCase())) s += "_var";
    s = trimName(s, 64);
    const base = s;
    let n = 2;
    while (taken && taken.has(s.toLowerCase())) {
      const suffix = "_" + n++;
      s = trimName(base, 64 - suffix.length) + suffix;
    }
    return s;
  }

  /* ---------- Rating scale pairs ---------- */
  function findRatingPairs(data = state.data) {
    const byName = new Map(data.cols.map(c => [norm(c.name), c]));
    const pairs = [];
    const used = new Set();
    for (const c of data.cols) {
      const n = norm(c.name);
      let base = null, candidates = [];
      let m = n.match(/^(.*?)[\s_-]*quantised$/);
      if (m && m[1]) {
        base = m[1].trim();
        candidates = [base + " response", base + "-response", base + "_response", base];
      }
      if (!base) continue;
      const resp = candidates.map(k => byName.get(k)).find(r => r && r.key !== c.key && !used.has(r.key));
      if (!resp) continue;
      used.add(resp.key);
      used.add(c.key);
      const label = c.name.replace(/[\s_-]*quantised$/i, "").trim() || c.name;
      pairs.push({ label, qKey: c.key, rKey: resp.key, qName: c.name, rName: resp.name });
    }
    return pairs;
  }

  /* ==========================================================================
     RENDERING
     ========================================================================== */
  function renderAll() {
    const has = !!state.data;
    $("#emptyState").hidden = has;
    $("#tableWrap").hidden = !has;
    $("#importPanel").hidden = !has;
    $$("[data-needs-data]").forEach(b => { b.disabled = !has; });
    $("#btnUndo").disabled = !has || state.history.length === 0;
    $("#btnReset").disabled = !has || state.data === state.original;
    const n = state.log.reduce((a, e) => a + e.lines.length, 0);
    $("#logCount").hidden = n === 0;
    $("#logCount").textContent = n;
    if (!has) return;
    renderImportPanel();
    renderTable();
    renderTool();
  }

  function renderImportPanel() {
    const d = state.data;
    $("#fileNameBtn").textContent = state.fileBase;
    const info = participantInfo();
    const pEl = $("#statParticipants");
    pEl.textContent = info ? info.unique.toLocaleString() : "—";
    pEl.title = info ? "Distinct values in 'Participant Private ID'" : "No 'Participant Private ID' column found";
    const tEl = $("#statType");
    tEl.textContent = state.dataType.label;
    tEl.title = state.dataType.source ? `Detected from ${state.dataType.source}` : "Couldn't tell from the file";
    $("#statRows").textContent = d.rows.length.toLocaleString();
    $("#statCols").textContent = d.cols.length.toLocaleString();

    const warnings = state.importWarnings.slice();
    if (!info) {
      warnings.push({ id: "noid", level: "warn",
        html: "<p><strong>No 'Participant Private ID' column found.</strong> Participant counts and the long-format check are unavailable, and the Word export will ask you to choose an ID column.</p>" });
    } else if (info.maxRows > 1) {
      warnings.push({ id: "long", level: "warn",
        html: `<p><strong>This looks like long-format data</strong> — ${plural(info.multi, "participant")} ${info.multi === 1 ? "has" : "have"} more than one row (up to ${info.maxRows} each).</p>
               <p>Friendly Gorilla V1 can clean this file, but it doesn't yet combine rows into one per participant (e.g. mean reaction time per condition). That's coming in a later version — for now, check with your supervisor before analysing it as-is.</p>` });
    }
    if (d.rows.length > CONFIG.defaults.largeFileRowWarning) {
      warnings.push({ id: "large", level: "info",
        html: `<p>This is a large file (${d.rows.length.toLocaleString()} rows). The preview shows the first ${CONFIG.defaults.previewRowCap.toLocaleString()} rows; exports always include every row. Some actions may take a moment.</p>` });
    }
    const box = $("#warnings");
    box.innerHTML = warnings.filter(w => !state.dismissed.has(w.id)).map(w =>
      notice(w.level, w.html, `<button type="button" class="fg-x" data-dismiss="${esc(w.id)}" aria-label="Dismiss">${icon("x")}</button>`)
    ).join("");
  }

  function renderTable() {
    const { cols, rows } = state.data;
    const cap = CONFIG.defaults.previewRowCap;
    const shown = Math.min(rows.length, cap);
    const idI = idIndex();
    const note = $("#previewNote");
    if (rows.length > cap) {
      note.hidden = false;
      note.textContent = `Previewing the first ${cap.toLocaleString()} of ${rows.length.toLocaleString()} rows. Exports include all rows.`;
    } else {
      note.hidden = true;
    }

    const out = ['<table class="fg-table"><thead><tr><th class="fg-rownum">#</th>'];
    cols.forEach((c, j) => {
      const cls = (j === idI ? "is-id" : "") + (c.isNew ? " is-new" : "");
      const tag = j === idI ? '<span class="fg-th-tag">ID</span>' : c.isNew ? '<span class="fg-th-tag">NEW</span>' : "";
      out.push(`<th data-c="${j}" class="${cls}" title="${esc(c.name)}">${tag}${esc(c.name)}</th>`);
    });
    out.push("</tr></thead><tbody>");
    for (let i = 0; i < shown; i++) {
      const r = rows[i];
      out.push(`<tr><td class="fg-rownum">${i + 1}</td>`);
      for (let j = 0; j < cols.length; j++) {
        const v = r[j];
        const cls = (j === idI ? "is-id" : "") + (isBlank(v) ? " is-empty" : "");
        const long = v.length > 60;
        const text = v.length > 140 ? v.slice(0, 140) + "…" : v;
        out.push(`<td data-c="${j}"${cls ? ` class="${cls}"` : ""}${long ? ` title="${esc(v.slice(0, 1200))}"` : ""}>${esc(text)}</td>`);
      }
      out.push("</tr>");
    }
    out.push("</tbody></table>");
    $("#tableScroll").innerHTML = out.join("");
    applyHighlight();
  }

  /* Column highlighting in the preview (e.g. columns ticked for removal) */
  let highlight = { keys: new Set(), kind: "remove" };
  const hlStyle = document.createElement("style");
  document.head.appendChild(hlStyle);
  function setHighlight(keys, kind) {
    highlight = { keys: new Set(keys), kind: kind || "remove" };
    applyHighlight();
  }
  function applyHighlight() {
    if (!state.data || !highlight.keys.size) { hlStyle.textContent = ""; return; }
    const sel = [];
    state.data.cols.forEach((c, j) => { if (highlight.keys.has(c.key)) sel.push(`.fg-table [data-c="${j}"]`); });
    const tint = highlight.kind === "select" ? "var(--fg-select-tint)" : "var(--fg-remove-tint)";
    hlStyle.textContent = sel.length ? `${sel.join(",")}{background:${tint} !important;}` : "";
  }

  /* ==========================================================================
     SIDEBAR TOOLS
     ========================================================================== */
  const TOOLS = {
    removeCols: { title: "Remove Columns", icon: "columns", render: renderRemoveCols },
    removeRows: { title: "Remove Rows", icon: "rows", render: renderRemoveRows },
    rename: { title: "Rename Columns", icon: "rename", render: renderRename },
    rating: { title: "Rating Scales", icon: "sliders", render: renderRating },
    score: { title: "Create Score", icon: "sigma", render: renderScore },
    export: { title: "Export", icon: "download", render: renderExport },
    log: { title: "Change Log", icon: "list", render: renderLog },
    settings: { title: "Settings", icon: "settings", render: renderSettings }
  };

  function openTool(name) {
    if (state.tool === name) { closeTool(); return; }
    state.tool = name;
    if (name === "rename") state.renameReview = null;
    renderTool();
    const body = $("#sidebarBody");
    body.scrollTop = 0;
  }
  function closeTool() {
    state.tool = null;
    setHighlight([]);
    renderTool();
  }
  function renderTool() {
    const sb = $("#sidebar");
    $$("[data-tool]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.tool === state.tool)));
    const needsData = state.tool && state.tool !== "settings";
    if (!state.tool || (needsData && !state.data)) {
      sb.hidden = true;
      $("#workspace").classList.remove("has-sidebar");
      return;
    }
    const t = TOOLS[state.tool];
    sb.hidden = false;
    $("#workspace").classList.add("has-sidebar");
    $("#sidebarTitle").innerHTML = icon(t.icon) + esc(t.title);
    setHighlight([]);
    const body = $("#sidebarBody");
    const scroll = body.scrollTop;
    t.render(body);
    body.scrollTop = scroll;
  }

  /* Reusable filterable checklist */
  function checklistHtml(items, opts = {}) {
    if (!items.length) return `<div class="fg-list"><div class="fg-list__empty">${esc(opts.empty || "No columns")}</div></div>`;
    return `<div class="fg-list${opts.tall ? " fg-list--tall" : ""}" ${opts.id ? `id="${opts.id}"` : ""}>` + items.map(it => `
      <label class="fg-list__item" data-name="${esc(norm(it.name))}">
        <input type="checkbox" value="${esc(it.key)}" ${it.checked ? "checked" : ""} ${it.disabled ? "disabled" : ""}/>
        <span class="fg-list__name" title="${esc(it.name)}">${esc(it.name)}</span>
        ${it.meta ? `<span class="fg-list__meta">${it.meta}</span>` : ""}
        ${it.extra || ""}
      </label>`).join("") + "</div>";
  }
  function bindFilter(input, list) {
    if (!input || !list) return;
    input.addEventListener("input", () => {
      const q = norm(input.value);
      $$(".fg-list__item", list).forEach(it => it.classList.toggle("is-hidden", q !== "" && !it.dataset.name.includes(q)));
    });
  }
  function checkedKeys(list) {
    return list ? $$(":scope > .fg-list__item > input[type=checkbox]:checked", list).map(i => i.value) : [];
  }

  /* ---------- Remove Columns ---------- */
  function renderRemoveCols(body) {
    const d = state.data;
    const stats = colStats();
    const removeSet = new Set(CONFIG.defaultRemove.map(norm));
    const present = d.cols.filter(c => removeSet.has(norm(c.name)) && c.key !== state.idKey);
    const n = d.rows.length;

    body.innerHTML = `
      <div class="fg-section">
        <h3>Default Group Remove</h3>
        <p>Strips Gorilla's standard housekeeping columns in one click — timestamps, experiment and device details, and
          <strong>Participant Public ID</strong> (for anonymity). <strong>Participant Private ID</strong> is kept.</p>
        ${present.length ? `
          <button type="button" class="cctk-btn cctk-btn--primary cctk-btn--block" id="rcDefault">${icon("check")} Remove ${plural(present.length, "standard column")}</button>
          <details><summary class="fg-help">Show which columns</summary><p class="fg-help">${esc(present.map(c => c.name).join(", "))}</p></details>`
        : notice("ok", "<p>No standard Gorilla housekeeping columns left to remove.</p>")}
      </div>
      <div class="fg-section">
        <h3>Custom Remove</h3>
        <p>Tick the columns you want to drop. Ticked columns turn red in the preview.</p>
        <input type="search" class="fg-input" id="rcFilter" placeholder="Filter columns…" />
        <div class="fg-btnrow">
          <button type="button" class="cctk-btn cctk-btn--ghost cctk-btn--sm" id="rcEmpty">Tick empty columns</button>
          <button type="button" class="cctk-btn cctk-btn--ghost cctk-btn--sm" id="rcShown">Tick shown</button>
          <button type="button" class="cctk-btn cctk-btn--ghost cctk-btn--sm" id="rcNone">Untick all</button>
        </div>
        ${checklistHtml(d.cols.map((c, j) => ({
          key: c.key, name: c.name,
          meta: c.key === state.idKey ? '<span class="fg-pill fg-pill--accent">ID</span>' :
            (stats[j].filled === 0 ? '<span class="fg-pill">empty</span>' : `${stats[j].filled}/${n}`)
        })), { id: "rcList", tall: true })}
        <button type="button" class="cctk-btn cctk-btn--primary cctk-btn--block" id="rcApply" disabled>${icon("trash")} Remove ticked columns</button>
      </div>`;

    const list = $("#rcList");
    const applyBtn = $("#rcApply");
    const sync = () => {
      const keys = checkedKeys(list);
      applyBtn.disabled = keys.length === 0;
      applyBtn.innerHTML = icon("trash") + (keys.length ? ` Remove ${plural(keys.length, "ticked column")}` : " Remove ticked columns");
      setHighlight(keys, "remove");
    };
    list && list.addEventListener("change", sync);
    bindFilter($("#rcFilter"), list);

    const defBtn = $("#rcDefault");
    if (defBtn) {
      defBtn.addEventListener("mouseenter", () => setHighlight(present.map(c => c.key)));
      defBtn.addEventListener("mouseleave", sync);
      defBtn.addEventListener("click", () => {
        const names = present.map(c => c.name);
        applyRemoveColumns(new Set(present.map(c => c.key)), "Default Group Remove",
          `Removed the following standard Gorilla columns: ${names.join(", ")} (${plural(names.length, "column")}).`);
      });
    }
    $("#rcEmpty").addEventListener("click", () => {
      d.cols.forEach((c, j) => {
        const cb = $(`input[value="${CSS.escape(c.key)}"]`, list);
        if (cb && stats[j].filled === 0 && c.key !== state.idKey) cb.checked = true;
      });
      sync();
    });
    $("#rcShown").addEventListener("click", () => {
      $$(".fg-list__item:not(.is-hidden) input", list).forEach(cb => { cb.checked = true; });
      sync();
    });
    $("#rcNone").addEventListener("click", () => {
      $$("input", list).forEach(cb => { cb.checked = false; });
      sync();
    });
    applyBtn.addEventListener("click", () => {
      const keys = new Set(checkedKeys(list));
      if (state.idKey && keys.has(state.idKey) &&
          !confirm("You've ticked 'Participant Private ID'. Without it you can't match rows to participants. Remove it anyway?")) return;
      if (keys.size === d.cols.length) { toast("You can't remove every column.", "error"); return; }
      applyRemoveColumns(keys, "Remove columns");
    });
  }

  /* ---------- Remove Rows ---------- */
  function renderRemoveRows(body) {
    const found = findRemovableRows(state.data);
    const autoEntry = state.log.find(e => e.op.startsWith("Remove rows (automatic"));
    const total = found.eof.length + found.blank.length + found.emptyData.length;
    body.innerHTML = `
      <div class="fg-section">
        <p>Gorilla files can end with an <strong>END OF FILE</strong> marker row, and sometimes contain blank rows. These are
          removed automatically when you open a file.</p>
        ${autoEntry ? notice("info", `<p>On opening: ${esc(autoEntry.lines[0])} Use <strong>Undo</strong> to bring them back.</p>`) : ""}
      </div>
      <div class="fg-section">
        <h3>Rows that can be removed now</h3>
        ${total === 0 ? notice("ok", "<p>No end-of-file or blank rows found.</p>") : `
          <label class="fg-list__item"><input type="checkbox" id="rrEof" ${found.eof.length ? "checked" : "disabled"}/>
            <span class="fg-list__name">End-of-file rows</span><span class="fg-list__meta">${found.eof.length}</span></label>
          <label class="fg-list__item"><input type="checkbox" id="rrBlank" ${found.blank.length ? "checked" : "disabled"}/>
            <span class="fg-list__name">Completely blank rows</span><span class="fg-list__meta">${found.blank.length}</span></label>
          <label class="fg-list__item"><input type="checkbox" id="rrEmpty" ${found.emptyData.length ? "checked" : "disabled"}/>
            <span class="fg-list__name" title="Rows with nothing in any column except Gorilla's housekeeping columns">Rows with no data (only housekeeping)</span>
            <span class="fg-list__meta">${found.emptyData.length}</span></label>
          <button type="button" class="cctk-btn cctk-btn--primary cctk-btn--block" id="rrApply">${icon("trash")} Remove selected rows</button>`}
      </div>`;
    const btn = $("#rrApply");
    if (btn) btn.addEventListener("click", () => {
      const idx = new Set([
        ...($("#rrEof").checked ? found.eof : []),
        ...($("#rrBlank").checked ? found.blank : []),
        ...($("#rrEmpty").checked ? found.emptyData : [])
      ]);
      if (!idx.size) { toast("Nothing selected"); return; }
      applyRemoveRows(idx, found, false);
      toast(`Removed ${plural(idx.size, "row")}`);
    });
  }

  /* ---------- Rename ---------- */
  function renderRename(body) {
    if (state.renameReview) { renderRenameReview(body); return; }
    const d = state.data;
    const draft = state.renameDraft;
    body.innerHTML = `
      <div class="fg-section">
        <p>Give columns short, meaningful names (e.g. <code>anxiety_1</code>). Press <strong>OK</strong> when you're done.</p>
        ${isSpss() ? notice("info", "<p><strong>SPSS mode:</strong> when you press OK, names SPSS won't accept are flagged with a suggested fix you can accept or change. (Switch to JASP in Settings to turn this off.)</p>") : ""}
        <div class="fg-btnrow">
          ${isSpss() ? `<button type="button" class="cctk-btn cctk-btn--sm" id="rnSuggest">Suggest SPSS-safe names</button>` : ""}
          <button type="button" class="cctk-btn cctk-btn--ghost cctk-btn--sm" id="rnClear">Undo my edits</button>
        </div>
        <input type="search" class="fg-input" id="rnFilter" placeholder="Filter columns…" />
      </div>
      <div class="fg-renames" id="rnList">
        ${d.cols.map(c => {
          const v = draft.has(c.key) ? draft.get(c.key) : c.name;
          return `<label class="fg-rename fg-list__item" style="cursor:default" data-name="${esc(norm(c.name))}">
            <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
              <small title="${esc(c.name)}">${c.key === state.idKey ? "ID · " : ""}${esc(c.name)}</small>
              <input type="text" class="fg-input${v !== c.name ? " is-changed" : ""}" data-key="${esc(c.key)}" value="${esc(v)}" spellcheck="false" />
            </span></label>`;
        }).join("")}
      </div>
      <div class="fg-section" style="position:sticky;bottom:-16px;background:var(--surface);padding-bottom:8px">
        <button type="button" class="cctk-btn cctk-btn--primary cctk-btn--block" id="rnOk">${icon("check")} OK — apply names</button>
      </div>`;

    const list = $("#rnList");
    list.addEventListener("input", e => {
      const inp = e.target.closest("input[data-key]");
      if (!inp) return;
      const col = colByKey(inp.dataset.key);
      draft.set(inp.dataset.key, inp.value);
      inp.classList.toggle("is-changed", inp.value !== col.name);
      inp.classList.remove("is-invalid");
    });
    bindFilter($("#rnFilter"), list);
    const sug = $("#rnSuggest");
    if (sug) sug.addEventListener("click", () => {
      const taken = new Set();
      d.cols.forEach(c => {
        const cur = draft.has(c.key) ? draft.get(c.key) : c.name;
        const next = spssProblems(cur).length || taken.has(cur.toLowerCase()) ? spssSuggest(cur, taken) : cur;
        taken.add(next.toLowerCase());
        draft.set(c.key, next);
      });
      renderTool();
      toast("Suggestions filled in — review them, then press OK");
    });
    $("#rnClear").addEventListener("click", () => { draft.clear(); renderTool(); });
    $("#rnOk").addEventListener("click", () => submitRenames(body));
  }

  function submitRenames(body) {
    const d = state.data;
    const draft = state.renameDraft;
    const finals = d.cols.map(c => ({ col: c, name: (draft.has(c.key) ? draft.get(c.key) : c.name).trim() }));
    const empty = finals.filter(f => !f.name);
    if (empty.length) {
      empty.forEach(f => { const i = $(`input[data-key="${CSS.escape(f.col.key)}"]`, body); if (i) i.classList.add("is-invalid"); });
      toast("Every column needs a name.", "error");
      return;
    }
    if (isSpss()) {
      const taken = new Set(finals.filter(f => !spssProblems(f.name).length).map(f => f.name.toLowerCase()));
      const issues = [];
      for (const f of finals) {
        const problems = spssProblems(f.name);
        if (!problems.length) continue;
        const suggestion = spssSuggest(f.name, taken);
        taken.add(suggestion.toLowerCase());
        issues.push({ key: f.col.key, typed: f.name, problems, suggestion });
      }
      if (issues.length) {
        state.renameReview = { finals: new Map(finals.map(f => [f.col.key, f.name])), issues };
        renderTool();
        $("#sidebarBody").scrollTop = 0;
        return;
      }
    }
    finishRenames(new Map(finals.map(f => [f.col.key, f.name])));
  }

  function renderRenameReview(body) {
    const rv = state.renameReview;
    body.innerHTML = `
      <div class="fg-section">
        ${notice("warn", `<p><strong>${plural(rv.issues.length, "name")} won't work in SPSS.</strong> We've suggested a safe version of each — edit any suggestion, or untick it to keep your own name.</p>`)}
      </div>
      <div class="fg-renames" id="rvList">
        ${rv.issues.map(it => `
          <div class="fg-list__item" style="cursor:default;align-items:flex-start">
            <input type="checkbox" checked data-use="${esc(it.key)}" style="margin-top:4px" aria-label="Use suggestion" />
            <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
              <small title="${esc(it.typed)}">${esc(it.typed)}</small>
              <span class="fg-rename__err">${esc(it.problems.join("; "))}</span>
              <input type="text" class="fg-input is-changed" data-key="${esc(it.key)}" value="${esc(it.suggestion)}" spellcheck="false" />
            </span>
          </div>`).join("")}
      </div>
      <div class="fg-section">
        <button type="button" class="cctk-btn cctk-btn--primary cctk-btn--block" id="rvApply">${icon("check")} Apply names</button>
        <button type="button" class="cctk-btn cctk-btn--ghost cctk-btn--block" id="rvBack">Back to editing</button>
      </div>`;
    $("#rvBack").addEventListener("click", () => {
      rv.finals.forEach((v, k) => state.renameDraft.set(k, v));
      state.renameReview = null;
      renderTool();
    });
    $("#rvApply").addEventListener("click", () => {
      const finals = new Map(rv.finals);
      for (const it of rv.issues) {
        const use = $(`input[data-use="${CSS.escape(it.key)}"]`, body).checked;
        const val = $(`input[data-key="${CSS.escape(it.key)}"]`, body).value.trim();
        if (use) {
          if (!val) { toast("Suggested names can't be empty.", "error"); return; }
          finals.set(it.key, val);
        }
      }
      const kept = rv.issues.filter(it => !$(`input[data-use="${CSS.escape(it.key)}"]`, body).checked).length;
      if (finishRenames(finals) && kept) {
        toast(`${plural(kept, "name")} kept that SPSS may reject`, "error");
      }
    });
  }

  function finishRenames(finalByKey) {
    const d = state.data;
    const seen = new Map();
    for (const [, v] of finalByKey) seen.set(v.toLowerCase(), (seen.get(v.toLowerCase()) || 0) + 1);
    const dupes = [...seen].filter(([, n]) => n > 1).map(([k]) => k);
    if (dupes.length) {
      toast(`Two or more columns would be called ${quoteList(dupes.slice(0, 3))}. Column names must be unique.`, "error");
      if (state.renameReview) {
        state.renameReview.finals.forEach((v, k) => state.renameDraft.set(k, v));
        finalByKey.forEach((v, k) => state.renameDraft.set(k, v));
        state.renameReview = null;
        renderTool();
      }
      return false;
    }
    const changed = d.cols.filter(c => finalByKey.get(c.key) !== c.name);
    state.renameReview = null;
    state.renameDraft = new Map();
    if (!changed.length) { toast("No names changed"); renderTool(); return true; }
    const lines = changed.map(c => `Renamed '${c.name}' to '${finalByKey.get(c.key)}'.`);
    commit({ cols: d.cols.map(c => ({ ...c, name: finalByKey.get(c.key) })), rows: d.rows }, "Rename columns", lines);
    toast(`Renamed ${plural(changed.length, "column")}`);
    return true;
  }

  /* ---------- Rating Scale helper ---------- */
  function renderRating(body) {
    const pairs = findRatingPairs();
    if (!pairs.length) {
      body.innerHTML = `<div class="fg-section">
        <p>Gorilla exports each rating scale twice: a <strong>Response</strong> column (the text label, e.g. "Agree")
          and a <strong>Quantised</strong> column (the number, e.g. 4).</p>
        ${notice("ok", "<p>No paired Response / Quantised columns found in this file.</p>")}</div>`;
      return;
    }
    body.innerHTML = `
      <div class="fg-section">
        <p>Gorilla exports each rating scale twice: a <strong>Response</strong> column (the text label, e.g. "Agree")
          and a <strong>Quantised</strong> column (the number, e.g. 4). For statistics you almost always want
          <strong>Quantised</strong>.</p>
        <p>Found <strong>${plural(pairs.length, "pair")}</strong>. Untick any you want to leave alone.</p>
      </div>
      <div class="fg-list fg-list--tall" id="rtList">
        ${pairs.map(p => `<label class="fg-list__item" data-name="${esc(norm(p.label))}">
          <input type="checkbox" value="${esc(p.qKey)}" checked />
          <span class="fg-list__name" title="${esc(p.rName)}  +  ${esc(p.qName)}">${esc(p.label)}</span></label>`).join("")}
      </div>
      <div class="fg-section">
        <button type="button" class="cctk-btn cctk-btn--primary cctk-btn--block" id="rtQ">${icon("chart")} Keep Quantised (numbers)</button>
        <button type="button" class="cctk-btn cctk-btn--block" id="rtR">${icon("message")} Keep Response (text)</button>
        <button type="button" class="cctk-btn cctk-btn--ghost cctk-btn--block" id="rtB">Keep both</button>
        <p class="fg-help">Hover a button to see which columns would be removed.</p>
      </div>`;
    const list = $("#rtList");
    const chosen = () => {
      const q = new Set(checkedKeys(list));
      return pairs.filter(p => q.has(p.qKey));
    };
    const hover = (btn, pick) => {
      btn.addEventListener("mouseenter", () => setHighlight(chosen().map(pick)));
      btn.addEventListener("mouseleave", () => setHighlight([]));
      btn.addEventListener("focus", () => setHighlight(chosen().map(pick)));
      btn.addEventListener("blur", () => setHighlight([]));
    };
    hover($("#rtQ"), p => p.rKey);
    hover($("#rtR"), p => p.qKey);
    $("#rtQ").addEventListener("click", () => {
      const sel = chosen();
      if (!sel.length) { toast("No pairs ticked"); return; }
      applyRemoveColumns(new Set(sel.map(p => p.rKey)), "Rating scales: keep Quantised",
        `Kept the numeric (Quantised) version of ${plural(sel.length, "rating scale item")} and removed the text (Response) columns: ${sel.map(p => p.rName).join(", ")}.`);
    });
    $("#rtR").addEventListener("click", () => {
      const sel = chosen();
      if (!sel.length) { toast("No pairs ticked"); return; }
      applyRemoveColumns(new Set(sel.map(p => p.qKey)), "Rating scales: keep Response",
        `Kept the text (Response) version of ${plural(sel.length, "rating scale item")} and removed the numeric (Quantised) columns: ${sel.map(p => p.qName).join(", ")}.`);
    });
    $("#rtB").addEventListener("click", () => { toast("Kept both — no changes made"); closeTool(); });
  }

  /* ---------- Create Score ---------- */
  function newScoreDraft() {
    return { name: "", items: [], reverse: new Set(), min: "", max: "", rangeTouched: false, method: "sum", missing: "blank" };
  }

  function detectRange(keys) {
    const stats = colStats();
    let min = Infinity, max = -Infinity;
    keys.forEach(k => {
      const j = colIndex(k);
      if (j === -1) return;
      if (stats[j].min < min) min = stats[j].min;
      if (stats[j].max > max) max = stats[j].max;
    });
    return Number.isFinite(min) ? { min, max } : null;
  }

  function scoreOutputNames(s) {
    return s.method === "both" ? [s.name + "_sum", s.name + "_mean"] : [s.name];
  }

  function renderScore(body) {
    const d = state.data;
    if (!state.scoreDraft) state.scoreDraft = newScoreDraft();
    const dr = state.scoreDraft;
    dr.items = dr.items.filter(k => colIndex(k) !== -1);
    const stats = colStats();
    const itemSet = new Set(dr.items);
    const hasGorillaScore = d.cols.some(c => /^score\s*:/i.test(c.name.trim()));

    const itemsHtml = checklistHtml(d.cols.map((c, j) => {
      const s = stats[j];
      const range = s.numeric ? (s.min === s.max ? fmtNum(s.min) : `${fmtNum(s.min)}–${fmtNum(s.max)}`) : "text";
      const sel = itemSet.has(c.key);
      return {
        key: c.key, name: c.name, checked: sel,
        meta: s.filled === 0 ? "empty" : range,
        extra: `<span class="fg-rev${sel ? "" : " is-disabled"}" title="Reverse-score this item"><input type="checkbox" data-rev="${esc(c.key)}" ${dr.reverse.has(c.key) ? "checked" : ""}/>R</span>`
      };
    }), { id: "scList", tall: false });

    body.innerHTML = `
      <div class="fg-section">
        ${notice("info", "<p><strong>Define each measure once.</strong> Set up a score, press <em>Add to list</em>, repeat for your other measures, then <em>Apply all</em>.</p>")}
        ${hasGorillaScore ? `<p class="fg-help">Your file already has Gorilla score columns (starting "Score:"). Create Score is for anything Gorilla didn't calculate — e.g. with reverse-scored items.</p>` : ""}
      </div>
      <div class="fg-section">
        <label class="fg-field"><span>1. Name of the new variable</span>
          <input type="text" class="fg-input" id="scName" placeholder="e.g. anxiety_total" value="${esc(dr.name)}" spellcheck="false" /></label>
        <span class="fg-rename__err" id="scNameErr"></span>
      </div>
      <div class="fg-section">
        <h3>2. Select the items &nbsp;·&nbsp; 3. tick <span class="fg-pill">R</span> for reverse-scored</h3>
        <p class="fg-help">The grey range shows the values actually found in each column.</p>
        <input type="search" class="fg-input" id="scFilter" placeholder="Filter columns… (try 'Quantised')" />
        <div class="fg-btnrow">
          <button type="button" class="cctk-btn cctk-btn--ghost cctk-btn--sm" id="scShown">Tick shown</button>
          <button type="button" class="cctk-btn cctk-btn--ghost cctk-btn--sm" id="scNone">Untick all</button>
        </div>
        ${itemsHtml}
        <p class="fg-help" id="scSummary"></p>
      </div>
      <div class="fg-section">
        <h3>4. Scale range</h3>
        <div class="fg-inline">
          <label class="fg-field"><span>Min</span><input type="number" class="fg-input" id="scMin" value="${esc(dr.min)}" step="any" /></label>
          <label class="fg-field"><span>Max</span><input type="number" class="fg-input" id="scMax" value="${esc(dr.max)}" step="any" /></label>
        </div>
        <p class="fg-help" id="scRangeNote"></p>
        <p class="fg-help">Reverse scoring uses (min + max) − value. Check this matches the questionnaire's full range: if nobody chose the extreme options, the auto-detected range will be too narrow.</p>
      </div>
      <div class="fg-section">
        <h3>5. Calculate</h3>
        <div class="fg-radio" id="scMethod">
          ${["sum", "mean", "both"].map(m => `<label><input type="radio" name="scMethod" value="${m}" ${dr.method === m ? "checked" : ""}/> ${m === "both" ? "Both" : m[0].toUpperCase() + m.slice(1)}</label>`).join("")}
        </div>
        <p class="fg-help" id="scOutNames"></p>
        <label class="fg-field"><span>If a participant skipped an item</span>
          <select class="fg-select" id="scMissing">
            <option value="blank" ${dr.missing === "blank" ? "selected" : ""}>Leave their score blank (recommended)</option>
            <option value="available" ${dr.missing === "available" ? "selected" : ""}>Use the items they answered (sum is prorated)</option>
          </select></label>
      </div>
      <div class="fg-section">
        <button type="button" class="cctk-btn cctk-btn--block" id="scAdd">${icon("plus")} 6. Add to list</button>
      </div>
      <div class="fg-section">
        <h3>Scores to create (${state.scoreQueue.length})</h3>
        <div class="fg-queue">
          ${state.scoreQueue.length ? state.scoreQueue.map((s, i) => `
            <div class="fg-queue__item"><div><strong>${esc(scoreOutputNames(s).join(" + "))}</strong>
              <span>${s.method === "both" ? "Sum and mean" : s.method === "sum" ? "Sum" : "Mean"} of ${plural(s.items.length, "item")}${s.reverse.length ? `, ${s.reverse.length} reversed` : ""}${s.min !== null ? `, scale ${fmtNum(s.min)}–${fmtNum(s.max)}` : ""}</span></div>
              <button type="button" class="fg-x" data-unqueue="${i}" aria-label="Remove from list">${icon("x")}</button></div>`).join("")
          : '<p class="fg-help">Nothing added yet.</p>'}
        </div>
        <button type="button" class="cctk-btn cctk-btn--primary cctk-btn--block" id="scApply" ${state.scoreQueue.length ? "" : "disabled"}>${icon("sigma")} Apply all</button>
      </div>`;

    const list = $("#scList");
    const refresh = () => {
      const sel = dr.items;
      $$("input[data-rev]", list).forEach(r => {
        const on = sel.includes(r.dataset.rev);
        r.closest(".fg-rev").classList.toggle("is-disabled", !on);
      });
      const auto = detectRange(sel);
      if (!dr.rangeTouched) {
        dr.min = auto ? fmtNum(auto.min) : "";
        dr.max = auto ? fmtNum(auto.max) : "";
        $("#scMin").value = dr.min;
        $("#scMax").value = dr.max;
      }
      const revN = sel.filter(k => dr.reverse.has(k)).length;
      $("#scSummary").textContent = sel.length ? `${plural(sel.length, "item")} selected${revN ? `, ${revN} reverse-scored` : ""}.` : "No items selected yet.";
      $("#scRangeNote").textContent = auto ? `Auto-detected from the data: ${fmtNum(auto.min)}–${fmtNum(auto.max)}${dr.rangeTouched ? " (you've overridden this)" : ""}.` : "";
      const nm = dr.name.trim() || "name";
      $("#scOutNames").textContent = "Creates: " + scoreOutputNames({ name: nm, method: dr.method }).join(" and ");
      setHighlight(sel, "select");
    };

    list && list.addEventListener("change", e => {
      const t = e.target;
      if (t.dataset.rev) {
        t.checked ? dr.reverse.add(t.dataset.rev) : dr.reverse.delete(t.dataset.rev);
      } else {
        const keys = new Set(checkedKeys(list));
        // keep original column order
        dr.items = d.cols.map(c => c.key).filter(k => keys.has(k));
        if (!t.checked) dr.reverse.delete(t.value);
        if (!t.checked) { const r = $(`input[data-rev="${CSS.escape(t.value)}"]`, list); if (r) r.checked = false; }
      }
      refresh();
    });
    // Clicking the "R" text must toggle only the reverse box, not the row's main checkbox (label activation)
    $$(".fg-rev", list).forEach(el => el.addEventListener("click", e => {
      if (e.target.tagName === "INPUT") return;
      e.preventDefault();
      const cb = $("input", el);
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    }));

    bindFilter($("#scFilter"), list);
    $("#scShown").addEventListener("click", () => {
      $$(".fg-list__item:not(.is-hidden) > input[type=checkbox]", list).forEach(cb => { cb.checked = true; });
      const keys = new Set($$(".fg-list__item > input[type=checkbox]:checked", list).map(i => i.value));
      dr.items = d.cols.map(c => c.key).filter(k => keys.has(k));
      refresh();
    });
    $("#scNone").addEventListener("click", () => {
      $$("input[type=checkbox]", list).forEach(cb => { cb.checked = false; });
      dr.items = [];
      dr.reverse.clear();
      refresh();
    });
    $("#scName").addEventListener("input", e => { dr.name = e.target.value; $("#scNameErr").textContent = ""; refresh(); });
    $("#scMin").addEventListener("input", e => { dr.min = e.target.value; dr.rangeTouched = true; refresh(); });
    $("#scMax").addEventListener("input", e => { dr.max = e.target.value; dr.rangeTouched = true; refresh(); });
    $$("input[name=scMethod]").forEach(r => r.addEventListener("change", e => { dr.method = e.target.value; refresh(); }));
    $("#scMissing").addEventListener("change", e => { dr.missing = e.target.value; });
    $("#scAdd").addEventListener("click", addScoreToQueue);
    $$("[data-unqueue]", body).forEach(b => b.addEventListener("click", () => {
      state.scoreQueue.splice(Number(b.dataset.unqueue), 1);
      renderTool();
    }));
    $("#scApply").addEventListener("click", applyScores);
    refresh();
  }

  function addScoreToQueue() {
    const dr = state.scoreDraft;
    const name = dr.name.trim();
    const errEl = $("#scNameErr");
    const fail = (msg, html) => { errEl.innerHTML = html || esc(msg); if (!html) toast(msg, "error"); };

    if (!name) return fail("Give the new variable a name.");
    const outNames = scoreOutputNames({ name, method: dr.method });
    const existing = new Set(state.data.cols.map(c => c.name.toLowerCase()));
    state.scoreQueue.forEach(s => scoreOutputNames(s).forEach(n => existing.add(n.toLowerCase())));
    const clash = outNames.find(n => existing.has(n.toLowerCase()));
    if (clash) return fail(`There's already a column called '${clash}'. Choose a different name.`);
    if (isSpss()) {
      const bad = outNames.find(n => spssProblems(n).length);
      if (bad) {
        const sug = spssSuggest(name, existing);
        errEl.innerHTML = `'${esc(bad)}' ${esc(spssProblems(bad).join("; "))}. <button type="button" class="fg-linkbtn" id="scUseSug">Use '${esc(sug)}'</button>`;
        $("#scUseSug").addEventListener("click", () => { dr.name = sug; $("#scName").value = sug; errEl.textContent = ""; });
        return;
      }
    }
    if (dr.items.length < 2) return fail("Select at least two items.");

    const reverse = dr.items.filter(k => dr.reverse.has(k));
    const minS = String(dr.min).trim(), maxS = String(dr.max).trim();
    let min = null, max = null;
    if (minS !== "" || maxS !== "" || reverse.length) {
      min = toNum(minS); max = toNum(maxS);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
        return fail(reverse.length ? "Reverse scoring needs a valid scale range (min lower than max)." : "The scale range isn't valid (min must be lower than max).");
      }
      const auto = detectRange(dr.items);
      if (auto && (auto.min < min || auto.max > max) &&
          !confirm(`Some selected items contain values outside ${fmtNum(min)}–${fmtNum(max)} (found ${fmtNum(auto.min)}–${fmtNum(auto.max)}). Add this score anyway?`)) return;
    }
    const stats = colStats();
    const textItems = dr.items.filter(k => { const s = stats[colIndex(k)]; return s.nonNumeric > 0; });
    if (textItems.length && !confirm(`${plural(textItems.length, "selected item")} contain${textItems.length === 1 ? "s" : ""} text rather than numbers (e.g. '${colByKey(textItems[0]).name}'). Text values will be treated as missing. Continue?`)) return;

    state.scoreQueue.push({
      name, method: dr.method, missing: dr.missing, min, max,
      items: dr.items.slice(),
      reverse
    });
    state.scoreDraft = newScoreDraft();
    renderTool();
    toast(`Added '${name}' to the list`);
  }

  function applyScores() {
    const d = state.data;
    const newCols = d.cols.slice();
    const newVals = d.rows.map(() => []);
    const lines = [];
    const skipped = [];

    for (const s of state.scoreQueue) {
      const idx = s.items.map(k => colIndex(k));
      if (idx.some(i => i === -1)) { skipped.push(s.name); continue; }
      const names = s.items.map(k => colByKey(k).name);
      const revSet = new Set(s.reverse);
      const rev = s.items.map(k => revSet.has(k));
      let blankN = 0, nonNumeric = 0, partial = 0;
      const sums = [], means = [];
      for (const r of d.rows) {
        let total = 0, n = 0;
        for (let t = 0; t < idx.length; t++) {
          const raw = r[idx[t]];
          let v = toNum(raw);
          if (!Number.isFinite(v)) { if (!isBlank(raw)) nonNumeric++; continue; }
          if (rev[t]) v = (s.min + s.max) - v;
          total += v; n++;
        }
        if (n === 0 || (n < idx.length && s.missing === "blank")) {
          sums.push(""); means.push(""); blankN++;
          continue;
        }
        if (n < idx.length) partial++;
        const mean = total / n;
        sums.push(fmtNum(n < idx.length ? mean * idx.length : total));
        means.push(fmtNum(mean));
      }
      const outs = s.method === "both" ? [[s.name + "_sum", sums, "sum"], [s.name + "_mean", means, "mean"]]
        : [[s.name, s.method === "sum" ? sums : means, s.method]];
      const revNames = s.items.filter(k => revSet.has(k)).map(k => colByKey(k).name);
      const detail = [
        revNames.length ? `${revNames.length === 1 ? "item" : "items"} ${revNames.join(", ")} reverse-scored` : "no items reverse-scored",
        s.min !== null ? `scale ${fmtNum(s.min)}–${fmtNum(s.max)}` : null
      ].filter(Boolean).join(", ");
      for (const [outName, vals, kind] of outs) {
        newCols.push({ key: "n" + state.nextNewKey++, name: outName, isNew: true });
        vals.forEach((v, i) => newVals[i].push(v));
        lines.push(`Created '${outName}' as the ${kind} of ${plural(names.length, "item")}: ${names.join(", ")} (${detail}).`);
      }
      if (blankN) lines.push(`'${s.name}' was left blank for ${plural(blankN, "row")} ${s.missing === "blank" ? "with one or more missing items" : "with no answered items"}.`);
      if (partial) lines.push(`For ${plural(partial, "row")} with missing items, '${s.name}' used the items that were answered (sums prorated to ${idx.length} items).`);
      if (nonNumeric) lines.push(`${plural(nonNumeric, "non-numeric value")} in the items for '${s.name}' ${nonNumeric === 1 ? "was" : "were"} treated as missing.`);
    }

    if (skipped.length) toast(`Skipped ${quoteList(skipped)} — some of its item columns no longer exist.`, "error");
    if (!lines.length) return;
    const created = state.scoreQueue.length - skipped.length;
    state.scoreQueue = [];
    commit({ cols: newCols, rows: d.rows.map((r, i) => r.concat(newVals[i])) }, "Create score", lines);
    toast(`Created ${plural(created, "score")} — new columns are at the far right`);
    const scroller = $("#tableScroll");
    scroller.scrollLeft = scroller.scrollWidth;
  }

  /* ---------- Export ---------- */
  function newExportDraft() {
    const suggestedQ = new Set();
    const stats = colStats();
    state.data.cols.forEach((c, j) => {
      const s = stats[j];
      if (c.key === state.idKey) return;
      if (s.nonNumeric > 0 && s.nonNumeric >= s.numeric && s.textLen / s.nonNumeric >= 15) suggestedQ.add(c.key);
    });
    return {
      kind: null,
      quantFormat: state.settings.quantFormat,
      qualMode: null,
      docFormat: state.settings.qualFormat,
      withLog: true,
      idKey: state.idKey && colIndex(state.idKey) !== -1 ? state.idKey : (state.data.cols[0] || {}).key,
      demo: new Set(),
      questions: suggestedQ,
      labels: new Map(),
      skipBlank: false,
      pageBreak: true
    };
  }

  function renderExport(body) {
    if (!state.exportDraft) state.exportDraft = newExportDraft();
    const ex = state.exportDraft;
    // Drop references to columns that no longer exist
    if (colIndex(ex.idKey) === -1) ex.idKey = state.idKey && colIndex(state.idKey) !== -1 ? state.idKey : state.data.cols[0].key;
    ex.demo = new Set([...ex.demo].filter(k => colIndex(k) !== -1));
    ex.questions = new Set([...ex.questions].filter(k => colIndex(k) !== -1));

    const choice = (val, cur, ic, title, sub, attr) =>
      `<button type="button" class="fg-choice" ${attr}="${val}" aria-pressed="${cur === val}"><strong>${icon(ic)} ${title}</strong><span>${sub}</span></button>`;

    let html = `<div class="fg-section"><h3>What are you exporting for?</h3>
      <div class="fg-choices">
        ${choice("quant", ex.kind, "chart", "Quantitative", "A clean spreadsheet for JASP / SPSS, plus a change log.", "data-kind")}
        ${choice("qual", ex.kind, "message", "Qualitative", "Written responses as a spreadsheet or a readable Word document.", "data-kind")}
      </div></div>`;

    if (ex.kind === "quant") {
      html += preflightHtml() + sheetOptionsHtml(ex) + `
        <div class="fg-section"><button type="button" class="cctk-btn cctk-btn--primary cctk-btn--block" id="exGo">${icon("download")} Download</button></div>`;
    } else if (ex.kind === "qual") {
      html += `<div class="fg-section"><h3>Format</h3><div class="fg-choices fg-choices--stack">
        ${choice("sheet", ex.qualMode, "table", "Spreadsheet (CSV / Excel)", "Same as the quantitative export.", "data-mode")}
        ${choice("byParticipant", ex.qualMode, "user", "By Participant (Word)", "One section per participant with all of their answers together.", "data-mode")}
        ${choice("byQuestion", ex.qualMode, "users", "By Question (Word)", "A participant summary table, then every answer to each question in turn.", "data-mode")}
      </div></div>`;
      if (ex.qualMode === "sheet") {
        html += sheetOptionsHtml(ex) + `<div class="fg-section"><button type="button" class="cctk-btn cctk-btn--primary cctk-btn--block" id="exGo">${icon("download")} Download</button></div>`;
      } else if (ex.qualMode) {
        html += wordOptionsHtml(ex);
      }
    }
    body.innerHTML = html;

    $$("[data-kind]", body).forEach(b => b.addEventListener("click", () => { ex.kind = b.dataset.kind; renderTool(); }));
    $$("[data-mode]", body).forEach(b => b.addEventListener("click", () => { ex.qualMode = b.dataset.mode; renderTool(); }));
    $$("input[name=exSheet]", body).forEach(r => r.addEventListener("change", e => { ex.quantFormat = e.target.value; }));
    const logCb = $("#exLog", body);
    if (logCb) logCb.addEventListener("change", e => { ex.withLog = e.target.checked; });
    $$("[data-open-tool]", body).forEach(b => b.addEventListener("click", () => openTool(b.dataset.openTool)));
    const go = $("#exGo", body);
    if (go) go.addEventListener("click", exportSheet);
    if (ex.qualMode === "byParticipant" || ex.qualMode === "byQuestion") bindWordOptions(body, ex);
  }

  function preflightHtml() {
    const out = [];
    if (isSpss()) {
      const bad = state.data.cols.filter(c => spssProblems(c.name).length);
      if (bad.length) {
        out.push(notice("warn", `<p><strong>${plural(bad.length, "column name")} won't work in SPSS</strong> (e.g. '${esc(bad[0].name)}'). SPSS will rename them for you, unpredictably.</p>
          <p><button type="button" class="fg-linkbtn" data-open-tool="rename">Fix in Rename</button></p>`));
      }
    }
    const pairs = findRatingPairs();
    if (pairs.length) {
      out.push(notice("info", `<p>${plural(pairs.length, "rating scale")} still ${pairs.length === 1 ? "has" : "have"} both a Response and a Quantised column.</p>
        <p><button type="button" class="fg-linkbtn" data-open-tool="rating">Tidy in Rating Scales</button></p>`));
    }
    const info = participantInfo();
    if (info && info.maxRows > 1) {
      out.push(notice("warn", "<p>This file still has more than one row per participant (long format). V1 exports it as-is.</p>"));
    }
    if (info && info.missing) {
      out.push(notice("info", `<p>${plural(info.missing, "row")} ${info.missing === 1 ? "has" : "have"} no Participant Private ID.</p>`));
    }
    return out.length ? `<div class="fg-section">${out.join("")}</div>` : "";
  }

  function sheetOptionsHtml(ex) {
    return `<div class="fg-section"><h3>File type</h3>
      <div class="fg-radio">
        <label><input type="radio" name="exSheet" value="csv" ${ex.quantFormat === "csv" ? "checked" : ""}/> CSV</label>
        <label><input type="radio" name="exSheet" value="xlsx" ${ex.quantFormat === "xlsx" ? "checked" : ""}/> Excel (.xlsx)</label>
      </div>
      <label class="fg-list__item" style="border:none;padding-left:0"><input type="checkbox" id="exLog" ${ex.withLog ? "checked" : ""}/>
        <span class="fg-list__name">Also download the change log (.txt) for your write-up</span></label>
      <p class="fg-help">${plural(state.data.rows.length, "row")} × ${plural(state.data.cols.length, "column")} will be exported.</p>
    </div>`;
  }

  function wordOptionsHtml(ex) {
    const d = state.data;
    const others = d.cols.filter(c => c.key !== ex.idKey);
    const selectedQ = d.cols.filter(c => ex.questions.has(c.key));
    return `
      <div class="fg-section"><h3>Participant ID column</h3>
        <select class="fg-select" id="exId">${d.cols.map(c => `<option value="${esc(c.key)}" ${c.key === ex.idKey ? "selected" : ""}>${esc(c.name)}</option>`).join("")}</select>
      </div>
      <div class="fg-section"><h3>Demographics <span class="fg-help">(optional)</span></h3>
        <input type="search" class="fg-input" id="exDemoFilter" placeholder="Filter columns…" />
        ${checklistHtml(others.map(c => ({ key: c.key, name: c.name, checked: ex.demo.has(c.key) })), { id: "exDemo" })}
      </div>
      <div class="fg-section"><h3>Questions</h3>
        <p class="fg-help">Columns that look like written answers are ticked for you — check the list.</p>
        <input type="search" class="fg-input" id="exQFilter" placeholder="Filter columns…" />
        ${checklistHtml(others.filter(c => !ex.demo.has(c.key)).map(c => ({ key: c.key, name: c.name, checked: ex.questions.has(c.key) })), { id: "exQ" })}
      </div>
      <div class="fg-section"><h3>Question labels (${selectedQ.length})</h3>
        <p class="fg-help">Taken from the column headings — Gorilla often puts the full question there. Edit them to read nicely.</p>
        <div class="fg-renames" id="exLabels">
          ${selectedQ.map(c => `<label class="fg-rename"><small title="${esc(c.name)}">${esc(c.name)}</small>
            <textarea class="fg-textarea" rows="2" data-label="${esc(c.key)}">${esc(ex.labels.has(c.key) ? ex.labels.get(c.key) : c.name)}</textarea></label>`).join("")
            || '<p class="fg-help">Tick at least one question above.</p>'}
        </div>
      </div>
      <div class="fg-section"><h3>Options</h3>
        <div class="fg-radio">
          <label><input type="radio" name="exDoc" value="docx" ${ex.docFormat === "docx" ? "checked" : ""}/> Word (.docx)</label>
          <label><input type="radio" name="exDoc" value="txt" ${ex.docFormat === "txt" ? "checked" : ""}/> Plain text (.txt)</label>
        </div>
        <label class="fg-list__item" style="border:none;padding-left:0"><input type="checkbox" id="exSkip" ${ex.skipBlank ? "checked" : ""}/><span class="fg-list__name">Leave out blank answers</span></label>
        ${ex.qualMode === "byParticipant" ? `<label class="fg-list__item" style="border:none;padding-left:0"><input type="checkbox" id="exPage" ${ex.pageBreak ? "checked" : ""}/><span class="fg-list__name">Start each participant on a new page</span></label>` : ""}
      </div>
      <div class="fg-section"><button type="button" class="cctk-btn cctk-btn--primary cctk-btn--block" id="exWord" ${selectedQ.length ? "" : "disabled"}>${icon("fileText")} Generate document</button></div>`;
  }

  function bindWordOptions(body, ex) {
    $("#exId", body).addEventListener("change", e => {
      ex.idKey = e.target.value;
      ex.demo.delete(ex.idKey);
      ex.questions.delete(ex.idKey);
      renderTool();
    });
    const demo = $("#exDemo", body);
    bindFilter($("#exDemoFilter", body), demo);
    demo && demo.addEventListener("change", () => {
      ex.demo = new Set(checkedKeys(demo));
      ex.demo.forEach(k => ex.questions.delete(k));
      renderTool();
    });
    const q = $("#exQ", body);
    bindFilter($("#exQFilter", body), q);
    q && q.addEventListener("change", () => { ex.questions = new Set(checkedKeys(q)); renderTool(); });
    $$("textarea[data-label]", body).forEach(t => t.addEventListener("input", () => ex.labels.set(t.dataset.label, t.value)));
    $$("input[name=exDoc]", body).forEach(r => r.addEventListener("change", e => { ex.docFormat = e.target.value; }));
    $("#exSkip", body).addEventListener("change", e => { ex.skipBlank = e.target.checked; });
    const page = $("#exPage", body);
    if (page) page.addEventListener("change", e => { ex.pageBreak = e.target.checked; });
    $("#exWord", body).addEventListener("click", () => exportWord(ex).catch(err => {
      console.error(err);
      toast("Sorry — the document couldn't be created.", "error");
    }));
  }

  /* Numeric-looking strings become numbers in Excel so JASP/SPSS read them as numeric */
  function cellValue(v) {
    const t = String(v).trim();
    if (t === "" || !NUM_RE.test(t)) return v;
    if (/^[-+]?0\d/.test(t)) return v; // keep leading zeros (e.g. codes like 007)
    return Number(t);
  }

  function exportSheet() {
    const ex = state.exportDraft;
    const d = state.data;
    const names = d.cols.map(c => c.name);
    const base = state.fileBase || "gorilla_data";
    try {
      if (ex.quantFormat === "xlsx") {
        const ws = XLSX.utils.aoa_to_sheet([names, ...d.rows.map(r => r.map(cellValue))]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        download(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${base}_clean.xlsx`);
      } else {
        const csv = Papa.unparse({ fields: names, data: d.rows }, { newline: "\r\n" });
        download(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${base}_clean.csv`);
      }
    } catch (err) {
      console.error(err);
      toast("Sorry — the export failed.", "error");
      return;
    }
    if (ex.withLog) setTimeout(downloadLog, 600);
    toast(ex.withLog ? "Downloaded your data and change log" : "Downloaded your data");
  }

  /* ---------- Qualitative Word / text output ---------- */
  function qualModel(ex) {
    const d = state.data;
    const idI = colIndex(ex.idKey);
    const idName = d.cols[idI].name;
    const demo = d.cols.map((c, j) => ({ c, j })).filter(o => ex.demo.has(o.c.key));
    const qs = d.cols.map((c, j) => ({ c, j })).filter(o => ex.questions.has(o.c.key))
      .map(o => ({ j: o.j, label: (ex.labels.has(o.c.key) ? ex.labels.get(o.c.key) : o.c.name).trim() || o.c.name }));
    const people = d.rows.map((r, i) => ({
      id: String(r[idI]).trim() || `Row ${i + 1}`,
      demo: demo.map(o => ({ name: o.c.name, value: String(r[o.j]).trim() })),
      answers: qs.map(q => String(r[q.j]).replace(/\r\n?/g, "\n").trim())
    }));
    return { idName, demo: demo.map(o => o.c.name), qs, people };
  }

  async function exportWord(ex) {
    const m = qualModel(ex);
    const base = state.fileBase || "gorilla_data";
    const suffix = ex.qualMode === "byParticipant" ? "by_participant" : "by_question";
    if (ex.docFormat === "txt") {
      const txt = ex.qualMode === "byParticipant" ? txtByParticipant(m, ex) : txtByQuestion(m, ex);
      download(new Blob([txt], { type: "text/plain;charset=utf-8" }), `${base}_${suffix}.txt`);
    } else {
      if (!window.docx) throw new Error("docx library not loaded");
      const doc = ex.qualMode === "byParticipant" ? docxByParticipant(m, ex) : docxByQuestion(m, ex);
      const blob = await docx.Packer.toBlob(doc);
      download(blob, `${base}_${suffix}.docx`);
    }
    toast("Document downloaded");
  }

  function docHeader(title, m) {
    const D = window.docx;
    return [
      new D.Paragraph({ text: title, heading: D.HeadingLevel.TITLE }),
      new D.Paragraph({
        children: [new D.TextRun({
          text: `${state.fileBase} · ${plural(m.people.length, "participant")} · ${plural(m.qs.length, "question")} · created ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`,
          color: "666666", size: 20
        })],
        spacing: { after: 240 }
      })
    ];
  }

  function runs(text, opts = {}) {
    const D = window.docx;
    return String(text).split("\n").map((line, i) => new D.TextRun({ text: line, ...(i ? { break: 1 } : {}), ...opts }));
  }

  function cell(text, header) {
    const D = window.docx;
    return new D.TableCell({
      children: [new D.Paragraph({ children: runs(text || "", header ? { bold: true } : {}) })],
      shading: header ? { fill: "E8EAF6", type: D.ShadingType.CLEAR, color: "auto" } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 }
    });
  }

  function table(headerRow, bodyRows) {
    const D = window.docx;
    return new D.Table({
      width: { size: 100, type: D.WidthType.PERCENTAGE },
      rows: [
        new D.TableRow({ tableHeader: true, children: headerRow.map(h => cell(h, true)) }),
        ...bodyRows.map(r => new D.TableRow({ children: r.map(v => cell(v, false)) }))
      ]
    });
  }

  function newDocument(children) {
    const D = window.docx;
    return new D.Document({
      creator: "Friendly Gorilla (CCTK)",
      title: state.fileBase,
      styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
      sections: [{ children }]
    });
  }

  function docxByParticipant(m, ex) {
    const D = window.docx;
    const children = docHeader("Responses by participant", m);
    m.people.forEach((p, i) => {
      children.push(new D.Paragraph({
        text: `${m.idName}: ${p.id}`, heading: D.HeadingLevel.HEADING_1,
        pageBreakBefore: ex.pageBreak && i > 0
      }));
      if (p.demo.length) {
        children.push(table(["Detail", "Value"], p.demo.map(dm => [dm.name, dm.value])));
        children.push(new D.Paragraph({ text: "" }));
      }
      m.qs.forEach((q, k) => {
        const a = p.answers[k];
        if (!a && ex.skipBlank) return;
        children.push(new D.Paragraph({ children: runs(q.label, { bold: true }), spacing: { before: 200, after: 60 }, keepNext: true }));
        children.push(new D.Paragraph({ children: a ? runs(a) : [new D.TextRun({ text: "(no response)", italics: true, color: "888888" })], spacing: { after: 120 } }));
      });
    });
    return newDocument(children);
  }

  function docxByQuestion(m, ex) {
    const D = window.docx;
    const children = docHeader("Responses by question", m);
    children.push(new D.Paragraph({ text: "Participants", heading: D.HeadingLevel.HEADING_1 }));
    children.push(table([m.idName, ...m.demo], m.people.map(p => [p.id, ...p.demo.map(dm => dm.value)])));
    m.qs.forEach((q, k) => {
      children.push(new D.Paragraph({ children: runs(`Q${k + 1}. ${q.label}`), heading: D.HeadingLevel.HEADING_1, pageBreakBefore: false, spacing: { before: 360 } }));
      const rows = m.people.filter(p => p.answers[k] || !ex.skipBlank).map(p => [p.id, p.answers[k] || "(no response)"]);
      if (rows.length) children.push(table([m.idName, "Response"], rows));
      else children.push(new D.Paragraph({ children: [new D.TextRun({ text: "(no responses)", italics: true, color: "888888" })] }));
    });
    return newDocument(children);
  }

  function txtByParticipant(m, ex) {
    const out = ["RESPONSES BY PARTICIPANT", `${state.fileBase} — ${plural(m.people.length, "participant")}, ${plural(m.qs.length, "question")}`, ""];
    m.people.forEach(p => {
      out.push("=".repeat(60), `${m.idName}: ${p.id}`, "=".repeat(60));
      p.demo.forEach(dm => out.push(`${dm.name}: ${dm.value}`));
      if (p.demo.length) out.push("");
      m.qs.forEach((q, k) => {
        const a = p.answers[k];
        if (!a && ex.skipBlank) return;
        out.push(q.label, a ? a.replace(/\n/g, "\r\n") : "(no response)", "");
      });
    });
    return out.join("\r\n");
  }

  function txtByQuestion(m, ex) {
    const out = ["RESPONSES BY QUESTION", `${state.fileBase} — ${plural(m.people.length, "participant")}, ${plural(m.qs.length, "question")}`, "", "PARTICIPANTS"];
    out.push([m.idName, ...m.demo].join("\t"));
    m.people.forEach(p => out.push([p.id, ...p.demo.map(dm => dm.value)].join("\t")));
    m.qs.forEach((q, k) => {
      out.push("", "=".repeat(60), `Q${k + 1}. ${q.label}`, "=".repeat(60));
      m.people.forEach(p => {
        const a = p.answers[k];
        if (!a && ex.skipBlank) return;
        out.push(`[${p.id}] ${(a || "(no response)").replace(/\n/g, "\r\n    ")}`);
      });
    });
    return out.join("\r\n");
  }

  /* ---------- Change log ---------- */
  function logText() {
    const now = new Date();
    const when = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) + ", " +
      now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    const o = state.original, d = state.data;
    const lines = state.log.flatMap(e => e.lines);
    const out = [
      "Friendly Gorilla — change log",
      `File: ${state.fileName}`,
      `Generated: ${when}`,
      "",
      `Original file: ${plural(o.rows.length, "row")}, ${plural(o.cols.length, "column")}.`,
      `Cleaned file: ${plural(d.rows.length, "row")}, ${plural(d.cols.length, "column")}.`,
      "",
      "Changes, in order:"
    ];
    if (lines.length) lines.forEach((l, i) => out.push(`${i + 1}. ${l}`));
    else out.push("No changes were made.");
    out.push("", "Data were cleaned in the browser using Friendly Gorilla (CCTK); no data were uploaded.");
    return out.join("\r\n");
  }

  function downloadLog() {
    download(new Blob([logText()], { type: "text/plain;charset=utf-8" }), `${state.fileBase || "gorilla_data"}_changelog.txt`);
  }

  function renderLog(body) {
    let n = 0;
    body.innerHTML = `
      <div class="fg-section">
        <p>A plain-English record of every change, ready to adapt for your method or results section. Undo removes the last entry.</p>
        <div class="fg-btnrow">
          <button type="button" class="cctk-btn cctk-btn--primary" id="lgDl">${icon("download")} Download .txt</button>
          <button type="button" class="cctk-btn" id="lgCopy">${icon("copy")} Copy</button>
        </div>
      </div>
      <div class="fg-section">
        ${state.log.length ? state.log.map(e => `
          <div class="fg-log__group">${esc(e.op)}</div>
          <ol class="fg-log" start="${n + 1}">${e.lines.map(l => { n++; return `<li>${esc(l)}</li>`; }).join("")}</ol>`).join("")
          : '<p class="fg-help">No changes yet.</p>'}
      </div>`;
    $("#lgDl").addEventListener("click", downloadLog);
    $("#lgCopy").addEventListener("click", () => copyText(logText()));
  }

  /* ---------- Settings ---------- */
  function renderSettings(body) {
    const s = state.settings;
    const radio = (name, val, cur, label) => `<label><input type="radio" name="${name}" value="${val}" ${cur === val ? "checked" : ""}/> ${label}</label>`;
    const theme = themeChoice();
    body.innerHTML = `
      <div class="fg-section"><h3>Statistics software</h3>
        <div class="fg-radio">${radio("stStats", "SPSS", s.statsTool, "SPSS")}${radio("stStats", "JASP", s.statsTool, "JASP")}</div>
        <p class="fg-help">SPSS mode checks column names are SPSS-safe when you rename columns and before you export.</p>
      </div>
      <div class="fg-section"><h3>Quantitative export</h3>
        <div class="fg-radio">${radio("stQuant", "csv", s.quantFormat, "CSV")}${radio("stQuant", "xlsx", s.quantFormat, "Excel (.xlsx)")}</div>
      </div>
      <div class="fg-section"><h3>Qualitative export</h3>
        <div class="fg-radio">${radio("stQual", "docx", s.qualFormat, "Word (.docx)")}${radio("stQual", "txt", s.qualFormat, "Plain text (.txt)")}</div>
      </div>
      <div class="fg-section"><h3>Appearance</h3>
        <div class="fg-radio">${radio("stTheme", "light", theme, "Light")}${radio("stTheme", "dark", theme, "Dark")}${radio("stTheme", "system", theme, "Match my device")}</div>
      </div>
      <div class="fg-section"><h3>Clear saved settings</h3>
        <p>Resets the preferences above. There's no data to clear — Friendly Gorilla never saves your data.</p>
        <button type="button" class="cctk-btn cctk-btn--danger" id="stClear">${icon("trash")} Clear saved settings</button>
      </div>`;
    const bind = (name, prop) => $$(`input[name=${name}]`, body).forEach(r => r.addEventListener("change", e => {
      state.settings[prop] = e.target.value;
      saveSettings();
      if (state.exportDraft) {
        if (prop === "quantFormat") state.exportDraft.quantFormat = e.target.value;
        if (prop === "qualFormat") state.exportDraft.docFormat = e.target.value;
      }
      toast("Saved");
    }));
    bind("stStats", "statsTool");
    bind("stQuant", "quantFormat");
    bind("stQual", "qualFormat");
    $$("input[name=stTheme]", body).forEach(r => r.addEventListener("change", e => setThemeChoice(e.target.value)));
    $("#stClear").addEventListener("click", () => {
      clearSettings();
      renderTool();
      toast("Settings reset to defaults");
    });
  }

  /* ==========================================================================
     MODALS — Help and Cite
     ========================================================================== */
  function openModal(title, html) {
    $("#modalTitle").innerHTML = title;
    $("#modalBody").innerHTML = html;
    $("#modal").hidden = false;
    $(".fg-modal__card [data-close]").focus();
  }
  function closeModal() { $("#modal").hidden = true; }

  function showHelp() {
    openModal(icon("help") + " Using Friendly Gorilla", `
      <div><h3>The usual route</h3>
        <ol>
          <li><strong>Open</strong> your Gorilla export (CSV or Excel). End-of-file and blank rows are removed for you.</li>
          <li><strong>Remove Columns → Default Group Remove</strong> strips Gorilla's housekeeping columns, including Participant Public ID.</li>
          <li><strong>Rating Scales → Keep Quantised</strong> keeps the numbers and drops the duplicate text columns.</li>
          <li><strong>Rename</strong> columns to short names like <code>anxiety_1</code>. In SPSS mode, unsafe names get a suggested fix.</li>
          <li><strong>Create Score</strong> for each measure: pick items, tick reverse-scored ones, check the scale range, add to list, then Apply all.</li>
          <li><strong>Export</strong>: Quantitative for JASP / SPSS, or Qualitative for written answers in Word.</li>
        </ol></div>
      <div><h3>Mistakes are fine</h3>
        <p><strong>Undo</strong> (or Ctrl+Z) reverses the last step and <strong>Reset</strong> returns to the file as you opened it. Your original file on disk is never changed.</p></div>
      <div><h3>The change log</h3>
        <p>Every step is written up in plain English. Download it with your export and use it when writing your method and results.</p></div>
      <div><h3>What V1 doesn't do yet</h3>
        <p>Task data with many rows per participant (e.g. reaction times per trial) can be cleaned but not yet summarised into one row per participant, and files can't be merged. Both are planned.</p></div>
      <div><h3>Privacy</h3>
        <p>Everything happens in your browser. Nothing is uploaded or saved; only your settings are remembered on this device.</p></div>`);
  }

  function citationText() {
    const c = CONFIG.citation;
    return {
      apaHtml: `${esc(c.authorFamily)}, ${esc(c.authorInitials)} (${esc(c.year)}). <em>${esc(c.title)}</em> (Version ${esc(c.version)}) [Computer software]. ${esc(c.publisher)}. ${esc(c.url)}`,
      apa: `${c.authorFamily}, ${c.authorInitials} (${c.year}). ${c.title} (Version ${c.version}) [Computer software]. ${c.publisher}. ${c.url}`,
      inText: `(${c.authorFamily}, ${c.year})`,
      narrative: `${c.authorFamily} (${c.year})`,
      bibtex: `@software{${c.bibtexKey},\n  author    = {${c.authorFamily}, ${c.authorGiven}},\n  title     = {${c.title}},\n  year      = {${c.year}},\n  version   = {${c.version}},\n  publisher = {${c.publisher}},\n  url       = {${c.url}}\n}`
    };
  }

  function showCite() {
    const t = citationText();
    openModal(icon("book") + " Cite Friendly Gorilla", `
      <p>If Friendly Gorilla helped you prepare your data, please cite it in your report.</p>
      <div class="fg-cite"><h3>APA 7th reference</h3><div class="fg-citebox">${t.apaHtml}</div>
        <button type="button" class="cctk-btn cctk-btn--sm" data-copy="apa">${icon("copy")} Copy</button></div>
      <div class="fg-cite"><h3>APA 7th in-text</h3><div class="fg-citebox">${esc(t.inText)} &nbsp;or&nbsp; ${esc(t.narrative)}</div>
        <button type="button" class="cctk-btn cctk-btn--sm" data-copy="inText">${icon("copy")} Copy</button></div>
      <div class="fg-cite"><h3>BibTeX</h3><pre>${esc(t.bibtex)}</pre>
        <button type="button" class="cctk-btn cctk-btn--sm" data-copy="bibtex">${icon("copy")} Copy</button></div>
      <div><button type="button" class="cctk-btn" id="citeDl">${icon("download")} Download .txt (for Zotero)</button></div>`);
    $$("[data-copy]", $("#modalBody")).forEach(b => b.addEventListener("click", () => copyText(t[b.dataset.copy])));
    $("#citeDl").addEventListener("click", () => {
      const txt = ["APA 7th reference", t.apa, "", "APA 7th in-text", t.inText, "", "BibTeX", t.bibtex, ""].join("\r\n");
      download(new Blob([txt], { type: "text/plain;charset=utf-8" }), "friendly-gorilla-citation.txt");
    });
  }

  /* ==========================================================================
     WIRING
     ========================================================================== */
  function startRenameFile() {
    const btn = $("#fileNameBtn"), inp = $("#fileNameInput");
    inp.value = state.fileBase;
    btn.hidden = true;
    inp.hidden = false;
    inp.focus();
    inp.select();
  }
  function endRenameFile(save) {
    const btn = $("#fileNameBtn"), inp = $("#fileNameInput");
    if (inp.hidden) return;
    if (save) {
      const v = inp.value.replace(/\.(csv|xlsx?|tsv|txt)$/i, "").replace(/[\\/:*?"<>|]+/g, "_").trim();
      if (v) state.fileBase = v;
    }
    inp.hidden = true;
    btn.hidden = false;
    btn.textContent = state.fileBase;
  }

  function bind() {
    hydrateIcons();
    updateThemeIcon();
    window.addEventListener("cctk:theme", updateThemeIcon);

    const fileInput = $("#fileInput");
    const pick = () => { fileInput.value = ""; fileInput.click(); };
    $("#btnOpen").addEventListener("click", pick);
    $("#dropZone").addEventListener("click", pick);
    $("#dropZone").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    fileInput.addEventListener("change", () => openFile(fileInput.files[0]));

    // Drag & drop anywhere on the page
    let dragDepth = 0;
    window.addEventListener("dragenter", e => { e.preventDefault(); dragDepth++; $("#dropZone").classList.add("is-over"); });
    window.addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; $("#dropZone").classList.remove("is-over"); } });
    window.addEventListener("dragover", e => e.preventDefault());
    window.addEventListener("drop", e => {
      e.preventDefault();
      dragDepth = 0;
      $("#dropZone").classList.remove("is-over");
      const f = e.dataTransfer && e.dataTransfer.files[0];
      if (f) openFile(f);
    });

    $("#btnUndo").addEventListener("click", undo);
    $("#btnReset").addEventListener("click", resetToOriginal);
    $$("[data-tool]").forEach(b => b.addEventListener("click", () => openTool(b.dataset.tool)));
    $("#sidebarClose").addEventListener("click", closeTool);

    $("#fileNameBtn").addEventListener("click", startRenameFile);
    $("#fileNameInput").addEventListener("keydown", e => {
      if (e.key === "Enter") endRenameFile(true);
      if (e.key === "Escape") endRenameFile(false);
    });
    $("#fileNameInput").addEventListener("blur", () => endRenameFile(true));

    $("#warnings").addEventListener("click", e => {
      const b = e.target.closest("[data-dismiss]");
      if (!b) return;
      state.dismissed.add(b.dataset.dismiss);
      renderImportPanel();
    });

    $("#btnHelp").addEventListener("click", showHelp);
    $("#btnCite").addEventListener("click", showCite);
    $$("#modal [data-close]").forEach(el => el.addEventListener("click", closeModal));

    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && !$("#modal").hidden) { closeModal(); return; }
      const typing = e.target.closest && e.target.closest("input, textarea, select, [contenteditable]");
      if (!typing && (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z" && state.history.length) {
        e.preventDefault();
        undo();
      }
    });

    window.addEventListener("beforeunload", e => {
      if (state.data && state.history.length > state.baseHistory) {
        e.preventDefault();
        e.returnValue = "";
      }
    });
  }

  async function init() {
    bind();
    await loadConfig();
    loadSettings();
    if (!window.Papa || !window.XLSX) {
      toast("Some parts of Friendly Gorilla didn't load. Try refreshing the page.", "error");
    }
    renderAll();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

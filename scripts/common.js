/* ============================================================
   common.js — 共用工具函式
   供三個頁面共用：CSV 解析（沿用首頁邏輯）、狀態對應表、
   小工具函式（建立元素、狀態徽章、header 導覽）。
   ============================================================ */

/* ---------- 狀態定義（提案進度 / 政見狀態） ----------
   key 用於 CSV 內填寫的值；label 顯示；cls 對應 pages.css 的
   .badge / class；order 用於進度條計算百分比。               */
window.STATUS = {
  // 提案進度（依序）
  draft:   { label: "草擬", cls: "s-draft",   order: 0 },
  discuss: { label: "討論", cls: "s-discuss", order: 1 },
  propose: { label: "提案", cls: "s-propose", order: 2 },
  review:  { label: "審議", cls: "s-review",  order: 3 },
  exec:    { label: "執行", cls: "s-exec",    order: 4 },
  done:    { label: "完結", cls: "s-done",    order: 5 },
  // 非提案工作（活動 / 一般工作）使用的狀態
  prep:    { label: "預備", cls: "s-draft",   order: 0 },
  plan:    { label: "籌備", cls: "s-draft",   order: 0 },
  promo:   { label: "宣傳", cls: "s-propose", order: 1 },
  // 終止狀態（不算在正常流程百分比內）
  cancel:  { label: "取消", cls: "s-cancel",  order: -1 },
  fail:    { label: "失敗", cls: "s-fail",    order: -2 },
};

/* 進度條正常流程的步驟順序（提案） */
window.PROGRESS_STEPS = ["draft", "discuss", "propose", "review", "exec", "done"];

/* ---------- 工作階段（儀表板分行用） ----------
   每個狀態歸屬一個階段；collapsed 表示該行預設摺疊。          */
window.PHASES = [
  { key: "prep",   label: "預備中",    statuses: ["draft", "prep", "plan"] },
  { key: "active", label: "進行中",    statuses: ["discuss", "propose", "review", "promo", "exec"] },
  { key: "done",   label: "完結",      statuses: ["done"] },
  { key: "closed", label: "取消／失敗", statuses: ["cancel", "fail"], collapsed: true },
];

window.phaseOf = function (statusKey) {
  var ph = window.PHASES.find(function (x) { return x.statuses.indexOf(statusKey) > -1; });
  return ph ? ph.key : "prep";
};

/* ---------- 進度流程（依工作類型） ----------
   每一步列出「落在這一步」的狀態 key；
   不在流程內的狀態，會依其階段對應到預備（第一步）/進行（中段）/完結。 */
window.FLOWS = {
  proposal: {
    name: "提案",
    steps: [
      { label: "草擬", keys: ["draft", "prep", "plan"] },
      { label: "討論", keys: ["discuss"] },
      { label: "提案", keys: ["propose"] },
      { label: "審議", keys: ["review"] },
      { label: "執行", keys: ["exec", "promo"] },
      { label: "完結", keys: ["done"] },
    ],
  },
  event: {
    name: "活動",
    steps: [
      { label: "籌備", keys: ["draft", "prep", "plan", "discuss", "propose", "review"] },
      { label: "宣傳", keys: ["promo"] },
      { label: "舉辦", keys: ["exec"] },
      { label: "完結", keys: ["done"] },
    ],
  },
  general: {
    name: "工作",
    steps: [
      { label: "預備", keys: ["draft", "prep", "plan"] },
      { label: "進行", keys: ["discuss", "propose", "review", "promo", "exec"] },
      { label: "完結", keys: ["done"] },
    ],
  },
};

/* 判斷工作屬於哪種流程：
   有填「類型」欄就依類型判斷；沒填時，類別為「活動」視為活動，其餘視為提案。 */
window.flowOf = function (item) {
  var t = item.type || "";
  if (t) {
    if (t.indexOf("活動") > -1) return "event";
    if (t.indexOf("提案") > -1 || t.indexOf("會議") > -1) return "proposal";
    return "general";
  }
  return item.cat === "活動" ? "event" : "proposal";
};

/* 回傳目前狀態在流程中的步驟索引（0 起算） */
window.flowStepIndex = function (flow, statusKey) {
  var idx = flow.steps.findIndex(function (s) { return s.keys.indexOf(statusKey) > -1; });
  if (idx > -1) return idx;
  var ph = window.phaseOf(statusKey);
  if (ph === "done") return flow.steps.length - 1;
  if (ph === "active") return Math.max(1, flow.steps.length - 2);
  return 0;
};

/* 政見狀態（關於我們用）：預備 / 執行 / 完結 / 取消 / 失敗 */
window.PLEDGE_STATUS = {
  prep:   { label: "預備", cls: "s-draft" },
  exec:   { label: "執行", cls: "s-exec" },
  done:   { label: "完結", cls: "s-done" },
  cancel: { label: "取消", cls: "s-cancel" },
  fail:   { label: "失敗", cls: "s-fail" },
};

/* 類別對應色（提案類別 → CSS 變數） */
window.CATEGORY = {
  "學權":  "var(--cat-rights)",
  "課務":  "var(--cat-academic)",
  "成績":  "var(--cat-grade)",
  "生活":  "var(--cat-life)",
  "制度":  "var(--cat-facility)",
  "活動": "var(--cat-event)",
  "資訊": "var(--cat-info)",
  "學生會":  "var(--cat-su)",
  "其他":  "var(--cat-other)",
};

/* 中文值 → 內部 key 的容錯對應（讓試算表可直接填中文） */
window.normalizeStatus = function (raw) {
  if (!raw) return "draft";
  var v = String(raw).trim().toLowerCase();
  var map = {
    "草擬": "draft", "draft": "draft",
    "討論": "discuss", "discuss": "discuss",
    "提案": "propose", "propose": "propose",
    "審議": "review", "review": "review",
    "執行": "exec","進行": "exec", "exec": "exec",
    "完結": "done", "完成": "done", "done": "done",
    "取消": "cancel", "cancel": "cancel",
    "失敗": "fail", "fail": "fail",
    "預備": "prep", "prep": "prep",
    "籌備": "plan", "規劃": "plan", "plan": "plan",
    "宣傳": "promo", "報名": "promo", "promo": "promo",
    "舉辦": "exec",
  };
  return map[v] || map[String(raw).trim()] || "draft";
};

/* ---------- CSV 解析 ----------
   opts（皆為「你在試算表看到的行號」，1 起算）：
     - headerRow    : 欄位標頭所在的行號（預設 3）
     - dataStartRow : 資料開始的行號（預設 5）
   你的試算表版面：
     第1行 官網後台資料：… （標題橫幅，略過）
     第2行 （空白）
     第3行 欄位標頭（編號/標題/…）  ← headerRow
     第4行 （空白）
     第5行 第一筆資料              ← dataStartRow
   若標頭列填錯或該列是空的，會自動往下找到第一個非空白列當標頭，
   確保不會整頁空白。                                              */
window.parseCSV = function (csvText, opts) {
  opts = opts || {};
  var headerRow = (opts.headerRow || 3) - 1;      // 轉成 0 起算
  var dataStartRow = (opts.dataStartRow || 5) - 1;

  csvText = csvText.replace(/^﻿/, "").trim();
  if (!csvText) return [];

  var rows = [], currentRow = [], currentCell = "", inQuote = false;
  for (var i = 0; i < csvText.length; i++) {
    var char = csvText[i], nextChar = csvText[i + 1];
    if (char === '"') {
      if (inQuote && nextChar === '"') { currentCell += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (char === "," && !inQuote) {
      currentRow.push(currentCell); currentCell = "";
    } else if ((char === "\r" || char === "\n") && !inQuote) {
      if (char === "\r" && nextChar === "\n") i++;
      currentRow.push(currentCell); rows.push(currentRow);
      currentRow = []; currentCell = "";
    } else { currentCell += char; }
  }
  if (currentCell || currentRow.length > 0) { currentRow.push(currentCell); rows.push(currentRow); }
  if (!rows.length) return [];

  // 取標頭列；若指定的那列超出範圍或整列空白，往下找第一個非空白列
  function rowIsEmpty(rw) { return !rw || rw.join("").trim() === ""; }
  var hIdx = headerRow;
  if (hIdx >= rows.length || rowIsEmpty(rows[hIdx])) {
    for (var r = 0; r < rows.length; r++) {
      if (!rowIsEmpty(rows[r])) { hIdx = r; break; }
    }
  }
  var headers = rows[hIdx].map(function (h) { return String(h).trim().toLowerCase(); });

  // 資料起始列：至少要在標頭之後
  var start = Math.max(dataStartRow, hIdx + 1);

  var data = [];
  for (var k = start; k < rows.length; k++) {
    var rw = rows[k];
    if (rowIsEmpty(rw)) continue;                 // 跳過空白列
    var obj = {};
    headers.forEach(function (h, idx) { obj[h] = rw[idx] ? String(rw[idx]).trim() : ""; });
    data.push(obj);
  }
  return data;
};

/* 依關鍵字模糊取值（支援中英文欄名） */
window.pick = function (obj, keywords) {
  var key = Object.keys(obj).find(function (k) {
    return keywords.some(function (kw) { return k.indexOf(kw.toLowerCase()) > -1; });
  });
  return key ? obj[key] : "";
};

/* 抓取已發布的 Google Sheet CSV；失敗時 reject
   opts 會原封不動傳給 parseCSV（headerRow / dataStartRow）        */
window.fetchCSV = function (url, opts) {
  var full = url + (url.indexOf("?") > -1 ? "&" : "?") + "t=" + Date.now();
  return fetch(full)
    .then(function (res) { if (!res.ok) throw new Error("HTTP " + res.status); return res.text(); })
    .then(function (csv) { return window.parseCSV(csv, opts); });
};

/* 建立狀態徽章元素 */
window.makeBadge = function (statusKey, statusMap) {
  statusMap = statusMap || window.STATUS;
  var s = statusMap[statusKey] || { label: statusKey, cls: "s-draft" };
  var el = document.createElement("span");
  el.className = "badge " + s.cls;
  el.textContent = s.label;
  return el;
};

/* 建立類別標籤 */
window.makeTag = function (category) {
  var el = document.createElement("span");
  el.className = "tag";
  el.style.setProperty("--tag-c", window.CATEGORY[category] || "var(--brand-gray)");
  el.textContent = category || "其他";
  return el;
};

/* header 導覽：標記目前頁面 active */
window.markActiveNav = function () {
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a[data-page]").forEach(function (a) {
    if (a.getAttribute("data-page") === here) a.classList.add("active");
  });
};

/* HTML 轉義 */
window.esc = function (s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
};

/* 取名字首字（頭像 fallback） */
window.initials = function (name) {
  if (!name) return "?";
  return name.trim().charAt(0);
};

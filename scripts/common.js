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
  // 終止狀態（不算在正常流程百分比內）
  cancel:  { label: "取消", cls: "s-cancel",  order: -1 },
  fail:    { label: "失敗", cls: "s-fail",    order: -2 },
};

/* 進度條正常流程的步驟順序 */
window.PROGRESS_STEPS = ["draft", "discuss", "propose", "review", "exec", "done"];

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
  "生活":  "var(--cat-life)",
  "設備":  "var(--cat-facility)",
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
    "執行": "exec", "exec": "exec",
    "完結": "done", "完成": "done", "done": "done",
    "取消": "cancel", "cancel": "cancel",
    "失敗": "fail", "fail": "fail",
    "預備": "prep", "prep": "prep",
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

/* ============================================================
   dashboard.js — 學代工作儀表板頁邏輯
   資料來源：已發布的 Google Sheet CSV（沿用首頁做法）。
   未設定或讀取失敗時，改用內建 SAMPLE 示範資料。

   ── 建議的 Google Sheet 欄位（工作表：Proposals）────────────
   標題 | 說明 | 類別 | 類型 | 狀態 | 更新日期
   - 類別：學權 / 課務 / 生活 / 設備 / 活動 / 其他
   - 類型（選填）：提案 / 活動 / 行政協調 …（自由填寫）
           含「活動」→ 活動流程；含「提案」或「會議」→ 提案流程；其他 → 一般工作流程
           未填時：類別為「活動」視為活動，其餘視為提案
   - 狀態：
       提案：草擬 / 討論 / 提案 / 審議 / 執行 / 完結
       活動：籌備 / 宣傳 / 舉辦 / 完結
       一般：預備 / 執行 / 完結
       終止：取消 / 失敗
   ============================================================ */
(function () {
  "use strict";

  var CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTipTPhX-Js-ImT0AA8gqJdJVok748opvaATypGt8VgJIyL50yec4wJOprd2J3VeOh5X4duCh9e-rVu/pub?gid=1921669825&single=true&output=csv";

  var area    = document.getElementById("dashArea");
  var loading = document.getElementById("dashLoading");
  var summaryEl = document.getElementById("dashSummary");
  var filterEl  = document.getElementById("filterRow");

  var allItems = [];
  var currentFilter = "全部";
  // 記住使用者手動展開／收合的狀態，切換類別篩選時不會被重設
  var groupOpen = {};

  // ---------- 示範資料 ----------
  var SAMPLE = [];

  function fromRows(rows) {
    return rows.map(function (r) {
      var item = {
        title: window.pick(r, ["標題", "title", "名稱", "提案"]),
        desc:  window.pick(r, ["說明", "內容", "desc", "description"]),
        cat:   window.pick(r, ["類別", "category", "cat"]) || "其他",
        type:  window.pick(r, ["類型", "type"]),
        status: window.normalizeStatus(window.pick(r, ["狀態", "進度", "status"])),
        date:  window.pick(r, ["更新", "日期", "date"]),
      };
      item.flow = window.flowOf(item);
      item.phase = window.phaseOf(item.status);
      return item;
    }).filter(function (p) { return p.title; });
  }

  function countPhase(items, key) {
    return items.filter(function (p) { return p.phase === key; }).length;
  }

  // ---------- 摘要 ----------
  function renderSummary(items) {
    var cards = [
      ["工作總數", items.length],
      ["預備中", countPhase(items, "prep")],
      ["進行中", countPhase(items, "active")],
      ["已完結", countPhase(items, "done")],
      ["取消／失敗", countPhase(items, "closed")],
    ];
    summaryEl.innerHTML = "";
    cards.forEach(function (c) {
      var el = document.createElement("div");
      el.className = "stat-card";
      el.innerHTML = '<div class="num">' + c[1] + '</div><div class="lbl">' + c[0] + '</div>';
      summaryEl.appendChild(el);
    });
  }

  // ---------- 篩選按鈕 ----------
  function renderFilters(items) {
    var cats = ["全部"].concat(
      Object.keys(items.reduce(function (acc, p) { acc[p.cat] = 1; return acc; }, {}))
    );
    filterEl.innerHTML = "";
    cats.forEach(function (c) {
      var b = document.createElement("button");
      b.className = "filter-btn" + (c === currentFilter ? " active" : "");
      b.textContent = c;
      b.addEventListener("click", function () {
        currentFilter = c;
        filterEl.querySelectorAll(".filter-btn").forEach(function (x) {
          x.classList.toggle("active", x.textContent === c);
        });
        renderCards();
      });
      filterEl.appendChild(b);
    });
  }

  // ---------- 單張卡片 ----------
  function buildCard(p) {
    var st = window.STATUS[p.status] || window.STATUS.draft;
    var flow = window.FLOWS[p.flow];
    var terminal = (p.phase === "closed");

    // 進度百分比：依該工作類型的流程計算；終止狀態顯示滿條但用灰/紅
    var pct, fillColor, stepIdx = -1;
    if (terminal) {
      pct = 100;
      fillColor = (p.status === "fail")
        ? "linear-gradient(90deg, var(--st-fail), #d97a7a)"
        : "linear-gradient(90deg, var(--st-cancel), #a9adb1)";
    } else {
      stepIdx = window.flowStepIndex(flow, p.status);
      pct = Math.round((stepIdx / (flow.steps.length - 1)) * 100);
      fillColor = "linear-gradient(90deg, var(--brand-teal), var(--brand-green))";
    }

    var card = document.createElement("div");
    card.className = "pcard" + (terminal ? " is-closed is-" + p.status : "");

    // tags（終止狀態把「取消／失敗」標籤放在最前面）
    var tags = document.createElement("div");
    tags.className = "pc-tags";
    if (terminal) tags.appendChild(window.makeBadge(p.status));
    tags.appendChild(window.makeTag(p.cat));
    var typeTag = document.createElement("span");
    typeTag.className = "tag";
    typeTag.style.setProperty("--tag-c", "var(--brand-gray)");
    typeTag.textContent = p.type || flow.name;
    tags.appendChild(typeTag);
    card.appendChild(tags);

    // title + desc
    var title = document.createElement("div");
    title.className = "pc-title"; title.textContent = p.title;
    card.appendChild(title);
    if (p.desc) {
      var desc = document.createElement("div");
      desc.className = "pc-desc"; desc.textContent = p.desc;
      card.appendChild(desc);
    }

    // progress
    var wrap = document.createElement("div");
    wrap.className = "progress-wrap";

    var track = document.createElement("div");
    track.className = "progress-track";
    var fill = document.createElement("div");
    fill.className = "progress-fill";
    fill.style.background = fillColor;
    fill.setAttribute("data-w", pct);
    track.appendChild(fill);
    wrap.appendChild(track);

    if (terminal) {
      // 終止狀態：以文字說明取代步驟標記
      var note = document.createElement("div");
      note.className = "progress-note";
      note.textContent = (p.status === "fail" ? "此" + flow.name + "未能通過／未能達成" : "此" + flow.name + "已取消")
        + (p.date ? "（" + p.date + "）" : "");
      wrap.appendChild(note);
    } else {
      // 步驟標記：依類型顯示對應流程，目前步驟加強標示
      var steps = document.createElement("div");
      steps.className = "progress-steps";
      flow.steps.forEach(function (s, idx) {
        var el = document.createElement("span");
        el.textContent = s.label;
        if (idx < stepIdx) el.className = "reached";
        if (idx === stepIdx) el.className = "reached current";
        steps.appendChild(el);
      });
      wrap.appendChild(steps);
    }

    card.appendChild(wrap);
    return card;
  }

  // 進度條動畫（摺疊區塊展開時也會重新播放）
  function animateBars(root) {
    requestAnimationFrame(function () {
      root.querySelectorAll(".progress-fill").forEach(function (f) {
        f.style.width = "0";
        requestAnimationFrame(function () { f.style.width = f.getAttribute("data-w") + "%"; });
      });
    });
  }

  // ---------- 依階段分行 ----------
  function renderCards() {
    var items = currentFilter === "全部"
      ? allItems
      : allItems.filter(function (p) { return p.cat === currentFilter; });

    area.innerHTML = "";
    if (!items.length) {
      area.innerHTML = '<div class="state-empty">此類別目前沒有學代工作。</div>';
      return;
    }

    window.PHASES.forEach(function (ph) {
      var group = items.filter(function (p) { return p.phase === ph.key; });
      if (!group.length) return;

      var grid = document.createElement("div");
      grid.className = "proposal-grid";
      group.forEach(function (p) { grid.appendChild(buildCard(p)); });

      var section;
      var head;
      if (ph.collapsed) {
        section = document.createElement("details");
        section.open = !!groupOpen[ph.key];
        head = document.createElement("summary");
        section.addEventListener("toggle", function () {
          groupOpen[ph.key] = section.open;
          if (section.open) animateBars(section);
        });
      } else {
        section = document.createElement("section");
        head = document.createElement("h2");
      }
      section.className = "dash-group is-" + ph.key;
      head.className = "subhead dash-group-head";
      head.innerHTML = window.esc(ph.label) + '<span class="dash-count">' + group.length + "</span>";

      section.appendChild(head);
      section.appendChild(grid);
      area.appendChild(section);
    });

    animateBars(area);
  }

  function boot(items) {
    if (loading) loading.remove();
    allItems = items;
    renderSummary(items);
    renderFilters(items);
    renderCards();
  }

  // ---------- 啟動 ----------
  window.markActiveNav();
  if (!CSV_URL) {
    boot(SAMPLE);
  } else {
    // headerRow: 欄位標頭在第 3 行；dataStartRow: 資料從第 5 行開始
    window.fetchCSV(CSV_URL, { headerRow: 3, dataStartRow: 5 })
      .then(function (rows) {
        var data = fromRows(rows);
        if (!data.length) {
          console.warn("工作 CSV 讀到了，但沒有有效資料。抓到的欄位：",
            rows[0] ? Object.keys(rows[0]) : "(無)");
        }
        boot(data.length ? data : SAMPLE);
      })
      .catch(function (err) {
        console.error("讀取學代工作進度失敗，改用示範資料：", err);
        boot(SAMPLE);
      });
  }
})();

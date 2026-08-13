/* ============================================================
   dashboard.js — 提案進度儀表板頁邏輯
   資料來源：已發布的 Google Sheet CSV（沿用首頁做法）。
   未設定或讀取失敗時，改用內建 SAMPLE 示範資料。

   ── 建議的 Google Sheet 欄位（工作表：Proposals）────────────
   標題 | 說明 | 類別 | 類型 | 狀態 | 更新日期
   - 類別：學權 / 課務 / 生活 / 設備 / 其他
   - 類型：校務會議提案 / 班聯會提案 / 行政協調 …（自由填寫）
   - 狀態：草擬 / 討論 / 提案 / 審議 / 執行 / 完結 / 取消 / 失敗
           （也可填英文 key：draft/discuss/propose/review/exec/done/cancel/fail）
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

  // ---------- 示範資料 ----------
  var SAMPLE = [
    { title: "校內意見信箱數位化", desc: "將實體意見箱改為線上表單，並公開處理進度。", cat: "學權", type: "校務會議提案", status: "exec", date: "2026-02-01" },
    { title: "段考範圍公告時程標準化", desc: "要求各科於考前兩週統一公告範圍。", cat: "課務", type: "校務會議提案", status: "done", date: "2025-11-20" },
    { title: "午休社團活動空間開放", desc: "爭取午休時段開放特定教室供社團使用。", cat: "生活", type: "行政協調", status: "review", date: "2026-03-10" },
    { title: "開放空間增設充電座", desc: "於中庭與圖書館增設手機/筆電充電插座。", cat: "設備", type: "校務會議提案", status: "done", date: "2025-10-15" },
    { title: "彈性學習時間課程調查", desc: "調查學生對彈性學習時間的課程需求。", cat: "課務", type: "問卷提案", status: "propose", date: "2026-04-02" },
    { title: "無障礙動線標示改善", desc: "補齊校內無障礙動線指標。", cat: "設備", type: "行政協調", status: "discuss", date: "2026-04-18" },
    { title: "學生自治經費彈性化", desc: "放寬自治經費用途限制。", cat: "學權", type: "校務會議提案", status: "draft", date: "2026-05-01" },
    { title: "夜間自習室延長開放", desc: "評估延長夜自習開放時段。", cat: "生活", type: "行政協調", status: "fail", date: "2026-01-30" },
  ];

  function fromRows(rows) {
    return rows.map(function (r) {
      return {
        title: window.pick(r, ["標題", "title", "名稱", "提案"]),
        desc:  window.pick(r, ["說明", "內容", "desc", "description"]),
        cat:   window.pick(r, ["類別", "category", "cat"]) || "其他",
        type:  window.pick(r, ["類型", "type"]) || "提案",
        status: window.normalizeStatus(window.pick(r, ["狀態", "進度", "status"])),
        date:  window.pick(r, ["更新", "日期", "date"]),
      };
    }).filter(function (p) { return p.title; });
  }

  // ---------- 摘要 ----------
  function renderSummary(items) {
    var total = items.length;
    var active = items.filter(function (p) {
      return ["discuss", "propose", "review", "exec"].indexOf(p.status) > -1;
    }).length;
    var done = items.filter(function (p) { return p.status === "done"; }).length;
    var closed = items.filter(function (p) {
      return ["cancel", "fail"].indexOf(p.status) > -1;
    }).length;

    var cards = [
      ["提案總數", total], ["進行中", active], ["已完結", done], ["取消/失敗", closed],
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

  // ---------- 卡片 ----------
  function renderCards() {
    var items = currentFilter === "全部"
      ? allItems
      : allItems.filter(function (p) { return p.cat === currentFilter; });

    area.innerHTML = "";
    if (!items.length) {
      area.innerHTML = '<div class="state-empty">此類別目前沒有提案。</div>';
      return;
    }

    var grid = document.createElement("div");
    grid.className = "proposal-grid";

    items.forEach(function (p) {
      var st = window.STATUS[p.status] || window.STATUS.draft;
      var terminal = (p.status === "cancel" || p.status === "fail");
      // 進度百分比：正常流程用 order/最後一步；終止狀態顯示滿條但用灰/紅
      var pct, fillColor;
      if (terminal) {
        pct = 100;
        fillColor = (p.status === "fail")
          ? "linear-gradient(90deg, var(--st-fail), #d97a7a)"
          : "linear-gradient(90deg, var(--st-cancel), #a9adb1)";
      } else {
        var lastIdx = window.PROGRESS_STEPS.length - 1;
        pct = Math.round((st.order / lastIdx) * 100);
        fillColor = "linear-gradient(90deg, var(--brand-teal), var(--brand-green))";
      }

      var card = document.createElement("div");
      card.className = "pcard";

      // tags
      var tags = document.createElement("div");
      tags.className = "pc-tags";
      tags.appendChild(window.makeTag(p.cat));
      var typeTag = document.createElement("span");
      typeTag.className = "tag";
      typeTag.style.setProperty("--tag-c", "var(--brand-gray)");
      typeTag.textContent = p.type;
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
      var head = document.createElement("div");
      head.className = "progress-head";
      var stageBadge = window.makeBadge(p.status);
      var stageWrap = document.createElement("span");
      stageWrap.className = "p-stage";
      stageWrap.appendChild(stageBadge);
      var pctEl = document.createElement("span");
      pctEl.className = "p-pct";
      pctEl.textContent = terminal ? (st.label) : (pct + "%");
      head.appendChild(stageWrap);
      head.appendChild(pctEl);
      wrap.appendChild(head);

      var track = document.createElement("div");
      track.className = "progress-track";
      var fill = document.createElement("div");
      fill.className = "progress-fill";
      fill.style.background = fillColor;
      fill.setAttribute("data-w", pct);
      track.appendChild(fill);
      wrap.appendChild(track);

      // 步驟標記（僅正常流程顯示）
      if (!terminal) {
        var steps = document.createElement("div");
        steps.className = "progress-steps";
        window.PROGRESS_STEPS.forEach(function (key, idx) {
          var s = document.createElement("span");
          s.textContent = window.STATUS[key].label;
          if (idx <= st.order) s.className = "reached";
          steps.appendChild(s);
        });
        wrap.appendChild(steps);
      }

      card.appendChild(wrap);
      grid.appendChild(card);
    });

    area.appendChild(grid);

    // 動畫
    requestAnimationFrame(function () {
      grid.querySelectorAll(".progress-fill").forEach(function (f) {
        f.style.width = "0";
        requestAnimationFrame(function () { f.style.width = f.getAttribute("data-w") + "%"; });
      });
    });
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
          console.warn("提案 CSV 讀到了，但沒有有效資料。抓到的欄位：",
            rows[0] ? Object.keys(rows[0]) : "(無)");
        }
        boot(data.length ? data : SAMPLE);
      })
      .catch(function (err) {
        console.error("讀取提案進度失敗，改用示範資料：", err);
        boot(SAMPLE);
      });
  }
})();

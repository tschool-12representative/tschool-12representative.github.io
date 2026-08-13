/* ============================================================
   meetings.js — 校務會議資訊頁邏輯
   資料來源：已發布的 Google Sheet CSV（沿用首頁做法）。
   若尚未設定或讀取失敗，會自動改用下方 SAMPLE 假資料，讓頁面
   仍可完整預覽。要正式上線時，只要把 CSV_URL 換成你的連結即可。

   ── 建議的 Google Sheet 欄位（工作表：Meetings）──────────────
   會議編號 | 會議名稱 | 日期 | 代表(以;分隔,格式「姓名(年級)」) |
   提案數 | 報告數 | 通過數 | 記錄連結 |
   提案明細(以「||」分隔多筆,每筆格式「標題::類別::狀態::結果」)
   例：學權提案A::學權::done::通過 || 生活提案B::生活::review::待審
   ============================================================ */
(function () {
  "use strict";

  // ⚙️ 換成你「發布到網路 → CSV」的連結
  var CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTipTPhX-Js-ImT0AA8gqJdJVok748opvaATypGt8VgJIyL50yec4wJOprd2J3VeOh5X4duCh9e-rVu/pub?gid=797140285&single=true&output=csv";

  var tabsEl   = document.getElementById("meetingTabs");
  var panelsEl = document.getElementById("meetingPanels");
  var loading  = document.getElementById("meetingsLoading");

  // ---------- 內建示範資料（fallback） ----------
  var SAMPLE = [
    {
      id: "1", name: "114 學年度第 1 次校務會議", date: "2025-10-15 (三) 14:00",
      reps: [
        { name: "王小明", grade: "三年級" }, { name: "陳曉華", grade: "三年級" },
        { name: "林大同", grade: "二年級" }, { name: "李思妤", grade: "一年級" },
      ],
      proposals: 8, reports: 5, passed: 6, record: "#",
      details: [
        { title: "增設校園開放空間充電座", cat: "設備", status: "done", result: "表決通過（18:2）" },
        { title: "調整段考範圍公告時程", cat: "課務", status: "done", result: "表決通過（多數）" },
        { title: "學生自治經費使用彈性化", cat: "學權", status: "review", result: "交付委員會續審" },
        { title: "午休時段社團活動開放", cat: "生活", status: "fail", result: "未達門檻，未通過" },
      ],
    },
    {
      id: "2", name: "114 學年度第 2 次校務會議", date: "2026-01-08 (四) 14:00",
      reps: [
        { name: "王小明", grade: "三年級" }, { name: "陳曉華", grade: "三年級" },
        { name: "張宇庭", grade: "二年級" },
      ],
      proposals: 6, reports: 4, passed: 4, record: "#",
      details: [
        { title: "校內意見信箱數位化", cat: "學權", status: "exec", result: "通過，執行中" },
        { title: "增設無障礙動線標示", cat: "設備", status: "done", result: "表決通過" },
        { title: "彈性學習時間課程調查", cat: "課務", status: "propose", result: "本次提出，下次討論" },
      ],
    },
  ];

  // ---------- CSV 轉頁面資料 ----------
  function fromRows(rows) {
    return rows.map(function (r) {
      var reps = (window.pick(r, ["代表", "rep"]) || "").split(";")
        .map(function (s) { return s.trim(); }).filter(Boolean)
        .map(function (s) {
          var m = s.match(/^(.*?)[（(](.*?)[）)]$/);
          return m ? { name: m[1].trim(), grade: m[2].trim() } : { name: s, grade: "" };
        });
      var details = (window.pick(r, ["提案明細", "明細", "detail"]) || "").split("||")
        .map(function (s) { return s.trim(); }).filter(Boolean)
        .map(function (s) {
          var p = s.split("::");
          return {
            title: (p[0] || "").trim(),
            cat: (p[1] || "其他").trim(),
            status: window.normalizeStatus(p[2] || "propose"),
            result: (p[3] || "").trim(),
          };
        });
      return {
        id: window.pick(r, ["編號", "id"]) || "",
        name: window.pick(r, ["會議名稱", "名稱", "name", "title"]) || "校務會議",
        date: window.pick(r, ["日期", "date"]) || "",
        reps: reps,
        proposals: parseInt(window.pick(r, ["提案數", "proposal"]) || "0", 10) || details.length,
        reports: parseInt(window.pick(r, ["報告數", "report"]) || "0", 10),
        passed: parseInt(window.pick(r, ["通過數", "passed", "pass"]) || "0", 10),
        record: window.pick(r, ["記錄連結", "記錄", "record", "link", "url"]) || "",
        details: details,
      };
    });
  }

  // ---------- 渲染 ----------
  function render(meetings) {
    if (loading) loading.remove();
    tabsEl.innerHTML = "";
    panelsEl.innerHTML = "";

    if (!meetings.length) {
      panelsEl.innerHTML = '<div class="state-empty">目前尚無校務會議資訊。</div>';
      return;
    }

    meetings.forEach(function (m, i) {
      // 頁籤
      var btn = document.createElement("button");
      btn.className = "tab-btn" + (i === 0 ? " active" : "");
      btn.textContent = "第 " + (m.id || (i + 1)) + " 次";
      btn.setAttribute("data-idx", i);
      btn.addEventListener("click", function () { switchTab(i); });
      tabsEl.appendChild(btn);

      // 面板
      panelsEl.appendChild(buildPanel(m, i));
    });

    // 觸發首個面板的圖表動畫
    requestAnimationFrame(function () { animateCharts(panelsEl.querySelector(".tab-panel.active")); });
  }

  function switchTab(idx) {
    tabsEl.querySelectorAll(".tab-btn").forEach(function (b, i) {
      b.classList.toggle("active", i === idx);
    });
    panelsEl.querySelectorAll(".tab-panel").forEach(function (p, i) {
      p.classList.toggle("active", i === idx);
    });
    animateCharts(panelsEl.querySelector(".tab-panel.active"));
  }

  function buildPanel(m, i) {
    var panel = document.createElement("section");
    panel.className = "tab-panel glass-card" + (i === 0 ? " active" : "");

    // 標頭：名稱、日期、記錄連結
    var head = document.createElement("div");
    head.className = "meeting-head";
    head.innerHTML =
      '<div class="m-date">' + window.esc(m.name) + '<span>' + window.esc(m.date) + '</span></div>' +
      (m.record && m.record !== "#" || m.record === "#"
        ? '<a class="record-link" href="' + window.esc(m.record || "#") + '" target="_blank" rel="noopener">📄 會議記錄</a>'
        : "");
    panel.appendChild(head);

    // 與會代表
    var repsWrap = document.createElement("div");
    repsWrap.className = "reps-row";
    m.reps.forEach(function (r) {
      var chip = document.createElement("span");
      chip.className = "rep-chip";
      chip.innerHTML = '<span class="avatar">' + window.esc(window.initials(r.name)) + '</span>' +
        window.esc(r.name) + (r.grade ? ' <span class="grade">' + window.esc(r.grade) + '</span>' : "");
      repsWrap.appendChild(chip);
    });
    var repsHead = document.createElement("div");
    repsHead.className = "subhead"; repsHead.textContent = "與會學生代表";
    panel.appendChild(repsHead);
    panel.appendChild(repsWrap);

    // 統計卡
    var notPassed = Math.max(0, m.proposals - m.passed);
    var statHead = document.createElement("div");
    statHead.className = "subhead"; statHead.textContent = "提案與報告統計";
    panel.appendChild(statHead);
    var stats = document.createElement("div");
    stats.className = "stat-grid";
    [["提案總數", m.proposals], ["報告事項", m.reports], ["通過提案", m.passed], ["未通過", notPassed]]
      .forEach(function (s) {
        var c = document.createElement("div");
        c.className = "stat-card";
        c.innerHTML = '<div class="num">' + s[1] + '</div><div class="lbl">' + s[0] + '</div>';
        stats.appendChild(c);
      });
    panel.appendChild(stats);

    // 圖表列：長條（各類別提案數） + 甜甜圈（通過比例）
    var chartHead = document.createElement("div");
    chartHead.className = "subhead"; chartHead.textContent = "數據圖表";
    panel.appendChild(chartHead);
    panel.appendChild(buildCharts(m));

    // 提案內容細節
    var detHead = document.createElement("div");
    detHead.className = "subhead"; detHead.textContent = "提案內容細節";
    panel.appendChild(detHead);
    var list = document.createElement("div");
    list.className = "proposal-list";
    if (!m.details.length) {
      list.innerHTML = '<div class="state-empty">本次會議尚無提案明細。</div>';
    } else {
      m.details.forEach(function (d) {
        var item = document.createElement("div");
        item.className = "proposal-item";
        item.style.borderLeftColor = (window.CATEGORY[d.cat] || "var(--brand-teal)");
        var top = document.createElement("div");
        top.className = "p-top";
        var title = document.createElement("span");
        title.className = "p-title"; title.textContent = d.title;
        top.appendChild(title);
        top.appendChild(window.makeTag(d.cat));
        top.appendChild(window.makeBadge(d.status));
        item.appendChild(top);
        if (d.result) {
          var res = document.createElement("div");
          res.className = "p-result"; res.textContent = "表決結果：" + d.result;
          item.appendChild(res);
        }
        list.appendChild(item);
      });
    }
    panel.appendChild(list);

    return panel;
  }

  function buildCharts(m) {
    var row = document.createElement("div");
    row.className = "charts-row";

    // 長條圖：各類別提案數
    var byCat = {};
    m.details.forEach(function (d) { byCat[d.cat] = (byCat[d.cat] || 0) + 1; });
    var cats = Object.keys(byCat);
    var maxCat = Math.max(1, Math.max.apply(null, cats.map(function (c) { return byCat[c]; }).concat([1])));

    var barBox = document.createElement("div");
    barBox.className = "chart-box";
    barBox.innerHTML = '<h3>各類別提案數</h3>';
    var bars = document.createElement("div");
    bars.className = "bar-chart";
    if (!cats.length) {
      bars.innerHTML = '<div class="state-empty" style="padding:12px 0;">無資料</div>';
    } else {
      cats.forEach(function (c) {
        var pct = Math.round((byCat[c] / maxCat) * 100);
        var rowEl = document.createElement("div");
        rowEl.className = "bar-row";
        rowEl.innerHTML =
          '<div class="bar-lbl">' + window.esc(c) + '</div>' +
          '<div class="bar-track"><div class="bar-fill" data-w="' + pct + '" ' +
            'style="background:' + (window.CATEGORY[c] || "var(--brand-teal)") + '"></div></div>' +
          '<div class="bar-val">' + byCat[c] + '</div>';
        bars.appendChild(rowEl);
      });
    }
    barBox.appendChild(bars);

    // 甜甜圈：通過比例
    var pct = m.proposals ? Math.round((m.passed / m.proposals) * 100) : 0;
    var donutBox = document.createElement("div");
    donutBox.className = "chart-box";
    donutBox.innerHTML =
      '<h3>提案通過比例</h3>' +
      '<div class="donut-wrap">' +
        '<div class="donut" data-pct="' + pct + '">' +
          '<div class="donut-num"><b>' + pct + '%</b><small>通過率</small></div>' +
        '</div>' +
        '<div class="donut-legend">' +
          '<div><i style="background:var(--brand-green)"></i>通過 ' + m.passed + ' 案</div>' +
          '<div><i style="background:rgba(180,190,200,0.5)"></i>其他 ' + Math.max(0, m.proposals - m.passed) + ' 案</div>' +
        '</div>' +
      '</div>';

    row.appendChild(barBox);
    row.appendChild(donutBox);
    return row;
  }

  // 進場動畫：長條 + 甜甜圈
  function animateCharts(panel) {
    if (!panel) return;
    panel.querySelectorAll(".bar-fill").forEach(function (b) {
      b.style.width = "0";
      requestAnimationFrame(function () { b.style.width = b.getAttribute("data-w") + "%"; });
    });
    panel.querySelectorAll(".donut").forEach(function (d) {
      d.style.setProperty("--pct", "0");
      requestAnimationFrame(function () {
        d.style.transition = "none";
        var target = parseInt(d.getAttribute("data-pct"), 10) || 0;
        var start = performance.now(), dur = 900;
        function step(now) {
          var t = Math.min(1, (now - start) / dur);
          d.style.setProperty("--pct", (target * t).toFixed(1));
          if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    });
  }

  // ---------- 啟動 ----------
  window.markActiveNav();
  if (!CSV_URL) {
    render(SAMPLE);
  } else {
    // headerRow: 欄位標頭在第 3 行；dataStartRow: 資料從第 5 行開始
    window.fetchCSV(CSV_URL, { headerRow: 3, dataStartRow: 5 })
      .then(function (rows) {
        var data = fromRows(rows);
        if (!data.length) {
          console.warn("會議 CSV 讀到了，但沒有有效資料。抓到的欄位：",
            rows[0] ? Object.keys(rows[0]) : "(無)");
        }
        render(data.length ? data : SAMPLE);
      })
      .catch(function (err) {
        console.error("讀取校務會議資訊失敗，改用示範資料：", err);
        render(SAMPLE);
      });
  }
})();

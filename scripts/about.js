/* ============================================================
   about.js — 關於我們頁邏輯
   兩位代表的大頭貼、姓名、簡歷、政見（含狀態）與連結。
   預設使用下方 REPS 資料；也可改成從 Google Sheet CSV 讀取
   （把 CSV_URL 填上即可，欄位說明見底部）。

   政見狀態：預備(prep) / 執行(exec) / 完結(done) / 取消(cancel) / 失敗(fail)
   ============================================================ */
(function () {
  "use strict";

  var CSV_URL = ""; // ⚙️ 選填：若要用試算表管理政見，填上發布的 CSV 連結

  var area    = document.getElementById("repArea");
  var loading = document.getElementById("repLoading");

  // ---------- 代表資料（請直接修改這裡） ----------
  var REPS = [
    {
      name: "余兆宜",
      role: "三年級學生代表",
      photo: "https://tschool-12representative.github.io/images/余兆宜.png", // 填大頭貼網址；留空則顯示姓名首字
      bio: "文字",
      links: [
        { type: "email", label: "Email", url: "mailto:example@tschool.tp.edu.tw" },
        { type: "instagram", label: "Instagram", url: "https://instagram.com/" },
      ],
      pledges: [
        { title: "測試政見", desc: "測試內容", status: "exec" },
        { title: "測試政見", desc: "測試內容", status: "exec" },
        { title: "測試政見", desc: "測試內容", status: "exec" },
        { title: "測試政見", desc: "測試內容", status: "exec" },
        { title: "測試政見", desc: "測試內容", status: "exec" },
      ],
    },
    {
      name: "毛宇禾",
      role: "三年級學生代表",
      photo: "https://tschool-12representative.github.io/images/毛宇禾.png",
      bio: "現任「新北市第 13 屆兒童及少年代表」與「第三屆畢業籌備委員會總召」。",
      links: [
        { type: "email", label: "Email", url: "mailto:11330210@tschool.tp.edu.tw" },
        { type: "discord", label: "Discord", url: "https://discordapp.com/users/907971087650922526" },
        { type: "website", label: "個人網站", url: "https://jimmymao330.github.io" },
      ],
      pledges: [
        { title: "建置學生代表提案搜集管道", desc: "於校務會議召開前，透過線上表單等方式，系統性搜集學生之提案及訴求，並確實將學生意見於校務會議中呈現與說明，以發揮「學生代表」之實際功能與意義，使學生得以於學校制度層面產生實質影響力。", status: "prep" },
        { title: "辦理模擬校務會議", desc: "為促進學生對校務會議之了解與參與，規劃辦理「模擬校務會議」。透實際演練會議流程、提案與討論過程，使學生得以親身體驗校務會議之運作，使學生對校務會議之了解更加完整，進而提升學生對學校事務之參與與關注。", status: "prep" },
        { title: "主動向學生同步校務會議相關資訊", desc: "藉由校務會議儀表板及其他管道，主動向全體學生同步校務會議之相關資訊，提升學生對校務會議之了解，落實資訊公開透明。", status: "exec" },
        { title: "落實年級學生代表與學生自治會之溝通與監督", desc: "確實出席學生自治會例會與「各年級學生代表協商會議」，以落實與學生自治會之良好溝通，與學生自治會合作促進學生權益。同時，也確實監督學生自治會，將各年級學生之意見與建議傳達予學生自治會，以確保各年級學生之意見與想法能被確實傳遞與重視。", status: "exec" },
        { title: "推動全校評量多選題計分方式統一", desc: "目前於各學科評量（包含平時測驗與期中或期末紙筆檢核等）之「多選題」計分方式常因授課教師不同而有所差異（例如倒扣與否、扣分方式等），易使學生混淆。因此，本人將推動針對全校評量多選題之計分方式訂定統一原則;若因學科授課虛情而有不同之計分方式，亦應將實際計分方式確實載明於評量卷中，以免造成混淆與爭議。", status: "exec" },
        { title: "推動全校各科目期中預警判別標準公開化", desc: "雖然各科教師於學期初所公告之課程大綱中，皆確實載明評分歸準（計分方式、比例等），惟於期中報告書所刊載之「期中預警科目」卻缺乏明確之判別標準（部分教師採用課程大綱所載之評分歸準，另有部分教師以其他方式判別），部分教師亦未明確說明或公告期中預警之判別標準，使學生無法掌握教師之具體判別標準，影響學生之權益。故本人將推動全校各科目期中預警之判別標準公開化，提前公告或說明期中預警明確判別標準。在保留相對應彈性之前提之下，具體且確實地將標準向學生公開，以維護學生權益。", status: "exec" },
        { title: "建置校務會議儀表板", desc: "建置線上校務會議儀表板，統一呈現校務會議之相關資訊、提案資訊及各項進度，提升相關資訊之公開品質與可近性，促進學生了解、認識並實際參與學校事務。", status: "done" },
      ],
    },
  ];

  // ---------- 從 CSV 轉資料（選用） ----------
  // 欄位：姓名 | 職稱 | 大頭貼 | 簡歷 |
  //       連結(以;分隔,格式「類型:網址」,如 email:mailto:..;instagram:https:..) |
  //       政見(以||分隔,每筆「標題::說明::狀態」)
  function fromRows(rows) {
    return rows.map(function (r) {
      var links = (window.pick(r, ["連結", "link"]) || "").split(";")
        .map(function (s) { return s.trim(); }).filter(Boolean)
        .map(function (s) {
          var idx = s.indexOf(":");
          var type = s.slice(0, idx).trim();
          var url = s.slice(idx + 1).trim();
          var labels = { email: "Email", instagram: "Instagram", website: "個人網站", web: "個人網站" };
          return { type: type, label: labels[type.toLowerCase()] || type, url: url };
        });
      var pledges = (window.pick(r, ["政見", "pledge"]) || "").split("||")
        .map(function (s) { return s.trim(); }).filter(Boolean)
        .map(function (s) {
          var p = s.split("::");
          return {
            title: (p[0] || "").trim(),
            desc: (p[1] || "").trim(),
            status: window.normalizeStatus(p[2] || "prep"),
          };
        });
      return {
        name: window.pick(r, ["姓名", "name"]),
        role: window.pick(r, ["職稱", "role", "身分"]) || "三年級學生代表",
        photo: window.pick(r, ["大頭貼", "照片", "photo", "avatar"]),
        bio: window.pick(r, ["簡歷", "bio", "介紹"]),
        links: links,
        pledges: pledges,
      };
    }).filter(function (r) { return r.name; });
  }

  function render(reps) {
    if (loading) loading.remove();
    area.innerHTML = "";
    if (!reps.length) {
      area.innerHTML = '<div class="state-empty">尚無代表資訊。</div>';
      return;
    }

    var grid = document.createElement("div");
    grid.className = "rep-grid";

    reps.forEach(function (rep) {
      var card = document.createElement("div");
      card.className = "rep-card";

      // 頂部：大頭貼 + 姓名 + 職稱
      var top = document.createElement("div");
      top.className = "rep-top";
      var photo;
      if (rep.photo) {
        photo = document.createElement("img");
        photo.className = "rep-photo";
        photo.src = rep.photo;
        photo.alt = rep.name;
        photo.onerror = function () {
          var d = document.createElement("div");
          d.className = "rep-photo";
          d.textContent = window.initials(rep.name);
          photo.replaceWith(d);
        };
      } else {
        photo = document.createElement("div");
        photo.className = "rep-photo";
        photo.textContent = window.initials(rep.name);
      }
      var nameWrap = document.createElement("div");
      nameWrap.innerHTML =
        '<div class="rep-name">' + window.esc(rep.name) + '</div>' +
        '<div class="rep-role">' + window.esc(rep.role) + '</div>';
      top.appendChild(photo);
      top.appendChild(nameWrap);
      card.appendChild(top);

      // 簡歷
      if (rep.bio) {
        var bio = document.createElement("div");
        bio.className = "rep-bio"; bio.textContent = rep.bio;
        card.appendChild(bio);
      }

      // 連結
      if (rep.links && rep.links.length) {
        var links = document.createElement("div");
        links.className = "rep-links";
        rep.links.forEach(function (l) {
          var a = document.createElement("a");
          a.href = l.url;
          a.target = "_blank"
          a.innerHTML = window.esc(l.label);
          links.appendChild(a);
        });
        card.appendChild(links);
      }

      // 政見
      var plHead = document.createElement("div");
      plHead.className = "subhead"; plHead.textContent = "政見與進度";
      card.appendChild(plHead);

      var plList = document.createElement("div");
      plList.className = "pledge-list";
      if (!rep.pledges || !rep.pledges.length) {
        plList.innerHTML = '<div class="state-empty" style="padding:12px 0;">尚無政見。</div>';
      } else {
        rep.pledges.forEach(function (p) {
          var item = document.createElement("div");
          item.className = "pledge";
          var text = document.createElement("div");
          text.className = "pl-text";
          text.innerHTML = '<b>' + window.esc(p.title) + '</b>' +
            (p.desc ? window.esc(p.desc) : "");
          item.appendChild(text);
          item.appendChild(window.makeBadge(p.status, window.PLEDGE_STATUS));
          plList.appendChild(item);
        });
      }
      card.appendChild(plList);

      grid.appendChild(card);
    });

    area.appendChild(grid);
  }

  // ---------- 啟動 ----------
  window.markActiveNav();
  if (!CSV_URL) {
    render(REPS);
  } else {
    window.fetchCSV(CSV_URL)
      .then(function (rows) {
        var data = fromRows(rows);
        render(data.length ? data : REPS);
      })
      .catch(function (err) {
        console.error("讀取代表資訊失敗，改用內建資料：", err);
        render(REPS);
      });
  }
})();

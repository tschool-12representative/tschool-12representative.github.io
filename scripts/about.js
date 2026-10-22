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
      bio: "",
      links: [
        { type: "email", label: "Email", url: "mailto:11330211@tschool.tp.edu.tw" },
      ],
      pledges: [
        { title: "完善輔導支持系統：推動身心調適假後、學習困擾之輔導機制", desc: "目前本校已經有完善的學生輔導機制，透過成長導師、學習輔導教師與專輔教師的緊密合作，發揮支持每一位在校學生的穩固系統。但由於本校彈性修習課程的特殊制度，學生在校的時間相較縮短，獲得社會支持網絡的狀況也因人而異。因此，我認為包含身心調適假以後成長導師的追蹤;針對長期請假、對學習生活較難適應學生的相應支持等，應是未來需要制度化、明確化的的機制，才能有效因應本校學生的多元學習形態。", status: "prep" },
        { title: "提升心理健康知能：推動心理健康相關培力與工具", desc: "本校豐富多元的學習形態，也可能相對為需要自主管理負責的學生群體帶來壓力，進而衍生情緒、人際的困擾。照顧自身的身心狀態，是穩健學習步調的重要前提。也因此，我認為透過與學生會、校方的協商與合作，透過專案的形式，將有關自我照護、正念減壓與心理健康急救（MHFA）等知識的相關培力課程與設施導入校內，藉以提升師生對於心理健康議題的知能與應對手段。", status: "prep" },
        { title: "自治經驗垂直傳承：明確學生代表的合作與交接機制", desc: "目前的學生會代表與學生會在制度運作與實務默契上，較傾向各自獨立行使職權，而缺乏良好的合作機制。因此我認為，在未來學生群體對校務會議提案的制度建立後，應該建立學生代表間的常態會議制度，並且將學生代表納入學輔處會議參與成員中，建立橫向的溝通場域。同時建立「高一理解現況、高二主力施政、高三傳承經驗」的縱向連結，完善學生代表業務的交接機制，將長期的政策脈絡與協商默契有效的傳承，藉以暢通學生代表的提案與討論管道。", status: "prep" },
        { title: "追蹤個需課程制度：個別需求課程制度審議編年", desc: "個別需求課程是本校彈性學習制度下的一大空間，提供學生依據自己的興趣、生涯發展來規劃課程並由學校認列學分。不過，此制度也在執行過程中，也針對審查方式、授課事實標準、申請時程與分數佔比等向度歷經了多次的界定與調整。因此，我希望能夠整理目前個別需求課程制度審議的相關歷程，包含成立宗旨與制度演變的過程，供有需求的學生參閱，同時對該政策的成效進行長期的追蹤與研究，確保制度的演變逐漸貼近師生的需求。", status: "prep" },
        { title: "需求追蹤與意見徵集：建立學生代表「Office Hour」諮詢制度", desc: "鑑於發佈表單、開設信箱等被動意見收集形式成效不彰。我認為學生代表與學生面對面的商談，才是能夠有效了解學生需求、協助將具體困擾轉換為政策語言的方式。因此我希望建立學生代表的「OfficeHour」諮詢制度，提供有需要的學生可以針對學校制度上的疑義或是希望推動的改變進行諮詢，學生代表則站在對制度有完整理解的角度來提供協助，並在有必要時與校方溝通，確保學生的近用權與意見的代表性。", status: "prep" },
        { title: "政策資訊公開透明：推動校務會議與學校制度相關資料開放", desc: "學生會已經有對於會內資訊公開有完善的權限設計與決策過程。可是我發現，目前校務會議之會議記錄與某些學校制度的相關規範，並沒有完善的公開與查詢機制。因此，我希望可以建立有效的評估機制，將攸關學生權益的會議記錄與規章檔案，在不影響行政作業的情況下對校內開放，達成校務資訊進一步的公開透明與監督查核。", status: "prep" },
      ],
    },
    {
      name: "毛宇禾",
      role: "三年級學生代表",
      photo: "https://tschool-12representative.github.io/images/毛宇禾.png",
      links: [
        { type: "email", label: "Email", url: "mailto:11330210@tschool.tp.edu.tw" },
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

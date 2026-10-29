/* ============================================================
   identity.js — 關於視覺識別頁面
   - 五個設計元素（ELEMENTS 資料 → 卡片）
   - 捲動進場動畫
   - 色票點擊複製色碼
   - 圖片找不到時改用備援圖
   ============================================================ */

/* ---------- 五個設計元素 ----------
   直接修改這裡的內容即可：
   title：中文名稱　en：英文名稱　desc：設計說明
   img：元素圖片路徑（建議放在 identity/ 資料夾，留空則顯示編號色塊）
   color：卡片的強調色（色塊、編號、上方色條）                    */
var ELEMENTS = [
  {
    title: "三年級",
    en: "12 Grade",
    desc: "三個角，象徵著我們所屬的三年級，也是第三屆學生的連結。",
    img: "identity/element-1.png",
    color: "#83c3d7"
  },
  {
    title: "堅定",
    en: "Resolute",
    desc: "三角形，是最堅固的形狀之一。三年級學生代表將如同三角形一樣，堅定不宜的守護學生權益。",
    img: "identity/element-2.png",
    color: "#83c3d7"
  },
  {
    title: "行動",
    en: "Action",
    desc: "播放健，顯示著我們的效率和積極行動，以及更多不同的工作和倡議。",
    img: "identity/element-3.png",
    color: "#73bd98"
  },
  {
    title: "搞定",
    en: "Agile",
    desc: "搞定，所有交付給我們的使命與工作，是值得信任且俐落的工作態度。",
    img: "identity/element-4.png",
    color: "#73bd98"
  },
  {
    title: "溝通",
    en: "Communicate",
    desc: "縫隙與通道，象徵著溝通的機會與橋樑。我們將仔細聆聽，屬於數位實中的各種聲音。",
    img: "identity/element-5.png",
    color: "#c4c4c4"
  }
];

/* ---------- 產生設計元素卡片 ---------- */
function renderElements() {
  var grid = document.getElementById("elementGrid");
  if (!grid) return;

  ELEMENTS.forEach(function (item, i) {
    var no = String(i + 1).padStart(2, "0");

    var card = document.createElement("article");
    card.className = "el-card glass-card reveal";
    card.style.setProperty("--el-c", item.color || "var(--brand-teal)");
    card.style.setProperty("--delay", (i * 70) + "ms");

    var visual = document.createElement("div");
    visual.className = "el-visual";
    visual.innerHTML = '<span class="el-no-big">' + no + "</span>";

    if (item.img) {
      var img = document.createElement("img");
      img.src = item.img;
      img.alt = item.title;
      img.loading = "lazy";
      // 圖片載入成功才顯示，失敗則保留編號色塊
      img.onload = function () { visual.classList.add("has-img"); };
      img.onerror = function () { img.remove(); };
      visual.appendChild(img);
    }

    var body = document.createElement("div");
    body.className = "el-body";
    body.innerHTML =
      '<h3 class="el-title">' + esc(item.title) +
      '<span class="el-en">' + esc(item.en) + "</span></h3>" +
      '<p class="el-desc">' + esc(item.desc) + "</p>";

    card.appendChild(visual);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

/* HTML 轉義（本頁未載入 common.js，自備一份） */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ---------- 捲動進場動畫 ---------- */
function initReveal() {
  var items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  items.forEach(function (el) { io.observe(el); });
}

/* ---------- 色票複製 ---------- */
function initSwatches() {
  var toast = document.getElementById("idToast");
  var timer;

  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove("show"); }, 1600);
  }

  document.querySelectorAll(".swatch").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var hex = btn.getAttribute("data-hex");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(hex)
          .then(function () { showToast("已複製 " + hex); })
          .catch(function () { showToast(hex); });
      } else {
        showToast(hex);
      }
    });
  });
}

/* ---------- 圖片備援 ---------- */
function initFallbacks() {
  document.querySelectorAll("img[data-fallback]").forEach(function (img) {
    function useFallback() {
      var fb = img.getAttribute("data-fallback");
      img.removeAttribute("data-fallback");   // 只替換一次，避免無限迴圈
      if (fb) img.src = fb;
    }
    if (img.complete && img.naturalWidth === 0) useFallback();
    else img.addEventListener("error", useFallback, { once: true });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  initFallbacks();
  renderElements();
  initReveal();
  initSwatches();
});

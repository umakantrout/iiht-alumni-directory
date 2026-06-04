let indexData = null;
let members = [];
let filtered = [];
let selectedMemberNo = "";

const els = {
  search: document.getElementById("searchInput"),
  type: document.getElementById("typeFilter"),
  batch: document.getElementById("batchFilter"),
  summary: document.getElementById("summaryText"),
  list: document.getElementById("memberList"),
  detail: document.getElementById("detailPanel"),
  memberDetailsBtn: document.getElementById("memberDetailsBtn"),
  refresh: document.getElementById("refreshBtn"),
};

function money(value) {
  const num = Number(value || 0);
  return Number.isInteger(num) ? num.toLocaleString("en-IN") : num.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function docUrl(relativePath) {
  return "../" + String(relativePath || "").split("/").map(encodeURIComponent).join("/");
}

function memberSearchText(member) {
  return [
    member.memb_no,
    member.memb_name,
    member.batch,
    member.institute,
    member.mobile,
    member.current_memb,
    member.current_location,
  ].join(" ").toLowerCase();
}

async function loadIndex() {
  try {
    const response = await fetch("mobile_index.json?ts=" + Date.now());
    if (!response.ok) throw new Error("Unable to load mobile_index.json");
    indexData = await response.json();
    setupIndex(indexData);
  } catch (error) {
    els.summary.textContent = "Could not load ../mobile_index.json. Use Load index if opening from file.";
  }
}

function setupIndex(data) {
  members = Array.isArray(data.members) ? data.members : [];

  populateFilters();

  updateStatistics();

  applyFilters();
}

function populateFilters() {
  const types = [...new Set(members.map(m => m.current_memb).filter(Boolean))].sort();
  const batches = [...new Set(members.map(m => m.batch).filter(Boolean))].sort((a, b) => Number(a) - Number(b));
  els.type.innerHTML = '<option value="">All</option>' + types.map(v => `<option>${escapeHtml(v)}</option>`).join("");
  els.batch.innerHTML = '<option value="">All</option>' + batches.map(v => `<option>${escapeHtml(v)}</option>`).join("");
}

function updateStatistics(){

    document.getElementById("totalMembers").textContent =
        members.length;

    const life =
        members.filter(m =>
            String(m.current_memb || "")
            .toUpperCase()
            .includes("LIFE")
        ).length;

    const founder =
        members.filter(m =>
            String(m.current_memb || "")
            .toUpperCase()
            .includes("FOUNDER")
        ).length;

    const general =
        members.filter(m =>
            String(m.current_memb || "")
            .toUpperCase()
            .includes("GENERAL")
        ).length;

    document.getElementById("lifeMembers").textContent =
        life;

    document.getElementById("founderMembers").textContent =
        founder;

    document.getElementById("generalMembers").textContent =
        general;
}

function applyFilters() {
  const q = els.search.value.trim().toLowerCase();
  const type = els.type.value;
  const batch = els.batch.value;
  filtered = members.filter(member => {
    if (type && member.current_memb !== type) return false;
    if (batch && member.batch !== batch) return false;
    if (q && !memberSearchText(member).includes(q)) return false;
    return true;
  });
  renderList();
  els.summary.textContent = `${filtered.length} of ${members.length} members`;
}

function renderList() {
  if (!filtered.length) {
    els.list.innerHTML = '<div class="member-row"><strong>No members found</strong><span>Try another search or filter.</span></div>';
    renderEmpty();
    return;
  }

  els.list.innerHTML = filtered.map(member => `
    <button class="member-row ${member.memb_no === selectedMemberNo ? "active" : ""}" data-memb="${escapeAttr(member.memb_no)}">
      <strong>${escapeHtml(member.memb_name || "Unnamed member")}</strong>
      <span>${escapeHtml(member.memb_no)} · Batch ${escapeHtml(member.batch)} · ${escapeHtml(member.current_memb)}</span>
    </button>
  `).join("");

  if (!selectedMemberNo || !filtered.some(m => m.memb_no === selectedMemberNo)) {
    renderMember(filtered[0]);
  }
}

function renderEmpty() {
  els.detail.className = "detail-panel empty";
  els.detail.innerHTML = "<h2>Select a member</h2><p>Search or tap a member name to view card, ledger, and receipts.</p>";
}

function documentButton(title, info) {

  if (info && info.exists) {

    const link = info.url || info.mega_link;

    return `
      <div class="doc-card">
        <h3>${escapeHtml(title)}</h3>
        <a href="${link}"
           target="_blank"
           rel="noopener">
           Open
        </a>
      </div>
    `;
  }

  return `
    <div class="doc-card">
      <h3>${escapeHtml(title)}</h3>
      <span class="missing">Not available</span>
    </div>
  `;
}

function renderMember(member) {
  selectedMemberNo = member.memb_no;
  const docs = member.documents || {};
  const due = Number(member.current_due || 0);
  const receipts = Array.isArray(docs.receipts) ? docs.receipts : [];
  els.detail.className = "detail-panel";
  els.detail.innerHTML = `
    <div class="member-title">
      <div>
        <h2>${escapeHtml(member.memb_name)}</h2>
        <p>${escapeHtml(member.memb_no)} · Batch ${escapeHtml(member.batch)} · IIHT ${escapeHtml(member.institute)}</p>
      </div>
      <span class="badge">${escapeHtml(member.current_memb || "")}</span>
    </div>

    <div class="kpis">
      <div class="kpi ${due > 0 ? "due-positive" : "due-clear"}">
        <span>Current Due</span>
        <strong>${money(due)}</strong>
      </div>
      <div class="kpi">
        <span>Amount Received</span>
        <strong>${money(member.amount_received)}</strong>
      </div>
      
    </div>

    <div class="info-grid">
      <div><span>Mobile</span><strong>${escapeHtml(member.mobile || "")}</strong></div>
      <div><span>State</span><strong>${escapeHtml(member.state || "")}</strong></div>
      <div><span>Current Location</span><strong>${escapeHtml(member.current_location || "")}</strong></div>
      <div><span>Joining</span><strong>${escapeHtml(member.joining_type || "")} · ${escapeHtml(member.joining_date || "")}</strong></div>
    </div>

    <div class="action-buttons">

      <a class="wa-btn"
         href="https://wa.me/91${String(member.mobile).replace(/\D/g,'')}"
         target="_blank">

         WhatsApp

      </a>

    </div>

    <div class="detail-nav">

        <button id="homeBtn">
            Home
        </button>

    </div>

    <div class="doc-grid">
      ${documentButton("Membership Card", docs.membership_card)}
      ${documentButton("Ledger", docs.ledger)}
      ${documentButton("Receipt Folder", docs.receipt_folder)}
    </div>

    
  `;

    renderListActiveOnly();

    const homeBtn = document.getElementById("homeBtn");

    if (homeBtn) {

        homeBtn.addEventListener("click", () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        });

    }
  
}


function renderListActiveOnly() {
  document.querySelectorAll(".member-row").forEach(row => {
    row.classList.toggle("active", row.dataset.memb === selectedMemberNo);
  });
}


function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

els.search.addEventListener("input", applyFilters);
els.type.addEventListener("change", applyFilters);
els.batch.addEventListener("change", applyFilters);
els.refresh.addEventListener("click", loadIndex);
els.list.addEventListener("click", event => {
  const button = event.target.closest(".member-row[data-memb]");
  if (!button) return;
  const member = members.find(m => m.memb_no === button.dataset.memb);
  if (member) renderMember(member);
});


els.memberDetailsBtn.addEventListener("click", () => {

    if (!selectedMemberNo) return;

    window.scrollTo({
            top: els.detail.offsetTop - 15,
            behavior: "smooth"
        });

    });
    

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

loadIndex();

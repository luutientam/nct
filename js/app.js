let vulns = [];
let idcnt = 0;
let userInfo = { name: '', mssv: '', cls: '' };
let saveTimeout = null;

function getProjectFromDOM() {
  return {
    name: document.getElementById('projName')?.value || '',
    target: document.getElementById('projTarget')?.value || '',
    org: document.getElementById('projOrg')?.value || '',
    auditor: document.getElementById('projAuditor')?.value || '',
    date: document.getElementById('projDate')?.value || '',
    ver: document.getElementById('projVer')?.value || 'v1.0',
    scope: document.getElementById('projScope')?.value || '',
  };
}

function applyProjectToDOM(project) {
  if (!project) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('projName', project.name);
  set('projTarget', project.target);
  set('projOrg', project.org);
  set('projAuditor', project.auditor);
  set('projDate', project.date);
  set('projVer', project.ver || 'v1.0');
  set('projScope', project.scope);
}

function persistState() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    window.saveState({
      userInfo: { ...userInfo },
      project: getProjectFromDOM(),
      vulns: vulns.map(v => ({ ...v })),
      idcnt,
    });
  }, 300);
}

function doLogin() {
  const name = document.getElementById('li-name').value.trim();
  const mssv = document.getElementById('li-mssv').value.trim();
  const cls = document.getElementById('li-class').value.trim();
  let ok = true;
  function setErr(id, inp, show) {
    const errEl = document.getElementById(id);
    const inpEl = document.getElementById(inp);
    if (errEl) errEl.classList.toggle('show', show);
    if (inpEl) inpEl.classList.toggle('error', show);
    if (show) ok = false;
  }
  setErr('err-name', 'li-name', !name);
  setErr('err-mssv', 'li-mssv', !mssv);
  setErr('err-class', 'li-class', !cls);
  if (!ok) return;

  userInfo = { name, mssv, cls };
  document.getElementById('ub-name').textContent = name;
  document.getElementById('ub-mssv').textContent = mssv;
  document.getElementById('ub-class').textContent = cls;

  const ls = document.getElementById('loginScreen');
  ls.style.transition = 'opacity .4s ease, transform .4s ease';
  ls.style.opacity = '0';
  ls.style.transform = 'scale(1.03)';
  setTimeout(() => {
    ls.style.display = 'none';
    const ma = document.getElementById('mainApp');
    ma.style.display = 'block';
    ma.style.opacity = '0';
    ma.style.transition = 'opacity .4s ease';
    setTimeout(() => { ma.style.opacity = '1'; }, 20);
  }, 400);
  toast('Xin chào, ' + name + '! Chúc bạn làm báo cáo tốt.', 'ok');
  persistState();
}
window.doLogin = doLogin;

function doLogout() {
  document.getElementById('mainApp').style.display = 'none';
  const ls = document.getElementById('loginScreen');
  ls.style.display = 'flex';
  ls.style.opacity = '0';
  ls.style.transform = 'scale(.97)';
  ls.style.transition = 'opacity .35s ease, transform .35s ease';
  setTimeout(() => { ls.style.opacity = '1'; ls.style.transform = 'scale(1)'; }, 20);
}

function esc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function updateStats() {
  const bar = document.getElementById('statsBar');
  if (!bar) return;
  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0 };
  vulns.forEach(v => { counts[v.severity] = (counts[v.severity] || 0) + 1; });
  const cls = { CRITICAL: 'c', HIGH: 'h', MEDIUM: 'm', LOW: 'l', INFO: 'i' };
  const SEV_ORDER = window.SEV_ORDER || [];
  const SEV_VN = window.SEV_VN || {};
  bar.innerHTML = SEV_ORDER.filter(s => counts[s] > 0).map(s =>
    `<span class="sc sc-${cls[s]}"><span class="sd sd-${cls[s]}"></span>${SEV_VN[s]}: ${counts[s]}</span>`
  ).join('') + (vulns.length ? `<span class="sc" style="background:rgba(255,255,255,.05);color:#aaa;">Tổng: ${vulns.length}</span>` : '');
}

function renderVulnList() {
  const SEV_ORDER = window.SEV_ORDER || [];
  const SEV_VN = window.SEV_VN || {};
  const list = document.getElementById('vulnList');
  const empty = document.getElementById('emptyState');
  if (list) list.innerHTML = vulns.map((v, i) => `
    <div class="vcard ${v.open ? 'open' : ''}" id="vc-${v.id}">
      <div class="vhdr" onclick="toggleVuln(${v.id})">
        <span class="vnum">Finding #${i + 1}</span>
        <span class="vname">${esc(v.name || '(Chưa đặt tên)')}</span>
        <span class="sbadge s-${v.severity}">${SEV_VN[v.severity]}</span>
        <div style="display:flex;gap:6px;margin-left:8px;" onclick="event.stopPropagation()">
          <button class="btn-ic del" title="Xóa" onclick="removeVuln(${v.id})">✕</button>
        </div>
        <span class="vcaret">▼</span>
      </div>
      <div class="vbody">
        <div class="fgrid">
          <div class="fg">
            <label>Tên Lỗi (Vulnerability Name)</label>
            <input type="text" value="${esc(v.name)}" oninput="updV(${v.id},'name',this.value)" placeholder="Ví dụ: SQL Injection in Login Form">
          </div>
          <div class="fg">
            <label>Mức Độ (Severity)</label>
            <select class="sel-sev sel-${v.severity}" onchange="updV(${v.id},'severity',this.value);this.className='sel-sev sel-'+this.value">
              ${SEV_ORDER.map(s => `<option value="${s}" ${v.severity === s ? 'selected' : ''}>${SEV_VN[s]} — ${s}</option>`).join('')}
            </select>
          </div>
          <div class="fg full">
            <label>Vị Trí Lỗi (Location / Endpoint)</label>
            <input type="text" value="${esc(v.location)}" oninput="updV(${v.id},'location',this.value)" placeholder="Ví dụ: POST /api/login, tham số: username">
          </div>
          <div class="fg full">
            <label>Cách Khai Thác (Exploitation)</label>
            <textarea oninput="updV(${v.id},'exploit',this.value)" placeholder="Mô tả chi tiết cách tấn công, payload, bước thực hiện...">${esc(v.exploit)}</textarea>
          </div>
          <div class="fg full">
            <label>Khuyến Nghị (Recommendation)</label>
            <textarea oninput="updV(${v.id},'recommend',this.value)" placeholder="Hướng dẫn khắc phục, biện pháp bảo vệ...">${esc(v.recommend)}</textarea>
          </div>
          <div class="fg full">
            <label>Tham Chiếu (References)</label>
            <textarea oninput="updV(${v.id},'refs',this.value)" style="min-height:65px" placeholder="CVE-XXXX-XXXX, OWASP Top 10, CWE-XXX, https://...">${esc(v.refs)}</textarea>
          </div>
        </div>
      </div>
    </div>
  `).join('');
  if (empty) empty.style.display = vulns.length ? 'none' : 'block';
  updateStats();
}

function addVuln() {
  idcnt++;
  vulns.push({ id: idcnt, name: '', location: '', exploit: '', severity: 'HIGH', recommend: '', refs: '', open: true });
  renderVulnList();
  setTimeout(() => {
    const el = document.getElementById('vc-' + idcnt);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
  persistState();
}

function removeVuln(id) {
  vulns = vulns.filter(v => v.id !== id);
  renderVulnList();
  persistState();
}

function toggleVuln(id) {
  const v = vulns.find(x => x.id === id);
  if (v) v.open = !v.open;
  renderVulnList();
}

function updV(id, field, val) {
  const v = vulns.find(x => x.id === id);
  if (v) {
    v[field] = val;
    updateStats();
  }
  if (field === 'name' || field === 'severity') {
    const card = document.getElementById('vc-' + id);
    if (card) {
      const nm = card.querySelector('.vname');
      const bd = card.querySelector('.sbadge');
      if (nm) nm.textContent = val || '(Chưa đặt tên)';
      if (field === 'severity' && bd) { bd.className = 'sbadge s-' + val; bd.textContent = (window.SEV_VN || {})[val] || val; }
    }
  }
  persistState();
}

function clearAll() {
  if (!confirm('Xóa tất cả dữ liệu?')) return;
  vulns = [];
  idcnt = 0;
  ['projName', 'projTarget', 'projOrg', 'projAuditor', 'projDate', 'projVer', 'projScope'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id === 'projVer' ? 'v1.0' : '';
  });
  renderVulnList();
  toast('Đã xóa tất cả dữ liệu.', 'ok');
  persistState();
}

function getProj() {
  return {
    name: document.getElementById('projName')?.value || 'Bao Cao Kiem Thu Bao Mat',
    target: document.getElementById('projTarget')?.value || '—',
    org: document.getElementById('projOrg')?.value || '—',
    auditor: document.getElementById('projAuditor')?.value || '—',
    date: document.getElementById('projDate')?.value || new Date().toISOString().slice(0, 10),
    ver: document.getElementById('projVer')?.value || 'v1.0',
    scope: document.getElementById('projScope')?.value || '—',
    leaderName: userInfo.name || '—',
    leaderMSSV: userInfo.mssv || '—',
    leaderClass: userInfo.cls || '—',
  };
}

function fmtDate(d) {
  if (!d) return '—';
  const p = d.split('-');
  return `${p[2]}/${p[1]}/${p[0]}`;
}

function toast(msg, type = 'ok') {
  const icons = { ok: '✅', er: '❌', in: '⏳' };
  const t = document.getElementById('toast');
  if (!t) return;
  const el = document.createElement('div');
  el.className = `tmsg ${type}`;
  el.innerHTML = `<span class="ti">${icons[type]}</span><span>${msg}</span>`;
  t.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = 'all .3s';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}

function init() {
  const projDateEl = document.getElementById('projDate');
  if (projDateEl && !projDateEl.value) projDateEl.value = new Date().toISOString().slice(0, 10);

  ['projName', 'projTarget', 'projOrg', 'projAuditor', 'projDate', 'projVer', 'projScope'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', persistState);
  });

  const btnLogin = document.getElementById('btnLogin');
  if (btnLogin) btnLogin.addEventListener('click', doLogin);
  ['li-name', 'li-mssv', 'li-class'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  });

  const loadState = window.loadState;
  if (typeof loadState !== 'function') {
    renderVulnList();
    return;
  }
  loadState().then(state => {
    if (state && state.userInfo) {
      userInfo = state.userInfo;
      document.getElementById('ub-name').textContent = userInfo.name || '—';
      document.getElementById('ub-mssv').textContent = userInfo.mssv || '—';
      document.getElementById('ub-class').textContent = userInfo.cls || '—';
    }
    if (state && state.project) applyProjectToDOM(state.project);
    if (state && Array.isArray(state.vulns)) {
      vulns = state.vulns;
      idcnt = state.idcnt != null ? state.idcnt : idcnt;
    }
    renderVulnList();
    if (userInfo.name) {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('mainApp').style.display = 'block';
    }
  }).catch(() => renderVulnList());

  window.vulns = vulns;
}

window.doLogout = doLogout;
window.addVuln = addVuln;
window.removeVuln = removeVuln;
window.toggleVuln = toggleVuln;
window.updV = updV;
window.clearAll = clearAll;
window.getProj = getProj;
window.fmtDate = fmtDate;
window.toast = toast;
Object.defineProperty(window, 'vulns', {
  get() { return vulns; },
  set(v) { vulns = v; },
  configurable: true,
});

document.addEventListener('DOMContentLoaded', init);

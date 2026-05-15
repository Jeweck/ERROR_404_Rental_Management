(function () {

  const style = document.createElement('style');
  style.textContent = `
    html, body { margin: 0; padding: 0; }

    .dashboard-container { display: flex; min-height: 100vh; }

    .sidebar-dashboard {
      position: fixed;
      top: 0; left: 0;
      height: 100vh;
      width: 64px;
      background: #214466;
      border-right: none;
      display: flex !important;
      flex-direction: column;
      z-index: 50;
      overflow: hidden;
      transition: width 0.28s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.28s ease;
      box-shadow: 3px 0 12px rgba(0,0,0,0.15);
    }

    .sidebar-dashboard:hover {
      width: 220px;
      box-shadow: 6px 0 24px rgba(0,0,0,0.2);
    }

    /* ── Logo area ── */
    .sidebar-top {
      padding: 10px 0;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      min-height: 70px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      overflow: hidden;
      flex-shrink: 0;
    }

    .sidebar-logo-wrap {
      width: 64px;
      min-width: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .sidebar-logo-img {
      width: 42px;
      height: 42px;
      object-fit: contain;
      border-radius: 10px;
      background: rgba(255,255,255,0.08);
      padding: 4px;
      flex-shrink: 0;
    }

    .sidebar-logo-text {
      font-size: 13px; font-weight: 700; color: #ffffff;
      margin-left: 4px; opacity: 0; white-space: nowrap;
      transition: opacity 0.2s 0.08s; letter-spacing: 0.01em;
    }

    .sidebar-dashboard:hover .sidebar-logo-text { opacity: 1; }

    /* ── Nav ── */
    .nav-menu {
      flex: 1; display: flex; flex-direction: column;
      gap: 4px; padding: 12px 8px; overflow: hidden;
    }

    .nav-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      height: 46px;
      border: none;
      border-radius: 10px;
      background: transparent;
      color: rgba(255,255,255,0.65);
      font-size: 13px; font-weight: 600;
      cursor: pointer; white-space: nowrap; overflow: hidden;
      transition: background 0.18s, color 0.18s, transform 0.15s;
      width: 100%; text-align: left; font-family: inherit;
      padding: 0;
    }

    .nav-icon-wrap {
      width: 48px;
      min-width: 48px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .nav-btn i {
      font-size: 17px;
      transition: color 0.18s;
    }

    .nav-label {
      opacity: 0;
      transition: opacity 0.18s 0.06s;
      font-size: 13px; font-weight: 600;
      padding-right: 12px;
    }

    .sidebar-dashboard:hover .nav-label { opacity: 1; }

    .nav-btn:hover {
      background: rgba(255,255,255,0.12);
      color: #ffffff;
      transform: translateX(2px);
    }

    .nav-btn.active {
      background: rgba(44,150,205,0.25);
      color: #ffffff;
    }

    .nav-btn.active i { color: #5bbfed; }

    .nav-btn.active::before {
      content: '';
      position: absolute; left: 0; top: 50%;
      transform: translateY(-50%);
      width: 3px; height: 26px;
      background: #2C96CD;
      border-radius: 0 3px 3px 0;
    }

    /* Tooltip */
    .nav-tooltip {
      position: fixed; left: 72px;
      background: #1a1a1a; color: #fff;
      font-size: 11px; font-weight: 600;
      padding: 5px 10px; border-radius: 6px;
      white-space: nowrap; pointer-events: none;
      opacity: 0; transition: opacity 0.15s; z-index: 9999;
    }

    .nav-btn:hover .nav-tooltip { opacity: 1; }
    .sidebar-dashboard:hover .nav-tooltip { opacity: 0 !important; }

    /* ── Bottom / Logout ── */
    .sidebar-bottom {
      padding: 8px 8px 16px;
      border-top: 1px solid rgba(255,255,255,0.08);
      overflow: hidden;
      flex-shrink: 0;
    }

    .logout-btn {
      position: relative;
      display: flex; align-items: center;
      justify-content: flex-start;
      height: 46px; border: none; border-radius: 10px;
      background: none;
      color: rgba(255,100,100,0.85);
      font-size: 13px; font-weight: 600;
      cursor: pointer; white-space: nowrap; overflow: hidden;
      transition: background 0.18s, transform 0.15s;
      width: 100%; text-align: left; font-family: inherit;
      padding: 0;
    }

    .logout-icon-wrap {
      width: 48px; min-width: 48px; height: 46px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .logout-btn i { font-size: 17px; }

    .logout-btn .nav-label {
      opacity: 0; transition: opacity 0.18s 0.06s;
    }

    .sidebar-dashboard:hover .logout-btn .nav-label { opacity: 1; }

    .logout-btn:hover {
      background: rgba(239,68,68,0.15);
      color: #ff6b6b;
      transform: translateX(2px);
    }

    /* ── Content offset ── */
    .dashboard-content { margin-left: 64px !important; flex: 1; min-width: 0; }
    .dashboard-header { left: 64px !important; width: calc(100vw - 64px) !important; }
  `;
  document.head.appendChild(style);

  function injectSidebar() {
    const existing = document.querySelector('aside.sidebar-dashboard');
    if (existing) existing.remove();

    const page = window.location.pathname.split('/').pop() || 'dashboard.html';

    let userData = null;
    try { userData = JSON.parse(localStorage.getItem('userData')); } catch(e) {}
    const isTenant = userData && userData.role === 'tenant';
    const dashboardPage = isTenant ? 'tenant-dashboard.html' : 'dashboard.html';

    const active = (name) => {
      if (name === 'dashboard.html') {
        return (page === 'dashboard.html' || page === 'tenant-dashboard.html') ? 'active' : '';
      }
      return page === name ? 'active' : '';
    };

    const aside = document.createElement('aside');
    aside.className = 'sidebar-dashboard';
    aside.innerHTML = `
      <div class="sidebar-top">
        <div class="sidebar-logo-wrap">
          <img class="sidebar-logo-img" src="685667950_851931460606770_7624076952502804008_n-removebg-preview.png" alt="Logo">
        </div>
        <span class="sidebar-logo-text">Rentflow</span>
      </div>
      <nav class="nav-menu">
        <button class="nav-btn ${active('dashboard.html')}" data-href="${dashboardPage}">
          <span class="nav-icon-wrap"><i class="fas fa-chart-line"></i></span>
          <span class="nav-label">Dashboard</span>
          <span class="nav-tooltip">Dashboard</span>
        </button>
        <button class="nav-btn ${active('tenants.html')}" id="sidebar-tenants-btn" data-href="tenants.html">
          <span class="nav-icon-wrap"><i class="fas fa-users"></i></span>
          <span class="nav-label">Tenants</span>
          <span class="nav-tooltip">Tenants</span>
        </button>
        <button class="nav-btn ${active('room-details.html')}" id="sidebar-room-btn" data-href="room-details.html">
          <span class="nav-icon-wrap"><i class="fas fa-home"></i></span>
          <span class="nav-label">Room Details</span>
          <span class="nav-tooltip">Room Details</span>
        </button>
        <button class="nav-btn ${active('payment.html')}" data-href="payment.html">
          <span class="nav-icon-wrap"><i class="fas fa-credit-card"></i></span>
          <span class="nav-label">Payment</span>
          <span class="nav-tooltip">Payment</span>
        </button>
        <button class="nav-btn ${active('settings.html')}" data-href="settings.html">
          <span class="nav-icon-wrap"><i class="fas fa-cog"></i></span>
          <span class="nav-label">Settings</span>
          <span class="nav-tooltip">Settings</span>
        </button>
      </nav>
      <div class="sidebar-bottom">
        <button class="logout-btn" id="sidebar-logout-btn">
          <span class="logout-icon-wrap"><i class="fas fa-sign-out-alt"></i></span>
          <span class="nav-label">Logout</span>
        </button>
      </div>
    `;

    document.body.insertBefore(aside, document.body.firstChild);

    aside.querySelectorAll('.nav-btn[data-href]').forEach(btn => {
      btn.addEventListener('click', () => { window.location.href = btn.dataset.href; });
    });

    document.getElementById('sidebar-logout-btn').addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('userData');
        localStorage.removeItem('rememberedEmail');
        window.location.href = 'index.html';
      }
    });

    if (isTenant) {
      const t = document.getElementById('sidebar-tenants-btn');
      const r = document.getElementById('sidebar-room-btn');
      if (t) t.style.display = 'none';
      if (r) r.style.display = 'none';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSidebar);
  } else {
    injectSidebar();
  }

})();
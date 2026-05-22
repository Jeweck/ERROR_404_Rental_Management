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

    .nav-icon-wrap svg {
      width: 20px;
      height: 20px;
      fill: rgba(255,255,255,0.65);
      transition: fill 0.18s;
      flex-shrink: 0;
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

    .nav-btn:hover .nav-icon-wrap svg { fill: #ffffff; }

    .nav-btn.active {
      background: rgba(44,150,205,0.25);
      color: #ffffff;
    }

    .nav-btn.active .nav-icon-wrap svg { fill: #5bbfed; }

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

    .logout-icon-wrap svg {
      width: 20px;
      height: 20px;
      fill: rgba(255,100,100,0.85);
      transition: fill 0.18s;
    }

    .logout-btn .nav-label {
      opacity: 0; transition: opacity 0.18s 0.06s;
    }

    .sidebar-dashboard:hover .logout-btn .nav-label { opacity: 1; }

    .logout-btn:hover {
      background: rgba(239,68,68,0.15);
      color: #ff6b6b;
      transform: translateX(2px);
    }

    .logout-btn:hover .logout-icon-wrap svg { fill: #ff6b6b; }

    /* ── Content offset ── */
    .dashboard-content { margin-left: 64px !important; flex: 1; min-width: 0; }
    .dashboard-header { left: 64px !important; width: calc(100vw - 64px) !important; }

    /* ── Mobile fixes ── */
    @media (max-width: 768px) {
      .dashboard-content {
        margin-left: 64px !important;
        width: calc(100vw - 64px) !important;
        overflow-x: hidden !important;
        padding: 12px !important;
      }
      .dashboard-header {
        left: 64px !important;
        width: calc(100vw - 64px) !important;
        padding: 10px 12px !important;
      }
      .sidebar-dashboard:hover {
        width: 64px !important;
        box-shadow: 3px 0 12px rgba(0,0,0,0.15) !important;
      }
      .sidebar-dashboard:hover .nav-label { opacity: 0 !important; }
      .sidebar-dashboard:hover .sidebar-logo-text { opacity: 0 !important; }
      .sidebar-dashboard:hover .logout-btn .nav-label { opacity: 0 !important; }
    }
  `;
  document.head.appendChild(style);

  const ICONS = {
    dashboard: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg>`,
    tenants:   `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
    room:      `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    payment:   `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>`,
    settings:  `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a6.97 6.97 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.47.47 0 0 0-.59.22L2.74 8.87a.47.47 0 0 0 .12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.47.47 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.47.47 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
    logout:    `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>`,
  };

  function injectSidebar() {
    const existing = document.querySelector('aside.sidebar-dashboard');
    if (existing) existing.remove();

    const page = window.location.pathname.split('/').pop() || 'dashboard.html';

    let userData = null;
    try { userData = JSON.parse(localStorage.getItem('userData')); } catch(e) {}
    const isTenant = userData && userData.role === 'tenant';
    const dashboardPage = isTenant ? 'dashboard-tenant.html' : 'dashboard.html';

    const active = (name) => {
      if (name === 'dashboard.html') {
        return (page === 'dashboard.html' || page === 'dashboard-tenant.html') ? 'active' : '';
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
          <span class="nav-icon-wrap">${ICONS.dashboard}</span>
          <span class="nav-label">Dashboard</span>
          <span class="nav-tooltip">Dashboard</span>
        </button>
        <button class="nav-btn ${active('tenants.html')}" id="sidebar-tenants-btn" data-href="tenants.html">
          <span class="nav-icon-wrap">${ICONS.tenants}</span>
          <span class="nav-label">Tenants</span>
          <span class="nav-tooltip">Tenants</span>
        </button>
        <button class="nav-btn ${active('room-details.html')}" id="sidebar-room-btn" data-href="room-details.html">
          <span class="nav-icon-wrap">${ICONS.room}</span>
          <span class="nav-label">Room Details</span>
          <span class="nav-tooltip">Room Details</span>
        </button>
        <button class="nav-btn ${active('payment.html')}" data-href="payment.html">
          <span class="nav-icon-wrap">${ICONS.payment}</span>
          <span class="nav-label">Payment</span>
          <span class="nav-tooltip">Payment</span>
        </button>
        <button class="nav-btn ${active('settings.html')}" data-href="settings.html">
          <span class="nav-icon-wrap">${ICONS.settings}</span>
          <span class="nav-label">Settings</span>
          <span class="nav-tooltip">Settings</span>
        </button>
      </nav>
      <div class="sidebar-bottom">
        <button class="logout-btn" id="sidebar-logout-btn">
          <span class="logout-icon-wrap">${ICONS.logout}</span>
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
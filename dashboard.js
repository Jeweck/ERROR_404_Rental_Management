// Dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
    applyRoleRestrictions();
    loadUserProfile();
    initializeCharts();
    setupNavigation();
});

// ── USER PROFILE ─────────────────────────────────────────────────────
function loadUserProfile() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) return;

    const nameEl  = document.getElementById('userProfileName');
    const emailEl = document.getElementById('userProfileEmail');
    const avatarEl = document.getElementById('userAvatar');

    if (nameEl)  nameEl.textContent  = userData.username || userData.name || 'User Name';
    if (emailEl) emailEl.textContent = userData.email || 'user@email.com';

    if (avatarEl) {
        // Initials from FULL NAME for avatar (e.g. Jerick Ubaldo → JU)
        const nameParts = (userData.name || '').trim().split(' ').filter(Boolean);
        let initials = '';
        if (nameParts.length >= 2) {
            initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else if (nameParts.length === 1) {
            initials = nameParts[0].slice(0, 2).toUpperCase();
        } else if (userData.email) {
            initials = userData.email.slice(0, 2).toUpperCase();
        }
        avatarEl.textContent = initials;
    }
}

// ── ROLE-BASED RESTRICTIONS ─────────────────────────────────────────
function applyRoleRestrictions() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData) {
            window.location.replace('index.html');
            return;
        }
        if (userData.role === 'tenant') {
            const tenantsBtn     = document.getElementById('tenants-btn');
            const roomDetailsBtn = document.getElementById('room-details-btn');
            if (tenantsBtn)     tenantsBtn.style.display     = 'none';
            if (roomDetailsBtn) roomDetailsBtn.style.display = 'none';
        }
    } catch (e) {
        window.location.replace('index.html');
    }
}

// ── CHARTS ───────────────────────────────────────────────────────────
function initializeCharts() {
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: ['May', 'June', 'July', 'Aug', 'Sep', 'Oct'],
                datasets: [{
                    label: 'Revenue',
                    data: [65000, 75000, 82000, 78000, 95000, 125500],
                    borderColor: '#2980b9',
                    backgroundColor: 'rgba(41, 128, 185, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#2980b9',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₱' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
}

// ── NAVIGATION ───────────────────────────────────────────────────────
function setupNavigation() {
    const pageMap = {
        'dashboard-btn':    'dashboard.html',
        'tenants-btn':      'tenants.html',
        'room-details-btn': 'room-details.html',
        'payment-btn':      'payment.html',
        'settings-btn':     'settings.html'
    };

    Object.entries(pageMap).forEach(([id, url]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => window.location.href = url);
        }
    });

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('userData');
                localStorage.removeItem('rememberedEmail');
                window.location.href = 'index.html';
            }
        });
    }
}

// ── DROPDOWN MENU ────────────────────────────────────────────────────
function toggleMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    const menu = event.currentTarget.nextElementSibling;
    document.querySelectorAll('.dropdown-menu').forEach(m => {
        if (m !== menu) m.classList.remove('show');
    });
    menu.classList.toggle('show');
}

document.addEventListener('click', (event) => {
    if (!event.target.closest('.action-menu')) {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    }
});

// ── EDIT / DELETE ROW ────────────────────────────────────────────────
function editRow(event) {
    event.preventDefault();
    const row = event.currentTarget.closest('tr');
    const tenantName = row.cells[1].textContent;
    const unit       = row.cells[2].textContent;
    const amount     = row.cells[3].textContent;
    alert(`Edit: ${tenantName} - ${unit} - ${amount}`);
}

function deleteRow(event) {
    event.preventDefault();
    const row        = event.currentTarget.closest('tr');
    const tenantName = row.cells[1].textContent;
    if (confirm(`Are you sure you want to delete ${tenantName}'s record?`)) {
        row.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => row.remove(), 300);
    }
}
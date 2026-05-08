// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupPaymentMethods();
    setupAddReceiptButton();
    loadUsername();
    setupLogout();
    updateCurrentPageIndicator();
});

// Update Current Page Indicator
function updateCurrentPageIndicator() {
    const currentPage = 'Payment';
    const pill = document.querySelector('.current-page-pill');
    if (pill) {
        pill.textContent = currentPage;
    }
}

// Setup Logout
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            localStorage.removeItem('rememberedEmail');
            localStorage.removeItem('selectedPaymentMethod');
            window.location.href = 'index.html';
        });
    }
}

// Setup Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const pageMap = {
        'dashboard-btn': 'dashboard.html',
        'tenants-btn': 'tenants.html',
        'room-details-btn': 'room-details.html',
        'payment-btn': 'payment.html',
        'settings-btn': 'settings.html'
    };

    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const btnId = this.id;
            if (pageMap[btnId]) {
                navigateToPage(pageMap[btnId]);
            }
        });
    });
}

// Navigate to Page
function navigateToPage(pageName) {
    window.location.href = pageName;
}

// Setup Payment Methods
function setupPaymentMethods() {
    const paymentBtns = document.querySelectorAll('.payment-method-btn');
    
    paymentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            paymentBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Store selected payment method
            const method = this.getAttribute('data-method');
            localStorage.setItem('selectedPaymentMethod', method);
        });
    });

    // Load previously selected payment method
    const savedMethod = localStorage.getItem('selectedPaymentMethod');
    if (savedMethod) {
        const savedBtn = document.querySelector(`.payment-method-btn[data-method="${savedMethod}"]`);
        if (savedBtn) {
            savedBtn.classList.add('active');
        }
    }
}

// Setup Add Receipt Button
function setupAddReceiptButton() {
    const addReceiptBtn = document.getElementById('add-receipt-btn');
    if (addReceiptBtn) {
        addReceiptBtn.addEventListener('click', function() {
            alert('Add Receipt feature coming soon!');
        });
    }
}

// Load Username from localStorage
function loadUsername() {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
        const username = savedEmail.split('@')[0];
        const maskedName = maskUsername(username);
        document.getElementById('username').textContent = username;
        document.getElementById('user-display').textContent = maskedName;
    }
}

// Mask username for display
function maskUsername(username) {
    if (username.length <= 3) {
        return username;
    }
    const firstChar = username[0];
    const lastChar = username[username.length - 1];
    const middleLength = username.length - 2;
    const stars = '*'.repeat(Math.max(1, middleLength));
    return `${firstChar}${stars}${lastChar}`;
}

// Pay Button Handler
document.addEventListener('DOMContentLoaded', function() {
    const payButton = document.querySelector('.pay-button');
    if (payButton) {
        payButton.addEventListener('click', function() {
            const selectedMethod = localStorage.getItem('selectedPaymentMethod');
            
            if (!selectedMethod) {
                alert('Please select a payment method first!');
                return;
            }

            // Show confirmation
            const confirmPay = confirm(`Confirm payment of ₱1600.00 via ${selectedMethod === 'gcash' ? 'GCash' : 'Bank Transfer'}?`);
            if (confirmPay) {
                alert('Payment processed successfully!');
                // You can add backend integration here
            }
        });
    }
});
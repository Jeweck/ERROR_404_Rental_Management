// Login Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');

    // Load remembered email if it exists
    loadRememberedEmail();

    // Handle form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validate inputs
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }

        // Save email if "Remember me" is checked
        if (rememberMeCheckbox.checked) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        // ── Firebase Auth Login ──────────────────────────────────────
        import("https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js").then(({ initializeApp }) => {
        import("https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js").then(({ getAuth, signInWithEmailAndPassword }) => {
        import("https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js").then(({ getFirestore, doc, getDoc }) => {

            const firebaseConfig = {
                apiKey: "AIzaSyAGd7Aaiu_d-VIokG16gapCZOlpGheb9tY",
                authDomain: "rentalmangemnetsystem.firebaseapp.com",
                projectId: "rentalmangemnetsystem",
                storageBucket: "rentalmangemnetsystem.firebasestorage.app",
                messagingSenderId: "143952534193",
                appId: "1:143952534193:web:1a0dc97e5e0f10fde16090"
            };

            const app  = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db   = getFirestore(app);

            signInWithEmailAndPassword(auth, email, password)
                .then(async (userCredential) => {
                    const user = userCredential.user;

                    // Try to get extra info (name, role) from Firestore 'users' collection
                    let name = user.displayName || email.split('@')[0];
                    let role = 'tenant'; // default role

                    try {
                        const userDoc = await getDoc(doc(db, 'users', user.uid));
                        if (userDoc.exists()) {
                            const data = userDoc.data();
                            name = data.name  || name;
                            role = data.role  || role;
                        }
                    } catch (err) {
                        console.warn('Could not fetch user doc:', err);
                    }

                    // ✅ Save complete userData to localStorage
                    localStorage.setItem('userData', JSON.stringify({
                        uid:   user.uid,
                        name:  name,
                        email: user.email,
                        role:  role
                    }));

                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                })
                .catch((error) => {
                    console.error('Login error:', error);
                    alert('Login failed: ' + error.message);
                });

        })});});
    });

    // Email validation on blur
    emailInput.addEventListener('blur', function() {
        const email = this.value.trim();
        if (email && !isValidEmail(email)) {
            this.style.borderColor = '#e74c3c';
        } else {
            this.style.borderColor = '';
        }
    });

    // Clear error on focus
    emailInput.addEventListener('focus', function() { this.style.borderColor = ''; });
    passwordInput.addEventListener('focus', function() { this.style.borderColor = ''; });
});

// Helper: validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Load remembered email from localStorage
function loadRememberedEmail() {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
    }
}

// Password visibility toggle
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
}
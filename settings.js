/**
 * settings.js — Rental Management System
 * Functional settings: General, Notifications, Account (Change Password,
 * Update Email, Update Phone) — all backed by Firebase Auth + Firestore.
 */

import { initializeApp }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, updateDoc, doc }
                                 from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    updatePassword,
    updateEmail,
    EmailAuthProvider,
    reauthenticateWithCredential,
    sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ── Firebase init ────────────────────────────────────────────────────────────
const firebaseConfig = {
    apiKey:            "AIzaSyAGd7Aaiu_d-VIokG16gapCZOlpGheb9tY",
    authDomain:        "rentalmangemnetsystem.firebaseapp.com",
    projectId:         "rentalmangemnetsystem",
    storageBucket:     "rentalmangemnetsystem.firebasestorage.app",
    messagingSenderId: "143952534193",
    appId:             "1:143952534193:web:1a0dc97e5e0f10fde16090",
    measurementId:     "G-8HXJE3259V"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── State ────────────────────────────────────────────────────────────────────
let currentUser     = null;  // Firebase Auth user
let currentUserDoc  = null;  // Firestore doc { id, ...data }

// ── Auth guard + profile load ────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = user;
    await loadUserDoc(user.uid);
    populateProfileHeader();
    loadGeneralSettings();
    loadNotificationSettings();
});

async function loadUserDoc(uid) {
    try {
        const q    = query(collection(db, 'users'), where('uid', '==', uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const d        = snap.docs[0];
            currentUserDoc = { id: d.id, ...d.data() };
        }
    } catch (e) {
        console.error('loadUserDoc error:', e);
    }
}

async function updateUserDoc(fields) {
    if (!currentUserDoc?.id) return;
    await updateDoc(doc(db, 'users', currentUserDoc.id), fields);
    Object.assign(currentUserDoc, fields);
}

// ── Header profile ───────────────────────────────────────────────────────────
function populateProfileHeader() {
    const stored = JSON.parse(localStorage.getItem('userData') || '{}');
    const name   = currentUserDoc?.username || stored.name  || 'User';
    const email  = currentUser?.email       || stored.email || '';
    setEl('userProfileName',  name);
    setEl('userProfileEmail', email);
}

// ── General Settings ─────────────────────────────────────────────────────────
const GENERAL_KEY = 'rms_general_settings';

function loadGeneralSettings() {
    const saved = JSON.parse(localStorage.getItem(GENERAL_KEY) || '{}');
    setInputVal('generalSystemName',   saved.systemName   || 'Rental Management System');
    setInputVal('generalContactEmail', saved.contactEmail || currentUser?.email || '');
    setSelectVal('generalTimezone',    saved.timezone     || '(GMT+08:00) Manila');
    setSelectVal('generalLanguage',    saved.language     || 'English (PH)');
}

window.saveGeneral = function () {
    const systemName = getInputVal('generalSystemName') || 'Rental Management System';
    const data = {
        systemName,
        contactEmail: getInputVal('generalContactEmail'),
        timezone:     getSelectVal('generalTimezone'),
        language:     getSelectVal('generalLanguage'),
    };
    localStorage.setItem(GENERAL_KEY, JSON.stringify(data));

    // ── Sync system name to index.html brand title ──────────────────────────
    // index.html reads 'rms_system_name' on load and updates .brand-title spans
    localStorage.setItem('rms_system_name', systemName);

    // If somehow we're on a page that has a .brand-title, update it live too
    applySystemNameToBrand(systemName);

    showToast('General settings saved! Login page title updated.', 'success');
};

/**
 * Writes the system name into .brand-title spans and shrinks lines 2-4
 * to fit the container — mirrors the logic in index.html.
 * Called after saveGeneral(), and exposed as window.applySystemNameToBrand
 * so index.html can invoke it too.
 */
function applySystemNameToBrand(name) {
    const el = document.querySelector('.brand-title');
    if (!el) return;

    const words = (name || '').trim().toUpperCase().split(/\s+/).slice(0, 4);
    while (words.length < 4) words.push('');

    const spans = el.querySelectorAll('span');
    spans.forEach((span, i) => { span.textContent = words[i] || ''; });
}

window.applySystemNameToBrand = applySystemNameToBrand;

// ── Notification Settings ────────────────────────────────────────────────────
const NOTIF_KEY = 'rms_notification_settings';

function loadNotificationSettings() {
    const saved = JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}');
    const defaults = { emailPayment: true, smsOverdue: true, weeklySummary: true };
    const prefs    = { ...defaults, ...saved };
    setChecked('notifEmailPayment', prefs.emailPayment);
    setChecked('notifSmsOverdue',   prefs.smsOverdue);
    setChecked('notifWeeklySummary',prefs.weeklySummary);

    // Auto-save on every toggle
    ['notifEmailPayment','notifSmsOverdue','notifWeeklySummary'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', saveNotifications);
    });
}

function saveNotifications() {
    const data = {
        emailPayment:  getChecked('notifEmailPayment'),
        smsOverdue:    getChecked('notifSmsOverdue'),
        weeklySummary: getChecked('notifWeeklySummary'),
    };
    localStorage.setItem(NOTIF_KEY, JSON.stringify(data));
    showToast('Notification preferences saved!', 'success');
}

// ── Modal system ─────────────────────────────────────────────────────────────
function openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.style.display = 'flex'; clearModalErrors(id); }
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) { m.style.display = 'none'; }
}

function clearModalErrors(modalId) {
    document.querySelectorAll(`#${modalId} .s-modal-error`).forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });
    document.querySelectorAll(`#${modalId} input`).forEach(el => el.value = '');
}

function showModalError(modalId, fieldId, msg) {
    const el = document.getElementById(fieldId);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function setModalBtn(modalId, loading) {
    const btn = document.querySelector(`#${modalId} .s-modal-submit`);
    if (!btn) return;
    btn.disabled    = loading;
    btn.textContent = loading ? 'Please wait…' : btn.dataset.label;
}

// ── Re-authentication helper ─────────────────────────────────────────────────
async function reauth(currentPassword) {
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
}

// ── Change Password ──────────────────────────────────────────────────────────
window.changePassword = () => openModal('modalChangePassword');

window.submitChangePassword = async function () {
    const current  = getInputVal('cpCurrentPassword');
    const next     = getInputVal('cpNewPassword');
    const confirm  = getInputVal('cpConfirmPassword');

    if (!current)             return showModalError('modalChangePassword', 'cpError', 'Enter your current password.');
    if (next.length < 6)      return showModalError('modalChangePassword', 'cpError', 'New password must be at least 6 characters.');
    if (next !== confirm)     return showModalError('modalChangePassword', 'cpError', 'New passwords do not match.');

    setModalBtn('modalChangePassword', true);
    try {
        await reauth(current);
        await updatePassword(currentUser, next);
        closeModal('modalChangePassword');
        showToast('Password updated successfully!', 'success');
    } catch (e) {
        const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
            ? 'Current password is incorrect.'
            : e.message;
        showModalError('modalChangePassword', 'cpError', msg);
    } finally {
        setModalBtn('modalChangePassword', false);
    }
};

// ── Update Email ─────────────────────────────────────────────────────────────
window.updateEmail = () => {
    setInputVal('ueCurrentEmail', currentUser?.email || '');
    openModal('modalUpdateEmail');
};

window.submitUpdateEmail = async function () {
    const current  = getInputVal('ueCurrentPassword');
    const newEmail = getInputVal('ueNewEmail');

    if (!current)             return showModalError('modalUpdateEmail', 'ueError', 'Enter your current password to confirm.');
    if (!newEmail.includes('@')) return showModalError('modalUpdateEmail', 'ueError', 'Enter a valid email address.');
    if (newEmail === currentUser?.email) return showModalError('modalUpdateEmail', 'ueError', 'New email is the same as current email.');

    setModalBtn('modalUpdateEmail', true);
    try {
        await reauth(current);
        await updateEmail(currentUser, newEmail);
        // Keep Firestore + localStorage in sync
        await updateUserDoc({ email: newEmail });
        const stored = JSON.parse(localStorage.getItem('userData') || '{}');
        stored.email = newEmail;
        localStorage.setItem('userData', JSON.stringify(stored));
        setEl('userProfileEmail', newEmail);

        closeModal('modalUpdateEmail');
        showToast('Email updated! A verification email has been sent.', 'success');
        await sendEmailVerification(currentUser).catch(() => {});
    } catch (e) {
        const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
            ? 'Current password is incorrect.'
            : e.code === 'auth/email-already-in-use'
            ? 'That email is already in use by another account.'
            : e.message;
        showModalError('modalUpdateEmail', 'ueError', msg);
    } finally {
        setModalBtn('modalUpdateEmail', false);
    }
};

// ── Update Phone Number ───────────────────────────────────────────────────────
window.updateNumber = () => {
    setInputVal('unCurrentPhone', currentUserDoc?.phone || '');
    openModal('modalUpdateNumber');
};

window.submitUpdateNumber = async function () {
    const phone    = getInputVal('unNewPhone').trim();
    const password = getInputVal('unCurrentPassword');

    if (!password) return showModalError('modalUpdateNumber', 'unError', 'Enter your current password to confirm.');
    if (!/^[\d\s\-\+\(\)]{7,15}$/.test(phone)) return showModalError('modalUpdateNumber', 'unError', 'Enter a valid phone number.');

    setModalBtn('modalUpdateNumber', true);
    try {
        await reauth(password);
        await updateUserDoc({ phone });

        closeModal('modalUpdateNumber');
        showToast('Phone number updated successfully!', 'success');
    } catch (e) {
        const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
            ? 'Current password is incorrect.'
            : e.message;
        showModalError('modalUpdateNumber', 'unError', msg);
    } finally {
        setModalBtn('modalUpdateNumber', false);
    }
};

// ── Toast notification ───────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
    let toast = document.getElementById('settingsToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'settingsToast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className   = `settings-toast settings-toast-${type}`;
    toast.style.display = 'block';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

// ── Section collapse toggle ──────────────────────────────────────────────────
window.toggleSection = function (header) {
    const body        = header.nextElementSibling;
    const isCollapsed = body.style.display === 'none';
    body.style.display = isCollapsed ? 'block' : 'none';
    header.classList.toggle('collapsed', !isCollapsed);
};

// ── Close modals on backdrop click ───────────────────────────────────────────
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('s-modal-overlay')) {
        e.target.style.display = 'none';
    }
});

// ── Navigation ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dashboard-btn')?.addEventListener('click',    () => window.location.href = 'dashboard.html');
    document.getElementById('tenants-btn')?.addEventListener('click',      () => window.location.href = 'tenants.html');
    document.getElementById('room-details-btn')?.addEventListener('click', () => window.location.href = 'room-details.html');
    document.getElementById('payment-btn')?.addEventListener('click',      () => window.location.href = 'payment.html');

    document.getElementById('logout-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            signOut(auth).finally(() => {
                localStorage.removeItem('userData');
                localStorage.removeItem('rememberedEmail');
                window.location.href = 'index.html';
            });
        }
    });
});

// ── DOM helpers ──────────────────────────────────────────────────────────────
function setEl(id, val)       { const e = document.getElementById(id); if (e) e.textContent = val; }
function setInputVal(id, val) { const e = document.getElementById(id); if (e) e.value = val; }
function getInputVal(id)      { return document.getElementById(id)?.value?.trim() || ''; }
function setSelectVal(id, val){ const e = document.getElementById(id); if (e) e.value = val; }
function getSelectVal(id)     { return document.getElementById(id)?.value || ''; }
function setChecked(id, val)  { const e = document.getElementById(id); if (e) e.checked = !!val; }
function getChecked(id)       { return !!document.getElementById(id)?.checked; }
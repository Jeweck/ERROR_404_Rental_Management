/**
 * tenants.js — Rental Management System
 * Full CRUD: add, edit, delete, search, filter, sort.
 * Data persists via Firestore (with localStorage fallback during load).
 */

// ── Firebase / Firestore Setup ───────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey:            "AIzaSyAGd7Aaiu_d-VIokG16gapCZOlpGheb9tY",
    authDomain:        "rentalmangemnetsystem.firebaseapp.com",
    projectId:         "rentalmangemnetsystem",
    storageBucket:     "rentalmangemnetsystem.firebasestorage.app",
    messagingSenderId: "143952534193",
    appId:             "1:143952534193:web:1a0dc97e5e0f10fde16090",
    measurementId:     "G-8HXJE3259V"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);
const TENANTS_COLLECTION = "tenants";

// ── Avatar colour pairs ──────────────────────────────────────────────────────
const AVATAR_PALETTES = [
    { bg: '#E6F1FB', text: '#0C447C' },
    { bg: '#E1F5EE', text: '#0F6E56' },
    { bg: '#EEEDFE', text: '#3C3489' },
    { bg: '#FAECE7', text: '#993C1D' },
    { bg: '#FBEAF0', text: '#993556' },
    { bg: '#EAF3DE', text: '#3B6D11' },
    { bg: '#FAEEDA', text: '#854F0B' },
];

// ── State ────────────────────────────────────────────────────────────────────
let tenants    = [];   // each item: { id (Firestore doc ID), ...fields }
let editingId  = null;
let deletingId = null;

// ── Firestore helpers ────────────────────────────────────────────────────────

/** Fetch all tenants from Firestore and refresh the table. */
async function loadTenants() {
    try {
        showTableLoading(true);
        const q      = query(collection(db, TENANTS_COLLECTION), orderBy("firstName"));
        const snap   = await getDocs(q);
        tenants      = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        console.error("Firestore load error:", err);
        tenants = [];
    } finally {
        showTableLoading(false);
        renderTable();
    }
}

/** Add a new tenant document and return the generated Firestore ID. */
async function addTenantToFirestore(data) {
    const docRef = await addDoc(collection(db, TENANTS_COLLECTION), data);
    return docRef.id;
}

/** Update an existing tenant document by Firestore document ID. */
async function updateTenantInFirestore(id, data) {
    const ref = doc(db, TENANTS_COLLECTION, id);
    await updateDoc(ref, data);
}

/** Delete a tenant document by Firestore document ID. */
async function deleteTenantFromFirestore(id) {
    const ref = doc(db, TENANTS_COLLECTION, id);
    await deleteDoc(ref);
}

// ── UI loading state ─────────────────────────────────────────────────────────
function showTableLoading(on) {
    const tbody = el('tenantsTableBody');
    const empty = el('tenantsEmptyState');
    if (!tbody) return;
    if (on) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;padding:36px;color:#aaa;font-size:13px;">
                    <i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>Loading tenants…
                </td>
            </tr>`;
        if (empty) empty.style.display = 'none';
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(t) {
    return ((t.firstName || '?')[0] + (t.lastName || '?')[0]).toUpperCase();
}

function getPalette(t) {
    const idx = ((t.firstName || '').charCodeAt(0) + (t.lastName || '').charCodeAt(0))
                % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[idx];
}

function badgeClass(status) {
    if (status === 'Active')  return 'badge-active';
    if (status === 'Overdue') return 'badge-overdue';
    return 'badge-pending';
}

function formatRent(val) {
    if (val === '' || val === null || val === undefined) return '—';
    return '&#8369;' + parseFloat(val).toLocaleString('en-PH');
}

function formatDue(day) {
    if (!day) return '—';
    const n   = parseInt(day, 10);
    const sfx = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
    return 'Day ' + n + sfx;
}

function esc(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function el(id) { return document.getElementById(id); }

// ── Modal helpers ────────────────────────────────────────────────────────────
function openModal(id)  { const m = el(id); if (m) m.classList.add('open');    }
function closeModal(id) { const m = el(id); if (m) m.classList.remove('open'); }

// ── Stats ────────────────────────────────────────────────────────────────────
function updateStats() {
    const total   = tenants.length;
    const active  = tenants.filter(t => t.status === 'Active').length;
    const overdue = tenants.filter(t => t.status === 'Overdue').length;
    const pending = tenants.filter(t => t.status === 'Pending').length;

    if (el('statTotal'))         el('statTotal').textContent         = total;
    if (el('statActive'))        el('statActive').textContent        = active;
    if (el('statOverdue'))       el('statOverdue').textContent       = overdue;
    if (el('statPending'))       el('statPending').textContent       = pending;
    if (el('tenantsCountBadge')) el('tenantsCountBadge').textContent =
        total + ' tenant' + (total !== 1 ? 's' : '');
}

// ── Table render ─────────────────────────────────────────────────────────────
function renderTable() {
    const search  = el('tenantSearchInput')  ? el('tenantSearchInput').value.toLowerCase().trim() : '';
    const status  = el('tenantStatusFilter') ? el('tenantStatusFilter').value : '';
    const sortKey = el('tenantSortBy')       ? el('tenantSortBy').value       : 'name';

    let list = tenants.filter(t => {
        const name     = (t.firstName + ' ' + t.lastName).toLowerCase();
        const room     = (t.room || '').toLowerCase();
        const okSearch = !search || name.includes(search) || room.includes(search);
        const okStatus = !status || t.status === status;
        return okSearch && okStatus;
    });

    list.sort((a, b) => {
        switch (sortKey) {
            case 'name': return (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName);
            case 'room': return (a.room || '').localeCompare(b.room || '');
            case 'rent': return (parseFloat(b.rent) || 0) - (parseFloat(a.rent) || 0);
            case 'due':  return (parseInt(a.dueDay, 10) || 0) - (parseInt(b.dueDay, 10) || 0);
            default:     return 0;
        }
    });

    const tbody = el('tenantsTableBody');
    const empty = el('tenantsEmptyState');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
    } else {
        if (empty) empty.style.display = 'none';
        tbody.innerHTML = list.map(buildRow).join('');

        tbody.querySelectorAll('.btn-edit').forEach(btn =>
            btn.addEventListener('click', () => openEdit(btn.dataset.id)));
        tbody.querySelectorAll('.btn-del').forEach(btn =>
            btn.addEventListener('click', () => openDeleteConfirm(btn.dataset.id)));
    }

    updateStats();
}

function buildRow(t) {
    const pal = getPalette(t);
    return `
        <tr>
            <td>
                <div class="tenant-name-cell">
                    <div class="tenant-avatar-circle"
                         style="background:${pal.bg};color:${pal.text};">
                        ${getInitials(t)}
                    </div>
                    <div>
                        <div class="tenant-name-text">${esc(t.firstName)} ${esc(t.lastName)}</div>
                        <div class="tenant-contact-sub">${esc(t.contact || '')}</div>
                    </div>
                </div>
            </td>
            <td>Room ${esc(t.room || '—')}</td>
            <td>${formatRent(t.rent)}</td>
            <td>${formatDue(t.dueDay)}</td>
            <td><span class="status-badge ${badgeClass(t.status)}">${esc(t.status)}</span></td>
            <td>
                <div class="tenant-action-btns">
                    <button class="t-icon-btn btn-edit" data-id="${t.id}" title="Edit">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="t-icon-btn btn-del" data-id="${t.id}" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>`;
}

// ── Open Add modal ───────────────────────────────────────────────────────────
function openAddTenant() {
    editingId = null;
    clearForm();
    if (el('tenantModalTitle')) el('tenantModalTitle').textContent = 'Add Tenant';
    openModal('tenantFormModal');
    setTimeout(() => { if (el('tFirstName')) el('tFirstName').focus(); }, 50);
}

// Expose globally so the onclick attribute in HTML also works
window.openAddTenant = openAddTenant;

// ── Open Edit modal ──────────────────────────────────────────────────────────
function openEdit(id) {
    const t = tenants.find(x => x.id === id);
    if (!t) return;
    editingId = id;

    if (el('tFirstName')) el('tFirstName').value = t.firstName || '';
    if (el('tLastName'))  el('tLastName').value  = t.lastName  || '';
    if (el('tRoom'))      el('tRoom').value      = t.room      || '';
    if (el('tRent'))      el('tRent').value      = t.rent      || '';
    if (el('tDueDay'))    el('tDueDay').value    = t.dueDay    || '';
    if (el('tMoveIn'))    el('tMoveIn').value    = t.moveIn    || '';
    if (el('tContact'))   el('tContact').value   = t.contact   || '';
    if (el('tStatus'))    el('tStatus').value    = t.status    || 'Active';

    if (el('tenantModalTitle')) el('tenantModalTitle').textContent = 'Edit Tenant';
    openModal('tenantFormModal');
    setTimeout(() => { if (el('tFirstName')) el('tFirstName').focus(); }, 50);
}

// ── Save (add or update) ─────────────────────────────────────────────────────
async function handleSave() {
    const firstName = el('tFirstName') ? el('tFirstName').value.trim() : '';
    const lastName  = el('tLastName')  ? el('tLastName').value.trim()  : '';

    if (!firstName || !lastName) {
        alert('Please enter both first name and last name.');
        return;
    }

    const saveBtn = el('saveTenantBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

    const data = {
        firstName,
        lastName,
        room:    el('tRoom')    ? el('tRoom').value.trim()    : '',
        rent:    el('tRent')    ? el('tRent').value            : '',
        dueDay:  el('tDueDay')  ? el('tDueDay').value          : '',
        moveIn:  el('tMoveIn')  ? el('tMoveIn').value          : '',
        contact: el('tContact') ? el('tContact').value.trim() : '',
        status:  el('tStatus')  ? el('tStatus').value          : 'Active',
        updatedAt: new Date().toISOString(),
    };

    try {
        if (editingId) {
            // ── UPDATE ──
            await updateTenantInFirestore(editingId, data);
            tenants = tenants.map(t =>
                t.id === editingId ? { ...t, ...data } : t
            );
        } else {
            // ── ADD ──
            data.createdAt = new Date().toISOString();
            const newId = await addTenantToFirestore(data);
            tenants.push({ id: newId, ...data });
        }

        closeModal('tenantFormModal');
        renderTable();
    } catch (err) {
        console.error("Firestore save error:", err);
        alert("Failed to save tenant. Please check your connection and try again.");
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save Tenant'; }
    }
}

// ── Delete confirm modal ─────────────────────────────────────────────────────
function openDeleteConfirm(id) {
    deletingId = id;
    const t    = tenants.find(x => x.id === id);
    const name = t ? `${t.firstName} ${t.lastName}` : 'this tenant';
    if (el('tenantConfirmMsg'))
        el('tenantConfirmMsg').textContent =
            `Are you sure you want to remove ${name}? This cannot be undone.`;
    openModal('tenantConfirmModal');
}

async function handleDelete() {
    if (!deletingId) return;

    const delBtn = el('confirmTenantDelete');
    if (delBtn) { delBtn.disabled = true; delBtn.textContent = 'Removing…'; }

    try {
        await deleteTenantFromFirestore(deletingId);
        tenants = tenants.filter(t => t.id !== deletingId);
        closeModal('tenantConfirmModal');
        renderTable();
    } catch (err) {
        console.error("Firestore delete error:", err);
        alert("Failed to remove tenant. Please check your connection and try again.");
    } finally {
        if (delBtn) { delBtn.disabled = false; delBtn.textContent = 'Remove'; }
        deletingId = null;
    }
}

// ── Clear form ───────────────────────────────────────────────────────────────
function clearForm() {
    ['tFirstName', 'tLastName', 'tRoom', 'tContact'].forEach(id => {
        if (el(id)) el(id).value = '';
    });
    if (el('tRent'))   el('tRent').value   = '';
    if (el('tDueDay')) el('tDueDay').value = '';
    if (el('tMoveIn')) el('tMoveIn').value = '';
    if (el('tStatus')) el('tStatus').value = 'Active';
}

// ── Bind events ──────────────────────────────────────────────────────────────
function bindEvents() {
    if (el('addTenantBtn'))
        el('addTenantBtn').addEventListener('click', openAddTenant);

    if (el('closeTenantFormModal'))
        el('closeTenantFormModal').addEventListener('click', () => closeModal('tenantFormModal'));
    if (el('cancelTenantForm'))
        el('cancelTenantForm').addEventListener('click', () => closeModal('tenantFormModal'));

    if (el('saveTenantBtn'))
        el('saveTenantBtn').addEventListener('click', handleSave);

    if (el('cancelTenantDelete'))
        el('cancelTenantDelete').addEventListener('click', () => closeModal('tenantConfirmModal'));
    if (el('confirmTenantDelete'))
        el('confirmTenantDelete').addEventListener('click', handleDelete);

    if (el('tenantFormModal'))
        el('tenantFormModal').addEventListener('click', function (e) {
            if (e.target === this) closeModal('tenantFormModal');
        });
    if (el('tenantConfirmModal'))
        el('tenantConfirmModal').addEventListener('click', function (e) {
            if (e.target === this) closeModal('tenantConfirmModal');
        });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeModal('tenantFormModal');
            closeModal('tenantConfirmModal');
        }
    });

    if (el('tenantFormModal'))
        el('tenantFormModal').addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && e.target.tagName !== 'SELECT' && e.target.tagName !== 'BUTTON') {
                handleSave();
            }
        });

    if (el('tenantSearchInput'))
        el('tenantSearchInput').addEventListener('input', renderTable);
    if (el('tenantStatusFilter'))
        el('tenantStatusFilter').addEventListener('change', renderTable);
    if (el('tenantSortBy'))
        el('tenantSortBy').addEventListener('change', renderTable);
}

// ── Init ─────────────────────────────────────────────────────────────────────
function init() {
    bindEvents();
    loadTenants();   // async — shows spinner, then renders
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
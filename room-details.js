/**
 * room-details.js — Rental Management System
 * Full CRUD for rooms, persisted via Firestore.
 * Photos are stored as base64 in localStorage (keyed by room Firestore ID).
 * No Firebase Storage is used — photos live entirely in the browser.
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
const ROOMS_COLLECTION = "rooms";

// ── Photo localStorage helpers ───────────────────────────────────────────────
// Photos are stored as base64 data URLs in localStorage under the key:
//   "room_photo_{firestoreDocId}"
// This means photos survive page refreshes without any server upload.

const PHOTO_KEY_PREFIX = "room_photo_";

function savePhotoLocally(roomId, base64DataUrl) {
    try {
        localStorage.setItem(PHOTO_KEY_PREFIX + roomId, base64DataUrl);
        return true;
    } catch (e) {
        // localStorage may be full (5MB limit per origin)
        console.warn("localStorage photo save failed:", e);
        return false;
    }
}

function loadPhotoLocally(roomId) {
    return localStorage.getItem(PHOTO_KEY_PREFIX + roomId) || null;
}

function deletePhotoLocally(roomId) {
    localStorage.removeItem(PHOTO_KEY_PREFIX + roomId);
}

/**
 * Converts a File object to a base64 data URL.
 * Returns a Promise<string>.
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("FileReader failed"));
        reader.readAsDataURL(file);
    });
}

// ── State ────────────────────────────────────────────────────────────────────
let rooms           = [];
let currentRoom     = 0;
let isAddingNewRoom = false;
// Holds the raw File object selected by the user (converted to base64 on save)
let pendingPhotoFile = null;

// ── Room form HTML template ──────────────────────────────────────────────────
const roomFormTemplate = `
    <div class="room-header">
        <h2 id="roomTitle">Room 101</h2>
        <div class="room-nav" id="roomNav">
            <button class="room-nav-btn" onclick="previousRoom()">
                <i class="fas fa-chevron-left"></i>
            </button>
            <span class="room-counter">1 of 1</span>
            <button class="room-nav-btn" onclick="nextRoom()">
                <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    </div>

    <style>
        .room-photo-dropzone {
            width: 100%;
            min-height: 140px;
            border: 2px dashed #d0d5dd;
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: border-color 0.2s, background 0.2s;
            background: #fafafa;
            position: relative;
            overflow: hidden;
            gap: 8px;
        }
        .room-photo-dropzone:hover,
        .room-photo-dropzone.drag-over {
            border-color: #2C96CD;
            background: #f0f8fd;
        }
        .room-photo-dropzone .drop-icon { font-size: 28px; color: #aaa; }
        .room-photo-dropzone .drop-text {
            font-size: 13px; color: #888; text-align: center; line-height: 1.5;
        }
        .room-photo-dropzone .drop-text span { color: #2C96CD; font-weight: 600; }
        .room-photo-dropzone .drop-subtext { font-size: 11px; color: #bbb; }
        .room-photo-preview {
            width: 100%; height: 100%; position: absolute; inset: 0;
            object-fit: cover; border-radius: 10px; display: none;
        }
        .room-photo-preview.visible { display: block; }
        .room-photo-remove {
            position: absolute; top: 8px; right: 8px;
            background: rgba(0,0,0,0.55); color: #fff; border: none;
            border-radius: 50%; width: 26px; height: 26px; font-size: 13px;
            cursor: pointer; display: none; align-items: center;
            justify-content: center; z-index: 2;
        }
        .room-photo-remove.visible { display: flex; }
        #roomPhotoInput { display: none; }

        .photo-size-warning {
            font-size: 11px;
            color: #e67e22;
            margin-top: 4px;
            display: none;
        }
    </style>

    <form id="roomDetailsForm" class="room-form">
        <div class="form-row">
            <div class="form-group room-image-group">
                <label style="font-size:12px;color:#777;font-weight:600;margin-bottom:6px;display:block;">Room Photo</label>
                <div class="room-photo-dropzone" id="roomPhotoDropzone" onclick="document.getElementById('roomPhotoInput').click()">
                    <img class="room-photo-preview" id="roomPhotoPreview" alt="Room photo">
                    <button type="button" class="room-photo-remove" id="roomPhotoRemove" onclick="removeRoomPhoto(event)">
                        <i class="fas fa-times"></i>
                    </button>
                    <i class="fas fa-cloud-upload-alt drop-icon" id="dropIcon"></i>
                    <div class="drop-text" id="dropText">
                        <span>Click to upload</span> or drag & drop
                    </div>
                    <div class="drop-subtext" id="dropSubtext">PNG, JPG, WEBP up to 2MB</div>
                </div>
                <input type="file" id="roomPhotoInput" accept="image/*" onchange="handleRoomPhotoSelect(event)">
                <div class="photo-size-warning" id="photoSizeWarning">
                    ⚠ Large images may not save due to storage limits. Try a smaller file.
                </div>
            </div>

            <div class="form-column">
                <div class="form-group">
                    <label>Rent amount</label>
                    <input type="text" class="rent-input" placeholder="₱ 5,000" value="5000">
                    <div class="form-divider"></div>
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <input type="text" class="address-input" placeholder="Enter address">
                    <div class="form-divider"></div>
                </div>
                <div class="form-group">
                    <label>Tenant</label>
                    <input type="text" class="tenant-input" placeholder="Select tenant">
                    <div class="form-divider"></div>
                </div>
            </div>
        </div>

        <div class="room-details-grid">
            <div class="grid-item">
                <label>Size</label>
                <div class="input-group">
                    <input type="number" class="size-input" placeholder="0" value="0">
                    <span class="unit">sqm</span>
                </div>
            </div>
            <div class="grid-item">
                <label>Room Number</label>
                <div class="input-group">
                    <input type="number" class="room-number-input" placeholder="101">
                </div>
            </div>
            <div class="grid-item">
                <label>Bedrooms</label>
                <div class="input-group">
                    <button type="button" class="adjust-btn" onclick="decrementValue(event)">−</button>
                    <input type="number" class="bedrooms-input" placeholder="3" value="3" readonly>
                    <button type="button" class="adjust-btn" onclick="incrementValue(event)">+</button>
                </div>
            </div>
            <div class="grid-item">
                <label>Bathrooms</label>
                <div class="input-group">
                    <button type="button" class="adjust-btn" onclick="decrementValue(event)">−</button>
                    <input type="number" class="bathrooms-input" placeholder="1" value="1" readonly>
                    <button type="button" class="adjust-btn" onclick="incrementValue(event)">+</button>
                </div>
            </div>
            <div class="grid-item">
                <label>Start</label>
                <input type="date" class="start-date-input" value="2026-08-06">
            </div>
            <div class="grid-item">
                <label>End</label>
                <input type="date" class="end-date-input" value="2027-06-30">
            </div>
        </div>

        <div class="payment-details-grid">
            <div class="grid-item">
                <label>Payment period</label>
                <div class="select-group">
                    <select class="pay-period-num">
                        <option>1</option><option>2</option><option>3</option>
                    </select>
                </div>
            </div>
            <div class="grid-item">
                <label>Payment period</label>
                <div class="select-group">
                    <select class="pay-period-unit">
                        <option>month</option><option>week</option><option>year</option>
                    </select>
                </div>
            </div>
            <div class="grid-item">
                <label>Past due / due soon period</label>
                <div class="select-group">
                    <select class="due-period-num">
                        <option>1</option><option>2</option><option>3</option>
                    </select>
                </div>
            </div>
            <div class="grid-item">
                <label>&nbsp;</label>
                <div class="select-group">
                    <select class="due-period-unit">
                        <option>week</option><option>month</option><option>day</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="form-actions">
            <button type="submit" class="btn btn-save" id="roomSaveBtn">Save</button>
        </div>
    </form>
`;

// ── Firestore helpers ────────────────────────────────────────────────────────

async function loadRoomsFromFirestore() {
    showListLoading(true);
    try {
        const q    = query(collection(db, ROOMS_COLLECTION), orderBy("number"));
        const snap = await getDocs(q);
        rooms      = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (err) {
        console.error("Firestore load rooms error:", err);
        rooms = [];
    } finally {
        showListLoading(false);
        generateRoomsList();
    }
}

async function addRoomToFirestore(data) {
    const docRef = await addDoc(collection(db, ROOMS_COLLECTION), data);
    return docRef.id;
}

async function updateRoomInFirestore(id, data) {
    await updateDoc(doc(db, ROOMS_COLLECTION, id), data);
}

async function deleteRoomFromFirestore(id) {
    await deleteDoc(doc(db, ROOMS_COLLECTION, id));
}

// ── UI helpers ───────────────────────────────────────────────────────────────

function showListLoading(on) {
    const container = document.getElementById('roomsContainer');
    if (!container) return;
    if (on) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;color:#aaa;font-size:13px;">
                <i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>Loading rooms…
            </div>`;
    }
}

function setSaveBtnState(loading) {
    const btn = document.getElementById('roomSaveBtn');
    if (!btn) return;
    btn.disabled    = loading;
    btn.textContent = loading ? 'Saving…' : 'Save';
}

// ── Generate rooms list ──────────────────────────────────────────────────────

function generateRoomsList() {
    const roomsContainer = document.getElementById('roomsContainer');
    if (!roomsContainer) return;
    roomsContainer.innerHTML = '';

    if (rooms.length === 0) {
        roomsContainer.innerHTML = `
            <div style="text-align:center;padding:40px;color:#bbb;font-size:13px;">
                <i class="fas fa-home" style="font-size:28px;display:block;margin-bottom:10px;"></i>
                No rooms yet. Click <strong>+ Add Room</strong> to get started.
            </div>`;
        return;
    }

    rooms.forEach((room, index) => {
        const roomItem = document.createElement('div');
        roomItem.className = 'room-item';

        // Load photo from localStorage using the room's Firestore ID
        const photoData = room.id ? loadPhotoLocally(room.id) : null;
        const photoHtml = photoData
            ? `<img src="${photoData}" alt="Room photo"
                    style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`
            : `<div class="room-item-image-placeholder"><i class="fas fa-image"></i></div>`;

        roomItem.innerHTML = `
            <div class="room-item-image">
                ${photoHtml}
                <span class="room-item-status">
                    <i class="fas fa-check-circle"></i> Active
                </span>
            </div>
            <div class="room-item-content">
                <div class="room-item-header">
                    <div>
                        <h3 class="room-item-title">${escHtml(room.address || 'Not specified')}</h3>
                    </div>
                    <div class="action-menu">
                        <button class="menu-btn" onclick="toggleRoomMenu(event)">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="dropdown-menu">
                            <button class="menu-item edit-btn" onclick="editRoom(event, ${index})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="menu-item delete-btn" onclick="deleteRoom(event, ${index})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
                <div class="room-item-price">₱ ${Number(room.rentAmount || 0).toLocaleString('en-PH')}/mo</div>
                <div class="room-item-details">
                    <div class="room-detail-item">
                        <div class="room-detail-icon"><i class="fas fa-expand"></i></div>
                        <p class="room-detail-value">${room.size || 0}</p>
                        <p class="room-detail-label">sqm</p>
                    </div>
                    <div class="room-detail-item">
                        <div class="room-detail-icon"><i class="fas fa-bed"></i></div>
                        <p class="room-detail-value">${room.bedrooms || 0}</p>
                        <p class="room-detail-label">Bedrooms</p>
                    </div>
                    <div class="room-detail-item">
                        <div class="room-detail-icon"><i class="fas fa-bath"></i></div>
                        <p class="room-detail-value">${room.bathrooms || 0}</p>
                        <p class="room-detail-label">Bathrooms</p>
                    </div>
                </div>
                <div class="room-item-meta">
                    <div class="room-item-meta-col">
                        <div class="room-item-meta-section">
                            <span class="room-item-meta-label">Tenant:</span>
                            <span class="room-item-meta-value">${escHtml(room.tenant || 'Vacant')}</span>
                            <span class="room-item-meta-date">
                                ${room.startDate
                                    ? new Date(room.startDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
                                    : '—'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        roomItem.addEventListener('click', (e) => {
            if (!e.target.closest('.action-menu')) selectRoom(index);
        });
        roomsContainer.appendChild(roomItem);
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.action-menu')) {
            document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
        }
    });
}

// ── Room selection & form ────────────────────────────────────────────────────

function selectRoom(roomIndex) {
    currentRoom = roomIndex;
    updateRoomListSelection();
    loadRoom(roomIndex);
    const container = document.getElementById('roomDetailsContainer');
    if (container) container.style.display = 'block';
}

function updateRoomListSelection() {
    document.querySelectorAll('.room-item').forEach((item, index) => {
        item.classList.toggle('active', index === currentRoom);
    });
}

function loadRoom(roomIndex) {
    isAddingNewRoom  = false;
    pendingPhotoFile = null;
    const container  = document.getElementById('roomDetailsContainer');
    const room       = rooms[roomIndex];
    container.innerHTML = roomFormTemplate;

    document.getElementById('roomTitle').textContent          = `Room ${room.number || ''}`;
    container.querySelector('.rent-input').value              = room.rentAmount  || '';
    container.querySelector('.address-input').value           = room.address     || '';
    container.querySelector('.tenant-input').value            = room.tenant      || '';
    container.querySelector('.size-input').value              = room.size        || 0;
    container.querySelector('.room-number-input').value       = room.number      || '';
    container.querySelector('.bedrooms-input').value          = room.bedrooms    || 0;
    container.querySelector('.bathrooms-input').value         = room.bathrooms   || 0;
    container.querySelector('.start-date-input').value        = room.startDate   || '';
    container.querySelector('.end-date-input').value          = room.endDate     || '';
    setSelectValue(container, '.pay-period-num',  room.payPeriodNum  || '1');
    setSelectValue(container, '.pay-period-unit', room.payPeriodUnit || 'month');
    setSelectValue(container, '.due-period-num',  room.duePeriodNum  || '1');
    setSelectValue(container, '.due-period-unit', room.duePeriodUnit || 'week');

    // Load photo from localStorage (persisted across refreshes)
    if (room.id) {
        const savedPhoto = loadPhotoLocally(room.id);
        if (savedPhoto) setRoomPhotoPreviewUrl(savedPhoto);
    }

    const nav = document.getElementById('roomNav');
    if (nav) nav.style.display = 'none';

    setupRoomForm(roomIndex);
}

function setSelectValue(container, selector, value) {
    const sel = container.querySelector(selector);
    if (sel) sel.value = value;
}

// ── Open Add Room form ───────────────────────────────────────────────────────

function openAddRoomForm() {
    isAddingNewRoom  = true;
    pendingPhotoFile = null;
    const container  = document.getElementById('roomDetailsContainer');
    container.innerHTML     = roomFormTemplate;
    container.style.display = 'block';

    document.getElementById('roomTitle').textContent            = 'New Room';
    container.querySelector('.rent-input').value                = '';
    container.querySelector('.room-number-input').value         = '';
    container.querySelector('.bedrooms-input').value            = '0';
    container.querySelector('.bathrooms-input').value           = '0';
    container.querySelector('.start-date-input').value          = '';
    container.querySelector('.end-date-input').value            = '';

    const nav = document.getElementById('roomNav');
    if (nav) nav.style.display = 'none';

    setupRoomForm(null);
}

window.openAddRoomForm = openAddRoomForm;

// ── Form submit handler ──────────────────────────────────────────────────────

function setupRoomForm(roomIndex) {
    const form = document.getElementById('roomDetailsForm');
    if (!form) return;

    setupDropzone();

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        setSaveBtnState(true);

        try {
            const data = {
                number:        parseInt(form.querySelector('.room-number-input')?.value) || (rooms.length + 101),
                rentAmount:    form.querySelector('.rent-input')?.value     || '',
                address:       form.querySelector('.address-input')?.value  || '',
                tenant:        form.querySelector('.tenant-input')?.value   || '',
                size:          parseInt(form.querySelector('.size-input')?.value) || 0,
                bedrooms:      parseInt(form.querySelector('.bedrooms-input')?.value) || 0,
                bathrooms:     parseInt(form.querySelector('.bathrooms-input')?.value) || 0,
                startDate:     form.querySelector('.start-date-input')?.value || '',
                endDate:       form.querySelector('.end-date-input')?.value   || '',
                payPeriodNum:  form.querySelector('.pay-period-num')?.value  || '1',
                payPeriodUnit: form.querySelector('.pay-period-unit')?.value || 'month',
                duePeriodNum:  form.querySelector('.due-period-num')?.value  || '1',
                duePeriodUnit: form.querySelector('.due-period-unit')?.value || 'week',
                updatedAt:     new Date().toISOString(),
            };
            // Note: photoUrl is NOT stored in Firestore — photos live in localStorage only.

            if (isAddingNewRoom) {
                // 1. Create the Firestore document to get a stable ID
                data.createdAt = new Date().toISOString();
                const newId    = await addRoomToFirestore(data);

                // 2. If a photo was selected, convert to base64 and save locally
                if (pendingPhotoFile) {
                    const base64 = await fileToBase64(pendingPhotoFile);
                    const ok     = savePhotoLocally(newId, base64);
                    if (!ok) {
                        showSizeWarning(true);
                        alert('Photo could not be saved — storage may be full. Try a smaller image.');
                    }
                }

                rooms.push({ id: newId, ...data });
                generateRoomsList();
                selectRoom(rooms.length - 1);
                alert('Room added successfully!');

            } else {
                const firestoreId = rooms[roomIndex].id;
                await updateRoomInFirestore(firestoreId, data);

                // Save new photo to localStorage if one was chosen
                if (pendingPhotoFile) {
                    const base64 = await fileToBase64(pendingPhotoFile);
                    const ok     = savePhotoLocally(firestoreId, base64);
                    if (!ok) {
                        showSizeWarning(true);
                        alert('Photo could not be saved — storage may be full. Try a smaller image.');
                    }
                }
                // If no new photo was picked, the existing one stays in localStorage untouched.

                rooms[roomIndex] = { ...rooms[roomIndex], ...data };
                generateRoomsList();
                updateRoomListSelection();
                alert('Room updated successfully!');
            }

            pendingPhotoFile = null;

        } catch (err) {
            console.error("Save room error:", err);
            alert("Failed to save room. Please check your connection and try again.\n\nError: " + err.message);
        } finally {
            setSaveBtnState(false);
        }
    });
}

function showSizeWarning(show) {
    const el = document.getElementById('photoSizeWarning');
    if (el) el.style.display = show ? 'block' : 'none';
}

// ── Room photo handlers ──────────────────────────────────────────────────────

function handleRoomPhotoSelect(event) {
    const file = event.target.files[0];
    if (file) applyRoomPhoto(file);
}

function applyRoomPhoto(file) {
    // 2MB soft limit — base64 inflates ~33%, so a 2MB file becomes ~2.7MB in localStorage
    if (file.size > 2 * 1024 * 1024) {
        alert('Please choose an image under 2MB to ensure it can be saved in your browser.');
        return;
    }

    pendingPhotoFile = file;
    showSizeWarning(false);

    // Show an instant preview using an object URL (will be replaced by base64 on save)
    const objectUrl = URL.createObjectURL(file);
    setRoomPhotoPreviewUrl(objectUrl);
}

function setRoomPhotoPreviewUrl(url) {
    const preview   = document.getElementById('roomPhotoPreview');
    const removeBtn = document.getElementById('roomPhotoRemove');
    const icon      = document.getElementById('dropIcon');
    const text      = document.getElementById('dropText');
    const subtext   = document.getElementById('dropSubtext');
    if (!preview) return;

    preview.src = url;
    preview.classList.add('visible');
    removeBtn.classList.add('visible');
    if (icon)    icon.style.display    = 'none';
    if (text)    text.style.display    = 'none';
    if (subtext) subtext.style.display = 'none';
}

function removeRoomPhoto(event) {
    event.stopPropagation();
    pendingPhotoFile = null;
    showSizeWarning(false);

    const preview   = document.getElementById('roomPhotoPreview');
    const removeBtn = document.getElementById('roomPhotoRemove');
    const icon      = document.getElementById('dropIcon');
    const text      = document.getElementById('dropText');
    const subtext   = document.getElementById('dropSubtext');
    const input     = document.getElementById('roomPhotoInput');

    if (preview)   { preview.src = ''; preview.classList.remove('visible'); }
    if (removeBtn)  removeBtn.classList.remove('visible');
    if (icon)      icon.style.display    = '';
    if (text)      text.style.display    = '';
    if (subtext)   subtext.style.display = '';
    if (input)     input.value           = '';

    // If editing an existing room, also clear the saved photo from localStorage
    if (!isAddingNewRoom && rooms[currentRoom]?.id) {
        deletePhotoLocally(rooms[currentRoom].id);
        generateRoomsList(); // refresh list to remove the photo thumbnail
    }
}

function setupDropzone() {
    const dropzone = document.getElementById('roomPhotoDropzone');
    if (!dropzone) return;

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) applyRoomPhoto(file);
    });
}

window.handleRoomPhotoSelect = handleRoomPhotoSelect;
window.removeRoomPhoto       = removeRoomPhoto;

// ── Delete room ──────────────────────────────────────────────────────────────

async function deleteRoom(event, index) {
    event.preventDefault();
    event.stopPropagation();
    const room = rooms[index];
    if (!confirm(`Are you sure you want to delete Room ${room.number || room.address || ''}? This cannot be undone.`)) return;

    try {
        await deleteRoomFromFirestore(room.id);
        // Also remove the locally stored photo
        if (room.id) deletePhotoLocally(room.id);

        rooms.splice(index, 1);
        generateRoomsList();

        const container = document.getElementById('roomDetailsContainer');
        if (container) container.style.display = 'none';
    } catch (err) {
        console.error("Firestore delete room error:", err);
        alert("Failed to delete room. Please check your connection and try again.");
    }
}

// ── Edit room ────────────────────────────────────────────────────────────────

function editRoom(event, index) {
    event.preventDefault();
    event.stopPropagation();
    selectRoom(index);
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
}

// ── Navigation ───────────────────────────────────────────────────────────────

function previousRoom() { if (currentRoom > 0) selectRoom(currentRoom - 1); }
function nextRoom()     { if (currentRoom < rooms.length - 1) selectRoom(currentRoom + 1); }

window.previousRoom   = previousRoom;
window.nextRoom       = nextRoom;
window.incrementValue = incrementValue;
window.decrementValue = decrementValue;
window.toggleRoomMenu = toggleRoomMenu;
window.editRoom       = editRoom;
window.deleteRoom     = deleteRoom;

// ── Increment / Decrement ────────────────────────────────────────────────────

function incrementValue(event) {
    event.preventDefault();
    const input = event.target.closest('.input-group')?.querySelector('input[type="number"]');
    if (input) input.value = parseInt(input.value || 0) + 1;
}

function decrementValue(event) {
    event.preventDefault();
    const input = event.target.closest('.input-group')?.querySelector('input[type="number"]');
    if (input && parseInt(input.value) > 0) input.value = parseInt(input.value) - 1;
}

// ── Toggle dropdown menu ─────────────────────────────────────────────────────

function toggleRoomMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    const menu     = event.currentTarget.nextElementSibling;
    const allMenus = document.querySelectorAll('.dropdown-menu');
    allMenus.forEach(m => { if (m !== menu) m.classList.remove('show'); });
    menu.classList.toggle('show');
}

// ── Escape helper ─────────────────────────────────────────────────────────────

function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Navigation setup ─────────────────────────────────────────────────────────

function setupNavigation() {
    document.getElementById('dashboard-btn')?.addEventListener('click', () => window.location.href = 'dashboard.html');
    document.getElementById('tenants-btn')?.addEventListener('click',  () => window.location.href = 'tenants.html');
    document.getElementById('payment-btn')?.addEventListener('click',  () => window.location.href = 'payment.html');
    document.getElementById('settings-btn')?.addEventListener('click', () => window.location.href = 'settings.html');
}

function setupLogoutButton() {
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('userData');
            localStorage.removeItem('rememberedEmail');
            window.location.href = 'index.html';
        }
    });
}

function loadUserProfile() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) return;

    const nameEl   = document.getElementById('userProfileName');
    const emailEl  = document.getElementById('userProfileEmail');
    const avatarEl = document.getElementById('userAvatar');

    if (nameEl)  nameEl.textContent  = userData.username || userData.name || 'User Name';
    if (emailEl) emailEl.textContent = userData.email || 'user@email.com';

    if (avatarEl) {
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
// ── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
    loadUserProfile();
    setupNavigation();
    setupLogoutButton();
    loadRoomsFromFirestore();
});
/* ===== Event Planner - Core App Logic ===== */

const STORAGE_KEY = 'eventPlannerData_v1';

// Generate simple unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// Default data structure
function getDefaultData() {
  return {
    events: [],
    currentEventId: null,
    settings: {
      currency: '₹',
      defaultColumns: {
        returnGift: true,
        shagan: true,
        rooms: true,
        address: true
      }
    }
  };
}

// Load data from localStorage
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const data = JSON.parse(raw);
    // Ensure structure
    if (!data.events) data.events = [];
    if (!data.settings) data.settings = getDefaultData().settings;
    return data;
  } catch (e) {
    console.error('Failed to load data', e);
    return getDefaultData();
  }
}

// Save data to localStorage
function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('Failed to save data', e);
    alert('Could not save data. Storage may be full.');
    return false;
  }
}

// Get current event
function getCurrentEvent() {
  const data = loadData();
  if (!data.currentEventId) return null;
  return data.events.find(e => e.id === data.currentEventId) || null;
}

// Set current event
function setCurrentEvent(eventId) {
  const data = loadData();
  data.currentEventId = eventId;
  saveData(data);
}

// Create a new main event
function createEvent(name, date = '') {
  const data = loadData();
  const event = {
    id: generateId(),
    name: name.trim(),
    date: date,
    createdAt: new Date().toISOString(),
    subEvents: [
      { id: generateId(), name: 'Main Event', date: date, isDefault: true }
    ],
    guests: [],
    columnConfig: {
      returnGift: true,
      shagan: true,
      rooms: true,
      address: true,
      side: false,
      notes: false
    },
    documents: [],
    budget: {
      total: 0,
      categories: []
    }
  };
  data.events.push(event);
  data.currentEventId = event.id;
  saveData(data);
  return event;
}

// Update an event
function updateEvent(eventId, updates) {
  const data = loadData();
  const idx = data.events.findIndex(e => e.id === eventId);
  if (idx === -1) return null;
  data.events[idx] = { ...data.events[idx], ...updates };
  saveData(data);
  return data.events[idx];
}

// Delete an event
function deleteEvent(eventId) {
  const data = loadData();
  data.events = data.events.filter(e => e.id !== eventId);
  if (data.currentEventId === eventId) {
    data.currentEventId = data.events.length ? data.events[0].id : null;
  }
  saveData(data);
}

// Add sub-event
function addSubEvent(eventId, name, date = '') {
  const data = loadData();
  const event = data.events.find(e => e.id === eventId);
  if (!event) return null;
  const sub = { id: generateId(), name: name.trim(), date, isDefault: false };
  event.subEvents.push(sub);
  saveData(data);
  return sub;
}

// Guest helpers
function addGuest(eventId, guestData) {
  const data = loadData();
  const event = data.events.find(e => e.id === eventId);
  if (!event) return null;

  const guest = {
    id: generateId(),
    headName: guestData.headName || '',
    phone: guestData.phone || '',
    totalPeople: guestData.totalPeople || 1,
    members: guestData.members || [],
    address: guestData.address || '',
    side: guestData.side || '',
    notes: guestData.notes || '',
    returnGift: guestData.returnGift || false,
    shagan: guestData.shagan || 0,
    rooms: guestData.rooms || 0,
    roomType: guestData.roomType || '',
    subEventStatus: {},
    createdAt: new Date().toISOString()
  };

  // Initialize status for all existing sub-events
  event.subEvents.forEach(se => {
    guest.subEventStatus[se.id] = {
      invited: true,
      confirmed: false,
      attended: false
    };
  });

  event.guests.push(guest);
  saveData(data);
  return guest;
}

function updateGuest(eventId, guestId, updates) {
  const data = loadData();
  const event = data.events.find(e => e.id === eventId);
  if (!event) return null;
  const idx = event.guests.findIndex(g => g.id === guestId);
  if (idx === -1) return null;
  event.guests[idx] = { ...event.guests[idx], ...updates };
  saveData(data);
  return event.guests[idx];
}

function deleteGuest(eventId, guestId) {
  const data = loadData();
  const event = data.events.find(e => e.id === eventId);
  if (!event) return;
  event.guests = event.guests.filter(g => g.id !== guestId);
  saveData(data);
}

// Calculate summary stats
function getEventStats(event, subEventId = null) {
  if (!event) return null;
  const guests = event.guests || [];

  let invited = 0, confirmed = 0, attended = 0;
  let totalPeople = 0, totalShagan = 0, totalRooms = 0, returnGiftPending = 0;

  guests.forEach(g => {
    totalPeople += Number(g.totalPeople) || 0;
    totalShagan += Number(g.shagan) || 0;
    totalRooms += Number(g.rooms) || 0;
    if (!g.returnGift) returnGiftPending++;

    if (subEventId && g.subEventStatus && g.subEventStatus[subEventId]) {
      const st = g.subEventStatus[subEventId];
      if (st.invited) invited++;
      if (st.confirmed) confirmed++;
      if (st.attended) attended++;
    } else if (!subEventId) {
      // Overall: count if invited to any
      const anyInvited = Object.values(g.subEventStatus || {}).some(s => s.invited);
      const anyConfirmed = Object.values(g.subEventStatus || {}).some(s => s.confirmed);
      const anyAttended = Object.values(g.subEventStatus || {}).some(s => s.attended);
      if (anyInvited) invited++;
      if (anyConfirmed) confirmed++;
      if (anyAttended) attended++;
    }
  });

  return {
    totalFamilies: guests.length,
    totalPeople,
    invited,
    confirmed,
    attended,
    totalShagan,
    totalRooms,
    returnGiftPending
  };
}

// Format currency
function formatMoney(amount) {
  const data = loadData();
  const symbol = data.settings?.currency || '₹';
  return symbol + Number(amount || 0).toLocaleString('en-IN');
}

// Simple CSV export helper
function exportGuestsToCSV(event, subEventId = null, columns = null) {
  if (!event || !event.guests) return '';

  const headers = ['Family Head', 'Phone', 'Total People', 'Members', 'Address'];
  if (event.columnConfig?.returnGift !== false) headers.push('Return Gift');
  if (event.columnConfig?.shagan !== false) headers.push('Shagan Received');
  if (event.columnConfig?.rooms !== false) headers.push('Rooms Allotted', 'Room Type');
  if (event.columnConfig?.side) headers.push('Side');
  if (event.columnConfig?.notes) headers.push('Notes');

  if (subEventId) {
    headers.push('Invited', 'Confirmed', 'Attended');
  }

  const rows = event.guests.map(g => {
    const row = [
      g.headName || '',
      g.phone || '',
      g.totalPeople || 1,
      (g.members || []).join('; '),
      g.address || ''
    ];
    if (event.columnConfig?.returnGift !== false) row.push(g.returnGift ? 'Yes' : 'No');
    if (event.columnConfig?.shagan !== false) row.push(g.shagan || 0);
    if (event.columnConfig?.rooms !== false) {
      row.push(g.rooms || 0);
      row.push(g.roomType || '');
    }
    if (event.columnConfig?.side) row.push(g.side || '');
    if (event.columnConfig?.notes) row.push(g.notes || '');

    if (subEventId) {
      const st = (g.subEventStatus && g.subEventStatus[subEventId]) || {};
      row.push(st.invited ? 'Yes' : 'No');
      row.push(st.confirmed ? 'Yes' : 'No');
      row.push(st.attended ? 'Yes' : 'No');
    }
    return row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// Download helper
function downloadFile(content, filename, mime = 'text/csv') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// WhatsApp share helper
function openWhatsApp(phone, message = '') {
  let clean = String(phone).replace(/\D/g, '');
  if (clean.length === 10) clean = '91' + clean; // assume India
  const url = `https://wa.me/${clean}${message ? '?text=' + encodeURIComponent(message) : ''}`;
  window.open(url, '_blank');
}

// Make functions available globally
window.App = {
  loadData,
  saveData,
  getCurrentEvent,
  setCurrentEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  addSubEvent,
  addGuest,
  updateGuest,
  deleteGuest,
  getEventStats,
  formatMoney,
  exportGuestsToCSV,
  downloadFile,
  openWhatsApp,
  generateId
};

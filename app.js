const ticketTypes = {
  entry: { name: 'Entry only', details: 'Event entry', price: 10000 },
  drink: { name: 'Entry + drink', details: 'Event entry + one drink', price: 20000 },
  bus: { name: 'Beach bus', details: 'Return transport + drink + entry', price: 35000 }
};

const storageKey = 'beach-cruize-paid-tickets';
const checkoutModal = document.querySelector('#checkoutModal');
const successModal = document.querySelector('#successModal');
const adminModal = document.querySelector('#adminModal');
const qrModal = document.querySelector('#qrModal');
const checkoutForm = document.querySelector('#checkoutForm');
let selectedTicket = 'entry';

const formatMoney = (amount) => new Intl.NumberFormat('en-US').format(amount);
const getBookings = () => JSON.parse(localStorage.getItem(storageKey) || '[]');
const saveBookings = (bookings) => localStorage.setItem(storageKey, JSON.stringify(bookings));
const shareTitle = 'Beach Cruize at Ragga Deez Beach';
const shareText = 'Join us for Beach Cruize on 3 October 2026 at Ragga Deez Beach. Tickets from 10,000 UGX.';
const configuredShareUrl = document.querySelector('meta[name="share-url"]')?.content.trim();

function eventUrl() {
  const currentUrl = new URL(window.location.href);
  const configuredUrl = configuredShareUrl ? new URL(configuredShareUrl, currentUrl) : currentUrl;
  configuredUrl.hash = '';
  return configuredUrl.href;
}

function hasPublicShareUrl() {
  return /^https?:$/.test(new URL(eventUrl()).protocol);
}

function configureShareLinks() {
  const shareUrl = eventUrl();
  const socialPreviewUrl = document.querySelector('meta[property="og:url"]');
  if (socialPreviewUrl && hasPublicShareUrl()) socialPreviewUrl.content = shareUrl;

  if (!hasPublicShareUrl()) {
    document.querySelector('#qrNote').textContent = 'Set the public site URL in the share-url meta tag before sharing this code.';
    return;
  }

  const url = encodeURIComponent(shareUrl);
  const text = encodeURIComponent(`${shareText} ${shareUrl}`);
  document.querySelector('[data-share="whatsapp"]').href = `https://wa.me/?text=${text}`;
  document.querySelector('[data-share="facebook"]').href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  document.querySelector('[data-share="x"]').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${url}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=420x420&margin=12&data=${url}`;
  document.querySelector('#qrImage').src = qrUrl;
  document.querySelector('#qrPreview').src = qrUrl;
  document.querySelector('#qrDownload').href = qrUrl;
  document.querySelector('#qrDownloadHome').href = qrUrl;
}

configureShareLinks();
document.querySelector('#shareButton').addEventListener('click', async () => {
  if (!hasPublicShareUrl()) {
    document.querySelector('#shareLinks').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  if (navigator.share) {
    try {
      await navigator.share({ title: shareTitle, text: shareText, url: eventUrl() });
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }
  document.querySelector('#shareLinks').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

document.querySelector('[data-share="copy"]').addEventListener('click', async () => {
  if (!hasPublicShareUrl()) return;
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(eventUrl());
  } else {
    const copyField = document.createElement('textarea');
    copyField.value = eventUrl();
    document.body.appendChild(copyField);
    copyField.select();
    document.execCommand('copy');
    copyField.remove();
  }
  document.querySelector('[data-share="copy"]').textContent = 'Copied';
  window.setTimeout(() => { document.querySelector('[data-share="copy"]').textContent = 'Copy link'; }, 1800);
});

document.querySelector('#qrButton').addEventListener('click', () => openModal(qrModal));
document.querySelector('#qrButtonHome').addEventListener('click', () => openModal(qrModal));

function openModal(modal) {
  modal.hidden = false;
}

function closeModal(modal) {
  modal.hidden = true;
}

function selectTicket(ticketKey) {
  selectedTicket = ticketKey;
  const ticket = ticketTypes[ticketKey];
  document.querySelector('#selectedTicketName').textContent = ticket.name;
  document.querySelector('#selectedTicketDetails').textContent = ticket.details;
  document.querySelector('#selectedTicketPrice').textContent = `${formatMoney(ticket.price)} UGX`;
  openModal(checkoutModal);
  checkoutModal.querySelector('input[name="name"]').focus();
}

function renderAdmin() {
  const bookings = getBookings();
  const revenue = bookings.reduce((total, booking) => total + booking.price, 0);
  const busSeats = bookings.filter((booking) => booking.type === 'bus').length;
  document.querySelector('#peoplePaid').textContent = bookings.length;
  document.querySelector('#totalRevenue').textContent = formatMoney(revenue);
  document.querySelector('#busSeats').textContent = busSeats;

  const rows = document.querySelector('#bookingRows');
  if (!bookings.length) {
    rows.innerHTML = '<tr><td colspan="4" class="empty-state">No paid tickets yet. They will appear here.</td></tr>';
    return;
  }

  rows.innerHTML = bookings.slice().reverse().map((booking) => `
    <tr>
      <td><strong>${escapeHtml(booking.name)}</strong><br><small>${escapeHtml(booking.phone)}</small></td>
      <td>${escapeHtml(booking.ticketName)}</td>
      <td>${escapeHtml(booking.reference)}</td>
      <td class="amount-cell">${formatMoney(booking.price)}</td>
    </tr>`).join('');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[character]));
}

document.querySelectorAll('.choose-ticket').forEach((button) => {
  button.addEventListener('click', () => selectTicket(button.dataset.ticket));
});

function recordBooking(form, ticketKey) {
  const formData = new FormData(form);
  const ticket = ticketTypes[ticketKey];
  const booking = {
    id: `BC-${Date.now().toString().slice(-6)}`,
    name: formData.get('name').trim(),
    phone: formData.get('phone').trim(),
    reference: formData.get('reference').trim(),
    type: ticketKey,
    ticketName: ticket.name,
    price: ticket.price,
    createdAt: new Date().toISOString()
  };
  const bookings = getBookings();
  bookings.push(booking);
  saveBookings(bookings);
  form.reset();
  const feedback = form.querySelector('.ticket-feedback');
  feedback.textContent = `Your ticket has been submitted. Booking code: ${booking.id}`;
  feedback.hidden = false;
  document.querySelector('#bookingCode').textContent = booking.id;
  openModal(successModal);
}

document.querySelectorAll('.ticket-booking-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    recordBooking(form, form.dataset.ticket);
  });
});

document.querySelectorAll('[data-close]').forEach((button) => {
  button.addEventListener('click', () => closeModal(button.closest('.modal-backdrop')));
});

document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) closeModal(backdrop);
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') document.querySelectorAll('.modal-backdrop:not([hidden])').forEach(closeModal);
});

checkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(checkoutForm);
  const ticket = ticketTypes[selectedTicket];
  const booking = {
    id: `BC-${Date.now().toString().slice(-6)}`,
    name: formData.get('name').trim(),
    phone: formData.get('phone').trim(),
    reference: formData.get('reference').trim(),
    type: selectedTicket,
    ticketName: ticket.name,
    price: ticket.price,
    createdAt: new Date().toISOString()
  };
  const bookings = getBookings();
  bookings.push(booking);
  saveBookings(bookings);
  document.querySelector('#bookingCode').textContent = booking.id;
  checkoutForm.reset();
  closeModal(checkoutModal);
  openModal(successModal);
});

document.querySelector('#clearBookings').addEventListener('click', () => {
  if (getBookings().length && window.confirm('Clear all paid ticket records on this device?')) {
    saveBookings([]);
    renderAdmin();
  }
});

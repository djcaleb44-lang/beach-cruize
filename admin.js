const storageKey = 'beach-cruize-paid-tickets';
const getBookings = () => JSON.parse(localStorage.getItem(storageKey) || '[]');
const saveBookings = (bookings) => localStorage.setItem(storageKey, JSON.stringify(bookings));
const formatMoney = (amount) => new Intl.NumberFormat('en-US').format(amount);

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[character]));
}

function renderAdmin() {
  const bookings = getBookings();
  const revenue = bookings.reduce((total, booking) => total + booking.price, 0);
  animateNumber(document.querySelector('#peoplePaid'), bookings.length);
  animateNumber(document.querySelector('#totalRevenue'), revenue);
  animateNumber(document.querySelector('#busSeats'), bookings.filter((booking) => booking.type === 'bus').length);
  document.querySelector('#bookingRows').innerHTML = bookings.length
    ? bookings.slice().reverse().map((booking) => `<tr><td><strong>${escapeHtml(booking.name)}</strong><br><small>${escapeHtml(booking.phone)}</small></td><td>${escapeHtml(booking.ticketName)}</td><td>${escapeHtml(booking.reference)}</td><td class="amount-cell">${formatMoney(booking.price)}</td></tr>`).join('')
    : '<tr><td colspan="4" class="empty-state">No paid tickets yet.</td></tr>';
}

function animateNumber(element, target) {
  const duration = 650;
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = formatMoney(Math.round(target * eased));
    if (progress < 1) window.requestAnimationFrame(update);
  };
  window.requestAnimationFrame(update);
}

document.querySelector('#adminLoginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const validLogin = formData.get('password') === 'nexahouseug';
  if (!validLogin) {
    document.querySelector('#adminLoginError').hidden = false;
    return;
  }
  document.querySelector('#adminLoginView').hidden = true;
  document.querySelector('#adminDashboardView').hidden = false;
  document.querySelector('#adminLoginError').hidden = true;
  event.currentTarget.reset();
  renderAdmin();
});

document.querySelector('#adminLogout').addEventListener('click', () => {
  document.querySelector('#adminDashboardView').hidden = true;
  document.querySelector('#adminLoginView').hidden = false;
});

document.querySelector('#clearBookings').addEventListener('click', () => {
  if (getBookings().length && window.confirm('Clear all paid ticket records on this device?')) {
    saveBookings([]);
    renderAdmin();
  }
});

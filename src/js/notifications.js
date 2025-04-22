function showNotification(message, type) {
  const notifications = document.getElementById('notifications');
  const item = document.createElement('li');
  item.className = `notification-item ${type}`;
  item.innerHTML = `
    <span>${message}</span>
    <span class="notification-close"></span>
    <div class="notification-progress-bar"></div>
  `;
  item.querySelector('.notification-close').addEventListener('click', () => item.remove());
  notifications.appendChild(item);
  setTimeout(() => item.remove(), 5000);
}
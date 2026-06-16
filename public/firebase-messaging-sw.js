// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Parse Firebase configuration parameters from registration URL query string
const params = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  storageBucket: params.get('storageBucket'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId')
};

// Check if valid config was passed
if (firebaseConfig.projectId && firebaseConfig.messagingSenderId) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Handle background push messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Background message payload:', payload);
    
    const notificationTitle = payload.notification?.title || payload.data?.title || 'JobInk Update';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'You have a new notification from JobInk.',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: payload.data,
      tag: payload.data?.jobId || 'jobink-alert',
      renotify: true
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.warn('[firebase-messaging-sw.js] Initialized without Firebase configuration query parameters.');
}

// Handle notification click event: focus existing tab or open a new one
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = new URL('/dashboard', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find if there is an active tab open
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window/tab if none exists
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

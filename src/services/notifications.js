import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, app } from '../firebase/config';

const TOKEN_KEY = 'jobink_fcm_token';

// Lazy-load Firebase Messaging and request push notification permission
export const initializeNotificationToken = async (userId) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[notifications] Push notifications are not supported on this device/browser.');
    return null;
  }

  try {
    // 1. Check current permission state
    let permission = Notification.permission;
    
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.log('[notifications] Push notification permission was denied or not granted yet.');
      return null;
    }

    // 2. Dynamic import of Firebase Messaging SDK to keep bundle size small on initial load
    const { getMessaging, getToken } = await import('firebase/messaging');
    const messaging = getMessaging(app);

    // 3. Construct URL configuration parameters for Service Worker registration
    const configParams = new URLSearchParams({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
    }).toString();

    // 4. Register FCM Service Worker with dynamic config parameters
    const swUrl = `/firebase-messaging-sw.js?${configParams}`;
    const registration = await navigator.serviceWorker.register(swUrl);
    console.log('[notifications] FCM Service Worker registered scope:', registration.scope);

    // 5. Retrieve FCM push token from Firebase
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;
    if (!vapidKey) {
      console.warn('[notifications] VITE_FIREBASE_VAPID_KEY is missing from environment. Token request may fail.');
    }

    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: vapidKey
    });

    if (token) {
      // 6. Save token to root /fcmTokens collection in Firestore
      const tokenRef = doc(db, 'fcmTokens', token);
      await setDoc(tokenRef, {
        userId,
        token,
        deviceType: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        lastSeen: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // 7. Store locally for easy cleanup on logout
      localStorage.setItem(TOKEN_KEY, token);
      console.log('[notifications] FCM Token saved successfully.');
      return token;
    } else {
      console.warn('[notifications] Failed to retrieve FCM Registration token.');
      return null;
    }

  } catch (err) {
    // Fail silently to never break the main dashboard flow
    console.warn('[notifications] Setup failed gracefully:', err.message);
    return null;
  }
};

// Clean up current device token on logout
export const cleanUpNotificationToken = async () => {
  if (typeof window === 'undefined') return;
  
  const currentToken = localStorage.getItem(TOKEN_KEY);
  if (!currentToken) return;

  try {
    const tokenRef = doc(db, 'fcmTokens', currentToken);
    await deleteDoc(tokenRef);
    localStorage.removeItem(TOKEN_KEY);
    console.log('[notifications] FCM Registration token deleted successfully on logout.');
  } catch (err) {
    console.warn('[notifications] Graceful clean up of token failed:', err.message);
  }
};

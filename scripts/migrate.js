import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, writeBatch } from 'firebase/firestore';

// 1. Read and parse .env.local
const envPath = resolve(process.cwd(), '.env.local');
let envContent = '';
try {
  envContent = readFileSync(envPath, 'utf-8');
} catch (e) {
  console.warn("Could not read .env.local, falling back to process.env");
}

const env = {};
envContent.split('\n').forEach(line => {
  const cleanLine = line.trim();
  if (cleanLine && !cleanLine.startsWith('#')) {
    const parts = cleanLine.split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Centralized Trust Score Calculation
const calculateTrustScore = (user) => {
  let score = 0;
  if (user.phoneVerified || user.phone) score += 20;
  if (user.upiVerified) score += 20;
  if (user.selfieUrl) score += 20;
  const completed = user.completedJobs || 0;
  score += completed * 2;
  const rating = user.rating || user.averageRating || 0;
  if (rating >= 4.0) score += 20;
  return Math.min(score, 100);
};

async function runMigration() {
  console.log("Starting migration to compute trust scores...");
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    console.log(`Found ${snapshot.size} users. Processing...`);

    const batch = writeBatch(db);
    let updatedCount = 0;

    snapshot.docs.forEach((docSnap) => {
      const user = docSnap.data();
      
      const isPhoneVerified = user.phoneVerified === true || !!user.phone;
      const isUpiVerified = user.upiVerified === true;
      const isSelfieVerified = user.selfieVerified === true;

      const verified = isPhoneVerified && isUpiVerified && isSelfieVerified;
      
      let verificationStatus = user.verificationStatus || 'unverified';
      if (verified) {
        verificationStatus = 'verified';
      } else if (user.verificationStatus === 'pending' || (!isUpiVerified && user.upiQrUrl) || (!isSelfieVerified && user.selfieUrl)) {
        if (user.verificationStatus !== 'rejected') {
          verificationStatus = 'pending';
        }
      }

      const tempUser = {
        ...user,
        phoneVerified: isPhoneVerified,
        verified,
        verificationStatus
      };

      const score = calculateTrustScore(tempUser);

      const updates = {
        phoneVerified: isPhoneVerified,
        verified,
        verificationStatus,
        trustScore: score
      };

      batch.update(doc(db, 'users', docSnap.id), updates);
      updatedCount++;
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully migrated ${updatedCount} users.`);
    } else {
      console.log("No users to migrate.");
    }
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

runMigration();

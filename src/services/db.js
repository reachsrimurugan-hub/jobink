import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  getDocs, 
  addDoc, 
  onSnapshot
} from 'firebase/firestore';
import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  signInWithPopup, 
  signOut as fbSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { db, auth, googleProvider } from '../firebase/config';

// --- AUTH SERVICE ---
export const authService = {
  // Listen for auth state changes
  onAuthChanged: (callback) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            callback({ uid: firebaseUser.uid, ...userDoc.data() });
          } else {
            // User authenticated but hasn't completed onboarding fields yet
            callback({ 
              uid: firebaseUser.uid, 
              phone: firebaseUser.phoneNumber || '',
              name: firebaseUser.displayName || '',
              profilePhotoUrl: firebaseUser.photoURL || '',
              unregistered: true 
            });
          }
        } catch (err) {
          console.error("Error fetching user profile in auth changes", err);
          callback({ uid: firebaseUser.uid, phone: firebaseUser.phoneNumber || '', error: true });
        }
      } else {
        callback(null);
      }
    });
  },

  // Initiate Phone Auth with Recaptcha
  signInWithPhone: async (phoneNumber, elementId) => {
    // Clear existing verifier if any to avoid duplicate client instances or stale iframe refs
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn("Failed to clear previous recaptcha verifier:", e);
      }
      window.recaptchaVerifier = null;
    }

    // Clear container to prevent duplicate recaptcha issues
    const container = document.getElementById(elementId);
    if (container) container.innerHTML = '<div id="recaptcha-verifier"></div>';
    
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-verifier', {
      size: 'invisible',
      callback: () => {}
    });

    window.recaptchaVerifier = verifier;
    
    return await signInWithPhoneNumber(auth, phoneNumber, verifier);
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Check if user has an existing profile in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return { user: { uid: user.uid, ...userDoc.data() } };
    } else {
      return { 
        user: { 
          uid: user.uid, 
          name: user.displayName || '',
          profilePhotoUrl: user.photoURL || '',
          unregistered: true 
        } 
      };
    }
  },

  // Logout current session
  logout: async () => {
    await fbSignOut(auth);
    return true;
  },

  // Get profile data for a specific user
  getCurrentUser: async (uid) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? { uid, ...userDoc.data() } : null;
  },

  // Save/Update user profile
  saveUserProfile: async (uid, profileData) => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    const payload = {
      ...profileData,
      verified: profileData.verificationStatus === 'verified',
      updatedAt: new Date().toISOString()
    };
    
    // Split city and area for query parsing
    if (profileData.location) {
      const parts = profileData.location.split(',').map(s => s.trim());
      payload.city = parts[0] || '';
      payload.area = parts[1] || '';
    }

    if (userSnap.exists()) {
      await updateDoc(userRef, payload);
    } else {
      payload.createdAt = new Date().toISOString();
      await setDoc(userRef, payload);
    }
    return { uid, ...payload };
  },

  // Admin Queue for identity verification
  getUsersByStatus: async (status) => {
    const q = query(
      collection(db, 'users'), 
      where('verificationStatus', '==', status)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Review user verification proof (Approve/Reject)
  verifyUser: async (uid, isApproved) => {
    const status = isApproved ? 'verified' : 'rejected';
    const userRef = doc(db, 'users', uid);
    
    await updateDoc(userRef, { 
      verificationStatus: status,
      verified: isApproved
    });
    
    // Notify the user in real-time
    await notificationService.addNotification(
      uid,
      isApproved ? "Profile Verified!" : "Profile Verification Failed",
      isApproved 
        ? "Your identity has been verified. You can now access all features of WorkLink."
        : "Your identity proof was rejected by the admin. Please upload a clear photo of your Aadhaar card."
    );
    return true;
  }
};

// --- JOBS SERVICE ---
export const jobService = {
  // Post a new job
  createJob: async (jobData) => {
    const jobRef = collection(db, 'jobs');
    const payload = {
      ...jobData,
      status: 'open',
      workersSelectedCount: 0,
      applicants: [],
      selectedWorkers: [],
      createdAt: new Date().toISOString()
    };
    
    if (jobData.location) {
      const parts = jobData.location.split(',').map(s => s.trim());
      payload.city = parts[0] || '';
      payload.area = parts[1] || '';
    }
    
    const docRef = await addDoc(jobRef, payload);
    return { id: docRef.id, ...payload };
  },

  // Fetch all open jobs in a location
  getJobs: async (cityFilter, areaFilter) => {
    let q = query(
      collection(db, 'jobs'), 
      where('status', '==', 'open')
    );
    
    if (cityFilter) {
      q = query(q, where('city', '==', cityFilter));
    }
    if (areaFilter) {
      q = query(q, where('area', '==', areaFilter));
    }
    
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Get job details
  getJobById: async (id) => {
    const jobDoc = await getDoc(doc(db, 'jobs', id));
    return jobDoc.exists() ? { id: jobDoc.id, ...jobDoc.data() } : null;
  },

  // Get jobs posted by specific employer
  getMyJobs: async (employerId) => {
    const q = query(
      collection(db, 'jobs'),
      where('employerId', '==', employerId)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Mark job as completed / booked
  updateJobStatus: async (jobId, status) => {
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, { status });
    
    if (status === 'completed') {
      const jobDoc = await getDoc(jobRef);
      if (jobDoc.exists()) {
        const job = jobDoc.data();
        // Notify all selected workers that the job is complete
        job.selectedWorkers.forEach(workerId => {
          notificationService.addNotification(
            workerId,
            "Job Completed!",
            `The job "${job.title}" has been marked completed by the employer. You can now rate them.`
          );
        });
      }
    }
    return true;
  },

  // Delete job listing
  deleteJob: async (jobId) => {
    await deleteDoc(doc(db, 'jobs', jobId));
    return true;
  }
};

// --- APPLICATIONS SERVICE ---
export const applicationService = {
  // Apply for a job
  applyForJob: async (jobId, worker) => {
    const payload = {
      jobId,
      workerId: worker.uid,
      workerName: worker.name,
      workerPhone: worker.phone,
      workerSkills: worker.skills || [],
      workerRating: worker.rating || 0,
      status: 'pending',
      appliedAt: new Date().toISOString()
    };

    const appId = `${jobId}_${worker.uid}`;
    await setDoc(doc(db, 'applications', appId), payload);
    
    // Add worker uid to the job document's applicant list
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);
    if (jobSnap.exists()) {
      const applicants = jobSnap.data().applicants || [];
      if (!applicants.includes(worker.uid)) {
        await updateDoc(jobRef, {
          applicants: [...applicants, worker.uid]
        });
      }
    }
    return true;
  },

  // Get applicants for a job
  getJobApplications: async (jobId) => {
    const q = query(
      collection(db, 'applications'),
      where('jobId', '==', jobId)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
  },

  // Get applications submitted by a worker
  getWorkerApplications: async (workerId) => {
    const q = query(
      collection(db, 'applications'),
      where('workerId', '==', workerId)
    );
    const querySnapshot = await getDocs(q);
    const apps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const sortedApps = apps.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
    
    // Load related job metadata in parallel
    const appsWithJobs = await Promise.all(
      sortedApps.map(async (app) => {
        const jobDoc = await getDoc(doc(db, 'jobs', app.jobId));
        const job = jobDoc.exists() ? jobDoc.data() : {};
        return {
          ...app,
          jobTitle: job.title || 'Unknown Job',
          jobLocation: job.location || '',
          jobPayment: job.payment || '',
          jobPaymentType: job.paymentType || '',
          jobStatus: job.status || 'open'
        };
      })
    );
    return appsWithJobs;
  },

  // Approve / select / reject application status
  updateApplicationStatus: async (jobId, workerId, status) => {
    const appId = `${jobId}_${workerId}`;
    await updateDoc(doc(db, 'applications', appId), { status });
    
    const jobRef = doc(db, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);
    
    if (jobSnap.exists()) {
      const job = jobSnap.data();
      let selectedWorkers = job.selectedWorkers || [];
      
      if (status === 'selected') {
        if (!selectedWorkers.includes(workerId)) {
          selectedWorkers = [...selectedWorkers, workerId];
          const workersSelectedCount = selectedWorkers.length;
          const updates = {
            selectedWorkers,
            workersSelectedCount
          };
          // If total selected reaches workers needed, change status to booked
          if (workersSelectedCount >= (job.workersNeeded || 1)) {
            updates.status = 'booked';
          }
          await updateDoc(jobRef, updates);
          
          // Send selection alert notification
          await notificationService.addNotification(
            workerId,
            "Selected for Job!",
            `Congratulations! You have been selected for the job "${job.title}" by ${job.employerName}.`
          );
        }
      } else if (status === 'rejected') {
        selectedWorkers = selectedWorkers.filter(id => id !== workerId);
        const workersSelectedCount = selectedWorkers.length;
        const updates = {
          selectedWorkers,
          workersSelectedCount
        };
        // Re-open job if workers selection count falls below target limit
        if (workersSelectedCount < (job.workersNeeded || 1) && job.status === 'booked') {
          updates.status = 'open';
        }
        await updateDoc(jobRef, updates);
        
        // Send rejection alert notification
        await notificationService.addNotification(
          workerId,
          "Application Status Update",
          `Your application for "${job.title}" was not selected.`
        );
      }
    }
    return true;
  }
};

// --- NOTIFICATIONS SERVICE ---
export const notificationService = {
  // Listen for user notifications in real-time
  getUserNotifications: (userId, callback) => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    return onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedNotifs = notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      callback(sortedNotifs);
    });
  },

  // Post a notification document
  addNotification: async (userId, title, message) => {
    const payload = {
      userId,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'notifications'), payload);
  },

  // Mark specific notification as read
  markNotificationRead: async (id) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
    return true;
  },

  // Mark all user notifications as read
  markAllNotificationsRead: async (userId) => {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snap = await getDocs(q);
    const batchPromises = snap.docs.map(docSnap => 
      updateDoc(doc(db, 'notifications', docSnap.id), { read: true })
    );
    await Promise.all(batchPromises);
    return true;
  }
};

// --- REVIEW SERVICE ---
export const reviewService = {
  // Post review and recalculate target profile average rating score
  submitReview: async (reviewerId, reviewerName, receiverId, jobId, jobTitle, rating, comment) => {
    const payload = {
      reviewerId,
      reviewerName,
      receiverId,
      jobId,
      jobTitle,
      rating: Number(rating),
      comment,
      createdAt: new Date().toISOString()
    };

    // Save review document
    await addDoc(collection(db, 'reviews'), payload);

    // Update receiver's average rating in Firestore
    const receiverRef = doc(db, 'users', receiverId);
    const receiverSnap = await getDoc(receiverRef);
    if (receiverSnap.exists()) {
      const data = receiverSnap.data();
      const currentCount = data.ratingCount || 0;
      const currentRating = data.rating || 0;
      
      const newCount = currentCount + 1;
      const newRating = Number(((currentRating * currentCount + Number(rating)) / newCount).toFixed(1));
      
      await updateDoc(receiverRef, {
        ratingCount: newCount,
        rating: newRating
      });
    }
    return true;
  },

  // Fetch reviews received by a user
  getUserReviews: async (userId) => {
    const q = query(
      collection(db, 'reviews'),
      where('receiverId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

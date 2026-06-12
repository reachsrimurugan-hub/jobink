import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  getDocs, 
  addDoc, 
  onSnapshot,
  increment,
  limit
} from 'firebase/firestore';

import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  signInWithPopup, 
  signOut as fbSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions, googleProvider } from '../firebase/config';

// Profile In-Memory Cache to prevent redundant getDoc queries
const profileCache = new Map();

// Helper to clear profile cache on logout
export const clearProfileCache = () => {
  profileCache.clear();
};

const executeTransition = async (functionName, payload, fallbackFn) => {
  try {
    const callable = httpsCallable(functions, functionName);
    const result = await callable(payload);
    return result.data;
  } catch (error) {
    console.warn(`Cloud Function '${functionName}' failed/not deployed. Running local simulation.`, error);
    return await fallbackFn();
  }
};

// --- AUTH SERVICE ---
export const authService = {
  // Listen for auth state changes
  onAuthChanged: (callback) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            callback({ 
              uid: firebaseUser.uid, 
              email: firebaseUser.email || '', 
              ...userDoc.data() 
            });
          } else {
            // User authenticated but hasn't completed onboarding fields yet
            callback({ 
              uid: firebaseUser.uid, 
              email: firebaseUser.email || '', 
              phone: firebaseUser.phoneNumber || '',
              name: firebaseUser.displayName || '',
              profilePhotoUrl: firebaseUser.photoURL || '',
              unregistered: true 
            });
          }
        } catch (err) {
          console.error("Error fetching user profile in auth changes", err);
          callback({ 
            uid: firebaseUser.uid, 
            email: firebaseUser.email || '', 
            phone: firebaseUser.phoneNumber || '', 
            error: true 
          });
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
    clearProfileCache();
    await fbSignOut(auth);
    return true;
  },

  // Get profile data for a specific user
  getCurrentUser: async (uid) => {
    if (profileCache.has(uid)) {
      return profileCache.get(uid);
    }
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const email = (auth.currentUser && auth.currentUser.uid === uid) ? auth.currentUser.email : '';
      const userData = { uid, email: email || '', ...userDoc.data() };
      profileCache.set(uid, userData);
      return userData;
    }
    return null;
  },

  // Save/Update user profile
  saveUserProfile: async (uid, profileData) => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    const payload = {
      ...profileData,
      updatedAt: new Date().toISOString()
    };
    
    if (profileData.verificationStatus !== undefined) {
      payload.verified = profileData.verificationStatus === 'verified';
    }
    
    // Split city and area for query parsing
    if (profileData.location) {
      const parts = profileData.location.split(',').map(s => s.trim());
      payload.city = parts[0] || '';
      payload.area = parts[1] || '';
    }

    let result;
    if (userSnap.exists()) {
      const existingData = userSnap.data();
      // Ensure trust parameters are initialized if they do not exist
      const trustUpdates = {};
      if (existingData.trustScore === undefined) trustUpdates.trustScore = 0;
      if (existingData.completedJobs === undefined) trustUpdates.completedJobs = 0;
      if (existingData.disputesRaised === undefined) trustUpdates.disputesRaised = 0;
      if (existingData.disputesLost === undefined) trustUpdates.disputesLost = 0;
      
      await updateDoc(userRef, { ...payload, ...trustUpdates });
      result = { uid, ...existingData, ...payload, ...trustUpdates };
    } else {
      payload.createdAt = new Date().toISOString();
      if (!payload.language) {
        payload.language = 'en';
      }
      if (payload.verified === undefined) {
        payload.verified = false;
      }
      // Initialize trust system parameters
      payload.trustScore = 0;
      payload.completedJobs = 0;
      payload.disputesRaised = 0;
      payload.disputesLost = 0;
      
      await setDoc(userRef, payload);
      result = { uid, ...payload };
    }
    profileCache.set(uid, result);
    return result;
  },

  // Admin Queue for identity verification
  getUsersByStatus: async (status) => {
    const q = query(
      collection(db, 'users'), 
      where('verificationStatus', '==', status),
      limit(50)
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
    
    profileCache.delete(uid); // Invalidate cached profile
    
    // Notify the user in real-time
    await notificationService.addNotification(
      uid,
      isApproved ? "Profile Verified!" : "Profile Verification Failed",
      isApproved 
        ? "Your identity has been verified. You can now access all features of WorkLink."
        : "Your identity proof was rejected by the admin. Please upload a clear photo of your Aadhaar card."
    );
    return true;
  },

  // Request phone number change (creates a request document in Firestore)
  requestPhoneChange: async (uid, oldPhone, newPhone, userName) => {
    const requestRef = doc(db, 'phoneChangeRequests', uid);
    const payload = {
      uid,
      userName,
      oldPhone,
      newPhone,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await setDoc(requestRef, payload);

    // Notify all admins via standard notification channel
    await notificationService.addNotification(
      'admin',
      'Phone Change Request',
      `${userName} has requested to change their phone number from ${oldPhone} to ${newPhone}.`
    );
    return payload;
  },

  // Fetch active phone change request for a specific user
  getPhoneChangeRequestForUser: async (uid) => {
    const docSnap = await getDoc(doc(db, 'phoneChangeRequests', uid));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  // Get all pending phone change requests for Admin Dashboard
  getPendingPhoneChanges: async () => {
    const q = query(
      collection(db, 'phoneChangeRequests'),
      where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Update phone change status (Admin Approves / Rejects)
  updatePhoneChangeStatus: async (requestId, status) => {
    const requestRef = doc(db, 'phoneChangeRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return false;
    
    const requestData = requestSnap.data();
    await updateDoc(requestRef, { status });

    // Notify the user in real-time
    await notificationService.addNotification(
      requestData.uid,
      status === 'approved' ? 'Phone Change Request Approved' : 'Phone Change Request Rejected',
      status === 'approved'
        ? `Your request to change your number to ${requestData.newPhone} was approved. Verify with OTP to complete the change.`
        : `Your request to change your number to ${requestData.newPhone} was rejected by the admin.`
    );
    return true;
  },

  // Complete phone change process (User verifies OTP and applies the new number)
  completePhoneChange: async (uid, requestId, newPhone) => {
    // 1. Update user profile phone number
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { phone: newPhone });
    
    // 2. Mark request as completed
    const requestRef = doc(db, 'phoneChangeRequests', requestId);
    await updateDoc(requestRef, { status: 'completed' });

    profileCache.delete(uid); // Invalidate cached profile

    // 3. Notify the user
    await notificationService.addNotification(
      uid,
      'Phone Number Updated',
      `Your mobile number has been successfully updated to ${newPhone}.`
    );
    return true;
  },

  // Reset/Delete phone change request
  deletePhoneChangeRequest: async (uid) => {
    await deleteDoc(doc(db, 'phoneChangeRequests', uid));
    return true;
  },

  // Request profile photo change (creates a request document in Firestore)
  requestPhotoChange: async (uid, userName, oldPhoto, newPhoto) => {
    const requestRef = doc(db, 'photoChangeRequests', uid);
    const payload = {
      userId: uid,
      userName,
      oldPhotoUrl: oldPhoto,
      newPhotoUrl: newPhoto,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await setDoc(requestRef, payload);

    // Notify all admins via standard notification channel
    await notificationService.addNotification(
      'admin',
      'Profile Photo Update Request',
      `${userName} has requested to update their profile photo.`
    );
    return payload;
  },

  // Fetch active photo change request for a specific user
  getPhotoChangeRequestForUser: async (uid) => {
    const docSnap = await getDoc(doc(db, 'photoChangeRequests', uid));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  // Get all pending photo change requests for Admin Dashboard
  getPendingPhotoChanges: async () => {
    const q = query(
      collection(db, 'photoChangeRequests'),
      where('status', '==', 'pending'),
      limit(50)
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Update photo change status (Admin Approves / Rejects)
  updatePhotoChangeStatus: async (requestId, status) => {
    const requestRef = doc(db, 'photoChangeRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return false;
    
    const requestData = requestSnap.data();
    await updateDoc(requestRef, { status });

    if (status === 'approved') {
      const userRef = doc(db, 'users', requestData.userId);
      await updateDoc(userRef, { profilePhotoUrl: requestData.newPhotoUrl });
    }

    profileCache.delete(requestData.userId); // Invalidate cached profile

    // Notify the user
    await notificationService.addNotification(
      requestData.userId,
      status === 'approved' ? 'Profile Photo Updated' : 'Profile Photo Update Rejected',
      status === 'approved'
        ? 'Your request to update your profile photo has been approved by the admin.'
        : 'Your request to update your profile photo has been rejected by the admin.'
    );
    return true;
  },

  // Reset/Delete photo change request
  deletePhotoChangeRequest: async (uid) => {
    await deleteDoc(doc(db, 'photoChangeRequests', uid));
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
      paymentStatus: 'pending',
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
  getJobs: async (cityFilter, areaFilter, queryLimit = 30) => {
    let q = query(
      collection(db, 'jobs'), 
      where('status', '==', 'open'),
      limit(queryLimit)
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
  getMyJobs: async (employerId, queryLimit = 50) => {
    const q = query(
      collection(db, 'jobs'),
      where('employerId', '==', employerId),
      limit(queryLimit)
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

  // Start job work (Worker action)
  startJobWork: async (jobId) => {
    return executeTransition('startJobWork', { jobId }, async () => {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);
      if (!jobSnap.exists()) throw new Error("Job not found");
      const job = jobSnap.data();
      
      await updateDoc(jobRef, { 
        status: 'WORK_STARTED',
        updatedAt: new Date().toISOString()
      });
      
      // Activity log
      const logRef = collection(db, 'jobs', jobId, 'activityLogs');
      await addDoc(logRef, {
        action: 'WORK_STARTED',
        actorId: auth.currentUser?.uid || job.workerId,
        details: 'Worker started the job work.',
        timestamp: new Date().toISOString()
      });
      
      // Notify employer
      await notificationService.addNotification(
        job.employerId,
        "Work Started",
        `Worker has started working on "${job.title}".`
      );
      
      return { success: true, status: 'WORK_STARTED' };
    });
  },

  // Mark work completed (Worker action)
  markJobWorkCompleted: async (jobId) => {
    return executeTransition('markJobWorkCompleted', { jobId }, async () => {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);
      if (!jobSnap.exists()) throw new Error("Job not found");
      const job = jobSnap.data();

      await updateDoc(jobRef, { 
        status: 'WORK_COMPLETED',
        updatedAt: new Date().toISOString()
      });

      // Activity log
      const logRef = collection(db, 'jobs', jobId, 'activityLogs');
      await addDoc(logRef, {
        action: 'WORK_COMPLETED',
        actorId: auth.currentUser?.uid || job.workerId,
        details: 'Worker marked work completed.',
        timestamp: new Date().toISOString()
      });

      // Notify employer
      await notificationService.addNotification(
        job.employerId,
        "Work Completed",
        `Worker has marked the job "${job.title}" as completed. Please proceed to pay and confirm.`
      );

      return { success: true, status: 'WORK_COMPLETED' };
    });
  },

  // Delete job listing
  deleteJob: async (jobId) => {
    await deleteDoc(doc(db, 'jobs', jobId));
    return true;
  },

  // Mark job as paid (Employer action)
  markJobAsPaid: async (jobId, paymentAmount, transactionReferenceId) => {
    const amountNum = Number(paymentAmount);
    return executeTransition('markJobAsPaid', { jobId, paymentAmount: amountNum, transactionReferenceId }, async () => {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);
      if (!jobSnap.exists()) throw new Error("Job not found");
      const job = jobSnap.data();

      await updateDoc(jobRef, { 
        status: 'EMPLOYER_MARKED_PAID',
        paymentAmount: amountNum,
        transactionReferenceId: transactionReferenceId.trim(),
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Activity log
      const logRef = collection(db, 'jobs', jobId, 'activityLogs');
      await addDoc(logRef, {
        action: 'EMPLOYER_MARKED_PAID',
        actorId: auth.currentUser?.uid || job.employerId,
        details: `Employer marked paid. Ref ID: ${transactionReferenceId}, Amount: ₹${amountNum}.`,
        timestamp: new Date().toISOString()
      });

      // Notify worker
      const targetWorker = job.workerId || (job.selectedWorkers && job.selectedWorkers[0]);
      if (targetWorker) {
        await notificationService.addNotification(
          targetWorker,
          "Payment Processed",
          `Employer marked payment for "${job.title}" as paid. Please verify details.`
        );
      }

      return { success: true, status: 'EMPLOYER_MARKED_PAID' };
    });
  },

  // Confirm payment received or dispute (Worker action)
  confirmPayment: async (jobId, received, reason = "", comment = "") => {
    return executeTransition('confirmPayment', { jobId, received, reason, comment }, async () => {
      const jobRef = doc(db, 'jobs', jobId);
      const jobSnap = await getDoc(jobRef);
      if (!jobSnap.exists()) throw new Error("Job not found");
      const job = jobSnap.data();
      const workerId = auth.currentUser?.uid || job.workerId;

      if (received) {
        // Payment Confirmed Received (COMPLETED)
        await updateDoc(jobRef, {
          status: 'COMPLETED',
          workerConfirmedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Update trust scores
        const employerRef = doc(db, 'users', job.employerId);
        const workerRef = doc(db, 'users', workerId);

        await updateDoc(employerRef, {
          trustScore: increment(1),
          completedJobs: increment(1)
        });

        await updateDoc(workerRef, {
          trustScore: increment(1),
          completedJobs: increment(1)
        });

        // Activity log
        const logRef = collection(db, 'jobs', jobId, 'activityLogs');
        await addDoc(logRef, {
          action: 'COMPLETED',
          actorId: workerId,
          details: 'Worker confirmed payment received. Job closed successfully.',
          timestamp: new Date().toISOString()
        });

        // Notify employer
        await notificationService.addNotification(
          job.employerId,
          "Job Completed Successfully",
          `Worker confirmed payment for "${job.title}". Job completed!`
        );

        return { success: true, status: 'COMPLETED' };
      } else {
        // Payment Not Received (DISPUTED)
        await updateDoc(jobRef, {
          status: 'DISPUTED',
          updatedAt: new Date().toISOString()
        });

        // Create dispute record
        const disputeId = `${jobId}_dispute`;
        const disputeRef = doc(db, 'disputes', disputeId);
        await setDoc(disputeRef, {
          id: disputeId,
          jobId,
          employerId: job.employerId,
          workerId: workerId,
          reason,
          workerComment: comment || "",
          employerResponse: "",
          status: 'pending',
          createdAt: new Date().toISOString()
        });

        // Increment disputes raised
        const workerRef = doc(db, 'users', workerId);
        const employerRef = doc(db, 'users', job.employerId);
        await updateDoc(workerRef, {
          disputesRaised: increment(1)
        });
        await updateDoc(employerRef, {
          disputesRaised: increment(1)
        });

        // Activity log
        const logRef = collection(db, 'jobs', jobId, 'activityLogs');
        await addDoc(logRef, {
          action: 'DISPUTED',
          actorId: workerId,
          details: `Worker disputed payment. Reason: ${reason}. Comment: ${comment || "none"}`,
          timestamp: new Date().toISOString()
        });

        // Notify employer
        await notificationService.addNotification(
          job.employerId,
          "Payment Dispute Raised",
          `Dispute raised on "${job.title}" by worker. Reason: ${reason}. Please respond with details.`
        );

        // Notify admin
        await notificationService.addNotification(
          'admin',
          "New Job Dispute Raised",
          `A dispute has been raised on job "${job.title}" (Job ID: ${jobId}). Reason: ${reason}.`
        );

        return { success: true, status: 'DISPUTED' };
      }
    });
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
          jobStatus: job.status || 'open',
          employerId: job.employerId || '',
          employerName: job.employerName || '',
          employerPhone: job.employerPhone || '',
          paymentStatus: job.paymentStatus || 'pending'
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
            workersSelectedCount,
            workerId: workerId,
            paymentStatus: 'pending'
          };
          // If total selected reaches workers needed, change status to ACCEPTED
          if (workersSelectedCount >= (job.workersNeeded || 1)) {
            updates.status = 'ACCEPTED';
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
        if (workersSelectedCount < (job.workersNeeded || 1) && job.status === 'ACCEPTED') {
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

// --- REPORT SERVICE ---
export const reportService = {
  submitReport: async (reporterId, reporterName, reportedId, reportedName, reason, details) => {
    const payload = {
      reporterId,
      reporterName,
      reportedId,
      reportedName,
      reason,
      details,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    // Add report doc to Firestore
    await addDoc(collection(db, 'reports'), payload);
    
    // Alert the reported user
    await notificationService.addNotification(
      reportedId,
      "Account Reported Alert",
      `Your account has been reported for: "${reason}". Details: "${details}". Admin will review this activity.`
    );
    return true;
  },

  getPendingReports: async () => {
    const q = query(
      collection(db, 'reports'),
      where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  resolveReport: async (reportId) => {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, { status: 'resolved' });
    return true;
  },

  removeUser: async (uid) => {
    // 1. Delete user profile
    await deleteDoc(doc(db, 'users', uid));
    
    // 2. Mark any pending reports for this user as resolved
    const q = query(
      collection(db, 'reports'),
      where('reportedId', '==', uid),
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    const promises = snap.docs.map(d => updateDoc(doc(db, 'reports', d.id), { status: 'resolved' }));
    await Promise.all(promises);
    return true;
  }
};

// --- QUERY SERVICE ---
export const queryService = {
  submitQuery: async (userId, userName, userPhone, userRole, queryText) => {
    const payload = {
      userId,
      userName,
      userPhone,
      userRole,
      queryText,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await addDoc(collection(db, 'queries'), payload);
    return true;
  },

  getAllQueries: async () => {
    const q = query(collection(db, 'queries'));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

// --- DISPUTES SERVICE ---
export const disputeService = {
  // Get dispute details by ID
  getDisputeById: async (disputeId) => {
    const docSnap = await getDoc(doc(db, 'disputes', disputeId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  // Get all pending disputes for Admin Dashboard
  getPendingDisputes: async () => {
    const q = query(
      collection(db, 'disputes'),
      where('status', '==', 'pending')
    );
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Employer response to dispute
  submitEmployerResponse: async (disputeId, responseExplanation) => {
    return executeTransition('submitEmployerDisputeResponse', { disputeId, employerResponse: responseExplanation }, async () => {
      const disputeRef = doc(db, 'disputes', disputeId);
      const disputeSnap = await getDoc(disputeRef);
      if (!disputeSnap.exists()) throw new Error("Dispute not found");
      const dispute = disputeSnap.data();

      await updateDoc(disputeRef, {
        employerResponse: responseExplanation.trim(),
        updatedAt: new Date().toISOString()
      });

      // Write activity log on job
      const logRef = collection(db, 'jobs', dispute.jobId, 'activityLogs');
      await addDoc(logRef, {
        action: 'DISPUTE_EMPLOYER_RESPONDED',
        actorId: auth.currentUser?.uid || dispute.employerId,
        details: `Employer responded to dispute: "${responseExplanation}"`,
        timestamp: new Date().toISOString()
      });

      // Notify admin
      await notificationService.addNotification(
        'admin',
        "Employer Responded to Dispute",
        `Employer has responded to dispute ${disputeId}.`
      );

      return { success: true };
    });
  },

  // Admin resolves dispute (favor_worker, favor_employer, close)
  resolveDispute: async (disputeId, resolution) => {
    return executeTransition('resolveDispute', { disputeId, resolution }, async () => {
      const disputeRef = doc(db, 'disputes', disputeId);
      const disputeSnap = await getDoc(disputeRef);
      if (!disputeSnap.exists()) throw new Error("Dispute not found");
      const dispute = disputeSnap.data();

      const jobRef = doc(db, 'jobs', dispute.jobId);
      const jobSnap = await getDoc(jobRef);
      if (!jobSnap.exists()) throw new Error("Associated job not found");
      const job = jobSnap.data();

      // Update dispute record
      await updateDoc(disputeRef, {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: auth.currentUser?.uid || 'admin',
        resolution: resolution,
        updatedAt: new Date().toISOString()
      });

      // Update job status to COMPLETED
      await updateDoc(jobRef, {
        status: 'COMPLETED',
        updatedAt: new Date().toISOString()
      });

      const employerRef = doc(db, 'users', dispute.employerId);
      const workerRef = doc(db, 'users', dispute.workerId);

      let employerTrustChange = 0;
      let workerTrustChange = 0;
      let workerCompletedChange = 0;
      let workerDisputesLostChange = 0;
      let employerCompletedChange = 0;

      if (resolution === 'favor_worker') {
        employerTrustChange = -1;
        workerTrustChange = 1;
        workerCompletedChange = 1;
        employerCompletedChange = 1;

        await notificationService.addNotification(
          dispute.workerId,
          "Dispute Resolved In Your Favor",
          `Admin resolved payment dispute for "${job.title}" in your favor.`
        );
        await notificationService.addNotification(
          dispute.employerId,
          "Dispute Resolved Against You",
          `Admin resolved payment dispute for "${job.title}" in favor of worker. Your trust score is reduced.`
        );
      } else if (resolution === 'favor_employer') {
        employerTrustChange = 1;
        workerTrustChange = -1;
        workerDisputesLostChange = 1;
        employerCompletedChange = 1;

        await notificationService.addNotification(
          dispute.workerId,
          "Dispute Resolved Against You",
          `Admin resolved payment dispute for "${job.title}" in favor of employer. Your trust score is reduced.`
        );
        await notificationService.addNotification(
          dispute.employerId,
          "Dispute Resolved In Your Favor",
          `Admin resolved payment dispute for "${job.title}" in your favor.`
        );
      } else {
        // close (neutral)
        await notificationService.addNotification(
          dispute.workerId,
          "Dispute Closed",
          `Admin has closed the dispute for "${job.title}" without penalty.`
        );
        await notificationService.addNotification(
          dispute.employerId,
          "Dispute Closed",
          `Admin has closed the dispute for "${job.title}" without penalty.`
        );
      }

      // Apply trust changes
      await updateDoc(employerRef, {
        trustScore: increment(employerTrustChange),
        completedJobs: increment(employerCompletedChange)
      });
      await updateDoc(workerRef, {
        trustScore: increment(workerTrustChange),
        completedJobs: increment(workerCompletedChange),
        disputesLost: increment(workerDisputesLostChange)
      });

      // Write activity log on job
      const logRef = collection(db, 'jobs', dispute.jobId, 'activityLogs');
      await addDoc(logRef, {
        action: 'DISPUTE_RESOLVED',
        actorId: auth.currentUser?.uid || 'admin',
        details: `Admin resolved dispute. Resolution: ${resolution}.`,
        timestamp: new Date().toISOString()
      });

      return { success: true };
    });
  }
};

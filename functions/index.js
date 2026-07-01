const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

// Centralized Trust Score Calculation
const calculateTrustScore = (user) => {
  let score = 0;
  if (user.phoneVerified === true || !!user.phone) score += 20;
  if (user.upiVerified === true) score += 20;
  if (user.selfieUrl) score += 20; // Selfie uploaded
  const completed = user.completedJobs || 0;
  score += completed * 2;
  const rating = user.rating || user.averageRating || 0;
  if (rating >= 4.0) score += 20; // High Rating
  return Math.min(score, 100);
};

// Check flagging rules in transaction
const checkAndFlagUserInTransaction = (transaction, userRef, user) => {
  let shouldFlag = false;
  let reasons = [];

  if ((user.disputesRaised || 0) >= 3) {
    shouldFlag = true;
    reasons.push(`Multiple disputes raised (${user.disputesRaised})`);
  }
  if ((user.disputesLost || 0) >= 2) {
    shouldFlag = true;
    reasons.push(`Repeated dispute losses (${user.disputesLost})`);
  }

  const ratingCount = user.ratingCount || user.totalReviews || 0;
  const currentRating = user.rating || user.averageRating || 0;
  if (ratingCount >= 3 && currentRating < 3.0) {
    shouldFlag = true;
    reasons.push(`Low rating: ${currentRating} stars (${ratingCount} reviews)`);
  }

  if (shouldFlag) {
    transaction.update(userRef, {
      isFlagged: true,
      flagReason: reasons.join(", ")
    });
  }
};

// Helper to write an activity log inside a transaction or batch
const addActivityLog = (jobId, action, actorId, details) => {
  const logRef = db.collection("jobs").doc(jobId).collection("activityLogs").doc();
  return {
    ref: logRef,
    data: {
      action,
      actorId,
      details,
      timestamp: new Date().toISOString()
    }
  };
};

// Helper to create notification
const createNotification = (userId, title, message, type = "system") => {
  const notifRef = db.collection("notifications").doc();
  return {
    ref: notifRef,
    data: {
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    }
  };
};

// 1. Worker marks job as WORK_STARTED
exports.startJobWork = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const { jobId } = data;
  if (!jobId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing Job ID.");
  }

  const jobRef = db.collection("jobs").doc(jobId);
  return db.runTransaction(async (transaction) => {
    const jobDoc = await transaction.get(jobRef);
    if (!jobDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Job not found.");
    }

    const job = jobDoc.data();
    const isWorker = job.workerId === context.auth.uid || (job.selectedWorkers && job.selectedWorkers.includes(context.auth.uid));

    if (!isWorker) {
      throw new functions.https.HttpsError("permission-denied", "Only the assigned worker can start the work.");
    }

    // Accept transitions from 'ACCEPTED' or 'booked'
    if (job.status !== "ACCEPTED" && job.status !== "booked") {
      throw new functions.https.HttpsError("failed-precondition", "Job is not in ACCEPTED state.");
    }

    transaction.update(jobRef, {
      status: "WORK_STARTED",
      workerId: context.auth.uid, // ensure workerId is explicitly set
      updatedAt: new Date().toISOString()
    });

    // Write activity log
    const log = addActivityLog(jobId, "WORK_STARTED", context.auth.uid, "Worker started the job work.");
    transaction.set(log.ref, log.data);

    // Notify Employer
    const notif = createNotification(
      job.employerId,
      "Work Started",
      `Worker ${context.auth.token.name || "assigned to your job"} has started working on "${job.title}".`,
      "work_update"
    );
    transaction.set(notif.ref, notif.data);

    return { success: true, status: "WORK_STARTED" };
  });
});

// 2. Worker marks job as WORK_COMPLETED
exports.markJobWorkCompleted = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const { jobId } = data;
  if (!jobId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing Job ID.");
  }

  const jobRef = db.collection("jobs").doc(jobId);
  return db.runTransaction(async (transaction) => {
    const jobDoc = await transaction.get(jobRef);
    if (!jobDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Job not found.");
    }

    const job = jobDoc.data();
    const isWorker = job.workerId === context.auth.uid || (job.selectedWorkers && job.selectedWorkers.includes(context.auth.uid));

    if (!isWorker) {
      throw new functions.https.HttpsError("permission-denied", "Only the assigned worker can mark work as completed.");
    }

    if (job.status !== "WORK_STARTED") {
      throw new functions.https.HttpsError("failed-precondition", "Job must be in WORK_STARTED state.");
    }

    transaction.update(jobRef, {
      status: "WORK_COMPLETED",
      updatedAt: new Date().toISOString()
    });

    // Write activity log
    const log = addActivityLog(jobId, "WORK_COMPLETED", context.auth.uid, "Worker marked work completed.");
    transaction.set(log.ref, log.data);

    // Notify Employer
    const notif = createNotification(
      job.employerId,
      "Work Completed",
      `Worker has marked the job "${job.title}" as completed. Please proceed to pay and confirm.`,
      "work_update"
    );
    transaction.set(notif.ref, notif.data);

    return { success: true, status: "WORK_COMPLETED" };
  });
});



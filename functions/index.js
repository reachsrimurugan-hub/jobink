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

// 3. Employer marks job as PAID
exports.markJobAsPaid = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const { jobId, paymentAmount } = data;
  if (!jobId || !paymentAmount) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields (jobId, paymentAmount).");
  }

  const amountNum = Number(paymentAmount);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new functions.https.HttpsError("invalid-argument", "Payment Amount must be a positive number.");
  }

  const jobRef = db.collection("jobs").doc(jobId);
  return db.runTransaction(async (transaction) => {
    const jobDoc = await transaction.get(jobRef);
    if (!jobDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Job not found.");
    }

    const job = jobDoc.data();
    if (job.employerId !== context.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Only the employer can mark the job as paid.");
    }

    if (job.status !== "WORK_COMPLETED") {
      throw new functions.https.HttpsError("failed-precondition", "Job must be in WORK_COMPLETED status before marking as paid.");
    }

    transaction.update(jobRef, {
      status: "EMPLOYER_MARKED_PAID",
      paymentStatus: "awaiting_worker_confirmation",
      paymentAmount: amountNum,
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Write activity log
    const log = addActivityLog(
      jobId, 
      "EMPLOYER_MARKED_PAID", 
      context.auth.uid, 
      `Employer marked paid. Amount: ₹${amountNum}. Awaiting worker confirmation.`
    );
    transaction.set(log.ref, log.data);

    // Notify Worker
    const targetWorker = job.workerId || (job.selectedWorkers && job.selectedWorkers[0]);
    if (targetWorker) {
      const notif = createNotification(
        targetWorker,
        "Payment Sent",
        `Employer indicated payment for "${job.title}" has been sent. Please confirm receipt.`,
        "payment_update"
      );
      transaction.set(notif.ref, notif.data);
    }

    return { success: true, status: "EMPLOYER_MARKED_PAID" };
  });
});

// 4. Worker confirms payment received or raises dispute
exports.confirmPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const { jobId, received, reason, comment } = data;
  if (!jobId || received === undefined) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields (jobId, received).");
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
      throw new functions.https.HttpsError("permission-denied", "Only the assigned worker can verify payment status.");
    }

    if (job.status !== "EMPLOYER_MARKED_PAID") {
      throw new functions.https.HttpsError("failed-precondition", "Job payment status has not been marked as paid by employer.");
    }

    const historyItem = {
      jobId,
      title: job.title,
      completedAt: new Date().toISOString()
    };

    if (received) {
      // Payment Received Flow (COMPLETED)
      transaction.update(jobRef, {
        status: "COMPLETED",
        paymentStatus: "confirmed",
        workerConfirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Update completed jobs & completedJobHistory
      const employerRef = db.collection("users").doc(job.employerId);
      const workerRef = db.collection("users").doc(context.auth.uid);

      const empDoc = await transaction.get(employerRef);
      const wrkDoc = await transaction.get(workerRef);

      let empData = {};
      let wrkData = {};

      if (empDoc.exists) {
        empData = empDoc.data();
        const updatedCompleted = (empData.completedJobs || 0) + 1;
        const updatedHistory = empData.completedJobHistory ? [...empData.completedJobHistory, historyItem] : [historyItem];
        
        // Recalculate trust score
        const tempUser = { ...empData, completedJobs: updatedCompleted, completedJobHistory: updatedHistory };
        const newScore = calculateTrustScore(tempUser);

        transaction.update(employerRef, {
          completedJobs: updatedCompleted,
          completedJobHistory: admin.firestore.FieldValue.arrayUnion(historyItem),
          trustScore: newScore
        });

        // Notify about trust score update
        const trustNotif = createNotification(
          job.employerId,
          "Trust Score Updated",
          `Your Trust Score has been updated to ${newScore}/100.`,
          "system"
        );
        transaction.set(trustNotif.ref, trustNotif.data);
      }

      if (wrkDoc.exists) {
        wrkData = wrkDoc.data();
        const updatedCompleted = (wrkData.completedJobs || 0) + 1;
        const updatedHistory = wrkData.completedJobHistory ? [...wrkData.completedJobHistory, historyItem] : [historyItem];
        
        // Recalculate trust score
        const tempUser = { ...wrkData, completedJobs: updatedCompleted, completedJobHistory: updatedHistory };
        const newScore = calculateTrustScore(tempUser);

        transaction.update(workerRef, {
          completedJobs: updatedCompleted,
          completedJobHistory: admin.firestore.FieldValue.arrayUnion(historyItem),
          trustScore: newScore
        });

        // Notify about trust score update
        const trustNotif = createNotification(
          context.auth.uid,
          "Trust Score Updated",
          `Your Trust Score has been updated to ${newScore}/100.`,
          "system"
        );
        transaction.set(trustNotif.ref, trustNotif.data);
      }

      // Write activity log
      const log = addActivityLog(jobId, "COMPLETED", context.auth.uid, "Worker confirmed payment received. Job closed successfully.");
      transaction.set(log.ref, log.data);

      // Notify Employer
      const notif = createNotification(
        job.employerId,
        "Job Completed Successfully",
        `Worker confirmed payment for "${job.title}". Job completed!`,
        "payment_update"
      );
      transaction.set(notif.ref, notif.data);

      return { success: true, status: "COMPLETED" };
    } else {
      // Payment Not Received Flow (DISPUTED)
      if (!reason) {
        throw new functions.https.HttpsError("invalid-argument", "Dispute reason is required.");
      }

      transaction.update(jobRef, {
        status: "DISPUTED",
        paymentStatus: "disputed",
        updatedAt: new Date().toISOString()
      });

      // Create dispute record
      const disputeId = `${jobId}_dispute`;
      const disputeRef = db.collection("disputes").doc(disputeId);
      
      transaction.set(disputeRef, {
        id: disputeId,
        jobId,
        employerId: job.employerId,
        workerId: context.auth.uid,
        reason,
        workerComment: comment || "",
        employerResponse: "",
        status: "pending",
        createdAt: new Date().toISOString()
      });

      // Increment disputes raised and check flagging rules
      const workerRef = db.collection("users").doc(context.auth.uid);
      const wrkDoc = await transaction.get(workerRef);
      if (wrkDoc.exists) {
        const wrkData = wrkDoc.data();
        const updatedDisputes = (wrkData.disputesRaised || 0) + 1;
        transaction.update(workerRef, {
          disputesRaised: updatedDisputes
        });
        checkAndFlagUserInTransaction(transaction, workerRef, { ...wrkData, disputesRaised: updatedDisputes });
      }

      // Increment employer disputes count and check flagging rules
      const employerRef = db.collection("users").doc(job.employerId);
      const empDoc = await transaction.get(employerRef);
      if (empDoc.exists) {
        const empData = empDoc.data();
        const updatedDisputes = (empData.disputesRaised || 0) + 1;
        transaction.update(employerRef, {
          disputesRaised: updatedDisputes
        });
        checkAndFlagUserInTransaction(transaction, employerRef, { ...empData, disputesRaised: updatedDisputes });
      }

      // Write activity log
      const log = addActivityLog(jobId, "DISPUTED", context.auth.uid, `Worker disputed payment. Reason: ${reason}. Comment: ${comment || "none"}`);
      transaction.set(log.ref, log.data);

      // Notify Employer
      const employerNotif = createNotification(
        job.employerId,
        "Payment Dispute Raised",
        `Dispute raised on "${job.title}" by worker. Reason: ${reason}. Please respond with details.`,
        "dispute"
      );
      transaction.set(employerNotif.ref, employerNotif.data);

      // Notify Admin
      const adminNotif = createNotification(
        "admin",
        "New Job Dispute Raised",
        `A dispute has been raised on job "${job.title}" (Job ID: ${jobId}). Reason: ${reason}.`,
        "dispute"
      );
      transaction.set(adminNotif.ref, adminNotif.data);

      return { success: true, status: "DISPUTED" };
    }
  });
});

// 5. Employer responds to dispute
exports.submitEmployerDisputeResponse = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const { disputeId, employerResponse } = data;
  if (!disputeId || !employerResponse) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields (disputeId, employerResponse).");
  }

  const disputeRef = db.collection("disputes").doc(disputeId);
  return db.runTransaction(async (transaction) => {
    const disputeDoc = await transaction.get(disputeRef);
    if (!disputeDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Dispute record not found.");
    }

    const dispute = disputeDoc.data();
    if (dispute.employerId !== context.auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Only the employer can respond to this dispute.");
    }

    transaction.update(disputeRef, {
      employerResponse: employerResponse.trim(),
      updatedAt: new Date().toISOString()
    });

    // Write activity log on job
    const log = addActivityLog(
      dispute.jobId, 
      "DISPUTE_EMPLOYER_RESPONDED", 
      context.auth.uid, 
      `Employer responded to dispute: "${employerResponse}"`
    );
    transaction.set(log.ref, log.data);

    // Notify Admin
    const adminNotif = createNotification(
      "admin",
      "Employer Responded to Dispute",
      `Employer has responded to dispute ${disputeId}.`,
      "dispute"
    );
    transaction.set(adminNotif.ref, adminNotif.data);

    return { success: true };
  });
});

// 6. Admin resolves dispute
exports.resolveDispute = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }
  const { disputeId, resolution } = data; // resolution: "favor_worker", "favor_employer", "close"
  if (!disputeId || !resolution) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields (disputeId, resolution).");
  }

  // Verify caller is admin
  const userDoc = await db.collection("users").doc(context.auth.uid).get();
  if (!userDoc.exists || userDoc.data().role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Only admins can resolve disputes.");
  }

  const disputeRef = db.collection("disputes").doc(disputeId);
  return db.runTransaction(async (transaction) => {
    const disputeDoc = await transaction.get(disputeRef);
    if (!disputeDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Dispute record not found.");
    }

    const dispute = disputeDoc.data();
    if (dispute.status !== "pending") {
      throw new functions.https.HttpsError("failed-precondition", "Dispute is already resolved.");
    }

    const jobRef = db.collection("jobs").doc(dispute.jobId);
    const jobDoc = await transaction.get(jobRef);
    if (!jobDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Associated job not found.");
    }
    const job = jobDoc.data();

    // Set dispute status to resolved
    transaction.update(disputeRef, {
      status: "resolved",
      resolvedAt: new Date().toISOString(),
      resolvedBy: context.auth.uid,
      resolution: resolution,
      updatedAt: new Date().toISOString()
    });

    // Update job status to COMPLETED
    transaction.update(jobRef, {
      status: "COMPLETED",
      updatedAt: new Date().toISOString()
    });

    const employerRef = db.collection("users").doc(dispute.employerId);
    const workerRef = db.collection("users").doc(dispute.workerId);

    const empDoc = await transaction.get(employerRef);
    const wrkDoc = await transaction.get(workerRef);

    let employerTrustChange = 0;
    let workerTrustChange = 0;
    let workerCompletedChange = 0;
    let workerDisputesLostChange = 0;
    let employerCompletedChange = 0;

    if (resolution === "favor_worker") {
      // Employer lost, worker wins
      employerTrustChange = -1;
      workerTrustChange = 1;
      workerCompletedChange = 1;
      employerCompletedChange = 1;

      // Notify both
      const workerNotif = createNotification(
        dispute.workerId,
        "Dispute Resolved In Your Favor",
        `Admin resolved payment dispute for "${job.title}" in your favor.`,
        "dispute"
      );
      transaction.set(workerNotif.ref, workerNotif.data);

      const employerNotif = createNotification(
        dispute.employerId,
        "Dispute Resolved Against You",
        `Admin resolved payment dispute for "${job.title}" in favor of worker. Your trust score is reduced.`,
        "dispute"
      );
      transaction.set(employerNotif.ref, employerNotif.data);

    } else if (resolution === "favor_employer") {
      // Employer wins, worker lost (false dispute)
      employerTrustChange = 1;
      workerTrustChange = -1;
      workerDisputesLostChange = 1;
      employerCompletedChange = 1;

      const workerNotif = createNotification(
        dispute.workerId,
        "Dispute Resolved Against You",
        `Admin resolved payment dispute for "${job.title}" in favor of employer. Your trust score is reduced.`,
        "dispute"
      );
      transaction.set(workerNotif.ref, workerNotif.data);

      const employerNotif = createNotification(
        dispute.employerId,
        "Dispute Resolved In Your Favor",
        `Admin resolved payment dispute for "${job.title}" in your favor.`,
        "dispute"
      );
      transaction.set(employerNotif.ref, employerNotif.data);

    } else {
      // Closed dispute, neutral
      const workerNotif = createNotification(
        dispute.workerId,
        "Dispute Closed",
        `Admin has closed the dispute for "${job.title}" without penalty.`,
        "dispute"
      );
      transaction.set(workerNotif.ref, workerNotif.data);

      const employerNotif = createNotification(
        dispute.employerId,
        "Dispute Closed",
        `Admin has closed the dispute for "${job.title}" without penalty.`,
        "dispute"
      );
      transaction.set(employerNotif.ref, employerNotif.data);
    }

    // Apply User profile updates
    if (empDoc.exists) {
      const empData = empDoc.data();
      transaction.update(employerRef, {
        trustScore: (empData.trustScore || 0) + employerTrustChange,
        completedJobs: (empData.completedJobs || 0) + employerCompletedChange
      });
    }
    if (wrkDoc.exists) {
      const wrkData = wrkDoc.data();
      transaction.update(workerRef, {
        trustScore: (wrkData.trustScore || 0) + workerTrustChange,
        completedJobs: (wrkData.completedJobs || 0) + workerCompletedChange,
        disputesLost: (wrkData.disputesLost || 0) + workerDisputesLostChange
      });
    }

    // Write activity log
    const log = addActivityLog(
      dispute.jobId,
      "DISPUTE_RESOLVED",
      context.auth.uid,
      `Admin resolved dispute. Resolution: ${resolution}.`
    );
    transaction.set(log.ref, log.data);

    return { success: true };
  });
});

// 7. Scheduled Function to check pending payment confirmations (reminders at 48h, escalation at 96h)
exports.checkPendingPaymentConfirmations = functions.pubsub.schedule("every 12 hours").onRun(async (context) => {
  const now = new Date();
  const fortyEightHoursMs = 48 * 60 * 60 * 1000;
  const ninetySixHoursMs = 96 * 60 * 60 * 1000;

  const jobsSnap = await db.collection("jobs")
    .where("status", "==", "EMPLOYER_MARKED_PAID")
    .where("paymentStatus", "==", "awaiting_worker_confirmation")
    .get();

  const batch = db.batch();
  let updatesCount = 0;

  for (const jobDoc of jobsSnap.docs) {
    const job = jobDoc.data();
    const jobId = jobDoc.id;
    const paidAtStr = job.paidAt || job.updatedAt;
    if (!paidAtStr) continue;

    const paidAt = new Date(paidAtStr);
    const elapsed = now.getTime() - paidAt.getTime();

    if (elapsed >= ninetySixHoursMs) {
      // Escalation to adminReviewRequired
      if (!job.adminReviewRequired) {
        batch.update(jobDoc.ref, {
          adminReviewRequired: true,
          updatedAt: now.toISOString()
        });

        // Write activity log
        const logRef = db.collection("jobs").doc(jobId).collection("activityLogs").doc();
        batch.set(logRef, {
          action: "ESCALATED_TO_ADMIN",
          actorId: "system",
          details: "Payment confirmation overdue by 96 hours. Escalated to admin review.",
          timestamp: now.toISOString()
        });

        // Notify Admin
        const adminNotifRef = db.collection("notifications").doc();
        batch.set(adminNotifRef, {
          userId: "admin",
          title: "Payment Confirmation Overdue",
          message: `Job "${job.title}" payment confirmation is overdue by 96 hours. Admin review required.`,
          type: "system",
          read: false,
          createdAt: now.toISOString()
        });

        // Notify Employer
        const employerNotifRef = db.collection("notifications").doc();
        batch.set(employerNotifRef, {
          userId: job.employerId,
          title: "Job Escalated to Admin",
          message: `Your job "${job.title}" has been escalated to admin review because the worker has not confirmed payment in 96 hours.`,
          type: "system",
          read: false,
          createdAt: now.toISOString()
        });

        // Notify Worker
        const targetWorker = job.workerId || (job.selectedWorkers && job.selectedWorkers[0]);
        if (targetWorker) {
          const workerNotifRef = db.collection("notifications").doc();
          batch.set(workerNotifRef, {
            userId: targetWorker,
            title: "Payment Confirmation Overdue",
            message: `Your payment confirmation for "${job.title}" is overdue by 96 hours. Escalated to admin review.`,
            type: "system",
            read: false,
            createdAt: now.toISOString()
          });
        }
        updatesCount++;
      }
    } else if (elapsed >= fortyEightHoursMs) {
      // 48 hours reminder
      if (!job.paymentReminderSent) {
        batch.update(jobDoc.ref, {
          paymentReminderSent: true,
          updatedAt: now.toISOString()
        });

        // Write activity log
        const logRef = db.collection("jobs").doc(jobId).collection("activityLogs").doc();
        batch.set(logRef, {
          action: "PAYMENT_REMINDER_SENT",
          actorId: "system",
          details: "48-hour reminder sent to worker.",
          timestamp: now.toISOString()
        });

        // Notify Worker
        const targetWorker = job.workerId || (job.selectedWorkers && job.selectedWorkers[0]);
        if (targetWorker) {
          const workerNotifRef = db.collection("notifications").doc();
          batch.set(workerNotifRef, {
            userId: targetWorker,
            title: "Action Required: Confirm Payment",
            message: `Employer marked job "${job.title}" as paid 48 hours ago. Please confirm receipt or raise a dispute.`,
            type: "payment_update",
            read: false,
            createdAt: now.toISOString()
          });
        }
        updatesCount++;
      }
    }
  }

  if (updatesCount > 0) {
    await batch.commit();
  }
  console.log(`Successfully checked pending payments. Sent ${updatesCount} updates/reminders.`);
  return null;
});


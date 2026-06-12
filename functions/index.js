const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

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
  const { jobId, paymentAmount, transactionReferenceId } = data;
  if (!jobId || !paymentAmount || !transactionReferenceId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields (jobId, paymentAmount, transactionReferenceId).");
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
      paymentAmount: amountNum,
      transactionReferenceId: transactionReferenceId.trim(),
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Write activity log
    const log = addActivityLog(
      jobId, 
      "EMPLOYER_MARKED_PAID", 
      context.auth.uid, 
      `Employer marked paid. Ref ID: ${transactionReferenceId}, Amount: ₹${amountNum}.`
    );
    transaction.set(log.ref, log.data);

    // Notify Worker
    const targetWorker = job.workerId || (job.selectedWorkers && job.selectedWorkers[0]);
    if (targetWorker) {
      const notif = createNotification(
        targetWorker,
        "Payment Processed",
        `Employer marked payment for "${job.title}" as paid. Please verify details.`,
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

    if (received) {
      // Payment Received Flow (COMPLETED)
      transaction.update(jobRef, {
        status: "COMPLETED",
        workerConfirmedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Update trust score & completed jobs
      const employerRef = db.collection("users").doc(job.employerId);
      const workerRef = db.collection("users").doc(context.auth.uid);

      const empDoc = await transaction.get(employerRef);
      const wrkDoc = await transaction.get(workerRef);

      if (empDoc.exists) {
        const empData = empDoc.data();
        transaction.update(employerRef, {
          trustScore: (empData.trustScore || 0) + 1,
          completedJobs: (empData.completedJobs || 0) + 1
        });
      }

      if (wrkDoc.exists) {
        const wrkData = wrkDoc.data();
        transaction.update(workerRef, {
          trustScore: (wrkData.trustScore || 0) + 1,
          completedJobs: (wrkData.completedJobs || 0) + 1
        });
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

      // Increment worker disputes raised
      const workerRef = db.collection("users").doc(context.auth.uid);
      const wrkDoc = await transaction.get(workerRef);
      if (wrkDoc.exists) {
        const wrkData = wrkDoc.data();
        transaction.update(workerRef, {
          disputesRaised: (wrkData.disputesRaised || 0) + 1
        });
      }

      // Increment employer disputes count
      const employerRef = db.collection("users").doc(job.employerId);
      const empDoc = await transaction.get(employerRef);
      if (empDoc.exists) {
        const empData = empDoc.data();
        transaction.update(employerRef, {
          disputesRaised: (empData.disputesRaised || 0) + 1
        });
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

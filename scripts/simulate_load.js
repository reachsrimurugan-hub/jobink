/**
 * Automated Concurrency & Load Testing Simulator for WorkLink (Jobink)
 * 
 * Simulates high-concurrency traffic conditions for low-end device planning:
 * - 100, 500, 1000, and 5000 concurrent user sessions.
 * - Simulates Login, Registration, Job Posting, Applications, Notifications, and Payments.
 * - Measures response times, throughput (RPS), and error rates.
 */

const simulateOperation = async (name, operationFn, errorRate = 0.001) => {
  const start = performance.now();
  try {
    // Simulate brief network latency (50ms - 250ms random lag)
    const latency = 50 + Math.random() * 200;
    await new Promise((resolve) => setTimeout(resolve, latency));

    // Execute mock function
    await operationFn();

    // Random error simulation based on rate
    if (Math.random() < errorRate) {
      throw new Error(`Connection timeout for ${name}`);
    }

    const duration = performance.now() - start;
    return { success: true, duration };
  } catch (err) {
    const duration = performance.now() - start;
    return { success: false, duration, error: err.message };
  }
};

const runLoadTest = async (concurrentUsers) => {
  console.log(`\n--- Simulating load test for ${concurrentUsers} concurrent users ---`);
  
  const operations = [];

  // Mocks representing user actions
  const mockRegister = () => Promise.resolve();
  const mockLogin = () => Promise.resolve();
  const mockPostJob = () => Promise.resolve();
  const mockApply = () => Promise.resolve();
  const mockNotify = () => Promise.resolve();
  const mockPay = () => Promise.resolve();

  // Distribute tasks realistically across user base
  for (let i = 0; i < concurrentUsers; i++) {
    operations.push(simulateOperation('Register', mockRegister, 0.002));
    operations.push(simulateOperation('Login', mockLogin, 0.001));
    operations.push(simulateOperation('PostJob', mockPostJob, 0.005));
    operations.push(simulateOperation('Apply', mockApply, 0.003));
    operations.push(simulateOperation('Notify', mockNotify, 0.001));
    operations.push(simulateOperation('Pay', mockPay, 0.008));
  }

  const startTotal = performance.now();
  const results = await Promise.all(operations);
  const totalDuration = (performance.now() - startTotal) / 1000; // in seconds

  // Compute metrics
  const totalRequests = results.length;
  const successes = results.filter(r => r.success);
  const failures = results.filter(r => !r.success);
  const errorRate = ((failures.length / totalRequests) * 100).toFixed(2);
  const throughput = (successes.length / totalDuration).toFixed(2);

  const durations = results.map(r => r.duration);
  const minTime = Math.min(...durations).toFixed(1);
  const maxTime = Math.max(...durations).toFixed(1);
  const avgTime = (durations.reduce((sum, d) => sum + d, 0) / totalRequests).toFixed(1);

  console.log(`Completed ${totalRequests} operations in ${totalDuration.toFixed(2)}s`);
  console.log(`Throughput: ${throughput} req/sec`);
  console.log(`Average Latency: ${avgTime}ms (Min: ${minTime}ms, Max: ${maxTime}ms)`);
  console.log(`Error Rate: ${errorRate}% (${failures.length} failed)`);

  return {
    concurrentUsers,
    totalRequests,
    totalDuration,
    throughput,
    avgTime,
    errorRate
  };
};

const main = async () => {
  const scales = [100, 500, 1000, 5000];
  const summary = [];

  for (const scale of scales) {
    const metrics = await runLoadTest(scale);
    summary.push(metrics);
  }

  console.log("\n=================== SCALABILITY REPORT SUMMARY ===================");
  console.table(summary);
};

main();

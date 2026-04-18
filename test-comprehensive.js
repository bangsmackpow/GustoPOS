#!/usr/bin/env node

/**
 * Comprehensive GustoPOS System Test
 * Tests all three user roles: Manager, Employee, Accountant
 */

const http = require("http");
const BASE_URL = "http://localhost:3000";

// Test Results
const results = {
  manager: [],
  employee: [],
  accountant: [],
  errors: [],
};

// Helper Functions
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Cookie: headers.Cookie || "",
        ...headers,
      },
    };

    const req = http.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.status,
            headers: res.headers,
            body: parsed,
          });
        } catch (e) {
          resolve({
            status: res.status,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function logTest(category, name, passed, details = "") {
  const status = passed ? "✓ PASS" : "✗ FAIL";
  console.log(`  ${status} - ${name}`);
  if (details) console.log(`    → ${details}`);
  results[category].push({ name, passed, details });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ========== MANAGER TESTS ==========
async function testManager() {
  console.log("\n╔════════════════════════════════════════╗");
  console.log("║  MANAGER TESTS (Staff & Shift Control) ║");
  console.log("╚════════════════════════════════════════╝\n");

  let adminCookie = "";
  let userId = "";

  // Test 1: Admin Login
  console.log("1. Authentication & Setup");
  try {
    const loginRes = await makeRequest("POST", "/api/admin-login", {
      username: "GUSTO",
      password: process.env.ADMIN_PASSWORD || "test123",
    });

    const passed = loginRes.status === 200 && loginRes.body.user;
    logTest("manager", "Admin Login", passed, loginRes.body.user?.name);

    if (loginRes.headers["set-cookie"]) {
      adminCookie = loginRes.headers["set-cookie"][0].split(";")[0];
    }
  } catch (err) {
    logTest("manager", "Admin Login", false, err.message);
  }

  // Test 2: Create Staff Member
  console.log("\n2. Staff Management");
  try {
    const staffRes = await makeRequest(
      "POST",
      "/api/users",
      {
        name: "Test Bartender",
        pin: "1234",
        role: "employee",
        defaultLanguage: "en",
      },
      { Cookie: adminCookie },
    );

    const passed = staffRes.status === 201 && staffRes.body.id;
    logTest("manager", "Create Staff Member", passed, staffRes.body.name);
    userId = staffRes.body.id;
  } catch (err) {
    logTest("manager", "Create Staff Member", false, err.message);
  }

  // Test 3: Get Staff List
  try {
    const listRes = await makeRequest("GET", "/api/users", null, {
      Cookie: adminCookie,
    });

    const passed = listRes.status === 200 && Array.isArray(listRes.body);
    logTest(
      "manager",
      "Get Staff List",
      passed,
      `${listRes.body.length} staff`,
    );
  } catch (err) {
    logTest("manager", "Get Staff List", false, err.message);
  }

  // Test 4: Update Staff Member
  try {
    const updateRes = await makeRequest(
      "PATCH",
      `/api/users/${userId}`,
      {
        name: "Updated Bartender",
        defaultLanguage: "es",
      },
      { Cookie: adminCookie },
    );

    const passed = updateRes.status === 200 && updateRes.body.name;
    logTest(
      "manager",
      "Update Staff Member",
      passed,
      updateRes.body.name || updateRes.status,
    );
  } catch (err) {
    logTest("manager", "Update Staff Member", false, err.message);
  }

  // Test 5: Start Shift
  console.log("\n3. Shift Management");
  let shiftId = "";
  try {
    const shiftRes = await makeRequest(
      "POST",
      "/api/shifts",
      {
        startedByUserId: userId,
        openingBalance: 500,
      },
      { Cookie: adminCookie },
    );

    const passed = shiftRes.status === 201 && shiftRes.body.id;
    logTest("manager", "Start Shift", passed, `Shift ${shiftRes.body.id}`);
    shiftId = shiftRes.body.id;
  } catch (err) {
    logTest("manager", "Start Shift", false, err.message);
  }

  // Test 6: Get Active Shift
  try {
    const activeRes = await makeRequest("GET", "/api/shifts/active", null, {
      Cookie: adminCookie,
    });

    const passed = activeRes.status === 200 && activeRes.body.id;
    logTest(
      "manager",
      "Get Active Shift",
      passed,
      activeRes.body.status || activeRes.status,
    );
  } catch (err) {
    logTest("manager", "Get Active Shift", false, err.message);
  }

  // Test 7: Create Rush Event
  console.log("\n4. Rush Event Management");
  try {
    const rushRes = await makeRequest(
      "POST",
      "/api/rushes",
      {
        title: "Cruise Ship Arrival",
        type: "cruise",
        impact: "high",
        startTime: new Date().toISOString(),
        notes: "Test rush event",
      },
      { Cookie: adminCookie },
    );

    const passed = rushRes.status === 201 && rushRes.body.id;
    logTest("manager", "Schedule Rush Event", passed, rushRes.body.title);
  } catch (err) {
    logTest("manager", "Schedule Rush Event", false, err.message);
  }

  // Test 8: Get Rush Events
  try {
    const rushListRes = await makeRequest("GET", "/api/rushes", null, {
      Cookie: adminCookie,
    });

    const passed =
      rushListRes.status === 200 && Array.isArray(rushListRes.body);
    logTest(
      "manager",
      "Get Rush Events",
      passed,
      `${rushListRes.body.length} events`,
    );
  } catch (err) {
    logTest("manager", "Get Rush Events", false, err.message);
  }

  // Test 9: Batch Audit Session
  console.log("\n5. Inventory Audit Management");
  let auditSessionId = "";
  try {
    const auditRes = await makeRequest(
      "POST",
      "/api/inventory/audit-sessions",
      {
        typeFilter: "spirit",
        startedByUserId: userId,
      },
      { Cookie: adminCookie },
    );

    const passed = auditRes.status === 201 && auditRes.body.id;
    logTest("manager", "Create Batch Audit Session", passed, auditRes.body.id);
    auditSessionId = auditRes.body.id;
  } catch (err) {
    logTest("manager", "Create Batch Audit Session", false, err.message);
  }

  // Test 10: Get Audit Sessions
  try {
    const sessionsRes = await makeRequest(
      "GET",
      "/api/inventory/audit-sessions",
      null,
      { Cookie: adminCookie },
    );

    const passed =
      sessionsRes.status === 200 && Array.isArray(sessionsRes.body);
    logTest(
      "manager",
      "Get Audit Sessions",
      passed,
      `${sessionsRes.body.length} sessions`,
    );
  } catch (err) {
    logTest("manager", "Get Audit Sessions", false, err.message);
  }
}

// ========== EMPLOYEE TESTS ==========
async function testEmployee() {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║  EMPLOYEE TESTS (POS & Operations)   ║");
  console.log("╚══════════════════════════════════════╝\n");

  // Test 1: Employee PIN Login
  console.log("1. Authentication");
  let employeeCookie = "";
  let employeeId = "";

  try {
    const pinRes = await makeRequest("POST", "/api/pin-login", {
      pin: "1234",
    });

    const passed = pinRes.status === 200 && pinRes.body.user;
    logTest("employee", "PIN Login", passed, pinRes.body.user?.name);

    if (pinRes.headers["set-cookie"]) {
      employeeCookie = pinRes.headers["set-cookie"][0].split(";")[0];
      employeeId = pinRes.body.user.id;
    }
  } catch (err) {
    logTest("employee", "PIN Login", false, err.message);
  }

  // Test 2: Get Current User
  try {
    const userRes = await makeRequest("GET", "/api/auth/user", null, {
      Cookie: employeeCookie,
    });

    const passed = userRes.status === 200 && userRes.body.user;
    logTest("employee", "Get Current User", passed, userRes.body.user?.name);
  } catch (err) {
    logTest("employee", "Get Current User", false, err.message);
  }

  // Test 3: Clock In
  console.log("\n2. Shift Operations");
  try {
    const clockRes = await makeRequest(
      "POST",
      "/api/staff-shifts/clock-in",
      {
        userId: employeeId,
      },
      { Cookie: employeeCookie },
    );

    const passed = clockRes.status === 201 && clockRes.body.id;
    logTest("employee", "Clock In", passed, `Shift ${clockRes.body.id}`);
  } catch (err) {
    logTest("employee", "Clock In", false, err.message);
  }

  // Test 4: Get Active Shift
  try {
    const activeRes = await makeRequest("GET", "/api/shifts/active", null, {
      Cookie: employeeCookie,
    });

    const passed = activeRes.status === 200 && activeRes.body.id;
    logTest("employee", "Get Active Shift", passed, activeRes.body.id);
  } catch (err) {
    logTest("employee", "Get Active Shift", false, err.message);
  }

  // Test 5: Create Tab
  console.log("\n3. Tab & Order Operations");
  let tabId = "";
  try {
    const tabRes = await makeRequest(
      "POST",
      "/api/tabs",
      {
        tableName: "Table 5",
        covers: 2,
        openedByUserId: employeeId,
      },
      { Cookie: employeeCookie },
    );

    const passed = tabRes.status === 201 && tabRes.body.id;
    logTest("employee", "Create Tab", passed, tabRes.body.tableName);
    tabId = tabRes.body.id;
  } catch (err) {
    logTest("employee", "Create Tab", false, err.message);
  }

  // Test 6: Get Drinks
  try {
    const drinksRes = await makeRequest("GET", "/api/drinks", null, {
      Cookie: employeeCookie,
    });

    const passed = drinksRes.status === 200 && Array.isArray(drinksRes.body);
    logTest(
      "employee",
      "Get Drinks Menu",
      passed,
      `${drinksRes.body.length} drinks`,
    );
  } catch (err) {
    logTest("employee", "Get Drinks Menu", false, err.message);
  }

  // Test 7: Add Order to Tab
  let orderId = "";
  try {
    const orderRes = await makeRequest(
      "POST",
      `/api/tabs/${tabId}/orders`,
      {
        drinkId: "test-drink-1",
        quantity: 2,
        specialInstructions: "No ice",
      },
      { Cookie: employeeCookie },
    );

    const passed = orderRes.status === 201 && orderRes.body.id;
    logTest("employee", "Add Order to Tab", passed, `Order created`);
    orderId = orderRes.body.id;
  } catch (err) {
    logTest("employee", "Add Order to Tab", false, err.message);
  }

  // Test 8: Get Tab Details
  try {
    const tabDetailsRes = await makeRequest(`GET`, `/api/tabs/${tabId}`, null, {
      Cookie: employeeCookie,
    });

    const passed = tabDetailsRes.status === 200 && tabDetailsRes.body.id;
    logTest(
      "employee",
      "Get Tab Details",
      passed,
      `${tabDetailsRes.body.orders?.length || 0} orders`,
    );
  } catch (err) {
    logTest("employee", "Get Tab Details", false, err.message);
  }

  // Test 9: Apply Discount to Order
  if (orderId) {
    try {
      const discountRes = await makeRequest(
        "PATCH",
        `/api/orders/${orderId}/discount`,
        {
          discountType: "percentage",
          discountValue: 10,
        },
        { Cookie: employeeCookie },
      );

      const passed = discountRes.status === 200;
      logTest(
        "employee",
        "Apply Order Discount",
        passed,
        `${discountRes.body.discount || 0} MXN discount`,
      );
    } catch (err) {
      logTest("employee", "Apply Order Discount", false, err.message);
    }
  }

  // Test 10: Close Tab - Cash Payment
  try {
    const closeRes = await makeRequest(
      "PATCH",
      `/api/tabs/${tabId}/close`,
      {
        paymentMethod: "cash",
        payments: [
          {
            method: "cash",
            amount: 500,
          },
        ],
      },
      { Cookie: employeeCookie },
    );

    const passed = closeRes.status === 200 && closeRes.body.status;
    logTest("employee", "Close Tab (Cash)", passed, `${closeRes.body.status}`);
  } catch (err) {
    logTest("employee", "Close Tab (Cash)", false, err.message);
  }

  // Test 11: Create Another Tab for Card Test
  let tab2Id = "";
  try {
    const tab2Res = await makeRequest(
      "POST",
      "/api/tabs",
      {
        tableName: "Table 6",
        covers: 1,
        openedByUserId: employeeId,
      },
      { Cookie: employeeCookie },
    );

    const passed = tab2Res.status === 201 && tab2Res.body.id;
    tab2Id = tab2Res.body.id;
  } catch (err) {
    logTest("employee", "Create Second Tab", false, err.message);
  }

  // Test 12: Close Tab - Card Payment
  if (tab2Id) {
    try {
      const closeRes = await makeRequest(
        "PATCH",
        `/api/tabs/${tab2Id}/close`,
        {
          paymentMethod: "card",
          payments: [
            {
              method: "card",
              amount: 300,
            },
          ],
        },
        { Cookie: employeeCookie },
      );

      const passed = closeRes.status === 200 && closeRes.body.status;
      logTest(
        "employee",
        "Close Tab (Card)",
        passed,
        `${closeRes.body.status}`,
      );
    } catch (err) {
      logTest("employee", "Close Tab (Card)", false, err.message);
    }
  }

  // Test 13: Clock Out
  console.log("\n4. End of Shift");
  try {
    const clockOutRes = await makeRequest(
      "POST",
      "/api/staff-shifts/clock-out",
      {
        userId: employeeId,
      },
      { Cookie: employeeCookie },
    );

    const passed = clockOutRes.status === 200;
    logTest("employee", "Clock Out", passed, "End of shift recorded");
  } catch (err) {
    logTest("employee", "Clock Out", false, err.message);
  }
}

// ========== ACCOUNTANT TESTS ==========
async function testAccountant() {
  console.log("\n╔═══════════════════════════════════════╗");
  console.log("║  ACCOUNTANT TESTS (Reports & Audit)   ║");
  console.log("╚═══════════════════════════════════════╝\n");

  let adminCookie = "";

  // Test 1: Admin Login for Accountant
  console.log("1. Authentication & Setup");
  try {
    const loginRes = await makeRequest("POST", "/api/admin-login", {
      username: "GUSTO",
      password: process.env.ADMIN_PASSWORD || "test123",
    });

    const passed = loginRes.status === 200 && loginRes.body.user;
    logTest("accountant", "Admin Login", passed, loginRes.body.user?.name);

    if (loginRes.headers["set-cookie"]) {
      adminCookie = loginRes.headers["set-cookie"][0].split(";")[0];
    }
  } catch (err) {
    logTest("accountant", "Admin Login", false, err.message);
  }

  // Test 2: Get Sales Analytics
  console.log("\n2. Sales Analytics");
  try {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7);

    const analyticsRes = await makeRequest(
      "GET",
      `/api/analytics/sales?startDate=${startDate.toISOString()}&endDate=${today.toISOString()}`,
      null,
      { Cookie: adminCookie },
    );

    const passed = analyticsRes.status === 200 && analyticsRes.body.summary;
    logTest(
      "accountant",
      "Get Sales Analytics",
      passed,
      `Total: ${analyticsRes.body.summary?.totalSales || 0}`,
    );
  } catch (err) {
    logTest("accountant", "Get Sales Analytics", false, err.message);
  }

  // Test 3: Get Void Analytics
  try {
    const voidRes = await makeRequest(
      "GET",
      "/api/analytics/voids?days=7",
      null,
      { Cookie: adminCookie },
    );

    const passed = voidRes.status === 200 && voidRes.body.summary;
    logTest(
      "accountant",
      "Get Void Analytics",
      passed,
      `${voidRes.body.summary?.totalVoids || 0} voids`,
    );
  } catch (err) {
    logTest("accountant", "Get Void Analytics", false, err.message);
  }

  // Test 4: Create Period
  console.log("\n3. Accounting Period Management");
  let periodId = "";
  try {
    const periodRes = await makeRequest(
      "POST",
      "/api/periods",
      {
        name: "Test Period",
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { Cookie: adminCookie },
    );

    const passed = periodRes.status === 201 && periodRes.body.id;
    logTest("accountant", "Create Period", passed, periodRes.body.name);
    periodId = periodRes.body.id;
  } catch (err) {
    logTest("accountant", "Create Period", false, err.message);
  }

  // Test 5: Get Periods
  try {
    const periodsRes = await makeRequest("GET", "/api/periods", null, {
      Cookie: adminCookie,
    });

    const passed = periodsRes.status === 200 && Array.isArray(periodsRes.body);
    logTest(
      "accountant",
      "Get Periods",
      passed,
      `${periodsRes.body.length} periods`,
    );
  } catch (err) {
    logTest("accountant", "Get Periods", false, err.message);
  }

  // Test 6: Get Open Period
  try {
    const openRes = await makeRequest("GET", "/api/periods/open", null, {
      Cookie: adminCookie,
    });

    const passed = openRes.status === 200 && openRes.body.id;
    logTest("accountant", "Get Open Period", passed, openRes.body.name);
  } catch (err) {
    logTest("accountant", "Get Open Period", false, err.message);
  }

  // Test 7: Get Inventory Items
  console.log("\n4. Inventory Audit System");
  try {
    const invRes = await makeRequest("GET", "/api/inventory/items", null, {
      Cookie: adminCookie,
    });

    const passed = invRes.status === 200 && Array.isArray(invRes.body);
    logTest(
      "accountant",
      "Get Inventory Items",
      passed,
      `${invRes.body.length} items`,
    );
  } catch (err) {
    logTest("accountant", "Get Inventory Items", false, err.message);
  }

  // Test 8: Get Low Stock Items
  try {
    const lowStockRes = await makeRequest(
      "GET",
      "/api/inventory/low-stock",
      null,
      { Cookie: adminCookie },
    );

    const passed =
      lowStockRes.status === 200 && Array.isArray(lowStockRes.body);
    logTest(
      "accountant",
      "Get Low Stock Items",
      passed,
      `${lowStockRes.body.length} items low`,
    );
  } catch (err) {
    logTest("accountant", "Get Low Stock Items", false, err.message);
  }

  // Test 9: Get Audit Logs
  console.log("\n5. Audit Trail");
  try {
    const auditRes = await makeRequest(
      "GET",
      "/api/inventory-audits/history",
      null,
      { Cookie: adminCookie },
    );

    const passed = auditRes.status === 200 && Array.isArray(auditRes.body);
    logTest(
      "accountant",
      "Get Audit History",
      passed,
      `${auditRes.body.length} audits`,
    );
  } catch (err) {
    logTest("accountant", "Get Audit History", false, err.message);
  }

  // Test 10: Get System Defaults
  console.log("\n6. System Configuration");
  try {
    const defaultsRes = await makeRequest(
      "GET",
      "/api/settings/defaults",
      null,
      { Cookie: adminCookie },
    );

    const passed =
      defaultsRes.status === 200 && defaultsRes.body.defaultAlcoholDensity;
    logTest(
      "accountant",
      "Get System Defaults",
      passed,
      `Density: ${defaultsRes.body.defaultAlcoholDensity}`,
    );
  } catch (err) {
    logTest("accountant", "Get System Defaults", false, err.message);
  }

  // Test 11: Get Active Specials
  try {
    const specialsRes = await makeRequest("GET", "/api/specials/active", null, {
      Cookie: adminCookie,
    });

    const passed =
      specialsRes.status === 200 && Array.isArray(specialsRes.body);
    logTest(
      "accountant",
      "Get Active Specials",
      passed,
      `${specialsRes.body.length} active`,
    );
  } catch (err) {
    logTest("accountant", "Get Active Specials", false, err.message);
  }

  // Test 12: CSV Export - Sales
  console.log("\n7. Data Export");
  try {
    const exportRes = await makeRequest("GET", "/api/export/sales", null, {
      Cookie: adminCookie,
    });

    const passed =
      exportRes.status === 200 && typeof exportRes.body === "string";
    logTest(
      "accountant",
      "Export Sales CSV",
      passed,
      passed ? "Export successful" : exportRes.status,
    );
  } catch (err) {
    logTest("accountant", "Export Sales CSV", false, err.message);
  }

  // Test 13: CSV Export - Inventory
  try {
    const exportRes = await makeRequest("GET", "/api/export/inventory", null, {
      Cookie: adminCookie,
    });

    const passed =
      exportRes.status === 200 && typeof exportRes.body === "string";
    logTest(
      "accountant",
      "Export Inventory CSV",
      passed,
      passed ? "Export successful" : exportRes.status,
    );
  } catch (err) {
    logTest("accountant", "Export Inventory CSV", false, err.message);
  }

  // Test 14: CSV Export - Audit Logs
  try {
    const exportRes = await makeRequest("GET", "/api/export/audit-logs", null, {
      Cookie: adminCookie,
    });

    const passed =
      exportRes.status === 200 && typeof exportRes.body === "string";
    logTest(
      "accountant",
      "Export Audit Logs CSV",
      passed,
      passed ? "Export successful" : exportRes.status,
    );
  } catch (err) {
    logTest("accountant", "Export Audit Logs CSV", false, err.message);
  }
}

// ========== MAIN EXECUTION ==========
async function main() {
  console.log(
    "\n╔═══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║           GUSTOPOS COMPREHENSIVE SYSTEM TEST (v0.1.0)          ║",
  );
  console.log(
    "║      Testing: Manager | Employee | Accountant Workflows       ║",
  );
  console.log(
    "╚═══════════════════════════════════════════════════════════════╝",
  );

  console.log(`\nTarget: ${BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  // Check if server is running
  try {
    const healthRes = await makeRequest("GET", "/api/healthz");
    if (healthRes.status !== 200) {
      console.error("❌ Server is not responding correctly!");
      process.exit(1);
    }
    console.log("✓ Server is running\n");
  } catch (err) {
    console.error("❌ Cannot connect to server at " + BASE_URL);
    console.error(err.message);
    process.exit(1);
  }

  // Run all tests
  await testManager();
  await testEmployee();
  await testAccountant();

  // Print Results
  console.log(
    "\n╔═══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    "║                        TEST RESULTS                            ║",
  );
  console.log(
    "╚═══════════════════════════════════════════════════════════════╝\n",
  );

  const allTests = [
    ...results.manager.map((t) => ({ ...t, role: "Manager" })),
    ...results.employee.map((t) => ({ ...t, role: "Employee" })),
    ...results.accountant.map((t) => ({ ...t, role: "Accountant" })),
  ];

  const passed = allTests.filter((t) => t.passed).length;
  const failed = allTests.filter((t) => !t.passed).length;

  console.log(
    `MANAGER Tests:    ${results.manager.filter((t) => t.passed).length}/${results.manager.length} passed`,
  );
  console.log(
    `EMPLOYEE Tests:   ${results.employee.filter((t) => t.passed).length}/${results.employee.length} passed`,
  );
  console.log(
    `ACCOUNTANT Tests: ${results.accountant.filter((t) => t.passed).length}/${results.accountant.length} passed`,
  );

  console.log(`\nTOTAL: ${passed}/${allTests.length} tests passed\n`);

  if (failed > 0) {
    console.log("FAILED TESTS:");
    allTests
      .filter((t) => !t.passed)
      .forEach((t) => {
        console.log(`  ✗ [${t.role}] ${t.name}`);
        if (t.details) console.log(`    → ${t.details}`);
      });
  }

  const passRate = Math.round((passed / allTests.length) * 100);
  console.log(`\nPASS RATE: ${passRate}%`);

  if (passRate === 100) {
    console.log("\n🎉 ALL TESTS PASSED! System is fully functional.\n");
  } else if (passRate >= 80) {
    console.log("\n⚠️  Most tests passed, but some issues remain.\n");
  } else {
    console.log("\n❌ Multiple tests failed. System needs fixes.\n");
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

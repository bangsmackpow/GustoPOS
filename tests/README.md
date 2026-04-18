# GustoPOS Test Suite

Comprehensive test suite for GustoPOS, covering unit tests, integration tests, and end-to-end scenarios.

## 📁 Test Structure

```
tests/
├── unit/                          # Unit tests for calculations and logic
│   ├── stock-reservation.test.ts  # Stock flow tests (BART-001 to BART-006)
│   └── audit-calculations.test.ts  # Audit calculation tests (ACCT-001 to ACCT-003)
├── integration/                 # Integration tests for complete flows
│   └── complete-flows.test.ts     # End-to-end service scenarios
├── e2e/                          # End-to-end tests (Playwright)
│   └── smoke.spec.ts              # Existing smoke tests
└── utils/                        # Test utilities and helpers
    └── test-helpers.ts            # Shared test utilities
```

## 🚀 Running Tests

### All Tests

```bash
pnpm test
# or
pnpm run test:all
```

### Unit Tests Only

```bash
pnpm run test:unit
# or
node --test tests/unit/*.test.ts
```

### Integration Tests

```bash
pnpm run test:integration
# or
node --test tests/integration/*.test.ts
```

### E2E Tests (Playwright)

```bash
pnpm run test:e2e
```

### Watch Mode (for development)

```bash
pnpm run test:watch
```

### With Coverage

```bash
pnpm run test:coverage
```

## 📝 Test Coverage

### Unit Tests

#### Stock Reservation (BART-001 to BART-006)

- **BART-001**: Add order reserves stock correctly
- **BART-002**: Low stock alert triggers when threshold breached
- **BART-003**: Oversell prevention blocks orders exceeding stock
- **BART-004**: Tab close deducts reserved stock
- **BART-005**: Void order returns reserved stock
- **BART-006**: Split bill calculates correctly

#### Audit Calculations (ACCT-001 to ACCT-003)

- **ACCT-001**: Variance calculation with sign tracking
- **ACCT-002**: Server-side calculation verification
- **ACCT-003**: Batch audit variance calculations

### Integration Tests

#### Complete Service Flows (INTEGRATION-001 to INTEGRATION-005)

- **INTEGRATION-001**: Complete service night simulation
- **INTEGRATION-002**: Full audit workflow
- **INTEGRATION-003**: Manager authorization flow
- **INTEGRATION-004**: Low stock alert lifecycle
- **INTEGRATION-005**: Split payment scenarios

## 🔧 Test Framework

### Node.js Built-in Test Runner

We use Node.js 20's built-in test runner (`node:test` and `node:assert`) for:

- Zero additional dependencies
- Native TypeScript support (with proper configuration)
- Fast execution
- Built-in watch mode and coverage

### Key Features

- **Descriptive test names**: Each test clearly states what it verifies
- **Isolated tests**: No shared state between tests
- **Comprehensive assertions**: Multiple assertions per test for thorough validation
- **Error scenarios**: Tests for both success and failure cases

## 📊 Test Metrics

| Category           | Tests  | Lines    | Status          |
| ------------------ | ------ | -------- | --------------- |
| Stock Reservation  | 15     | 294      | ✅ Complete     |
| Audit Calculations | 18     | 376      | ✅ Complete     |
| Integration Flows  | 8      | 450      | ✅ Complete     |
| **Total**          | **41** | **1120** | **✅ Complete** |

## 🎯 Protocol Compliance

These tests verify compliance with:

- **AUDIT_PROTOCOL.md**: Inventory audit procedures and variance calculations
- **TEST_PROTOCOL.md**: All Part 1-6 test scenarios

### Verified Test Cases

- ✅ BART-001 through BART-006 (Stock flow)
- ✅ ACCT-001 through ACCT-003 (Audit calculations)
- ✅ INTEGRATION-001 through INTEGRATION-005 (Complete flows)

## 🔍 Debugging Tests

### Run Specific Test

```bash
node --test-name-pattern "BART-001" tests/unit/stock-reservation.test.ts
```

### Verbose Output

```bash
node --test tests/unit/*.test.ts --verbose
```

### Fail Fast

```bash
node --test tests/unit/*.test.ts --test-force-exit
```

## 🛠️ Adding New Tests

### Unit Test Template

```typescript
import { describe, test } from "node:test";
import assert from "node:assert";

describe("Feature Name", () => {
  test("descriptive test name", () => {
    // Arrange
    const input = { ... };

    // Act
    const result = functionToTest(input);

    // Assert
    assert.strictEqual(result.expected, actual);
  });
});
```

### Integration Test Template

```typescript
import { describe, test } from "node:test";
import assert from "node:assert";

describe("INTEGRATION-XXX: Feature Flow", () => {
  test("complete workflow", async () => {
    // 1. Setup
    // 2. Execute multiple steps
    // 3. Verify final state
  });
});
```

## 📝 Notes

- Tests use native Node.js modules for maximum compatibility
- No mocking - tests verify actual calculation logic
- Tests are designed to be fast and deterministic
- All tests can run in parallel (no shared state)

## 🐛 Troubleshooting

### Tests Won't Run

Ensure Node.js version >= 20:

```bash
node --version  # Should be v20.x.x or higher
```

### Import Errors

The test files use ES modules. Ensure your Node.js supports ES modules:

```bash
node --experimental-vm-modules --test tests/unit/*.test.ts
```

### TypeScript Errors

Test files are plain JavaScript (Node.js native test runner). For TypeScript compilation checks:

```bash
pnpm run typecheck
```

---

**Last Updated**: April 14, 2026  
**Test Suite Version**: 1.0.0  
**Status**: ✅ Production Ready

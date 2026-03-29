---
name: notification-logic-tester
description: Validate and test SMTP-based notifications for GustoPOS. Use when modifying SMTP configuration, inventory alert logic, or shift report generation to ensure reliable and accurate email delivery.
---

# notification-logic-tester

Specialized guidance for ensuring the reliability of the GustoPOS notification system.

## Core Logic Locations
- Email Service: `artifacts/api-server/src/lib/email.ts`
- Triggers (Inventory): `artifacts/api-server/src/routes/tabs.ts`
- Triggers (Reports): `artifacts/api-server/src/routes/shifts.ts`

## Testing Procedures

### 1. SMTP Validation
Before deploying, verify SMTP settings in the Admin Settings portal:
- Ensure **Port 587** is used for TLS (most common for SMTP2GO).
- Verify **From Email** matches the allowed senders in your SMTP host.

### 2. Inventory Alert Thresholds
Verify that alerts only trigger when `currentStock` is actually less than or equal to `minimumStock`.
- **Test Case**: Add an order that drops stock exactly to the minimum. An email should fire.
- **Test Case**: Add another order. A second email should fire (unless a "sent" flag is implemented later to prevent spam).

### 3. Report Accuracy
Manually verify that the data sent in the `sendShiftReport` call matches the data displayed in the "End of Night" UI.
- Check Cash vs Card totals.
- Verify that only **closed** tabs are included in the report.

## Validation Checklist
- [ ] Is the SMTP password stored securely (handled by env or DB)?
- [ ] Do alerts use the `inventoryAlertEmail` from settings?
- [ ] Does `getEmailTransporter` return null gracefully if settings are missing?
- [ ] Are email sending errors logged but not crashing the request?

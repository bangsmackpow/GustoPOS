# GustoPOS Feature Testing Protocol

**Version:** 1.0  
**Date:** April 15, 2026  
**Purpose:** Comprehensive feature verification for GustoPOS application  
**Test Environment:** Production DMG - GustoPOS.app (not dev/localhost)

---

## Test Environment

| Item        | Details                         |
| ----------- | ------------------------------- |
| Application | GustoPOS.app (Production build) |
| Location    | /Applications/GustoPOS.app      |
| Database    | Internal SQLite                 |
| Browser     | Embedded WebView                |

**Note:** All testing must be performed on the installed .app, not in development mode or localhost.

---

## Test Checklist

### Phase 1: Authentication & Access

| #   | Feature             | Test Steps                                                         | Expected Result                          | Pass/Fail |
| --- | ------------------- | ------------------------------------------------------------------ | ---------------------------------------- | --------- |
| 1.1 | PIN Login           | Launch app → Select staff → Enter 4-digit PIN → Press Enter        | Login successful, dashboard loads        |           |
| 1.2 | Password Login      | Click "Use Password Login" → Enter username/password → Click Login | Login successful                         |           |
| 1.3 | Admin Login         | On login screen → Enter GUSTO + admin password                     | Admin access granted, Settings visible   |           |
| 1.4 | Language Toggle     | Click globe icon on login/PIN screen                               | Language switches between EN/ES          |           |
| 1.5 | Session Persistence | Login → Close app → Reopen                                         | Session maintained (or re-auth required) |           |
| 1.6 | Auto-Lock           | Leave app idle for configured time                                 | App locks, PIN required to unlock        |           |

---

### Phase 2: Dashboard

| #   | Feature           | Test Steps                                          | Expected Result                                    | Pass/Fail |
| --- | ----------------- | --------------------------------------------------- | -------------------------------------------------- | --------- |
| 2.1 | Shift Start       | Click "Start Shift" → Enter expected cash → Confirm | Shift created, status shows active                 |           |
| 2.2 | Shift Close       | Click "Close Shift" → Review summary → Confirm      | Shift closed, report generated                     |           |
| 2.3 | Staff Clock-In    | In Staff Clock-In Widget → Click staff name         | Staff marked as clocked in                         |           |
| 2.4 | Staff Clock-Out   | In Staff Clock-In Widget → Click clocked-in staff   | Staff marked as clocked out                        |           |
| 2.5 | Open Tabs Display | View dashboard                                      | Shows list of open tabs with totals                |           |
| 2.6 | Rush Events       | View Rush Events section                            | Shows upcoming events with impact level            |           |
| 2.7 | Rush Filter       | Click Today/Tomorrow/Week/All filters               | Events filtered correctly                          |           |
| 2.8 | Low Stock Alerts  | View Low Stock section                              | Shows items below threshold                        |           |
| 2.9 | Quick Stats       | View stat cards                                     | Open tabs, Running Sales, Low Stock, Events counts |           |

---

### Phase 3: Tab Management (Bartender)

| #    | Feature                  | Test Steps                                    | Expected Result                      | Pass/Fail |
| ---- | ------------------------ | --------------------------------------------- | ------------------------------------ | --------- |
| 3.1  | Create Tab               | Click "New Tab" → (Optional) Enter name       | Tab created, ready for orders        |           |
| 3.2  | View Tab                 | Click on open tab                             | Tab detail opens with orders         |           |
| 3.3  | Add Drink - Browse       | Open tab → Click category → Click drink       | Drink added to tab                   |           |
| 3.4  | Add Drink - Search       | Open tab → Press Ctrl+K → Search → Select     | Drink added to tab                   |           |
| 3.5  | Stock Status Display     | View drink card on menu                       | Shows green/yellow/red/OUT status    |           |
| 3.6  | Quantity Selection       | Hover drink card → Click +/- buttons          | Quantity changes, defaults to 1      |           |
| 3.7  | Modify Order Quantity    | Open tab → Click +/- on order                 | Quantity updates, total recalculates |           |
| 3.8  | Remove Order             | Swipe left or click delete on order           | Order removed, stock released        |           |
| 3.9  | Apply Per-Order Discount | Click tag icon on order → Select discount     | Discount applied, price updates      |           |
| 3.10 | Apply Promo Code         | Enter code in promo field → Apply             | Code validated, discount applied     |           |
| 3.11 | Cash Payment             | Click Cash → Enter tendered amount → Confirm  | Change calculated, tab closed        |           |
| 3.12 | Card Payment             | Click Card → Confirm                          | Tab closed, payment recorded         |           |
| 3.13 | Payment Confirmation     | Select payment method → Click Confirm Payment | Shows final totals before closing    |           |
| 3.14 | Add Tip                  | Enter tip or use preset buttons               | Tip added to total                   |           |
| 3.15 | Split Bill               | Click Split Bill → Select 2-10 ways           | Per-person amount calculated         |           |
| 3.16 | Process Split Payment    | Pay each person's share                       | Tab closes when all paid             |           |
| 3.17 | Void Order               | Click delete on order → Select reason         | Order marked voided, reason recorded |           |

---

### Phase 4: Inventory Management

| #    | Feature                | Test Steps                                       | Expected Result                       | Pass/Fail |
| ---- | ---------------------- | ------------------------------------------------ | ------------------------------------- | --------- |
| 4.1  | View Inventory         | Click Inventory in sidebar                       | List of items with stock levels       |           |
| 4.2  | Filter by Type         | Click type filter (All/Spirits/Beer/etc.)        | Items filtered correctly              |           |
| 4.3  | Search Inventory       | Enter search term                                | Items matching name shown             |           |
| 4.4  | Sort Columns           | Click column header                              | Sorts ascending/descending            |           |
| 4.5  | Add New Item           | Click Add Item → Fill form → Save                | Item added to inventory               |           |
| 4.6  | Edit Item              | Click item → Modify fields → Save                | Changes saved                         |           |
| 4.7  | Individual Audit       | Click item → Click Audit → Enter counts → Submit | Audit recorded, variance calculated   |           |
| 4.8  | View Audit History     | Navigate to audit history                        | Shows past audits with dates          |           |
| 4.9  | Variance Analysis      | Click Variance Analysis link                     | Shows items with variance trends      |           |
| 4.10 | Batch Audit - Create   | Settings → Batch Audit → Select filter           | Session created with items            |           |
| 4.11 | Batch Audit - Complete | Audit each item in session → Complete            | All audits recorded                   |           |
| 4.12 | Add Stock              | Click + on item → Enter quantity/cost            | Stock added, cost recorded            |           |
| 4.13 | Tracking Mode Display  | View item details                                | Shows ml (pool) or units (collection) |           |

---

### Phase 5: Menu/Drinks Management

| #   | Feature            | Test Steps                                | Expected Result               | Pass/Fail |
| --- | ------------------ | ----------------------------------------- | ----------------------------- | --------- |
| 5.1 | View Drinks        | Click Drinks in sidebar                   | Shows all drinks by category  |           |
| 5.2 | Filter by Category | Click category filter                     | Drinks filtered correctly     |           |
| 5.3 | Search Drinks      | Enter search term                         | Matching drinks shown         |           |
| 5.4 | Add Drink          | Click Add Drink → Fill form → Save        | Drink added to menu           |           |
| 5.5 | Edit Drink         | Click drink → Modify → Save               | Changes saved                 |           |
| 5.6 | Add Recipe         | Edit drink → Add ingredients with amounts | Recipe saved                  |           |
| 5.7 | View Recipe        | Click drink → View recipe                 | Shows ingredients and amounts |           |
| 5.8 | Toggle On-Menu     | Toggle isOnMenu option                    | Drink shows/hides on menu     |           |

---

### Phase 6: Settings (Admin)

| #    | Feature               | Test Steps                                   | Expected Result              | Pass/Fail |
| ---- | --------------------- | -------------------------------------------- | ---------------------------- | --------- |
| 6.1  | Staff Management      | Settings → Staff Management                  | Shows staff list             |           |
| 6.2  | Add Staff             | Click Add Staff → Fill form → Save           | Staff created                |           |
| 6.3  | Edit Staff            | Click edit on staff → Modify → Save          | Changes saved                |           |
| 6.4  | Archive Staff         | Toggle active status                         | Staff archived/hidden        |           |
| 6.5  | System Defaults       | Settings → System Defaults                   | Shows default values         |           |
| 6.6  | Update Defaults       | Modify defaults → Save                       | Changes applied to new items |           |
| 6.7  | Branding              | Settings → Branding                          | Bar name, icon settings      |           |
| 6.8  | Nightly Report Export | Settings → Configure export path             | Path saved                   |           |
| 6.9  | Bulk Import           | Settings → Import CSV → Map columns → Import | Items imported               |           |
| 6.10 | View Audit Logs       | Settings → Audit Logs                        | Shows all audit history      |           |
| 6.11 | Resume Batch Audit    | Settings → Audit Sessions → Click session    | Batch audit page opens       |           |

---

### Phase 7: Calendar & Promotions

| #   | Feature           | Test Steps                                | Expected Result        | Pass/Fail |
| --- | ----------------- | ----------------------------------------- | ---------------------- | --------- |
| 7.1 | View Calendar     | Click Calendar                            | Shows monthly calendar |           |
| 7.2 | Add Rush Event    | Click date → Add rush → Fill form         | Event created          |           |
| 7.3 | Edit/Delete Rush  | Click event → Modify/Delete               | Changes applied        |           |
| 7.4 | View Specials     | Calendar → Manage → Specials              | Shows specials list    |           |
| 7.5 | Create Special    | Add special → Set drink/schedule/discount | Special created        |           |
| 7.6 | View Promo Codes  | Calendar → Manage → Promos                | Shows promo codes      |           |
| 7.7 | Create Promo Code | Add code → Set discount/limits            | Code created           |           |

---

### Phase 8: Reports & Analytics

| #   | Feature           | Test Steps                      | Expected Result               | Pass/Fail |
| --- | ----------------- | ------------------------------- | ----------------------------- | --------- |
| 8.1 | Shift Reports     | Reports → Shifts                | Shows shift list with totals  |           |
| 8.2 | Shift Summary     | Click shift → View details      | Sales, orders, tips shown     |           |
| 8.3 | Analytics Report  | Reports → Analytics → Generate  | Sales breakdown by period     |           |
| 8.4 | Date Presets      | Click Today/Week/Month/etc.     | Date range changes            |           |
| 8.5 | Void Analytics    | Reports → Stats → Void Analysis | Shows voided orders by reason |           |
| 8.6 | Staff Performance | Reports → Stats → Staff Table   | Sales per staff member        |           |
| 8.7 | Top Sellers       | Reports → Stats → Top Sellers   | Best selling drinks           |           |

---

### Phase 9: Bilingual Support

| #   | Feature                   | Test Steps                     | Expected Result               | Pass/Fail |
| --- | ------------------------- | ------------------------------ | ----------------------------- | --------- |
| 9.1 | Language Switch - Login   | Click globe on login           | UI switches language          |           |
| 9.2 | Language Switch - PIN     | Click globe on PIN pad         | UI switches language          |           |
| 9.3 | Staff Language Preference | Set staff language in settings | Staff sees preferred language |           |
| 9.4 | All UI Text Translated    | Navigate through app           | All text in selected language |           |

---

### Phase 10: Error Handling & Edge Cases

| #    | Scenario                    | Test Steps                           | Expected Result                | Pass/Fail |
| ---- | --------------------------- | ------------------------------------ | ------------------------------ | --------- |
| 10.1 | Insufficient Stock          | Attempt to order when stock low      | Warning shown or order blocked |           |
| 10.2 | Out of Stock                | Attempt to order OUT item            | Item grayed out, cannot order  |           |
| 10.3 | Invalid Promo Code          | Enter invalid code                   | Error message shown            |           |
| 10.4 | Expired Promo Code          | Use expired code                     | Error message shown            |           |
| 10.5 | Network Disconnection       | Disconnect network during operation  | App handles offline gracefully |           |
| 10.6 | Concurrent Tab Modification | Two users modify same tab            | Changes sync correctly         |           |
| 10.7 | Negative Stock Prevention   | Attempt to reduce stock below zero   | Blocked, error shown           |           |
| 10.8 | Session Expiry              | Leave app idle until session expires | Re-authentication required     |           |

---

### Phase 11: End-to-End Workflows

| #    | Feature                    | Test Steps                                                 | Expected Result                             | Pass/Fail |
| ---- | -------------------------- | ---------------------------------------------------------- | ------------------------------------------- | --------- |
| 11.1 | Event Management           | Add an event using the calendar                            | Event displays correctly                    |           |
| 11.2 | Bulk Audit                 | Conduct a bulk audit to update multiple items              | Stock levels update, variance recorded      |           |
| 11.3 | Special Operations         | Use a special and verify the applied discount in a tab     | Special discount applies correctly          |           |
| 11.4 | Promo Operations           | Use a promo code and verify the order total                | Promo discount applied to tab               |           |
| 11.5 | Menu Item Creation         | Create a drink and add its recipes                         | Drink appears on menu with correct recipe   |           |
| 11.6 | Active Order Modification  | Modify a drink in an active tab                            | Tab total and reserved stock update         |           |

---

## Bug Reporting Template

For each failed test, document:

```
Test ID: _______
Feature: _______
Environment: _______
Steps to Reproduce:
1.
2.
3.

Expected Result: _______
Actual Result: _______
Severity: Critical / High / Medium / Low
Screenshots: [attach if applicable]
```

---

## Test Completion Summary

| Phase             | Tests  | Passed | Failed | Notes |
| ----------------- | ------ | ------ | ------ | ----- |
| 1. Authentication | 6      |        |        |       |
| 2. Dashboard      | 9      |        |        |       |
| 3. Tab Management | 17     |        |        |       |
| 4. Inventory      | 13     |        |        |       |
| 5. Drinks         | 8      |        |        |       |
| 6. Settings       | 11     |        |        |       |
| 7. Calendar       | 7      |        |        |       |
| 8. Reports        | 7      |        |        |       |
| 9. Bilingual      | 4      |        |        |       |
| 10. Edge Cases    | 8      |        |        |       |
| 11. End-To-End    | 6      |        |        |       |
| **TOTAL**         | **96** |        |        |       |

---

## Sign-Off

| Role          | Name | Date | Signature |
| ------------- | ---- | ---- | --------- |
| QA Tester     |      |      |           |
| Developer     |      |      |           |
| Product Owner |      |      |           |

---

_Document generated: April 15, 2026_

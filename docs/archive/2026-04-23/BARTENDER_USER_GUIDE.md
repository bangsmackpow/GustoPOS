# GustoPOS Bartender User Guide

**Version:** 1.0  
**Date:** April 15, 2026  
**For:** Bartenders, Servers, Bar Staff

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Login](#login)
3. [Starting Your Shift](#starting-your-shift)
4. [Dashboard Overview](#dashboard-overview)
5. [Managing Tabs](#managing-tabs)
6. [Adding Orders](#adding-orders)
7. [Applying Discounts](#applying-discounts)
8. [Closing Tabs](#closing-tabs)
9. [Split Bill](#split-bill)
10. [Ending Your Shift](#ending-your-shift)
11. [Quick Reference](#quick-reference)

---

## Getting Started

### Prerequisites

- Staff account with PIN or password
- Active shift started by manager (for clock-in feature)

### System Overview

GustoPOS is a bar management system designed for fast service:

- **Tabs**: Track customer orders and payments
- **Menu**: Browse available drinks
- **Dashboard**: Overview of your shift and open tabs

---

## Login

### Option 1: PIN Login (Fast)

1. Launch GustoPOS
2. Select your profile from the staff list
3. Enter your 4-digit PIN on the keypad
4. Press **Enter** or the checkmark

### Option 2: Password Login

1. Launch GustoPOS
2. Click **Use Password Login**
3. Enter your username and password
4. Click **Login**

### Language Toggle

- Click the **globe icon** to switch between English and Spanish

---

## Starting Your Shift

### If Your Manager Starts the Shift

1. Manager clicks **Start Shift** on Dashboard
2. Manager may enter expected cash in drawer
3. Your shift is now active

### Clocking In (If Enabled)

1. After manager starts shift, go to Dashboard
2. Find the **Staff Clock-In Widget**
3. Click your name to clock in
4. Your status changes to "Clocked In"

### Verifying Shift Status

- Dashboard shows "Active Shift" indicator
- Your name appears in the Staff Clock-In Widget

---

## Dashboard Overview

### Main Dashboard Elements

| Element     | Description                                 |
| ----------- | ------------------------------------------- |
| Open Tabs   | List of all open tabs (click to view)       |
| Rush Events | Upcoming scheduled events affecting service |
| Low Stock   | Items running low (notify manager)          |

**Note:** Active specials are shown on the Calendar page, not on Dashboard.

### Quick Stats Cards

| Stat             | Meaning                        |
| ---------------- | ------------------------------ |
| Open Tabs        | Number of active customer tabs |
| Running Sales    | Total value of open tabs       |
| Low Stock Alerts | Items needing restock          |
| Events           | Scheduled rushes today         |

---

## Managing Tabs

### Opening a New Tab

1. Click **New Tab** button
2. (Optional) Enter tab name or customer name
3. Tab is created and ready for orders

### Tab Statuses

| Status     | Meaning                  |
| ---------- | ------------------------ |
| **Open**   | Active, accepting orders |
| **Closed** | Paid, archived           |

### Viewing Tab Details

1. Click on any tab from the list
2. See all orders, totals, and payment options
3. Add more orders or process payment

---

## Adding Orders

### Step-by-Step Order Process

1. **Open the Tab**
   - Click on an open tab or create a new one

2. **Browse the Menu**
   - Categories shown in left sidebar
   - Click category to filter drinks
   - Or use search (Ctrl+K)

3. **Select a Drink**
   - Click on the drink card
   - Stock status indicator shows availability:
     - 🟢 Green: 15+ servings
     - 🟡 Yellow: 5-14 servings
     - 🔴 Red (pulsing): <5 servings
     - ⛔ Grayed OUT: No stock

4. **Set Quantity**
   - Use +/- buttons on hover to adjust quantity
   - Default is 1

5. **Add to Tab**
   - Single tap or click Add button
   - Order appears in tab immediately

### Order Modification

**Changing Quantity:**

1. Open tab detail
2. Find the order
3. Use +/- buttons to adjust
4. Changes save automatically

**Removing an Order:**

1. Open tab detail
2. Swipe left on order or click delete
3. Order is removed

### Stock Status Display

Each drink card shows real-time availability:

- **Green dot**: Available (15+ servings)
- **Yellow dot**: Medium stock (5-14 servings)
- **Red pulsing dot**: Low stock (<5 servings)
- **"OUT" label + grayed out**: No stock available

---

## Applying Discounts

### Per-Order Discounts

1. Open tab detail
2. Find the order to discount
3. Click the **tag icon** (discount button)
4. Choose discount type:
   - **Fixed Amount**: $2, $5, $10, or custom
   - **Percentage**: 10%, 15%, 20%, or custom
5. Preview shows updated price
6. Click **Apply**

### Discount Display

- Original price shown with strikethrough
- Discount amount shown below
- Final price highlighted

### Important Notes

- Only one discount per order
- If a special is already applied, system keeps the better deal
- Discounts require manager authorization for amounts over $20

---

## Closing Tabs

### Step-by-Step Close Process

1. **Open the Tab**
   - Click on the tab you want to close

2. **Review the Bill**
   - Check all orders are present
   - Verify quantities and prices
   - Note any discounts applied

3. **Select Payment Method**
   - **Cash**: Count money, enter amount tendered
   - **Card**: Process via card terminal
   - Selected method is highlighted

4. **Add Tip (Optional)**
   - Enter tip amount
   - Or use preset buttons: $2, $5, $10, 20%, 25%

5. **Confirm Payment**
   - Click **Confirm Payment**
   - Review final totals
   - Click **Close Tab** to finalize

6. **Payment Confirmation**
   - Receipt is generated
   - Tab moves to closed status
   - Stock is deducted from inventory

### Cash Payment Flow

```
1. Click "Cash" button
2. Enter amount tendered by customer
3. System calculates change due
4. Click "Confirm Payment"
5. Complete transaction
```

### Card Payment Flow

```
1. Click "Card" button
2. Click "Confirm Payment"
3. Process card on terminal
4. Transaction completes automatically
```

---

## Split Bill

### When to Use Split Bill

- Multiple customers sharing one tab
- Paying separately
- Uneven splits

### Split Bill Process

1. **Open the Tab**
   - Click on tab to close

2. **Click "Split Bill"**
   - Button appears in close dialog

3. **Choose Number of Ways**
   - Select 2-10 people
   - System shows per-person amount

4. **Process Each Payment**
   - Each person pays their share
   - Can use different payment methods

5. **Tab Closes When All Paid**
   - Final payment closes the tab

### Split Bill Display

```
Tab Total: $150.00
Split 3 Ways: $50.00 each

Payment 1: $50.00 (Cash) ✓
Payment 2: $50.00 (Card) ✓
Remaining: $50.00
```

---

## Ending Your Shift

### Clocking Out

1. Go to Dashboard
2. Find **Staff Clock-In Widget**
3. Click your name again
4. Status changes to "Clocked Out"

### Manager Closes Shift

Manager performs these steps:

1. Click **Close Shift** on Dashboard
2. Review summary:
   - Open tabs
   - Total sales
   - Low stock alerts
3. If all tabs are closed, click **Confirm Close**
4. If tabs remain open, decide:
   - **Cancel**: Return and close tabs first
   - **Force Close**: Close shift anyway (tabs stay open)

### Your Shift Summary

After shift ends, manager may provide:

- Total sales you processed
- Number of tabs opened/closed
- Tips collected
- Any issues to review

---

## Quick Reference

### Keyboard Shortcuts

| Shortcut | Action             |
| -------- | ------------------ |
| Ctrl+K   | Quick drink search |
| Esc      | Close modal/dialog |

### Stock Status Indicators

| Indicator      | Meaning       | Action        |
| -------------- | ------------- | ------------- |
| 🟢 Green       | 15+ servings  | Normal        |
| 🟡 Yellow      | 5-14 servings | Monitor       |
| 🔴 Red (pulse) | <5 servings   | Alert manager |
| ⛔ Grayed OUT  | No stock      | Cannot order  |

### Order Status Icons

| Icon | Meaning           |
| ---- | ----------------- |
| ✓    | Order complete    |
| 🕐   | Pending           |
| ⚠️   | Low stock warning |

### Common Workflows

**Quick Drink Order:**

```
1. Open tab
2. Search (Ctrl+K) or browse
3. Tap drink
4. Tap Add
```

**Cash Payment:**

```
1. Open tab
2. Click Cash
3. Enter tendered amount
4. Confirm
5. Close
```

**Split Payment:**

```
1. Open tab
2. Click Split Bill
3. Choose number of ways
4. Process each payment
5. Tab auto-closes
```

---

## Troubleshooting

| Issue              | Solution                          |
| ------------------ | --------------------------------- |
| Drink shows "OUT"  | Notify manager to restock         |
| Can't add order    | Check stock availability          |
| Payment failed     | Try again or use different method |
| Tab won't close    | Ensure payment processed          |
| Search not working | Use category filters instead      |

### Getting Help

- Contact manager for stock issues
- System errors should be reported to IT support
- Low stock alerts on dashboard notify managers

---

## Tips for Fast Service

1. **Learn keyboard shortcuts** - Ctrl+K for search saves time
2. **Use tabs efficiently** - One tab per customer group
3. **Watch stock indicators** - Alert manager before running out
4. **Process payments quickly** - Cash for speed, card for security
5. **Split bills early** - Avoid end-of-night rush

---

_End of Bartender User Guide_

# GustoPOS — User Manual

**Version:** 1.0  
**Last Updated:** 2026-04-04  
**Audience:** Bar staff, bartenders, servers

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Logging In](#logging-in)
3. [Dashboard](#dashboard)
4. [Managing Tabs](#managing-tabs)
5. [Adding Drinks to a Tab](#adding-drinks-to-a-tab)
6. [Editing Orders](#editing-orders)
7. [Closing a Tab](#closing-a-tab)
8. [Split Bill](#split-bill)
9. [Promo Codes](#promo-codes)
10. [Tips](#tips)
11. [Closing a Shift](#closing-a-shift)
12. [Viewing Reports](#viewing-reports)
13. [Quick Search](#quick-search)
14. [PIN Lock Screen](#pin-lock-screen)
15. [Forgot Password](#forgot-password)
16. [Language Switching](#language-switching)

---

## Getting Started

GustoPOS is a point-of-sale system designed for bars and restaurants. It runs in your web browser and can be accessed from any device on your network.

**What you can do with GustoPOS:**

- Open and manage customer tabs
- Add drinks and track inventory automatically
- Apply discounts and tips
- Split bills across multiple payment methods
- Close shifts and view end-of-night reports

---

## Logging In

### Admin Login (Email + Password)

1. Open the GustoPOS login page
2. Enter your **username/email**
3. Enter your **password**
4. Click **Login**

### PIN Login (Quick Switch)

If you're already logged in and need to switch users:

1. Click your name in the top navigation
2. Enter your **4-digit PIN**
3. You'll be switched to that user's account

### Forgot Password

If you've forgotten your password:

1. On the login page, click **Reset password with PIN**
2. Enter your **email**
3. Enter your **4-digit PIN**
4. Enter a **new password** (minimum 4 characters)
5. Confirm the new password
6. Click **Reset Password**

> **Note:** You must know your PIN to reset your password. If you've forgotten both your password and PIN, ask an administrator to reset it from Settings.

---

## Dashboard

The Dashboard is your home screen. It shows:

- **Active Shift** — The current shift name and who opened it
- **Quick Stats** — Sales summary for the current shift
- **Start Shift** — Button to begin a new shift
- **Close Shift** — Button to end the current shift (end of night)

### Starting a Shift

1. Click **Start Shift**
2. A shift is created with your name as the opener
3. You can now open tabs and process orders

### Closing a Shift

1. Click **Close Shift**
2. A summary appears showing:
   - Shift name
   - Number of open tabs (warning if any are still open)
   - Total sales for open tabs
   - Low stock item count
3. If open tabs exist, you can check **Force close with open tabs** to close anyway
4. Click **Close Shift** to confirm

> **Important:** All tabs should be closed before closing a shift. Open tabs will remain open if you force close.

---

## Managing Tabs

### Opening a New Tab

1. Click **Tabs** in the navigation
2. Click **New Tab**
3. Enter a **nickname** (table number, customer name, etc.)
4. Click **Open Tab**

### Viewing Open Tabs

- All open tabs are displayed as cards showing:
  - Tab nickname
  - Server name
  - Current total
  - Time since opened
- Use the **search bar** to find a tab by nickname

### Deleting a Tab

1. Click the **trash icon** on the tab card
2. Confirm the deletion
3. The tab and all its orders will be removed

> **Warning:** Deleting a tab permanently removes all orders on it.

---

## Adding Drinks to a Tab

1. Click on a tab to open its detail view
2. The right side shows the **drink menu** organized by category
3. Click a drink to add it to the tab
4. If a drink has multiple ingredient options, a selector will appear — choose the specific product
5. The drink appears on the **ticket** (left side) with quantity and price

### Categories

Drinks are organized into tabs: All, Cocktails, Beer, Wine, Shots, Non-Alcoholic, etc. Click a category to filter.

### Stock Status

- **Green** — Available
- **Yellow dot** — Low stock (fewer than 5 servings left)
- **Grayed out** — Out of stock (cannot be added)

### Viewing Recipe Details

Click the **info icon (ℹ️)** on any drink to see its recipe ingredients and current stock levels.

---

## Editing Orders

### Change Quantity

1. Hover over an order on the ticket
2. Click the **edit icon (✏️)**
3. Use **+** and **−** buttons or type a new quantity
4. Add or edit **notes** (special requests, allergies, etc.)
5. Click **Save**

### Remove an Order

1. Hover over an order on the ticket
2. Click the **trash icon (🗑️)**
3. Confirm the removal

---

## Closing a Tab

1. On the tab detail page, click **Close Tab**
2. The payment dialog opens with:
   - **Promo code** input (optional)
   - **Tip selector** — preset percentages (15%, 18%, 20%) or custom amount
   - **Summary** — Subtotal, Discount, Tip, Grand Total
3. Choose a payment method:
   - **Cash** (green button)
   - **Card** (secondary button)
4. The tab is closed and you return to the Tabs list

> **Note:** A tab must have at least one order before it can be closed.

---

## Split Bill

Split a tab across multiple payment methods:

1. Open the **Close Tab** dialog
2. Click the **Split Bill** toggle to turn it **ON**
3. For each payment:
   - Enter the **amount**
   - Enter the **tip** (optional, per payment)
   - Choose **Cash** or **Card**
4. Use **Split Evenly** to divide the total equally across all payments
5. Click **+ Add Payment** to add another payment
6. Click **✕ Remove** to remove a payment (must have at least one)
7. The **Payment Total** must match the **Grand Total** exactly
8. Click **Close Tab** to process all payments

> **Tip:** The payment total must equal the tab total within $0.01. If it doesn't, you'll see an error.

---

## Promo Codes

1. In the close tab dialog, enter a **promo code**
2. Press **Enter** or click **Apply**
3. If valid, the discount appears in the summary
4. If invalid, you'll see an error message

> Promo codes can be percentage-based or fixed-amount discounts. They are set up by an administrator in Settings.

---

## Tips

When closing a tab, you can add a tip:

- **Preset buttons:** 15%, 18%, 20%
- **None:** No tip
- **Custom amount:** Type any value in the input field

Tips are recorded per tab and included in shift reports.

---

## Viewing Reports

1. Click **Reports** in the navigation
2. Available reports:
   - **Shift Summary** — Overview of a specific shift
   - **Top Sellers** — Most popular drinks
   - **Inventory Used** — Stock consumption
   - **Sales by Category** — Revenue breakdown by drink category
   - **End of Night Report** — Full shift report

### Selecting a Shift

Use the shift selector to choose which shift's data to view. The active shift is selected by default.

### Starting/Closing Shifts from Reports

You can start or close a shift directly from the Reports page using the buttons at the top.

---

## Quick Search

Press **Ctrl+K** (or **Cmd+K** on Mac) from any page to open the quick search. This lets you quickly navigate to different sections of the app.

---

## PIN Lock Screen

If you step away from the POS, the screen will automatically lock after a period of inactivity (configurable by admin, default 5 minutes).

### Unlocking

1. Enter your **4-digit PIN**
2. Click **Unlock** (or press Enter)
3. The screen unlocks and the idle timer resets

### Manual Lock

Click the **lock icon** in the navigation bar to lock the screen immediately.

---

## Language Switching

GustoPOS supports English and Spanish.

1. Click the **language toggle** (EN/ES) in the navigation
2. The entire interface switches immediately

---

## Keyboard Shortcuts

| Shortcut           | Action                        |
| ------------------ | ----------------------------- |
| `Ctrl+K` / `Cmd+K` | Open quick search             |
| `Enter`            | Submit forms, confirm dialogs |
| `Escape`           | Close modals, cancel actions  |

---

## Troubleshooting

| Problem                     | Solution                                                                    |
| --------------------------- | --------------------------------------------------------------------------- |
| Can't log in                | Check your email and password. If locked out, use "Reset password with PIN" |
| Drink shows "Out of Stock"  | The ingredient inventory is depleted. Ask an admin to restock               |
| Can't close shift           | All tabs must be closed first. Use "Force close" if needed                  |
| Screen locked               | Enter your 4-digit PIN to unlock                                            |
| Payment total doesn't match | Split bill payments must equal the grand total exactly                      |
| Can't find a tab            | Use the search bar on the Tabs page                                         |

For more help, contact your system administrator.

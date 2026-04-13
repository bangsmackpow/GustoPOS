# USER_GUIDE.md - GustoPOS Staff Operations Guide

> **Last Updated**: April 10, 2026  
> **Version**: 1.0  
> **For**: Bar Staff, Bartenders, Managers, Admins

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Login & Authentication](#login--authentication)
3. [Dashboard](#dashboard)
4. [Managing Tabs](#managing-tabs)
5. [Taking Orders](#taking-orders)
6. [Processing Payments](#processing-payments)
7. [Inventory Basics](#inventory-basics)
8. [Drinks & Menu](#drinks--menu)
9. [Reports & Analytics](#reports--analytics)
10. [Settings for Staff](#settings-for-staff)

---

## Getting Started

### First Time Setup

1. **Launch the app** - The app opens to the login screen
2. **Admin login** - Your admin should have created your account
3. **PIN Setup** - You'll use a 4-digit PIN for quick login

### Daily Startup

1. Open GustoPOS
2. Enter your email + PIN
3. You're ready to start serving!

---

## Login & Authentication

### PIN Login

```
┌─────────────────────────┐
│  GUSTOPOS               │
│                         │
│  Email: [________]      │
│  PIN:   [____]          │
│                         │
│  [LOGIN]                │
└─────────────────────────┘
```

- 4-digit PIN
- Keep your PIN confidential
- PIN is linked to your user account

### Role Permissions

| Role          | What You Can Do                         |
| ------------- | --------------------------------------- |
| **Admin**     | Everything: users, settings, backups    |
| **Manager**   | Inventory, drinks, tabs, reports        |
| **Bartender** | Open tabs, take orders, basic inventory |
| **Server**    | View tabs, take orders                  |

---

## Dashboard

The dashboard shows your bar's current status at a glance:

- **Open Tabs**: How many tabs are currently open
- **Today's Sales**: Revenue for the day
- **Low Stock Items**: Items that need restocking

### Navigation

Use the left sidebar to navigate:

```
┌─────┬────────────┐
│ 📊  │ Dashboard   │
│ 🍹  │ Drinks     │
│ 📦  │ Inventory  │
│ 🧾  │ Tabs       │
│ 📈  │ Reports    │
│ ⚙️  │ Settings   │
└─────┴────────────┘
```

---

## Managing Tabs

### Opening a New Tab

1. Go to **Tabs** page
2. Click **+ New Tab**
3. Enter a name (table number, customer name, etc.)
4. Click **Create**

### Tab Status Indicators

| Status  | Color  | Meaning               |
| ------- | ------ | --------------------- |
| Open    | Green  | Active, taking orders |
| Pending | Yellow | Waiting for payment   |
| Closed  | Gray   | Paid, archived        |

### Closing a Tab

1. Open the tab
2. Click **Close Tab**
3. Select payment method(s)
4. Handle cash/card
5. Tab moves to history

---

## Taking Orders

### Adding Drinks to a Tab

1. Open a tab
2. Browse drinks by category or search
3. Click a drink to add
4. Set quantity (default: 1)
5. Add note if needed (extra ice, no lime, etc.)
6. Order appears in tab

### Order Modifications

Common modifications you can add as notes:

- Extra ice
- No ice
- Light ice
- Extra lime
- No lime
- Splash of soda
- Double shot

### Removing Items

1. Find the item in the tab
2. Click delete/remove
3. Confirm removal

_Note: For auditing, items deleted should have a reason recorded._

---

## Processing Payments

### Single Payment

1. Open tab
2. Click **Close Tab**
3. Select payment type:
   - Cash
   - Card
   - Other
4. Enter amount received
5. Change calculated automatically
6. Complete payment

### Split Payment

1. Open tab
2. Click **Close Tab**
3. Click **Split Payment**
4. Add multiple payment methods:
   - $50 cash
   - $75 card
5. Complete each separately

### Tip Handling

- Tips can be added to total
- Tracked separately for reporting

---

## Inventory Basics

### Viewing Inventory

1. Go to **Inventory** page
2. See all items with:
   - Name
   - Bottle size
   - Type (spirit, beer, etc.)
   - Current stock
   - Servings available
   - Cost per serving

### Filtering Items

Use the filter bar to find items:

- By type (spirits, beer, wine, mixers)
- By subtype (tequila, mezcal, etc.)
- Search by name
- View only "On Menu" items

### Viewing Trash

- Deleted items go to trash
- Admins can view and permanently delete
- "Clear Trash" empties all deleted items

### Understanding Stock

- **Servings** = Total ml ÷ serving size
- **Pooled** = Sum of parent + variations

---

## Drinks & Menu

### Viewing the Menu

1. Go to **Drinks** page
2. Browse by category:
   - Cocktails
   - Beer
   - Wine
   - Shots
   - Non-Alcoholic

### Drink Information

Each drink shows:

- Name (EN/ES)
- Category
- Price
- Cost to make
- Profit margin

### Adding New Drinks (Managers/Admins)

1. Go to **Drinks**
2. Click **+ Add Drink**
3. Enter name (English + Spanish)
4. Select category
5. Add ingredients/recipe
6. Set price or use suggested
7. Save

---

## Reports & Analytics

### Available Reports

| Report            | What It Shows                |
| ----------------- | ---------------------------- |
| Sales Summary     | Today's revenue, drinks sold |
| Top Sellers       | Most popular drinks          |
| Staff Performance | Sales per employee           |
| Inventory Usage   | What was used vs sold        |

### Running Reports

1. Go to **Reports** page
2. Select report type
3. Choose date range
4. View results

---

## Settings for Staff

### Changing Your Password

1. Go to **Settings**
2. Find your profile
3. Update password

### Language Preference

GustoPOS supports English and Spanish:

1. Go to **Settings**
2. Find your profile
3. Select language: EN or ES

### What Admins Can Do

Admins have access to:

- Create/edit/delete users
- Manage system settings
- Create backups
- Import/export data

---

## Quick Reference

### Common Tasks

| Task             | Where to Go            |
| ---------------- | ---------------------- |
| Open a tab       | Tabs → + New Tab       |
| Add drink to tab | Open tab → Click drink |
| Close a tab      | Tab → Close Tab        |
| View inventory   | Inventory              |
| Add inventory    | Inventory → + on item  |
| Check low stock  | Dashboard or Inventory |
| Create new drink | Drinks → + Add         |
| Run reports      | Reports                |

### Keyboard Shortcuts

| Shortcut | Action          |
| -------- | --------------- |
| Ctrl+K   | Search anywhere |
| Esc      | Close modal     |

---

## Getting Help

If you encounter issues:

1. **Check the app** - Is it responding?
2. **Restart** - Close and reopen the app
3. **Contact admin** - For permission issues or bugs

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical overview
- [OFFLINE_DESKTOP_GUIDE.md](./OFFLINE_DESKTOP_GUIDE.md) - App installation
- [INVENTORY_MANUAL.md](./inventory/INVENTORY_MANUAL.md) - Detailed inventory guide

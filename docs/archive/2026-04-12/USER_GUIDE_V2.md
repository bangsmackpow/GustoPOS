# GustoPOS User Guide

**Version**: 2.0 (Beta)  
**Last Updated**: April 12, 2026

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Authentication](#2-authentication)
3. [Dashboard](#3-dashboard)
4. [Tabs (Checks)](#4-tabs-checks)
5. [Menu/Drinks](#5-menudrinks)
6. [Inventory](#6-inventory)
7. [Reports](#7-reports)
8. [Settings](#8-settings)
9. [Keyboard Shortcuts](#9-keyboard-shortcuts)

---

## 1. Getting Started

### 1.1 System Requirements

| Component | Requirement                                  |
| --------- | -------------------------------------------- |
| OS        | macOS 10.15+, Windows 10+, or modern browser |
| Display   | 1024x768 minimum, 1920x1080 recommended      |
| Memory    | 4GB RAM minimum                              |
| Storage   | 500MB for application                        |

### 1.2 First Launch

1. **Start the application**
   - Desktop: Double-click GustoPOS icon
   - Development: Run `pnpm run dev`

2. **Initial Setup** (First time only)
   - Admin account is created via `ADMIN_PASSWORD` environment variable
   - Default: Username `GUSTO`, password set during startup

3. **Log in**
   - Enter your email and 4-digit PIN
   - Select language (English/Spanish)

### 1.3 Interface Overview

```
┌─────────────────────────────────────────────────────────────┐
│  [Sidebar]  │              [Main Content]                  │
│             │  ┌─────────────────────────────────────────┐ │
│  Dashboard  │  │ Header: Page Title + Staff Info         │ │
│  Tabs       │  ├─────────────────────────────────────────┤ │
│  Menu       │  │                                         │ │
│  Inventory  │  │ Content Area                            │ │
│  Reports    │  │ (Tables, Forms, Cards)                   │ │
│  Settings   │  │                                         │ │
│             │  │                                         │ │
│  ─────────  │  │                                         │ │
│  [EN/ES]    │  └─────────────────────────────────────────┘ │
│  Logout     │                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication

### 2.1 PIN Login

1. Enter your **email** address
2. Enter your **4-digit PIN**
3. Click **Login** or press Enter

> **Note**: PINs allow repeated digits (e.g., 1111, 2222)

### 2.2 Switching Staff

1. Click your **profile icon** in the top-right
2. Click **Switch Staff**
3. Enter credentials for new staff member

### 2.3 Auto-Lock

- System automatically locks after **5 minutes** of inactivity (configurable in Settings)
- Enter PIN to unlock

### 2.4 Language Toggle

- Click the **EN/ES** button in the sidebar to switch languages
- Language preference persists until changed

---

## 3. Dashboard

The dashboard provides a quick overview of current operations.

### 3.1 Quick Stats Cards

| Card                 | Description                   |
| -------------------- | ----------------------------- |
| **Open Tabs**        | Number of currently open tabs |
| **Running Sales**    | Total sales from open tabs    |
| **Low Stock Alerts** | Items below threshold         |

### 3.2 Shift Control

**Starting a Shift**:

1. Click **Start Shift** button
2. Shift is created with current timestamp
3. Only one active shift allowed at a time

**Closing a Shift**:

1. Click **Close Shift** button
2. Review summary (open tabs, sales, low stock)
3. Confirm or force-close if tabs remain open
4. Shift report is generated

### 3.3 Rush Events

Shows upcoming cruise ship and event schedules that may affect traffic:

- **Cruise**: Ship arrivals
- **Festival**: Local events
- **Music**: Live music events
- **Impact**: High/Medium/Low expected traffic

### 3.4 Low Stock Widget

Displays items that have fallen below their threshold. Click **Manage Inventory** to address.

---

## 4. Tabs (Checks)

### 4.1 Opening a Tab

1. Navigate to **Tabs** page
2. Click **+ New Tab**
3. Enter table number or customer name
4. Tab opens with $0.00 total

### 4.2 Adding Orders

1. With tab open, click **+ Add Drink**
2. Browse or search menu
3. Tap drink to add (quantity defaults to 1)
4. Tap again to increase quantity
5. Order appears in tab with price

### 4.3 Managing Orders

| Action              | How                                     |
| ------------------- | --------------------------------------- |
| **Change quantity** | Tap +/- buttons on order                |
| **Add note**        | Tap order, enter special instructions   |
| **Remove item**     | Swipe left or tap delete, select reason |

### 4.4 Void Reasons

When removing an order, select a reason:

- Customer Changed Mind
- Wrong Order
- Spilled
- Complimentary (Comp)
- Other

### 4.5 Applying Discounts

1. Click **Promo Code** field
2. Enter code (e.g., "WELCOME10")
3. Tap Apply
4. Discount shows in tab

**Valid Codes**:

- Percentage: "WELCOME10" = 10% off
- Fixed: "FIVE50" = $50 MXN off

### 4.6 Split Payments

1. Click **Close Tab**
2. Select **Split Bill**
3. Add payment methods:
   - Cash: Enter amount tendered
   - Card: Enter card amount
4. System calculates totals and change due

### 4.7 Closing a Tab

1. Click **Close Tab**
2. Select payment method (Cash/Card/Split)
3. Optionally add tip
4. Confirm payment
5. Inventory is finalized (stock deducted)
6. Receipt is generated

---

## 5. Menu/Drinks

### 5.1 Viewing Drinks

1. Navigate to **Menu** page
2. Browse by category or search
3. Tap drink to view details

### 5.2 Creating a Drink

1. Click **+ New Drink**
2. Enter:
   - **Name** (English)
   - **Spanish Name** (optional)
   - **Category**: Cocktail, Shot, Wine, Non-Alcoholic
   - **Price**: Selling price in MXN
   - **Tax Category**: Standard, Reduced, etc.
3. Add recipe ingredients:
   - Select ingredient from inventory
   - Enter amount (ml or units)
4. Click **Save**

### 5.3 Pricing

**Manual Pricing**: Set exact price
**Auto Pricing**: Uses markup factor:

```
Suggested Price = (Cost per Serving) × Markup Factor
```

### 5.4 Drink Categories

| Category      | Description          |
| ------------- | -------------------- |
| Cocktail      | Mixed drinks         |
| Shot          | Single serving shots |
| Wine          | Wine by glass        |
| Non-Alcoholic | Mocktails, sodas     |

### 5.5 Enabling/Disabling

Toggle **Available** switch to show/hide from POS menu.

---

## 6. Inventory

### 6.1 Inventory Types

GustoPOS supports two tracking methods:

#### Pool Mode (Weight-based)

- **Use for**: Spirits, mixers, liquid ingredients
- **Tracks**: ml (milliliters)
- **Fields**: `currentBulk` (full bottles) + `currentPartial` (ml in open bottle)

#### Collection Mode (Unit-based)

- **Use for**: Beer, merch, packaged goods
- **Tracks**: units
- **Fields**: `currentBulk` (cases) + `currentPartial` (loose units)

### 6.2 Adding Inventory

**Manual Entry**:

1. Navigate to **Inventory**
2. Click **+ Add Item**
3. Fill in fields:
   - Name, Spanish Name
   - Type: Spirit, Beer, Mixer, Ingredient, Merch, Misc
   - Subtype: Tequila, Vodka, etc.
   - Container Size (ml or units)
   - Order Cost (what you paid)
   - Current Stock
   - Low Stock Threshold
4. Configure tracking:
   - **Show on Menu**: Creates drink automatically
   - **Sell Single Serving**: Creates shot variant
5. Click **Save**

**Bulk Import**:

1. Go to **Settings** → **Data Management**
2. Click **Import Ingredients**
3. Upload CSV file
4. Map columns if needed
5. Choose strategy:
   - **Update**: Replace existing values
   - **Merge**: Keep existing, add new
   - **Skip**: Don't change existing
   - **Replace**: Delete all, import fresh
6. Click **Import**

### 6.3 Inventory Calculations

**Stock Display**:

```
Pool: X full bottles + Yml (e.g., "3 full + 375ml")
Collection: X full cases + Y units (e.g., "2 full + 6 units")
```

**With Weights** (if container weight provided):

- Shows exact: "350g" (weight of liquid)
- Without weights: "~375ml" (estimated)

### 6.4 Auditing Inventory

1. Click on an inventory item
2. Click **Audit** button
3. Enter physical count:
   - Full bottles/cases
   - Partial amount (ml or units)
4. System calculates variance:
   ```
   variance = reportedTotal - expectedTotal
   variancePercent = (variance / expectedTotal) × 100
   ```
5. Click **Save Audit**

### 6.5 Variance Analysis

Navigate to **Inventory** → **Variance** to see:

- Items with audit history
- Variance trends over time
- Recommendations (critical, high, medium, low)
- Filter by 7, 30, or 90 days

### 6.6 Tracking Modes

| Mode           | Behavior                                 |
| -------------- | ---------------------------------------- |
| **Auto**       | Automatically detects pool vs collection |
| **Pool**       | Force weight-based (ml) tracking         |
| **Collection** | Force unit-based tracking                |

---

## 7. Reports

### 7.1 Shift Reports

Access via **Reports** page or closing a shift:

**End of Night Report** includes:

- Total sales (MXN, USD, CAD)
- Cash vs Card breakdown
- Sales by staff
- Top sellers
- Sales by category
- Inventory used
- Low stock alerts
- Deleted items list

### 7.2 Sales Analytics

| Report      | Description                         |
| ----------- | ----------------------------------- |
| By Drink    | Revenue, quantity sold per item     |
| By Staff    | Performance metrics per employee    |
| By Category | Sales grouped by drink category     |
| Hourly      | Sales distribution throughout shift |

### 7.3 Staff Performance

Track employee metrics:

- Total orders
- Revenue generated
- Average order value
- Tips earned
- Orders/hour
- Revenue/hour

---

## 8. Settings

### 8.1 Branding

| Setting  | Description            |
| -------- | ---------------------- |
| Bar Name | Display name in header |
| Bar Icon | Icon shown in app      |

### 8.2 Exchange Rates

| Rate      | Default |
| --------- | ------- |
| USD → MXN | 17.50   |
| CAD → MXN | 12.80   |

### 8.3 System Defaults

Configure defaults for new inventory items:

| Setting             | Default         |
| ------------------- | --------------- |
| Alcohol Density     | 0.94            |
| Serving Size        | 44.36ml (1.5oz) |
| Bottle Size         | 750ml           |
| Units per Case      | 1               |
| Low Stock Threshold | 0               |
| Tracking Mode       | Auto            |
| Audit Method        | Auto            |
| Variance Warning    | 5%              |

### 8.4 Security

| Setting          | Description                           |
| ---------------- | ------------------------------------- |
| PIN Lock Timeout | Minutes before auto-lock (default: 5) |

### 8.5 Backups

| Feature     | Description                 |
| ----------- | --------------------------- |
| Auto Backup | Periodic automatic backups  |
| USB Backup  | Backup to mounted USB drive |
| Litestream  | Cloud sync to S3            |

### 8.6 Staff Management

**Adding Staff**:

1. Go to **Settings** → **Staff**
2. Click **+ Add Staff**
3. Enter:
   - First Name, Last Name
   - Email (login identifier)
   - PIN (4 digits)
   - Role: Admin or Employee
   - Language preference
4. Click **Save**

**Editing Staff**:

- Click staff member to edit
- Change name, PIN, role, language
- Deactivate account instead of deleting

### 8.7 Rush Events

Schedule cruise ship and event notifications:

1. Go to **Settings** → **Rush Events**
2. Click **+ Add Event**
3. Enter:
   - Title (e.g., "Norwegian Pearl Arrival")
   - Type: Cruise, Festival, Music, Other
   - Impact: Low, Medium, High
   - Start/End Time
   - Repeat: Never, Weekly, Monthly, Daily
4. Click **Save**

---

## 9. Keyboard Shortcuts

| Shortcut        | Action             |
| --------------- | ------------------ |
| `⌘K` / `Ctrl+K` | Open quick search  |
| `Escape`        | Close modal/cancel |
| `Enter`         | Confirm action     |

---

## Troubleshooting

### Common Issues

| Issue                  | Solution                              |
| ---------------------- | ------------------------------------- |
| PIN not working        | Contact admin to reset                |
| Inventory not updating | Check reserved stock in open tabs     |
| Tab won't close        | Ensure all orders are paid or voided  |
| Low stock not showing  | Check threshold value                 |
| Bulk import fails      | Verify CSV format and required fields |

### Support

For issues, contact your system administrator or check the logs at:

- API logs: Console output
- Database: `gusto.db` in app directory

---

**End of User Guide**

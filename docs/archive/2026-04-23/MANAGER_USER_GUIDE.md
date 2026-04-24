# GustoPOS Manager User Guide

**Version:** 1.0  
**Date:** April 15, 2026  
**For:** Bar Managers, Owners, Administrators

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Admin Login](#admin-login)
3. [Staff Management](#staff-management)
4. [System Settings](#system-settings)
5. [Inventory Management](#inventory-management)
6. [Shift Management](#shift-management)
7. [Reports & Analytics](#reports--analytics)
8. [Data Export](#data-export)
9. [System Maintenance](#system-maintenance)

---

## Getting Started

### Prerequisites

- Admin account credentials (username: GUSTO)
- Access to the GustoPOS system

### Accessing Manager Functions

1. Launch GustoPOS
2. Log in with admin credentials
3. Navigate to **Settings** from the sidebar for most admin functions

---

## Admin Login

### Step-by-Step Login

1. **Launch the Application**
   - Open GustoPOS from the desktop icon or application folder

2. **Access Admin Login**
   - On the login screen, look for "Admin Login" or click the login icon
   - Enter username: `GUSTO`
   - Enter your admin password

3. **Verify Access**
   - Successful login shows the Dashboard with admin privileges
   - Access to Settings page is now enabled
   - Staff Management section is visible in Settings

### Troubleshooting Login Issues

| Issue           | Solution                         |
| --------------- | -------------------------------- |
| Wrong password  | Contact system administrator     |
| Account locked  | Wait 5 minutes or contact admin  |
| Session expired | Re-authenticate with credentials |

---

## Staff Management

### Accessing Staff Management

1. Click **Settings** in the sidebar
2. Scroll to **Staff Management** section
3. You can filter by: Active, Archived, or All

### Creating a New Staff Member

1. **Click "Add Staff"**
   - Button is in the top-right of Staff Management section

2. **Fill in Staff Details**

   ```
   Required Fields:
   - First Name *

   Optional Fields:
   - Username (for password login)
   - Email (for password recovery)
   - PIN (4 digits for PIN login)
   - Role: admin or employee
   ```

3. **Set Permissions**
   - **Employee**: Basic access for bartenders and servers
   - **Admin**: Full system access, can manage staff and settings

4. **Click Save**
   - Staff member is now available for login

### Staff Roles

| Role         | Description                                       |
| ------------ | ------------------------------------------------- |
| **admin**    | Full system access, can manage staff and settings |
| **employee** | Basic access for bartenders and servers           |

**Note:** Only "admin" and "employee" roles are supported. Manager-level permissions are assigned to specific staff members by the admin but are not stored as a separate role.

### Editing Staff

1. Click the **Edit** icon (pencil) next to the staff member
2. Modify the desired fields
3. Click **Save**

### Archiving Staff

1. Use the filter buttons at the top of Staff Management: **Active**, **Archived**, or **All**
2. To archive a staff member, click **Edit** and toggle their active status
3. Archived staff cannot log in but their historical data is preserved

### PIN Management

- PINs are optional for staff
- PINs allow quick login via PIN pad
- To reset a PIN, edit the staff member and clear/change the PIN field

---

## System Settings

### Branding & Configuration

**Location:** Settings > Branding & Configuration

| Setting        | Description                           |
| -------------- | ------------------------------------- |
| Bar Name       | Display name for receipts and headers |
| Brand Icon     | Icon shown in the app header          |
| USD → MXN Rate | Exchange rate for USD transactions    |
| CAD → MXN Rate | Exchange rate for CAD transactions    |

### Default Settings

**Location:** Settings > System Defaults

| Setting          | Default Value     | Purpose                              |
| ---------------- | ----------------- | ------------------------------------ |
| Alcohol Density  | 0.94              | For weight-to-volume calculations    |
| Serving Size     | 44.36 ml (1.5 oz) | Standard drink pour size             |
| Bottle Size      | 750 ml            | Default bottle size for new items    |
| Units Per Case   | 1                 | Default for collection items         |
| Tracking Mode    | auto              | Pool vs Collection detection         |
| Variance Warning | 5%                | Threshold for requiring audit reason |

### Email Configuration

**Location:** Settings > Email & Notifications

Configure SMTP settings for:

- Low stock alerts
- Shift report emails
- System notifications

### Backup Settings

**Location:** Settings > Backup Configuration

| Setting         | Description                             |
| --------------- | --------------------------------------- |
| Auto Backup     | Enable/disable automatic backups        |
| Interval        | How often backups are created (minutes) |
| Max Backups     | Maximum backups to retain               |
| USB Backup Path | External drive location for backups     |

---

## Inventory Management

### Accessing Inventory

1. Click **Inventory** in the sidebar
2. View all items or filter by type

### Adding Inventory Items

1. Click **Add Item** button
2. Fill in item details:

   ```
   Basic Info:
   - Name *
   - Type: spirit, beer, mixer, ingredient, merch, misc
   - Subtype (optional)

   Tracking:
   - Tracking Mode: Auto, Pool (weight-based), Collection (unit-based)
   - Bottle Size (ml) or Units Per Case

   Weights (for Pool tracking):
   - Full Bottle Weight (grams)
   - Container Weight (grams)
   - Density (default: 0.94)

   Serving:
   - Serving Size (ml for pool, units for collection)

   Stock:
   - Current Bulk (full bottles/cases)
   - Current Partial (grams for pool, units for collection)

   Pricing:
   - Order Cost (price per bottle/case)
   - Markup Factor (e.g., 3.0 = 300% markup)

   Options:
   - On Menu (show on drink menu)
   - Low Stock Threshold
   ```

3. Click **Save**

### Editing Inventory Items

1. Click on an item in the list OR click the Settings icon
2. Modify fields as needed
3. Click **Save**

### Using the WEIGH BOTTLE Section

For **Pool (weight-based)** items, use the WEIGH BOTTLE section:

| Field               | Purpose                          |
| ------------------- | -------------------------------- |
| Full Bottles        | Count of sealed full bottles     |
| Current Partial (g) | Weight of open bottle (in grams) |

**Note:** These values are saved directly to `currentBulk` and `currentPartial`.

### Adding Inventory Stock

1. Click the **+** icon next to an item
2. Enter:
   - Full Cases/Bottles added
   - Loose Units/Partial weight
   - Cost per case/bottle
3. Click **Save**

### Auditing Inventory

**Location:** Click **Audit Item** button in Edit Item modal

1. Open the item for editing
2. Click **Audit Item** button
3. Choose entry method:
   - **Bulk + Partial**: Enter full bottles and partial weight
   - **Total Only**: Enter total count directly
4. Enter audit counts
5. Click **Submit Audit**
6. Variance is calculated automatically

---

## Shift Management

### Starting a Shift

1. Ensure you are logged in as staff
2. On Dashboard, click **Start Shift**
3. (Optional) Enter expected cash in drawer
4. Click **Confirm**

### Viewing Active Shifts

- Active shift shows on Dashboard
- See staff members clocked in via **Staff Clock-In Widget**

### Closing a Shift

1. Click **Close Shift** on Dashboard
2. Review summary:
   - Open tabs count
   - Total sales
   - Low stock alerts
3. If tabs are open, choose:
   - **Cancel**: Return to dashboard
   - **Force Close**: Close shift anyway (tabs remain open)
4. Confirm closure

### Viewing Shift Reports

**Location:** Settings > Audit Logs > Shift Reports

Reports include:

- Total sales
- Order counts
- Tips collected
- Staff performance

---

## Reports & Analytics

### Accessing Reports

**Location:** Click **Reports** in the sidebar

### Available Reports

| Report            | Description                       |
| ----------------- | --------------------------------- |
| Sales Summary     | Daily/weekly/monthly sales totals |
| Staff Performance | Sales by staff member             |
| Void Analysis     | Orders voided with reasons        |
| Top Sellers       | Best performing drinks            |
| Inventory Value   | Current inventory worth           |

### Quick Date Filters

Preset filters for quick reporting:

- Today, Yesterday
- This Week, Last Week
- This Month, Last Month
- Last 7 Days, Last 30 Days, Last 90 Days
- Year to Date

---

## Data Export

### Export Formats

**Location:** Not yet implemented in UI  
**Note:** Export API endpoints exist but manual export UI is not yet available. Automated nightly report export is available in Settings.

| Export Type | Format | Contents               |
| ----------- | ------ | ---------------------- |
| Sales       | CSV    | All tab and order data |
| Inventory   | CSV    | Current stock levels   |
| COGS        | CSV    | Cost of goods sold     |
| Audit Logs  | CSV    | All audit records      |
| Periods     | CSV    | Period summaries       |

### Export Procedure

1. Click **Export** next to desired report type
2. File downloads automatically
3. Filename includes date range

---

## Promotional Codes & Specials

**Location:** Calendar > Manage tab (Admin only)

Promotional codes and drink specials are managed from the Calendar page:

1. Click **Calendar** in the sidebar
2. Click the **Manage** tab
3. Choose **Promos** or **Specials** section

### Promo Codes

- Create codes with discount types (percentage or fixed amount)
- Set usage limits and expiration dates
- Apply to tabs at close time

### Specials

- Create drink-specific, category, or global specials
- Schedule by day of week, hours, and date ranges
- Types: manual, happy_hour, promotional, bundle

---

## System Maintenance

### Creating a Backup

1. Go to **Settings** > **Backup Configuration**
2. Click **Create Backup Now**
3. Wait for confirmation

### Restoring from Backup

1. Go to **Settings** > **Backup Configuration**
2. Click **Restore Backup**
3. Select backup file
4. Confirm restoration

### Resetting Database

**Warning:** This deletes ALL data!

1. Go to **Settings** > **Danger Zone**
2. Click **Reset Database**
3. Enter password to confirm
4. System reinitializes with empty database

### Updating System Defaults

1. Go to **Settings** > **System Defaults**
2. Modify default values
3. Click **Save Defaults**

---

## Troubleshooting

### Common Issues

| Issue                  | Solution                              |
| ---------------------- | ------------------------------------- |
| Cannot access Settings | Log in as Admin                       |
| Staff cannot log in    | Check if Active status is enabled     |
| Inventory not saving   | Ensure all required fields are filled |
| Audit not working      | Verify staff has permission           |
| Export failing         | Check disk space and permissions      |

### Getting Help

For additional support:

1. Check the **Help** section in the app
2. Review audit logs for errors
3. Contact system administrator

---

## Quick Reference

### Keyboard Shortcuts

| Shortcut | Action       |
| -------- | ------------ |
| Ctrl+K   | Quick search |
| Esc      | Close modals |

### Role Permissions Matrix

| Feature         | Employee | Bartender | Manager | Admin |
| --------------- | -------- | --------- | ------- | ----- |
| Open/Close Tabs | ✓        | ✓         | ✓       | ✓     |
| Add Orders      | ✓        | ✓         | ✓       | ✓     |
| Void Orders     | ✗        | ✗         | ✓       | ✓     |
| View Reports    | ✗        | ✗         | ✓       | ✓     |
| Manage Staff    | ✗        | ✗         | ✗       | ✓     |
| System Settings | ✗        | ✗         | ✗       | ✓     |
| Export Data     | ✗        | ✗         | ✗       | ✓     |

---

_End of Manager User Guide_

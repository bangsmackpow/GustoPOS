# GustoPOS Administrator Guide

This guide covers administrative tasks including system configuration, user management, inventory setup, and reporting.

---

## Admin Access

### Logging In as Admin

1. Go to the login page
2. Tap **Admin Login** (or navigate to `/admin-login`)
3. Enter username and password
4. You receive admin privileges

### Default Admin Credentials

On first setup, the admin account is created with:

- **Username**: GUSTO
- **Password**: Set via `ADMIN_PASSWORD` environment variable

Change the password after first login.

---

## Staff Management

### Creating a Staff Account

1. Go to Settings
2. Tap **Staff** or **Users**
3. Tap **+ Add Staff**
4. Fill in:
   - First Name
   - Last Name
   - Username (unique)
   - PIN (4 digits)
   - Role: Employee or Admin
   - Language preference
5. Tap **Save**

### Editing a Staff Account

1. Go to Settings → Staff
2. Tap the staff member
3. Modify fields as needed
4. Tap **Save**

### Resetting a PIN

1. Go to Settings → Staff
2. Tap the staff member
3. Tap **Reset PIN**
4. Enter new 4-digit PIN
5. Staff member should change on next login

### Deactivating a Staff Account

1. Go to Settings → Staff
2. Tap the staff member
3. Toggle **Active** to off
4. The staff member can no longer log in

---

## Bar Settings

### Basic Information

1. Go to Settings
2. Edit **Bar Name** and **Bar Icon**
3. Changes apply immediately

### Currency Settings

Configure currency conversion rates:

- **Base Currency**: Default MXN
- **USD to MXN Rate**: For US dollar transactions
- **CAD to MXN Rate**: For Canadian dollar transactions

### Tax Configuration

1. Go to Settings → Tax Rates
2. Add or edit tax rates:
   - Category name
   - Rate (percentage)
   - Description

Common categories:

- Standard (16% VAT in Mexico)
- Reduced
- Zero-rated

---

## System Defaults

Configure default values for new inventory items:

1. Go to Settings → System Defaults

| Setting          | Description                 | Default           |
| ---------------- | --------------------------- | ----------------- |
| Alcohol Density  | Default density for spirits | 0.94              |
| Serving Size     | Default pour size (ml)      | 44.36 ml (1.5 oz) |
| Bottle Size      | Default bottle size (ml)    | 750 ml            |
| Units Per Case   | Default case count          | 1                 |
| Tracking Mode    | Auto, Pool, or Collection   | Auto              |
| Audit Method     | Auto or Manual              | Auto              |
| Variance Warning | Variance % to trigger alert | 5%                |

---

## Inventory Management

### Adding Inventory Items

1. Go to Inventory
2. Tap **+ Add Item**
3. Fill in details:

**Basic Info:**

- Name (English)
- Name (Spanish)
- Type: Spirit, Mixer, Beer, Wine, Merch, Misc
- Subtype (optional)

**Measurement:**

- Container Size (ml or units)
- Tracking Mode: Auto/Pool/Collection

**Pricing:**

- Order Cost (what you paid)
- Markup Factor (multiplier for price)

**Serving:**

- Serving Size (ml or units)
- Sell Single Serving (yes/no)
- Single Serving Price

**Weight (for Pool tracking):**

- Container Weight (g) - empty bottle
- Full Bottle Weight (g) - full bottle
- Density (g/ml) - typically 0.94 for alcohol

**Stock:**

- Current Bulk (full bottles)
- Current Partial (ml remaining in partial)
- Low Stock Threshold

4. Tap **Save**

### Bulk Import

Import multiple inventory items from CSV:

1. Go to Inventory
2. Tap **Import CSV**
3. Upload a CSV file with columns:
   - Name
   - NameEs
   - Type
   - ContainerSize
   - OrderCost
   - MarkupFactor
   - CurrentBulk
   - TrackingMode

Invalid rows are skipped and reported.

### Editing Inventory Items

1. Go to Inventory
2. Tap an item row
3. Edit fields
4. Tap **Save**

### Deleting Inventory Items

1. Go to Inventory
2. Tap an item row
3. Tap **Delete**
4. Confirm deletion

The item is soft-deleted (hidden but retained in database).

---

## Drinks Menu Management

### Adding a Drink

1. Go to Drinks
2. Tap **+ Add Drink**
3. Fill in:

**Basic Info:**

- Name (English)
- Name (Spanish)
- Description (optional)
- Category

**Pricing:**

- Base Price
- Markup Factor (optional override)
- Tax Category

**Availability:**

- Is Available (yes/no)
- Show On Menu (yes/no)

4. Tap **Save**

### Adding Recipe Ingredients

After creating a drink, add recipe:

1. Tap the drink
2. Tap **Edit Recipe**
3. Tap **+ Add Ingredient**
4. Select inventory item
5. Enter amount in ml
6. Repeat for all ingredients
7. Tap **Save Recipe**

The system calculates:

- Cost per serving (sum of ingredient costs)
- Selling price (cost × markup)
- Stock availability (can make X servings based on inventory)

### Editing Drinks

1. Go to Drinks
2. Tap a drink
3. Modify fields
4. Tap **Save**

### Deleting Drinks

1. Go to Drinks
2. Tap a drink
3. Tap **Delete**
4. Confirm

---

## Promotions

GustoPOS provides a flexible discount system with three levels:

1. **Promo Codes** - Global discount codes (tab-level)
2. **Specials** - Automatic drink-level or category-level discounts based on schedule
3. **Manual Discounts** - Per-order discounts applied by staff during service

### Creating Promo Codes

Promo codes are global discount codes that customers can enter at checkout.

1. Go to Settings → **Promo Codes**
2. Tap **+ Add Promo Code**
3. Configure:
   - **Code**: Unique code customers enter (e.g., "WELCOME10", "SAVE15")
   - **Description**: Internal notes (e.g., "New customer discount")
   - **Discount Type**:
     - **Percentage**: Apply as % of total (e.g., 10 = 10% off)
     - **Fixed Amount**: Apply as flat MXN (e.g., 50 = 50 MXN off)
   - **Discount Value**: The amount (10 for %, or 50 for MXN)
   - **Max Uses** (optional): Limit how many times code can be used (e.g., 100). Leave blank for unlimited.
   - **Expiration Date** (optional): After this date, code cannot be used. Leave blank for no expiration.
4. Toggle **Active** to enable/disable the code
5. Tap **Save**

**Example:**

- Code: `CINCO25`
- Discount Type: Percentage
- Discount Value: 25
- Max Uses: 50
- Expiration Date: May 5, 2026
- Result: 25% off, up to 50 uses, expires May 5

### Managing Specials

Specials are automatic drink-level discounts that apply based on schedule (e.g., happy hour, daily promotions). They can apply to:

- **Specific drinks** (e.g., "Margarita happy hour special")
- **Categories** (e.g., all beer specials)
- **All drinks** (e.g., "50% off all drinks on Tuesdays")

#### Creating a Special

1. Go to Settings → **Specials**
2. Tap **+ Add Special**
3. Configure:
   - **Name**: Description of special (e.g., "Happy Hour", "Margarita Monday")
   - **Type**:
     - **manual**: Manually enable/disable (no schedule)
     - **happy_hour**: Traditional happy hour pricing
     - **promotional**: Limited-time promotion
     - **bundle**: Bundle deal (multiple items)
   - **Apply To**:
     - **Specific Drink**: Select a drink from menu
     - **Category**: Apply to all drinks in category (e.g., "beer", "spirits")
     - **Global**: Apply to all drinks
   - **Discount Type**: Percentage or Fixed Amount
   - **Discount Value**: The amount (e.g., 25 for 25% off, or 50 for 50 MXN off)
   - **Days of Week**: Select which days special applies
   - **Start Hour & End Hour**: Time range (24-hour format, 0-23)
   - **Start Date & End Date** (optional): Calendar date range

4. Toggle **Active** to enable/disable
5. Tap **Save**

**How Specials Work:**

When a staff member adds an order to a tab, the system automatically checks if any specials apply:

- Matches the drink or category
- Today is in selected days of week
- Current time is between start/end hours
- Current date is within date range (if set)
- Special is marked Active

If multiple specials match, the highest discount applies automatically.

**Example - Happy Hour Special:**

- Name: `Happy Hour - 5-7pm`
- Apply To: Category → `All Spirits`
- Type: happy_hour
- Discount: 30% off
- Days: Monday, Tuesday, Wednesday, Thursday, Friday
- Hours: 17:00 - 19:00 (5pm-7pm)
- Dates: No limit
- Result: All spirit drinks 30% off on weekdays 5-7pm

**Example - Daily Promotion:**

- Name: `Margarita Monday`
- Apply To: Specific Drink → `Margarita`
- Type: promotional
- Discount: 50 MXN off
- Days: Monday
- Hours: 10:00 - 23:59 (all day)
- Result: 50 MXN off margaritas every Monday

### Manual Order Discounts

Staff can apply additional discounts to individual orders during service (beyond automatic specials):

1. In the **Tab Detail** page, tap the **discount icon** on any order
2. Choose a preset:
   - **Quick buttons**: $2, $5, $10, 10%, 15%, 20%
   - **Custom amount**: Enter any dollar amount or percentage
3. The discount is applied immediately
4. Tap elsewhere to close the discount modal

**Note:** If a special is already applied to an order, the system keeps whichever is **greater** (special or manual discount). This prevents accidentally reducing a customer's savings.

### Discount Priority

When multiple discounts could apply, the system uses this priority:

1. **Order-level discounts** are applied first (special + manual)
2. **Tab-level discounts** (promo codes) are applied to the final total
3. **Tax** is calculated on discounted amount
4. **Tip** is added last

**Example:**

- Margarita: 200 MXN
- Special: 30% off = 60 MXN off → 140 MXN
- Staff applies: 20 MXN more off → 120 MXN subtotal
- Customer applies promo code: 10% off tab → 108 MXN
- Tax (16%): 17.28 MXN
- Tip: Customer adds 20 MXN
- **Total: 145.28 MXN**

---

## Periods & Accounting

### Creating Periods

1. Go to Settings → Periods
2. Tap **+ New Period**
3. Configure:
   - Name (e.g., "April 2026")
   - Type: Daily, Weekly, or Monthly
   - Start Date
   - End Date
4. Tap **Create**

### Closing a Period

When you close a period, the system calculates:

- Total Sales
- Total Cost of Goods Sold (COGS)
- Total Tips
- Total Discounts
- Total Voids
- Total Comps
- Inventory Start Value
- Inventory End Value
- Gross Profit

1. Go to Settings → Periods
2. Tap a period
3. Tap **Close Period**
4. Review the summary
5. Confirm to close

Once closed, the period cannot be modified.

### COGS Reports

View cost of goods sold details:

1. Go to Settings → Periods
2. Tap a closed period
3. Tap **View COGS**
4. See per-item breakdown:
   - Item Name
   - Quantity Used
   - Unit Cost
   - Total Cost

---

## Reports & Analytics

### Sales Reports

Access from Reports page:

- **Analytics Tab**: Charts and graphs
- **Stats Tab**: Business metrics

**Available Reports:**

- Sales by date range
- Top selling drinks
- Sales by category
- Peak hours analysis

### Void Analytics

Track voided orders:

1. Go to Reports → Stats
2. Scroll to **Void Analysis**

Shows:

- Total voids
- Void value
- Void rate (% of orders)
- Voids by reason:
  - Customer Changed Mind
  - Wrong Order
  - Spilled
  - Complementary
  - Other
- Top voided drinks
- Staff void statistics

### Staff Performance

View staff metrics:

1. Go to Reports → Stats
2. View **Staff Performance** table

Metrics per employee:

- Total Sales
- Number of Tabs
- Average Ticket
- Total Tips
- Orders per Hour
- Revenue per Hour

### Exporting Data

Export reports as CSV:

| Endpoint                 | Data               |
| ------------------------ | ------------------ |
| `/api/export/sales`      | Sales transactions |
| `/api/export/inventory`  | Current inventory  |
| `/api/export/cogs`       | COGS entries       |
| `/api/export/audit-logs` | Audit history      |
| `/api/export/periods`    | Period summaries   |

1. Use browser to download from API endpoint
2. Or use Settings → Export to access UI

---

## Data Backup

### Automatic Backups

Configure in Settings → Backups:

- Enable/Disable auto backup
- Backup interval (minutes)
- Maximum backups to keep

### Manual Backup

1. Go to Settings
2. Tap **Backup Now**
3. Download the backup file

### Restoring from Backup

1. Go to Settings
2. Tap **Restore**
3. Upload backup file
4. Confirm restore

**Warning**: Restoring replaces all current data.

---

## System Maintenance

### Audit Logs

All admin actions are logged:

1. Go to Settings → Audit Logs
2. View:
   - Timestamp
   - User
   - Action
   - Entity type
   - Old/New values

### Clearing Data

**Warning**: These actions are irreversible.

To clear specific data types, contact developer or use database tools.

---

## Troubleshooting

### Can't Access Admin Features

- Verify you're logged in as admin
- Check your role in Settings → Staff

### Inventory Not Tracking Correctly

1. Verify tracking mode (Pool vs Collection)
2. Check container weights are set
3. Perform audit to reconcile

### Reports Show Wrong Data

- Verify period is properly closed
- Check date range filters
- Ensure all tabs are closed

### Backup Failed

- Check disk space
- Verify backup directory permissions
- Check SMTP settings if email backup enabled

---

## API Reference

### Key Admin Endpoints

| Endpoint                 | Method        | Description         |
| ------------------------ | ------------- | ------------------- |
| `/api/users`             | GET, POST     | List/Create users   |
| `/api/users/:id`         | PATCH, DELETE | Update/Delete user  |
| `/api/settings`          | GET, PATCH    | System settings     |
| `/api/settings/defaults` | GET, PATCH    | System defaults     |
| `/api/periods`           | GET, POST     | List/Create periods |
| `/api/periods/:id/close` | POST          | Close period        |
| `/api/export/sales`      | GET           | Export sales CSV    |
| `/api/inventory/items`   | GET, POST     | Inventory CRUD      |
| `/api/drinks`            | GET, POST     | Drinks CRUD         |

---

## Security Best Practices

1. **Strong Admin Password**: Use a complex password, change regularly
2. **PIN Security**: Staff should keep PINs confidential
3. **Role Separation**: Limit admin access to necessary personnel
4. **Audit Logs**: Review regularly for suspicious activity
5. **Backups**: Maintain regular backups, test restoration

---

## Related Documentation

### User & System Guides

- [README.md](README.md) - Project overview
- [USER_GUIDE.md](USER_GUIDE.md) - Staff user guide
- [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) - Deployment guide

### Technical Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [PACKAGING_GUIDE.md](PACKAGING_GUIDE.md) - Desktop app packaging
- [ISSUE_AUDIT_APRIL_13_2026.md](ISSUE_AUDIT_APRIL_13_2026.md) - Issue investigation & fixes

### Feature Documentation

- [docs/DISCOUNTS_IMPLEMENTATION_SUMMARY.md](docs/DISCOUNTS_IMPLEMENTATION_SUMMARY.md) - Discount system overview
- [docs/DISCOUNTS_QUICK_REFERENCE.md](docs/DISCOUNTS_QUICK_REFERENCE.md) - Quick reference guide

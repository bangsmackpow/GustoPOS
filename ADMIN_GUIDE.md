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

### Creating Promo Codes

1. Go to Settings → Promo Codes
2. Tap **+ Add Promo Code**
3. Configure:
   - Code (e.g., "WELCOME10")
   - Description
   - Discount Type: Percentage or Fixed
   - Discount Value (e.g., 10 for 10%)
   - Max Uses (optional)
   - Expiration Date (optional)
4. Tap **Save**

### Managing Specials

Create time-based specials:

1. Go to Settings → Specials
2. Tap **+ Add Special**
3. Configure:
   - Name
   - Drink (select from menu)
   - Discount Type & Value
   - Days of Week
   - Start/End Hours
   - Start/End Dates
4. Tap **Save**

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

- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [USER_GUIDE.md](USER_GUIDE.md) - Staff user guide
- [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) - Deployment guide

# GustoPOS Administrator Guide

Administrative tasks including system configuration, user management, inventory setup, and reporting.

---

## Admin Access

### Logging In

1. Go to login page
2. Tap **Admin Login**
3. Enter username and password
4. Receive admin privileges

### Default Credentials

- **Username**: GUSTO
- **Password**: Set via `ADMIN_PASSWORD` env variable

Change password after first login.

---

## Staff Management

### Creating a Staff Account

1. Go to Settings → Staff
2. Tap **+ Add Staff**
3. Fill in:
   - First Name, Last Name
   - Username (unique)
   - PIN (4 digits)
   - Role: Employee or Admin
   - Language preference
4. Tap **Save**

### Editing a Staff Account

1. Go to Settings → Staff
2. Tap the staff member
3. Modify fields
4. Tap **Save**

### Resetting a PIN

1. Go to Settings → Staff
2. Tap the staff member
3. Tap **Reset PIN**
4. Enter new 4-digit PIN

### Deactivating a Staff Account

1. Go to Settings → Staff
2. Tap the staff member
3. Toggle **Active** off
4. Staff can no longer log in

---

## Bar Settings

### Basic Information

1. Go to Settings
2. Edit **Bar Name** and **Bar Icon**
3. Changes apply immediately

### Currency Settings

- **Base Currency**: Default MXN
- **USD to MXN Rate**: For US dollar transactions
- **CAD to MXN Rate**: For Canadian dollar transactions

### Tax Configuration

1. Go to Settings → Tax Rates
2. Add tax rates with category, rate (%), description

Common categories:

- Standard (16% VAT in Mexico)
- Reduced
- Zero-rated

---

## System Defaults

Configure defaults for new inventory items:

| Setting          | Description                      | Default  |
| ---------------- | -------------------------------- | -------- |
| Alcohol Density  | Default density for spirits      | 0.94     |
| Serving Size     | Default pour size (ml/oz toggle) | 44.36 ml |
| Bottle Size      | Default bottle size (ml)         | 750 ml   |
| Units Per Case   | Default case count               | 1        |
| Tracking Mode    | Auto, Pool, or Collection        | Auto     |
| Audit Method     | Auto or Manual                   | Auto     |
| Variance Warning | Variance % to trigger alert      | 5%       |

---

## Inventory Management

### Adding Inventory Items

1. Go to Inventory → **+ Add Item**
2. Fill in:

**Basic Info:**

- Name, NameEs, Type (Spirit/Mixer/Beer/Wine/Merch/Misc)

**Measurement:**

- Container Size (ml or units)
- Tracking Mode: Auto/Pool/Collection

**Pricing:**

- Order Cost, Markup Factor

**Serving:**

- Serving Size, Sell Single Serving, Single Serving Price

**Weight (Pool):**

- Container Weight (g) - empty bottle
- Full Bottle Weight (g) - full bottle
- Density (g/ml) - typically 0.94

**Stock:**

- Current Bulk, Current Partial
- Low Stock Threshold

3. Tap **Save**

### Bulk Import

1. Go to Inventory → **Import CSV**
2. Upload CSV with columns:
   - Name, NameEs, Type, ContainerSize, OrderCost, MarkupFactor, CurrentBulk, TrackingMode

Invalid rows are skipped and reported.

### Editing Inventory Items

1. Go to Inventory
2. Tap an item row
3. Edit fields
4. Tap **Save**

### Deleting Inventory Items

1. Tap an item → **Delete**
2. Confirm

---

## Drinks Menu Management

### Adding a Drink

1. Go to Drinks → **+ Add Drink**
2. Fill in:
   - Name, NameEs, Description
   - Category
   - Base Price, Markup Factor
   - Tax Category
   - Is Available, Show On Menu
3. Tap **Save**

### Adding Recipe Ingredients

After creating a drink, add recipe:

1. Tap the drink → **Edit Recipe**
2. Add Ingredient → Select inventory item → Enter amount in ml
3. Tap **Save Recipe**

System calculates:

- Cost per serving (sum of ingredient costs)
- Selling price (cost × markup)
- Stock availability

### Editing/Deleting Drinks

1. Go to Drinks → Tap drink → Edit or Delete

---

## Promotions & Discounts

Three-level discount system:

1. **Promo Codes** - Global codes (tab-level)
2. **Specials** - Automatic discounts based on schedule
3. **Manual Discounts** - Per-order discounts by staff

### Creating Promo Codes

1. Go to Settings → **Promo Codes**
2. Tap **+ Add Promo Code**
3. Configure:
   - **Code**: Unique code (e.g., "WELCOME10")
   - **Description**: Internal notes
   - **Discount Type**: Percentage or Fixed Amount
   - **Discount Value**: Amount (10 for %, or 50 for MXN)
   - **Max Uses** (optional): Leave blank for unlimited
   - **Expiration Date** (optional)
4. Toggle **Active** on
5. Tap **Save**

### Managing Specials

Specials are automatic drink/category discounts based on schedule.

1. Go to Settings → **Specials**
2. Tap **+ Add Special**
3. Configure:
   - **Name**: Description (e.g., "Happy Hour")
   - **Type**: manual, happy_hour, promotional, bundle
   - **Apply To**: Drink, Category, or All
   - **Discount Type/Value**: Percentage or MXN
   - **Days of Week**: Select days
   - **Start/End Hour**: Time range (0-23)
   - **Start/End Date**: Optional calendar range
4. Toggle **Active** on
5. Tap **Save**

**Example - Happy Hour:**

- Apply To: Category → Spirits
- Type: happy_hour
- Discount: 30% off
- Days: Mon-Fri
- Hours: 17:00-19:00

**Example - Daily Promotion:**

- Apply To: Drink → Margarita
- Type: promotional
- Discount: 50 MXN off
- Days: Monday
- Hours: All day

### Manual Order Discounts

Staff can apply discounts during service:

1. Tap discount icon on order
2. Choose preset ($2, $5, $10, 10%, 15%, 20%) or custom
3. Applies immediately

**Note:** If special already applied, system keeps greater discount.

### Discount Priority

1. Order-level discounts applied first
2. Tab-level (promo codes) to final total
3. Tax on discounted amount
4. Tip added last

---

## Periods & Accounting

### Creating Periods

1. Go to Settings → Periods → **+ New Period**
2. Configure:
   - Name, Type (Daily/Weekly/Monthly)
   - Start/End Date

### Closing a Period

1. Go to Settings → Periods
2. Tap period → **Close Period**
3. Review summary:
   - Total Sales, COGS, Tips, Discounts, Voids, Comps
   - Inventory Start/End Value, Gross Profit
4. Confirm

Once closed, cannot be modified.

### COGS Reports

1. Go to Settings → Periods
2. Tap closed period → **View COGS**
3. Per-item breakdown

---

## Reports & Analytics

### Sales Reports

- **Analytics Tab**: Charts and graphs
- **Stats Tab**: Business metrics

### Void Analytics

Go to Reports → Stats → Void Analysis:

- Total voids, Value, Rate
- By reason, Top voided drinks, Staff stats

### Staff Performance

Go to Reports → Stats:

- Sales, Tabs, Avg Ticket, Tips per employee

### Exporting Data

| Endpoint                 | Data               |
| ------------------------ | ------------------ |
| `/api/export/sales`      | Sales transactions |
| `/api/export/inventory`  | Current inventory  |
| `/api/export/cogs`       | COGS entries       |
| `/api/export/audit-logs` | Audit history      |
| `/api/export/periods`    | Period summaries   |

Access via Settings → Export UI or direct API.

---

## Data Backup

### Automatic Backups

Settings → Backups:

- Enable/Disable
- Interval, Max backups

### Manual Backup

1. Go to Settings → **Backup Now**
2. Download backup file

### Restoring

1. Settings → **Restore**
2. Upload backup file
3. Confirm

**Warning:** Restoring replaces all current data.

---

## System Maintenance

### Audit Logs

All admin actions logged:

- Settings → Audit Logs

### Clearing Data

Irreversible. Contact developer or use database tools.

---

## Troubleshooting

### Can't Access Admin Features

- Verify logged in as admin
- Check role in Settings → Staff

### Inventory Not Tracking Correctly

- Verify tracking mode
- Check container weights
- Perform audit

### Reports Show Wrong Data

- Verify period closed
- Check date filters
- Ensure tabs closed

### Backup Failed

- Check disk space
- Verify directory permissions

---

## API Reference

### Key Admin Endpoints

| Endpoint                 | Method           | Description         |
| ------------------------ | ---------------- | ------------------- |
| `/api/users`             | GET, POST        | List/Create users   |
| `/api/users/:id`         | PATCH, DELETE    | Update/Delete user  |
| `/api/settings`          | GET, PATCH       | System settings     |
| `/api/settings/defaults` | GET, PATCH       | System defaults     |
| `/api/periods`           | GET, POST        | List/Create periods |
| `/api/periods/:id/close` | POST             | Close period        |
| `/api/inventory/items`   | GET, POST        | Inventory CRUD      |
| `/api/drinks`            | GET, POST        | Drinks CRUD         |
| `/api/promo-codes`       | GET, POST, PATCH | Promo codes         |
| `/api/specials`          | GET, POST, PATCH | Specials CRUD       |

---

## Security Best Practices

1. **Strong Admin Password**: Complex, change regularly
2. **PIN Security**: Keep PINs confidential
3. **Role Separation**: Limit admin access
4. **Audit Logs**: Review regularly
5. **Backups**: Maintain and test restoration

---

## Related Documentation

- [README.md](README.md) - Project overview
- [USER_GUIDE.md](USER_GUIDE.md) - Staff guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [OPERATIONS_GUIDE.md](OPERATIONS_GUIDE.md) - Deployment

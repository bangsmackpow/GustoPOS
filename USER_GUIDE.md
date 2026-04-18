# GustoPOS User Guide

Day-to-day operations for bartenders and staff.

---

## Logging In

1. Enter your 4-digit PIN
2. Press the green checkmark
3. If PIN fails repeatedly, tap "Use Password Login" to use admin credentials

### Language Selection

Tap the globe icon on the login screen to switch between English and Spanish. Your preference is saved.

---

## Dashboard

Shows:

- Open Tabs count
- Today's Sales
- Active Shift status
- Low Stock Alerts

Quick actions:

- **+ New Tab** opens a new customer tab
- Tap any widget to navigate to that section

---

## Tabs (Customer Checks)

### Opening a New Tab

1. From Dashboard or Tabs, tap **+ New Tab**
2. Enter nickname (e.g., "Table 5", "Mike")
3. Tap **Open Tab**

### Adding Orders

1. From an open tab, tap **Add Drinks**
2. Browse or search for drinks
3. Tap a drink to add it
4. Use **+** and **-** to change quantity
5. Tap **Add to Tab**

### Stock Status Indicators

| Indicator       | Meaning                   |
| --------------- | ------------------------- |
| Green dot       | Good stock (15+ servings) |
| Yellow dot      | Medium stock (5-14)       |
| Red pulsing dot | Low stock (<5)            |
| Gray + "OUT"    | Out of stock              |

### Order Quantity

Tap **-** or **+** on drink cards to select quantity (1-20). Selected quantity persists for that drink.

### Voiding Orders

1. Tap the order in the tab
2. Tap **Void**
3. Select reason:
   - Customer Changed Mind
   - Wrong Order
   - Spilled
   - Complementary
   - Other
4. Confirm void

Voided orders appear crossed out and are tracked.

### Closing a Tab

1. Tap **Close Tab**
2. Review total
3. Add tip (optional)
4. Select payment method:
   - **Cash** or **Card** (select one, shows highlighted)
5. Tap **Confirm Payment**
6. Review confirmation dialog
7. Tap **Complete Sale**

### Split Bill

1. Tap **Close Tab**
2. Tap **Split Bill**
3. Select number of people (2-10)
4. See per-person amount in real-time
5. Process each payment separately

---

## Discounts

### Automatic Discounts (Specials)

The system automatically applies active specials when adding orders:

- Happy Hour: Spirits during 5-7pm get discount
- Daily Promotions: e.g., "Margarita Monday"
- Category Specials: e.g., "Beer Special"

**Nothing to do** - system checks time and order automatically.

### Manual Order Discounts

To discount a single order:

1. In Tab Detail, tap the **discount icon** on the order
2. Choose preset: $2, $5, $10, 10%, 15%, 20%
3. Or enter custom amount/percentage
4. Discount applies immediately
5. Tap elsewhere to close

**Note:** If special already applied, system keeps greater discount.

### Promo Codes

If customer has a promo code:

1. When closing tab, find **Promo Code** field
2. Enter code (e.g., "SAVE15")
3. If valid, discount applies to tab subtotal
4. Confirm before charging

Ask manager for current codes.

---

## Drinks Menu

Browse by category or search. Toggle "Show Available Only" to hide out-of-stock items.

Tap a drink to see description, price, recipe, and stock.

---

## Inventory

### Viewing Stock

The Inventory page shows:

| Column | Description         |
| ------ | ------------------- |
| Menu   | Checkbox if on menu |
| Name   | Item name           |
| Stock  | Current level       |
| Cost   | Cost per serving    |
| Type   | Item type           |

### Stock Display

- **Pool** (spirits, mixers): Shows ml (e.g., "3 full + 375ml")
- **Collection** (beer, merch): Shows units

"~375ml" indicates estimated (no weight data).

### Stock Status Colors

| Color  | Meaning                   |
| ------ | ------------------------- |
| Green  | Stock OK                  |
| Yellow | Approaching low threshold |
| Red    | Below low threshold       |

### Quick Filters

Left sidebar shows: All Items, Low Stock, Out of Stock, Never Audited

### Auditing Inventory

1. Navigate to Inventory
2. Tap an item row
3. Tap **Audit**
4. Enter:
   - Full bottles count
   - Partial bottle weight (grams)
5. Tap **Save Audit**

System calculates variance.

### Variance Analysis

1. From Inventory, tap **Variance Analysis** in sidebar
2. View:
   - Total audits
   - Items with variance
   - Recommendations by severity
3. Filter by time period (7, 30, 90 days)
4. View per-item variance history

---

## Reports

### Analytics Tab

**Quick Date Filters:**

- Today, Yesterday
- This Week, Last Week
- This Month, Last Month
- Last 7 Days, Last 30 Days, Last 90 Days
- Year to Date

**Charts:**

- Sales over time
- Top selling drinks
- Peak hours

### Stats Tab

**Business Summary:**

- Total Sales, Tabs Closed, Average Ticket, Total Tips

**Staff Performance Table:**

- Staff name, Sales, Tabs, Avg Ticket, Tips

**Void Analysis:**

- Total voids, Void value, Void rate
- Voids by reason

**Top Sellers:**

- Ranked by revenue with units sold

---

## Settings (Staff)

### Changing Your PIN

1. Go to Settings
2. Tap your name
3. Tap **Change PIN**
4. Enter new 4-digit PIN

### Language Preference

1. Go to Settings
2. Tap your name
3. Select Language: English or Spanish

---

## Shift Management

### Starting a Shift

1. Log in with PIN
2. If no active shift, prompted to start one
3. Confirm or enter cash in drawer

### Ending a Shift

1. Ensure all tabs closed
2. Go to Dashboard or Tabs
3. Tap **End Shift**
4. Count actual cash in drawer
5. Enter actual amount
6. System shows variance
7. Confirm to close

### Shift Report

After closing, report shows:

- Total sales, tabs, tips, voids
- Cash variance

---

## Troubleshooting

### App is Slow

- Check internet connection
- Refresh the page (Ctrl+R / Cmd+R)

### Can't Find a Drink

- Check availability
- Check inventory stock
- Search by name

### Stock Shows Incorrectly

- Perform audit to reconcile
- Contact manager

### PIN Not Working

- Verify correct PIN
- Contact manager to reset

### Payment Failed

- Check card reader
- Try alternative method
- Contact manager

---

## Keyboard Shortcuts

| Shortcut | Action       |
| -------- | ------------ |
| Ctrl+K   | Focus search |
| Ctrl+N   | New tab      |
| Escape   | Close modal  |

---

## Need Help?

Contact manager for:

- PIN resets
- System configuration
- Adding drinks or inventory
- Troubleshooting

---

## Related Documentation

- [README.md](README.md) - Project overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technical details
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Administrator guide

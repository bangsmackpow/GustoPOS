# Bulk Import Templates

This directory contains CSV templates for bulk importing inventory ingredients and drinks into GustoPOS.

## Files

| File                                   | Description                                |
| -------------------------------------- | ------------------------------------------ |
| `BULK_IMPORT_INGREDIENTS_TEMPLATE.csv` | Template for importing inventory items     |
| `BULK_IMPORT_DRINKS_TEMPLATE.csv`      | Template for importing drinks with recipes |

---

## Ingredients Import Template

### Endpoint

`POST /api/bulk-ingredients`

### Fields

| Column              | Required | Description                           | Example                |
| ------------------- | -------- | ------------------------------------- | ---------------------- |
| `name`              | Yes      | Item name                             | "Casa Tequila"         |
| `type`              | No       | Item type (spirit, mixer, beer, etc.) | "spirit"               |
| `subtype`           | No       | Sub-type for filtering                | "Tequila", "Vodka"     |
| `baseUnit`          | No       | Unit of measurement                   | "ml", "case", "bottle" |
| `baseUnitAmount`    | No       | Size of container                     | 750, 1000, 24          |
| `servingSize`       | No       | Standard serving size                 | 44.36 (ml), 1 (units)  |
| `servingUnit`       | No       | Serving unit                          | "ml", "oz", "unit"     |
| `orderCost`         | Yes      | Cost to purchase item                 | 14.00                  |
| `productPrice`      | No       | Retail price for single serving       | 60.00                  |
| `isOnMenu`          | No       | Show on drinks menu                   | TRUE, FALSE            |
| `trackingMode`      | No       | auto, pool, or collection             | "auto"                 |
| `alcoholDensity`    | No       | Density for weight calculations       | 0.94                   |
| `lowStockThreshold` | No       | Alert when stock falls below          | 2                      |
| `unitsPerCase`      | No       | Units per case (for beer)             | 24                     |
| `bottleSizeMl`      | No       | Bottle size in ml                     | 750                    |
| `fullBottleWeightG` | No       | Weight in grams                       | 650                    |

### Import Strategy

The API supports different import strategies (passed in request body):

- `update` - Update existing, create new (default)
- `merge` - Keep existing values, add new ones
- `skip` - Only create new, skip existing
- `replace` - Delete all, re-import

---

## Drinks Import Template

### Endpoint

`POST /api/bulk-drinks`

### Fields

| Column               | Required | Description                | Example                    |
| -------------------- | -------- | -------------------------- | -------------------------- |
| `name`               | Yes      | Drink name                 | "Margarita"                |
| `category`           | No       | Menu category              | "cocktail", "shot", "beer" |
| `actualPrice`        | No       | Manual price override      | 80                         |
| `sourceType`         | No       | standard, inventory_single | "standard"                 |
| `ingredient1_name`   | No       | First ingredient name      | "Tequila"                  |
| `ingredient1_amount` | No       | Amount in oz/units         | 2                          |
| `ingredient2_name`   | No       | Second ingredient name     | "Triple Sec"               |
| `ingredient2_amount` | No       | Amount in oz/units         | 1                          |
| `ingredient3_name`   | No       | Third ingredient name      | "Lime Juice"               |
| `ingredient3_amount` | No       | Amount in oz/units         | 1                          |

**Note:** Up to 10 ingredient columns supported (ingredient1 through ingredient10)

### Price Calculation

- **Single ingredient drinks**: `actualPrice` = ingredient's `productPrice` (auto-calculated)
- **Multi-ingredient drinks**: `menuPrice` = sum of all ingredient `productPrice`s
- **Manual override**: If `actualPrice` provided, uses that value instead

---

## Usage Example

### Import Ingredients

```bash
curl -X POST http://localhost:3000/api/bulk-ingredients \
  -H "Content-Type: application/json" \
  -d '{
    "ingredients": [
      {"name": "Casa Tequila", "type": "spirit", "subtype": "Tequila", "orderCost": 14.00, "productPrice": 60, "isOnMenu": true}
    ],
    "strategy": "update"
  }'
```

### Import Drinks

```bash
curl -X POST http://localhost:3000/api/bulk-drinks \
  -H "Content-Type: application/json" \
  -d '{
    "drinks": [
      {"name": "Margarita", "category": "cocktail", "ingredient1_name": "Casa Tequila", "ingredient1_amount": 2}
    ]
  }'
```

---

## Notes

- The import handles duplicate names intelligently based on the chosen strategy
- Ingredients must exist in the inventory before drinks can reference them by name
- Prices are automatically calculated from ingredient costs if not manually specified
- All numeric fields accept both integers and decimals
- Boolean fields accept TRUE/FALSE or 1/0

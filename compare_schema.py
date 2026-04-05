#!/usr/bin/env python3
"""
Schema comparison tool - extracts friend's database schema and compares to current.
This script uses SQLite directly without relying on external modules.
"""

import sqlite3
import os
import sys

# Database path
db_path = r'c:\users\curtis\downloads\gusto.db.backup'

# Define current schema from Drizzle ORM definitions
# Note: Using Drizzle column names (snake_case) as they appear in SQLite
current_schema = {
    'users': {
        'id': 'text',
        'email': 'text',
        'password': 'text',
        'first_name': 'text',  # Drizzle: firstName -> first_name
        'last_name': 'text',   # Drizzle: lastName -> last_name
        'profile_image_url': 'text',  # Drizzle: profileImageUrl -> profile_image_url
        'role': 'text',
        'language': 'text',
        'pin': 'text',
        'is_active': 'integer',  # Drizzle: isActive -> is_active (boolean mode)
        'created_at': 'integer',  # Drizzle: createdAt -> created_at (timestamp mode)
        'updated_at': 'integer',  # Drizzle: updatedAt -> updated_at (timestamp mode)
    },
    'ingredients': {
        'id': 'text',
        'name': 'text',
        'name_es': 'text',  # Drizzle: nameEs -> name_es
        'unit': 'text',
        'unit_size': 'real',  # Drizzle: unitSize -> unit_size
        'cost_per_unit': 'real',  # Drizzle: costPerUnit -> cost_per_unit
        'current_stock': 'real',  # Drizzle: currentStock -> current_stock
        'minimum_stock': 'real',  # Drizzle: minimumStock -> minimum_stock
        'category': 'text',
        'created_at': 'integer',  # Drizzle: createdAt -> created_at
        'updated_at': 'integer',  # Drizzle: updatedAt -> updated_at
    },
    'drinks': {
        'id': 'text',
        'name': 'text',
        'name_es': 'text',  # Drizzle: nameEs -> name_es
        'description': 'text',
        'description_es': 'text',  # Drizzle: descriptionEs -> description_es
        'category': 'text',
        'markup_factor': 'real',  # Drizzle: markupFactor -> markup_factor
        'upcharge': 'real',
        'actual_price': 'real',  # Drizzle: actualPrice -> actual_price
        'is_available': 'integer',  # Drizzle: isAvailable -> is_available
        'created_at': 'integer',  # Drizzle: createdAt -> created_at
        'updated_at': 'integer',  # Drizzle: updatedAt -> updated_at
    },
    'recipe_ingredients': {
        'id': 'text',
        'drink_id': 'text',  # Drizzle: drinkId -> drink_id
        'ingredient_id': 'text',  # Drizzle: ingredientId -> ingredient_id
        'amount_in_ml': 'real',  # Drizzle: amountInMl -> amount_in_ml
    },
    'shifts': {
        'id': 'text',
        'name': 'text',
        'status': 'text',
        'opened_by_user_id': 'text',  # Drizzle: openedByUserId -> opened_by_user_id
        'started_at': 'integer',  # Drizzle: startedAt -> started_at
        'closed_at': 'integer',  # Drizzle: closedAt -> closed_at
    },
    'tabs': {
        'id': 'text',
        'nickname': 'text',
        'status': 'text',
        'staff_user_id': 'text',  # Drizzle: staffUserId -> staff_user_id
        'shift_id': 'text',  # Drizzle: shiftId -> shift_id
        'total_mxn': 'real',  # Drizzle: totalMxn -> total_mxn
        'payment_method': 'text',  # Drizzle: paymentMethod -> payment_method
        'currency': 'text',
        'notes': 'text',
        'opened_at': 'integer',  # Drizzle: openedAt -> opened_at
        'closed_at': 'integer',  # Drizzle: closedAt -> closed_at
    },
    'orders': {
        'id': 'text',
        'tab_id': 'text',  # Drizzle: tabId -> tab_id
        'drink_id': 'text',  # Drizzle: drinkId -> drink_id
        'drink_name': 'text',  # Drizzle: drinkName -> drink_name
        'drink_name_es': 'text',  # Drizzle: drinkNameEs -> drink_name_es
        'quantity': 'integer',
        'unit_price_mxn': 'real',  # Drizzle: unitPriceMxn -> unit_price_mxn
        'notes': 'text',
        'created_at': 'integer',  # Drizzle: createdAt -> created_at
    },
    'settings': {
        'id': 'text',
        'bar_name': 'text',  # Drizzle: barName -> bar_name
        'bar_icon': 'text',  # Drizzle: barIcon -> bar_icon
        'usd_to_mxn_rate': 'real',  # Drizzle: usdToMxnRate -> usd_to_mxn_rate
        'cad_to_mxn_rate': 'real',  # Drizzle: cadToMxnRate -> cad_to_mxn_rate
        'default_markup_factor': 'real',  # Drizzle: defaultMarkupFactor -> default_markup_factor
        'smtp_host': 'text',  # Drizzle: smtpHost -> smtp_host
        'smtp_port': 'integer',  # Drizzle: smtpPort -> smtp_port
        'smtp_user': 'text',  # Drizzle: smtpUser -> smtp_user
        'smtp_password': 'text',  # Drizzle: smtpPassword -> smtp_password
        'smtp_from_email': 'text',  # Drizzle: smtpFromEmail -> smtp_from_email
        'inventory_alert_email': 'text',  # Drizzle: inventoryAlertEmail -> inventory_alert_email
        'enable_litestream': 'integer',  # Drizzle: enableLitestream -> enable_litestream
        'enable_usb_backup': 'integer',  # Drizzle: enableUsbBackup -> enable_usb_backup
        'updated_at': 'integer',  # Drizzle: updatedAt -> updated_at
    },
    'rushes': {
        'id': 'text',
        'title': 'text',
        'description': 'text',
        'start_time': 'integer',  # Drizzle: startTime -> start_time
        'end_time': 'integer',  # Drizzle: endTime -> end_time
        'impact': 'text',
        'type': 'text',
        'created_at': 'integer',  # Drizzle: createdAt -> created_at
    },
}


def check_file_exists():
    """Check if the backup database file exists."""
    if not os.path.exists(db_path):
        print(f"❌ ERROR: Database file not found: {db_path}")
        print(f"\nPlease ensure the backup file exists at: {db_path}")
        return False
    return True


def extract_schema():
    """Extract schema from the friend's database."""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cursor.fetchall()]
        
        print("=" * 120)
        print("FRIEND'S DATABASE SCHEMA EXTRACTION")
        print("=" * 120)
        print(f"\nDatabase: {db_path}")
        print(f"Total Tables: {len(tables)}")
        print(f"Tables: {', '.join(tables)}\n")
        
        # Extract schema for each table
        backup_schema = {}
        
        for table in tables:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = cursor.fetchall()
            
            print(f"\n{'='*120}")
            print(f"TABLE: {table}")
            print(f"{'='*120}")
            print(
                f"{'Column Name':<30} | {'Type':<15} | {'Not Null':<10} | {'Default':<20} | {'Primary Key':<10}"
            )
            print(f"{'-'*120}")
            
            backup_schema[table] = {}
            for col_id, col_name, col_type, not_null, default_val, pk in columns:
                backup_schema[table][col_name] = {
                    'type': col_type,
                    'not_null': not_null,
                    'default': default_val,
                    'pk': pk,
                }
                not_null_str = "YES" if not_null else "NO"
                default_str = str(default_val) if default_val else "NULL"
                pk_str = "YES" if pk else "NO"
                print(
                    f"{col_name:<30} | {col_type:<15} | {not_null_str:<10} | {default_str:<20} | {pk_str:<10}"
                )
        
        conn.close()
        return backup_schema
    except Exception as e:
        print(f"❌ ERROR: Failed to read database: {e}")
        return None


def compare_schemas(backup_schema):
    """Compare backup schema with current schema."""
    print(f"\n\n{'='*120}")
    print("SCHEMA COMPARISON ANALYSIS")
    print(f"{'='*120}")
    
    backup_tables = set(backup_schema.keys())
    current_tables = set(current_schema.keys())
    
    # Extra tables in friend's DB
    friend_only_tables = sorted(backup_tables - current_tables)
    if friend_only_tables:
        print(f"\n❌ TABLES IN FRIEND'S DB BUT NOT IN CURRENT SCHEMA:")
        for table in friend_only_tables:
            print(f"   • {table}")
            for col in sorted(backup_schema[table].keys()):
                col_info = backup_schema[table][col]
                print(f"       - {col}: {col_info['type']}")
    else:
        print(f"\n✓ No extra tables in friend's DB")
    
    # Missing tables in friend's DB
    current_only_tables = sorted(current_tables - backup_tables)
    if current_only_tables:
        print(f"\n⚠️  TABLES IN CURRENT SCHEMA BUT NOT IN FRIEND'S DB:")
        for table in current_only_tables:
            print(f"   • {table}")
    else:
        print(f"\n✓ All current tables exist in friend's DB")
    
    # Column comparison for shared tables
    print(f"\n{'='*120}")
    print("COLUMN COMPARISON FOR SHARED TABLES")
    print(f"{'='*120}")
    
    shared_tables = sorted(backup_tables & current_tables)
    
    total_extra_cols = 0
    total_missing_cols = 0
    
    for table in shared_tables:
        backup_cols = set(backup_schema[table].keys())
        current_cols = set(current_schema[table].keys())
        
        extra_cols = sorted(backup_cols - current_cols)
        missing_cols = sorted(current_cols - backup_cols)
        
        total_extra_cols += len(extra_cols)
        total_missing_cols += len(missing_cols)
        
        if extra_cols or missing_cols:
            print(f"\n📋 TABLE: {table}")
            
            if extra_cols:
                print(f"   ✨ EXTRA COLUMNS IN FRIEND'S DB (not in current):")
                for col in extra_cols:
                    col_info = backup_schema[table][col]
                    print(f"      • {col}: {col_info['type']}")
            
            if missing_cols:
                print(f"   ❌ MISSING COLUMNS IN FRIEND'S DB (exist in current):")
                for col in missing_cols:
                    print(f"      • {col}")
        else:
            print(f"\n✓ {table}: All columns match")
    
    # Summary
    print(f"\n\n{'='*120}")
    print("SUMMARY")
    print(f"{'='*120}")
    print(f"\nBackup Database Tables: {len(backup_schema)}")
    print(f"Current Schema Tables: {len(current_schema)}")
    print(f"\nExtra tables in friend's DB: {len(friend_only_tables)}")
    print(f"Missing tables in friend's DB: {len(current_only_tables)}")
    print(f"Extra columns across all shared tables: {total_extra_cols}")
    print(f"Missing columns across all shared tables: {total_missing_cols}")
    
    if total_extra_cols == 0 and total_missing_cols == 0 and len(friend_only_tables) == 0 and len(current_only_tables) == 0:
        print(f"\n✅ SCHEMAS ARE IDENTICAL!")
    else:
        print(f"\n⚠️  SCHEMAS HAVE DIFFERENCES")


def main():
    """Main entry point."""
    if not check_file_exists():
        sys.exit(1)
    
    backup_schema = extract_schema()
    if backup_schema is None:
        sys.exit(1)
    
    compare_schemas(backup_schema)


if __name__ == '__main__':
    main()

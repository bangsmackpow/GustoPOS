#!/usr/bin/env python3
import sqlite3
from collections import defaultdict

# Connect to backup database
backup_db = r'c:\users\curtis\downloads\gusto.db.backup'
conn = sqlite3.connect(backup_db)
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [row[0] for row in cursor.fetchall()]

print("=" * 100)
print("FRIEND'S DATABASE SCHEMA EXTRACTION")
print("=" * 100)
print(f"\nDatabase: {backup_db}")
print(f"\nTotal Tables: {len(tables)}")
print(f"\nTables: {', '.join(tables)}\n")

# Extract schema for each table
backup_schema = {}

for table in tables:
    cursor.execute(f"PRAGMA table_info({table})")
    columns = cursor.fetchall()
    
    print(f"\n{'='*100}")
    print(f"TABLE: {table}")
    print(f"{'='*100}")
    print(f"{'Column Name':<30} | {'Type':<15} | {'Not Null':<10} | {'Default':<20} | {'Primary Key':<10}")
    print(f"{'-'*100}")
    
    backup_schema[table] = {}
    for col_id, col_name, col_type, not_null, default_val, pk in columns:
        backup_schema[table][col_name] = {
            'type': col_type,
            'not_null': not_null,
            'default': default_val,
            'pk': pk
        }
        not_null_str = "YES" if not_null else "NO"
        default_str = str(default_val) if default_val else "NULL"
        pk_str = "YES" if pk else "NO"
        print(f"{col_name:<30} | {col_type:<15} | {not_null_str:<10} | {default_str:<20} | {pk_str:<10}")

conn.close()

# Current schema as provided
current_schema = {
    'users': {
        'id': {'type': 'unknown'},
        'email': {'type': 'unknown'},
        'password': {'type': 'unknown'},
        'firstName': {'type': 'unknown'},
        'lastName': {'type': 'unknown'},
        'profileImageUrl': {'type': 'unknown'},
        'role': {'type': 'unknown'},
        'language': {'type': 'unknown'},
        'pin': {'type': 'unknown'},
        'isActive': {'type': 'unknown'},
        'createdAt': {'type': 'unknown'},
        'updatedAt': {'type': 'unknown'},
    },
    'ingredients': {
        'id': {'type': 'unknown'},
        'name': {'type': 'unknown'},
        'nameEs': {'type': 'unknown'},
        'unit': {'type': 'unknown'},
        'unitSize': {'type': 'unknown'},
        'costPerUnit': {'type': 'unknown'},
        'currentStock': {'type': 'unknown'},
        'minimumStock': {'type': 'unknown'},
        'category': {'type': 'unknown'},
        'createdAt': {'type': 'unknown'},
        'updatedAt': {'type': 'unknown'},
    },
    'drinks': {
        'id': {'type': 'unknown'},
        'name': {'type': 'unknown'},
        'nameEs': {'type': 'unknown'},
        'description': {'type': 'unknown'},
        'descriptionEs': {'type': 'unknown'},
        'category': {'type': 'unknown'},
        'markupFactor': {'type': 'unknown'},
        'upcharge': {'type': 'unknown'},
        'actualPrice': {'type': 'unknown'},
        'isAvailable': {'type': 'unknown'},
        'createdAt': {'type': 'unknown'},
        'updatedAt': {'type': 'unknown'},
    },
    'recipe_ingredients': {
        'id': {'type': 'unknown'},
        'drinkId': {'type': 'unknown'},
        'ingredientId': {'type': 'unknown'},
        'amountInMl': {'type': 'unknown'},
    },
    'shifts': {
        'id': {'type': 'unknown'},
        'name': {'type': 'unknown'},
        'status': {'type': 'unknown'},
        'openedByUserId': {'type': 'unknown'},
        'startedAt': {'type': 'unknown'},
        'closedAt': {'type': 'unknown'},
    },
    'tabs': {
        'id': {'type': 'unknown'},
        'nickname': {'type': 'unknown'},
        'status': {'type': 'unknown'},
        'staffUserId': {'type': 'unknown'},
        'shiftId': {'type': 'unknown'},
        'totalMxn': {'type': 'unknown'},
        'paymentMethod': {'type': 'unknown'},
        'currency': {'type': 'unknown'},
        'notes': {'type': 'unknown'},
        'openedAt': {'type': 'unknown'},
        'closedAt': {'type': 'unknown'},
    },
    'orders': {
        'id': {'type': 'unknown'},
        'tabId': {'type': 'unknown'},
        'drinkId': {'type': 'unknown'},
        'drinkName': {'type': 'unknown'},
        'drinkNameEs': {'type': 'unknown'},
        'quantity': {'type': 'unknown'},
        'unitPriceMxn': {'type': 'unknown'},
        'notes': {'type': 'unknown'},
        'createdAt': {'type': 'unknown'},
    },
    'settings': {
        'id': {'type': 'unknown'},
        'barName': {'type': 'unknown'},
        'barIcon': {'type': 'unknown'},
        'usdToMxnRate': {'type': 'unknown'},
        'cadToMxnRate': {'type': 'unknown'},
        'defaultMarkupFactor': {'type': 'unknown'},
        'smtpHost': {'type': 'unknown'},
        'smtpPort': {'type': 'unknown'},
        'smtpUser': {'type': 'unknown'},
        'smtpPassword': {'type': 'unknown'},
        'smtpFromEmail': {'type': 'unknown'},
        'inventoryAlertEmail': {'type': 'unknown'},
        'enableLitestream': {'type': 'unknown'},
        'enableUsbBackup': {'type': 'unknown'},
        'updatedAt': {'type': 'unknown'},
    },
    'rushes': {
        'id': {'type': 'unknown'},
        'title': {'type': 'unknown'},
        'description': {'type': 'unknown'},
        'startTime': {'type': 'unknown'},
        'endTime': {'type': 'unknown'},
        'impact': {'type': 'unknown'},
        'type': {'type': 'unknown'},
        'createdAt': {'type': 'unknown'},
    },
}

# Comparison analysis
print("\n\n" + "=" * 100)
print("SCHEMA COMPARISON ANALYSIS")
print("=" * 100)

# Tables in friend's DB but not in current
friend_only_tables = set(backup_schema.keys()) - set(current_schema.keys())
if friend_only_tables:
    print(f"\n❌ TABLES IN FRIEND'S DB BUT NOT IN CURRENT SCHEMA:")
    for table in sorted(friend_only_tables):
        print(f"   • {table}")
        for col in sorted(backup_schema[table].keys()):
            col_info = backup_schema[table][col]
            print(f"       - {col}: {col_info['type']}")
else:
    print(f"\n✓ No extra tables in friend's DB")

# Tables in current but not in friend's DB
current_only_tables = set(current_schema.keys()) - set(backup_schema.keys())
if current_only_tables:
    print(f"\n⚠️  TABLES IN CURRENT SCHEMA BUT NOT IN FRIEND'S DB:")
    for table in sorted(current_only_tables):
        print(f"   • {table}")
else:
    print(f"\n✓ All current tables exist in friend's DB")

# For tables in both, check columns
print(f"\n{'='*100}")
print("COLUMN COMPARISON FOR SHARED TABLES")
print(f"{'='*100}")

shared_tables = set(backup_schema.keys()) & set(current_schema.keys())

for table in sorted(shared_tables):
    backup_cols = set(backup_schema[table].keys())
    current_cols = set(current_schema[table].keys())
    
    extra_cols = backup_cols - current_cols
    missing_cols = current_cols - backup_cols
    
    if extra_cols or missing_cols:
        print(f"\n📋 TABLE: {table}")
        
        if extra_cols:
            print(f"   ✨ EXTRA COLUMNS IN FRIEND'S DB (not in current):")
            for col in sorted(extra_cols):
                col_info = backup_schema[table][col]
                print(f"      • {col}: {col_info['type']}")
        
        if missing_cols:
            print(f"   ❌ MISSING COLUMNS IN FRIEND'S DB (exist in current):")
            for col in sorted(missing_cols):
                print(f"      • {col}")
    else:
        print(f"\n✓ {table}: All columns match")

# Summary
print(f"\n\n{'='*100}")
print("SUMMARY")
print(f"{'='*100}")
print(f"\nBackup Database Tables: {len(backup_schema)}")
print(f"Current Schema Tables: {len(current_schema)}")
print(f"\nExtra tables in friend's DB: {len(friend_only_tables)}")
print(f"Missing tables in friend's DB: {len(current_only_tables)}")

total_extra_cols = 0
total_missing_cols = 0
for table in shared_tables:
    backup_cols = set(backup_schema[table].keys())
    current_cols = set(current_schema[table].keys())
    total_extra_cols += len(backup_cols - current_cols)
    total_missing_cols += len(current_cols - backup_cols)

print(f"Extra columns across all shared tables: {total_extra_cols}")
print(f"Missing columns across all shared tables: {total_missing_cols}")

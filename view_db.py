import sqlite3
import os

def view_db():
    db_path = 'crm_inventory.db'
    if not os.path.exists(db_path):
        print(f"Database file '{db_path}' not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    tables = ['suppliers', 'products', 'stock', 'sales']

    for table in tables:
        print(f"\n--- TABLE: {table.upper()} ---")
        try:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            
            # Get column names
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [col[1] for col in cursor.fetchall()]
            
            if not rows:
                print("No data found.")
                continue

            # Print header
            header = " | ".join(columns)
            print(header)
            print("-" * len(header))

            # Print rows
            for row in rows:
                print(" | ".join(map(str, row)))
        except sqlite3.OperationalError as e:
            print(f"Error reading table {table}: {e}")

    conn.close()

if __name__ == "__main__":
    view_db()

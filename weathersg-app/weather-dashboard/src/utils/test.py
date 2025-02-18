import sqlite3

# Connect to your database
db_conn = sqlite3.connect("weather_2021.db")  # Change to the relevant database file

cursor = db_conn.cursor()

# Fetch all table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

# Print schema for each table
for table in tables:
    table_name = table[0]
    cursor.execute(f"PRAGMA table_info({table_name});")
    schema = cursor.fetchall()
    print(f"Schema for table: {table_name}")
    for column in schema:
        print(column)
    print("\n")

cursor.close()
db_conn.close()

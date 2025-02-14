import duckdb

db_conn = duckdb.connect("weather_data.duckdb")
df = db_conn.execute("SHOW TABLES").fetchdf()
print(df)

# Query data
df_data = db_conn.execute("SELECT * FROM wind_combined LIMIT 10").fetchdf()
print(df_data)

db_conn.close()

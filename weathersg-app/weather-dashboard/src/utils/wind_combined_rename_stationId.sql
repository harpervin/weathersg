BEGIN TRANSACTION;

-- 1. Create a new table with the updated column name
CREATE TABLE wind_combined_new (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,  -- Renamed column
    speed REAL,
    direction INTEGER,
    u REAL,
    v REAL
);

-- 2. Copy data into the new table
INSERT INTO wind_combined_new (date, timestamp, stationId, speed, direction, u, v)
SELECT date, timestamp, station_id, speed, direction, u, v FROM wind_combined;

-- 3. Drop the old table
DROP TABLE wind_combined;

-- 4. Rename the new table to the original name
ALTER TABLE wind_combined_new RENAME TO wind_combined;

COMMIT;

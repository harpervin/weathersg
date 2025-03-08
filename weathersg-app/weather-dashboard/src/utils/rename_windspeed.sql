BEGIN TRANSACTION;

-- 1. Create a new table with the updated column name
CREATE TABLE wind_speed_new (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,  -- Renamed column
    value REAL
);

-- 2. Copy data into the new table
INSERT INTO wind_speed_new (date, timestamp, stationId, value)
SELECT date, timestamp, station_id, value FROM wind_speed;

-- 3. Drop the old table
DROP TABLE wind_speed;

-- 4. Rename the new table to the original name
ALTER TABLE wind_speed_new RENAME TO wind_speed;

COMMIT;

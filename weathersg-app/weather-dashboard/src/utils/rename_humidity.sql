BEGIN TRANSACTION;

-- 1. Create a new table with the updated column name
CREATE TABLE relative_humidity_new (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,  -- Renamed column
    value REAL
);

-- 2. Copy data into the new table
INSERT INTO relative_humidity_new (date, timestamp, stationId, value)
SELECT date, timestamp, station_id, value FROM relative_humidity;

-- 3. Drop the old table
DROP TABLE relative_humidity;

-- 4. Rename the new table to the original name
ALTER TABLE relative_humidity_new RENAME TO relative_humidity;

COMMIT;

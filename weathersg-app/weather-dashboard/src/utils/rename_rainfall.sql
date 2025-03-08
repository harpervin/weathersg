BEGIN TRANSACTION;

-- 1. Create a new table with the updated column name
CREATE TABLE rainfall_new (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,  -- Renamed column
    value REAL
);

-- 2. Copy data into the new table
INSERT INTO rainfall_new (date, timestamp, stationId, value)
SELECT date, timestamp, station_id, value FROM rainfall;

-- 3. Drop the old table
DROP TABLE rainfall;

-- 4. Rename the new table to the original name
ALTER TABLE rainfall_new RENAME TO rainfall;

COMMIT;

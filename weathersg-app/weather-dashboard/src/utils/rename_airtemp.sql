BEGIN TRANSACTION;

-- 1. Create a new table with the updated column name
CREATE TABLE air_temperature_new (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,  -- Renamed column
    value REAL
);

-- 2. Copy data into the new table
INSERT INTO air_temperature_new (date, timestamp, stationId, value)
SELECT date, timestamp, station_id, value FROM air_temperature;

-- 3. Drop the old table
DROP TABLE air_temperature;

-- 4. Rename the new table to the original name
ALTER TABLE air_temperature_new RENAME TO air_temperature;

COMMIT;

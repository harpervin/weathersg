-- Drop existing tables if they exist
DROP TABLE IF EXISTS rainfall_avg_5min;
DROP TABLE IF EXISTS rainfall_avg_15min;

-- Create table for 5-minute intervals
CREATE TABLE IF NOT EXISTS rainfall_avg_5min (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,
    value REAL
);

-- Populate the 5-minute average rainfall data
INSERT INTO rainfall_avg_5min (date, timestamp, stationId, value)
SELECT 
    date, 
    timestamp AS rounded_timestamp,  -- Using the exact timestamp as is
    stationId, 
    AVG(value) AS value
FROM rainfall
GROUP BY rounded_timestamp, stationId
ORDER BY rounded_timestamp, stationId;


-- Create table for 15-minute intervals
CREATE TABLE IF NOT EXISTS rainfall_avg_15min (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,
    value REAL
);

-- Populate the 15-minute average rainfall data (rolling 15-minute average with +15 minutes)
INSERT INTO rainfall_avg_15min (date, timestamp, stationId, value)
SELECT 
    date, 
    timestamp AS rounded_timestamp,  -- Using the exact timestamp as is
    stationId, 
    AVG(value) AS value
FROM rainfall
WHERE timestamp BETWEEN timestamp AND datetime(timestamp, '+15 minutes')  -- 15-minute window starting from the timestamp
GROUP BY stationId, rounded_timestamp
ORDER BY rounded_timestamp, stationId;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS rainfall_avg_1day;
DROP TABLE IF EXISTS rainfall_avg_7day;

-- Create table for 1-day intervals
CREATE TABLE IF NOT EXISTS rainfall_avg_1day (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,
    value REAL
);

-- Populate the 1-day average rainfall data
INSERT INTO rainfall_avg_1day (date, timestamp, stationId, value)
SELECT 
    date, 
    strftime('%Y-%m-%d 00:00:00', timestamp) AS rounded_timestamp,  -- Round to start of the day
    stationId, 
    AVG(value) AS value
FROM rainfall
GROUP BY rounded_timestamp, stationId
ORDER BY rounded_timestamp, stationId;


-- Create table for 7-day intervals
CREATE TABLE IF NOT EXISTS rainfall_avg_7day (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,
    value REAL
);

-- Populate the 7-day average rainfall data
INSERT INTO rainfall_avg_7day (date, timestamp, stationId, value)
SELECT 
    date, 
    strftime('%Y-%m-%d 00:00:00', timestamp, '-' || (strftime('%j', timestamp) % 7) || ' days') AS rounded_timestamp,  -- Round to start of the week
    stationId, 
    AVG(value) AS value
FROM rainfall
GROUP BY rounded_timestamp, stationId
ORDER BY rounded_timestamp, stationId;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS rainfall_avg_1h;
DROP TABLE IF EXISTS rainfall_avg_2h;
DROP TABLE IF EXISTS rainfall_avg_3h;
DROP TABLE IF EXISTS rainfall_avg_4h;
DROP TABLE IF EXISTS rainfall_avg_6h;
DROP TABLE IF EXISTS rainfall_avg_12h;

-- Create table for 1-hour intervals
CREATE TABLE IF NOT EXISTS rainfall_avg_1h (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,
    value REAL
);

-- Populate the 1-hour average rainfall data (1-hour interval)
INSERT INTO rainfall_avg_1h (date, timestamp, stationId, value)
SELECT 
    date, 
    timestamp AS rounded_timestamp,  -- Using the exact timestamp as is
    stationId, 
    AVG(value) AS value
FROM rainfall
WHERE timestamp BETWEEN timestamp AND datetime(timestamp, '+1 hour')  -- 1-hour window
GROUP BY stationId, rounded_timestamp
ORDER BY rounded_timestamp, stationId;


-- Create table for 2-hour intervals
CREATE TABLE IF NOT EXISTS rainfall_avg_2h (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,
    value REAL
);

-- Populate the 2-hour average rainfall data
INSERT INTO rainfall_avg_2h (date, timestamp, stationId, value)
SELECT 
    date, 
    timestamp AS rounded_timestamp,  -- Using the exact timestamp as is
    stationId, 
    AVG(value) AS value
FROM rainfall
WHERE timestamp BETWEEN timestamp AND datetime(timestamp, '+2 hours')  -- 2-hour window
GROUP BY stationId, rounded_timestamp
ORDER BY rounded_timestamp, stationId;


-- Create table for 3-hour intervals
CREATE TABLE IF NOT EXISTS rainfall_avg_3h (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,
    value REAL
);

-- Populate the 3-hour average rainfall data
INSERT INTO rainfall_avg_3h (date, timestamp, stationId, value)
SELECT 
    date, 
    timestamp AS rounded_timestamp,  -- Using the exact timestamp as is
    stationId, 
    AVG(value) AS value
FROM rainfall
WHERE timestamp BETWEEN timestamp AND datetime(timestamp, '+3 hours')  -- 3-hour window
GROUP BY stationId, rounded_timestamp
ORDER BY rounded_timestamp, stationId;


-- Create table for 4-hour intervals
CREATE TABLE IF NOT EXISTS rainfall_avg_4h (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,
    value REAL
);

-- Populate the 4-hour average rainfall data
INSERT INTO rainfall_avg_4h (date, timestamp, stationId, value)
SELECT 
    date, 
    timestamp AS rounded_timestamp,  -- Using the exact timestamp as is
    stationId, 
    AVG(value) AS value
FROM rainfall
WHERE timestamp BETWEEN timestamp AND datetime(timestamp, '+4 hours')  -- 4-hour window
GROUP BY stationId, rounded_timestamp
ORDER BY rounded_timestamp, stationId;


-- Create table for 6-hour intervals
CREATE TABLE IF NOT EXISTS rainfall_avg_6h (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,
    value REAL
);

-- Populate the 6-hour average rainfall data
INSERT INTO rainfall_avg_6h (date, timestamp, stationId, value)
SELECT 
    date, 
    timestamp AS rounded_timestamp,  -- Using the exact timestamp as is
    stationId, 
    AVG(value) AS value
FROM rainfall
WHERE timestamp BETWEEN timestamp AND datetime(timestamp, '+6 hours')  -- 6-hour window
GROUP BY stationId, rounded_timestamp
ORDER BY rounded_timestamp, stationId;


-- Create table for 12-hour intervals
CREATE TABLE IF NOT EXISTS rainfall_avg_12h (
    date TEXT,
    timestamp TEXT,
    stationId TEXT,
    value REAL
);

-- Populate the 12-hour average rainfall data
INSERT INTO rainfall_avg_12h (date, timestamp, stationId, value)
SELECT 
    date, 
    timestamp AS rounded_timestamp,  -- Using the exact timestamp as is
    stationId, 
    AVG(value) AS value
FROM rainfall
WHERE timestamp BETWEEN timestamp AND datetime(timestamp, '+12 hours')  -- 12-hour window
GROUP BY stationId, rounded_timestamp
ORDER BY rounded_timestamp, stationId;

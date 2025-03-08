INSERT INTO wind_combined (date, timestamp, stationId, speed, direction, u, v)
SELECT 
    ws.date, 
    ws.timestamp, 
    ws.stationId, 
    ws.value AS speed, 
    (wd.value + 180) % 360 AS direction,  -- Opposite direction
    ws.value * COS(RADIANS((wd.value + 180) % 360)) AS u,  -- U component
    ws.value * SIN(RADIANS((wd.value + 180) % 360)) AS v   -- V component
FROM wind_speed ws
JOIN wind_direction wd 
ON ws.date = wd.date 
AND ws.timestamp = wd.timestamp 
AND ws.stationId = wd.stationId
ORDER BY ws.date, ws.timestamp, ws.stationId;
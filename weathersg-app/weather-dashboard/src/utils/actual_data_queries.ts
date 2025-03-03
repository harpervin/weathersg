export const getMinutelyIntervalQuery = (table: string, interval: number, minute: string ) => {
    return `SELECT 
        date, 
        strftime('%Y-%m-%d %H:%M:00', timestamp) AS interval_start, 
        station_id, 
        value
    FROM ${table}
    WHERE timestamp BETWEEN ? AND ?
    AND ((CAST(strftime('%M', timestamp) AS INTEGER) - ${minute}) % ${interval}) = 0
    ORDER BY interval_start, station_id;
    `;
};

export const getHourlyIntervalQuery = (table: string, interval: number, hour: string, minute: string) => {
    return `SELECT 
        date, 
        strftime('%Y-%m-%d %H:%M:00', timestamp) AS hour_start, 
        station_id, 
        value
    FROM ${table}
    WHERE timestamp BETWEEN ? AND ?
    AND ((CAST(strftime('%H', timestamp) AS INTEGER) - ${hour}) % ${interval}) = 0
    AND strftime('%M', timestamp) = '${minute}'
    ORDER BY hour_start, station_id;
    `;
};


export const getDailyIntervalQuery = (table: string, interval: number, startDate: string, hour: string, minute: string) => {
    return `SELECT 
        timestamp AS day_start, 
        station_id, 
        value
    FROM ${table}
    WHERE timestamp BETWEEN ? AND ?
    AND timestamp LIKE '% ${hour}:${minute}:00'  -- Fast time filtering using LIKE
    AND (
        timestamp = '${startDate} ${hour}:${minute}:00'  -- Explicitly include start date
        OR 
        (
            -- Efficient month-based interval calculation using Julian days
            (CAST(julianday(timestamp) AS INTEGER) - CAST(julianday('${startDate}') AS INTEGER)) % ${interval} = 0
        )
    )
    ORDER BY day_start, station_id;`;
};



export const getMonthlyIntervalQuery = (table: string, interval: number, day: string, hour: string, minute: string, startDate: string) => {
    return `SELECT 
        date(timestamp) AS date, 
        strftime('%Y-%m-%d ${hour}:${minute}:00', timestamp) AS month_start, 
        station_id, 
        value
    FROM ${table}
    WHERE timestamp BETWEEN ? AND ?
    AND (
        (CAST(strftime('%Y', timestamp) AS INTEGER) - CAST(strftime('%Y', '${startDate}') AS INTEGER)) * 12
        + (CAST(strftime('%m', timestamp) AS INTEGER) - CAST(strftime('%m', '${startDate}') AS INTEGER))
    ) % ${interval} = 0  -- Ensures interval from the start date
    AND CAST(strftime('%d', timestamp) AS INTEGER) = ${day}  -- Ensure exact day match
    AND strftime('%H:%M', timestamp) = '${hour}:${minute}'  -- Ensure exact time match
    ORDER BY month_start, station_id;`;
};

export const getMultiDbMinutelyIntervalQuery = (
    years: number[],
    table: string,
    interval: number,
    minute: string
) => {
    const queries = years.map(
        (year) => `
        SELECT 
            '${year}' AS db_year, 
            date, 
            strftime('%Y-%m-%d %H:%M:00', timestamp) AS interval_start, 
            station_id, 
            value
        FROM weather_${year}.${table}
        WHERE timestamp BETWEEN ? AND ?
        AND ((CAST(strftime('%M', timestamp) AS INTEGER) - ${minute}) % ${interval}) = 0
    `
    );
    return queries.join("\nUNION ALL\n") + "\nORDER BY interval_start, station_id;";
};


export const getMultiDbHourlyIntervalQuery = (
    years: number[],
    table: string,
    interval: number,
    hour: string,
    minute: string
) => {
    const queries = years.map(
        (year) => `
        SELECT 
            '${year}' AS db_year, 
            date, 
            strftime('%Y-%m-%d %H:%M:00', timestamp) AS hour_start, 
            station_id, 
            value
        FROM weather_${year}.${table}
        WHERE timestamp BETWEEN ? AND ?
        AND ((CAST(strftime('%H', timestamp) AS INTEGER) - ${hour}) % ${interval}) = 0
        AND strftime('%M', timestamp) = '${minute}'
    `
    );
    return queries.join("\nUNION ALL\n") + "\nORDER BY hour_start, station_id;";
};

export const getMultiDbDailyIntervalQuery = (
    years: number[],
    table: string,
    interval: number,
    startDate: string,
    hour: string,
    minute: string
) => {
    const queries = years.map(
        (year) => `
        SELECT 
            '${year}' AS db_year, 
            timestamp AS day_start, 
            station_id, 
            value
        FROM weather_${year}.${table}
        WHERE timestamp BETWEEN ? AND ?
        AND timestamp LIKE '% ${hour}:${minute}:00'  -- Faster than strftime('%H:%M', timestamp)
        AND (
            timestamp = '${startDate} ${hour}:${minute}:00'  -- Explicitly include start date
            OR 
            (
                (CAST((strftime('%s', timestamp) - strftime('%s', '${startDate}')) / 86400 AS INTEGER)) % ${interval} = 0
            )
        )
        `
    );

    return queries.join("\nUNION ALL\n") + "\nORDER BY day_start, station_id;";
};


export const getMultiDbMonthlyIntervalQuery = (
    years: number[],
    table: string,
    interval: number,
    day: string,
    hour: string,
    minute: string,
    startDate: string
) => {
    const queries = years.map(
        (year) => `
        SELECT 
            '${year}' AS db_year, 
            timestamp AS month_start, 
            station_id, 
            value
        FROM weather_${year}.${table}
        WHERE timestamp BETWEEN ? AND ?
        AND timestamp LIKE '% ${hour}:${minute}:00' -- Fast filtering of time without function calls
        AND substr(timestamp, 9, 2) = '${day}' -- Direct substring match for day
        AND (
            timestamp = '${startDate} ${hour}:${minute}:00' -- Ensure start date is included
            OR 
            (
                (CAST(substr(timestamp, 1, 4) AS INTEGER) - CAST(substr('${startDate}', 1, 4) AS INTEGER)) * 12
                + (CAST(substr(timestamp, 6, 2) AS INTEGER) - CAST(substr('${startDate}', 6, 2) AS INTEGER))
            ) % ${interval} = 0
        )
        `
    );

    return queries.join("\nUNION ALL\n") + "\nORDER BY month_start, station_id;";
};





export const getMultiDbYearlyIntervalQuery = (
    years: number[],
    table: string,
    interval: number,
    month: string,
    day: string,
    hour: string,
    minute: string
) => {
    console.log(interval)
    const queries = years.map(
        (year) => `
        SELECT 
            '${year}' AS db_year, 
            date, 
            strftime('%Y-${month}-${day} ${hour}:${minute}:00', timestamp, '-' || (strftime('%Y', timestamp) % ${interval}) || ' years') AS year_start, 
            station_id, 
            value
        FROM weather_${year}.${table}
        WHERE timestamp BETWEEN ? AND ?
        AND (strftime('%Y', timestamp) % ${interval}) = 0
        AND strftime('%m-%d %H:%M', timestamp) = '${month}-${day} ${hour}:${minute}'
    `
    );
    return queries.join("\nUNION ALL\n") + "\nORDER BY year_start, station_id;";
};

export const getMinutelyIntervalQuery = (table: string, interval: number, minute: number ) => {
    return `SELECT 
        date, 
        strftime('%Y-%m-%d %H:%M:00', timestamp) AS interval_start, 
        station_id, 
        value
    FROM ${table}
    WHERE timestamp BETWEEN ? AND ?
    AND ((strftime('%M', timestamp) - ${minute}) % ${interval}) = 0
    ORDER BY interval_start, station_id;
    `;
};

export const getHourlyIntervalQuery = (table: string, interval: number, minutes: string) => {
    return `SELECT 
        date, 
        strftime('%Y-%m-%d %H:${minutes}:00', timestamp, '-' || (strftime('%H', timestamp) % ${interval}) || ' hours') AS interval_start, 
        station_id, 
        value
    FROM ${table}
    WHERE timestamp BETWEEN ? AND ?
    AND (strftime('%H', timestamp) % ${interval}) = 0
    AND strftime('%M', timestamp) = '${minutes}'
    ORDER BY interval_start, station_id;
    `;
};

export const getDailyIntervalQuery = (table: string, interval: number, hour: string, minute: string) => {
    return `SELECT 
        date, 
        strftime('%Y-%m-%d ${hour}:${minute}:00', timestamp, '-' || (strftime('%d', timestamp) % ${interval}) || ' days') AS day_start, 
        station_id, 
        value
    FROM ${table}
    WHERE timestamp BETWEEN ? AND ?
    AND (strftime('%d', timestamp) % ${interval}) = 0
    AND strftime('%H:%M', timestamp) = '${hour}:${minute}'
    ORDER BY day_start, station_id;
    `;
};

export const getMonthlyIntervalQuery = (table: string, interval: number, day: string, hour: string, minute: string) => {
    return `SELECT 
        date, 
        strftime('%Y-%m-${day} ${hour}:${minute}:00', timestamp, '-' || (strftime('%m', timestamp) % ${interval}) || ' months') AS month_start, 
        station_id, 
        value
    FROM ${table}
    WHERE timestamp BETWEEN ? AND ?
    AND (strftime('%m', timestamp) % ${interval}) = 0
    AND strftime('%d %H:%M', timestamp) = '${day} ${hour}:${minute}'
    ORDER BY month_start, station_id;
    `;
};

export const getYearlyIntervalQuery = (table: string, interval: number, month: string, day: string, hour: string, minute: string) => {
    return `SELECT 
        date, 
        strftime('%Y-${month}-${day} ${hour}:${minute}:00', timestamp, '-' || (strftime('%Y', timestamp) % ${interval}) || ' years') AS year_start, 
        station_id, 
        value
    FROM ${table}
    WHERE timestamp BETWEEN ? AND ?
    AND (strftime('%Y', timestamp) % ${interval}) = 0
    AND strftime('%m-%d %H:%M', timestamp) = '${month}-${day} ${hour}:${minute}'
    ORDER BY year_start, station_id;
    `;
};

export const getMultiDbMinutelyIntervalQuery = (
    years: number[],
    table: string,
    interval: number
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
        AND (strftime('%M', timestamp) % ${interval}) = 0
    `
    );
    return queries.join("\nUNION ALL\n") + "\nORDER BY interval_start, station_id;";
};

export const getMultiDbHourlyIntervalQuery = (
    years: number[],
    table: string,
    interval: number,
    minutes: string
) => {
    const queries = years.map(
        (year) => `
        SELECT 
            '${year}' AS db_year, 
            date, 
            strftime('%Y-%m-%d %H:${minutes}:00', timestamp, '-' || (strftime('%H', timestamp) % ${interval}) || ' hours') AS interval_start, 
            station_id, 
            value
        FROM weather_${year}.${table}
        WHERE timestamp BETWEEN ? AND ?
        AND (strftime('%H', timestamp) % ${interval}) = 0
        AND strftime('%M', timestamp) = '${minutes}'
    `
    );
    return queries.join("\nUNION ALL\n") + "\nORDER BY interval_start, station_id;";
};

export const getMultiDbDailyIntervalQuery = (
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
            strftime('%Y-%m-%d ${hour}:${minute}:00', timestamp, '-' || (strftime('%d', timestamp) % ${interval}) || ' days') AS day_start, 
            station_id, 
            value
        FROM weather_${year}.${table}
        WHERE timestamp BETWEEN ? AND ?
        AND (strftime('%d', timestamp) % ${interval}) = 0
        AND strftime('%H:%M', timestamp) = '${hour}:${minute}'
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
    minute: string
) => {
    const queries = years.map(
        (year) => `
        SELECT 
            '${year}' AS db_year, 
            date, 
            strftime('%Y-%m-${day} ${hour}:${minute}:00', timestamp, '-' || (strftime('%m', timestamp) % ${interval}) || ' months') AS month_start, 
            station_id, 
            value
        FROM weather_${year}.${table}
        WHERE timestamp BETWEEN ? AND ?
        AND (strftime('%m', timestamp) % ${interval}) = 0
        AND strftime('%d %H:%M', timestamp) = '${day} ${hour}:${minute}'
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

export const getAvgIntervalQuery = () => {
    console.log("run avg");
    return `SELECT 
        date,
        stationId,
        AVG(value) as value
    FROM rainfall
    WHERE timestamp BETWEEN ? AND ?
    GROUP BY stationId
    ORDER BY stationId;
    `;
};

export const getMultiDbAvgQuery = (years: number[]) => {
    const queries = years.map(
        (year) => `
        SELECT 
            stationId,
            AVG(value) AS avg_value
        FROM weather_${year}.rainfall   
        WHERE timestamp BETWEEN ? AND ?
        GROUP BY stationId
    `
    );

    // Wrap the UNION ALL query inside another SELECT to get the final average
    return `
        SELECT stationId, AVG(avg_value) AS value 
        FROM (
            ${queries.join("\nUNION ALL\n")}
        ) 
        GROUP BY stationId
        ORDER BY stationId;
    `;
};

// export const getHourlyAvgIntervalQuery = (table: string, interval: number) => {
//     return `SELECT
//             date,
//             strftime('%Y-%m-%d %H:00:00', timestamp, '-' || (strftime('%H', timestamp) % ${interval}) || ' hours') AS interval_start,
//             station_id,
//             AVG(value) AS avg_value
//         FROM ${table}
//         WHERE timestamp BETWEEN ? AND ?
//         GROUP BY interval_start, station_id
//         ORDER BY interval_start, station_id;
//     `;
// };

// export const getDailyAvgIntervalQuery = (tableName: string) => {
//     return `SELECT
//         strftime('%Y-%m-%d', timestamp) || ' ' || "01:00" AS day_start,
//         station_id,
//         AVG(value) AS avg_value
//     FROM ${tableName}
//     WHERE timestamp BETWEEN "2021-01-01" AND "2021-12-31"
//     AND strftime('%H:%M', timestamp) = "01:00"
//     GROUP BY day_start, station_id
//     ORDER BY day_start, station_id;
//     `;
// };

// export const getMonthlyAvgIntervalQuery = (tableName: string) => {
//     const query = `SELECT
//         strftime('%Y-%m', timestamp) || '-' || "01" || ' ' || "01:00" AS month_start,
//         station_id,
//         AVG(value) AS avg_value
//     FROM ${tableName}
//     WHERE timestamp BETWEEN "2021-01-01" AND "2021-12-31"
//     AND strftime('%d', timestamp) = "01"
//     AND strftime('%H:%M', timestamp) = "01:00"
//     GROUP BY month_start, station_id
//     ORDER BY month_start, station_id;
//     `;
//     return query;
// };

// export const getMultiDbHourlyAvgQuery = (
//     years: number[],
//     table: string,
//     interval: number
// ) => {
//     const queries = years.flatMap(
//         (year) =>
//             `SELECT
//             '${year}' AS db_year,
//             '${table}' AS table_name,
//             date,
//             strftime('%Y-%m-%d %H:00:00', timestamp, '-' || (strftime('%H', timestamp) % ${interval}) || ' hours') AS interval_start,
//             station_id,
//             AVG(value) AS avg_value
//         FROM weather_${year}.${table}
//         WHERE timestamp BETWEEN ? AND ?
//         GROUP BY interval_start, station_id
//     `
//     );
//     return (
//         queries.join("\nUNION ALL\n") + "\nORDER BY interval_start, station_id;"
//     );
// };

// export const getMultiDbDailyAvgQuery = (
//     years: number[],
//     table: string,
//     hour: string,
//     minute: string
// ) => {
//     const queries = years.flatMap(
//         (year) =>
//             `SELECT
//             '${year}' AS db_year,
//             '${table}' AS table_name,
//             strftime('%Y-%m-%d', timestamp) || ' ${hour}:${minute}:00' AS day_start,
//             station_id,
//             AVG(value) AS avg_value
//         FROM weather_${year}.${table}
//         WHERE timestamp BETWEEN ? AND ?
//         AND strftime('%H:%M', timestamp) = '${hour}:${minute}'
//         GROUP BY day_start, station_id
//     `
//     );
//     return queries.join("\nUNION ALL\n") + "\nORDER BY day_start, station_id;";
// };

// export const getMultiDbMonthlyAvgQuery = (
//     years: number[],
//     table: string,
//     day: string,
//     hour: string,
//     minute: string
// ) => {
//     const queries = years.flatMap(
//         (year) =>
//             `SELECT
//             '${year}' AS db_year,
//             '${table}' AS table_name,
//             strftime('%Y-%m', timestamp) || '-${day} ${hour}:${minute}:00' AS month_start,
//             station_id,
//             AVG(value) AS avg_value
//         FROM weather_${year}.${table}
//         WHERE timestamp BETWEEN ? AND ?
//         AND strftime('%d', timestamp) = '${day}'
//         AND strftime('%H:%M', timestamp) = '${hour}:${minute}'
//         GROUP BY month_start, station_id
//     `
//     );
//     return (
//         queries.join("\nUNION ALL\n") + "\nORDER BY month_start, station_id;"
//     );
// };

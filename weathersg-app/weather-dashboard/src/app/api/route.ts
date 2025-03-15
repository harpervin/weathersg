import { NextRequest, NextResponse } from "next/server";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import {
    getAvgIntervalQuery,
    getMultiDbAvgQuery,
    // getMultiDbMonthlyAvgQuery,
    // getMinutelyAvgIntervalQuery,
    // getHourlyAvgIntervalQuery
} from "@/utils/average_data_queries"; // Import optimized queries

import {
    getMultiDbMinutelyIntervalQuery,
    getMultiDbHourlyIntervalQuery,
    getMultiDbDailyIntervalQuery,
    getMultiDbMonthlyIntervalQuery,
    getMultiDbYearlyIntervalQuery,
    getMinutelyIntervalQuery,
    getHourlyIntervalQuery,
    getDailyIntervalQuery,
    getMonthlyIntervalQuery,
} from "@/utils/actual_data_queries"; // Import optimized queries

import { Database } from "sqlite";

// List of available tables for validation
const weatherTables = [
    "wind_speed",
    "wind_direction",
    "relative_humidity",
    "rainfall",
    "air_temperature",
    "wind_combined",
];

// Function to open SQLite connection with persistent mode
async function getDbConnection(dbPath: string) {
    return open({
        filename: dbPath,
        driver: sqlite3.Database,
    });
}

// Function to attach necessary databases
async function attachDatabases(db: Database, years: number[]) {
    for (const year of years) {
        const dbPath = path.join(
            process.cwd(),
            "src",
            "utils",
            `weather_${year}.db`
        );
        console.log(`Attaching database: ${dbPath}`);

        await db.exec(`ATTACH DATABASE '${dbPath}' AS weather_${year}`);
    }
}

// Optimized Function to Query Weather Data
async function getWeatherData(
    startDate: string,
    endDate: string,
    interval: string,
    params: string[],
    heatmapMode: string
) {
    const startYear = parseInt(startDate.substring(0, 4));
    const endYear = parseInt(endDate.substring(0, 4));
    const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i
    );

    // Open DB connection to first year
    const mainDbPath = path.join(
        process.cwd(),
        "src",
        "utils",
        `weather_${startYear}.db`
    );
    const db = await getDbConnection(mainDbPath);

    // Attach remaining databases
    if (years.length > 1) {
        await attachDatabases(db, years);
    }

    console.log(
        `Querying data for interval: ${interval} from ${startDate} to ${endDate}`
    );

    const intervalNum = parseInt(interval.substring(0, -1));
    const year = parseInt(startDate.substring(0, 4));
    const month = startDate.substring(5, 7);
    const day = startDate.substring(8, 10);
    const hour = startDate.substring(11, 13);
    const minute = startDate.substring(14, 16);

    const queryPromises = params.map((param) => {
        switch (interval) {
            case "1min":
            case "5min":
            case "15min": {
                if (heatmapMode === "snapshot") {
                    return years.length > 1
                        ? getMultiDbMinutelyIntervalQuery(
                              years,
                              param,
                              parseInt(interval),
                              minute
                          )
                        : getMinutelyIntervalQuery(
                              param,
                              parseInt(interval),
                              minute
                          );
                } else {
                    return years.length > 1
                        ? getMultiDbAvgQuery(years)
                        : getAvgIntervalQuery();
                }
            }

            case "1h":
            case "2h":
            case "3h":
            case "4h":
            case "6h":
            case "12h":
                if (heatmapMode === "snapshot") {
                    return years.length > 1
                        ? getMultiDbHourlyIntervalQuery(
                              years,
                              param,
                              parseInt(interval),
                              hour,
                              minute
                          )
                        : getHourlyIntervalQuery(
                              param,
                              parseInt(interval),
                              hour,
                              minute
                          );
                } else {
                    return years.length > 1
                        ? getMultiDbAvgQuery(years)
                        : getAvgIntervalQuery();
                }

            case "1day":
            case "7day":
                if (heatmapMode === "snapshot") {
                    return years.length > 1
                        ? getMultiDbDailyIntervalQuery(
                              years,
                              param,
                              parseInt(interval),
                              startDate,
                              hour,
                              minute
                          )
                        : getDailyIntervalQuery(
                              param,
                              parseInt(interval),
                              startDate,
                              hour,
                              minute
                          );
                } else {
                    return years.length > 1
                        ? getMultiDbAvgQuery(years)
                        : getAvgIntervalQuery();
                }
            case "1month":
            case "6month":
                if (heatmapMode === "snapshot") {
                    return years.length > 1
                        ? getMultiDbMonthlyIntervalQuery(
                              years,
                              param,
                              parseInt(interval),
                              day,
                              hour,
                              minute,
                              startDate
                          )
                        : getMonthlyIntervalQuery(
                              param,
                              parseInt(interval),
                              day,
                              hour,
                              minute,
                              startDate
                          );
                } else {
                    return years.length > 1
                        ? getMultiDbAvgQuery(years)
                        : getAvgIntervalQuery();
                }
            case "1year":
                if (heatmapMode === "snapshot") {
                    return getMultiDbYearlyIntervalQuery(
                        years,
                        param,
                        parseInt(interval),
                        month,
                        day,
                        hour,
                        minute
                    );
                } else {
                    return getMultiDbAvgQuery(years);
                }

            default:
                throw new Error("Invalid interval");
        }
    });

    // Run queries in parallel

    const queryResults = await Promise.all(
        queryPromises.map(async (q) => {
            // Dynamically generate the correct number of parameters
            const queryParams = years.flatMap(() => [startDate, endDate]);

            const result = await db.all(q, queryParams);
            return result;
        })
    );

    await db.close();
    return queryResults.flat(); // Merge results
}

// API Route (Handles GET requests)
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");
        const interval = url.searchParams.get("interval");
        const paramRaw = url.searchParams.get("param");
        const param: string[] = paramRaw ? paramRaw.split(",") : weatherTables;
        const heatmapMode = url.searchParams.get("heatmapMode") ?? "snapshot";

        if (!startDate || !endDate || !interval) {
            return NextResponse.json(
                { error: "Missing required query parameters" },
                { status: 400 }
            );
        }

        console.log(
            `Fetching data from ${startDate} to ${endDate} with interval ${interval} for ${param}`
        );

        const data = await getWeatherData(
            startDate,
            endDate,
            interval,
            param,
            heatmapMode
        );

        return NextResponse.json(data, { status: 200 });
    } catch (error) {
        console.error("Error fetching weather data:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

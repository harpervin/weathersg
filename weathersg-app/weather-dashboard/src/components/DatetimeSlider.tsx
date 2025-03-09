import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import { StationData } from "../utils/windData";
import { StationHumidityData } from "@/utils/humidityData";
import { StationTemperatureData } from "@/utils/airTemperatureData";
import { StationRainfallData } from "@/utils/rainfallData";
import { IoMdInformationCircle } from "react-icons/io";

import {
    HistoricalWeatherData,
    HistoricalWindData,
} from "@/utils/historicalWeatherData";

import { CircularProgress } from "@mui/material";

const DatetimeSlider: React.FC<{
    selectedLayers: string[];
    onDataUpdate: (data: {
        windData: HistoricalWindData[];
        temperatureData: HistoricalWeatherData[];
        humidityData: HistoricalWeatherData[];
        rainfallData: HistoricalWeatherData[];
    }) => void;
    currentFrame: number;
    currentTimestamp: string;
    totalFrames: number;
    setCurrentFrame: React.Dispatch<React.SetStateAction<number>>;
}> = ({
    selectedLayers,
    onDataUpdate,
    currentFrame,
    currentTimestamp,
    totalFrames,
    setCurrentFrame,
}) => {
    // Sync slider with the map's animation frame
    useEffect(() => {
        setSliderValue(currentFrame);
    }, [currentFrame]);

    // Reset slider when timestamp loops back
    useEffect(() => {
        if (currentFrame === 0) {
            setSliderValue(0);
        }
    }, [currentFrame]);

    // Readable start & end times
    const [readableStartTime, setReadableStartTime] = useState<string>("");

    // Start & end times in ISO format
    const [startTime, setStartTime] = useState<string>("");
    const [endTime, setEndTime] = useState<string>("");
    const [selectedInterval, setSelectedInterval] = useState<String>("");

    // Maximum time range in minutes
    const [maxInterval, setMaxInterval] = useState<number>(24 * 60); // Default to 24 hours in minutes

    // Default intervals (dropdowns)
    const [selectedYears, setSelectedYears] = useState<number>(0);
    const [selectedMonths, setSelectedMonths] = useState<number>(0);
    const [selectedDays, setSelectedDays] = useState<number>(0);
    const [selectedHours, setSelectedHours] = useState<number>(0);
    const [selectedMinutes, setSelectedMinutes] = useState<number>(0);

    // Disable state for dropdowns
    const [disableYears, setDisableYears] = useState<boolean>(false);
    const [disableMonths, setDisableMonths] = useState<boolean>(false);
    const [disableDays, setDisableDays] = useState<boolean>(false);
    const [disableHours, setDisableHours] = useState<boolean>(false);
    const [disableMinutes, setDisableMinutes] = useState<boolean>(false);

    // Slider state
    const [sliderMax, setSliderMax] = useState<number>(1440); // Max steps in slider
    const [sliderValue, setSliderValue] = useState<number>(0);

    const [tablesToQuery, setTablesToQuery] = useState<string[]>([]);

    const [loading, setLoading] = useState<boolean>(false);
    const [missingParams, setMissingParams] = useState<String>("");
    const [isPlaying, setIsPlaying] = useState<boolean>(false);

    const tableMap: Record<string, string> = {
        Windstream: "wind_combined",
        "Wind Direction": "wind_combined",
        "Wind Speed": "wind_combined",
        "Air Temperature": "air_temperature",
        Humidity: "relative_humidity",
        Rainfall: "rainfall",
    };

    useEffect(() => {
        const windOptions = ["Windstream", "Wind Direction", "Wind Speed"];
        const mappedTables = [
            ...new Set(selectedLayers.map((prop) => tableMap[prop])),
        ];

        // Check if any wind option is selected
        const hasWindSelected = selectedLayers.some((layer) =>
            windOptions.includes(layer)
        );

        if (hasWindSelected && !mappedTables.includes("rainfall")) {
            mappedTables.push("rainfall"); // Ensure "rainfall" is included
        }

        setTablesToQuery(mappedTables);
    }, [selectedLayers]);

    useEffect(() => {
        const today = dayjs();
        const startDate = today.startOf("day");
        const endDate = today.endOf("day");

        setStartTime("2021-01-10 00:00");
        setEndTime("2021-01-10 23:59");
    }, []);

    useEffect(() => {
        if (startTime && endTime) {
            const start = dayjs(startTime);
            const end = dayjs(endTime);
            const totalMinutes = end.diff(start, "minute");
            setReadableStartTime(start.format("DD MMM YY, HH:mm"));

            setMaxInterval(totalMinutes);
            updateDropdownStates(totalMinutes);
        }
    }, [startTime, endTime]);

    useEffect(() => {
        // Calculate interval duration in minutes
        const interval =
            selectedYears * 525600 +
            selectedMonths * 43800 +
            selectedDays * 1440 +
            selectedHours * 60 +
            selectedMinutes;

        if (interval > 0) {
            setSliderMax(Math.floor(maxInterval / interval)); // Dynamically update slider max
        }
    }, [
        selectedYears,
        selectedMonths,
        selectedDays,
        selectedHours,
        selectedMinutes,
        maxInterval,
    ]);

    const updateDropdownStates = (totalMinutes: number) => {
        setDisableYears(525600 > totalMinutes); // 1 year = 525,600 minutes
        setDisableMonths(43800 > totalMinutes); // 1 month = 43,800 minutes
        setDisableDays(1440 > totalMinutes); // 1 day = 1,440 minutes
        setDisableHours(60 > totalMinutes); // 1 hour = 60 minutes
        setDisableMinutes(1 > totalMinutes); // 1 minute = 1 minute (always enabled)
    };

    // Handle manual slider movement
    const handleSliderChange = (event: Event, value: number | number[]) => {
        if (typeof value === "number") {
            setSliderValue(value);
            setCurrentFrame(value); // Update the frame in HistoricalWeatherMap
        }
    };

    const handleFetchData = async () => {
        console.log("Tables to Query:", tablesToQuery);
        if (tablesToQuery.length === 0) {
            setMissingParams("Weather Filter");
            return;
        }

        console.log("Selected Interval:", selectedInterval);
        if (!selectedInterval || String(selectedInterval).startsWith("0")) {
            setMissingParams("Time Interval");
            return;
        }

        setMissingParams("");
        setLoading(true);
        setIsPlaying(false); // Prevent slider from showing until data is fetched

        try {
            console.log("Fetching data for tables:", tablesToQuery);

            // Send multiple API requests in parallel
            const responses = await Promise.all(
                tablesToQuery.map(async (table) => {
                    const queryParams = new URLSearchParams({
                        startDate: startTime,
                        endDate: endTime,
                        interval: String(selectedInterval),
                        param: table,
                    });

                    const response = await fetch(`
                        /api?${queryParams.toString()}`);

                    if (!response.ok)
                        throw new Error("Failed to fetch data from ${table}");

                    return { table, data: await response.json() };
                })
            );

            // Organize data by table
            const weatherData = {
                windData:
                    responses.find((res) => res.table === "wind_combined")
                        ?.data || [],
                temperatureData:
                    responses.find((res) => res.table === "air_temperature")
                        ?.data || [],
                humidityData:
                    responses.find((res) => res.table === "relative_humidity")
                        ?.data || [],
                rainfallData:
                    responses.find((res) => res.table === "rainfall")?.data ||
                    [],
            };

            console.log("Fetched Weather Data:", weatherData);

            // ✅ Pass the data to parent component
            onDataUpdate(weatherData);
            setLoading(false);
            setIsPlaying(true);
            return weatherData; // Return structured weather data
        } catch (error) {
            console.error("Error fetching weather data:", error);
            return null; // Return null on failure
        }
    };

    return (
        <div className="p-4 bg-gray-100 rounded shadow-lg my-4">
            <Box>
                <h2 className="font-bold mb-2">1. Select Date Time Range:</h2>
                <Stack
                    spacing={2}
                    direction="row"
                    sx={{ alignItems: "center", width: "100%", mx: "auto" }}
                >
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        {/* Start Date Picker */}
                        <DateTimePicker
                            label="Start Date/Time"
                            value={dayjs(startTime)}
                            onChange={(newValue) => {
                                if (newValue) {
                                    setStartTime(
                                        newValue.format("YYYY-MM-DD HH:mm")
                                    );

                                    // Ensure end date is always after start date
                                    if (dayjs(newValue).isAfter(endTime)) {
                                        setEndTime(
                                            newValue
                                                .add(1, "minute")
                                                .format("YYYY-MM-DD HH:mm")
                                        );
                                    }
                                }
                            }}
                            format="DD/MM/YYYY HH:mm"
                            minDate={dayjs("2021-01-01")}
                            maxDate={dayjs("2024-12-31")}
                        />
                    </LocalizationProvider>
                    <h2 className="font-bold">–</h2>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        {/* End Date Picker */}
                        <DateTimePicker
                            label="End Date/Time"
                            value={dayjs(endTime)}
                            onChange={(newValue) => {
                                if (
                                    newValue &&
                                    dayjs(newValue).isAfter(startTime)
                                ) {
                                    setEndTime(
                                        newValue.format("YYYY-MM-DD HH:mm")
                                    );
                                }
                            }}
                            format="DD/MM/YYYY HH:mm"
                            minDate={dayjs(startTime).add(1, "minute")} // Dynamically updates based on start date
                            maxDate={dayjs("2024-12-31")}
                        />
                    </LocalizationProvider>
                </Stack>
            </Box>

            {/* Interval Selector */}
            <div className="my-4">
                <h2 className="font-bold">2. Select Interval:</h2>
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{ alignItems: "center" }}
                >
                    <Select
                        value={selectedYears}
                        onChange={(e) => {
                            setSelectedYears(Number(e.target.value));
                            setSelectedMonths(0);
                            setSelectedDays(0);
                            setSelectedHours(0);
                            setSelectedMinutes(0);
                            setSelectedInterval(
                                String(e.target.value) + "year"
                            );
                        }}
                        displayEmpty
                        disabled={disableYears}
                    >
                        <MenuItem value={0}>0 Years</MenuItem>
                        <MenuItem value={1} disabled={maxInterval < 525600}>
                            1 Year
                        </MenuItem>
                    </Select>

                    <Select
                        value={selectedMonths}
                        onChange={(e) => {
                            setSelectedMonths(Number(e.target.value));
                            setSelectedYears(0);
                            setSelectedDays(0);
                            setSelectedHours(0);
                            setSelectedMinutes(0);
                            setSelectedInterval(
                                String(e.target.value) + "month"
                            );
                        }}
                        displayEmpty
                        disabled={disableMonths}
                    >
                        <MenuItem value={0}>0 Months</MenuItem>
                        <MenuItem value={1} disabled={maxInterval < 43800}>
                            1 Month
                        </MenuItem>
                        <MenuItem value={6} disabled={maxInterval < 262800}>
                            6 Months
                        </MenuItem>
                    </Select>

                    <Select
                        value={selectedDays}
                        onChange={(e) => {
                            setSelectedDays(Number(e.target.value));
                            setSelectedMonths(0);
                            setSelectedYears(0);
                            setSelectedHours(0);
                            setSelectedMinutes(0);
                            setSelectedInterval(String(e.target.value) + "day");
                        }}
                        displayEmpty
                        disabled={disableDays}
                    >
                        <MenuItem value={0}>0 Days</MenuItem>
                        <MenuItem value={1} disabled={maxInterval < 1440}>
                            1 Day
                        </MenuItem>
                        <MenuItem value={7} disabled={maxInterval < 10080}>
                            7 Days
                        </MenuItem>
                        <MenuItem value={30} disabled={maxInterval < 43200}>
                            30 Days
                        </MenuItem>
                    </Select>

                    <Select
                        value={selectedHours}
                        onChange={(e) => {
                            setSelectedHours(Number(e.target.value));
                            setSelectedDays(0);
                            setSelectedMonths(0);
                            setSelectedYears(0);
                            setSelectedMinutes(0);
                            setSelectedInterval(String(e.target.value) + "h");
                        }}
                        displayEmpty
                        disabled={disableHours}
                    >
                        <MenuItem value={0}>0 Hours</MenuItem>
                        <MenuItem value={1} disabled={maxInterval < 60}>
                            1 Hour
                        </MenuItem>
                        <MenuItem value={2} disabled={maxInterval < 120}>
                            2 Hours
                        </MenuItem>
                        <MenuItem value={3} disabled={maxInterval < 180}>
                            3 Hours
                        </MenuItem>
                        <MenuItem value={4} disabled={maxInterval < 240}>
                            4 Hours
                        </MenuItem>
                        <MenuItem value={6} disabled={maxInterval < 360}>
                            6 Hours
                        </MenuItem>
                        <MenuItem value={12} disabled={maxInterval < 720}>
                            12 Hours
                        </MenuItem>
                    </Select>

                    <Select
                        value={selectedMinutes}
                        onChange={(e) => {
                            setSelectedMinutes(Number(e.target.value));
                            setSelectedHours(0);
                            setSelectedDays(0);
                            setSelectedMonths(0);
                            setSelectedYears(0);
                            setSelectedInterval(String(e.target.value) + "min");
                        }}
                        displayEmpty
                        disabled={disableMinutes}
                    >
                        <MenuItem value={0}>0 Minutes</MenuItem>
                        <MenuItem value={1}>1 Minute</MenuItem>
                        <MenuItem value={5} disabled={maxInterval < 5}>
                            5 Minutes
                        </MenuItem>
                        <MenuItem value={15} disabled={maxInterval < 15}>
                            15 Minutes
                        </MenuItem>
                    </Select>
                </Stack>
            </div>

            <div className="flex items-center">
                <IoMdInformationCircle size={25} />
                <div className="mx-2 font-semibold">
                    Larger time intervals will take a longer time to fetch
                    weather data.
                </div>
            </div>

            <div className="my-4 flex items-center space-x-4">
                <button
                    className="rounded-full bg-blue-200 p-2 h-12 text-black font-semibold hover:bg-blue-400 hover:text-white"
                    onClick={handleFetchData}
                >
                    Play Animation
                </button>
                {loading && (
                    <div className="flex items-center space-x-2">
                        <CircularProgress size={24} />
                        <span className="font-semibold">
                            Fetching data... Please wait for animations to be
                            updated
                        </span>
                    </div>
                )}

                {missingParams != "" && (
                    <div className="flex items-center space-x-2">
                        <span className="font-semibold text-red-500">
                            Please select {missingParams} to view data!
                        </span>
                    </div>
                )}
            </div>

            {/* Slider - Only Show When Animation is Playing */}
            {isPlaying && (
                <>
                    <hr />
                    <div className="my-2">
                        <h2 className="font-bold">
                            View weather at this time:
                        </h2>
                        <Slider
                            aria-label="Time Range"
                            value={sliderValue}
                            onChange={handleSliderChange}
                            valueLabelDisplay="auto"
                            valueLabelFormat={() => currentTimestamp}
                            step={1}
                            min={0}
                            max={totalFrames - 1} // Ensure slider range matches animation frames
                            sx={{ width: "100%" }}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default DatetimeSlider;

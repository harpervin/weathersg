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

interface DatetimeSliderProps {
    onDataFetched: (data: any) => void; // Function to pass data to parent
}

const DatetimeSlider: React.FC<DatetimeSliderProps> = ({ onDataFetched }) => {
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

    useEffect(() => {
        const today = dayjs();
        const startDate = today.startOf("day");
        const endDate = today.endOf("day");

        setReadableStartTime(startDate.format("DD MMM YY, HH:mm"));

        setStartTime(startDate.format("YYYY-MM-DD HH:mm"));
        setEndTime(endDate.format("YYYY-MM-DD HH:mm"));
    }, []);

    useEffect(() => {
        if (startTime && endTime) {
            console.log(startTime, endTime);
            const start = dayjs(startTime);
            const end = dayjs(endTime);
            const totalMinutes = end.diff(start, "minute");

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

    const handleSliderChange = (event: Event, value: number | number[]) => {
        if (typeof value === "number") {
            setSliderValue(value);

            const start = dayjs(startTime);

            // Instead of using static minutes, use proper date unit calculations
            const newTime = start
                .add(selectedYears * value, "year")
                .add(selectedMonths * value, "month")
                .add(selectedDays * value, "day")
                .add(selectedHours * value, "hour")
                .add(selectedMinutes * value, "minute")
                .format("DD MMM YY, HH:mm");

            setReadableStartTime(newTime);
        }
    };

    const handleFetchData = async () => {
        try {
            console.log(startTime, endTime, selectedInterval);
    
            const paramString = tables.length ? tables.join(",") : "all"; // Convert array to a comma-separated string
    
            const response = await fetch(
                `/api?startDate=${startTime}&endDate=${endTime}&interval=${selectedInterval}&param=${encodeURIComponent(paramString)}`
            );
    
            if (!response.ok) throw new Error("Failed to fetch weather data");
    
            const data = await response.json();
            onDataFetched(data);
            console.log("fetched past data: ", data);
        } catch (error) {
            console.error("Error fetching weather data:", error);
        }
    };
    

    const tables = [
        // "wind_speed",
        // "wind_direction",
        // "relative_humidity",
        // "rainfall",
        "air_temperature",
        // "wind_combined",
    ];

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
                        <DateTimePicker
                            label="Start Date/Time"
                            value={dayjs(startTime)}
                            onChange={(newValue) =>
                                setStartTime(
                                    newValue?.format("YYYY-MM-DD HH:mm") || ""
                                )
                            }
                        />
                    </LocalizationProvider>
                    <h2 className="font-bold">–</h2>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateTimePicker
                            label="End Date/Time"
                            value={dayjs(endTime)}
                            onChange={(newValue) =>
                                setEndTime(
                                    newValue?.format("YYYY-MM-DD HH:mm") || ""
                                )
                            }
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

            <div className="my-4">
                <button
                    className="rounded-full bg-blue-200 p-2 h-12 text-black font-semibold hover:bg-blue-400 hover:text-white"
                    onClick={handleFetchData}
                >
                    Play Animation
                </button>
            </div>

            <hr />

            {/* Slider */}
            <div className="my-2">
                <h2 className="font-bold">View weather at this time:</h2>
                <Slider
                    aria-label="Time Range"
                    value={sliderValue}
                    onChange={handleSliderChange}
                    valueLabelDisplay="auto"
                    valueLabelFormat={readableStartTime}
                    step={1}
                    min={0}
                    max={sliderMax}
                    sx={{ width: "100%" }}
                />
                <h2 className="font-bold">
                    Selected Time: {readableStartTime}
                </h2>
            </div>
        </div>
    );
};

export default DatetimeSlider;

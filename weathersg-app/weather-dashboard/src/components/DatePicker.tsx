import React from "react";
import { DateRangePicker } from "react-date-range";

type DatePickerProps = {
  dateRange: { startDate: Date; endDate: Date; key: string }[];
  setDateRange: React.Dispatch<React.SetStateAction<{ startDate: Date; endDate: Date; key: string }[]>>;
};

const DatePicker: React.FC<DatePickerProps> = ({ dateRange, setDateRange }) => {
  return (
    <div className="my-4">
      <DateRangePicker
        ranges={dateRange}
        onChange={(ranges) => setDateRange([ranges.selection])}
        moveRangeOnFirstSelection={false}
        rangeColors={["#4CAF50"]}
        minDate={new Date("2022-01-01")}
        maxDate={new Date()}
      />
      <div className="text-sm text-gray-600 mt-2">
        Selected Range: {dateRange[0].startDate?.toLocaleDateString()} -{" "}
        {dateRange[0].endDate?.toLocaleDateString()}
      </div>
    </div>
  );
};

export default DatePicker;

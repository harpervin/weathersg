declare module "react-date-range" {
    import { ComponentType } from "react";
  
    export interface Range {
      startDate: Date;
      endDate: Date;
      key: string;
    }
  
    export interface DateRangePickerProps {
      ranges: Range[];
      onChange: (ranges: { selection: Range }) => void;
      moveRangeOnFirstSelection?: boolean;
      rangeColors?: string[];
      minDate?: Date;
      maxDate?: Date;
    }
  
    export const DateRangePicker: ComponentType<DateRangePickerProps>;
  }
  
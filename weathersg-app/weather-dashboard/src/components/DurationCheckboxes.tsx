import React from "react";

type DurationCheckboxesProps = {
  durations: string[];
  duration: string;
  setDuration: React.Dispatch<React.SetStateAction<string>>;
};

const DurationCheckboxes: React.FC<DurationCheckboxesProps> = ({ durations, duration, setDuration }) => {
  return (
    <div className="my-4 flex flex-wrap gap-4">
      {durations.map((d) => (
        <label key={d} className="flex items-center space-x-2">
          <input
            type="radio"
            name="duration"
            className="w-4 h-4"
            checked={duration === d}
            onChange={() => setDuration(d)}
          />
          <span>{d}</span>
        </label>
      ))}
    </div>
  );
};

export default DurationCheckboxes;

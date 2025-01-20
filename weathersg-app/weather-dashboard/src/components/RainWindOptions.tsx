import React from "react";

type RainWindOptionsProps = {
  rainWindOption: string | null;
  setRainWindOption: React.Dispatch<React.SetStateAction<string | null>>;
};

const RainWindOptions: React.FC<RainWindOptionsProps> = ({ rainWindOption, setRainWindOption }) => {
  return (
    <div className="my-4 flex flex-col space-y-2">
      {["Total", "Average"].map((option) => (
        <label key={option} className="flex items-center space-x-2">
          <input
            type="radio"
            name="rainWindOption"
            className="w-4 h-4"
            value={option}
            checked={rainWindOption === option}
            onChange={() => setRainWindOption(option)}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
};

export default RainWindOptions;

"use client";

import React from "react";

interface CheckboxGroupProps {
  options: string[];
  onChange: (checkedValues: string[]) => void;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({ options, onChange }) => {
  const [checkedValues, setCheckedValues] = React.useState<string[]>([]);

  const handleChange = (option: string) => {
    let updatedValues;
    if (checkedValues.includes(option)) {
      updatedValues = checkedValues.filter((value) => value !== option);
    } else {
      updatedValues = [...checkedValues, option];
    }
    setCheckedValues(updatedValues);
    onChange(updatedValues);
  };

  return (
    <div className="flex flex-col space-y-2">
      {options.map((option) => (
        <label key={option} className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="w-4 h-4"
            value={option}
            checked={checkedValues.includes(option)}
            onChange={() => handleChange(option)}
          />
          <span className="text-gray-800">{option}</span>
        </label>
      ))}
    </div>
  );
};

export default CheckboxGroup;

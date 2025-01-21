type CheckboxOption = {
    label: string;
    tooltip?: string;
};

export type CheckboxGroupProps = {
    options: CheckboxOption[];
    value: string[]; // Selected checkboxes
    onChange: (checkedValues: string[]) => void;
};

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
    options,
    value,
    onChange,
}) => {
    const handleCheckboxChange = (label: string) => {
        const newValue = value.includes(label)
            ? value.filter((item) => item !== label)
            : [...value, label];
        onChange(newValue);
    };

    return (
        <div className="space-y-2">
            {options.map((option) => (
                <label
                    key={option.label}
                    className="flex items-center space-x-2 relative group cursor-pointer"
                >
                    <input
                        type="checkbox"
                        checked={value.includes(option.label)}
                        onChange={() => handleCheckboxChange(option.label)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                    />
                    <span>{option.label}</span>
                    {option.tooltip && (
                        <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-gray-800 text-white text-sm rounded py-1 px-2 z-10 shadow-lg">
                            {option.tooltip}
                        </div>
                    )}
                </label>
            ))}
        </div>
    );
};

export default CheckboxGroup;

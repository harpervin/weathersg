"use client";

import { useState } from "react";
import { FaSearch } from "react-icons/fa";

interface SearchBarProps {
    query: string;
    setQuery: (query: string) => void;
}

const singaporeLocations = [
    "Ang Mo Kio MRT",
    "Bedok MRT",
    "Changi Airport",
    "Dhoby Ghaut MRT",
    "Esplanade",
    "Farrer Park MRT",
    "Gardens by the Bay",
    "HarbourFront MRT",
    "Ion Orchard",
    "Joo Koon MRT",
    "Katong",
    "Little India",
    "Marina Bay Sands",
    "Newton MRT",
    "Orchard Road",
    "Pasir Ris MRT",
    "Queenstown MRT",
    "Raffles Place MRT",
    "Sentosa Island",
    "Tampines MRT",
    "Ubi MRT",
    "Vivocity",
    "Woodlands MRT",
    "Yishun MRT",
];

export default function SearchBar({ query, setQuery }: SearchBarProps) {
    const [filteredLocations, setFilteredLocations] = useState<string[]>([]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setQuery(value);
        if (value.trim() === "") {
            setFilteredLocations([]);
        } else {
            const results = singaporeLocations.filter((location) =>
                location.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredLocations(results);
        }
    };

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        console.log("Search query submitted:", query);
        // Add search functionality here if needed
    };

    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion);
        setFilteredLocations([]);
    };

    return (
        <div className="relative w-full lg:w-auto mt-4 lg:mt-0">
            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    placeholder="Search location..."
                    className="border rounded px-4 py-2 w-64"
                />
                <button
                    type="submit"
                    className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    <FaSearch size={20} />
                </button>
            </form>
            {filteredLocations.length > 0 && (
                <ul className="absolute z-[1000] mt-2 w-64 bg-white border rounded shadow-lg">
                    {filteredLocations.map((location) => (
                        <li
                            key={location}
                            onClick={() => handleSuggestionClick(location)}
                            className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                        >
                            {location}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

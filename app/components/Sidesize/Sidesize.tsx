"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";  // Assuming you have a ShadCN Button component

const Size = () => {
  // State to track the selected option
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Handle option click
  const handleSelect = (option: string) => {
    setSelectedOption(option); // Set the selected option
  };

  // Array of size options
  const sizeOptions = [
    "XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"
  ];

  return (
    <div className="w-[100%]  bg-gray-100 p-4 shadow-lg"> {/* Sidebar container */}
      <h2 className="text-xl font-semibold mb-4">Select Size</h2>
      <div className=" grid grid-cols-2">
        {sizeOptions.map((size) => (
          <Button
            key={size} // Key for each button
            onClick={() => handleSelect(size)}
            className={`w-full px-4 py-3 m-2 gap-1 rounded-full text-lg ${selectedOption === size ? "bg-black text-white" : "bg-gray-200 text-gray-500 hover:bg-gray-300"}`}
          >
            {size}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Size;

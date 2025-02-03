import { useState } from "react";
import { Button } from "@/components/ui/button";  // Assuming you have a ShadCN Button component

const Size = () => {
  // State to track the selected option
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Handle option click
  const handleSelect = (option: string) => {
    setSelectedOption(option); // Set the selected option
  };

  return (
    <div className=" space-2 grid grid-cols-2 md:flex  "> {/* Flexbox for horizontal alignment */}
      {/* Option 1 */}
      <Button
        onClick={() => handleSelect("Small")}
        className={` px-2 md:px-4 lg:px-6 py-3 rounded-full text-lg ${selectedOption === "Small" ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}
      >
        Small
      </Button>

      {/* Option 2 */}
      <Button
        onClick={() => handleSelect("Medium")}
        className={` px-2 md:px-4 lg:px-6 py-3 rounded-full text-lg ${selectedOption === "Medium" ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}
      >
        Medium
      </Button>

      {/* Option 3 */}
      <Button
        onClick={() => handleSelect("Large")}
        className={` px-2 md:px-4 lg:px-6 py-3 rounded-full text-lg ${selectedOption === "Large" ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}
      >
        Large
      </Button>

      {/* Option 4 */}
      <Button
        onClick={() => handleSelect("Extra Large")}
        className={` px-2 md:px-4 lg:px-6 py-3 rounded-full text-lg ${selectedOption === "Extra Large" ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}
      >
       X-Large
      </Button>
    </div>
  );
};

export default Size;

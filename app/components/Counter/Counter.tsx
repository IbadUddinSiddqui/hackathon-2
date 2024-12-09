"use client"
import { useState } from "react";

const Counter = () => {
  // State to track the counter value
  const [count, setCount] = useState<number>(0);

  // Handle increase
  const increment = () => setCount(count + 1);

  // Handle decrease
  const decrement = () => setCount(count - 1);

  return (
    <div className="flex items-center  bg-gray-300  rounded-full mt-1 justify-center space-x-0">
      {/* Decrease button */}
      <button
        onClick={decrement}
        className="px-4 py-2 bg-gray-300 text-black rounded-full text-xl"
      >
        -
      </button>

      {/* Display the counter */}
      <div className="text-2xl font-bold">{count}</div>

      {/* Increase button */}
      <button
        onClick={increment}
        className="px-4 py-2 bg-gray-300 text-black rounded-full text-xl"
      >
        +
      </button>
    </div>
  );
};

export default Counter;

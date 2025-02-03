"use client"
import { useState } from "react";
import MyAccordion from "../Accordion/Accordion";
import SliderDemo from "../Slider/Slider";
import ColorPicker from "../ColorPicker/ColorPicker";
import Sidesize from "../Sidesize/Sidesize";
import MyAccordion1 from "../Accordion1/Accordion1";

export function AppSidebar() {
  // State to manage sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Toggle sidebar visibility
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <>
      {/* Button to toggle sidebar visibility on small screens */}
      <button
        className="lg:hidden p-4 bg-black  text-white rounded-md fixed top-4 left-4 z-50"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed lg:relative top-0 left-0 w-[250px] bg-white h-full p-4 font-bold text-black transition-transform transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 z-40`}
      >
        {/* Sidebar Header */}
        <div className="text-2xl mb-4">Features</div>

        {/* Sidebar Content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <MyAccordion />
          </div>
          <div className="space-y-2">
            <SliderDemo />
          </div>
          <div className="space-y-2">
            <h3>Pick Color</h3>
            <ColorPicker />
          </div>
          <div className="space-y-2">
            <h3>Size</h3>
            <Sidesize />
          </div>
          <div className="space-y-2">
            <h3>Dress Style</h3>
            <MyAccordion1 />
          </div>
        </div>

        {/* Sidebar Footer (optional) */}
        <div className="mt-4"></div>
      </div>

      {/* Overlay (for small screens when sidebar is open) */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black opacity-50 z-30"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}

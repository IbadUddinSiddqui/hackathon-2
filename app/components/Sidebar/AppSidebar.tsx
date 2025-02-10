import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiX, FiFilter } from 'react-icons/fi';

interface AppSidebarProps {
  brands: any;
  sizes: string[];
  tags: string[];
  selectedBrands: string[];
  selectedSizes: string[];
  selectedTags: string[];
  onBrandChange: (brands: string[]) => void;
  onSizeChange: (sizes: string[]) => void;
  onTagChange: (tags: string[]) => void;
}

const AppSidebar = ({
  brands,
  sizes,
  tags,
  selectedBrands,
  selectedSizes,
  selectedTags,
  onBrandChange,
  onSizeChange,
  onTagChange,
}: AppSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    brands: true,
    sizes: true,
    tags: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleBrandToggle = (brand: string) => {
    const updatedBrands = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    onBrandChange(updatedBrands);
  };

  const handleSizeToggle = (size: string) => {
    const updatedSizes = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    onSizeChange(updatedSizes);
  };

  const handleTagToggle = (tag: string) => {
    const updatedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onTagChange(updatedTags);
  };

  // Mobile sidebar animation variants
  const mobileVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '-100%', opacity: 0 },
  };

  // Accordion content animation
  const contentVariants = {
    open: { opacity: 1, height: 'auto' },
    closed: { opacity: 0, height: 0 },
  };

  const renderCheckbox = (checked: boolean) => (
    <motion.div
      className={`w-5 h-5 flex items-center justify-center rounded-md border-2 ${
        checked
          ? 'border-green-500 bg-green-500'
          : 'border-gray-300 dark:border-gray-600'
      }`}
      animate={{ scale: checked ? 1.05 : 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {checked && (
        <motion.svg
          className="w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      )}
    </motion.div>
  );

  return (
    <>
      {/* Trigger Button for All Screens */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-30 p-4 bg-green-500 text-white rounded-full shadow-xl hover:bg-green-600 transition-all"
      >
        <FiFilter className="w-6 h-6" />
      </button>

      {/* Overlay for All Screens */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content for All Screens */}
      <motion.div
        className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto transform transition-transform duration-300 ease-in-out"
        variants={mobileVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="p-6">
          {/* Header for All Screens */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold dark:text-white">Filters</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <FiX className="w-6 h-6 dark:text-white" />
            </button>
          </div>

          {/* Brands Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('brands')}
              className="flex items-center justify-between w-full mb-2"
            >
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Brands
              </h3>
              <motion.div
                animate={{ rotate: openSections.brands ? 0 : -90 }}
                transition={{ duration: 0.2 }}
              >
                <FiChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openSections.brands && (
                <motion.div
                  variants={contentVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="space-y-2 pl-2"
                >
                  {brands.map((brand: any) => (
                    <label
                      key={brand}
                      className="flex items-center space-x-3 cursor-pointer group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleBrandToggle(brand)}
                        className="hidden"
                      />
                      {renderCheckbox(selectedBrands.includes(brand))}
                      <span className="text-gray-700 dark:text-gray-200">
                        {brand}
                      </span>
                    </label>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sizes Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('sizes')}
              className="flex items-center justify-between w-full mb-2"
            >
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Sizes
              </h3>
              <motion.div
                animate={{ rotate: openSections.sizes ? 0 : -90 }}
                transition={{ duration: 0.2 }}
              >
                <FiChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openSections.sizes && (
                <motion.div
                  variants={contentVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="space-y-2 pl-2"
                >
                  {sizes.map((size) => (
                    <label
                      key={size}
                      className="flex items-center space-x-3 cursor-pointer group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size)}
                        onChange={() => handleSizeToggle(size)}
                        className="hidden"
                      />
                      {renderCheckbox(selectedSizes.includes(size))}
                      <span className="text-gray-700 dark:text-gray-200">
                        {size}
                      </span>
                    </label>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tags Section */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection('tags')}
              className="flex items-center justify-between w-full mb-2"
            >
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Tags
              </h3>
              <motion.div
                animate={{ rotate: openSections.tags ? 0 : -90 }}
                transition={{ duration: 0.2 }}
              >
                <FiChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openSections.tags && (
                <motion.div
                  variants={contentVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="space-y-2 pl-2"
                >
                  {tags.map((tag) => (
                    <label
                      key={tag}
                      className="flex items-center space-x-3 cursor-pointer group"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag)}
                        onChange={() => handleTagToggle(tag)}
                        className="hidden"
                      />
                      {renderCheckbox(selectedTags.includes(tag))}
                      <span className="text-gray-700 dark:text-gray-200">
                        {tag}
                      </span>
                    </label>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default AppSidebar;
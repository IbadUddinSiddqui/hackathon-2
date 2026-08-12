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

  // Refined checkbox (uiverse.io-style): the checkmark draws itself via
  // stroke pathLength instead of popping, the box overshoots with the site's
  // motion language (framer-motion keyframes, not a bare scale flip), presses
  // squash, and hover previews the border. Same colors — no new tokens.
  const renderCheckbox = (checked: boolean) => (
    <motion.div
      className={`flex h-5 w-5 items-center justify-center border-2 transition-colors duration-200 ${
        checked
          ? 'border-brand-ink bg-brand-ink  dark:bg-brand-ink-inverse'
          : 'border-brand-line-strong group-hover:border-brand-ink dark:group-hover:border-brand-ink-inverse'
      }`}
      initial={false}
      animate={{ scale: checked ? [1, 1.12, 1] : 1 }}
      transition={{ duration: 0.35, times: [0, 0.5, 1], ease: 'easeOut' }}
      whileTap={{ scale: 0.92, transition: { duration: 0.12 } }}
    >
      <motion.svg
        className={`h-3 w-3 ${checked ? 'text-white dark:text-brand-ink' : 'text-transparent'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <motion.path
          d="M5 13l4 4L19 7"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        />
      </motion.svg>
    </motion.div>
  );

  return (
    <>
      {/* Trigger Button — an inline, on-theme filter bar (no floating green
          FAB: the old pill FAB is a TailAdmin leftover that doesn't belong on
          the storefront). Rendered by the page above the grid. */}
      <button
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-3 border-b border-brand-line pb-2 text-sm font-medium tracking-wide text-brand-ink transition-colors hover:border-brand-ink  dark:hover:border-brand-ink-inverse"
      >
        <FiFilter className="h-4 w-4" />
        Filters
        <span aria-hidden className="h-px w-8 bg-brand-line-strong transition-all duration-300 group-hover:w-12" />
      </button>

      {/* Overlay for All Screens */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-brand-ink/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content for All Screens */}
      <motion.div
        className="fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto border-r border-brand-line bg-brand-surface dark:border-brand-line dark:bg-brand-surface-alt"
        variants={mobileVariants}
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="p-6">
          {/* Header for All Screens */}
          <div className="mb-8 flex items-center justify-between border-b border-brand-line pb-4">
            <h2 className="text-xl font-bold tracking-tight text-brand-ink ">
              Filters
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-brand-muted transition-colors hover:bg-brand-surface-alt dark:hover:bg-brand-charcoal"
              aria-label="Close filters"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Brands Section */}
          <div className="mb-7">
            <button
              onClick={() => toggleSection('brands')}
              className="mb-3 flex w-full items-center justify-between"
            >
              <h3 className="text-eyebrow text-brand-ink ">
                Brands
              </h3>
              <motion.div
                animate={{ rotate: openSections.brands ? 0 : -90 }}
                transition={{ duration: 0.2 }}
              >
                <FiChevronDown className="h-4 w-4 text-brand-muted" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openSections.brands && (
                <motion.div
                  variants={contentVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="space-y-2.5 pl-1"
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
                      <span className="text-sm text-brand-muted transition-colors group-hover:text-brand-ink dark:text-brand-muted dark:group-hover:text-brand-ink-inverse">
                        {brand}
                      </span>
                    </label>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sizes Section */}
          <div className="mb-7">
            <button
              onClick={() => toggleSection('sizes')}
              className="mb-3 flex w-full items-center justify-between"
            >
              <h3 className="text-eyebrow text-brand-ink ">
                Sizes
              </h3>
              <motion.div
                animate={{ rotate: openSections.sizes ? 0 : -90 }}
                transition={{ duration: 0.2 }}
              >
                <FiChevronDown className="h-4 w-4 text-brand-muted" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openSections.sizes && (
                <motion.div
                  variants={contentVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="space-y-2.5 pl-1"
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
                      <span className="text-sm text-brand-muted transition-colors group-hover:text-brand-ink dark:text-brand-muted dark:group-hover:text-brand-ink-inverse">
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
              className="mb-3 flex w-full items-center justify-between"
            >
              <h3 className="text-eyebrow text-brand-ink ">
                Tags
              </h3>
              <motion.div
                animate={{ rotate: openSections.tags ? 0 : -90 }}
                transition={{ duration: 0.2 }}
              >
                <FiChevronDown className="h-4 w-4 text-brand-muted" />
              </motion.div>
            </button>
            <AnimatePresence>
              {openSections.tags && (
                <motion.div
                  variants={contentVariants}
                  initial="closed"
                  animate="open"
                  exit="closed"
                  className="space-y-2.5 pl-1"
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
                      <span className="text-sm text-brand-muted transition-colors group-hover:text-brand-ink dark:text-brand-muted dark:group-hover:text-brand-ink-inverse">
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
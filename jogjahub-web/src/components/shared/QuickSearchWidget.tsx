"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";

const quickSearchCategories = ["Beauty & Style", "Penginapan", "Gifting"] as const;

export function QuickSearchWidget() {
  const [activeQuickCategory, setActiveQuickCategory] = useState<(typeof quickSearchCategories)[number]>(quickSearchCategories[0]);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = quickSearchCategories.indexOf(activeQuickCategory);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % quickSearchCategories.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + quickSearchCategories.length) % quickSearchCategories.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = quickSearchCategories.length - 1;
    else return;

    event.preventDefault();
    setActiveQuickCategory(quickSearchCategories[nextIndex]);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="relative left-1/2 z-10 w-screen -translate-x-1/2 px-5 sm:px-8 lg:px-12">
      <div className="mx-auto -mt-10 max-w-4xl rounded-2xl border border-[#D3E2ED] bg-white p-4 shadow-xl sm:-mt-14 sm:p-6">
        <div role="tablist" aria-label="Pilih kategori layanan" className="flex flex-wrap gap-2 border-b border-[#E6EEFF] pb-4">
          {quickSearchCategories.map((category, index) => {
            const isSelected = activeQuickCategory === category;

            return (
              <button
                key={category}
                ref={(element) => { tabRefs.current[index] = element; }}
                id={`quick-search-tab-${index}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls="quick-search-panel"
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveQuickCategory(category)}
                onKeyDown={handleTabKeyDown}
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100] ${
                  isSelected ? "bg-[#FF6B00] text-[#121C2A]" : "bg-[#F8F9FF] text-[#5A4136] hover:bg-[#FFF0E5]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
        <div id="quick-search-panel" role="tabpanel" aria-labelledby={`quick-search-tab-${quickSearchCategories.indexOf(activeQuickCategory)}`} className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#5A4136]">Lihat layanan {activeQuickCategory} yang tersedia sekarang.</p>
          <Link href="#layanan" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#FF6B00] px-6 text-sm font-semibold text-[#121C2A] transition hover:bg-[#E85F00] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]">
            Cari Layanan
          </Link>
        </div>
      </div>
    </div>
  );
}
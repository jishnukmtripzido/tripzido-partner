"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Pagination } from "@/components/ui/Pagination";
import { BlockListItem } from "@/components/features/fleet/block/BlockListItem";
import { useSidebar } from "@/context/SidebarContext";
import { MOCK_BLOCKS } from "@/lib/mockData";

export default function BlockBikesPage() {
  const { openSidebar } = useSidebar();
  const [blocks, setBlocks] = useState(MOCK_BLOCKS);

  function updateQuantity(id: string, delta: number) {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, quantity: Math.max(0, b.quantity + delta) } : b)),
    );
  }

  return (
    <>
      <Header
        title="Block Bikes"
        onMenuClick={openSidebar}
        rightSlot={
          <button className="flex items-center gap-1 bg-brand-yellow text-brand-secondary px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-brand-yellow-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            ADD BLOCK
          </button>
        }
      />

      <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
        <div className="space-y-4">
          {blocks.map((block, i) => (
            <BlockListItem
              key={block.id}
              entry={block}
              highlighted={i === 0}
              onIncrement={() => updateQuantity(block.id, 1)}
              onDecrement={() => updateQuantity(block.id, -1)}
            />
          ))}
        </div>

        <Pagination rangeLabel={`1-${blocks.length} of ${blocks.length}`} />
        <div className="h-6" />
      </main>
    </>
  );
}

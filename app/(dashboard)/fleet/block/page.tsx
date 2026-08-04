"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { BlockListItem } from "@/components/features/fleet/block/BlockListItem";
import { AddBlockModal } from "@/components/features/fleet/block/AddBlockModal";
import {
  getVendorBlocksApi,
  updateBlockApi,
  deleteBlockApi,
} from "@/services/block.service";
import type {
  VendorBlockedPeriod,
  BlockUpdatePayload,
} from "@/types/block.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

export default function BlockBikesPage() {
  const { openSidebar } = useSidebar();
  const { token } = useAuth();

  const [blocks, setBlocks] = useState<VendorBlockedPeriod[]>([]);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const nextPageRef = useRef(1);
  const loadedPagesRef = useRef<Set<number>>(new Set());

  const loadNextPage = useCallback(async () => {
    if (!token || isLoading || !hasNext) return;
    const page = nextPageRef.current;
    if (loadedPagesRef.current.has(page)) return;
    loadedPagesRef.current.add(page);

    setIsLoading(true);
    setError(null);
    try {
      const res = await getVendorBlocksApi(page, token);
      if (!res.success || !res.data) {
        setError(res.message || "Failed to load blocks");
        setHasNext(false);
        loadedPagesRef.current.delete(page);
        return;
      }
      setBlocks((prev) => [...prev, ...res.data!.results]);
      setHasNext(res.data.pagination.next !== null);
      nextPageRef.current = page + 1;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blocks");
      setHasNext(false);
      loadedPagesRef.current.delete(page);
    } finally {
      setIsLoading(false);
    }
  }, [token, isLoading, hasNext]);

  useEffect(() => {
    if (token) loadNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadNextPage();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadNextPage]);

  function handleRetry() {
    setError(null);
    setHasNext(true);
    loadNextPage();
  }

  async function handleSaveBlock(blockId: number, patch: BlockUpdatePayload) {
    if (!token) return { success: false, message: "Not signed in" };
    try {
      const res = await updateBlockApi(blockId, patch, token);
      if (!res.success || !res.data) {
        return { success: false, message: res.message };
      }
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? res.data! : b)));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to update block",
      };
    }
  }

  async function handleDeleteBlock(blockId: number) {
    if (!token) return { success: false, message: "Not signed in" };
    try {
      const res = await deleteBlockApi(blockId, token);
      if (!res.success) {
        return { success: false, message: res.message };
      }
      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to delete block",
      };
    }
  }

  function handleBlockCreated(block: VendorBlockedPeriod) {
    setBlocks((prev) => [block, ...prev]);
    setShowAddModal(false);
  }

  const isInitialLoad = isLoading && blocks.length === 0 && !error;

  return (
    <div className="bg-[#F4F2EE] min-h-screen flex flex-col">
      <Header
        title="Block Bikes"
        onMenuClick={openSidebar}
        rightSlot={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-[#FFD166] text-[#242A38] px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[#ffc63b] transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            ADD BLOCK
          </button>
        }
      />

      {isInitialLoad ? (
        <PageLoader />
      ) : (
        <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-5 pb-6">
          <div className="space-y-4">
            {blocks.map((block) => (
              <BlockListItem
                key={block.id}
                block={block}
                onSave={handleSaveBlock}
                onDelete={handleDeleteBlock}
              />
            ))}
          </div>

          {blocks.length === 0 && !isLoading && !error && (
            <p className="text-sm text-gray-400 font-medium text-center mt-10">
              No blocks yet.
            </p>
          )}

          {error && (
            <div className="text-center mt-6">
              <p className="text-sm text-red-500 font-medium">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-2 text-sm font-bold text-[#D4A33B] hover:text-[#242A38] transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          {isLoading && !error && <InlineLoader />}
          {!hasNext && !error && blocks.length > 0 && (
            <p className="text-xs text-gray-400 font-semibold text-center mt-6">
              {blocks.length} block(s)
            </p>
          )}

          <div ref={sentinelRef} className="h-1" />
          <div className="h-6" />
        </main>
      )}

      {showAddModal && (
        <AddBlockModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleBlockCreated}
        />
      )}
    </div>
  );
}

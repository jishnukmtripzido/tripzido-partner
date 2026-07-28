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

export default function BlockBikesPage() {
  const { openSidebar } = useSidebar();
  const { token } = useAuth();

  const [blocks, setBlocks] = useState<VendorBlockedPeriod[]>([]);

  console.log("blocks state:", blocks); // Debugging line to check the state of blocks
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

  return (
    <>
      <Header
        title="Block Bikes"
        onMenuClick={openSidebar}
        rightSlot={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 bg-brand-yellow text-brand-secondary px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm hover:bg-brand-yellow-lg transition-colors"
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
          <p className="text-sm text-font-dim text-center mt-10">
            No blocks yet.
          </p>
        )}

        {error && (
          <div className="text-center mt-4">
            <p className="text-sm text-red-500 font-medium">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-2 text-sm font-semibold text-brand-yellow-lg"
            >
              Retry
            </button>
          </div>
        )}
        {isLoading && !error && (
          <p className="text-sm text-font-dim text-center mt-4">Loading...</p>
        )}
        {!hasNext && !error && blocks.length > 0 && (
          <p className="text-xs text-font-dim text-center mt-4">
            {blocks.length} block(s)
          </p>
        )}

        <div ref={sentinelRef} className="h-1" />
        <div className="h-6" />
      </main>

      {showAddModal && (
        <AddBlockModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleBlockCreated}
        />
      )}
    </>
  );
}

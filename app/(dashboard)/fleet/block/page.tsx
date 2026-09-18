"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
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
import { queryKeys } from "@/lib/queryKeys";
import type {
  VendorBlockedPeriod,
  BlockUpdatePayload,
  VendorBlockedPeriodsResponse,
} from "@/types/block.types";
import { PageLoader } from "@/components/ui/PageLoader";
import { InlineLoader } from "@/components/ui/InLineLoader";

type BlocksPage = NonNullable<VendorBlockedPeriodsResponse["data"]>;

export default function BlockBikesPage() {
  const { openSidebar } = useSidebar();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const queryKey = queryKeys.fleet.blocks(token);

  const {
    data,
    error,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam }) => {
      const res = await getVendorBlocksApi(pageParam, token as string);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load blocks");
      }
      return res.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.next ? lastPage.pagination.page + 1 : undefined,
    enabled: !!token,
  });

  const blocks = data?.pages.flatMap((page) => page.results) ?? [];
  const hasNext = hasNextPage ?? false;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage]);

  async function handleSaveBlock(blockId: number, patch: BlockUpdatePayload) {
    if (!token) return { success: false, message: "Not signed in" };
    try {
      const res = await updateBlockApi(blockId, patch, token);
      if (!res.success || !res.data) {
        return { success: false, message: res.message };
      }
      const updated = res.data;
      queryClient.setQueryData(
        queryKey,
        (prev: { pages: BlocksPage[]; pageParams: unknown[] } | undefined) =>
          prev && {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              results: page.results.map((b) =>
                b.id === blockId ? updated : b,
              ),
            })),
          },
      );
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
      queryClient.setQueryData(
        queryKey,
        (prev: { pages: BlocksPage[]; pageParams: unknown[] } | undefined) =>
          prev && {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              results: page.results.filter((b) => b.id !== blockId),
            })),
          },
      );
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : "Failed to delete block",
      };
    }
  }

  function handleBlockCreated(block: VendorBlockedPeriod) {
    queryClient.setQueryData(
      queryKey,
      (prev: { pages: BlocksPage[]; pageParams: unknown[] } | undefined) => {
        if (!prev || prev.pages.length === 0) {
          const page: BlocksPage = {
            pagination: {
              total: 1,
              page: 1,
              page_size: 1,
              total_pages: 1,
              next: null,
              previous: null,
            },
            results: [block],
          };
          return { pages: [page], pageParams: [1] };
        }
        const [firstPage, ...rest] = prev.pages;
        return {
          ...prev,
          pages: [
            { ...firstPage, results: [block, ...firstPage.results] },
            ...rest,
          ],
        };
      },
    );
    setShowAddModal(false);
  }

  const isInitialLoad = isLoading && blocks.length === 0 && !error;

  return (
    <div className="bg-brand-bg h-full flex flex-col">
      <Header
        title="Block Bikes"
        onMenuClick={openSidebar}
        rightSlot={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-brand-yellow text-brand-secondary px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-brand-yellow-lg transition-colors"
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
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:items-start lg:content-start">
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
              <p className="text-sm text-red-500 font-medium">
                {error instanceof Error ? error.message : "Failed to load blocks"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-2 text-sm font-bold text-brand-yellow-lg hover:text-brand-secondary transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          {(isLoading || isFetchingNextPage) && !error && <InlineLoader />}
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

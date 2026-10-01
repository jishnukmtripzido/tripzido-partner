"use client";

import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import {
  BlockListItem,
  getBlockPhase,
  type BlockPhase,
} from "@/components/features/fleet/block/BlockListItem";
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

const PHASE_SECTIONS: { phase: BlockPhase; title: string }[] = [
  { phase: "active", title: "Active now" },
  { phase: "upcoming", title: "Upcoming" },
  { phase: "ended", title: "Ended" },
];

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

  // Grouped like the sidebar's sections, so what's blocked right now
  // is always at the top.
  const now = new Date();
  const grouped = PHASE_SECTIONS.map((section) => ({
    ...section,
    blocks: blocks.filter((b) => getBlockPhase(b, now) === section.phase),
  })).filter((section) => section.blocks.length > 0);

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
            className="flex items-center gap-1.5 bg-brand-secondary text-brand-yellow pl-3 pr-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:opacity-90 active:opacity-80 transition-opacity"
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
            Add block
          </button>
        }
      />

      {isInitialLoad ? (
        <PageLoader />
      ) : (
        <main className="flex-1 overflow-y-auto hide-scrollbar px-5 pt-4 pb-6 lg:px-8 lg:pt-6">
          <div className="space-y-5">
            {grouped.map((section) => (
              <section key={section.phase}>
                <h2 className="px-1 mb-2 text-[11px] font-bold uppercase tracking-wider text-font-dim/70">
                  {section.title} · {section.blocks.length}
                </h2>
                <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 2xl:grid-cols-3 lg:gap-4 lg:items-start lg:content-start">
                  {section.blocks.map((block) => (
                    <BlockListItem
                      key={block.id}
                      block={block}
                      onSave={handleSaveBlock}
                      onDelete={handleDeleteBlock}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {blocks.length === 0 && !isLoading && !error && (
            <div className="bg-white rounded-2xl shadow-sm px-6 py-10 flex flex-col items-center text-center">
              <span className="h-12 w-12 rounded-xl bg-gray-100 text-font-dim flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </span>
              <p className="text-sm font-semibold text-font-main-sub">
                No blocked bikes
              </p>
              <p className="text-xs text-font-dim mt-1">
                Block bikes for maintenance, personal use or holidays so
                customers can&apos;t book them.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 px-4 py-2.5 rounded-xl bg-brand-yellow-lg text-brand-secondary text-sm font-semibold hover:bg-brand-yellow active:bg-brand-yellow transition-colors"
              >
                Block a bike
              </button>
            </div>
          )}

          {error && (
            <div className="bg-white rounded-2xl shadow-sm p-4 mt-2 text-center">
              <p className="text-sm text-red-500 font-medium">
                {error instanceof Error ? error.message : "Failed to load blocks"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-3 px-4 py-2 rounded-xl bg-brand-secondary text-brand-yellow text-sm font-semibold hover:opacity-90 active:opacity-80 transition-opacity"
              >
                Retry
              </button>
            </div>
          )}
          {(isLoading || isFetchingNextPage) && !error && <InlineLoader />}
          {!hasNext && !error && blocks.length > 0 && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-font-dim/70 text-center mt-6">
              {blocks.length} block{blocks.length === 1 ? "" : "s"} in total
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

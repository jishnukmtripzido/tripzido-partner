// Shared by the Header's menu / back buttons and the NotificationBell,
// so the header's corner controls read as one matching set. Lives in
// its own module because Header imports NotificationBell.
export const HEADER_ICON_BUTTON =
  "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-font-main-sub hover:bg-gray-200 active:bg-gray-200 transition-colors";

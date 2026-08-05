"use client";

/**
 * Full-screen message shown when the partner app is opened on a
 * screen wider than our mobile breakpoint. Swap the QR code / store
 * links once you have real app store URLs.
 */
export function DesktopBlocker() {
  return (
    <div className="min-h-screen w-full bg-brand-secondary flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-yellow-lg">
          <svg
            className="h-9 w-9 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        <h1 className=" font-extrabold text-2xl text-white mb-2">
          tripzido{" "}
          <span className="font-semibold text-gray-400 text-sm align-middle">
            partner
          </span>
        </h1>

        <p className="text-gray-400 font-medium text-sm mb-8">
          The Partner dashboard is built for mobile. Please open this link on
          your phone, or download the app to manage your fleet on the go.
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
          <p className="text-xs text-gray-400 font-medium mb-3">
            Scan to open on your phone
          </p>
          <div className="mx-auto h-32 w-32 rounded-xl bg-white flex items-center justify-center">
            <span className="text-[10px] text-gray-400 font-medium">
              QR code goes here
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 bg-brand-yellow text-brand-secondary font-bold rounded-xl py-3 text-sm hover:bg-brand-yellow-lg transition-colors">
            Get it on Play Store
          </button>
          <button className="flex-1 bg-white/10 text-white font-bold rounded-xl py-3 text-sm hover:bg-white/20 transition-colors">
            Get it on App Store
          </button>
        </div>
      </div>
    </div>
  );
}

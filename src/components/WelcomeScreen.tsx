import { assetPath } from "@/lib/asset";

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl">
      <div className="flex flex-col items-center gap-3 bg-[#141b4d] px-8 py-14 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath("/chula-brand-logo.png")}
          alt="Chula Brand"
          className="mb-2 h-32 w-auto"
        />
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Welcome to Chula Brand
        </h1>
        <p className="text-[#8b93c9]">Please fill out and submit this form.</p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="flex w-full items-center justify-center gap-2 bg-[#ff2d78] px-6 py-5 text-lg font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#e6266c]"
      >
        Start
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}

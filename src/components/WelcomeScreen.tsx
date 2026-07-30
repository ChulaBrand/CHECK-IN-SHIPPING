import { assetPath } from "@/lib/asset";
import { ui, type Locale } from "@/lib/i18n";

export function WelcomeScreen({
  locale,
  onStart,
}: {
  locale: Locale;
  onStart: () => void;
}) {
  // Alto total fijo en 400px (pedido exacto) -- se reparte entre la sección
  // azul (flex-1, crece/encoge para llenar lo que sobra) y el botón de
  // abajo, que se queda con su alto natural.
  return (
    <div
      className="mx-auto flex w-full max-w-[800px] flex-col overflow-hidden rounded-2xl shadow-2xl"
      style={{ height: "400px" }}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-2 overflow-hidden bg-[#141b4d] px-8 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath("/chula-brand-logo.png")}
          alt="Chula Brand"
          className="h-24 w-auto"
        />
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          {ui.welcomeTitle[locale]}
        </h1>
        <p className="text-[#8b93c9]">{ui.welcomeSubtitle[locale]}</p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="flex w-full items-center justify-center gap-2 bg-[#ff2d78] px-6 py-6 text-lg font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#e6266c]"
      >
        {ui.start[locale]}
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}

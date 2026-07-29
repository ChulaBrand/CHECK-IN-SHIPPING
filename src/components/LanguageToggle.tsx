"use client";

import { LANGUAGES, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({
  locale,
  onChange,
}: {
  locale: Locale;
  onChange: (locale: Locale) => void;
}) {
  return (
    <div className="fixed right-4 top-4 z-50 flex gap-1 rounded-full bg-white/90 p-1 shadow-lg backdrop-blur">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => onChange(lang.code)}
          aria-label={lang.label}
          aria-pressed={locale === lang.code}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-lg transition-all",
            locale === lang.code
              ? "ring-2 ring-[#ff2d78]"
              : "opacity-50 hover:opacity-100"
          )}
        >
          <span aria-hidden>{lang.flag}</span>
        </button>
      ))}
    </div>
  );
}

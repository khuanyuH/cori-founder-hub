import Image from "next/image";

// App footer with the CORI mark and a short tagline.
export default function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200/70">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-stone-500 sm:flex-row">
        <div className="flex items-center gap-2">
          <Image
            src="/cori-logo.png"
            alt="CORI"
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
          />
          <span className="font-semibold text-stone-700">CORI Network</span>
        </div>
        <p className="text-center sm:text-right">
          Built for the founders of the Center on Rural Innovation 🌱 ·
          Members only
        </p>
      </div>
    </footer>
  );
}

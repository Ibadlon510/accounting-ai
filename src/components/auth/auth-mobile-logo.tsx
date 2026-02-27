export function AuthMobileLogo({ center = false }: { center?: boolean }) {
  return (
    <div className={`mb-8 flex items-center gap-2 lg:hidden${center ? " justify-center" : ""}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-5 w-5 text-white"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-[17px] font-bold text-text-primary">Agar</span>
        <span className="text-[12px] font-medium text-text-secondary">Smart Accounting</span>
      </div>
    </div>
  );
}

type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
  className?: string;
};

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-14 w-14",
} as const;

export default function BrandMark({
  size = "md",
  inverted = false,
  className = "",
}: BrandMarkProps) {
  const wrapperTone = inverted
    ? "bg-white text-black shadow-[0_14px_32px_rgba(255,255,255,0.08)]"
    : "bg-black text-white shadow-[0_18px_40px_rgba(0,0,0,0.16)]";
  const folderColor = inverted ? "#0b0b0b" : "#ffffff";
  const accentColor = "#d7b56d";

  return (
    <div
      className={`flex items-center justify-center rounded-[1.15rem] ${sizeClasses[size]} ${wrapperTone} ${className}`.trim()}
    >
      <svg
        viewBox="0 0 64 64"
        className="h-[70%] w-[70%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M10 20.5C10 16.9101 12.9101 14 16.5 14H24.5L29.2 18H47.5C51.0899 18 54 20.9101 54 24.5V25H10V20.5Z"
          fill={folderColor}
          fillOpacity="0.92"
        />
        <path
          d="M10 26H54V42.5C54 46.0899 51.0899 49 47.5 49H16.5C12.9101 49 10 46.0899 10 42.5V26Z"
          fill={folderColor}
        />
        <path d="M38 36H46" stroke={accentColor} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M34 40.5H46" stroke={accentColor} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M38 45H46" stroke={accentColor} strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

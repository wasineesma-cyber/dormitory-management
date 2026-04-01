import { Home } from "lucide-react";

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
    ? "bg-white text-slate-900 shadow-[0_8px_30px_rgba(255,255,255,0.12)]"
    : "bg-slate-900 text-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]";
  
  const iconColor = inverted ? "#0f172a" : "#ffffff";
  const accentColor = "#3b82f6"; // sleek modern blue accent

  return (
    <div
      className={`flex items-center justify-center rounded-2xl ${sizeClasses[size]} ${wrapperTone} ${className}`.trim()}
      style={{
        background: inverted ? "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)" : "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[60%] w-[60%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M3 10L12 3L21 10M19 9V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V9"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 21V12H15V21"
          stroke={accentColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

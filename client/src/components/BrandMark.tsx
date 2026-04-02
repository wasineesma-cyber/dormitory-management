import { Folder } from "lucide-react";

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
    ? "bg-white text-black shadow-sm"
    : "bg-black text-white shadow-sm";

  const iconColor = inverted ? "#000000" : "#ffffff";

  return (
    <div
      className={`flex items-center justify-center rounded-[25%] ${sizeClasses[size]} ${wrapperTone} ${className}`.trim()}
      style={{
        background: inverted ? "#ffffff" : "#000000",
      }}
    >
      <Folder
        className="h-[55%] w-[55%]"
        color={iconColor}
        fill={iconColor}
        strokeWidth={1}
      />
    </div>
  );
}

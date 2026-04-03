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
  className = "",
}: BrandMarkProps) {
  return (
    <img
      src="/icon-512x512.png"
      alt="หอพักโปร Logo"
      className={`rounded-[25%] object-cover ${sizeClasses[size]} ${className}`.trim()}
    />
  );
}

import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: "white" | "transparent" | "gradient";
}

export function Section({ 
  children, 
  className,
  id,
  background = "transparent"
}: SectionProps) {
  const backgrounds = {
    white: "bg-white",
    transparent: "",
    gradient: "bg-gradient-to-r from-purple-600 to-pink-600"
  };

  return (
    <section 
      id={id}
      className={cn(
        "py-12 px-4",
        backgrounds[background],
        className
      )}
    >
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </section>
  );
} 
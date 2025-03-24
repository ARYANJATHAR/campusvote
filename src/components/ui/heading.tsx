import { cn } from "@/lib/utils";
import { GradientText } from "@/components/landing/GradientText";

interface HeadingProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function Heading({ 
  children, 
  className,
  gradient = false,
  level = 2
}: HeadingProps) {
  const sizes = {
    1: "text-4xl md:text-5xl",
    2: "text-3xl",
    3: "text-2xl",
    4: "text-xl",
    5: "text-lg",
    6: "text-base"
  };

  const baseStyles = "font-bold leading-tight mb-4";
  
  const content = gradient ? (
    <GradientText>{children}</GradientText>
  ) : children;

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <Tag className={cn(baseStyles, sizes[level], className)}>
      {content}
    </Tag>
  );
} 
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  children: React.ReactNode;
  className?: string;
}

export function GradientButton({ 
  variant = "default", 
  children, 
  className,
  ...props 
}: GradientButtonProps) {
  const baseStyles = "text-base px-6 py-4 !rounded-button";
  
  const variants = {
    default: "bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white",
    outline: "border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
  };

  return (
    <Button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </Button>
  );
} 
import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionButtonProps extends Omit<ButtonProps, "onClick"> {
  action: () => Promise<void | boolean>;
  successMessage?: string;
  errorMessage?: string;
  iconOnly?: boolean;
}

export function ActionButton({ 
  action, 
  children, 
  successMessage = "Success", 
  errorMessage = "Failed", 
  iconOnly = false,
  className,
  ...props 
}: ActionButtonProps) {
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    
    setStatus("loading");
    try {
      const result = await action();
      if (result === false) {
        setStatus("idle");
        return;
      }
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    } finally {
      setTimeout(() => {
        setStatus((prev) => prev !== "idle" ? "idle" : prev);
      }, 2000);
    }
  };

  return (
    <Button 
      onClick={handleClick} 
      disabled={status === "loading" || props.disabled}
      className={cn(
        "transition-all duration-300",
        className,
        status === "success" && "!bg-green-600 !text-white !border-green-600 hover:!bg-green-700",
        status === "error" && "!bg-destructive !text-destructive-foreground hover:!bg-destructive"
      )}
      {...props}
    >
      {status === "idle" && children}
      
      {status === "loading" && (
        <>
          <Loader2 className={cn("h-4 w-4 animate-spin", !iconOnly && "mr-2")} />
          {!iconOnly && <span>Loading...</span>}
        </>
      )}
      
      {status === "success" && (
        <>
          <Check className={cn("h-4 w-4", !iconOnly && "mr-2")} />
          {!iconOnly && <span>{successMessage}</span>}
        </>
      )}
      
      {status === "error" && (
        <>
          <X className={cn("h-4 w-4", !iconOnly && "mr-2")} />
          {!iconOnly && <span>{errorMessage}</span>}
        </>
      )}
    </Button>
  );
}

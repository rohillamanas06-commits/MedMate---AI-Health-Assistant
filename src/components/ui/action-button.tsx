import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActionButtonProps extends ButtonProps {
  action?: () => Promise<void | boolean>;
  status?: "idle" | "loading" | "success" | "error";
  successMessage?: string;
  errorMessage?: string;
  iconOnly?: boolean;
}

export function ActionButton({ 
  action, 
  status: controlledStatus,
  children, 
  successMessage = "Success", 
  errorMessage = "Failed", 
  iconOnly = false,
  className,
  onClick,
  ...props 
}: ActionButtonProps) {
  const [internalStatus, setInternalStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const isControlled = controlledStatus !== undefined;
  const currentStatus = isControlled ? controlledStatus : internalStatus;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    }
    
    if (!action) return;
    
    e.preventDefault();
    if (currentStatus === "loading") return;
    
    setInternalStatus("loading");
    try {
      const result = await action();
      if (result === false) {
        setInternalStatus("idle");
        return;
      }
      setInternalStatus("success");
    } catch (error) {
      console.error(error);
      setInternalStatus("error");
    } finally {
      setTimeout(() => {
        setInternalStatus((prev) => prev !== "idle" ? "idle" : prev);
      }, 2000);
    }
  };

  return (
    <Button 
      onClick={action || onClick ? handleClick : undefined} 
      disabled={currentStatus === "loading" || props.disabled}
      className={cn(
        "transition-all duration-300",
        className,
        currentStatus === "success" && "!bg-green-600 !text-white !border-green-600 hover:!bg-green-700",
        currentStatus === "error" && "!bg-destructive !text-destructive-foreground hover:!bg-destructive"
      )}
      {...props}
    >
      {currentStatus === "idle" && children}
      
      {currentStatus === "loading" && (
        <>
          <Loader2 className={cn("h-4 w-4 animate-spin", !iconOnly && "mr-2")} />
          {!iconOnly && <span>{typeof children === 'string' ? 'Loading...' : children}</span>}
        </>
      )}
      
      {currentStatus === "success" && (
        <>
          <Check className={cn("h-4 w-4", !iconOnly && "mr-2")} />
          {!iconOnly && <span>{successMessage}</span>}
        </>
      )}
      
      {currentStatus === "error" && (
        <>
          <X className={cn("h-4 w-4", !iconOnly && "mr-2")} />
          {!iconOnly && <span>{errorMessage}</span>}
        </>
      )}
    </Button>
  );
}

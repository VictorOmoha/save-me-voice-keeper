import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OnboardingStepProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function OnboardingStep({
  icon,
  title,
  description,
  children,
  className,
}: OnboardingStepProps) {
  return (
    <Card className={cn("w-full max-w-2xl mx-auto border-0 shadow-none bg-transparent", className)}>
      <CardContent className="pt-6 flex flex-col items-center text-center space-y-6">
        {icon && (
          <div className="text-6xl mb-2">
            {icon}
          </div>
        )}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-muted-foreground text-lg max-w-md">
              {description}
            </p>
          )}
        </div>
        <div className="w-full pt-4">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

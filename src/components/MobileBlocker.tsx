export function MobileBlocker({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Show main content only on desktop (lg and above) */}
      <div className="hidden lg:block">
        {children}
      </div>

      {/* Show mobile message only on mobile screens */}
      <div className="lg:hidden min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-3xl font-bold theme-title">
            MedMate
          </h1>
          <p className="text-lg text-muted-foreground">
            Please use MedMate on a desktop for the best experience
          </p>
        </div>
      </div>
    </>
  );
}

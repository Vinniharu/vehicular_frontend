import Link from 'next/link';
import { Compass, Home, Clock } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full bg-paper-card border border-paper-border rounded-3xl p-8 md:p-12 shadow-sm text-center">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 bg-brand/10 rounded-full flex items-center justify-center text-brand">
            <Compass className="h-10 w-10 stroke-[1.5]" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-display font-bold text-ink mb-4 tracking-tight">
          404 - Not Found
        </h1>
        
        <p className="text-lg text-ink-secondary mb-8">
          The page you are looking for might have been removed, had its name changed, or doesn't exist yet.
        </p>

        <div className="bg-paper border border-paper-border rounded-2xl p-6 mb-8 flex items-start text-left gap-4 shadow-sm">
          <Clock className="h-6 w-6 text-brand shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-ink mb-1">Coming Soon!</h3>
            <p className="text-ink-secondary text-sm">
              If you followed a link here, we are actively working on this feature. Stay tuned, exciting updates are on the way!
            </p>
          </div>
        </div>

        <Link 
          href="/" 
          className="inline-flex items-center justify-center gap-2 bg-ink hover:bg-ink-secondary text-paper px-8 py-4 rounded-full font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
        >
          <Home className="h-5 w-5" />
          <span>Return to Homepage</span>
        </Link>
      </div>
      
      <div className="mt-12 text-ink-muted text-sm font-medium">
        &copy; {new Date().getFullYear()} Vehicular. All rights reserved.
      </div>
    </div>
  );
}

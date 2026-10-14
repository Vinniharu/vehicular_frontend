"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

// Mobile-only sticky bottom CTA — a distinct mobile pattern, not just a
// squished desktop layout. Appears once the hero has scrolled past (its own
// inline CTA is out of view by then, so this never duplicates it on first
// paint). z-40, one layer below the header/mobile-drawer's z-50 — when the
// drawer opens, its overlay fully covers this bar rather than fighting it,
// so no extra open-state coordination is needed.
export default function StickyMobileCta({ isLoggedIn, dashboardHref, dashboardLabel, redirectTo }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.85);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="md:hidden fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-6 bg-gradient-to-t from-white via-white/90 to-transparent"
        >
          <Link
            href={isLoggedIn ? dashboardHref : `/auth/signup?redirect=${encodeURIComponent(redirectTo)}`}
            className="mk-shine mk-focus flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-cx-brand text-[15px] font-semibold text-white shadow-mk-brand active:scale-[0.98] transition-transform"
          >
            {isLoggedIn ? dashboardLabel : "Start application"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

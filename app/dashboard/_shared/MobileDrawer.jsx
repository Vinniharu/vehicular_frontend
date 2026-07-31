"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";

// Radix Dialog used as a slide-in sheet — gives scroll-lock, Escape-to-close,
// and focus trap for free, none of which the hand-rolled mobile nav drawer
// it replaces had. framer-motion drives the slide transition.
export default function MobileDrawer({ open, onOpenChange, title, side = "left", children, panelClassName = "" }) {
  const offscreenX = side === "left" ? "-100%" : "100%";
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount onOpenAutoFocus={(e) => e.preventDefault()}>
              <motion.div
                className={`fixed z-50 ${panelClassName}`}
                initial={{ x: offscreenX }}
                animate={{ x: 0 }}
                exit={{ x: offscreenX }}
                transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              >
                <Dialog.Title className="sr-only">{title || "Menu"}</Dialog.Title>
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

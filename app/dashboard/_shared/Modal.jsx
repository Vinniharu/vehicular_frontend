"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";

// Shared modal wrapper — Radix Dialog gives scroll-lock, Escape-to-close,
// and focus trap for free; framer-motion adds the fade/scale entrance that
// the old hand-rolled `animate-in fade-in zoom-in-95` classes never actually
// did anything (tailwindcss-animate isn't installed in this project).
// Replaces the raw `fixed inset-0 bg-black/60` modals previously duplicated
// in apply/page.jsx and wallet/page.jsx.
export default function Modal({ open, onOpenChange, title, children, contentClassName = "" }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${contentClassName}`}>
              <Dialog.Content asChild forceMount onOpenAutoFocus={(e) => e.preventDefault()}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <Dialog.Title className="sr-only">{title || "Dialog"}</Dialog.Title>
                  {children}
                </motion.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

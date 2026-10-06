"use client";

import * as Dialog from "@radix-ui/react-dialog";

/**
 * Wraps an existing full-screen drawer (backdrop + side panel markup) in a
 * Radix dialog, so it gets Escape-to-close, a focus trap and page scroll
 * lock without rewriting the form inside it. Render it only while open.
 */
export default function DrawerShell({ title, onClose, children }) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose?.()}>
      <Dialog.Portal>
        <Dialog.Content className="fixed inset-0 z-[70] outline-none" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

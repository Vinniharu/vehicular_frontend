"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deleteApplicationDraft, getApplicationDraft, saveApplicationDraft } from "@/lib/api";

/**
 * Backend-persisted autosave for one in-progress application wizard, keyed
 * by wizardKey (see lib/draft-registry.js for the full list — matches the
 * backend's ApplicationDraft.wizard_key). Generic and wizard-shape-agnostic:
 * `save()` takes/returns a plain JS object of "whatever the wizard's
 * current form state is" and never inspects its field names.
 *
 * Two races are guarded against, both learned from a real bug on the admin
 * revenue page this session (a slower, stale response overwriting a newer
 * one's on-screen state):
 * - Hydration race: a debounced save could fire and PUT empty form state
 *   over a REAL existing draft before the initial GET-on-mount resolves.
 *   Guarded by hydratedRef — save() is a no-op until the initial load
 *   completes.
 * - Submit race: once final submit has started, no further autosave should
 *   fire and clobber the draft after clearDraft() has already run (or run
 *   a stale PUT after the row is gone). Guarded by submittingRef, set by
 *   markSubmitting() at the top of the wizard's own submit handler.
 * A monotonic sequence guard also drops any out-of-order save response.
 */
export function useApplicationDraft(wizardKey, { debounceMs = 2000 } = {}) {
  const [draftFormData, setDraftFormData] = useState(null);
  const [draftStepLabel, setDraftStepLabel] = useState(null);
  const [draftUpdatedAt, setDraftUpdatedAt] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const hydratedRef = useRef(false);
  const submittingRef = useRef(false);
  const seqRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    hydratedRef.current = false;
    setHydrated(false);

    getApplicationDraft(wizardKey).then((res) => {
      if (cancelled) return;
      if (res.data) {
        setDraftFormData(res.data.form_data ?? null);
        setDraftStepLabel(res.data.step_label ?? null);
        setDraftUpdatedAt(res.data.updated_at ?? null);
      } else {
        setDraftFormData(null);
      }
      hydratedRef.current = true;
      setHydrated(true);
    });

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [wizardKey]);

  const save = useCallback(
    (formStateObj, stepLabel) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!hydratedRef.current || submittingRef.current) return;
        const mySeq = ++seqRef.current;
        saveApplicationDraft(wizardKey, formStateObj, stepLabel).then((res) => {
          if (mySeq !== seqRef.current) return; // a newer save superseded this one
          if (res.data) {
            setDraftUpdatedAt(res.data.updated_at ?? null);
          }
        });
      }, debounceMs);
    },
    [wizardKey, debounceMs]
  );

  const markSubmitting = useCallback(() => {
    submittingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const clearDraft = useCallback(async () => {
    markSubmitting();
    await deleteApplicationDraft(wizardKey);
    setDraftFormData(null);
  }, [wizardKey, markSubmitting]);

  return { draftFormData, draftStepLabel, draftUpdatedAt, hydrated, save, clearDraft, markSubmitting };
}

import { useEffect, useState } from "react";

/** Keep the saved base with each draft so remote edits cannot silently become local edits. */
export function useNoteDraft(
  memberId: string,
  lessonId: string,
  saved: string,
) {
  const key = `guild-note-draft-v1:${memberId}:${lessonId}`;
  const [draft, setDraft] = useState<{ base: string; text: string }>(() => {
    try {
      const draft = JSON.parse(sessionStorage.getItem(key) || "null");
      return draft &&
        typeof draft.base === "string" &&
        typeof draft.text === "string" &&
        draft.text !== draft.base &&
        draft.text !== saved
        ? { base: draft.base as string, text: draft.text as string }
        : { base: saved, text: saved };
    } catch {
      return { base: saved, text: saved };
    }
  });
  useEffect(() => {
    setDraft((current) => {
      if (current.base === saved) return current;
      // A clean editor follows remote changes; an actual draft stays intact.
      if (current.text === current.base || current.text === saved)
        return { base: saved, text: saved };
      return current;
    });
  }, [saved]);
  useEffect(() => {
    try {
      if (draft.text === draft.base || draft.text === saved)
        sessionStorage.removeItem(key);
      else sessionStorage.setItem(key, JSON.stringify(draft));
    } catch {
      /* Manual save remains available if browser storage is restricted/full. */
    }
  }, [key, draft, saved]);
  const setNote = (text: string) =>
    setDraft((current) => ({ ...current, text }));
  const conflict =
    draft.base !== saved && draft.text !== draft.base && draft.text !== saved;
  const loadSaved = () => setDraft({ base: saved, text: saved });
  const acknowledgeSave = (submitted: string) =>
    setDraft((current) => ({ base: submitted, text: current.text }));
  return [draft.text, setNote, conflict, loadSaved, acknowledgeSave] as const;
}

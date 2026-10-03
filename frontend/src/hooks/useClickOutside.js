import { useEffect } from "react";

export function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return;
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(e); };
    document.addEventListener("pointerdown", fn);
    return () => document.removeEventListener("pointerdown", fn);
  }, [ref, handler, active]);
}

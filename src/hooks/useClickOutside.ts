import * as React from "react";

/**
 * Hook that detects clicks outside of a referenced element
 * @param ref - React ref to the element to monitor
 * @param onClickOutside - Callback function when click outside is detected
 * @param enabled - Whether the detection is active (default: true)
 */
export const useClickOutside = (
  ref: React.RefObject<HTMLElement>,
  onClickOutside: () => void,
  enabled: boolean = true
): void => {
  React.useEffect(() => {
    if (!enabled) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Check if click is outside the referenced element
      if (ref.current && !ref.current.contains(target)) {
        onClickOutside();
      }
    };

    // Handle escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClickOutside();
      }
    };

    // Add event listeners
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [ref, onClickOutside, enabled]);
};

export default useClickOutside;

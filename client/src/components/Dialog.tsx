import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type DialogProps = {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  maxWidth?: number;
};

const focusableSelector = "button, a[href], input, select, textarea, [tabindex]";

// Find controls that can receive keyboard focus, skipping disabled or hidden elements.
function getFocusableElements(dialog: HTMLElement) {
  return Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => {
    const style = window.getComputedStyle(element);
    return element.tabIndex >= 0
      && !element.matches(":disabled, [type='hidden']")
      && !element.closest("[hidden], [inert]")
      && style.display !== "none"
      && style.visibility !== "hidden";
  });
}

// A portal keeps the drawer outside the page so the background can be made inert.
export function Dialog({ titleId, onClose, children, className = "", maxWidth }: DialogProps) {
  const [container] = useState(() => document.createElement("div"));
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  useLayoutEffect(() => {
    // Keep Escape wired to the latest callback without resetting focus on each render.
    onCloseRef.current = onClose;
  }, [onClose]);

  // Set up focus and page locking before the browser paints the open dialog.
  // Remember the previous state so closing it can put the page back as it was.
  useLayoutEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.appendChild(container);
    const dialog = dialogRef.current!;
    const background = Array.from(document.body.children)
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== container)
      .map((element) => ({ element, wasInert: element.inert }));

    // Prefer a form field so typing can start immediately; otherwise use the first control.
    const focusFirst = () => {
      const controls = getFocusableElements(dialog);
      const input = controls.find((element) => element.matches("input, select, textarea"));
      (input ?? controls[0] ?? dialog).focus();
    };

    focusFirst();
    // Inert prevents clicks and keyboard access to the page behind the dialog.
    background.forEach(({ element }) => { element.inert = true; });
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
      if (event.key !== "Tab") return;

      // Controls may have changed since the dialog opened, so check on each Tab press.
      const controls = getFocusableElements(dialog);
      const first = controls[0];
      const last = controls[controls.length - 1];
      const active = document.activeElement;
      // Wrap Tab and Shift+Tab at the edges, keeping keyboard navigation inside the dialog.
      if (!first) {
        event.preventDefault();
        dialog.focus();
      } else if (event.shiftKey && (active === first || active === dialog || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || active === dialog || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    // Also catch focus moved outside by other code, not just by the Tab key.
    function handleFocusIn(event: FocusEvent) {
      if (!dialog.contains(event.target as Node)) focusFirst();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      // Remove the focus trap before returning focus to the control that opened the dialog.
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);
      background.forEach(({ element, wasInert }) => { element.inert = wasInert; });
      document.body.style.overflow = previousOverflow;
      container.remove();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [container]);

  return createPortal(
    <div
      className="drawer-backdrop"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <aside
        ref={dialogRef}
        className={`source-drawer ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={maxWidth ? { width: "100%", maxWidth } : undefined}
      >
        {children}
      </aside>
    </div>,
    container
  );
}

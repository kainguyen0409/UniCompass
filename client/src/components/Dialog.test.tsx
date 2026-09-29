import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("Dialog keyboard access", () => {
  let root: Root;
  let page: HTMLElement;
  let opener: HTMLButtonElement;

  beforeEach(() => {
    page = document.createElement("main");
    opener = document.createElement("button");
    opener.textContent = "Open account";
    const host = document.createElement("div");
    page.append(opener, host);
    document.body.append(page);
    root = createRoot(host);
    opener.focus();
  });

  afterEach(() => {
    act(() => root.unmount());
    page.remove();
    document.body.style.overflow = "";
  });

  function renderDialog(onClose = vi.fn()) {
    act(() => root.render(
      <Dialog titleId="account-title" onClose={onClose}>
        <button type="button">Close</button>
        <h2 id="account-title">Account</h2>
        <input aria-label="Email" />
        <button type="button" disabled>Unavailable</button>
        <button type="submit">Save</button>
      </Dialog>
    ));
    return document.querySelector<HTMLElement>("[role='dialog']")!;
  }

  function pressTab(shiftKey = false) {
    const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey, bubbles: true, cancelable: true });
    act(() => document.activeElement!.dispatchEvent(event));
    return event;
  }

  it("names the dialog, focuses its first field and restores the page on close", () => {
    document.body.style.overflow = "auto";
    const dialog = renderDialog();
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)?.textContent).toBe("Account");
    expect(document.activeElement).toBe(dialog.querySelector("input"));
    expect(page.inert).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    act(() => root.render(null));
    expect(document.querySelector("[role='dialog']")).toBeNull();
    expect(page.inert).toBeFalsy();
    expect(document.body.style.overflow).toBe("auto");
    expect(document.activeElement).toBe(opener);
  });

  it("wraps Tab and Shift+Tab around enabled controls", () => {
    const dialog = renderDialog();
    const buttons = dialog.querySelectorAll("button");
    buttons[2].focus();
    expect(pressTab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons[0]);
    expect(pressTab(true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(buttons[2]);
  });

  it("closes with Escape or the backdrop, while clicks inside remain open", () => {
    const onClose = vi.fn();
    const dialog = renderDialog(onClose);
    act(() => dialog.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
    expect(onClose).not.toHaveBeenCalled();

    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => document.querySelector(".drawer-backdrop")!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("preserves focus while content updates and uses the current close handler", () => {
    const oldClose = vi.fn();
    const newClose = vi.fn();
    const dialog = renderDialog(oldClose);
    const saveButton = dialog.querySelector<HTMLButtonElement>("button[type='submit']")!;
    saveButton.focus();
    renderDialog(newClose);
    expect(document.activeElement).toBe(saveButton);

    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(oldClose).not.toHaveBeenCalled();
    expect(newClose).toHaveBeenCalledOnce();
  });

  it("keeps focus inside and supports content without interactive controls", () => {
    act(() => root.render(
      <Dialog titleId="notice-title" onClose={() => {}}>
        <h2 id="notice-title">Notice</h2>
      </Dialog>
    ));
    const dialog = document.querySelector<HTMLElement>("[role='dialog']")!;
    expect(document.activeElement).toBe(dialog);
    expect(pressTab().defaultPrevented).toBe(true);
    opener.focus();
    expect(document.activeElement).toBe(dialog);
  });
});

const DUPLICATE_CUSTOM_ELEMENTS = new Set([
  "mce-autosize-textarea",
]);

declare global {
  interface Window {
    __savemeDuplicateCustomElementGuardInstalled?: boolean;
  }
}

export function installBrowserCompatibilityGuards() {
  if (typeof window === "undefined" || window.__savemeDuplicateCustomElementGuardInstalled) return;
  window.__savemeDuplicateCustomElementGuardInstalled = true;

  // Some browser/AI overlays inject TinyMCE web components more than once and
  // throw before React can recover. SaveMe does not own those elements, so we
  // safely ignore duplicate registrations for known injected overlay elements.
  const registry = window.customElements;
  if (registry?.define) {
    const originalDefine = registry.define.bind(registry);

    registry.define = ((name: string, constructor: CustomElementConstructor, options?: ElementDefinitionOptions) => {
      if (DUPLICATE_CUSTOM_ELEMENTS.has(name) && registry.get(name)) {
        console.warn(`[SaveMe] Ignored duplicate injected custom element: ${name}`);
        return;
      }

      try {
        originalDefine(name, constructor, options);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (DUPLICATE_CUSTOM_ELEMENTS.has(name) && message.includes("already been defined")) {
          console.warn(`[SaveMe] Ignored duplicate injected custom element: ${name}`);
          return;
        }
        throw error;
      }
    }) as CustomElementRegistry["define"];
  }

  window.addEventListener("error", (event) => {
    const message = event?.message || "";
    if (message.includes("mce-autosize-textarea") && message.includes("already been defined")) {
      event.preventDefault();
      event.stopImmediatePropagation();
      console.warn("[SaveMe] Suppressed duplicate custom element error from injected overlay");
    }
  });
}

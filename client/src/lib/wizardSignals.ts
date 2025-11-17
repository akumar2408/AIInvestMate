const WIZARD_EVENT = "investmate:wizard-open";

export function requestWizardOpen() {
  window.dispatchEvent(new Event(WIZARD_EVENT));
}

export function subscribeToWizardOpen(handler: () => void) {
  window.addEventListener(WIZARD_EVENT, handler);
  return () => window.removeEventListener(WIZARD_EVENT, handler);
}

export { WIZARD_EVENT };

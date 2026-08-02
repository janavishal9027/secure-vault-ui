/**
 * Shared bits of landing navigation.
 *
 * The design hardcoded "SecureNotes" in the nav and the footer. This app is
 * Secure Vault, so the name lives here rather than being typed in two places
 * that can disagree — and renaming the product is one edit.
 */
export const BRAND = "Secure Vault";

/** Smooth-scrolls to a section, allowing for the fixed glass header. */
export const scrollToSection = (id) => {
  const target = document.getElementById(id);
  if (!target) return;
  window.scrollTo({
    top: target.getBoundingClientRect().top + window.scrollY - 80,
    // Honours the OS "reduce motion" setting instead of always animating.
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
};

export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
};

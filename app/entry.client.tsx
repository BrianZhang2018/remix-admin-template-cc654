/**
 * AI-VibeCoding Forum - Client Entry Point
 * Handles client-side hydration for the forum application.
 * Built with modern web technologies for optimal user experience.
 */

import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import i18n from './i18n';

// Initialize i18n with the language and resources from server
const lng = (window as any).LNG || 'en';
const resources = (window as any).RESOURCES;

if (resources) {
  // Add resources to i18n instance
  Object.keys(resources).forEach(lang => {
    i18n.addResourceBundle(lang, 'translation', resources[lang].translation, true, true);
  });
}

i18n.changeLanguage(lng);

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});

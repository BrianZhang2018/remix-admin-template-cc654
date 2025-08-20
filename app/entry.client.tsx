/**
 * AI-VibeCoding Forum - Client Entry Point
 * Handles client-side hydration for the forum application.
 * Built with modern web technologies for optimal user experience.
 */

import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nProvider } from './components/I18nProvider';

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <I18nProvider>
        <RemixBrowser />
      </I18nProvider>
    </StrictMode>
  );
});

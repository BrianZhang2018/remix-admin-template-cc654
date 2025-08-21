import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en/common.json';
import zh from './locales/zh/common.json';

const resources = {
  en: {
    translation: en,
  },
  zh: {
    translation: zh,
  },
};

// Create a global i18n instance for server-side rendering
let serverI18n: any = null;

export async function createI18nServer(lng: string = 'en') {
  if (!serverI18n) {
    serverI18n = createInstance();
    
    await serverI18n
      .use(initReactI18next)
      .init({
        lng,
        fallbackLng: 'en',
        resources,
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
      });
  } else {
    // Change language if needed
    await serverI18n.changeLanguage(lng);
  }

  return serverI18n;
}

export function getFixedT(lng: string = 'en') {
  if (!serverI18n) {
    serverI18n = createInstance();
    serverI18n.init({
      lng,
      fallbackLng: 'en',
      resources,
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  }
  
  return serverI18n.getFixedT(lng, 'translation');
}

// Export resources for client-side use
export { resources };

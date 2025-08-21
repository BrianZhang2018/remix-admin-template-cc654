// Category slug to translation key mapping
export const categoryTranslationMap: Record<string, string> = {
  'ai-tools': 'aiTools',
  'code-help': 'codeReview', 
  'showcases': 'projectShowcase',
  'learning': 'learningResources',
  'discussions': 'industryDiscussions',
  'challenges': 'challenges'
};

// Get translation key for a category slug
export function getCategoryTranslationKey(slug: string): string {
  return categoryTranslationMap[slug] || slug;
}

// Get translated category name
export function getTranslatedCategoryName(slug: string, t: (key: string) => string): string {
  const translationKey = getCategoryTranslationKey(slug);
  return t(`categories.${translationKey}`);
}

// Get translated category description
export function getTranslatedCategoryDescription(slug: string, t: (key: string) => string): string {
  const translationKey = getCategoryTranslationKey(slug);
  return t(`categories.descriptions.${translationKey}`);
}


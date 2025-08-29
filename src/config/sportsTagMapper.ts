export const DAUM_SPORTS_CATEGORIES = {
    worldSoccer: '100032',
    golf: '5000',
  } as const;

// 카테고리별 표시 이름 매핑
export const CATEGORY_DISPLAY_NAMES: Record<keyof typeof DAUM_SPORTS_CATEGORIES, string> = {
  worldSoccer: '해외축구',
  golf: '골프',
} as const;
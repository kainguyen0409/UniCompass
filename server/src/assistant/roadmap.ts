import { normalize } from './tools.js';

// A narrow fallback for explicit roadmap questions if the model skips retrieval.
// General admissions questions still use the normal tool-selection loop.
export function asksAboutRoadmap(message: string) {
  const text = normalize(message);
  return /\b(lo trinh|quy trinh|cac buoc|bao nhieu buoc|may buoc|buoc nao|buoc tiep theo|cac moc|moc nao|tien do)\b/.test(text);
}

export function roadmapRoute(message: string): 'all' | 'thpt' | 'hsa' | 'sat' {
  const text = normalize(message);
  const routes = (['thpt', 'hsa', 'sat'] as const).filter(route => new RegExp(`\\b${route}\\b`).test(text));
  // A broad question must count the entire app roadmap, not the current UI filter.
  return routes.length === 1 ? routes[0] : 'all';
}

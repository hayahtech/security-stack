export interface SearchResult {
  id: string;
  type: "customer" | "contact" | "opportunity";
  title: string;
  subtitle: string;
  href: string;
}

export function useGlobalSearch(query: string): { results: SearchResult[]; loading: boolean } {
  return { results: [], loading: false };
}

export interface Category {
  id: string;
  parentId: string | null;
  code: string;
  name: string;
  slug: string;
  path: string;
  depth: number;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface CreateCategoryInput {
  code: string;
  name: string;
  description: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
}
export interface CategoryQuery {
  q?: string;
  page?: number;
  pageSize?: number;
}

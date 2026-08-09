// Endpoint: GET /categories, GET /categories/:id/subcategories
import { apiClient } from './client';

export const categoryApi = {
  getCategories: () => apiClient.get('/categories'),
  getSubcategories: (categoryId: string) =>
    apiClient.get(`/categories/${categoryId}/subcategories`),
};

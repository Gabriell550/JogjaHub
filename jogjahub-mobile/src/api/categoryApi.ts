// Endpoint: GET /categories (sudah include nested subcategories per kategori)
import { apiClient } from './client';

export const categoryApi = {
  getCategories: () => apiClient.get('/categories'),
};
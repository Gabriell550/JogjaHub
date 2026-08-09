// Endpoint: POST /auth/login, POST /auth/register/customer, POST /auth/register/vendor
import { apiClient } from './client';

export const authApi = {
  login: (payload: { email: string; password: string }) =>
    apiClient.post('/auth/login', payload),
  registerCustomer: (payload: unknown) =>
    apiClient.post('/auth/register/customer', payload),
  registerVendor: (payload: unknown) =>
    apiClient.post('/auth/register/vendor', payload),
};

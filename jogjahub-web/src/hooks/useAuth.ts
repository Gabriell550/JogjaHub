export function useAuth() {
  return {
    isAuthenticated: false,
    user: null,
    login: async () => undefined,
    logout: () => undefined,
  };
}

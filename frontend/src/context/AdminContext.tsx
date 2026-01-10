import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { adminApi } from '@/services/api';

interface AdminContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  getPassword: () => string | null;
  // Admin can also access staff functions
  canAccessStaff: boolean;
}

const AdminContext = createContext<AdminContextType | null>(null);

const ADMIN_STORAGE_KEY = 'barvidva_admin_auth';
const STAFF_STORAGE_KEY = 'barvidva_staff_auth';

interface AdminProviderProps {
  children: ReactNode;
}

export function AdminProvider({ children }: AdminProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedPassword = sessionStorage.getItem(ADMIN_STORAGE_KEY);
      if (storedPassword) {
        try {
          const isValid = await adminApi.testAuth(storedPassword);
          setIsAuthenticated(isValid);
          if (!isValid) {
            sessionStorage.removeItem(ADMIN_STORAGE_KEY);
          } else {
            // Admin also gets staff access
            sessionStorage.setItem(STAFF_STORAGE_KEY, storedPassword);
          }
        } catch {
          sessionStorage.removeItem(ADMIN_STORAGE_KEY);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const isValid = await adminApi.testAuth(password);
      if (isValid) {
        sessionStorage.setItem(ADMIN_STORAGE_KEY, password);
        // Admin also gets staff access - set staff password too
        sessionStorage.setItem(STAFF_STORAGE_KEY, password);
        setIsAuthenticated(true);
        setIsLoading(false);
        return true;
      } else {
        setError('รหัสผ่านไม่ถูกต้อง');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    sessionStorage.removeItem(STAFF_STORAGE_KEY);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const getPassword = useCallback((): string | null => {
    return sessionStorage.getItem(ADMIN_STORAGE_KEY);
  }, []);

  return (
    <AdminContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        getPassword,
        canAccessStaff: isAuthenticated,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdminAuth(): AdminContextType {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminProvider');
  }
  return context;
}

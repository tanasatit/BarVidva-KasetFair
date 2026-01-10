import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { staffApi } from '@/services/api';

interface StaffContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  getPassword: () => string | null;
}

const StaffContext = createContext<StaffContextType | null>(null);

const STORAGE_KEY = 'barvidva_staff_auth';

interface StaffProviderProps {
  children: ReactNode;
}

export function StaffProvider({ children }: StaffProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedPassword = sessionStorage.getItem(STORAGE_KEY);
      if (storedPassword) {
        try {
          const isValid = await staffApi.testAuth(storedPassword);
          setIsAuthenticated(isValid);
          if (!isValid) {
            sessionStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          sessionStorage.removeItem(STORAGE_KEY);
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
      const isValid = await staffApi.testAuth(password);
      if (isValid) {
        sessionStorage.setItem(STORAGE_KEY, password);
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
    sessionStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  const getPassword = useCallback((): string | null => {
    return sessionStorage.getItem(STORAGE_KEY);
  }, []);

  return (
    <StaffContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        getPassword,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export function useStaffAuth(): StaffContextType {
  const context = useContext(StaffContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within a StaffProvider');
  }
  return context;
}

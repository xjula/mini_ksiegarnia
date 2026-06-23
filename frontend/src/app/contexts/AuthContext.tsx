import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { jwtDecode } from 'jwt-decode';
import { apiClient } from '../../api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGitHub: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({
            id: decoded.id,
            email: decoded.email || `${decoded.sub}@github.com`,
            name: decoded.sub,
            role: decoded.isAdmin ? 'admin' : 'user' 
          });
        } else {
          localStorage.removeItem('token');
        }
      } catch (e) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/login', {
      email,
      haslo: password
    });

    setUser({
      id: response.data.id,
      email: response.data.email,
      name: response.data.full_name || response.data.email.split('@')[0],
      role: response.data.rola
    });
  };

  const loginWithGitHub = () => {
    console.log("Przekierowanie do FastAPI na logowanie GitHub...");
    window.location.href = 'http://127.0.0.1:8000/auth/login';
  };

  // Czyszczenie tokenu przy wylogowaniu
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await apiClient.post('/uzytkownicy/', {
      email,
      full_name: name,
      haslo: password,
      oauth: false,
      rola: 'user'
    });

    setUser({
      id: response.data.id,
      email: response.data.email,
      name: response.data.full_name || name || email.split('@')[0],
      role: response.data.rola || 'user'
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
      loginWithGitHub,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
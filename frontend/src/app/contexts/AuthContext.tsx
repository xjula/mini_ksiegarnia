import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // Mock login - w prawdziwej aplikacji byłoby wywołanie API
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email === 'admin@ksiegarnia.pl') {
      setUser({
        id: 1,
        email,
        name: 'Administrator',
        role: 'admin'
      });
    } else {
      setUser({
        id: 2,
        email,
        name: email.split('@')[0],
        role: 'user'
      });
    }
  };

  const logout = () => {
    setUser(null);
  };

  const register = async (email: string, password: string, name: string) => {
    // Mock registration
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      id: Date.now(),
      email,
      name,
      role: 'user'
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      register,
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

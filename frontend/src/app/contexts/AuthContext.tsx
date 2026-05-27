import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { jwtDecode } from 'jwt-decode'; // Dodany import do czytania tokenów JWT

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGitHub: () => void; // Dodane do interfejsu
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // KROK 1: Automatyczne sprawdzanie tokenu JWT w przeglądarce po odświeżeniu strony
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // Sprawdzamy, czy token nie wygasł (exp jest w sekundach, stąd * 1000)
        if (decoded.exp * 1000 > Date.now()) {
          setUser({
            id: 999, // umowne ID dla użytkownika z OAuth
            email: decoded.email || `${decoded.sub}@github.com`,
            name: decoded.sub, // login z GitHuba
            role: decoded.isAdmin ? 'admin' : 'user' // mapowanie roli na Twój system (role: 'admin')
          });
        } else {
          localStorage.removeItem('token');
        }
      } catch (e) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  // Twoje dotychczasowe logowanie (Mock) - zostawiamy, żeby działało stare konto admin@ksiegarnia.pl
  const login = async (email: string, password: string) => {
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

  // KROK 2: NOWA FUNKCJA - Przekierowanie do backendu FastAPI na logowanie GitHub
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
      loginWithGitHub, // Udostępniamy funkcję przyciskowi w Login.tsx
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
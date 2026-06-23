import { useEffect } from 'react';
import { useSearchParams } from 'react-router'; 

export function LoginSuccess() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token); 
      console.log("Token został pomyślnie zapisany!");

      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          window.atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        const userData = JSON.parse(jsonPayload);
        console.log("Rozkodowany użytkownik z GitHub:", userData);

        localStorage.setItem('user', JSON.stringify(userData));

      } catch (error) {
        console.error("Błąd dekodowania tokenu JWT:", error);
      }

      window.location.href = '/'; 
    } else {
      window.location.href = '/login';
    }
  }, [searchParams]);

  return (
    <div className="flex h-screen items-center justify-center font-bold text-gray-600 dark:text-slate-300">
      Autoryzacja OAuth2 zakończona sukcesem. Trwa logowanie...
    </div>
  );
}
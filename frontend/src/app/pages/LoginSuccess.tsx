import { useEffect } from 'react';
import { useSearchParams } from 'react-router'; 

export function LoginSuccess() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token); 
      console.log("Token został pomyślnie zapisany!");
      window.location.href = '/'; // Przekierowujemy usera na stronę główną jako zalogowanego
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
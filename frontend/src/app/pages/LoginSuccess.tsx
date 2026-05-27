import { useEffect } from 'react';
import { useSearchParams } from 'react-router'; // upewnij się, że pasuje do Twojej wersji react-router

export function LoginSuccess() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Wyciągamy token, który widzimy na Twoim zrzucie ekranu z paska adresu
    const token = searchParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token); // Zapisujemy go na stałe w przeglądarce
      console.log("Token został pomyślnie zapisany!");
      window.location.href = '/'; // Przekierowujemy usera na stronę główną jako zalogowanego
    } else {
      window.location.href = '/login';
    }
  }, [searchParams]);

  return (
    <div className="flex h-screen items-center justify-center font-bold text-gray-600">
      Autoryzacja OAuth2 zakończona sukcesem. Trwa logowanie...
    </div>
  );
}
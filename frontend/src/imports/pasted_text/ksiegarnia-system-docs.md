wykorzystywane technologie: 
•	Python + FastAPI
•	PostgreSQL
•	RabbitMQ
- diagramy UML:
Podstawowe informacje o systemie:
Cele systemu księgarni internetowej:
•	Zdalne udostępnienie oferty książek użytkownikom. 
•	Możliwość zakupu książek online. 
•	Przeglądanie recenzji i ocen książek. 
•	Analiza trendów popularności książek. 
•	Ułatwienie zarządzania sprzedażą przez administratora. 
•	Integracja z systemami płatności elektronicznych. 
Opis modelowanej rzeczywistości:
Książka
•	posiada tytuł, autora, opis i cenę 
•	należy do kategorii 
•	może mieć wiele recenzji 
•	bierze udział w analizie trendów 
Recenzja
•	zawiera ocenę (1–5) i komentarz 
•	przypisana do użytkownika i książki 
•	służy do oceny jakości książek 
Zamówienie
•	zawiera listę książek
•	posiada status
•	przypisane do użytkownika 
Płatność
•	dotyczy jednego zamówienia 
•	posiada status i metodę 
•	zawiera external_id z systemu płatności 
Trend
•	określa popularność książki w czasie 
•	generowany automatycznie 
Uczestnicy systemu:
Użytkownik
•	przegląda książki 
•	dodaje do koszyka 
•	kupuje książki 
•	dodaje recenzje 
Administrator
•	zarządza książkami 
•	zarządza użytkownikami 
•	zatwierdza płatności offline 
System płatności
•	obsługuje transakcje online 
•	wysyła status płatności 
Opis funkcjonalności systemu
Użytkownik
•	Przeglądanie książek 
•	Dodanie książki do koszyka 
•	Zakup książki 
•	Dodanie recenzji 
•	Przeglądanie trendów 
Administrator
•	Dodawanie, edycja i usuwanie książek 
•	Zarządzanie użytkownikami 
•	Zatwierdzanie płatności offline 
Wymagania niefunkcjonalne
•	System umożliwia uwierzytelnianie użytkowników przy użyciu protokołu OAuth2 (np. logowanie przez Google) 
•	System rejestruje operacje użytkowników (zakupy, płatności, recenzje)
•	System umożliwia asynchroniczne przetwarzanie wybranych operacji (np. płatności, aktualizacja trendów) w celu poprawy wydajności i skalowalności


User Stories
Użytkownik
•	Jako użytkownik chcę przeglądać książki, aby znaleźć interesujące mnie pozycje 
•	Jako użytkownik chcę kupować książki, aby móc je posiadać 
•	Jako użytkownik chcę dodawać recenzje, aby dzielić się opinią 
•	Jako użytkownik chcę widzieć trendy, aby wiedzieć co jest popularne 
Administrator
•	Jako administrator chcę zarządzać książkami, aby aktualizować ofertę 
•	Jako administrator chcę zarządzać użytkownikami, aby kontrolować dostęp 
•	Jako administrator chcę zatwierdzać płatności offline 
Scenariusze przypadków użycia:
Dodaj zamówienie
Warunki początkowe:
•	Użytkownik jest zalogowany.
•	Wybrana książka jest dostępna w magazynie (ilość_sztuk > 0).
Warunki końcowe:
•	Zamówienie zapisane z przypisanym adres_id i wyliczonym kosztem dostawy oraz podatkiem.
•	Płatność rozpoczęta.
Przebieg:
1.	Użytkownik dodaje książkę do koszyka.
2.	Użytkownik przechodzi do ekranu "Zamówienie".
3.	System prosi o wybór adresu dostawy (z tabeli Adres) oraz metody dostawy.
4.	System weryfikuje dostępność książki w magazynie (ilość_sztuk).
5.	System wylicza cenę całkowitą, uwzględniając podatek VAT i koszt wybranej dostawy.
6.	Użytkownik klika „Złóż zamówienie”.
7.	System tworzy zamówienie ze statusem PENDING.
8.	System inicjuje proces płatności.
Alternatywny przebieg:
•	Brak wystarczającej ilości towaru: System informuje o braku książki i uniemożliwia złożenie zamówienia.
•	Użytkownik anuluje płatność
Dodaj recenzję
Warunki początkowe:
•	użytkownik zalogowany 
•	książka istnieje 
Warunki końcowe:
•	recenzja zapisana 
Przebieg:
1.	Użytkownik wybiera książkę 
2.	Kliknięcie „Dodaj recenzję” 
3.	Wprowadzenie oceny i komentarza 
4.	Zapis w systemie 
5.	Wyświetlenie recenzji
Dodaj książkę
Aktor:
Administrator
Warunki początkowe:
•	administrator jest zalogowany 
•	system działa poprawnie 
Warunki końcowe:
•	książka została dodana do systemu 
•	książka jest widoczna dla użytkowników 
Przebieg zdarzeń:
1.	Administrator wybiera opcję „Dodaj książkę” 
2.	System wyświetla formularz dodawania książki 
3.	Administrator wprowadza dane
4.	Administrator zatwierdza formularz 
5.	System zapisuje książkę w bazie danych 
6.	System potwierdza dodanie książki 
Alternatywny przebieg:
3.	Administrator wprowadza niepoprawne dane 
4.	System wyświetla komunikat błędu 
5.	Administrator poprawia dane 
Założenie konta (Rejestracja)
Aktor:
Użytkownik
Warunki początkowe:
•	użytkownik nie jest zalogowany 
•	system jest dostępny 
Warunki końcowe:
•	konto użytkownika zostało utworzone 
•	użytkownik może się zalogować 
Przebieg zdarzeń:
1.	Użytkownik wybiera opcję „Rejestracja” 
2.	System wyświetla formularz rejestracji 
3.	Użytkownik wprowadza dane
4.	Użytkownik zatwierdza formularz 
5.	System waliduje dane 
6.	System tworzy konto użytkownika 
7.	System potwierdza rejestrację 
Alternatywny przebieg:
5.	Dane są niepoprawne (np. email zajęty) 
6.	System wyświetla komunikat błędu 
7.	Użytkownik poprawia dane 
Logowanie
Aktor:
Użytkownik
Warunki początkowe:
•	użytkownik posiada konto
Warunki końcowe:
•	użytkownik jest zalogowany w systemie 
Przebieg zdarzeń:
1.	Użytkownik wybiera „Zaloguj” 
2.	Użytkownik wpisuje dane 
3.	Odnajduje konto 
4.	Użytkownik zostaje zalogowany
Realizacja płatności online
Aktorzy:
•	Użytkownik 
•	System płatności
Warunki początkowe:
•	użytkownik jest zalogowany 
•	koszyk zawiera co najmniej jedną książkę 
•	system płatności jest dostępny 
Warunki końcowe:
•	płatność zakończona sukcesem lub niepowodzeniem 
•	status zamówienia zaktualizowany 
•	zapisano identyfikator external_id 
Przebieg zdarzeń:
1.	Użytkownik przechodzi do koszyka 
2.	Użytkownik wybiera opcję „Zapłać” 
3.	System tworzy zamówienie
4.	System wysyła żądanie
5.	System płatności zwraca identyfikator transakcji (external_id) 
6.	System zapisuje external_id w bazie danych 
7.	Użytkownik dokonuje płatności na stronie operatora 
8.	System aktualizuje status 
9.	System informuje użytkownika o wyniku płatności 
Alternatywny przebieg:
Błąd płatności:
7.	Płatność zostaje odrzucona 
8.	Status zmieniony
9.	Użytkownik otrzymuje komunikat o błędzie 
Zatwierdzenie płatności offline
Aktor:
Administrator
Warunki początkowe:
•	istnieje zamówienie ze statusem PENDING
•	administrator jest zalogowany 
Warunki końcowe:
•	status zamówienia zmieniony
Przebieg zdarzeń:
1.	Administrator przechodzi do panelu zamówień 
2.	System wyświetla listę zamówień ze statusem PENDING 
3.	Administrator wybiera zamówienie 
4.	Administrator wybiera opcję: 
o	„Zatwierdź płatność”
lub 
o	„Odrzuć płatność” 
5.	System aktualizuje status zamówienia 
6.	System zapisuje zmianę w logach 
7.	System informuje użytkownika o zmianie statusu 
Alternatywny przebieg:
5.	Nie udało się zapisać zmian 
6.	System wyświetla komunikat błędu

# pai2021

## Zadanie na podstawowy poziom zaliczenia

* dodatkowi aktorzy: projekty oraz umowy; GUI dla administratora (tworzenie i edycja projektów) oraz dla kierowników projektów (tworzenie związanych z projektem umów)

* projekt [ nazwa, kierownik (id_osoby) ]

* umowa [ id_wykonawcy, nazwa, id_projektu, data_rozpoczęcia, data_zakończenia, wynagrodzenie ]

### GUI dodatkowe

* logując się jako kierownik projektu, możemy "rozliczyć" każdą umowę, dodając pole 'commited':true

### Uwagi:

- sensownie było by użyć kolekcji Persons jako zbioru wykonawców umów oraz kolekcji Users jako zbioru kierowników + administrator
- propozycja menu nawigacyjnego: dla administratora Wykonawcy|Kierownicy|Projekty|Historia, dla kierowników Umowy (z możliwością wyboru projektu, którego dotyczą i edycji tychże)

## Zadanie na ocenę 4

* wprowadzić do projektu websockety, które pozwalają na odświeżenie widoków w momencie zmiany danych przez innego użytkownika np. kiedy jeden administrator dodaje project, inni administratorzy widzą go na liście projektów bez odświeżania okna przeglądarki

## Zadanie na ocenę 5

rozszerzyć projekt na 4 o jedną z nieomówionych funkcjonalności

* w UI wprowadzić wybór wielokrotny: rozliczenie większej liczby umów na raz, proszę użyć komponentu ct-ui-select

* w UI administrator wprowadzić wykres rozliczonych umów na osi czasu (na podstawie projektu "charts" z Gitlaba i modułów nvd3+angular-nvd3)

* na podstawie projektu z Gitlaba "Google maps", dodać integrację z Google maps, polegającą na wyborze lokacji wykonywanej umowy spośród listy lokacji zawartej w bazie danych

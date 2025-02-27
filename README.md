# Employee Market

zmiany:
1. index.html przeniosłem co src, tam powinien się znajdowac cały kod appki
2. dodałem env-y i kopiowanie odpowiednich przy wywołaniach "dev", "build" i "preview"
3. "g" wywołuje server który zbiera pliki .html i .css z katalogu "src", łączy je w jeden plik "index.html" i "style.css" i umieszcza je w "temp", kopiuje pozostałę pliki do "temp" i włacza w tym katalogu vite
4. przesunięcie skryptów js z heder-a na koniec body, bo skrypcie są "document.getById()" przed inicjacją obiektów dom
5. podzieliłem html na snipety zgodnie z strukturą
6. pogrupowałem elementy dom w obiekty, które mozna exportować
7. dłuższe pliki podzieliłem na mniejsze zgodnie z funkcją ("employee.js", "events.js")
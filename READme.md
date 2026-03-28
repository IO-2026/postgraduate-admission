# Postgraduate Admission 🎓

System wspomagający rekrutację na studia podyplomowe. Projekt realizowany w ramach przedmiotu Inżynieria Oprogramowania.

## 🛠 Stos technologiczny
* **Backend:** Java (Spring Boot) + Gradle
* **Frontend:** React + Vite (Node.js)
* **CI/CD:** GitHub Actions

---

## 🚀 Getting Started (Jak odpalić projekt lokalnie)

Zanim zaczniesz, upewnij się, że masz zainstalowane na swoim komputerze:
* [Java JDK 21](https://adoptium.net/) (lub 17)
* [Node.js](https://nodejs.org/) (wersja 20.x LTS)
* IDE (polecamy IntelliJ IDEA dla backendu lub VS Code z wtyczkami dla całego monorepo)

Pobierz repozytorium na swój komputer:

```bash
git clone [https://github.com/](https://github.com/)<TWÓJ_NICK_NA_GITHUBIE>/postgraduate-admission.git
cd postgraduate-admission
```

### 1. Uruchomienie Backendu (Spring Boot)

Backend znajduje się w folderze `backend`. Używamy Gradle jako narzędzia do budowania, więc nie musisz instalować go globalnie na komputerze – projekt używa wbudowanego wrappera (`gradlew`).

```bash
cd backend

# (Tylko Linux/Mac) Nadaj uprawnienia do pliku wykonywalnego:
chmod +x ./gradlew

# Uruchomienie aplikacji:
./gradlew bootRun
```
Aplikacja backendowa domyślnie uruchomi się pod adresem: `http://localhost:8080`

### 2. Uruchomienie Frontendu (React + Vite)

Frontend znajduje się w folderze `frontend` i jest zarządzany przez menedżer pakietów `npm`.

```bash
cd frontend

# Za pierwszym razem (lub po dodaniu nowych bibliotek) zainstaluj zależności:
npm install

# Uruchomienie serwera deweloperskiego:
npm run dev
```
Aplikacja frontendowa uruchomi się pod adresem: `http://localhost:5173` (Vite pokaże dokładny link w terminalu).

---

## 🤝 Zasady współpracy i Git Flow

Aby uniknąć konfliktów i niedziałającego kodu na głównej gałęzi, trzymamy się następujących zasad:

1. **Nie pushujemy bezpośrednio do `main`.**
2. Każde nowe zadanie (funkcjonalność, poprawka błędu) robimy na osobnej gałęzi (branchu).
   * Przykład nazewnictwa: `feature/logowanie-uzytkownika` lub `bugfix/poprawa-widoku-tabeli`
3. Gdy skończysz pracę na swojej gałęzi, zrób pusha na GitHuba i otwórz **Pull Request (PR)** do gałęzi `main`.
4. **GitHub Actions (CI):** Przy każdym Twoim pushu i Pull Requeście automatycznie uruchomią się testy i budowanie aplikacji. 
   * Twój kod zostanie dołączony do `maina` dopiero, gdy wszystkie akcje zaświecą się na zielono ✅.
5. Zanim zmergujesz swój PR, poproś kogoś z zespołu o Code Review.
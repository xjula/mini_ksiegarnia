import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi } from "vitest";
import { Home } from "../pages/Home";

vi.mock("../components/BookCard", () => ({
  BookCard: ({ book }: any) => (
    <div data-testid="book-card">
      {book.title} - {book.author}
    </div>
  ),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockBooks = [
  {
    id: 1,
    title: "Harry Potter",
    author: "J.K. Rowling",
    category: "Fantasy",
  },
  {
    id: 2,
    title: "Lalka",
    author: "Bolesław Prus",
    category: "Klasyka",
  },
];

vi.mock("../contexts/BooksContext", () => ({
  useBooks: () => ({
    books: mockBooks,
  }),
}));

describe("Home", () => {
  test("wyświetla katalog książek", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText("Harry Potter - J.K. Rowling")).toBeInTheDocument();
    expect(screen.getByText("Lalka - Bolesław Prus")).toBeInTheDocument();
  });

  test("filtruje książki po wyszukiwaniu", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText("homePage.search");

    fireEvent.change(searchInput, {
      target: { value: "Harry" },
    });

    expect(screen.getByText("Harry Potter - J.K. Rowling")).toBeInTheDocument();
    expect(screen.queryByText("Lalka - Bolesław Prus")).not.toBeInTheDocument();
  });

  test("pokazuje komunikat gdy nie ma wyników", () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText("homePage.search");

    fireEvent.change(searchInput, {
      target: { value: "Nieistniejąca książka" },
    });

    expect(screen.getByText("homePage.noResults")).toBeInTheDocument();
  });
});
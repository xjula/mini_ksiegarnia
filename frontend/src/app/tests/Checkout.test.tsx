import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi } from "vitest";
import { Checkout } from "../pages/Checkout";

const mockUseCart = vi.fn();

vi.mock("../contexts/CartContext", () => ({
  useCart: () => mockUseCart(),
}));

vi.mock("../contexts/BooksContext", () => ({
  useBooks: () => ({
    getBookById: vi.fn(() => ({
      id: 1,
      title: "Testowa książka",
      price: 50,
      stock: 10,
    })),
    fetchBooks: vi.fn(),
  }),
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1 },
  }),
}));

vi.mock("../../api", () => ({
  apiClient: {
    get: vi.fn(() =>
      Promise.resolve({
        data: [],
      })
    ),
    post: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("Checkout", () => {
  test("renderuje formularz zamówienia", () => {
    mockUseCart.mockReturnValue({
      items: [
        {
          bookId: 1,
          quantity: 2,
        },
      ],
      clearCart: vi.fn(),
      checkout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Checkout />
      </MemoryRouter>
    );

    expect(
      screen.getByText("checkout.title2")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "checkout.goToPayment",
      })
    ).toBeInTheDocument();
  });
});
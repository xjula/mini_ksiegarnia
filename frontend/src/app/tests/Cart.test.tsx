import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi } from "vitest";
import { Cart } from "../pages/Cart";

const mockUseCart = vi.fn();

vi.mock("../contexts/CartContext", () => ({
  useCart: () => mockUseCart(),
}));

vi.mock("../contexts/BooksContext", () => ({
  useBooks: () => ({
    getBookById: vi.fn(),
  }),
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("Cart", () => {
  test("wyświetla pusty koszyk", () => {
    mockUseCart.mockReturnValue({
      items: [],
      removeItem: vi.fn(),
      updateQuantity: vi.fn(),
      totalItems: 0,
    });

    render(
      <MemoryRouter>
        <Cart />
      </MemoryRouter>
    );

    expect(screen.getByText("cart.empty")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
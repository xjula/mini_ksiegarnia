import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi } from "vitest";
import { ProtectedRoute } from "../components/ProtectedRoute";

const mockUseAuth = vi.fn();

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("ProtectedRoute", () => {
  test("wyświetla dzieci dla zalogowanego użytkownika", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: "test@test.pl" },
      isAdmin: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Chroniona zawartość</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(
      screen.getByText("Chroniona zawartość")
    ).toBeInTheDocument();
  });

  test("przekierowuje niezalogowanego użytkownika", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAdmin: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Chroniona zawartość</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(
      screen.queryByText("Chroniona zawartość")
    ).not.toBeInTheDocument();
  });

  test("blokuje dostęp do strony administratora", () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1 },
      isAdmin: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute adminOnly>
          <div>Panel administratora</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(
      screen.queryByText("Panel administratora")
    ).not.toBeInTheDocument();
  });
});
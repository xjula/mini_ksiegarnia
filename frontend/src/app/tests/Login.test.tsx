import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, test, vi } from "vitest";
import { Login } from "../pages/Login";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    login: vi.fn(),
    register: vi.fn(),
    loginWithGitHub: vi.fn(),
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("Login", () => {
  test("renderuje formularz logowania", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("twoj@email.pl")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
  });
});

test("wyświetla przycisk logowania", () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  expect(
    screen.getByRole("button", { name: "auth.login" })
  ).toBeInTheDocument();
});

test("wyświetla przycisk logowania przez GitHub", () => {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

  expect(
    screen.getByRole("button", { name: "auth.githubLogin" })
  ).toBeInTheDocument();
});
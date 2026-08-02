// Replaces CRA's boilerplate smoke test, which asserted a "learn react link"
// this app has never contained — it could not pass, and so told nobody
// anything.
//
// What is worth asserting instead is the route guard: a dashboard route must
// send an unauthenticated visitor to login rather than rendering a page that
// then 401s into a session dialog. Every protected route goes through one
// wrapper, so this also guards against a future page being added without it.

import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import RequireAuth from "./components/authentication/RequireAuth";

const Guarded = ({ initialPath }) => (
  <MemoryRouter initialEntries={[initialPath]}>
    <Routes>
      <Route path="/login" element={<div>login screen</div>} />
      <Route
        path="/dashboard/memory"
        element={
          <RequireAuth>
            <div>protected content</div>
          </RequireAuth>
        }
      />
    </Routes>
  </MemoryRouter>
);

describe("RequireAuth", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  test("sends an unauthenticated visitor to login", () => {
    render(<Guarded initialPath="/dashboard/memory" />);
    expect(screen.getByText("login screen")).toBeInTheDocument();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  test("lets an authenticated visitor through", () => {
    window.localStorage.setItem("JWT_TOKEN", "a.b.c");
    render(<Guarded initialPath="/dashboard/memory" />);
    expect(screen.getByText("protected content")).toBeInTheDocument();
  });

  test("an empty token is not a token", () => {
    window.localStorage.setItem("JWT_TOKEN", "");
    render(<Guarded initialPath="/dashboard/memory" />);
    expect(screen.getByText("login screen")).toBeInTheDocument();
  });
});

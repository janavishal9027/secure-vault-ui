import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import "./App.css";

import Homepage from "./components/pages/Homepage";
import SignUp from "./components/authentication/SignUp";
import Login from "./components/authentication/Login";
import VerifyTwoFactorLogin from "./components/authentication/VerifyTwoFactorLogin";
import OAuthRedirect from "./components/pages/OAuthRedirect";
import SessionExpiredHandler from "./components/authentication/SessionExpiredHandler";
import SessionManager from "./components/authentication/SessionManager";
import RequireAuth from "./components/authentication/RequireAuth";
import ErrorBoundary from "./components/utils/ErrorBoundary";

// Split at the route boundary. The dashboard pulls in the rich-text editor,
// syntax highlighting and the AI pages; the landing and login screens need
// none of it, and they are what an unauthenticated visitor loads first.
// Public routes stay eagerly imported — a spinner on the login page would be
// a worse trade than the bytes it saves.
const Dashboard = lazy(() => import("./components/dashboard/Dashboard"));
const CreateNotePage = lazy(() => import("./components/notes/CreateNotePage"));
const SettingsPage = lazy(() => import("./components/dashboard/SettingsPage"));
const ProviderKeysPage = lazy(() =>
  import("./components/dashboard/ProviderKeysPage"),
);
const AiChatPage = lazy(() => import("./components/ai/AiChatPage"));
const KnowledgeGraphPage = lazy(() =>
  import("./components/graph/KnowledgeGraphPage"),
);
const MemoryPage = lazy(() => import("./components/memory/MemoryPage"));
const TransformsPage = lazy(() =>
  import("./components/transforms/TransformsPage"),
);

const RouteFallback = () => (
  <Box
    sx={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <CircularProgress size={28} sx={{ color: "#a5b4fc" }} />
  </Box>
);

/** Guarded + lazily loaded. Every dashboard route goes through this, so a new
 *  page cannot be added unprotected by forgetting a wrapper. */
const Protected = ({ element }) => (
  <RequireAuth>
    <Suspense fallback={<RouteFallback />}>{element}</Suspense>
  </RequireAuth>
);

function App() {
  return (
    <>
      <SessionExpiredHandler />
      {/* Renews the session while the user is active and ends it once they
          are not. Mounted outside the router so the policy holds across
          navigation rather than restarting on every route change. */}
      <SessionManager />
      {/* Outermost boundary: a render error anywhere below this shows a
          recoverable message rather than a blank page. Pages add their own
          inner boundaries so a failure stays local where it can. */}
      <ErrorBoundary>
        <Routes>
          <Route path={"/"} element={<Homepage />} />
          <Route path={"/signUp"} element={<SignUp />} />
          <Route path={"/login"} element={<Login />} />
          <Route path={"/verify-2fa-login"} element={<VerifyTwoFactorLogin />} />
          <Route path="/oauth2/redirect" element={<OAuthRedirect />} />

          <Route path={"/dashboard"} element={<Protected element={<Dashboard />} />} />
          <Route
            path={"/dashboard/create-note"}
            element={<Protected element={<CreateNotePage />} />}
          />
          <Route
            path={"/dashboard/settings"}
            element={<Protected element={<SettingsPage />} />}
          />
          {/* Two-factor used to be its own page. It is a section of Settings
              now; this keeps any existing link or bookmark working. */}
          <Route
            path={"/dashboard/2fa-settings"}
            element={<Navigate to="/dashboard/settings" replace />}
          />
          <Route
            path={"/dashboard/keys"}
            element={<Protected element={<ProviderKeysPage />} />}
          />
          <Route
            path={"/dashboard/ai-chat"}
            element={<Protected element={<AiChatPage />} />}
          />
          <Route
            path={"/dashboard/graph"}
            element={<Protected element={<KnowledgeGraphPage />} />}
          />
          <Route
            path={"/dashboard/memory"}
            element={<Protected element={<MemoryPage />} />}
          />
          <Route
            path={"/dashboard/processing"}
            element={<Protected element={<TransformsPage />} />}
          />
        </Routes>
      </ErrorBoundary>
    </>
  );
}

export default App;

import { Route, Routes } from "react-router-dom";
import "./App.css";
import Homepage from "./components/pages/Homepage";
import SignUp from "./components/authentication/SignUp";
import Login from "./components/authentication/Login";
import VerifyTwoFactorLogin from "./components/authentication/VerifyTwoFactorLogin";
import OAuthRedirect from "./components/pages/OAuthRedirect";
import CreateNotePage from "./components/notes/CreateNotePage";
import Dashboard from "./components/dashboard/Dashboard";
import TwoFactorSettings from "./components/dashboard/TwoFactorSettings";
import SessionExpiredHandler from "./components/authentication/SessionExpiredHandler";
import AiChatPage from "./components/ai/AiChatPage";

function App() {
  return (
    <>
      <SessionExpiredHandler />
      <Routes>
        <Route path={"/"} element={<Homepage />} />
        <Route path={"/signUp"} element={<SignUp />} />
        <Route path={"/login"} element={<Login />} />
        <Route path={"/verify-2fa-login"} element={<VerifyTwoFactorLogin />} />
        <Route path={"/dashboard"} element={<Dashboard />} />
        <Route path={"/dashboard/create-note"} element={<CreateNotePage />} />
        <Route path={"/dashboard/2fa-settings"} element={<TwoFactorSettings />} />
        <Route path={"/dashboard/ai-chat"} element={<AiChatPage />} />
        <Route path="/notes/oauth2/redirect" element={<OAuthRedirect />} />
      </Routes>
    </>
  );
}

export default App;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { get2FAStatusService } from "../store/services/AuthService";

const OAuthRedirect = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    localStorage.setItem("JWT_TOKEN", token);

    (async () => {
      let twoFaEnabled = false;
      try {
        const statusRes = await get2FAStatusService();
        twoFaEnabled = Boolean(statusRes.data?.is2faEnabled);
      } catch {
        twoFaEnabled = false;
      }

      if (twoFaEnabled) {
        navigate("/verify-2fa-login", { replace: true });
      } else {
        enqueueSnackbar("Login Successful", { variant: "success" });
        navigate("/dashboard", { replace: true });
      }
    })();
  }, [navigate, enqueueSnackbar]);

  return <div>Signing you in...</div>;
};

export default OAuthRedirect;
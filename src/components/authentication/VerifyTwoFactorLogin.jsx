import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
} from "@mui/material";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import {
  get2FAStatusService,
  verify2FALoginService,
} from "../store/services/AuthService";
import AuthShell, { authFieldSx, authPrimaryButtonSx } from "./AuthShell";

export default function VerifyTwoFactorLogin() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [checkingStatus, setCheckingStatus] = useState(true);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("JWT_TOKEN");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        const res = await get2FAStatusService();
        const enabled = Boolean(res.data?.is2faEnabled);
        if (!enabled) {
          enqueueSnackbar("2FA not enabled — entering dashboard", {
            variant: "info",
          });
          navigate("/dashboard", { replace: true });
        }
      } catch {
        enqueueSnackbar("Unable to verify session. Please log in again.", {
          variant: "error",
        });
        localStorage.removeItem("JWT_TOKEN");
        localStorage.removeItem("ROLES");
        navigate("/login", { replace: true });
      } finally {
        setCheckingStatus(false);
      }
    })();
  }, [navigate, enqueueSnackbar]);

  const handleVerify = async (event) => {
    event?.preventDefault();
    if (code.length < 6) {
      enqueueSnackbar("Enter the 6-digit code from your authenticator app", {
        variant: "warning",
      });
      return;
    }

    const token = localStorage.getItem("JWT_TOKEN");
    setSubmitting(true);
    try {
      await verify2FALoginService(Number(code), token);
      enqueueSnackbar("2FA verified successfully", {
        variant: "success",
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        typeof err?.response?.data === "string"
          ? err.response.data
          : err?.response?.data?.message || "Invalid 2FA code";
      enqueueSnackbar(msg, { variant: "error" });
      setCode("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    localStorage.removeItem("JWT_TOKEN");
    localStorage.removeItem("ROLES");
    enqueueSnackbar("Login cancelled", { variant: "info" });
    navigate("/login", { replace: true });
  };

  return (
    <AuthShell
      title="Two-factor verification"
      subtitle="Open your authenticator app and enter the 6-digit code to finish signing in."
      maxWidth={420}
    >
      {checkingStatus ? (
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress size={26} sx={{ color: "var(--accent-soft)" }} />
        </Stack>
      ) : (
        <Box component="form" onSubmit={handleVerify} noValidate>
          <TextField
            autoFocus
            fullWidth
            label="6-digit verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            placeholder="123456"
            sx={{
              ...authFieldSx,
              mb: 2.5,
              // The code is read off a screen and typed in one go; spacing the
              // digits makes a mistyped one findable without re-reading all six.
              "& input": { letterSpacing: "0.35em", fontSize: "1.05rem" },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SecurityRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            disabled={submitting || code.length < 6}
            sx={authPrimaryButtonSx}
          >
            {submitting ? "Verifying…" : "Verify"}
          </Button>

          <Button
            fullWidth
            onClick={handleCancel}
            disabled={submitting}
            sx={{
              mt: 1.5,
              borderRadius: "999px",
              py: 1.1,
              textTransform: "none",
              fontSize: "0.9rem",
              color: "var(--text-2)",
              "&:hover": { background: "rgba(var(--ov),0.06)" },
            }}
          >
            Cancel and sign out
          </Button>
        </Box>
      )}
    </AuthShell>
  );
}

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CardContent,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import {
  get2FAStatusService,
  verify2FALoginService,
} from "../store/services/AuthService";

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
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgb(0, 0, 0)",
          background: "rgba(255, 255, 255, 0.67)",
          maxWidth: 460,
          width: "100%",
          p: 3,
        }}
      >
        <CardContent>
          <Stack alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
            <SecurityRoundedIcon sx={{ fontSize: 44, color: "#f45b78" }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Two-Factor Verification
            </Typography>
            <Typography
              variant="body2"
              align="center"
              sx={{ color: "text.secondary" }}
            >
              Open your authenticator app and enter the 6-digit code to finish
              signing in.
            </Typography>
          </Stack>

          {checkingStatus ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Stack>
          ) : (
            <Box component="form" onSubmit={handleVerify} noValidate>
              <TextField
                autoFocus
                fullWidth
                label="6-digit verification code"
                inputMode="numeric"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                sx={{ mb: 2 }}
              />

              <Stack direction="row" spacing={1.5}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={submitting || code.length < 6}
                  sx={{
                    backgroundColor: "#f45b78",
                    borderRadius: 10,
                    py: 1.3,
                    textTransform: "none",
                    fontSize: "16px",
                    "&:hover": { backgroundColor: "#db3856" },
                  }}
                >
                  {submitting ? "Verifying..." : "Verify"}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={submitting}
                  sx={{
                    borderRadius: 10,
                    py: 1.3,
                    textTransform: "none",
                    fontSize: "16px",
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </Box>
          )}
        </CardContent>
      </Paper>
    </Box>
  );
}

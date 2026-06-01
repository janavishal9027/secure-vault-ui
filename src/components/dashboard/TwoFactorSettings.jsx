import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import {
  get2FAStatusService,
  enable2FAService,
  verify2FAService,
  disable2FAService,
} from "../store/services/AuthService";

const QR_RENDER_BASE = "https://api.qrserver.com/v1/create-qr-code/";

const isOtpAuthUrl = (value) =>
  typeof value === "string" && value.startsWith("otpauth://");

const isHttpUrl = (value) =>
  typeof value === "string" && /^https?:\/\//i.test(value);

const buildQrImageSrc = (backendResponse) => {
  if (!backendResponse) return "";
  if (isOtpAuthUrl(backendResponse)) {
    return `${QR_RENDER_BASE}?size=220x220&data=${encodeURIComponent(backendResponse)}`;
  }
  if (isHttpUrl(backendResponse)) return backendResponse;
  return "";
};

const extractOtpAuthUrl = (backendResponse) => {
  if (!backendResponse) return "";
  if (isOtpAuthUrl(backendResponse)) return backendResponse;
  if (isHttpUrl(backendResponse)) {
    try {
      return new URL(backendResponse).searchParams.get("data") || "";
    } catch {
      return "";
    }
  }
  return "";
};

export default function TwoFactorSettings() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [enabled, setEnabled] = useState(false);

  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [code, setCode] = useState("");
  const [enabling, setEnabling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disabling, setDisabling] = useState(false);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    try {
      const res = await get2FAStatusService();
      setEnabled(Boolean(res.data?.is2faEnabled));
    } catch (err) {
      enqueueSnackbar("Unable to load 2FA status", { variant: "error" });
    } finally {
      setLoadingStatus(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleEnable = async () => {
    setEnabling(true);
    try {
      const res = await enable2FAService();
      setQrCodeUrl(res.data);
      enqueueSnackbar("Scan the QR code, then enter the 6-digit code", {
        variant: "info",
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Unable to start 2FA setup";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setEnabling(false);
    }
  };

  const handleVerify = async () => {
    if (!code || code.length < 6) {
      enqueueSnackbar("Enter the 6-digit code from your authenticator app", {
        variant: "warning",
      });
      return;
    }
    setVerifying(true);
    try {
      await verify2FAService(Number(code));
      enqueueSnackbar("2FA enabled successfully", { variant: "success" });
      setQrCodeUrl("");
      setCode("");
      setEnabled(true);
    } catch (err) {
      const msg =
        typeof err?.response?.data === "string"
          ? err.response.data
          : err?.response?.data?.message || "Invalid 2FA code";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async () => {
    setDisabling(true);
    try {
      await disable2FAService();
      enqueueSnackbar("2FA disabled", { variant: "success" });
      setEnabled(false);
      setQrCodeUrl("");
      setCode("");
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Unable to disable 2FA";
      enqueueSnackbar(msg, { variant: "error" });
    } finally {
      setDisabling(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(91, 100, 255, 0.12), transparent 22%), var(--bg)",
        py: 6,
      }}
    >
      <Container maxWidth="sm">
        <Button
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate("/dashboard")}
          sx={{ color: "var(--text-2)", textTransform: "none", mb: 2 }}
        >
          Back to dashboard
        </Button>

        <Paper
          elevation={20}
          sx={{
            borderRadius: 4,
            p: 4,
            background: "rgba(var(--ov),0.96)",
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <SecurityRoundedIcon sx={{ color: "#f45b78" }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Two-Factor Authentication
            </Typography>
          </Stack>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            Add an extra layer of security to your account using an authenticator app.
          </Typography>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Status:
            </Typography>
            {loadingStatus ? (
              <CircularProgress size={18} />
            ) : (
              <Chip
                label={enabled ? "Enabled" : "Disabled"}
                color={enabled ? "success" : "default"}
                size="small"
              />
            )}
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {enabled ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Two-factor authentication is currently active. Disabling it will reduce
                your account's security.
              </Typography>
              <Button
                variant="contained"
                color="error"
                onClick={handleDisable}
                disabled={disabling}
              >
                {disabling ? "Disabling..." : "Disable 2FA"}
              </Button>
            </Box>
          ) : (
            <Box>
              {!qrCodeUrl ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Click the button below to generate a QR code. Scan it with Google
                    Authenticator, Authy, or any TOTP-compatible app.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={handleEnable}
                    disabled={enabling}
                    sx={{
                      backgroundColor: "#f45b78",
                      "&:hover": { backgroundColor: "#db3856" },
                    }}
                  >
                    {enabling ? "Generating..." : "Enable 2FA"}
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Scan the QR code with your authenticator app, then enter the
                    6-digit code below to confirm.
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      mb: 2,
                      p: 2,
                      backgroundColor: "var(--text)",
                      borderRadius: 2,
                    }}
                  >
                    <img
                      src={buildQrImageSrc(qrCodeUrl)}
                      alt="2FA QR code"
                      width={220}
                      height={220}
                    />
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      wordBreak: "break-all",
                      color: "text.secondary",
                      mb: 2,
                    }}
                  >
                    Can't scan? Manual entry: {extractOtpAuthUrl(qrCodeUrl)}
                  </Typography>

                  <TextField
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
                      variant="contained"
                      onClick={handleVerify}
                      disabled={verifying || code.length < 6}
                      sx={{
                        backgroundColor: "#f45b78",
                        "&:hover": { backgroundColor: "#db3856" },
                      }}
                    >
                      {verifying ? "Verifying..." : "Verify & Activate"}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setQrCodeUrl("");
                        setCode("");
                      }}
                      disabled={verifying}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}

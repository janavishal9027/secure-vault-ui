import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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

/**
 * The 2FA controls, with no page chrome of its own.
 *
 * This was a whole route. It is a section of Settings now — two-factor is one
 * account setting among several, and having it live at its own URL meant the
 * only way a user found it was a direct link.
 */
export default function TwoFactorSection() {
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
      enqueueSnackbar(
        err?.response?.data?.message || "Unable to start 2FA setup",
        { variant: "error" },
      );
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
      enqueueSnackbar(
        err?.response?.data?.message || "Unable to disable 2FA",
        { variant: "error" },
      );
    } finally {
      setDisabling(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
        <Typography sx={{ fontWeight: 600, color: "var(--text)" }}>
          Status
        </Typography>
        {loadingStatus ? (
          <CircularProgress size={16} />
        ) : (
          <Chip
            label={enabled ? "Enabled" : "Disabled"}
            size="small"
            sx={{
              fontWeight: 600,
              color: "var(--text)",
              background: enabled
                ? "rgba(34,197,94,0.22)"
                : "rgba(var(--ov),0.10)",
            }}
          />
        )}
      </Stack>

      {enabled ? (
        <Box>
          <Typography variant="body2" sx={{ color: "var(--text-2)", mb: 2 }}>
            Two-factor authentication is active. Turning it off means your
            password alone is enough to sign in.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDisable}
            disabled={disabling}
            sx={{ textTransform: "none", borderRadius: 999 }}
          >
            {disabling ? "Disabling…" : "Disable 2FA"}
          </Button>
        </Box>
      ) : !qrCodeUrl ? (
        <Box>
          <Typography variant="body2" sx={{ color: "var(--text-2)", mb: 2 }}>
            Generate a QR code and scan it with Google Authenticator, Authy, or
            any TOTP-compatible app.
          </Typography>
          <Button
            variant="contained"
            onClick={handleEnable}
            disabled={enabling}
            sx={{ textTransform: "none", borderRadius: 999, px: 3 }}
          >
            {enabling ? "Generating…" : "Enable 2FA"}
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography variant="body2" sx={{ color: "var(--text-2)", mb: 2 }}>
            Scan the code with your authenticator app, then enter the 6-digit
            code it shows.
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 2,
              p: 2,
              // Pinned white in both themes, and correctly so: a QR code is
              // read by a camera that needs dark-on-light contrast. Rendering
              // it on a dark surface would make it unscannable.
              backgroundColor: "#ffffff",
              borderRadius: 2,
              width: "fit-content",
              mx: "auto",
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
              color: "var(--text-muted)",
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
              sx={{ textTransform: "none", borderRadius: 999, px: 3 }}
            >
              {verifying ? "Verifying…" : "Verify & activate"}
            </Button>
            <Button
              variant="text"
              onClick={() => {
                setQrCodeUrl("");
                setCode("");
              }}
              disabled={verifying}
              sx={{ textTransform: "none", color: "var(--text-2)" }}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      )}
    </Box>
  );
}

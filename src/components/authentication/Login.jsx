import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import GoogleIcon from "@mui/icons-material/Google";
import GitHubIcon from "@mui/icons-material/GitHub";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import { authBaseUrl } from "../utils/url.js";
import { authentication } from "../utils/configEnv.js";
import { loginService } from "../store/services/LoginService.js";
import { get2FAStatusService } from "../store/services/AuthService.js";
import AuthShell, {
  AuthDivider,
  AuthError,
  authFieldSx,
  authPrimaryButtonSx,
  authProviderButtonSx,
} from "./AuthShell";

const Login = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const credentials = {
      username: data.get("username"),
      password: data.get("password"),
    };

    if (!credentials.username || !credentials.password) {
      setError("Please enter both your username and password.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const res = await loginService(credentials);
      localStorage.setItem("JWT_TOKEN", res.data.jwtToken);
      localStorage.setItem("ROLES", res.data.roles);

      let twoFaEnabled = false;
      try {
        const statusRes = await get2FAStatusService();
        twoFaEnabled = Boolean(statusRes.data?.is2faEnabled);
      } catch {
        twoFaEnabled = false;
      }

      if (twoFaEnabled) {
        navigate("/verify-2fa-login");
      } else {
        enqueueSnackbar("Login Successful", {
          variant: "success",
          anchorOrigin: { vertical: "bottom", horizontal: "center" },
        });
        navigate("/dashboard");
      }
    } catch (err) {
      const message =
        err?.response?.status === 401
          ? err.response.data?.message || "Incorrect username or password."
          : "Login failed. Please try again.";
      // Shown inline as well as in the snackbar: a toast that has already
      // faded leaves the user staring at a form with no reason for the
      // failure still on screen.
      setError(message);
      enqueueSnackbar(message, { variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your vault to pick up where you left off."
      footer={
        <Typography sx={{ fontSize: 13, color: "var(--text-2)" }}>
          Don&apos;t have an account?{" "}
          <Link
            component={RouterLink}
            to="/signUp"
            sx={{
              color: "var(--accent-soft)",
              fontWeight: 600,
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Create one, it&apos;s free
          </Link>
        </Typography>
      }
    >
      <Stack direction="row" spacing={1.5} sx={{ mb: 0.5 }}>
        <Button
          variant="contained"
          startIcon={<GoogleIcon />}
          component="a"
          href={`${authBaseUrl}${authentication}/oauth2/authorization/google`}
          sx={authProviderButtonSx}
        >
          Google
        </Button>
        <Button
          variant="contained"
          startIcon={<GitHubIcon />}
          component="a"
          href={`${authBaseUrl}${authentication}/oauth2/authorization/github`}
          sx={authProviderButtonSx}
        >
          GitHub
        </Button>
      </Stack>

      <AuthDivider label="or continue with" />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            fullWidth
            id="username"
            name="username"
            label="Username"
            autoComplete="username"
            autoFocus
            sx={authFieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            id="password"
            name="password"
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            sx={authFieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    sx={{ color: "var(--icon-muted)" }}
                  >
                    {showPassword ? (
                      <VisibilityOffOutlinedIcon fontSize="small" />
                    ) : (
                      <VisibilityOutlinedIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <AuthError>{error}</AuthError>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mt: 1, mb: 2.5 }}
        >
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                name="remember"
                sx={{
                  color: "var(--icon-muted)",
                  "&.Mui-checked": { color: "var(--accent)" },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: 13, color: "var(--text-2)" }}>
                Remember me
              </Typography>
            }
          />
          <Link
            href="#"
            sx={{
              fontSize: 13,
              color: "var(--text-2)",
              textDecoration: "none",
              "&:hover": { color: "var(--accent-soft)", textDecoration: "underline" },
            }}
          >
            Forgot password?
          </Link>
        </Stack>

        <Button type="submit" disabled={submitting} sx={authPrimaryButtonSx}>
          {submitting ? (
            <>
              <CircularProgress size={16} sx={{ color: "#fff !important", mr: 1 }} />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </Box>
    </AuthShell>
  );
};

export default Login;

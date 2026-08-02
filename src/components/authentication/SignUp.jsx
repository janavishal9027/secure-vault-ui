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
import {
  EmailOutlined,
  LockOutlined,
  LockResetOutlined,
  Person2Outlined,
} from "@mui/icons-material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import GoogleIcon from "@mui/icons-material/Google";
import GitHubIcon from "@mui/icons-material/GitHub";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { registerService } from "../store/services/RegisterService";
import { loginService } from "../store/services/LoginService";
import { authBaseUrl } from "../utils/url";
import { authentication } from "../utils/configEnv";
import AuthShell, {
  AuthDivider,
  AuthError,
  authFieldSx,
  authPrimaryButtonSx,
  authProviderButtonSx,
} from "./AuthShell";

const SignUp = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !formData.username ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return setError("All fields are required");
    }
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }
    if (!formData.agree) {
      return setError("You must agree to the Terms & Conditions");
    }

    try {
      setLoading(true);
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };

      const response = await registerService(payload);

      if (response.status === 200 || response.status === 201) {
        // Auto-login after successful registration
        const loginRes = await loginService({
          username: payload.username,
          password: payload.password,
        });
        localStorage.setItem("JWT_TOKEN", loginRes.data.jwtToken);
        localStorage.setItem("ROLES", loginRes.data.roles);
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      if (error.response) {
        return setError(error.response.data.message || "Registration failed");
      }
      return setError("Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  const passwordAdornment = (
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
  );

  return (
    <AuthShell
      title="Create your account"
      subtitle="Secure, AI-powered notes — set up in under a minute."
      footer={
        <Typography sx={{ fontSize: 13, color: "var(--text-2)" }}>
          Already have an account?{" "}
          <Link
            component={RouterLink}
            to="/login"
            sx={{
              color: "var(--accent-soft)",
              fontWeight: 600,
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Sign in
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

      <AuthDivider label="or sign up with" />

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            sx={authFieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person2Outlined fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            sx={authFieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlined fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            sx={authFieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: passwordAdornment,
            }}
          />

          <TextField
            fullWidth
            label="Confirm password"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            sx={authFieldSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockResetOutlined fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <AuthError>{error}</AuthError>

        <FormControlLabel
          sx={{ mt: 1, mb: 2, alignItems: "flex-start" }}
          control={
            <Checkbox
              size="small"
              name="agree"
              checked={formData.agree}
              onChange={handleChange}
              sx={{
                pt: 0.25,
                color: "var(--icon-muted)",
                "&.Mui-checked": { color: "var(--accent)" },
              }}
            />
          }
          label={
            <Typography sx={{ fontSize: 13, color: "var(--text-2)" }}>
              I agree to the{" "}
              <Link
                href="#"
                sx={{
                  color: "var(--accent-soft)",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Terms &amp; Conditions
              </Link>
            </Typography>
          }
        />

        <Button type="submit" disabled={loading} sx={authPrimaryButtonSx}>
          {loading ? (
            <>
              <CircularProgress size={16} sx={{ color: "#fff !important", mr: 1 }} />
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </Box>
    </AuthShell>
  );
};

export default SignUp;

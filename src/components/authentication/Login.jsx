import {
  Box,
  Button,
  CardContent,
  Checkbox,
  Divider,
  TextField,
  Typography,
  Link,
  Stack,
  Paper,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import { Link as RouterLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";
import { authBaseUrl } from "../utils/url.js";
import { authentication } from "../utils/configEnv.js";
import { loginService } from "../store/services/LoginService.js";
import { get2FAStatusService } from "../store/services/AuthService.js";
import GoogleIcon from "@mui/icons-material/Google";
import GitHubIcon from "@mui/icons-material/GitHub";

const Login = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const credentials = {
      username: data.get("username"),
      password: data.get("password"),
    };

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
      if (err?.response?.status === 401) {
        enqueueSnackbar(err.response.data.message, { variant: "error" });
      } else {
        enqueueSnackbar("Login failed. Please try again.", {
          variant: "error",
        });
      }
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        // backgroundColor: "#0a1a2f",
      }}
    >
      <Paper
        elevation={8} // max elevation for a strong shadow
        sx={{
          borderRadius: "24px",
          boxShadow: "0 20px 60px rgb(0, 0, 0)",
          background: "rgba(255, 255, 255, 0.67)",
          maxWidth: 520,
          width: "100%",
          p: 3,
        }}
      >
        <CardContent>
          <Typography
            variant="h4"
            align="center"
            sx={{ fontWeight: 700, mb: 1 }}
          >
            Welcome back
          </Typography>
          <Typography align="center" sx={{ mb: 3, color: "text.secondary" }}>
            Please enter your username and password
          </Typography>

          {/* OAuth Buttons */}
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mb: 2 }}
          >
            <Button
              fullWidth
              variant="contained"
              startIcon={<GoogleIcon />}
              component="a"
              href={`${authBaseUrl}${authentication}/oauth2/authorization/google`}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 3,
                color: "#000",
                bgcolor: "#ffffff00",
                "&:hover": { bgcolor: "#b3b0b0" },
              }}
            >
              Google
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<GitHubIcon />}
              component="a"
              href={`${authBaseUrl}${authentication}/oauth2/authorization/github`}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 3,
                color: "#000",
                bgcolor: "#ffffff04",
                "&:hover": { bgcolor: "#b3b0b0" },
              }}
            >
              GitHub
            </Button>
          </Stack>

          <Divider sx={{ my: 2, fontWeight: "bold" }}>Or</Divider>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoFocus
              InputProps={{
                startAdornment: <PersonOutlineOutlinedIcon sx={{ mr: 1 }} />,
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              InputProps={{
                startAdornment: <LockOutlinedIcon sx={{ mr: 1 }} />,
              }}
            />

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 1 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", mt: 1 }}>
                <Checkbox
                  size="small"
                  name="agree"
                  sx={{
                    mr: 1,
                    color: "rgba(0,0,0,0.7)",
                    "&.Mui-checked": {
                      color: "#6C63FF",
                    },
                  }}
                />
                <Typography sx={{ color: "#000", userSelect: "none" }}>
                  Remember me
                </Typography>
                <Link href="#" variant="body2" sx={{ ml: "auto"}}>
                  Forgot password?
                </Link>
              </Box>
            </Stack>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
              sx={{
                backgroundColor: "#f45b78",
                borderRadius: 10,
                mt: 1,
                py: 1.3,
                textTransform: "none",
                fontSize: "16px",
                "&:hover": {
                  backgroundColor: "#db3856",
                },
              }}
            >
              Login
            </Button>

            <Typography align="center" variant="body2" sx={{ mt: 1.3 }}>
              or{" "}
              <Link
                component={RouterLink}
                to="/signUp"
                sx={{
                  color: "#df2626",
                  textDecoration: "none",
                  fontWeight: 600,
                  "&:hover": {
                    color: "#6C63FF",
                    textDecoration: "underline",
                  },
                }}
              >
                Register!
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Paper>
    </Box>
  );
};

export default Login;

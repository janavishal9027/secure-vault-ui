import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Checkbox,
  Divider,
  Link,
  Stack,
  InputAdornment,
} from "@mui/material";
import {
  EmailOutlined,
  PasswordOutlined,
  Person2Outlined,
  PasswordRounded,
} from "@mui/icons-material";
import { registerService } from "../store/services/RegisterService";
import { authBaseUrl } from "../utils/url";
import { authentication } from "../utils/configEnv";
import GoogleIcon from "@mui/icons-material/Google";
import GitHubIcon from "@mui/icons-material/GitHub";
import { Link as RouterLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  // const [code, setCode] = useState("+91");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });
  const navigate = useNavigate();

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
      return setError("Password do not match");
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
        // Redirect straight to login; pass a flag so the login page can show
        // a "created successfully" message if it wants to.
        navigate("/login", {
          replace: true,
          state: { registered: true },
        });
      }
    } catch (error) {
      if (error.response) {
        return setError(error.response.data.message || "Registration failed");
      } else {
        return setError("Server not reachable");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={24}
        sx={{
          width: "100%",
          maxWidth: 520,
          p: { xs: 3, sm: 5 },
          borderRadius: "24px",
          background: "rgba(255, 255, 255, 0.67)",
          boxShadow: "0 20px 60px rgb(0, 0, 0)",
        }}
      >
        {/* Header */}
        <Typography variant="h5" fontWeight="bold" color="rgba(0, 0, 0, 0.99)">
          Create Account
        </Typography>

        <Typography sx={{ mt: 1, mb: 1.5, color: "rgba(0, 0, 0, 0.99)" }}>
          Already have an account?{" "}
          <Link
            component={RouterLink}
            to="/login"
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
            login
          </Link>
        </Typography>

        {/* Social Buttons */}
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

        {/* Divider */}
        <Box sx={{ display: "flex", alignItems: "center", my: 1 }}>
          <Divider sx={{ flex: 1 }} />
          <Typography sx={{ mx: 2 }} color="text.secondary">
            or sign up with
          </Typography>
          <Divider sx={{ flex: 1 }} />
        </Box>

        {/* Form Fields */}
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Username"
              name="username"
              type="username"
              value={formData.username}
              onChange={handleChange}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person2Outlined />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PasswordOutlined />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />

            <TextField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PasswordRounded />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
            />

            {/* <TextField
              label="Mobile"
              name="phoneNumber"
              fullWidth
              value={formData.phoneNumber}
              onChange={handleChange}
              type="tel"
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Select
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        variant="standard"
                        disableUnderline
                        sx={{
                          mr: 1,
                          minWidth: 60,
                          fontSize: 14,
                        }}
                      >
                        <MenuItem value="+91">+91</MenuItem>
                        <MenuItem value="+1">+1</MenuItem>
                        <MenuItem value="+44">+44</MenuItem>
                        <MenuItem value="+61">+61</MenuItem>
                      </Select>
                      <PhoneAndroidOutlined
                        sx={{ color: "action.active", fontSize: 20 }}
                      />
                    </Box>
                  </InputAdornment>
                ),
              }}
            /> */}

            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              <Checkbox
                size="small"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
                sx={{
                  mr: 1,
                  color: "rgba(0,0,0,0.7)",
                  "&.Mui-checked": {
                    color: "#6C63FF",
                  },
                }}
              />
              <Typography sx={{ color: "#000", userSelect: "none" }}>
                I agree to the Terms & Conditions
              </Typography>
            </Box>

            {error && (
              <Typography color="error" fontSize={14}>
                {error}
              </Typography>
            )}

            {/* Sign Up Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: "#f45b78",
                borderRadius: 10,
                py: 1.3,
                textTransform: "none",
                fontSize: "16px",
                "&:hover": {
                  backgroundColor: "#db3856",
                },
              }}
            >
              {loading ? "Creating Account..." : "SIGN UP"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default SignUp;

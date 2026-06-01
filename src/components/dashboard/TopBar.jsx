import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import { useNavigate } from "react-router-dom";

import { useThemeMode } from "../theme/ThemeModeContext";

// VaultGPT button — solid dark blue with white text/icon (fixed in both themes).
const vaultGptButtonSx = {
  color: "#ffffff",
  backgroundColor: "#1e3a8a",
  borderRadius: "999px",
  px: 2.2,
  textTransform: "none",
  fontWeight: 600,
  boxShadow: "none",
  "& .MuiButton-startIcon": { color: "#ffffff" },
  "&:hover": {
    backgroundColor: "#1d4ed8",
    boxShadow: "none",
  },
};

const vaultGptIconSx = {
  color: "#ffffff",
  backgroundColor: "#1e3a8a",
  "&:hover": { backgroundColor: "#1d4ed8" },
};

const VAULTGPT_TAGLINE = (
  <Box sx={{ maxWidth: 260, py: 0.5 }}>
    <Typography sx={{ fontWeight: 700, fontSize: 13, mb: 0.5 }}>
      Secure Knowledge. Powered by AI.
    </Typography>
    <Typography sx={{ fontSize: 12, color: "rgba(var(--ov),0.85)", lineHeight: 1.5 }}>
      AI-powered note management built for security and simplicity. Organize
      knowledge, uncover insights, and stay productive.
    </Typography>
  </Box>
);

export default function TopBar() {
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeMode();
  const [profileAnchor, setProfileAnchor] = useState(null);

  // Buttons collapse to icon-only on screens narrower than `sm` (600px).
  const showLabels = { xs: "none", sm: "inline-flex" };
  const showIconOnly = { xs: "inline-flex", sm: "none" };

  const openProfileMenu = (event) => setProfileAnchor(event.currentTarget);
  const closeProfileMenu = () => setProfileAnchor(null);

  const handleSettings = () => {
    closeProfileMenu();
    navigate("/dashboard/2fa-settings");
  };

  const handleLogout = () => {
    closeProfileMenu();
    localStorage.removeItem("JWT_TOKEN");
    localStorage.removeItem("ROLES");
    // Legacy keys set by some flows — clear them too, just in case.
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    navigate("/login");
  };

  const handleToggleTheme = () => {
    closeProfileMenu();
    toggleMode();
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        flexWrap: { xs: "nowrap", md: "nowrap" },
        mb: { xs: 3, md: 6 },
      }}
    >
      <Stack
        direction="row"
        spacing={1.2}
        alignItems="center"
        sx={{ minWidth: 0, flexShrink: 1 }}
      >
        <MenuBookRoundedIcon
          sx={{ color: "var(--text)", fontSize: { xs: 22, md: 24 } }}
        />
        <Typography
          variant="h6"
          sx={{
            color: "var(--text)",
            fontWeight: 700,
            letterSpacing: 0.2,
            fontSize: { xs: 16, sm: 18, md: 20 },
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Secure VAULT
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={{ xs: 0.75, sm: 1.5 }}
        alignItems="center"
        sx={{ flexShrink: 0 }}
      >
        {/* Full labelled button on >= sm */}
        <Tooltip title={VAULTGPT_TAGLINE} arrow>
          <Button
            startIcon={<AutoAwesomeRoundedIcon />}
            variant="contained"
            onClick={() => navigate("/dashboard/ai-chat")}
            sx={{ ...vaultGptButtonSx, display: showLabels }}
          >
            VaultGPT
          </Button>
        </Tooltip>

        {/* Icon-only button on < sm */}
        <Tooltip title={VAULTGPT_TAGLINE} arrow>
          <IconButton
            onClick={() => navigate("/dashboard/ai-chat")}
            sx={{ ...vaultGptIconSx, display: showIconOnly }}
            size="small"
          >
            <AutoAwesomeRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Account">
          <IconButton
            onClick={openProfileMenu}
            aria-label="Account menu"
            size="small"
            sx={{ p: 0.25, ml: { xs: 0.25, sm: 0.5 } }}
          >
            <Avatar
              sx={{
                width: { xs: 32, md: 38 },
                height: { xs: 32, md: 38 },
                bgcolor: "#2a7c36",
                fontSize: { xs: 14, md: 16 },
                fontWeight: 700,
              }}
            >
              V
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={closeProfileMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 180,
              background: "var(--surface)",
              color: "var(--text)",
              borderRadius: 2,
              border: "1px solid rgba(var(--ov),0.08)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              "& .MuiMenuItem-root": { fontSize: 14, py: 1 },
              "& .MuiListItemIcon-root": {
                color: "rgba(var(--ov),0.7)",
                minWidth: 32,
              },
              "& .MuiMenuItem-root:hover": {
                backgroundColor: "rgba(var(--ov),0.06)",
              },
            },
          }}
        >
          <MenuItem onClick={handleToggleTheme}>
            <ListItemIcon>
              {mode === "dark" ? (
                <LightModeRoundedIcon fontSize="small" />
              ) : (
                <DarkModeRoundedIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText>
              {mode === "dark" ? "Light mode" : "Dark mode"}
            </ListItemText>
          </MenuItem>

          <Divider sx={{ borderColor: "rgba(var(--ov),0.08)", my: 0.5 }} />

          <MenuItem onClick={handleSettings}>
            <ListItemIcon>
              <SettingsRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>

          <Divider sx={{ borderColor: "rgba(var(--ov),0.08)", my: 0.5 }} />

          <MenuItem
            onClick={handleLogout}
            sx={{
              color: "#ff6b6b",
              "& .MuiListItemIcon-root": { color: "#ff6b6b !important" },
            }}
          >
            <ListItemIcon>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Stack>
    </Box>
  );
}

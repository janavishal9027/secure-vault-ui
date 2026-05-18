import {
  Avatar,
  Box,
  Button,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { useNavigate } from "react-router-dom";

import AiSearchDialog from "../ai/AiSearchDialog";

const pillButtonSx = {
  color: "#e9edf7",
  borderColor: "rgba(255,255,255,0.14)",
  borderRadius: "999px",
  px: 2.2,
  textTransform: "none",
  backgroundColor: "rgba(255,255,255,0.03)",
  "&:hover": {
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
};

const iconButtonSx = {
  color: "#e9edf7",
  border: "1px solid rgba(255,255,255,0.14)",
  backgroundColor: "rgba(255,255,255,0.03)",
  "&:hover": {
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
};

export default function TopBar() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  // Buttons collapse to icon-only on screens narrower than `sm` (600px).
  const showLabels = { xs: "none", sm: "inline-flex" };
  const showIconOnly = { xs: "inline-flex", sm: "none" };

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
          sx={{ color: "#f5f7fb", fontSize: { xs: 22, md: 24 } }}
        />
        <Typography
          variant="h6"
          sx={{
            color: "#f5f7fb",
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
        {/* Full labelled buttons on >= sm */}
        <Button
          startIcon={<SearchRoundedIcon />}
          variant="outlined"
          onClick={() => setSearchOpen(true)}
          sx={{ ...pillButtonSx, display: showLabels }}
        >
          Search
        </Button>
        <Button
          startIcon={<AutoAwesomeRoundedIcon />}
          variant="outlined"
          onClick={() => navigate("/dashboard/ai-chat")}
          sx={{ ...pillButtonSx, display: showLabels }}
        >
          Chat with AI
        </Button>
        <Button
          startIcon={<SettingsRoundedIcon />}
          variant="outlined"
          onClick={() => navigate("/dashboard/2fa-settings")}
          sx={{ ...pillButtonSx, display: showLabels }}
        >
          Settings
        </Button>

        {/* Icon-only buttons on < sm */}
        <Tooltip title="Search">
          <IconButton
            onClick={() => setSearchOpen(true)}
            sx={{ ...iconButtonSx, display: showIconOnly }}
            size="small"
          >
            <SearchRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Chat with AI">
          <IconButton
            onClick={() => navigate("/dashboard/ai-chat")}
            sx={{ ...iconButtonSx, display: showIconOnly }}
            size="small"
          >
            <AutoAwesomeRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings">
          <IconButton
            onClick={() => navigate("/dashboard/2fa-settings")}
            sx={{ ...iconButtonSx, display: showIconOnly }}
            size="small"
          >
            <SettingsRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>

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
      </Stack>

      <AiSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Box>
  );
}

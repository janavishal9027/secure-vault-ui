import {
    Box,
  Button,
  Dialog,
  DialogContent,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SessionExpiredHandler = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionExpired = () => {
      setOpen(true);
    };

    window.addEventListener("session-expired", handleSessionExpired);

    return () => {
      window.removeEventListener("session-expired", handleSessionExpired);
    };
  }, []);

  const handleRedirect = () => {
    setOpen(false);
    navigate("/login");
  };

  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          // Follows the theme rather than pinning the old dark card colour:
          // a hardcoded dark dialog is the one surface that stays dark when
          // the rest of the app is light.
          color: "var(--text)",
          borderRadius: 3,
          minWidth: { xs: "auto", sm: 420 },
          width: { xs: "calc(100vw - 64px)", sm: "auto" },
          border: "1px solid rgba(var(--ov),0.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
        },
      }}
    >
      <DialogContent>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          Session Expired
        </Typography>

        <Typography
          variant="body2"
          sx={{ color: "var(--text-2)", mb: 3 }}
        >
          Your session has expired. Please log in again to continue using the
          application.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            onClick={handleRedirect}
            sx={{
              borderRadius: "999px",
              textTransform: "none",
              color: "#a855f7",
              borderColor: "#a855f7",
              "&:hover": {
                backgroundColor: "rgba(168,85,247,0.1)",
                borderColor: "#c084fc",
              },
            }}
          >
            LOGIN AGAIN!
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SessionExpiredHandler;

import React from "react";
import { Box, Container, Typography, Paper } from "@mui/material";
import SecurityOutlinedIcon from "@mui/icons-material/SecurityOutlined";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

const features = [
  {
    title: "2FA Protection",
    description: "Mandatory two-factor authentication keeps your notes safe",
    icon: <SecurityOutlinedIcon sx={{ fontSize: 22, color: "#6C63FF" }} />,
    iconBg: "rgba(108, 99, 255, 0.12)",
  },
  {
    title: "Voice Commands",
    description: "Create notes hands-free with speech-to-text technology",
    icon: <MicNoneOutlinedIcon sx={{ fontSize: 22, color: "#00E5C7" }} />,
    iconBg: "rgba(0, 229, 199, 0.12)",
  },
  {
    title: "Role-Based Access",
    description: "Customer, Admin, and Delegate roles with distinct permissions",
    icon: <Groups2OutlinedIcon sx={{ fontSize: 22, color: "#FFC107" }} />,
    iconBg: "rgba(255, 193, 7, 0.12)",
  },
  {
    title: "Private & Secure",
    description: "Each user can only see and manage their own notes",
    icon: <LockOutlinedIcon sx={{ fontSize: 22, color: "#FF4D6D" }} />,
    iconBg: "rgba(255, 77, 109, 0.12)",
  },
];

export default function WhyChooseSecureNotes() {
  return (
    <Box
      sx={{
        background: "#01041f",
        py: { xs: 5, md: 6 },
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            textAlign: "center",
            mb: { xs: 4, md: 5 },
            maxWidth: 760,
            mx: "auto",
          }}
        >
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 800,
              fontSize: { xs: "2rem", md: "2.8rem" },
              lineHeight: 1.15,
              mb: 1.5,
            }}
          >
            Why Choose{" "}
            <Box
              component="span"
              sx={{
                background: "linear-gradient(90deg, #6C63FF, #8B7CFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SecureNotes
            </Box>
            ?
          </Typography>

          <Typography
            sx={{
              color: "rgba(255,255,255,0.68)",
              fontSize: { xs: "0.95rem", md: "1.05rem" },
              lineHeight: 1.7,
              maxWidth: 700,
              mx: "auto",
            }}
          >
            Built with security-first approach, offering role-based access and
            voice-powered note creation.
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            alignItems: "stretch",
          }}
        >
          {features.map((feature, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 2.75,
                minHeight: 180,
                borderRadius: "18px",
                background: "#0B0F46",
                border: "1px solid rgba(255,255,255,0.06)",
                boxSizing: "border-box",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                transition: "0.25s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  borderColor: "rgba(108,99,255,0.35)",
                },
              }}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "14px",
                  background: feature.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2.25,
                }}
              >
                {feature.icon}
              </Box>

              <Typography
                sx={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "1rem",
                  mb: 1.25,
                  lineHeight: 1.35,
                }}
              >
                {feature.title}
              </Typography>

              <Typography
                sx={{
                  color: "rgba(255,255,255,0.68)",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                }}
              >
                {feature.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
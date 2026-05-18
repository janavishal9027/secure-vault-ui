import React from "react";
import {
  Box,
  Chip,
  Container,
  Typography,
  Stack,
} from "@mui/material";
import MicNoneIcon from "@mui/icons-material/MicNone";
import { useNavigate } from "react-router-dom";

export default function VoiceCommandsBanner() {
  const navigate = useNavigate();

  const handleVoiceCommandClick = () => {
    navigate("/login");
  };

  return (
    <Box
      sx={{
        minHeight: "50vh",
        bgcolor: "#01041f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "28px",
            minHeight: { xs: 320, md: 290 },
            display: "flex",
            alignItems: "center",
            px: { xs: 3, md: 6 },
            py: { xs: 4, md: 9 },
            backgroundImage: `
              linear-gradient(
                90deg,
                rgba(6,10,45,0.95) 0%,
                rgba(8,12,48,0.88) 22%,
                rgba(8,12,48,0.48) 45%,
                rgba(8,12,48,0.20) 70%,
                rgba(8,12,48,0.55) 100%
              ),
              url("https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80")
            `,
            backgroundSize: "cover",
            backgroundPosition: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(3,6,35,0.9) 0%, rgba(3,6,35,0.55) 35%, rgba(3,6,35,0.08) 65%, rgba(3,6,35,0.35) 100%)",
            }}
          />

          <Box
            sx={{
              position: "absolute",
              right: { xs: "-10%", md: "10%" },
              top: "50%",
              transform: "translateY(-50%)",
              width: { xs: 260, md: 520 },
              height: { xs: 140, md: 220 },
              opacity: 0.9,
              pointerEvents: "none",
            }}
          >
            <svg
              viewBox="0 0 600 220"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#52e5ff" />
                  <stop offset="50%" stopColor="#9ac7ff" />
                  <stop offset="100%" stopColor="#b687ff" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <polyline
                fill="none"
                stroke="url(#waveGradient)"
                strokeWidth="2.5"
                filter="url(#glow)"
                points="
                  0,110 20,108 40,111 60,106 80,114 100,92 120,130 140,82 160,145
                  180,70 200,158 220,64 240,170 260,52 280,185 300,32 320,176
                  340,42 360,160 380,62 400,142 420,78 440,132 460,95 480,118
                  500,102 520,111 540,107 560,110 580,109 600,110
                "
              />
            </svg>
          </Box>

          <Box
            sx={{
              position: "absolute",
              bottom: 24,
              left: { xs: 24, md: 42 },
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              color: "rgba(117, 214, 255, 0.35)",
              fontSize: { xs: 16, md: 18 },
              fontWeight: 500,
              zIndex: 2,
            }}
          >
            <MicNoneIcon sx={{ fontSize: 34, opacity: 0.5 }} />
            <Typography
              sx={{
                color: "rgba(196, 219, 255, 0.28)",
                fontSize: { xs: "0.9rem", md: "1.05rem" },
                fontWeight: 500,
              }}
            >
              VOICE-TO-TEXT: TRANSCRIBING...
            </Typography>
          </Box>

          <Stack
            spacing={2.5}
            sx={{
              position: "relative",
              zIndex: 2,
              maxWidth: { xs: "100%", md: 430 },
            }}
          >
            <Chip
              icon={<MicNoneIcon sx={{ color: "#1df0cf !important" }} />}
              label="Voice Commands"
              onClick={handleVoiceCommandClick}
              clickable
              sx={{
                width: "fit-content",
                color: "#1df0cf",
                fontWeight: 500,
                fontSize: "0.95rem",
                bgcolor: "rgba(7, 44, 67, 0.55)",
                border: "1px solid rgba(29, 240, 207, 0.28)",
                backdropFilter: "blur(8px)",
                px: 1,
                cursor: "pointer",
                transition: "all 0.2s ease",
                "& .MuiChip-label": {
                  px: 1,
                },
                "&:hover": {
                  bgcolor: "rgba(29, 240, 207, 0.18)",
                  borderColor: "rgba(29, 240, 207, 0.55)",
                  boxShadow: "0 0 16px rgba(29, 240, 207, 0.25)",
                  transform: "translateY(-1px)",
                },
                "&:focus-visible": {
                  outline: "2px solid rgba(29, 240, 207, 0.7)",
                  outlineOffset: 2,
                },
              }}
            />

            <Typography
              sx={{
                color: "#ffffff",
                fontWeight: 800,
                lineHeight: 1.05,
                fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
                maxWidth: 380,
              }}
            >
              Speak Your Notes Into Existence
            </Typography>

            <Typography
              sx={{
                color: "rgba(226, 233, 255, 0.82)",
                fontSize: { xs: "1rem", md: "1.1rem" },
                lineHeight: 1.75,
                maxWidth: 420,
              }}
            >
              Simply press the mic button and start talking. Our advanced
              speech-to-text technology captures your thoughts instantly with
              incredible accuracy.
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
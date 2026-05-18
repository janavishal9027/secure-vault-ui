import React from "react";
import {
  Box,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

const points = [
  "Mandatory 2FA after signup",
  "Role-based note isolation",
  "Encrypted storage",
  "Voice-command enabled for all roles",
];

export default function SecurityPrioritySection() {
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
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 4, md: 5 },
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Box
              sx={{
                width: "100%",
                maxWidth: 540,
                minHeight: { xs: 240, md: 300 },
                borderRadius: "24px",
                overflow: "hidden",
                position: "relative",
                border: "1px solid rgba(40,120,255,0.18)",
                boxShadow: "0 0 45px rgba(0,180,255,0.12)",
                background:
                  "radial-gradient(circle at center, rgba(0,140,255,0.22), rgba(3,8,30,0.95) 58%, rgba(2,7,35,1) 100%)",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(0,229,255,0.06), transparent 38%)",
                }}
              />

              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: { xs: 210, md: 270 },
                  height: { xs: 130, md: 165 },
                  borderRadius: "18px",
                  background:
                    "linear-gradient(180deg, rgba(48,54,64,0.92), rgba(8,11,18,0.98))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,0.45), inset 0 0 25px rgba(255,255,255,0.03)",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(120deg, rgba(255,255,255,0.14) 0%, transparent 22%, transparent 100%)",
                  }}
                />

                <Typography
                  sx={{
                    position: "absolute",
                    left: { xs: 24, md: 30 },
                    top: { xs: 18, md: 22 },
                    fontSize: { xs: "2rem", md: "2.4rem" },
                    filter: "drop-shadow(0 0 10px rgba(120,220,255,0.55))",
                  }}
                >
                  🌀
                </Typography>

                <Typography
                  sx={{
                    position: "absolute",
                    right: { xs: 24, md: 30 },
                    top: { xs: 18, md: 20 },
                    color: "#86ff96",
                    fontSize: { xs: "3rem", md: "3.7rem" },
                    fontWeight: 700,
                    lineHeight: 1,
                    textShadow: "0 0 18px rgba(134,255,150,0.55)",
                  }}
                >
                  ✓
                </Typography>

                <Typography
                  sx={{
                    position: "absolute",
                    left: { xs: 26, md: 34 },
                    bottom: { xs: 16, md: 18 },
                    fontSize: { xs: "1.45rem", md: "1.7rem" },
                    filter: "drop-shadow(0 0 10px rgba(255,255,255,0.18))",
                  }}
                >
                  🔒
                </Typography>

                <Typography
                  sx={{
                    position: "absolute",
                    right: { xs: 20, md: 28 },
                    bottom: { xs: 18, md: 22 },
                    color: "#90f89b",
                    fontWeight: 700,
                    fontSize: { xs: "1rem", md: "1.25rem" },
                    textShadow: "0 0 14px rgba(144,248,155,0.35)",
                  }}
                >
                  2FA SECURE
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ maxWidth: 560 }}>
            <Chip
              icon={<LockOutlinedIcon sx={{ color: "#ff4d6d !important" }} />}
              label="Instant Secure Card"
              sx={{
                mb: 2.5,
                height: 34,
                color: "#ff4d6d",
                fontWeight: 500,
                bgcolor: "rgba(255,77,109,0.08)",
                border: "1px solid rgba(255,77,109,0.18)",
                "& .MuiChip-label": {
                  px: 1,
                },
              }}
            />

            <Typography
              sx={{
                color: "#fff",
                fontWeight: 800,
                lineHeight: 1.15,
                fontSize: { xs: "2rem", md: "3rem" },
                mb: 2,
              }}
            >
              Your Security,{" "}
              <Box
                component="span"
                sx={{
                  background: "linear-gradient(90deg, #00d4ff, #00e0b8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Our Priority
              </Box>
            </Typography>

            <Typography
              sx={{
                color: "rgba(255,255,255,0.72)",
                fontSize: { xs: "1rem", md: "1.08rem" },
                lineHeight: 1.7,
                mb: 3,
              }}
            >
              After signing up, 2-factor authentication is mandatory. Your notes
              are encrypted and accessible only by you. No one else can see,
              edit, or delete your personal notes.
            </Typography>

            <Stack spacing={2}>
              {points.map((item) => (
                <Stack
                  key={item}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      minWidth: 22,
                      borderRadius: "50%",
                      bgcolor: "rgba(0,224,184,0.18)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 14px rgba(0,224,184,0.12)",
                    }}
                  >
                    <CheckCircleRoundedIcon
                      sx={{ fontSize: 14, color: "#00dcb8" }}
                    />
                  </Box>

                  <Typography
                    sx={{
                      color: "#f2f4ff",
                      fontSize: { xs: "0.98rem", md: "1rem" },
                      lineHeight: 1.5,
                    }}
                  >
                    {item}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
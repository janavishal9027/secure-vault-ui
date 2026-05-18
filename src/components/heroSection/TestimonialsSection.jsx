import React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Avatar,
  Stack,
} from "@mui/material";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";

const testimonials = [
  {
    quote: "Role-based access is exactly what our team needed!",
    name: "Emily K.",
    date: "12/3/2026",
    initial: "E",
  },
  {
    quote: "Voice-to-text accuracy is impressive. Love it!",
    name: "Mike R.",
    date: "12/3/2026",
    initial: "M",
  },
  {
    quote: "2FA makes me feel so much more secure about my notes.",
    name: "Sarah M.",
    date: "11/3/2026",
    initial: "S",
  },
  {
    quote: "This app is amazing! The voice command feature saves me so much time.",
    name: "John D.",
    date: "11/3/2026",
    initial: "J",
  },
];

export default function TestimonialsSection() {
  return (
    <Box
      sx={{
        background: "#01041f",
        py: { xs: 6, md: 8 },
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            textAlign: "center",
            mb: { xs: 4, md: 5 },
          }}
        >
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 800,
              fontSize: { xs: "2rem", md: "2.8rem" },
              lineHeight: 1.15,
              mb: 1,
            }}
          >
            What Users Say
          </Typography>

          <Typography
            sx={{
              color: "rgba(255,255,255,0.65)",
              fontSize: { xs: "0.95rem", md: "1.05rem" },
            }}
          >
            Real feedback from our community
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
          {testimonials.map((item, index) => (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 2.5,
                minHeight: 210,
                borderRadius: "16px",
                background: "#0B0F46",
                border: "1px solid rgba(255,255,255,0.06)",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "0.25s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  borderColor: "rgba(108,99,255,0.28)",
                },
              }}
            >
              <Box>
                <ChatBubbleOutlineRoundedIcon
                  sx={{
                    color: "#4C4DCC",
                    fontSize: 28,
                    mb: 2,
                  }}
                />

                <Typography
                  sx={{
                    color: "#fff",
                    fontStyle: "italic",
                    fontSize: "1rem",
                    lineHeight: 1.65,
                    minHeight: 88,
                  }}
                >
                  “{item.quote}”
                </Typography>
              </Box>

              <Box
                sx={{
                  mt: 2.5,
                  pt: 2,
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      fontSize: 14,
                      fontWeight: 700,
                      background: "linear-gradient(135deg,#6C63FF,#22D3EE)",
                      color: "#fff",
                    }}
                  >
                    {item.initial}
                  </Avatar>

                  <Box>
                    <Typography
                      sx={{
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.98rem",
                        lineHeight: 1.2,
                      }}
                    >
                      {item.name}
                    </Typography>

                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.58)",
                        fontSize: "0.9rem",
                        mt: 0.2,
                      }}
                    >
                      {item.date}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
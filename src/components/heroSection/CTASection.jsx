import React from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        background: "#01041f",
        py: { xs: 6, md: 8 },   // top & bottom spacing
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            textAlign: "center",
            mx: "auto",
            maxWidth: "720px",
          }}
        >
          {/* Heading */}
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 800,
              fontSize: { xs: "2rem", md: "2.6rem" },
              lineHeight: 1.2,
              mb: 2,
            }}
          >
            Ready to Secure Your{" "}
            <Box
              component="span"
              sx={{
                background: "linear-gradient(90deg,#6C63FF,#22D3EE)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Notes?
            </Box>
          </Typography>

          {/* Subtitle */}
          <Typography
            sx={{
              color: "rgba(255,255,255,0.7)",
              fontSize: { xs: "0.95rem", md: "1.05rem" },
              mb: 4,
            }}
          >
            Join thousands of users who trust SecureNotes for their digital
            note-taking needs.
          </Typography>

          {/* Button */}
          <Button
            onClick={() => navigate("/signUp")}
            endIcon={<ArrowForwardIcon />}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: "10px",
              fontWeight: 600,
              textTransform: "none",
              fontSize: "0.95rem",
              color: "#fff",
              background: "linear-gradient(90deg,#6C63FF,#16C79A)",
              "&:hover": {
                background: "linear-gradient(90deg,#5A54E8,#14B889)",
              },
            }}
          >
            Start Securing Your Notes
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
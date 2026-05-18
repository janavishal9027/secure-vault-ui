import {
  Box,
  Button,
  Container,
  Stack,
  Typography,
  Avatar,
  Chip,
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import StarIcon from "@mui/icons-material/Star";
import NotesImage from "../assets/notes.png";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const avatars = ["A", "B", "C", "D"];
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at 20% 20%, rgba(76, 110, 245, 0.12), transparent 22%),
          radial-gradient(circle at 75% 35%, rgba(0, 191, 255, 0.10), transparent 20%),
          radial-gradient(circle at 50% 80%, rgba(108, 99, 255, 0.08), transparent 24%),
          #020826
        `,
        color: "#fff",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            minHeight: "calc(100vh - 70px)",
            display: "flex",
            alignItems: "center",
            py: { xs: 6, md: 4 },
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
              alignItems: "center",
              gap: { xs: 5, md: 4 },
              width: "100%",
            }}
          >
            {/* LEFT CONTENT */}
            <Box sx={{ maxWidth: 520 }}>
              <Chip
                icon={
                  <BoltIcon
                    sx={{ color: "#FFC107 !important", fontSize: 18 }}
                  />
                }
                label="Voice-Powered Security"
                sx={{
                  mb: 3,
                  color: "#FFC107",
                  bgcolor: "rgba(108,99,255,0.12)",
                  border: "1px solid rgba(108,99,255,0.25)",
                  fontWeight: 500,
                  height: 36,
                  borderRadius: "999px",
                  px: 1,
                }}
              />

              <Typography
                sx={{
                  fontWeight: 800,
                  lineHeight: 0.95,
                  fontSize: { xs: "3rem", sm: "3.5rem", md: "5rem" },
                  letterSpacing: "-0.05em",
                  mb: 3,
                }}
              >
                Your Notes,
                <br />
                <Box
                  component="span"
                  sx={{
                    background:
                      "linear-gradient(90deg,#6C63FF,#20C5F7,#18D7C8)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Secured
                </Box>{" "}
                by
                <br />
                Voice
              </Typography>

              <Typography
                sx={{
                  color: "rgba(255,255,255,0.62)",
                  fontSize: { xs: "1rem", md: "1.05rem" },
                  lineHeight: 1.7,
                  maxWidth: 430,
                  mb: 4,
                }}
              >
                Create, manage, and protect your digital notes with voice
                commands, 2-factor authentication, and role-based access
                control.
              </Typography>

              <Stack
                direction="row"
                spacing={2}
                sx={{ mb: 5, flexWrap: "wrap" }}
              >
                <Button
                  variant="contained"
                  endIcon={<ChevronRightIcon />}
                  onClick={() => navigate("/signUp")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "10px",
                    px: 3.5,
                    py: 1.5,
                    background: "linear-gradient(90deg,#6C63FF,#18D7C8)",
                    boxShadow: "none",
                    minWidth: 190,
                    "&:hover": {
                      background: "linear-gradient(90deg,#6258ff,#14cfc0)",
                      boxShadow: "none",
                    },
                  }}
                >
                  Get Started Free
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => navigate("/login")}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: "10px",
                    px: 4,
                    py: 1.5,
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.16)",
                    minWidth: 120,
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.35)",
                      backgroundColor: "rgba(255,255,255,0.03)",
                    },
                  }}
                >
                  Login
                </Button>
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center">
                <Stack direction="row">
                  {avatars.map((letter, index) => (
                    <Avatar
                      key={letter}
                      sx={{
                        ml: index === 0 ? 0 : -1,
                        width: 36,
                        height: 36,
                        fontSize: 14,
                        fontWeight: 700,
                        background: "linear-gradient(135deg,#6C63FF,#22D3EE)",
                        border: "2px solid #020826",
                      }}
                    >
                      {letter}
                    </Avatar>
                  ))}
                </Stack>

                <Box>
                  <Stack direction="row" spacing={0.3}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon
                        key={i}
                        sx={{ color: "#FFC107", fontSize: 18 }}
                      />
                    ))}
                  </Stack>
                  <Typography
                    sx={{ color: "rgba(255,255,255,0.55)", fontSize: 14 }}
                  >
                    Trusted by 10,000+ users
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {/* RIGHT CONTENT */}
            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "center", md: "flex-end" },
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  maxWidth: "820px",
                  borderRadius: "32px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 0 40px rgba(34,211,238,0.18)",
                }}
              >
                <Box
                  component="img"
                  src={NotesImage}
                  alt="Secure voice notes"
                  sx={{
                    width: "100%",
                    maxWidth: { xs: 520, md: 820 },
                    height: "auto",
                    display: "block",
                    objectFit: "contain",
                    filter: "drop-shadow(0 8px 30px rgba(0,0,0,0.25))",
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

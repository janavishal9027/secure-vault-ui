import React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
} from "@mui/material";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const roles = [
  {
    title: "Customer",
    color: "#6C63FF",
    iconBg: "rgba(108,99,255,0.12)",
    items: [
      "Create up to 5 notes",
      "Voice command enabled",
      "Request upgrade to Admin",
      "View & manage own notes",
    ],
  },
  {
    title: "Admin",
    color: "#00E5C7",
    iconBg: "rgba(0,229,199,0.12)",
    items: [
      "Unlimited note creation",
      "Voice command enabled",
      "Full CRUD on own notes",
      "Enhanced access level",
    ],
  },
  {
    title: "Delegate",
    color: "#FFC107",
    iconBg: "rgba(255,193,7,0.12)",
    items: [
      "Manage own notes",
      "Approve/reject upgrades",
      "Voice command enabled",
      "User management powers",
    ],
  },
];

export default function RoleBasedAccessSection() {
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
            Role-Based Access Control
          </Typography>

          <Typography
            sx={{
              color: "rgba(255,255,255,0.65)",
              fontSize: { xs: "0.95rem", md: "1.05rem" },
            }}
          >
            Three distinct roles with unique permissions
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
            },
            alignItems: "stretch",
          }}
        >
          {roles.map((role) => (
            <Paper
              key={role.title}
              elevation={0}
              sx={{
                p: 3,
                minHeight: 290,
                borderRadius: "18px",
                background: "#0B0F46",
                border: "1px solid rgba(255,255,255,0.06)",
                borderTop: `3px solid ${role.color}`,
                boxSizing: "border-box",
                transition: "0.25s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: `0 10px 30px rgba(0,0,0,0.18)`,
                },
              }}
            >
              <Box
                sx={{
                  width: 58,
                  height: 58,
                  borderRadius: "16px",
                  background: role.iconBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 3,
                }}
              >
                <Groups2OutlinedIcon sx={{ color: role.color, fontSize: 30 }} />
              </Box>

              <Typography
                sx={{
                  color: role.color,
                  fontWeight: 800,
                  fontSize: { xs: "1.5rem", md: "1.7rem" },
                  mb: 2.5,
                }}
              >
                {role.title}
              </Typography>

              <Stack spacing={2}>
                {role.items.map((item) => (
                  <Stack
                    key={item}
                    direction="row"
                    spacing={1.2}
                    alignItems="flex-start"
                  >
                    <ChevronRightIcon
                      sx={{
                        color: role.color,
                        fontSize: 18,
                        mt: "2px",
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      sx={{
                        color: "rgba(255,255,255,0.72)",
                        fontSize: "1rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {item}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
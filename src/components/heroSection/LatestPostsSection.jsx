import React from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  CardMedia,
} from "@mui/material";

const posts = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1633412802994-5c058f151b66?auto=format&fit=crop&w=1200&q=80",
    author: "SecureNotes Team",
    date: "12/3/2026",
    title: "Role-Based Access: Why It Matters",
    description:
      "Understanding the importance of role-based access control in keeping your notes private...",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    author: "SecureNotes Team",
    date: "12/3/2026",
    title: "Voice Commands: The Future of Note-Taking",
    description:
      "Discover how voice-to-text technology revolutionizes the way you capture ideas and...",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
    author: "SecureNotes Team",
    date: "10/3/2026",
    title: "Getting Started with Secure Notes",
    description:
      "Learn how to create and manage your digital notes securely with voice commands and 2-...",
  },
];

export default function LatestPostsSection() {
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
            Latest Posts
          </Typography>

          <Typography
            sx={{
              color: "rgba(255,255,255,0.65)",
              fontSize: { xs: "0.95rem", md: "1.05rem" },
            }}
          >
            Stay updated with our latest articles and tips
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
          {posts.map((post) => (
            <Paper
              key={post.id}
              elevation={0}
              sx={{
                overflow: "hidden",
                borderRadius: "16px",
                background: "#0B0F46",
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "0.25s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  borderColor: "rgba(108,99,255,0.28)",
                },
              }}
            >
              <CardMedia
                component="img"
                image={post.image}
                alt={post.title}
                sx={{
                  height: 170,
                  objectFit: "cover",
                }}
              />

              <Box sx={{ p: 2.5 }}>
                <Typography
                  sx={{
                    color: "#6C63FF",
                    fontSize: "0.95rem",
                    mb: 1.5,
                  }}
                >
                  {post.author} • {post.date}
                </Typography>

                <Typography
                  sx={{
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: { xs: "1.1rem", md: "1.25rem" },
                    lineHeight: 1.4,
                    mb: 1.5,
                  }}
                >
                  {post.title}
                </Typography>

                <Typography
                  sx={{
                    color: "rgba(255,255,255,0.68)",
                    fontSize: "0.98rem",
                    lineHeight: 1.65,
                  }}
                >
                  {post.description}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
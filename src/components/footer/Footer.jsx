
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import GitHubIcon from "@mui/icons-material/GitHub";
import YouTubeIcon from "@mui/icons-material/YouTube";
import { Box, Divider, IconButton, Stack, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <div>
        <Box
          component="footer"
          sx={{
            backgroundColor: "#0a1a2f", // dark navy
            color: "rgba(255,255,255,0.8)",
            textAlign: "center",
            py: 6,
          }}
        >
          {/* Top Links */}
          <Stack
            direction="row"
            spacing={4}
            justifyContent="center"
            flexWrap="wrap"
            sx={{ mb: 4 }}
          >
            {[
              "About",
              "Blog",
              "Jobs",
              "Press",
              "Accessibility",
              "Partners",
            ].map((link, index) => (
              <Link
                key={index}
                href="#"
                underline="hover"
                color="inherit"
                sx={{ fontSize: 15 }}
              >
                {link}
              </Link>
            ))}
          </Stack>

          {/* Social Icons */}
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mb: 3 }}
          >
            <IconButton color="inherit" size="small">
              <FacebookIcon />
            </IconButton>
            <IconButton color="inherit" size="small">
              <InstagramIcon />
            </IconButton>
            <IconButton color="inherit" size="small">
              <XIcon />
            </IconButton>
            <IconButton color="inherit" size="small">
              <GitHubIcon />
            </IconButton>
            <IconButton color="inherit" size="small">
              <YouTubeIcon />
            </IconButton>
          </Stack>

          <Divider
            sx={{
              backgroundColor: "rgba(255,255,255,0.1)",
              width: "80%",
              mx: "auto",
              mb: 2,
            }}
          />

          {/* Copyright */}
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
            © 2024 Your Company, Inc. All rights reserved.
          </Typography>
        </Box>
    </div>
  )
}

export default Footer

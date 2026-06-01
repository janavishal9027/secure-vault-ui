import React, { useState } from "react";
import { IconButton, Paper, TextField } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

export default function ChatInput() {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    console.log(message);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper
      sx={{
        mt: 2,
        px: 1.5,
        py: 1,
        borderRadius: "30px",
        background: "var(--surface)",
        border: "1px solid rgba(var(--ov),0.10)",
        display: "flex",
        alignItems: "center",
        gap: 1,
        minHeight: "46px",
        "&:focus-within": {
          borderColor: "#3b82f6",
          boxShadow: "0 0 0 2px rgba(59,130,246,0.18)",
        },
      }}
    >
      <TextField
        fullWidth
        placeholder="Type a message"
        variant="standard"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        InputProps={{
          disableUnderline: true,
          sx: {
            color: "var(--text)",
            px: 1,
            "& input": {
              color: "var(--text)",
              height: "24px",
              whiteSpace: "nowrap",
              overflowX: "auto",
              textOverflow: "clip",
              scrollbarWidth: "none",
            },
            "& input::-webkit-scrollbar": {
              display: "none",
            },
          },
        }}
      />

      <IconButton
        onClick={handleSend}
        sx={{
          color: "#ffffff",
          backgroundColor: "#2563eb",
          width: 38,
          height: 38,
          flexShrink: 0,
          "&:hover": {
            backgroundColor: "#1d4ed8",
          },
        }}
      >
        <ArrowForwardRoundedIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
}

import { Box, Card, Chip, Grid, Pagination, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";

const summaryChipSx = (status) => {
  if (status === "READY") {
    return {
      color: "var(--text)",
      backgroundColor: "rgba(34,197,94,0.22)",
      "& .MuiChip-icon": { color: "var(--success)" },
    };
  }
  if (status === "PENDING") {
    return {
      color: "var(--text)",
      backgroundColor: "rgba(99,102,241,0.22)",
      "& .MuiChip-icon": { color: "var(--accent-soft)" },
    };
  }
  return {
    color: "var(--text)",
    backgroundColor: "rgba(239,68,68,0.22)",
    "& .MuiChip-icon": { color: "var(--danger)" },
  };
};

const summaryChipLabel = (status) => {
  if (status === "READY") return "AI summary ready";
  if (status === "PENDING") return "Summarizing...";
  return "Summary failed";
};

const formatNoteDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  // The year is only worth the horizontal space when it is not the current
  // one — on a four-across grid the date shares a row with the summary chip.
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "numeric",
    minute: "2-digit",
  });
};

const SummaryChip = ({ status }) => {
  if (status !== "READY" && status !== "PENDING" && status !== "FAILED") {
    return null;
  }
  return (
    <Chip
      size="small"
      icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 14 }} />}
      label={summaryChipLabel(status)}
      sx={{
        height: 22,
        fontSize: 11,
        ...summaryChipSx(status),
      }}
    />
  );
};

const stripHtml = (html) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

const GRID_PAGE_SIZE = 8;
const LIST_PAGE_SIZE = 6;

export default function NotebookCard({ viewMode, notes, loading }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const pageSize = viewMode === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;
  const firstPageNotes = pageSize - 1;
  const totalPages =
    notes.length <= firstPageNotes
      ? 1
      : 1 + Math.ceil((notes.length - firstPageNotes) / pageSize);

  useEffect(() => {
    setPage(1);
  }, [viewMode, notes.length]);

  const pagedNotes = useMemo(() => {
    if (page === 1) return notes.slice(0, firstPageNotes);
    const start = firstPageNotes + (page - 2) * pageSize;
    return notes.slice(start, start + pageSize);
  }, [notes, page, pageSize, firstPageNotes]);

  const showCreateCard = page === 1;

  const handleCreateNote = () => {
    navigate("/dashboard/create-note");
  };

  const handleOpenNote = (note) => {
    const id = note?.noteId || note?.id;
    if (!id) return;
    navigate(`/dashboard/create-note?noteId=${encodeURIComponent(id)}`);
  };

  const CircleIcon = () => (
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        backgroundColor: "rgba(104, 97, 255, 0.20)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--accent-soft)",
      }}
    >
      <AddRoundedIcon />
    </Box>
  );

  const noteCardStyle = {
    height: 180,
    borderRadius: 4,
    p: 2,
    backgroundColor: "rgba(var(--ov),0.02)",
    border: "1px solid rgba(var(--ov),0.08)",
    boxShadow: "none",
    backgroundImage: "none",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  };

  const noteDateSx = {
    color: "var(--text-muted)",
    fontSize: 12,
    letterSpacing: 0.2,
    whiteSpace: "nowrap",
  };

  const cardStyle = {
    ...noteCardStyle,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.25s ease",
    "&:hover": {
      borderColor: "rgba(122, 134, 255, 0.35)",
      backgroundColor: "rgba(var(--ov),0.04)",
      transform: "translateY(-3px)",
    },
  };

  const listStyle = {
    p: 2,
    mb: 2,
    borderRadius: 3,
    backgroundColor: "rgba(var(--ov),0.02)",
    border: "1px solid rgba(var(--ov),0.08)",
    boxShadow: "none",
    backgroundImage: "none",
    cursor: "pointer",
  };

  const titleStyle = {
    color: "var(--text)",
    fontSize: 18,
    fontWeight: 500,
  };

  // Two lines, clamped on a line boundary. The title used to be `noWrap` on a
  // row it shared with the summary chip, so the chip's width came out of the
  // title's and every summarised note read "OAuth 2.0/ Client Au...".
  const noteTitleSx = {
    ...titleStyle,
    fontSize: 16,
    fontWeight: 600,
    lineHeight: "22px",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    overflowWrap: "anywhere",
  };

  const notePreviewSx = {
    color: "var(--text-2)",
    fontSize: 13,
    lineHeight: "18px",
    mt: 0.75,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    overflowWrap: "anywhere",
  };

  const containerSx = {
    height: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
  };

  const scrollAreaSx = {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    pr: 1,
    pt: 1.5,
  };

  const paginationSx = {
    flexShrink: 0,
    mt: 2,
    pt: 2,
    pb: 0.5,
    display: "flex",
    justifyContent: "center",
    borderTop: "1px solid rgba(var(--ov),0.06)",
    "& .MuiPaginationItem-root": {
      color: "var(--text-2)",
      borderColor: "rgba(var(--ov),0.12)",
    },
    "& .MuiPaginationItem-root.Mui-selected": {
      backgroundColor: "rgba(100, 108, 255, 0.22)",
      color: "var(--text)",
      borderColor: "rgba(122, 134, 255, 0.45)",
      "&:hover": {
        backgroundColor: "rgba(100, 108, 255, 0.30)",
      },
    },
  };

  if (loading) {
    return <Typography sx={{ color: "var(--text)" }}>Loading...</Typography>;
  }

  if (!notes.length) {
    return <Typography sx={{ color: "var(--text)" }}>No notes found</Typography>;
  }

  if (viewMode === "grid") {
    return (
      <Box sx={containerSx}>
        <Box sx={scrollAreaSx}>
          <Grid container spacing={2}>
            {showCreateCard && (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card onClick={handleCreateNote} sx={cardStyle}>
                  <Stack alignItems="center" spacing={2}>
                    <CircleIcon />
                    <Typography sx={titleStyle}>Create Note</Typography>
                  </Stack>
                </Card>
              </Grid>
            )}

            {pagedNotes.map((note) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={note.noteId}>
                <Card
                  onClick={() => handleOpenNote(note)}
                  sx={{
                    ...noteCardStyle,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "rgba(122, 134, 255, 0.35)",
                      backgroundColor: "rgba(var(--ov),0.04)",
                      transform: "translateY(-3px)",
                    },
                  }}
                >
                  {/* Title gets the full card width now — nothing shares its
                      row, so it wraps to two lines before it truncates. */}
                  <Typography sx={noteTitleSx}>
                    {note.title || "Untitled"}
                  </Typography>

                  <Typography sx={notePreviewSx}>
                    {note.summary || stripHtml(note.content) || "No content"}
                  </Typography>

                  {/* Footer, pinned to the bottom by `mt: auto`, so every card
                      in the row lines its metadata up at the same height
                      regardless of how long the title ran. */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ mt: "auto", pt: 1.25, minWidth: 0 }}
                  >
                    <Typography sx={{ ...noteDateSx, minWidth: 0 }} noWrap>
                      {formatNoteDate(note.createdAt)}
                    </Typography>
                    <Box sx={{ flexShrink: 0 }}>
                      <SummaryChip status={note.summaryStatus} />
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            shape="rounded"
            variant="outlined"
            sx={paginationSx}
          />
        )}
      </Box>
    );
  }

  return (
    <Box sx={containerSx}>
      <Box sx={scrollAreaSx}>
        {showCreateCard && (
          <Card onClick={handleCreateNote} sx={listStyle}>
            <Stack direction="row" spacing={2} alignItems="center">
              <CircleIcon />
              <Typography sx={titleStyle}>Create Note</Typography>
            </Stack>
          </Card>
        )}

        {pagedNotes.map((note) => (
          <Card
            key={note.noteId}
            onClick={() => handleOpenNote(note)}
            sx={{
              ...listStyle,
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "rgba(122, 134, 255, 0.35)",
                backgroundColor: "rgba(var(--ov),0.04)",
              },
            }}
          >
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              spacing={1}
            >
              <Typography sx={{ ...titleStyle, fontWeight: 600, minWidth: 0 }} noWrap>
                {note.title || "Untitled"}
              </Typography>
              <Stack
                direction="row"
                spacing={1.25}
                alignItems="center"
                sx={{ flexShrink: 0 }}
              >
                <SummaryChip status={note.summaryStatus} />
                {note.createdAt && (
                  <Typography sx={noteDateSx}>
                    {formatNoteDate(note.createdAt)}
                  </Typography>
                )}
              </Stack>
            </Stack>

            <Typography
              sx={{ color: "var(--text-2)", fontSize: 13.5, mt: 0.5 }}
              noWrap
            >
              {note.summary || stripHtml(note.content) || "No content"}
            </Typography>
          </Card>
        ))}
      </Box>

      {totalPages > 1 && (
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          shape="rounded"
          variant="outlined"
          sx={paginationSx}
        />
      )}
    </Box>
  );
}

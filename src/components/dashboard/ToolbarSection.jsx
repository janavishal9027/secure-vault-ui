import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import ViewListRoundedIcon from "@mui/icons-material/ViewListRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useNavigate } from "react-router-dom";

const DEFAULT_SORT_OPTIONS = {
  recent: "Most recent",
  oldest: "Oldest first",
  title: "Title A–Z",
};

export default function ToolbarSection({
  viewMode,
  setViewMode,
  searchQuery = "",
  setSearchQuery = () => {},
  sortMode = "recent",
  setSortMode = () => {},
  sortOptions = DEFAULT_SORT_OPTIONS,
}) {
  const navigate = useNavigate();
  const [sortAnchorEl, setSortAnchorEl] = useState(null);

  const handleCreateNote = () => {
    navigate("/dashboard/create-note");
  };

  const handleOpenSort = (e) => setSortAnchorEl(e.currentTarget);
  const handleCloseSort = () => setSortAnchorEl(null);
  const handleSelectSort = (key) => {
    setSortMode(key);
    handleCloseSort();
  };

  const sortLabel = sortOptions[sortMode] || sortOptions.recent;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        width: "100%",
        gap: { xs: 1.5, sm: 2 },
        mb: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1.8,
          py: 0.8,
          borderRadius: "999px",
          border: "1px solid rgba(var(--ov),0.10)",
          backgroundColor: "rgba(var(--ov),0.03)",
          width: { xs: "100%", sm: "100%", md: 360, lg: 420 },
          flexShrink: { xs: 1, md: 0 },
          flexGrow: { xs: 1, md: 0 },
          minWidth: 0,
          order: { xs: 1, md: 0 },
        }}
      >
        <SearchRoundedIcon sx={{ color: "var(--text-muted)", mr: 1 }} />
        <InputBase
          placeholder="Search notebooks"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          inputProps={{ "aria-label": "Search notebooks" }}
          sx={{ color: "var(--text)", width: "100%" }}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: { xs: "flex-start", md: "flex-end" },
          alignItems: "center",
          gap: { xs: 1, sm: 1.5 },
          flex: { xs: "1 1 100%", md: "1 1 auto" },
        }}
      >
        <Stack
          direction="row"
          spacing={0.5}
          sx={{
            p: 0.5,
            borderRadius: "999px",
            border: "1px solid rgba(var(--ov),0.10)",
            backgroundColor: "rgba(var(--ov),0.03)",
          }}
        >
          <IconButton
            size="small"
            onClick={() => setViewMode("grid")}
            aria-label="Grid view"
            sx={{
              color: viewMode === "grid" ? "var(--text)" : "var(--text-muted)",
              backgroundColor:
                viewMode === "grid"
                  ? "rgba(100, 108, 255, 0.18)"
                  : "transparent",
              "&:hover": {
                backgroundColor:
                  viewMode === "grid"
                    ? "rgba(100, 108, 255, 0.26)"
                    : "rgba(var(--ov),0.06)",
              },
            }}
          >
            <GridViewRoundedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setViewMode("list")}
            aria-label="List view"
            sx={{
              color: viewMode === "list" ? "var(--text)" : "var(--text-muted)",
              backgroundColor:
                viewMode === "list"
                  ? "rgba(100, 108, 255, 0.18)"
                  : "transparent",
              "&:hover": {
                backgroundColor:
                  viewMode === "list"
                    ? "rgba(100, 108, 255, 0.26)"
                    : "rgba(var(--ov),0.06)",
              },
            }}
          >
            <ViewListRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Button
          onClick={handleOpenSort}
          endIcon={
            <KeyboardArrowDownRoundedIcon
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            />
          }
          variant="outlined"
          sx={{
            color: "var(--text)",
            borderColor: "rgba(var(--ov),0.10)",
            borderRadius: "999px",
            px: { xs: 1.5, sm: 2 },
            minWidth: 0,
            textTransform: "none",
            whiteSpace: "nowrap",
            backgroundColor: "rgba(var(--ov),0.03)",
            "&:hover": {
              borderColor: "rgba(var(--ov),0.22)",
              backgroundColor: "rgba(var(--ov),0.06)",
            },
          }}
        >
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            {sortLabel}
          </Box>
          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
            Sort
          </Box>
        </Button>

        <Menu
          anchorEl={sortAnchorEl}
          open={Boolean(sortAnchorEl)}
          onClose={handleCloseSort}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                mt: 0.5,
                color: "var(--text)",
                border: "1px solid rgba(var(--ov),0.10)",
                borderRadius: 2,
                minWidth: 180,
              },
            },
          }}
        >
          {Object.entries(sortOptions).map(([key, label]) => (
            <MenuItem
              key={key}
              selected={key === sortMode}
              onClick={() => handleSelectSort(key)}
              sx={{
                fontSize: 14,
                "&.Mui-selected": {
                  backgroundColor: "rgba(100, 108, 255, 0.22)",
                },
                "&.Mui-selected:hover": {
                  backgroundColor: "rgba(100, 108, 255, 0.30)",
                },
                "&:hover": {
                  backgroundColor: "rgba(var(--ov),0.06)",
                },
              }}
            >
              {label}
            </MenuItem>
          ))}
        </Menu>

        <Button
          startIcon={<AddRoundedIcon sx={{ ml: { xs: 0.5, sm: 0 } }} />}
          onClick={handleCreateNote}
          variant="contained"
          sx={{
            borderRadius: "999px",
            px: { xs: 1.6, sm: 2.6 },
            minWidth: 0,
            textTransform: "none",
            whiteSpace: "nowrap",
            color: "var(--bg)",
            backgroundColor: "var(--text)",
            boxShadow: "none",
            "& .MuiButton-startIcon": {
              mr: { xs: 0, sm: 1 },
            },
            "&:hover": {
              // The button inverts the theme on purpose (`--text` background,
              // `--bg` label). The hover therefore has to stay a shade of
              // `--text` — it was pinned to a near-white grey, which in light
              // mode flipped the button from near-black to near-white and took
              // its near-white label with it.
              backgroundColor: "var(--text)",
              opacity: 0.86,
              boxShadow: "none",
            },
          }}
        >
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            Create Note
          </Box>
        </Button>
      </Box>
    </Box>
  );
}

// "Everything about Sarah" — the surface the knowledge graph unlocks first,
// and the one that pays for the whole subsystem on its own.
//
// Three things this shows that semantic search cannot:
//
//   * relations in BOTH directions. Every `works_on` edge has the project as
//     its object, so a project's page is empty unless incoming edges are read
//     with their inverse label ("has contributor" rather than "works on").
//   * the notes behind each edge. An edge with no reachable provenance is a
//     claim the product is making with nothing behind it.
//   * every mention grouped by note, with the exact words used — which is how
//     you spot that two entities are really one.

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CallSplitRoundedIcon from "@mui/icons-material/CallSplitRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import NoteRoundedIcon from "@mui/icons-material/NoteRounded";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import {
  entityDetailService,
  unmergeEntityService,
} from "../store/services/GraphService";
import { describeAiError } from "../utils/aiErrors";
import {
  EmptyState,
  Explain,
  Loading,
  TypeChip,
  dangerButtonSx,
  formatDate,
  quietButtonSx,
  subtleSx,
} from "../ai/aiUi";

export default function EntityDetailDialog({
  entityId,
  open,
  onClose,
  onShowGraph,
  onChanged,
}) {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const res = await entityDetailService(entityId);
      setDetail(res.data);
    } catch (err) {
      enqueueSnackbar(
        describeAiError(err, "Unable to open that entity.").message,
        { variant: "error" },
      );
      onClose?.();
    } finally {
      setLoading(false);
    }
  }, [entityId, enqueueSnackbar, onClose]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const handleUnmerge = async () => {
    setBusy(true);
    try {
      await unmergeEntityService(entityId);
      // Mentions come back exactly, because the merge recorded which ones it
      // moved. Edges are rebuilt from the notes instead of being reversed —
      // slower, but it cannot invent an edge the notes do not support.
      enqueueSnackbar(
        "Unmerged. Its mentions are restored; relationships will be re-extracted.",
        { variant: "success" },
      );
      await load();
      onChanged?.();
    } catch (err) {
      enqueueSnackbar(describeAiError(err, "Unable to unmerge.").message, {
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const entity = detail?.entity;
  const relations = detail?.relations || [];
  const mentions = detail?.mentions || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          color: "var(--text)",
          borderRadius: 3,
          border: "1px solid rgba(var(--ov),0.1)",
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle sx={{ pr: 6 }}>
        {entity ? (
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap">
              <Typography sx={{ fontWeight: 700, fontSize: 20 }}>
                {entity.name}
              </Typography>
              <TypeChip value={entity.entityType} />
              <Chip
                size="small"
                label={`${entity.mentionCount} mention${entity.mentionCount === 1 ? "" : "s"}`}
                sx={{
                  color: "var(--text)",
                  backgroundColor: "rgba(var(--ov),0.08)",
                }}
              />
            </Stack>
            {entity.description && (
              <Typography sx={{ fontSize: "0.9rem", color: "rgba(var(--ov),0.65)" }}>
                {entity.description}
              </Typography>
            )}
          </Stack>
        ) : (
          <Typography sx={{ fontWeight: 700 }}>Entity</Typography>
        )}
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12, color: "rgba(var(--ov),0.6)" }}
          size="small"
        >
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: "rgba(var(--ov),0.08)" }}>
        {loading || !entity ? (
          <Loading label="Assembling everything about this entity…" />
        ) : (
          <Stack spacing={3}>
            {entity.aliases?.length > 0 && (
              <Box>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  Also written as
                </Typography>
                <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ gap: 0.75 }}>
                  {entity.aliases.map((alias) => (
                    <Chip
                      key={alias}
                      size="small"
                      label={alias}
                      sx={{
                        color: "var(--text)",
                        backgroundColor: "rgba(var(--ov),0.06)",
                      }}
                    />
                  ))}
                </Stack>
                <Explain>
                  Learned automatically when a new mention resolved to this
                  entity. Each one is a form the assistant will now recognise.
                </Explain>
              </Box>
            )}

            <Box>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
                <HubRoundedIcon sx={{ color: "var(--accent-soft)", fontSize: 20 }} />
                <Typography sx={{ fontWeight: 600 }}>
                  Relationships ({relations.length})
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {onShowGraph && (
                  <Button
                    size="small"
                    onClick={() => onShowGraph(entity.entityId)}
                    sx={quietButtonSx}
                  >
                    Show in graph
                  </Button>
                )}
              </Stack>

              {relations.length === 0 ? (
                <EmptyState
                  title="No relationships yet"
                  hint="Relationships appear once two entities are named together in a note that says how they relate."
                />
              ) : (
                <Stack spacing={1}>
                  {relations.map((relation) => (
                    <Box key={relation.relationId} sx={subtleSx}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        sx={{ gap: 0.75 }}
                      >
                        <Typography sx={{ fontSize: "0.95rem" }}>
                          {relation.incoming ? (
                            <>
                              <strong>{entity.name}</strong>{" "}
                              <span style={{ opacity: 0.65 }}>{relation.label}</span>{" "}
                              <strong>{relation.other.name}</strong>
                            </>
                          ) : (
                            <>
                              <strong>{entity.name}</strong>{" "}
                              <span style={{ opacity: 0.65 }}>{relation.label}</span>{" "}
                              <strong>{relation.other.name}</strong>
                            </>
                          )}
                        </Typography>
                        <TypeChip value={relation.other.entityType} />
                        <Box sx={{ flexGrow: 1 }} />
                        <Tooltip
                          title="How many distinct notes assert this. More notes is a stronger claim than any confidence score a model reports about itself."
                          arrow
                        >
                          <Chip
                            size="small"
                            label={`${relation.supportCount} note${relation.supportCount === 1 ? "" : "s"}`}
                            sx={{
                              color: "var(--text)",
                              backgroundColor: "rgba(99,102,241,0.25)",
                            }}
                          />
                        </Tooltip>
                      </Stack>

                      {relation.noteIds?.length > 0 && (
                        <Stack
                          direction="row"
                          spacing={0.5}
                          useFlexGap
                          flexWrap="wrap"
                          sx={{ gap: 0.5, mt: 1 }}
                        >
                          {relation.noteIds.slice(0, 4).map((noteId) => (
                            <Chip
                              key={noteId}
                              size="small"
                              icon={<NoteRoundedIcon sx={{ fontSize: 14 }} />}
                              label="open note"
                              onClick={() =>
                                navigate(
                                  `/dashboard/create-note?noteId=${encodeURIComponent(noteId)}`,
                                )
                              }
                              sx={{
                                cursor: "pointer",
                                color: "var(--text)",
                                backgroundColor: "rgba(var(--ov),0.06)",
                                "&:hover": {
                                  backgroundColor: "rgba(99,102,241,0.28)",
                                },
                              }}
                            />
                          ))}
                        </Stack>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
              <Explain>
                Two relationships can disagree — an older note and a newer one
                naming different owners are both kept, with their dates. The
                graph records what your notes say rather than picking a winner.
              </Explain>
            </Box>

            <Divider sx={{ borderColor: "rgba(var(--ov),0.08)" }} />

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Mentioned in {mentions.length} note{mentions.length === 1 ? "" : "s"}
              </Typography>
              {mentions.length === 0 ? (
                <EmptyState title="No mentions" />
              ) : (
                <Stack spacing={1}>
                  {mentions.map((mention) => (
                    <Box
                      key={mention.noteId}
                      sx={{
                        ...subtleSx,
                        cursor: "pointer",
                        "&:hover": { borderColor: "rgba(99,102,241,0.45)" },
                      }}
                      onClick={() =>
                        navigate(
                          `/dashboard/create-note?noteId=${encodeURIComponent(mention.noteId)}`,
                        )
                      }
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography sx={{ fontWeight: 600 }} noWrap>
                          {mention.noteTitle || "Untitled note"}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        {mention.occurrences > 1 && (
                          <Chip
                            size="small"
                            label={`×${mention.occurrences}`}
                            sx={{
                              color: "var(--text)",
                              backgroundColor: "rgba(var(--ov),0.08)",
                            }}
                          />
                        )}
                      </Stack>
                      {mention.surfaceForms?.length > 0 && (
                        <Typography
                          sx={{
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                            mt: 0.5,
                          }}
                        >
                          written as {mention.surfaceForms.join(", ")}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Last seen {formatDate(entity.lastSeenAt)}
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                size="small"
                startIcon={<CallSplitRoundedIcon />}
                onClick={handleUnmerge}
                disabled={busy}
                sx={dangerButtonSx}
              >
                Undo a merge
              </Button>
            </Stack>
            <Explain>
              Use "undo a merge" only if this entity absorbed something it
              should not have. Mentions are restored exactly; relationships are
              rebuilt from your notes on the next extraction pass.
            </Explain>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

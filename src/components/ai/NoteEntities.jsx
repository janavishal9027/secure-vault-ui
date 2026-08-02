// What the graph understood this note to be about.
//
// Sits in the note editor rather than only on the graph page, because this is
// where it is checkable: you have the note in front of you, so you can see at
// a glance whether the extraction got it right. It is also the honest place to
// show that extraction is asynchronous — a note saved a moment ago genuinely
// has nothing here yet, and saying so beats an empty box.

import { useEffect, useState } from "react";
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";

import { entitiesInNoteService } from "../store/services/GraphService";
import EntityDetailDialog from "../graph/EntityDetailDialog";
import { TypeChip, subtleSx } from "./aiUi";

export default function NoteEntities({ noteId }) {
  const [entities, setEntities] = useState([]);
  const [state, setState] = useState("loading");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    if (!noteId) return undefined;
    let cancelled = false;
    setState("loading");
    entitiesInNoteService(noteId)
      .then((res) => {
        if (cancelled) return;
        setEntities(res.data?.entities || []);
        setState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        // 503 means the graph is off on this deployment, which is not an error
        // worth showing in a note editor — the section just does not apply.
        setState(err?.response?.status === 503 ? "disabled" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  if (!noteId || state === "disabled" || state === "error") return null;

  return (
    <Box sx={{ mt: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
        <AccountTreeRoundedIcon sx={{ color: "var(--accent-soft)" }} />
        <Typography sx={{ fontWeight: 600, fontSize: 18 }}>
          What this note is about
        </Typography>
      </Stack>

      <Paper sx={subtleSx}>
        {state === "loading" ? (
          <Typography sx={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Checking…
          </Typography>
        ) : entities.length === 0 ? (
          <Typography
            sx={{
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            Nothing extracted yet. Notes are read for people, projects and
            topics shortly after saving — and short notes are skipped entirely.
          </Typography>
        ) : (
          <>
            <Stack
              direction="row"
              spacing={0.75}
              useFlexGap
              flexWrap="wrap"
              sx={{ gap: 0.75 }}
            >
              {entities.map((entity) => (
                <Chip
                  key={entity.entityId}
                  label={entity.name}
                  size="small"
                  onClick={() => setOpenId(entity.entityId)}
                  icon={
                    <Box
                      component="span"
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        ml: 1,
                        backgroundColor: "rgba(var(--ov),0.45)",
                      }}
                    />
                  }
                  sx={{
                    cursor: "pointer",
                    color: "var(--text)",
                    backgroundColor: "rgba(var(--ov),0.05)",
                    border: "1px solid rgba(var(--ov),0.12)",
                    "&:hover": { backgroundColor: "rgba(99,102,241,0.28)" },
                  }}
                />
              ))}
            </Stack>
            <Stack
              direction="row"
              spacing={0.5}
              useFlexGap
              flexWrap="wrap"
              sx={{ gap: 0.5, mt: 1.25 }}
            >
              {[...new Set(entities.map((e) => e.entityType))].map((type) => (
                <TypeChip key={type} value={type} />
              ))}
            </Stack>
            <Typography
              sx={{ mt: 1.25, fontSize: "0.75rem", color: "var(--text-muted)" }}
            >
              Click any of these to see every other note that mentions it.
              Deleting this note removes anything it was the only source for.
            </Typography>
          </>
        )}
      </Paper>

      <EntityDetailDialog
        entityId={openId}
        open={Boolean(openId)}
        onClose={() => setOpenId(null)}
      />
    </Box>
  );
}

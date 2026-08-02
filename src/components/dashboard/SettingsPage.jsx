import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import TimerRoundedIcon from "@mui/icons-material/TimerRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import {
  getMyProfileService,
  updateMyProfileService,
} from "../store/services/AuthService";
import { useThemeMode } from "../theme/ThemeModeContext";
import { glassCard } from "../theme/glass";
import { clearCachedProfile, setCachedProfile } from "../store/useMyProfile";
import { IDLE_LIMIT_MS } from "../authentication/sessionPolicy";
import TwoFactorSection from "./TwoFactorSection";

/**
 * Largest avatar we will send.
 *
 * The file is downscaled to 256px before it is encoded, so a normal photo
 * lands far below this. The check exists for the cases downscaling cannot help
 * with — a huge PNG screenshot, an animated GIF — where the encoded string
 * would otherwise be megabytes and the server would reject it after the upload
 * had already happened.
 */
const MAX_AVATAR_BYTES = 200 * 1024;
const AVATAR_EDGE_PX = 256;

/**
 * Downscales and re-encodes an image file to a square JPEG data URI.
 *
 * Done on the client because the alternative is shipping the original file to
 * a service that has no image pipeline and no object storage. A 256px avatar
 * is ~20KB encoded, which is small enough to live in a column.
 */
const fileToAvatarDataUri = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file is not a readable image"));
      img.onload = () => {
        // Cover-crop to a square so a portrait photo is not squashed into the
        // circular frame the avatar is displayed in.
        const edge = Math.min(img.width, img.height);
        const sx = (img.width - edge) / 2;
        const sy = (img.height - edge) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_EDGE_PX;
        canvas.height = AVATAR_EDGE_PX;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, edge, edge, 0, 0, AVATAR_EDGE_PX, AVATAR_EDGE_PX);

        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const initialsOf = (profile) => {
  const source = profile?.displayName || profile?.username || profile?.email || "";
  const parts = source.trim().split(/[\s._-]+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const providerLabel = (method) => {
  if (method === "google") return "Google";
  if (method === "github") return "GitHub";
  return "Email & password";
};

const formatJoined = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/** A titled card. Every section uses it so spacing and surface stay identical. */
const Section = ({ icon, title, description, children, action }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2.5, sm: 3 },
      mb: 2.5,
      // Frosted, from the one recipe in theme/glass.js. Its alphas are a
      // measured contrast budget, not a look — see the note there.
      ...glassCard(),
    }}
  >
    <Stack
      direction="row"
      alignItems="flex-start"
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: description ? 0.5 : 2 }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        <Box sx={{ color: "var(--accent, #6366f1)", display: "flex" }}>{icon}</Box>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--text)" }}>
          {title}
        </Typography>
      </Stack>
      {action}
    </Stack>

    {description && (
      <Typography variant="body2" sx={{ color: "var(--text-2)", mb: 2.5 }}>
        {description}
      </Typography>
    )}

    {children}
  </Paper>
);

/** A read-only fact. Used for the fields identity depends on. */
const ReadOnlyField = ({ label, value, hint }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography
      variant="caption"
      sx={{ color: "var(--text-muted)", display: "block", mb: 0.25 }}
    >
      {label}
    </Typography>
    <Typography sx={{ color: "var(--text)", wordBreak: "break-word" }}>
      {value || "—"}
    </Typography>
    {hint && (
      <Typography
        variant="caption"
        sx={{ color: "var(--text-muted)", display: "block", mt: 0.25 }}
      >
        {hint}
      </Typography>
    )}
  </Box>
);

export default function SettingsPage() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { mode, setMode } = useThemeMode();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await getMyProfileService();
      setProfile(res.data);
      setDisplayName(res.data?.displayName || "");
      setAvatarUrl(res.data?.avatarUrl || "");
    } catch (err) {
      setLoadError(
        err?.response?.data?.message || "Could not load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // The save button is only meaningful when something actually differs from
  // what is stored — otherwise it invites a pointless round trip.
  const dirty = useMemo(() => {
    if (!profile) return false;
    return (
      displayName.trim() !== (profile.displayName || "") ||
      avatarUrl !== (profile.avatarUrl || "")
    );
  }, [profile, displayName, avatarUrl]);

  const handlePickAvatar = () => fileInputRef.current?.click();

  const handleAvatarSelected = async (event) => {
    const file = event.target.files?.[0];
    // Reset immediately so picking the same file twice still fires a change.
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      enqueueSnackbar("Please choose an image file", { variant: "warning" });
      return;
    }

    try {
      const dataUri = await fileToAvatarDataUri(file);
      if (dataUri.length > MAX_AVATAR_BYTES) {
        enqueueSnackbar(
          "That image is too large even after resizing. Try a different one.",
          { variant: "warning" },
        );
        return;
      }
      setAvatarUrl(dataUri);
    } catch (err) {
      enqueueSnackbar(err.message || "Could not read that image", {
        variant: "error",
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateMyProfileService({
        displayName: displayName.trim(),
        avatarUrl,
      });
      setProfile(res.data);
      // Push into the shared cache so the header avatar changes with the save
      // rather than on the next full page load.
      setCachedProfile(res.data);
      setDisplayName(res.data?.displayName || "");
      setAvatarUrl(res.data?.avatarUrl || "");
      enqueueSnackbar("Profile updated", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(
        err?.response?.data?.message || "Could not save your profile",
        { variant: "error" },
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setDisplayName(profile?.displayName || "");
    setAvatarUrl(profile?.avatarUrl || "");
  };

  const handleSignOut = () => {
    localStorage.removeItem("JWT_TOKEN");
    localStorage.removeItem("ROLES");
    clearCachedProfile();
    navigate("/login");
  };

  const idleMinutes = Math.round(IDLE_LIMIT_MS / 60000);
  const isFederated = profile?.signUpMethod === "google" || profile?.signUpMethod === "github";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(99,102,241,0.10), transparent 26%), var(--bg)",
        py: { xs: 3, sm: 5 },
        color: "var(--text)",
      }}
    >
      <Container maxWidth="md">
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Button
            startIcon={<ArrowBackRoundedIcon />}
            onClick={() => navigate("/dashboard")}
            sx={{ color: "var(--text-2)", textTransform: "none" }}
          >
            Back to dashboard
          </Button>

          <Button
            startIcon={<LogoutRoundedIcon />}
            onClick={handleSignOut}
            sx={{ color: "var(--text-2)", textTransform: "none" }}
          >
            Sign out
          </Button>
        </Stack>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Settings
        </Typography>
        <Typography sx={{ color: "var(--text-2)", mb: 4 }}>
          Your profile, appearance, and account security.
        </Typography>

        {loadError && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={loadProfile}>
                Retry
              </Button>
            }
          >
            {loadError}
          </Alert>
        )}

        {/* ---------------- PROFILE ---------------- */}
        <Section
          icon={<PersonRoundedIcon />}
          title="Profile"
          description="How you appear in the app. Your picture and name were taken from your sign-in provider where one was available — change either at any time."
        >
          {loading ? (
            <Stack direction="row" spacing={3} alignItems="center">
              <Skeleton variant="circular" width={88} height={88} />
              <Box sx={{ flex: 1 }}>
                <Skeleton height={28} width="40%" />
                <Skeleton height={22} width="60%" />
              </Box>
            </Stack>
          ) : (
            <>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={3}
                alignItems={{ xs: "flex-start", sm: "center" }}
                sx={{ mb: 3 }}
              >
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    src={avatarUrl || undefined}
                    sx={{
                      width: 88,
                      height: 88,
                      fontSize: 30,
                      fontWeight: 600,
                      bgcolor: "rgba(99,102,241,0.25)",
                      color: "var(--text)",
                      border: "1px solid rgba(var(--ov),0.12)",
                    }}
                  >
                    {initialsOf(profile)}
                  </Avatar>

                  <Tooltip title="Change picture">
                    <IconButton
                      onClick={handlePickAvatar}
                      size="small"
                      sx={{
                        position: "absolute",
                        right: -4,
                        bottom: -4,
                        background: "var(--surface-2)",
                        border: "1px solid rgba(var(--ov),0.16)",
                        color: "var(--text)",
                        "&:hover": { background: "var(--surface-2)" },
                      }}
                    >
                      <PhotoCameraRoundedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Stack spacing={1} sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handlePickAvatar}
                      sx={{
                        textTransform: "none",
                        borderRadius: 999,
                        color: "var(--text)",
                        borderColor: "rgba(var(--ov),0.22)",
                      }}
                    >
                      Upload picture
                    </Button>
                    {avatarUrl && (
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<DeleteOutlineRoundedIcon />}
                        onClick={() => setAvatarUrl("")}
                        sx={{ textTransform: "none", color: "var(--text-2)" }}
                      >
                        Remove
                      </Button>
                    )}
                  </Stack>
                  <Typography variant="caption" sx={{ color: "var(--text-muted)" }}>
                    JPG, PNG or GIF. Resized to 256×256 automatically.
                  </Typography>
                </Stack>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleAvatarSelected}
                />
              </Stack>

              <TextField
                fullWidth
                label="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                inputProps={{ maxLength: 80 }}
                helperText="Shown across the app. Leave empty to use your username."
                sx={{ mb: 3 }}
              />

              <Divider sx={{ mb: 3, borderColor: "rgba(var(--ov),0.10)" }} />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 2, sm: 4 }}
                sx={{ mb: 3 }}
              >
                <ReadOnlyField
                  label="Username"
                  value={profile?.username}
                  hint="Identifies your session — not editable here."
                />
                <ReadOnlyField
                  label="Email"
                  value={profile?.email}
                  hint={
                    isFederated
                      ? `Managed by ${providerLabel(profile?.signUpMethod)}.`
                      : "Used to recover your account."
                  }
                />
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 2, sm: 4 }}
                alignItems={{ sm: "center" }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: "var(--text-muted)", display: "block", mb: 0.5 }}
                  >
                    Signed in with
                  </Typography>
                  <Chip
                    size="small"
                    label={providerLabel(profile?.signUpMethod)}
                    sx={{
                      background: "rgba(99,102,241,0.18)",
                      color: "var(--text)",
                    }}
                  />
                </Box>

                {Boolean(profile?.roles?.length) && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ color: "var(--text-muted)", display: "block", mb: 0.5 }}
                    >
                      Role
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {profile.roles.map((role) => (
                        <Chip
                          key={role.roleType || role.roleId}
                          size="small"
                          label={(role.roleType || "").replace("ROLE_", "") || "—"}
                          sx={{
                            background: "rgba(var(--ov),0.08)",
                            color: "var(--text-2)",
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {profile?.createdDate && (
                  <ReadOnlyField
                    label="Member since"
                    value={formatJoined(profile.createdDate)}
                  />
                )}
              </Stack>

              {dirty && (
                <>
                  <Divider sx={{ my: 3, borderColor: "rgba(var(--ov),0.10)" }} />
                  <Stack direction="row" spacing={1.5}>
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={saving}
                      sx={{ textTransform: "none", borderRadius: 999, px: 3 }}
                    >
                      {saving ? (
                        <>
                          <CircularProgress
                            size={14}
                            sx={{ color: "#fff !important", mr: 1 }}
                          />
                          Saving…
                        </>
                      ) : (
                        "Save changes"
                      )}
                    </Button>
                    <Button
                      variant="text"
                      onClick={handleReset}
                      disabled={saving}
                      sx={{ textTransform: "none", color: "var(--text-2)" }}
                    >
                      Discard
                    </Button>
                  </Stack>
                </>
              )}
            </>
          )}
        </Section>

        {/* ---------------- APPEARANCE ---------------- */}
        <Section
          icon={<PaletteRoundedIcon />}
          title="Appearance"
          description="Applies everywhere in the app and is remembered on this device."
        >
          <Stack direction="row" spacing={2}>
            {[
              { key: "dark", label: "Dark", icon: <DarkModeRoundedIcon /> },
              { key: "light", label: "Light", icon: <LightModeRoundedIcon /> },
            ].map((option) => {
              const active = mode === option.key;
              return (
                <Paper
                  key={option.key}
                  onClick={() => setMode(option.key)}
                  elevation={0}
                  sx={{
                    flex: 1,
                    p: 2,
                    cursor: "pointer",
                    borderRadius: 2.5,
                    textAlign: "center",
                    backgroundImage: "none",
                    background: active
                      ? "rgba(99,102,241,0.16)"
                      : "rgba(var(--ov),0.03)",
                    border: active
                      ? "1px solid rgba(99,102,241,0.55)"
                      : "1px solid rgba(var(--ov),0.10)",
                    color: "var(--text)",
                    transition: "all 0.18s ease",
                    "&:hover": { background: "rgba(var(--ov),0.07)" },
                  }}
                >
                  <Box sx={{ mb: 0.5, color: active ? "var(--accent-soft)" : "var(--text-2)" }}>
                    {option.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 600 }}>{option.label}</Typography>
                </Paper>
              );
            })}
          </Stack>
        </Section>

        {/* ---------------- SECURITY ---------------- */}
        <Section
          icon={<SecurityRoundedIcon />}
          title="Security"
          description="Two-factor authentication asks for a code from your authenticator app in addition to your password."
        >
          <TwoFactorSection />
        </Section>

        {/* ---------------- SESSION ---------------- */}
        <Section
          icon={<TimerRoundedIcon />}
          title="Session"
          description={`You stay signed in while you are using the app. After ${idleMinutes} minutes of inactivity you will be asked to sign in again.`}
        >
          <Typography variant="body2" sx={{ color: "var(--text-2)" }}>
            There is no fixed session length to configure. Sessions used to end a
            set time after signing in, which could interrupt you mid-note; now
            they end only when they have been unused, so an active session is
            never cut short and an abandoned one does not stay open.
          </Typography>
        </Section>

        {/* ---------------- AI PROVIDER KEYS ---------------- */}
        <Section
          icon={<VpnKeyRoundedIcon />}
          title="AI provider keys"
          description="Bring your own API keys for the models that generate summaries, chat replies and search."
          action={
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate("/dashboard/keys")}
              sx={{
                textTransform: "none",
                borderRadius: 999,
                whiteSpace: "nowrap",
                color: "var(--text)",
                borderColor: "rgba(var(--ov),0.22)",
              }}
            >
              Manage keys
            </Button>
          }
        />
      </Container>
    </Box>
  );
}

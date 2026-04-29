import {
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  Typography,
  Stack,
  DialogActions,
  Button,
  Dialog as MuiDialog
} from '@mui/material';
import api from '../services/api';
import { useEffect, useMemo, useState } from 'react';

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';

export default function PublicProfileDialog({ open, onClose, userID, isAnonymous = false }) {
  const [profile, setProfile] = useState(null);
  const [zoom, setZoom] = useState(false);

  const blockOpen = useMemo(() => {
    if (isAnonymous) return true;
    const v = userID;
    if (v === null || v === undefined) return true;
    if (typeof v === 'number' && (v <= 0 || !Number.isFinite(v))) return true; // e.g., 0, -1
    if (typeof v === 'string' && ['anonymous', 'anon', 'anonym'].includes(v.toLowerCase())) return true;
    return false;
  }, [isAnonymous, userID]);

  useEffect(() => {
    if (open && blockOpen) {
      setProfile(null);
      onClose?.();
    }
  }, [open, blockOpen, onClose]);

  useEffect(() => {
    if (!open || blockOpen) return;
    if (!userID) return;

    (async () => {
      try {
        const { data } = await api.get(`/profile/public/${userID}`);
        setProfile(data);
      } catch {
        setProfile(null);
      }
    })();
  }, [open, userID, blockOpen]);

  const avatarSrc = profile?.avatarUrl ? `${API_ORIGIN}${profile.avatarUrl}` : undefined;
  const fallback = profile?.name?.[0]?.toUpperCase() || 'U';

  if (!open || blockOpen) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle>Profile</DialogTitle>
        <DialogContent>
          {profile ? (
            <Stack spacing={1} alignItems="center">
              <Avatar
                src={avatarSrc}
                sx={{ width: 72, height: 72, cursor: avatarSrc ? 'zoom-in' : 'default' }}
                onClick={() => avatarSrc && setZoom(true)}
              >
                {fallback}
              </Avatar>
              <Typography variant="h6">{profile.name}</Typography>
              {profile.course && <Typography color="text.secondary">{profile.course}</Typography>}
              {profile.bio && <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>{profile.bio}</Typography>}
            </Stack>
          ) : (
            <Typography color="text.secondary">No public profile found.</Typography>
          )}
        </DialogContent>
      </Dialog>

      <MuiDialog open={zoom} onClose={() => setZoom(false)} maxWidth="md" fullWidth>
        <DialogTitle>Profile Picture</DialogTitle>
        <DialogContent sx={{ display: 'flex', justifyContent: 'center' }}>
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Profile"
              style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 8 }}
            />
          ) : (
            <Typography color="text.secondary">No profile picture.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setZoom(false)}>Close</Button>
        </DialogActions>
      </MuiDialog>
    </>
  );
}
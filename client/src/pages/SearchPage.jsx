import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, List, ListItemButton, ListItemText, Chip, Stack, Divider
} from '@mui/material';
import api from '../services/api';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function SearchPage() {
  const q = useQuery();
  const term = (q.get('q') || '').trim();
  const scope = q.get('scope') || 'debates';
  const joincode = q.get('joincode') || null;

  const nav = useNavigate();

  const [debates, setDebates] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    const run = async () => {
      setLoading(true);
      try {
        if (scope === 'chat' && joincode) {
          const { data } = await api.get(`/messages/search`, { params: { q: term, joincode } });
          if (!cancel) setMessages(Array.isArray(data) ? data : []);
        } else {
          const { data } = await api.get(`/debates/search`, { params: { q: term } });
          if (!cancel) setDebates(Array.isArray(data) ? data : []);
        }
      } catch {
        if (scope === 'chat') setMessages([]);
        else setDebates([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    };
    if (term) run();
    return () => { cancel = true; };
  }, [term, scope, joincode]);

  return (
    <Box p={{ xs: 2, sm: 3, md: 4 }}>
      <Typography variant="h5" gutterBottom>
        Search results for “{term}”
      </Typography>

      {scope === 'chat' && joincode ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Messages in this debate
          </Typography>
          {loading ? (
            <Typography color="text.secondary">Searching…</Typography>
          ) : messages.length === 0 ? (
            <Typography color="text.secondary">No messages matched.</Typography>
          ) : (
            <List>
              {messages.map((m) => (
                <ListItemButton
                  key={m._id}
                  onClick={() => nav(`/debate/${joincode}`)}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span style={{ fontWeight: 600 }}>{m.senderName || 'Anonymous'}</span>
                        <Chip size="small" label={m.side} />
                      </Stack>
                    }
                    secondary={m.content}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Paper>
      ) : (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Debates
          </Typography>
          {loading ? (
            <Typography color="text.secondary">Searching…</Typography>
          ) : debates.length === 0 ? (
            <Typography color="text.secondary">No debates matched.</Typography>
          ) : (
            <List>
              {debates.map((d) => (
                <ListItemButton key={d.joincode} onClick={() => nav(d.isPublic ? `/public/debate/${d.joincode}` : `/debate/${d.joincode}`)}>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span style={{ fontWeight: 600 }}>{d.title}</span>
                        <Chip size="small" label={d.isPublic ? 'Public' : 'Private'} color={d.isPublic ? 'success' : 'default'} />
                      </Stack>
                    }
                    secondary={d.description}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Paper>
      )}
    </Box>
  );
}

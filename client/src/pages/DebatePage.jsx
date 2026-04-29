import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import PublicProfileDialog from '../components/PublicProfileDialog';
import { FormControlLabel, Switch, Checkbox as MUICheckbox } from '@mui/material';

import {
  Box,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  useMediaQuery,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import PageShell from '../components/PageShell';

import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ArrowCircleUpOutlinedIcon from '@mui/icons-material/ArrowCircleUpOutlined';
import ArrowCircleUpTwoToneIcon from '@mui/icons-material/ArrowCircleUpTwoTone';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import PushPinIcon from '@mui/icons-material/PushPin';
import CloseIcon from '@mui/icons-material/Close';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import ArrowCircleDownOutlinedIcon from '@mui/icons-material/ArrowCircleDownOutlined';
import ArrowCircleDownTwoToneIcon from '@mui/icons-material/ArrowCircleDownTwoTone';

import { format } from 'date-fns';

const SCORE = { like: 1, dislike: -1, upvote: 2, downvote: -2 };

function computeSideTallies(messages, side) {
  const sideMsgs = messages.filter((m) => m.side === side);
  const likes = sideMsgs.reduce((a, m) => a + (m.likes?.length || 0), 0);
  const dislikes = sideMsgs.reduce((a, m) => a + (m.dislikes?.length || 0), 0);
  const upvotes = sideMsgs.reduce((a, m) => a + (m.upvotes?.length || 0), 0);
  const downvotes = sideMsgs.reduce((a, m) => a + (m.downvotes?.length || 0), 0);
  const points =
    likes * SCORE.like +
    dislikes * SCORE.dislike +
    upvotes * SCORE.upvote +
    downvotes * SCORE.downvote;
  return { likes, dislikes, upvotes, downvotes, points };
}

export default function DebatePage() {
  const { joincode } = useParams();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isCompactActions = useMediaQuery(theme.breakpoints.down('sm'));

  const [debate, setDebate] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputs, setInputs] = useState({ proponent: '', neutral: '', opponent: '' });
  const [anonBySide, setAnonBySide] = useState({ proponent: false, neutral: false, opponent: false });
  const [replyAnon, setReplyAnon] = useState(false);

  const [votes, setVotes] = useState({ proponent: 0, opponent: 0 });
  const [myVote, setMyVote] = useState(null);
  const [casting, setCasting] = useState(false);

  const [replyTarget, setReplyTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const [menuMsg, setMenuMsg] = useState(null);

  const [openComments, setOpenComments] = useState({});
  const [commentsLimit, setCommentsLimit] = useState({});
  const [expandedBodies, setExpandedBodies] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [editDrafts, setEditDrafts] = useState({});
  const handleReplyDraftChange = useCallback((id, val) => {
    setReplyDrafts((p) => ({ ...p, [id]: val }));
  }, []);
  const handleEditDraftChange = useCallback((id, val) => {
    setEditDrafts((p) => ({ ...p, [id]: val }));
  }, []);

  const BODY_TRUNCATE = 220;
  const INITIAL_COMMENTS = 3;
  const COMMENTS_STEP = 5;

  const [resultsOpen, setResultsOpen] = useState(false);
  const [results, setResults] = useState(null);
  const [toast, setToast] = useState({ open: false, severity: 'info', message: '' });

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUserID, setProfileUserID] = useState(null);
  const openProfile = (uid) => {
    setProfileUserID(uid);
    setProfileOpen(true);
  };
  const closeProfile = () => {
    setProfileOpen(false);
    setProfileUserID(null);
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  const sides = ['proponent', 'neutral', 'opponent'];
  const sideLabel = { proponent: 'Proponent', neutral: 'Neutral', opponent: 'Opponent' };
  const sideColors = useMemo(() => ({
    proponent: {
      bg: isDark ? alpha('#88a992', 0.26) : '#e2ece4',
      border: isDark ? alpha('#d6e5db', 0.34) : '#b8ccb9',
      text: isDark ? '#d7e9dc' : '#284236',
    },
    neutral: {
      bg: isDark ? alpha('#8ea6bf', 0.24) : '#e1e9ef',
      border: isDark ? alpha('#dde8f3', 0.34) : '#b4c3cf',
      text: isDark ? '#dce8f5' : '#243a4d',
    },
    opponent: {
      bg: isDark ? alpha('#b58d95', 0.24) : '#efdfdf',
      border: isDark ? alpha('#ead7dc', 0.34) : '#d0b4b9',
      text: isDark ? '#f0dde1' : '#4d2a2f',
    },
  }), [isDark, theme]);
  const authorColors = useMemo(() => ({
    proponent: sideColors.proponent,
    opponent: sideColors.opponent,
    instructor: sideColors.neutral,
  }), [sideColors]);

  const getAuthorBucket = (msg, debate) => {
    const uid = Number(msg?.senderID);
    if (!uid || !debate) return null;
    if (Number(debate.instructor) === uid) return 'instructor';
    const sideHit = (debate.sides || []).find((s) => (s.participants || []).includes(uid));
    return sideHit?.name || null;
  };

  const listEndRefs = {
    proponent: useRef(null),
    neutral: useRef(null),
    opponent: useRef(null),
  };

  const messageRefs = useRef({});

  const isPublic = !!debate?.isPublic;

  const isInstructorOwner =
    currentUser?.role === 'instructor' &&
    debate &&
    Number(currentUser.userID) === Number(debate.instructor);

  const isClosed = debate?.status === 'closed';
  const readOnly = isClosed && !isInstructorOwner;

  const guardIfClosed = () => {
    if (readOnly) {
      setToast({ open: true, severity: 'warning', message: 'Debate is closed' });
      return true;
    }
    return false;
  };

  const getAssignedSide = () => {
    if (!debate || !currentUser) return null;
    const hit = (debate.sides || []).find((s) =>
      (s.participants || []).includes(currentUser.userID),
    );
    return hit?.name || null;
  };

  const canPost = (sideKey) => {
    if (!debate) return false;
    if (!isLoggedIn) return false;
    if (isInstructorOwner) return true;
    if (debate.status !== 'active') return false;
    if (isPublic) return true;
    return getAssignedSide() === sideKey;
  };

  const choosePostingSideForReply = (parentSide) => {
    if (isPublic) return parentSide;
    if (isInstructorOwner) return parentSide;
    return getAssignedSide();
  };

  const scrollToBottom = (side) => {
    const ref = listEndRefs[side];
    if (ref?.current) ref.current.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMessage = (id) => {
    const el = messageRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('new-message');
      setTimeout(() => el.classList.remove('new-message'), 1200);
    }
  };

  const openParentThreadFor = (parentId) => {
    const pid = String(parentId);
    setOpenComments((p) => ({ ...p, [pid]: true }));
    setCommentsLimit((p) => ({ ...p, [pid]: Math.max(p[pid] ?? 0, 999) }));
  };

  useEffect(() => {
    const fetchDebate = async () => {
      try {
        const { data } = await api.get(`/debates/join/${joincode}`);
        setDebate(data);
      } catch {
        setDebate(null);
      }
    };

    const fetchMessages = async () => {
      const { data } = await api.get(`/messages/${joincode}`);
      setMessages(Array.isArray(data) ? data : []);
      setTimeout(() => sides.forEach(scrollToBottom), 60);
    };

    const fetchVotes = async () => {
      try {
        const { data } = await api.get(`/debates/join/${joincode}/votes`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (data && typeof data === 'object') {
          setVotes({
            proponent: Number(data.proponent || 0),
            opponent: Number(data.opponent || 0),
          });
          setMyVote(data.my ?? null);
        }
      } catch (err) {
        console.error('Failed to fetch votes:', err);
      }
    };

    fetchDebate();
    fetchMessages();
    fetchVotes();
    socket.emit('joinDebate', { joincode: Number(joincode) }, () => {});

    const onNew = (msg) => {
      setMessages((prev) => (prev.find((m) => m._id === msg._id) ? prev : [...prev, msg]));
      if (currentUser && Number(msg.senderID) === Number(currentUser.userID)) {
        setExpandedBodies((p) => ({ ...p, [String(msg._id)]: true }));
        if (msg.replyTo) {
          openParentThreadFor(msg.replyTo);
        }
      }
      setTimeout(() => scrollToBottom(msg.side || 'neutral'), 40);
    };
    const onEdited = (msg) =>
      setMessages((prev) => prev.map((m) => (m._id === msg._id ? { ...m, ...msg } : m)));
    const onDeleted = ({ _id }) =>
      setMessages((prev) => prev.filter((m) => m._id !== _id));
    const onUpdated = (frag) =>
      setMessages((prev) => prev.map((m) => (m._id === frag._id ? { ...m, ...frag } : m)));

    socket.on(`newMessage:${joincode}`, onNew);
    socket.on(`messageEdited:${joincode}`, onEdited);
    socket.on(`messageDeleted:${joincode}`, onDeleted);
    socket.on(`messageUpdated:${joincode}`, onUpdated);
    socket.on(`messagePinned:${joincode}`, onUpdated);

    const onVote = (payload) => {
      if (!payload) return;
      setVotes({
        proponent: Number(payload.proponent || 0),
        opponent: Number(payload.opponent || 0),
      });
    };
    socket.on(`voteUpdated:${joincode}`, onVote);

    return () => {
      socket.off(`newMessage:${joincode}`, onNew);
      socket.off(`messageEdited:${joincode}`, onEdited);
      socket.off(`messageDeleted:${joincode}`, onDeleted);
      socket.off(`messageUpdated:${joincode}`, onUpdated);
      socket.off(`messagePinned:${joincode}`, onUpdated);
      socket.off(`voteUpdated:${joincode}`, onVote);
    };
  }, [joincode, token]);

  const messageById = useMemo(() => {
    const map = {};
    for (const m of messages) map[m._id] = m;
    return map;
  }, [messages]);

  const childrenMap = useMemo(() => {
    const map = {};
    for (const m of messages) {
      if (m.replyTo) {
        const pid = String(m.replyTo);
        if (!map[pid]) map[pid] = [];
        map[pid].push(m);
      }
    }
    for (const k in map) {
      map[k].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    return map;
  }, [messages]);

  const pinned = useMemo(() => messages.filter((m) => m.pinned), [messages]);

  const handleInputChange = (side, value) => {
    setInputs((p) => ({ ...p, [side]: value }));
  };

  const sendMessage = async (side) => {
    if (guardIfClosed()) return;
    const content = inputs[side].trim();
    if (!content || !canPost(side)) return;

    try {
      await api.post(
        '/messages',
        { debate: joincode, content, side, isAnonymous: !!anonBySide[side] },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setInputs((p) => ({ ...p, [side]: '' }));
      setTimeout(() => scrollToBottom(side), 30);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const startReply = (msg) => {
    const postingSide = choosePostingSideForReply(msg.side);
    if (!postingSide) {
      setToast({ open: true, severity: 'warning', message: 'You are not assigned to a side in this private debate.' });
      return;
    }
    setReplyAnon(false);
    setReplyTarget({
      id: msg._id,
      side: postingSide,
      parentSide: msg.side,
      senderName: msg.senderName || msg.sender?.name || 'Anonymous',
      content: msg.content || '',
    });

    openParentThreadFor(msg._id);

    setTimeout(() => {
      const el = document.querySelector(`#inline-reply-${msg._id}`);
      el?.focus();
    }, 0);
  };

  const cancelReply = () => setReplyTarget(null);

  const sendReply = async ({ id, side, content } = {}) => {
    if (!id || !side) return;
    if (!canPost(side)) return;

    const trimmed = (content || '').trim();
    if (!trimmed) return;

    try {
      await api.post(
        `/messages/${id}/reply`,
        { content: trimmed, side, isAnonymous: !!replyAnon },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setReplyTarget(null);
    } catch (err) {
      console.error('Failed to reply:', err);
    }
  };

  const startEdit = (msg) => {
    setEditTarget({ id: msg._id, side: msg.side });
    setEditDrafts((p) => ({ ...p, [msg._id]: msg.content || '' }));

    setTimeout(() => {
      document.querySelector(`#inline-edit-${msg._id}`)?.focus();
    }, 0);
  };

  const cancelEdit = () => {
    if (editTarget?.id) {
      setEditDrafts((p) => {
        const n = { ...p };
        delete n[editTarget.id];
        return n;
      });
    }
    setEditTarget(null);
  };

  const sendEdit = async ({ id, side, content } = {}) => {
    if (!id || !side) return;

    const trimmed = (content || '').trim();
    if (!trimmed) return;

    try {
      await api.patch(
        `/messages/${id}`,
        { content: trimmed },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setEditTarget(null);
    } catch (e) {
      console.error('edit failed', e);
    }
  };

  const hasLiked = (msg) =>
    Array.isArray(msg.likes) && currentUser && msg.likes.includes(currentUser.userID);
  const hasUpvoted = (msg) =>
    Array.isArray(msg.upvotes) && currentUser && msg.upvotes.includes(currentUser.userID);
  const hasDisliked = (msg) =>
    Array.isArray(msg.dislikes) && currentUser && msg.dislikes.includes(currentUser.userID);
  const hasDownvoted = (msg) =>
    Array.isArray(msg.downvotes) && currentUser && msg.downvotes.includes(currentUser.userID);

  const toggleLike = async (msg) => {
    if (guardIfClosed()) return;
    try {
      await api.post(`/messages/${msg._id}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      console.error('like failed', e);
    }
  };
  const toggleUpvote = async (msg) => {
    if (guardIfClosed()) return;
    try {
      await api.post(`/messages/${msg._id}/upvote`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      console.error('upvote failed', e);
    }
  };
  const toggleDislike = async (msg) => {
    if (guardIfClosed()) return;
    try {
      await api.post(`/messages/${msg._id}/dislike`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      console.error('dislike failed', e);
    }
  };
  const toggleDownvote = async (msg) => {
    if (guardIfClosed()) return;
    try {
      await api.post(`/messages/${msg._id}/downvote`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      console.error('downvote failed', e);
    }
  };

  const handleFlag = async (msg) => {
    if (guardIfClosed()) return;
    try {
      await api.post(`/messages/${msg._id}/flag`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      console.error('flag failed', e);
    }
  };

  const handleDelete = async (msg) => {
    if (guardIfClosed()) return;
    try {
      await api.delete(`/messages/${msg._id}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {
      console.error('delete failed', e);
    }
  };

  const handlePinToggle = async (msg) => {
    if (guardIfClosed()) return;
    try {
      await api.post(
        `/messages/${msg._id}/pin`,
        { pinned: !msg.pinned },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (e) {
      console.error('pin failed', e);
    }
  };

  const openMenu = (evt, msg) => {
    if (guardIfClosed()) return;
    evt.preventDefault();
    evt.stopPropagation();
    setMenuPos({ top: evt.clientY + 4, left: evt.clientX + 4 });
    setMenuAnchor(null);
    setMenuMsg(msg);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuPos(null);
    setMenuMsg(null);
  };

  const niceSide = (s) => sideLabel[s] || s;

  const getChildren = (id) => childrenMap[String(id)] || [];
  const isCommentsOpen = (id) => !!openComments[String(id)];
  const visibleCommentsCount = (id) => commentsLimit[String(id)] ?? INITIAL_COMMENTS;
  const openCommentsFor = (id) => {
    setOpenComments((p) => ({ ...p, [String(id)]: true }));
    setCommentsLimit((p) => ({ ...p, [String(id)]: INITIAL_COMMENTS }));
  };
  const hideCommentsFor = (id) =>
    setOpenComments((p) => ({ ...p, [String(id)]: false }));
  const showMoreCommentsFor = (id) =>
    setCommentsLimit((p) => ({
      ...p,
      [String(id)]: (p[String(id)] ?? INITIAL_COMMENTS) + COMMENTS_STEP,
    }));

  const isBodyExpanded = (id) => !!expandedBodies[String(id)];
  const toggleBodyExpand = (id) =>
    setExpandedBodies((p) => ({ ...p, [String(id)]: !p[String(id)] }));

  const debateActive = debate?.status === 'active';
  const reactionButtonSx = {
    p: { xs: 0.85, md: 0.5 },
    '& svg': { fontSize: { xs: 22, md: 20 } },
  };

  const castVote = async (side) => {
    if (!isLoggedIn) {
      setToast({ open: true, severity: 'warning', message: 'Please log in to vote.' });
      return;
    }
    if (!debateActive) return;
    if (side !== 'proponent' && side !== 'opponent') return;

    try {
      setCasting(true);
      const { data } = await api.post(
        `/debates/join/${joincode}/vote`,
        { side },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setVotes({
        proponent: Number(data?.proponent || 0),
        opponent: Number(data?.opponent || 0),
      });
      setMyVote(data?.my ?? side);
    } catch (e) {
      setToast({ open: true, severity: 'error', message: e?.response?.data?.message || 'Failed to cast vote' });
    } finally {
      setCasting(false);
    }
  };

  const MessageItem = React.memo(function MessageItem({ msg, depth = 0, sideKey }) {
    const [localReply, setLocalReply] = React.useState('');
    const [localEdit, setLocalEdit] = React.useState('');

    useEffect(() => {
      if (editTarget && editTarget.id === msg._id) {
        setLocalEdit(msg.content || '');
        setTimeout(() => {
          document.querySelector(`#inline-edit-${msg._id}`)?.focus();
        }, 0);
      }
    }, [editTarget, msg._id, msg.content]);

    useEffect(() => {
      if (replyTarget && replyTarget.id === msg._id) {
        setLocalReply('');
        setTimeout(() => {
          document.querySelector(`#inline-reply-${msg._id}`)?.focus();
        }, 0);
      }
    }, [replyTarget, msg._id]);

    const kids = getChildren(msg._id);
    const open = isCommentsOpen(msg._id);
    const limit = visibleCommentsCount(msg._id);
    const longBody = (msg.content || '').length > BODY_TRUNCATE;
    const expanded = isBodyExpanded(msg._id);
    const bucket = getAuthorBucket(msg, debate);
    const colors = authorColors[bucket] || sideColors[sideKey];

    return (
      <ListItem
        component={depth === 0 ? 'li' : 'div'}
        key={msg._id}
        ref={(el) => { if (el) messageRefs.current[msg._id] = el; }}
        sx={{ alignItems: 'flex-start', pl: depth > 0 ? 0 : 0 }}
      >
        <Box sx={{ width: '100%' }}>
          <Box
            sx={{
              bgcolor: colors.bg,
              border: '1px solid',
              borderColor: colors.border,
              color: colors.text,
              borderRadius: 2.4,
              p: 1.5,
              width: '100%',
              boxShadow: isDark
                ? `0 10px 20px ${alpha('#02060c', 0.3)}`
                : `0 8px 18px ${alpha('#123865', 0.12)}`,
              position: 'relative',
            }}
          >
            {msg.replyTo && messageById[msg.replyTo] && (
              <Chip
                variant="outlined"
                size="small"
                sx={{
                  mb: 0,
                  bgcolor: isDark ? alpha('#dbe9ff', 0.16) : alpha('#ffffff', 0.74),
                  borderColor: alpha(theme.palette.text.primary, 0.2),
                }}
                label={`Replied to ${
                  messageById[msg.replyTo].senderName || 'Anonymous'
                }: "${messageById[msg.replyTo].content || ''}" • ${niceSide(
                  messageById[msg.replyTo].side,
                )}`}
                onClick={() => scrollToMessage(msg.replyTo)}
              />
            )}

            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                component={msg.isAnonymous ? 'span' : 'button'}
                fontWeight="bold"
                sx={{
                  cursor: msg.isAnonymous ? 'default' : 'pointer',
                  background: 'none',
                  border: 0,
                  p: 0,
                  font: 'inherit',
                  textAlign: 'left',
                }}
                onClick={() => { if (!msg.isAnonymous) openProfile(msg.senderID); }}
              >
                {msg.senderName || msg.sender?.name || 'Anonymous'}
              </Typography>
              {msg.pinned && (
                <Chip
                  size="small"
                  variant="outlined"
                  label="Pinned"
                  sx={{
                    bgcolor: isDark ? alpha('#ffe3a3', 0.2) : alpha('#fff6da', 0.85),
                    mb: 0.0,
                  }}
                  onClick={() => scrollToMessage(msg._id)}
                />
              )}
              <Box flexGrow={1} />
              <Tooltip title="More">
                <IconButton size="small" onClick={(e) => openMenu(e, msg)}>
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Typography sx={{ mt: 0.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', wordBreak: 'break-word', hyphens: 'auto' }}>
              {longBody && !expanded ? `${msg.content.slice(0, BODY_TRUNCATE)}…` : msg.content}
            </Typography>

            {longBody && (
              <Button
                size="small"
                sx={{ mt: 0.5, px: 0.5, textTransform: 'none' }}
                onClick={() => toggleBodyExpand(msg._id)}
              >
                {expanded ? 'Show less' : 'Show more'}
              </Button>
            )}

            {editTarget && editTarget.id === msg._id && (
              <Box sx={{ mt: 1, pl: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    id={`inline-edit-${msg._id}`}
                    placeholder="Edit your message"
                    fullWidth
                    size="small"
                    value={localEdit}
                    onChange={(e) => setLocalEdit(e.target.value)}
                    disabled={!canPost(editTarget.side)}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() =>
                      sendEdit({ id: msg._id, side: editTarget.side, content: localEdit })
                    }
                    disabled={!canPost(editTarget.side)}
                  >
                    Save
                  </Button>
                  <Button variant="text" size="small" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </Stack>
              </Box>
            )}

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ color: alpha(colors.text, isDark ? 0.95 : 0.82) }}>
                {format(new Date(msg.createdAt), 'dd MMM yyyy | hh:mm a    ')}
              </Typography>
              {msg.editedAt && (
                <Chip
                  size="small"
                  variant="outlined"
                  label="Edited"
                  sx={{ bgcolor: isDark ? alpha('#dbe9ff', 0.14) : alpha('#f3f7ff', 0.8) }}
                />
              )}
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 0.5 }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <IconButton
                  size={isCompactActions ? "medium" : "small"}
                  sx={reactionButtonSx}
                  onClick={() => toggleLike(msg)}
                  disabled={!currentUser || readOnly}
                  aria-label="like"
                >
                  {hasLiked(msg) ? <ThumbUpAltIcon fontSize="small" /> : <ThumbUpAltOutlinedIcon fontSize="small" />}
                </IconButton>
                <Typography variant="body2">{msg.likes?.length || 0}</Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <IconButton
                  size={isCompactActions ? "medium" : "small"}
                  sx={reactionButtonSx}
                  onClick={() => toggleDislike(msg)}
                  disabled={!currentUser || readOnly}
                  aria-label="dislike"
                >
                  {hasDisliked(msg) ? <ThumbDownAltIcon fontSize="small" /> : <ThumbDownAltOutlinedIcon fontSize="small" />}
                </IconButton>
                <Typography variant="body2">{msg.dislikes?.length || 0}</Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <IconButton
                  size={isCompactActions ? "medium" : "small"}
                  sx={reactionButtonSx}
                  onClick={() => toggleUpvote(msg)}
                  disabled={!currentUser || readOnly}
                  aria-label="upvote"
                >
                  {hasUpvoted(msg) ? <ArrowCircleUpTwoToneIcon fontSize="small" /> : <ArrowCircleUpOutlinedIcon fontSize="small" />}
                </IconButton>
                <Typography variant="body2">{msg.upvotes?.length || 0}</Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <IconButton
                  size={isCompactActions ? "medium" : "small"}
                  sx={reactionButtonSx}
                  onClick={() => toggleDownvote(msg)}
                  disabled={!currentUser || readOnly}
                  aria-label="downvote"
                >
                  {hasDownvoted(msg) ? <ArrowCircleDownTwoToneIcon fontSize="small" /> : <ArrowCircleDownOutlinedIcon fontSize="small" />}
                </IconButton>
                <Typography variant="body2">{msg.downvotes?.length || 0}</Typography>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <IconButton
                  size={isCompactActions ? "medium" : "small"}
                  sx={reactionButtonSx}
                  onClick={() => startReply(msg)}
                  disabled={readOnly}
                  aria-label="reply"
                >
                  <ReplyOutlinedIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2">Reply</Typography>
              </Stack>
            </Stack>

            {replyTarget && replyTarget.id === msg._id && (
              <Box sx={{ mt: 1, pl: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    id={`inline-reply-${msg._id}`}
                    placeholder="Write your reply"
                    fullWidth
                    size="small"
                    value={localReply}
                    onChange={(e) => setLocalReply(e.target.value)}
                    disabled={!canPost(replyTarget.side)}
                  />
                  <FormControlLabel
                    control={
                  <MUICheckbox
                    checked={replyAnon}
                    onChange={(e) => setReplyAnon(e.target.checked)}
                    size="small"
                  />
                  }
                    label="Anonymous"
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() =>
                      sendReply({ id: msg._id, side: replyTarget.side, content: localReply })
                    }
                    disabled={!canPost(replyTarget.side)}
                  >
                    Send
                  </Button>
                  <Button variant="text" size="small" onClick={cancelReply}>
                    Cancel
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>

          {kids.length > 0 && !open && (
            <Box sx={{ mt: 0.5, pl: depth >= 0 ? 2 : 0 }}>
              <Button size="small" sx={{ textTransform: 'none', px: 0.5 }} onClick={() => openCommentsFor(msg._id)}>
                Show comments ({kids.length})
              </Button>
            </Box>
          )}

          {open && (
            <Box sx={{ mt: 1, pl: 2, borderLeft: `2px solid ${alpha(theme.palette.text.primary, 0.18)}` }}>
              {kids.slice(0, limit).map((child) => (
                <Box key={child._id} sx={{ mt: 1 }}>
                  <MessageItem msg={child} depth={depth + 1} sideKey={sideKey} />
                </Box>
              ))}

              {limit < kids.length && (
                <Button size="small" sx={{ mt: 0.5, textTransform: 'none', px: 0.5 }} onClick={() => showMoreCommentsFor(msg._id)}>
                  Show more comments
                </Button>
              )}

              <Button size="small" sx={{ mt: 0.5, textTransform: 'none', px: 0.5 }} onClick={() => hideCommentsFor(msg._id)}>
                Hide comments
              </Button>
            </Box>
          )}
        </Box>
      </ListItem>
    );
  });

  if (!debate) {
    return (
      <PageShell headerHeight={72} maxWidth={1240}>
        <Box py={{ xs: 3, sm: 4 }}>
          <Typography variant="h4" textAlign="center" fontWeight={800}>
            Debate Not Found
          </Typography>
        </Box>
      </PageShell>
    );
  }

  const tProponent = computeSideTallies(messages, 'proponent');
  const tOpponent = computeSideTallies(messages, 'opponent');
  const assignedSide = !isInstructorOwner ? getAssignedSide() : null;

  return (
    <PageShell headerHeight={72} maxWidth={1600} disableGutters>
      <Box
        sx={{
          px: { xs: 2, sm: 2.5, lg: 3 },
          py: { xs: 2, md: 1.2 },
          display: 'flex',
          flexDirection: 'column',
          height: { xs: 'auto', md: 'calc(100vh - 72px)' },
          overflow: { xs: 'visible', md: 'hidden' },
          gap: 1.2,
        }}
      >
      <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" mb={0}>
        <Typography variant="h4" fontWeight="bold" textAlign="center">
          {debate.title}
        </Typography>
        <Chip
          label={isPublic ? 'Public' : 'Private'}
          color={isPublic ? 'success' : 'default'}
          size="small"
          sx={{ ml: 1 }}
        />
      </Stack>
      <Typography variant="body1" color="text.secondary" textAlign="center" mb={1}>
        {debate.description}
      </Typography>

      <Box
        sx={{
          mb: 0,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight="bold">
              Proponent Points: {tProponent.points}
            </Typography>
            <Button
          variant={myVote === 'proponent' ? 'contained' : 'outlined'}
          disabled={!isLoggedIn || !debateActive || casting}
          onClick={() => castVote('proponent')}
        >
          Vote Proponent ({votes.proponent})
        </Button>
            <Chip size="small" label={(debate.status || '').toUpperCase()} />
          </Stack>
          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
            <Chip size="small" label={`Likes: ${tProponent.likes}`} />
            <Chip size="small" label={`Dislikes: ${tProponent.dislikes}`} />
            <Chip size="small" label={`Upvotes: ${tProponent.upvotes}`} />
            <Chip size="small" label={`Downvotes: ${tProponent.downvotes}`} />
            <Chip size="small" color="primary" label={`Votes: ${votes.proponent}`} />
          </Stack>
        </Paper>  

        <Paper sx={{ p: 2, borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1" fontWeight="bold">
              Opponent Points: {tOpponent.points}
            </Typography>
            <Button
          variant={myVote === 'opponent' ? 'contained' : 'outlined'}
          disabled={!isLoggedIn || !debateActive || casting}
          onClick={() => castVote('opponent')}
        >
          Vote Opponent ({votes.opponent})
        </Button>
            <Chip size="small" label={(debate.status || '').toUpperCase()} />
          </Stack>
          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
            <Chip size="small" label={`Likes: ${tOpponent.likes}`} />
            <Chip size="small" label={`Dislikes: ${tOpponent.dislikes}`} />
            <Chip size="small" label={`Upvotes: ${tOpponent.upvotes}`} />
            <Chip size="small" label={`Downvotes: ${tOpponent.downvotes}`} />
            <Chip size="small" color="primary" label={`Votes: ${votes.opponent}`} />
          </Stack>
        </Paper>
      </Box>

      {isInstructorOwner && (
        <Stack direction="row" spacing={1} justifyContent="center" mb={0}>
          {debate.status !== 'active' && (
            <Button
              variant="contained"
              color="success"
              onClick={async () => {
                await api.post(
                  `/debates/join/${joincode}/start`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } },
                );
                const { data } = await api.get(`/debates/join/${joincode}`);
                setDebate(data);
              }}
            >
              Start Debate
            </Button>
          )}
          {debate.status === 'active' && (
            <Button
              variant="outlined"
              color="error"
              onClick={async () => {
                await api.post(
                  `/debates/join/${joincode}/stop`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } },
                );
                const { data } = await api.get(`/debates/join/${joincode}`);
                setDebate(data);
              }}
            >
              Stop Debate
            </Button>
          )}
        </Stack>
      )}

      <Stack direction="row" spacing={1} justifyContent="center" mb={0}>
        {debate.status === 'closed' && (
          <Button
            variant="contained"
            onClick={async () => {
              const { data } = await api.get(`/debates/join/${joincode}/results`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setResults(data);
              setResultsOpen(true);
            }}
          >
            Show Results
          </Button>
        )}
      </Stack>

      {pinned.length > 0 && (
        <Stack direction="row" justifyContent="center" mb={0} spacing={1} sx={{ flexWrap: 'wrap' }}>
          {pinned.slice(0, 3).map((m) => (
            <Chip
              key={m._id}
              sx={{
                bgcolor: isDark ? alpha('#ffe3a3', 0.2) : alpha('#fff6da', 0.86),
                maxWidth: 380,
                '& .MuiChip-label': {
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                },
              }}
              variant="outlined"
              size="small"
              icon={<PushPinIcon fontSize="small" />}
              label={`Pinned message from ${m.senderName}: ${m.content.slice(0, 40)}${
                m.content.length > 40 ? '…' : ''
              }`}
              onClick={() => scrollToMessage(m._id)}
            />
          ))}
        </Stack>
      )}

      {assignedSide && (
        <Stack direction="row" justifyContent="center" mb={0}>
          <Chip
            label={`You are a ${sideLabel[assignedSide]}`}
            sx={{
              bgcolor: sideColors[assignedSide].bg,
              border: '1px solid',
              borderColor: sideColors[assignedSide].border,
              color: sideColors[assignedSide].text,
            }}
            variant="outlined"
            size="medium"
          />
        </Stack>
      )}

      <Box
        display="grid"
        gap={1}
        justifyContent="center"
        sx={{
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(300px, 1fr))' },
          flex: 1,
          minHeight: 0,
        }}
      >
        {sides.map((sideKey) => {
          const topLevel = messages
            .filter((m) => m.side === sideKey && !m.replyTo)
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

          return (
            <Paper
              key={sideKey}
              sx={{
                p: 2,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 3,
                minHeight: { xs: 420, md: 0 },
                height: { xs: 'auto', md: '100%' },
              }}
            >
              <Typography variant="h6" gutterBottom textAlign="center">
                {sideLabel[sideKey]} Views
              </Typography>

              <List
                sx={{
                  flexGrow: 1,
                  overflowY: { xs: 'visible', md: 'auto' },
                  minHeight: 0,
                  mb: 2,
                  pr: 1
                }}
              >
                {topLevel.length === 0 ? (
                  <Typography textAlign="center" color="text.secondary" mt={2}>
                    No messages yet.
                  </Typography>
                ) : (
                  topLevel.map((msg) => (
                    <MessageItem
                      key={msg._id}
                      msg={msg}
                      depth={0}
                      sideKey={sideKey}
                      replyValue={replyDrafts[msg._id]}
                      onChangeReply={handleReplyDraftChange}
                      editValue={editDrafts[msg._id]}
                      onChangeEdit={handleEditDraftChange}
                    />
                  ))
                )}
                <div ref={listEndRefs[sideKey]} />
              </List>

              <Box display="flex" gap={1} flexWrap={{ xs: 'wrap', md: 'nowrap' }}>
                <TextField
                  id={`reply-input-${sideKey}`}
                  placeholder={
                    canPost(sideKey)
                      ? (editTarget && editTarget.side === sideKey
                          ? 'Edit your message'
                          : replyTarget && replyTarget.side === sideKey
                          ? 'Write your reply'
                          : 'Your message')
                      : !isLoggedIn
                      ? 'Login required'
                      : isPublic
                      ? 'Debate not active'
                      : 'Not assigned to this side'
                  }
                  fullWidth
                  value={inputs[sideKey]}
                  onChange={(e) => handleInputChange(sideKey, e.target.value)}
                  size="small"
                  disabled={!canPost(sideKey)}
                />
                <FormControlLabel
                  sx={{ ml: 1 }}
                  control={
                    <Switch
                      checked={!!anonBySide[sideKey]}
                      onChange={(e) => setAnonBySide(p => ({ ...p, [sideKey]: e.target.checked }))}
                      size="small"
                    />
                  }
                  label="Anonymous"
                />
                <Menu
                  anchorReference={menuPos ? 'anchorPosition' : 'anchorEl'}
                  anchorEl={menuAnchor}
                  anchorPosition={menuPos || { top: 0, left: 0 }}
                  open={Boolean(menuPos || menuAnchor)}
                  onClose={closeMenu}
                  keepMounted
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                >
                  {menuMsg && currentUser && menuMsg.senderID === currentUser.userID && (
                    <MenuItem
                      onClick={() => {
                        startEdit(menuMsg);
                        closeMenu();
                      }}
                    >
                      <ListItemIcon>
                        <EditOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Edit</ListItemText>
                    </MenuItem>
                  )}

                  {menuMsg &&
                    currentUser &&
                    (menuMsg.senderID === currentUser.userID || isInstructorOwner) && (
                      <MenuItem
                        onClick={() => {
                          handleDelete(menuMsg);
                          closeMenu();
                        }}
                      >
                        <ListItemIcon>
                          <DeleteOutlineIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Delete</ListItemText>
                      </MenuItem>
                    )}

                  {menuMsg && isInstructorOwner && (
                    <MenuItem
                      onClick={() => {
                        handlePinToggle(menuMsg);
                        closeMenu();
                      }}
                    >
                      <ListItemIcon>
                        {menuMsg.pinned ? (
                          <PushPinIcon fontSize="small" />
                        ) : (
                          <PushPinOutlinedIcon fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText>{menuMsg.pinned ? 'Unpin' : 'Pin'}</ListItemText>
                    </MenuItem>
                  )}

                  {menuMsg && (
                    <MenuItem
                      onClick={() => {
                        handleFlag(menuMsg);
                        closeMenu();
                      }}
                    >
                      <ListItemIcon>
                        <FlagOutlinedIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>Flag as inappropriate</ListItemText>
                    </MenuItem>
                  )}
                </Menu>

                <Button
                  variant="contained"
                  onClick={() => sendMessage(sideKey)}
                  disabled={!canPost(sideKey)}
                >
                  Send
                </Button>
              </Box>
            </Paper>
          );
        })}
        <PublicProfileDialog open={profileOpen} onClose={closeProfile} userID={profileUserID} isAnonymous={false} />
      </Box>

      <Dialog open={resultsOpen} onClose={() => setResultsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Debate Results</DialogTitle>
        <DialogContent dividers>
  {!results ? (
    <Typography>Loading…</Typography>
  ) : (
    <Stack spacing={2}>
      <Typography variant="subtitle1">
        Outcome:{' '}
        <b>
          {results.winner === 'draw'
            ? 'Draw'
            : `${results.winner.charAt(0).toUpperCase() + results.winner.slice(1)} won`}
        </b>
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold">Votes</Typography>
        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" alignItems="center">
          <Chip size="small" color="primary" label={`Proponent: ${results.votes?.proponent ?? 0}`} />
          <Chip size="small" color="primary" label={`Opponent: ${results.votes?.opponent ?? 0}`} />
        </Stack>
      </Paper>

      {['proponent', 'opponent', 'neutral'].map((s) => (
        <Paper key={s} sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Typography>
          <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
            <Chip size="small" label={`Likes: ${results.tallies[s].likes}`} />
            <Chip size="small" label={`Dislikes: ${results.tallies[s].dislikes}`} />
            <Chip size="small" label={`Upvotes: ${results.tallies[s].upvotes}`} />
            <Chip size="small" label={`Downvotes: ${results.tallies[s].downvotes}`} />
            <Chip size="small" label={`Points: ${results.tallies[s].points}`} />
          </Stack>
        </Paper>
      ))}

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold">Top Messages</Typography>
        <Typography sx={{ mt: 1 }}>
          <b>Most Liked:</b> {results.mostLiked?.senderName} — “{results.mostLiked?.content}” ({results.mostLiked?.likes || 0})
        </Typography>
        <Typography>
          <b>Most Disliked:</b> {results.mostDisliked?.senderName} — “{results.mostDisliked?.content}” ({results.mostDisliked?.dislikes || 0})
        </Typography>
        <Typography>
          <b>Most Upvoted:</b> {results.mostUpvoted?.senderName} — “{results.mostUpvoted?.content}” ({results.mostUpvoted?.upvotes || 0})
        </Typography>
        <Typography>
          <b>Most Downvoted:</b> {results.mostDownvoted?.senderName} — “{results.mostDownvoted?.content}” ({results.mostDownvoted?.downvotes || 0})
        </Typography>
      </Paper>
    </Stack>
  )}
</DialogContent>
        <DialogActions>
          <Button onClick={() => setResultsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast((p) => ({ ...p, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
      </Box>
    </PageShell>
  );
}

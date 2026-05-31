import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import socket from '../services/socket';
import PublicProfileDialog from '../components/PublicProfileDialog';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';

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
  const isDark = true; // always dark in Stitch Premium
  const isCompactActions = window.innerWidth < 600;

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
  const sideColors = {
    proponent: {
      bg: 'rgba(136,169,146,0.15)',
      border: 'rgba(56,189,248,0.2)',
      text: '#d7e9dc',
      accent: '#38bdf8',
    },
    neutral: {
      bg: 'rgba(142,166,191,0.1)',
      border: 'rgba(255,255,255,0.08)',
      text: '#dce8f5',
      accent: 'rgba(142,166,191,0.5)',
    },
    opponent: {
      bg: 'rgba(181,141,149,0.12)',
      border: 'rgba(255,69,58,0.2)',
      text: '#f0dde1',
      accent: '#ff453a',
    },
  };
  const authorColors = {
    proponent: sideColors.proponent,
    opponent: sideColors.opponent,
    instructor: sideColors.neutral,
  };

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
  const reactionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'inline-flex', alignItems: 'center', borderRadius: 6, transition: 'background 0.15s' };

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
      }
    }, [editTarget, msg._id, msg.content]);

    const kids = getChildren(msg._id);
    const open = isCommentsOpen(msg._id);
    const limit = visibleCommentsCount(msg._id);
    const longBody = (msg.content || '').length > BODY_TRUNCATE;
    const expanded = isBodyExpanded(msg._id);
    const bucket = getAuthorBucket(msg, debate);
    const colors = authorColors[bucket] || sideColors[sideKey];

    return (
      <div 
        ref={el => { if (el) messageRefs.current[msg._id] = el; }}
        className="page-transition"
        style={{ marginBottom: 12, paddingLeft: depth > 0 ? 16 : 0 }}
      >
        <div 
          className="arena-message" 
          style={{ borderColor: colors.border, color: colors.text }}
        >
          {/* Reply-to reference */}
          {msg.replyTo && messageById[msg.replyTo] && (
            <button 
              className="action-pill"
              onClick={() => scrollToMessage(msg.replyTo)}
              style={{ marginBottom: 10, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', background: 'rgba(255,255,255,0.03)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>shortcut</span>
              {messageById[msg.replyTo].senderName || 'Anonymous'}: "{messageById[msg.replyTo].content?.slice(0, 40)}..."
            </button>
          )}

          {/* Header */}
          <div className="message-meta">
            {msg.isAnonymous ? (
              <span className="message-sender" style={{ color: colors.text, opacity: 0.8 }}>Anonymous Agent</span>
            ) : (
              <span 
                className="message-sender" 
                style={{ color: colors.accent || colors.text }}
                onClick={() => openProfile(msg.senderID)}
              >
                {msg.senderName || msg.sender?.name || 'Unknown'}
              </span>
            )}
            {msg.pinned && (
              <span className="badge-primary" style={{ fontSize: 9, padding: '2px 6px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>push_pin</span>
                PINNED
              </span>
            )}
            <div style={{ flex: 1 }} />
            <button className="action-pill" onClick={e => openMenu(e, msg)}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>more_horiz</span>
            </button>
          </div>

          {/* Body */}
          <div className="message-content" style={{ color: colors.text }}>
            {longBody && !expanded ? `${msg.content.slice(0, BODY_TRUNCATE)}…` : msg.content}
            {longBody && (
              <button 
                onClick={() => toggleBodyExpand(msg._id)} 
                className="action-pill"
                style={{ marginLeft: 8, color: colors.accent || 'var(--primary)', padding: 0 }}
              >
                {expanded ? 'collapse' : 'expand'}
              </button>
            )}
          </div>

          {/* Edit inline */}
          {editTarget && editTarget.id === msg._id && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea 
                id={`inline-edit-${msg._id}`} 
                className="rhetoric-input"
                style={{ padding: '8px 12px', minHeight: 80 }}
                value={localEdit} 
                onChange={e => setLocalEdit(e.target.value)}
                disabled={!canPost(editTarget.side)} 
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn-ghost" onClick={cancelEdit}>Cancel</button>
                <button 
                  className="btn-primary" 
                  style={{ padding: '8px 16px' }}
                  onClick={() => sendEdit({ id: msg._id, side: editTarget.side, content: localEdit })}
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Footer Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ color: colors.text, opacity: 0.3, fontSize: 10, letterSpacing: '0.02em' }}>
              {format(new Date(msg.createdAt), 'hh:mm a · MMM dd')}
            </span>
            {msg.editedAt && <span className="badge-neutral" style={{ fontSize: 9, padding: '2px 6px' }}>EDITED</span>}
          </div>

          {/* Reactions */}
          <div className="message-actions">
            {[
              { key: 'like', icon: 'favorite', active: hasLiked(msg), count: msg.likes?.length || 0, fn: () => toggleLike(msg) },
              { key: 'upvote', icon: 'arrow_upward', active: hasUpvoted(msg), count: msg.upvotes?.length || 0, fn: () => toggleUpvote(msg) },
              { key: 'downvote', icon: 'arrow_downward', active: hasDisliked(msg), count: msg.dislikes?.length || 0, fn: () => toggleDislike(msg) },
              { key: 'downvote', icon: 'arrow_downward', active: hasDownvoted(msg), count: msg.downvotes?.length || 0, fn: () => toggleDownvote(msg) },
            ].map(r => (
              <button 
                key={r.key} 
                className={`action-pill ${r.active ? 'active' : ''}`}
                onClick={r.fn}
                style={{ color: r.active ? colors.accent : undefined }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{r.icon}</span>
                {r.count > 0 && r.count}
              </button>
            ))}
            <button className="action-pill" onClick={() => startReply(msg)} disabled={readOnly}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chat_bubble</span>
              Reply
            </button>
          </div>

          {/* Reply inline */}
          {replyTarget && replyTarget.id === msg._id && (
            <div className="page-transition" style={{ marginTop: 16, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
              <textarea 
                id={`inline-reply-${msg._id}`} 
                className="rhetoric-input"
                style={{ padding: '12px', minHeight: 100 }}
                value={localReply} 
                onChange={e => setLocalReply(e.target.value)}
                placeholder={`Replying to ${replyTarget.senderName}...`}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <label className="text-caption" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                  <input type="checkbox" checked={replyAnon} onChange={e => setReplyAnon(e.target.checked)} style={{ accentColor: 'var(--primary)' }} />
                  Post Anonymously
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-ghost" onClick={cancelReply}>Cancel</button>
                  <button 
                    className="btn-primary"
                    style={{ padding: '8px 20px' }}
                    disabled={!localReply.trim()}
                    onClick={() => sendReply({ id: msg._id, side: replyTarget.side, content: localReply })}
                  >
                    Deploy Reply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Thread comments */}
        {kids.length > 0 && (
          <div style={{ marginTop: 6, paddingLeft: 12 }}>
            {!open ? (
              <button 
                className="action-pill" 
                onClick={() => openCommentsFor(msg._id)}
                style={{ color: colors.accent || 'var(--primary)', fontWeight: 800 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>expand_more</span>
                VIEW {kids.length} RESPONSES
              </button>
            ) : (
              <div style={{ borderLeft: `1px solid ${colors.border}`, paddingLeft: 12, marginTop: 12 }}>
                {kids.slice(0, limit).map(child => (
                  <MessageItem key={child._id} msg={child} depth={depth + 1} sideKey={sideKey} />
                ))}
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  {limit < kids.length && (
                    <button className="action-pill" onClick={() => showMoreCommentsFor(msg._id)}>
                      Load more replies
                    </button>
                  )}
                  <button className="action-pill" onClick={() => hideCommentsFor(msg._id)}>
                    Collapse thread
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  });

  if (!debate) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)', alignItems: 'center', justifyContent: 'center' }}>
        <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
        <Sidebar user={currentUser} />
        <div className="page-transition" style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <h2 className="text-display-xl" style={{ color: 'var(--error)', marginBottom: 24 }}>ARENA REDACTED</h2>
          <p className="text-body-lg" style={{ color: 'var(--on-surface-variant)', marginBottom: 32 }}>The requested debate session could not be located in the archives.</p>
          <button className="btn-primary" onClick={() => navigate('/')}>Return to Base</button>
        </div>
      </div>
    );
  }

  const tProponent = computeSideTallies(messages, 'proponent');
  const tOpponent = computeSideTallies(messages, 'opponent');
  const assignedSide = !isInstructorOwner ? getAssignedSide() : null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      <div className="ambient-bg"><div className="blob-1" /><div className="blob-2" /></div>
      <Sidebar user={currentUser} />
      
      <div className="rhetoric-main page-transition" style={{ position: 'relative', zIndex: 1 }}>
        <header className="rhetoric-topbar">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 className="text-headline-md" style={{ color: 'var(--on-surface)', margin: 0 }}>
                {debate.title}
              </h1>
              <div className="badge-neutral">{isPublic ? 'PUBLIC' : 'CONFIDENTIAL'}</div>
              <div className={`badge-${debate.status === 'active' ? 'live' : 'neutral'}`}>
                {debate.status === 'active' && <div className="pulse-dot" />}
                {debate.status.toUpperCase()}
              </div>
            </div>
            {debate.description && (
              <p className="text-caption" style={{ color: 'var(--on-surface-variant)', marginTop: 4 }}>
                {debate.description}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              className={`vote-button ${myVote === 'proponent' ? 'active' : ''}`}
              onClick={() => castVote('proponent')} 
              disabled={!isLoggedIn || !debateActive || casting}
            >
              PRO {votes.proponent}
            </button>
            <button 
              className={`vote-button opponent ${myVote === 'opponent' ? 'active' : ''}`}
              onClick={() => castVote('opponent')} 
              disabled={!isLoggedIn || !debateActive || casting}
            >
              OPP {votes.opponent}
            </button>
            
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

            {isInstructorOwner && (
              <>
                {debate.status !== 'active' && (
                  <button className="btn-primary" onClick={async () => { await api.post(`/debates/join/${joincode}/start`, {}, { headers: { Authorization: `Bearer ${token}` } }); window.location.reload(); }}>
                    Deploy Arena
                  </button>
                )}
                {debate.status === 'active' && (
                  <button className="btn-danger" onClick={async () => { await api.post(`/debates/join/${joincode}/stop`, {}, { headers: { Authorization: `Bearer ${token}` } }); window.location.reload(); }}>
                    Terminate
                  </button>
                )}
              </>
            )}
            {debate.status === 'closed' && (
              <button className="btn-outline" onClick={async () => { const { data } = await api.get(`/debates/join/${joincode}/results`, { headers: { Authorization: `Bearer ${token}` } }); setResults(data); setResultsOpen(true); }}>
                Review Analytics
              </button>
            )}
          </div>
        </header>

        {/* Pinned Alerts */}
        <AnimatePresence>
          {pinned.length > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              style={{ padding: '12px 24px', background: 'rgba(56,189,248,0.03)', borderBottom: '1px solid rgba(56,189,248,0.1)', display: 'flex', gap: 12, overflow: 'hidden' }}
            >
              {pinned.slice(0, 3).map(m => (
                <button 
                  key={m._id} 
                  className="action-pill active"
                  onClick={() => scrollToMessage(m._id)}
                  style={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>push_pin</span>
                  {m.senderName}: {m.content}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tactical Feed */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'rgba(255,255,255,0.05)', height: 'calc(100vh - 160px)' }}>
          {sides.map(sideKey => {
            const topLevel = messages.filter(m => m.side === sideKey && !m.replyTo).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const sc = sideColors[sideKey];
            const isActiveSide = assignedSide === sideKey;

            return (
              <div key={sideKey} style={{ display: 'flex', flexDirection: 'column', background: 'var(--background)', position: 'relative' }}>
                <div style={{ padding: '16px 20px', borderBottom: `1px solid ${sc.border}`, display: 'flex', alignItems: 'center', gap: 10, background: sc.bg }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.accent }} />
                  <span className="text-label-bold" style={{ color: sc.text, textTransform: 'uppercase' }}>{sideLabel[sideKey]}</span>
                  {isActiveSide && <span className="badge-primary" style={{ fontSize: 10 }}>YOUR STATION</span>}
                  <div style={{ flex: 1 }} />
                  <span className="text-caption" style={{ opacity: 0.4 }}>{topLevel.length}</span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {topLevel.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '64px 20px', opacity: 0.2 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 12 }}>terminal</span>
                      <p className="text-caption">Awaiting tactical data...</p>
                    </div>
                  ) : (
                    topLevel.map(msg => <MessageItem key={msg._id} msg={msg} depth={0} sideKey={sideKey} />)
                  )}
                  <div ref={listEndRefs[sideKey]} />
                </div>

                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
                  <div className="input-wrapper" style={{ marginBottom: 12 }}>
                    <textarea
                      className="rhetoric-input"
                      style={{ padding: '12px 16px', minHeight: 80, border: isActiveSide ? `1px solid ${sc.border}` : undefined }}
                      placeholder={canPost(sideKey) ? "Input argument..." : "Access restricted"}
                      value={inputs[sideKey]}
                      onChange={e => handleInputChange(sideKey, e.target.value)}
                      disabled={!canPost(sideKey)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(sideKey); } }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="text-caption" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', opacity: 0.5 }}>
                      <input type="checkbox" checked={!!anonBySide[sideKey]} onChange={e => setAnonBySide(p => ({ ...p, [sideKey]: e.target.checked }))} style={{ accentColor: sc.accent }} />
                      Stealth Mode
                    </label>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '8px 24px', background: sc.accent }}
                      onClick={() => sendMessage(sideKey)} 
                      disabled={!canPost(sideKey) || !inputs[sideKey].trim()}
                    >
                      Transmit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PublicProfileDialog open={profileOpen} onClose={closeProfile} userID={profileUserID} isAnonymous={false} />

      {/* Legacy Context Menu - Still needed but styled better */}
      <AnimatePresence>
        {menuPos && menuMsg && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, background: 'var(--surface-container-highest)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, boxShadow: '0 12px 48px rgba(0,0,0,0.6)', zIndex: 1000, overflow: 'hidden' }}>
            <div style={{ padding: '8px' }}>
              {currentUser && menuMsg.senderID === currentUser.userID && (
                <button className="nav-link" onClick={() => { startEdit(menuMsg); closeMenu(); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span> Edit Argument
                </button>
              )}
              {currentUser && (menuMsg.senderID === currentUser.userID || isInstructorOwner) && (
                <button className="nav-link" style={{ color: 'var(--error)' }} onClick={() => { handleDelete(menuMsg); closeMenu(); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span> Redact
                </button>
              )}
              {isInstructorOwner && (
                <button className="nav-link" onClick={() => { handlePinToggle(menuMsg); closeMenu(); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>push_pin</span> {menuMsg.pinned ? 'Unpin' : 'Pin to Intel'}
                </button>
              )}
              <button className="nav-link" onClick={() => { handleFlag(menuMsg); closeMenu(); }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>flag</span> Report Violation
              </button>
            </div>
            <button className="btn-ghost" style={{ width: '100%', borderRadius: 0, border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)' }} onClick={closeMenu}>Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Overlay */}
      <AnimatePresence>
        {resultsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="glass-panel" style={{ padding: 48, borderRadius: 32, maxWidth: 800, width: '100%', position: 'relative' }}>
              <button onClick={() => setResultsOpen(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32 }}>close</span>
              </button>
              
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <h2 className="text-display-xl" style={{ marginBottom: 16 }}>ARENA SUMMARY</h2>
                <div style={{ height: 2, width: 80, background: 'var(--primary)', margin: '0 auto' }} />
              </div>

              {!results ? <div className="rhetoric-loader"><div className="spinner" /></div> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  <div className="glass-card" style={{ padding: 32, borderRadius: 24, textAlign: 'center', background: 'rgba(56,189,248,0.05)' }}>
                    <p className="text-label-bold" style={{ color: 'var(--primary)', marginBottom: 8 }}>PREVAILING PERSPECTIVE</p>
                    <h3 className="text-headline-lg" style={{ fontSize: 48 }}>
                      {results.winner === 'draw' ? 'STALEMATE' : results.winner.toUpperCase()}
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div className="stat-card">
                      <p className="text-caption">PROPONENT VOTES</p>
                      <h4 className="text-headline-lg" style={{ fontSize: 40 }}>{results.votes?.proponent ?? 0}</h4>
                      <div className="glow-blob" />
                    </div>
                    <div className="stat-card">
                      <p className="text-caption">OPPONENT VOTES</p>
                      <h4 className="text-headline-lg" style={{ fontSize: 40, color: '#ff97a3' }}>{results.votes?.opponent ?? 0}</h4>
                      <div className="glow-blob" style={{ background: 'rgba(255,151,163,0.1)' }} />
                    </div>
                  </div>

                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setResultsOpen(false)}>Acknowledged</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <AnimatePresence>
        {toast.open && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            style={{ position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.severity === 'error' ? 'rgba(255,151,163,0.95)' : 'rgba(56,189,248,0.95)', color: '#0b1326', padding: '16px 32px', borderRadius: 16, fontWeight: 800, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            onClick={() => setToast(p => ({ ...p, open: false }))}>
            <span className="material-symbols-outlined">{toast.severity === 'error' ? 'report' : 'info'}</span>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

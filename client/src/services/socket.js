import api from './api';

class MockSocket {
  constructor() {
    this.listeners = {};
    this.currentJoincode = null;
    this.pollInterval = null;
    this.previousMessages = [];
    this.previousVotes = { proponent: 0, opponent: 0 };
  }

  // Register event listeners
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // Remove event listeners
  off(event, callback) {
    if (!event) {
      this.listeners = {};
      return;
    }
    if (!callback) {
      delete this.listeners[event];
      return;
    }
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  // Trigger local event callbacks
  trigger(event, data) {
    const callbacks = this.listeners[event] || [];
    callbacks.forEach(cb => {
      try {
        cb(data);
      } catch (err) {
        console.error(`Error in socket listener for ${event}:`, err);
      }
    });
  }

  // Emit client action
  emit(event, payload, cb) {
    if (event === 'joinDebate') {
      const joincode = Number(payload?.joincode);
      if (joincode) {
        this.joinDebate(joincode);
      }
      if (typeof cb === 'function') {
        cb({ ok: true });
      }
    }
  }

  // Join room and start polling
  joinDebate(joincode) {
    this.currentJoincode = joincode;
    this.previousMessages = [];
    this.previousVotes = { proponent: 0, opponent: 0 };

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    // Start polling immediately
    this.poll();

    // Poll every 3 seconds
    this.pollInterval = setInterval(() => {
      this.poll();
    }, 3000);
  }

  async poll() {
    const joincode = this.currentJoincode;
    if (!joincode) return;

    try {
      // 1. Poll messages
      const msgResponse = await api.get(`/messages/${joincode}`);
      const newMessages = Array.isArray(msgResponse.data) ? msgResponse.data : [];

      if (this.previousMessages.length > 0) {
        const prevMap = new Map(this.previousMessages.map(m => [m._id, m]));

        // Check for new/updated messages
        newMessages.forEach(msg => {
          const prevMsg = prevMap.get(msg._id);
          if (!prevMsg) {
            // New message
            this.trigger(`newMessage:${joincode}`, msg);
          } else {
            // Check if contents updated (edited)
            if (msg.content !== prevMsg.content) {
              this.trigger(`messageEdited:${joincode}`, msg);
            }
            // Check if reactions/flags/pinned status updated
            const reactionsChanged = 
              JSON.stringify(msg.likes || []) !== JSON.stringify(prevMsg.likes || []) ||
              JSON.stringify(msg.dislikes || []) !== JSON.stringify(prevMsg.dislikes || []) ||
              JSON.stringify(msg.upvotes || []) !== JSON.stringify(prevMsg.upvotes || []) ||
              JSON.stringify(msg.downvotes || []) !== JSON.stringify(prevMsg.downvotes || []) ||
              JSON.stringify(msg.flags || []) !== JSON.stringify(prevMsg.flags || []);

            if (reactionsChanged) {
              this.trigger(`messageUpdated:${joincode}`, {
                _id: msg._id,
                likes: msg.likes,
                dislikes: msg.dislikes,
                upvotes: msg.upvotes,
                downvotes: msg.downvotes,
                flags: msg.flags
              });
            }

            if (msg.pinned !== prevMsg.pinned) {
              this.trigger(`messagePinned:${joincode}`, {
                _id: msg._id,
                pinned: msg.pinned
              });
            }
          }
        });

        // Check for deleted messages
        const newMap = new Map(newMessages.map(m => [m._id, m]));
        this.previousMessages.forEach(prevMsg => {
          if (!newMap.has(prevMsg._id)) {
            this.trigger(`messageDeleted:${joincode}`, { _id: prevMsg._id });
          }
        });
      } else if (newMessages.length > 0) {
        // Trigger initial load if needed (optional since pages fetch initial values themselves, but safe)
      }

      this.previousMessages = newMessages;

      // 2. Poll votes
      try {
        const token = localStorage.getItem('token');
        const votesResponse = await api.get(`/debates/join/${joincode}/votes`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        const voteData = votesResponse.data;
        if (voteData && typeof voteData === 'object') {
          const propCount = Number(voteData.proponent || 0);
          const oppCount = Number(voteData.opponent || 0);

          if (propCount !== this.previousVotes.proponent || oppCount !== this.previousVotes.opponent) {
            this.trigger(`voteUpdated:${joincode}`, {
              proponent: propCount,
              opponent: oppCount
            });
          }
          this.previousVotes = { proponent: propCount, opponent: oppCount };
        }
      } catch (err) {
        // Silently catch vote fetch errors (e.g. if routes not loaded yet or unauthenticated)
      }

    } catch (err) {
      console.error('Error during client-side polling:', err);
    }
  }

  disconnect() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.currentJoincode = null;
    this.listeners = {};
  }
}

const socket = new MockSocket();
export default socket;

import { io as socketIO } from 'socket.io-client';
import api from './api';

class HybridSocket {
  constructor() {
    this.listeners = {};
    this.currentJoincode = null;
    this.pollInterval = null;
    this.previousMessages = [];
    this.previousVotes = { proponent: 0, opponent: 0 };
    this.previousStatus = null;

    // Determine the socket url from the API base URL
    const baseURL = api.defaults.baseURL || '';
    const socketURL = baseURL.replace(/\/api\/?$/, ''); // e.g. http://localhost:5000

    this.socket = null;
    this.isRealSocketConnected = false;

    if (socketURL) {
      try {
        console.log(`Initializing HybridSocket client connecting to: ${socketURL}`);
        this.socket = socketIO(socketURL, {
          transports: ['websocket', 'polling'],
          autoConnect: true,
          reconnection: true,
          timeout: 5000,
        });

        this.socket.on('connect', () => {
          console.log('Real Socket.io connected successfully!');
          this.isRealSocketConnected = true;
          // If we had a joincode active, join now
          if (this.currentJoincode) {
            this.socket.emit('joinDebate', { joincode: this.currentJoincode });
          }
          // Stop polling if connected
          if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
          }
        });

        this.socket.on('disconnect', () => {
          console.warn('Real Socket.io disconnected.');
          this.isRealSocketConnected = false;
          this.startPollingIfNeeded();
        });

        this.socket.on('connect_error', (err) => {
          console.warn('Real Socket.io connection error:', err.message);
          this.isRealSocketConnected = false;
          this.startPollingIfNeeded();
        });
      } catch (err) {
        console.error('Failed to initialize Socket.io client:', err);
      }
    }
  }

  // Register event listeners
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Also register on real socket
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listeners
  off(event, callback) {
    if (!event) {
      this.listeners = {};
      if (this.socket) {
        this.socket.off();
      }
      return;
    }
    if (!callback) {
      delete this.listeners[event];
      if (this.socket) {
        this.socket.off(event);
      }
      return;
    }
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Trigger local event callbacks (used by polling fallback)
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
    }

    if (this.isRealSocketConnected && this.socket) {
      this.socket.emit(event, payload, cb);
    } else {
      if (typeof cb === 'function') {
        cb({ ok: true });
      }
    }
  }

  // Join room and start polling if real socket is not connected
  joinDebate(joincode) {
    this.currentJoincode = joincode;
    this.previousMessages = [];
    this.previousVotes = { proponent: 0, opponent: 0 };
    this.previousStatus = null;

    if (this.isRealSocketConnected && this.socket) {
      this.socket.emit('joinDebate', { joincode });
    }

    this.startPollingIfNeeded();
  }

  startPollingIfNeeded() {
    if (this.isRealSocketConnected) {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
      return;
    }

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
      } catch (err) {}

      // 3. Poll debate status
      try {
        const token = localStorage.getItem('token');
        const debateResponse = await api.get(`/debates/join/${joincode}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const debateData = debateResponse.data;
        if (debateData && debateData.status) {
          if (this.previousStatus && debateData.status !== this.previousStatus) {
            this.trigger(`statusUpdated:${joincode}`, {
              status: debateData.status
            });
          }
          this.previousStatus = debateData.status;
        }
      } catch (err) {}

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
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

const socket = new HybridSocket();
export default socket;

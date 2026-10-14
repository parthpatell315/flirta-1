// GarbaJodi Reactive State Manager

const State = {
  user: null,
  profile: null,
  photos: [],
  matchesCount: 0,
  unreadMessagesCount: 0,
  currentRoute: '/',
  activeConversationId: null,
  listeners: [],

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },

  notify() {
    this.listeners.forEach(fn => fn(this));
  },

  setUser(user, profile = null, photos = []) {
    this.user = user;
    this.profile = profile;
    this.photos = photos;
    this.notify();
  },

  setCounts(matches, unread) {
    this.matchesCount = matches;
    this.unreadMessagesCount = unread;
    this.notify();
  },

  setRoute(route) {
    this.currentRoute = route;
    this.notify();
  },

  isAuthenticated() {
    return !!this.user;
  },

  isAdmin() {
    return this.user && this.user.role === 'admin';
  }
};

window.State = State;

// GarbaJodi API Client Wrapper

const API = {
  getToken() {
    return localStorage.getItem('garbajodi_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('garbajodi_token', token);
    } else {
      localStorage.removeItem('garbajodi_token');
    }
  },

  getHeaders(isMultipart = false) {
    const headers = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  },

  async request(endpoint, options = {}) {
    const isMultipart = options.body instanceof FormData;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(isMultipart),
        ...(options.headers || {})
      }
    };

    if (config.body && !isMultipart && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(endpoint, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/register')) {
          this.setToken(null);
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      return data;
    } catch (err) {
      console.warn(`API Error [${endpoint}]:`, err.message);
      throw err;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body });
  },

  patch(endpoint, body) {
    return this.request(endpoint, { method: 'PATCH', body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  upload(endpoint, formData) {
    return this.request(endpoint, { method: 'POST', body: formData });
  }
};

window.API = API;

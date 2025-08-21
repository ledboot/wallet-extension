import permissionService from './permission';

interface SessionData {
  origin: string;
  icon: string;
  name: string;
}

export class Session {
  data?: SessionData;

  constructor(data: SessionData) {
    if (data) {
      this.setProp(data);
    }
  }

  setProp(data: SessionData) {
    this.data = data;
  }
}

// for each tab
const sessionMap = new Map<string, Session>();

const getSession = (id: string) => {
  return sessionMap.get(id);
};

const getOrCreateSession = (id: string) => {
  if (sessionMap.has(id)) {
    return getSession(id);
  }

  return createSession(id, {
    origin: '',
    icon: '',
    name: '',
  });
};

const createSession = (id: string, data: SessionData) => {
  const session = new Session(data);
  sessionMap.set(id, session);

  return session;
};

const deleteSession = (id: string) => {
  sessionMap.delete(id);
};

const broadcastEvent = (ev: string, data?: unknown, origin?: string) => {
  let sessions: any[] = [];
  sessionMap.forEach((session, key) => {
    if (permissionService.hasPermission(session.data?.origin || '')) {
      sessions.push({
        key,
        ...session,
      });
    }
  });

  // same origin
  if (origin) {
    sessions = sessions.filter((session) => session.data?.origin === origin);
  }

  sessions.forEach((session) => {
    try {
      session.pushMessage?.(ev, data);
    } catch (e) {
      if (sessionMap.has(session.key)) {
        deleteSession(session.key);
      }
    }
  });
};

export default {
  getSession,
  getOrCreateSession,
  deleteSession,
  broadcastEvent,
};

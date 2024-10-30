import {
  listConectedUsers,
  renderHistory,
  renderMessage,
  renderTyping,
  renderTypingStop,
} from './main';

class CustomEvent {
  constructor(type, name = null, message = null) {
    this.type = type;
    this.name = name;
    this.message = message;
  }
}

const events = {
  USER_CONNECTED: connected,
  USER_DISCONNECTED: disconnected,
  HISTORY: history,
  MESSAGE_CREATED: messageReceived,
  WHISPER_CREATED: whisperReceived,
  USERS_LISTED: usersListed,
  MESSAGE_TYPING_START: typingStart,
  MESSAGE_TYPING_END: typingEnd,
};

const socket = new WebSocket('ws://localhost:80');

socket.onopen = () => {
  console.log('Connection established');
};

socket.onmessage = (event) => {
  let parsedEvent = JSON.parse(event.data);
  const eventHandle = events[parsedEvent.type];
  if (eventHandle) {
    eventHandle(parsedEvent);
    console.log('Event handled:', parsedEvent);
    return;
  }
  console.log('Event not handled:', parsedEvent);
};

function connected(event) {
  listConectedUsers(event.type, event.user);
  renderMessage(event.message);
}

function disconnected(event) {
  listConectedUsers(event.type, event.user);
  renderMessage(event.message);
}

function history(event) {
  renderHistory(event.message);
}

function messageReceived(event) {
  renderMessage(event);
}

function whisperReceived(event) {
  renderMessage(event);
}

function usersListed(event) {
  listConectedUsers(event.type, event.message);
}

function typingStart(event) {
  renderTyping(event);
}

function typingEnd(event) {
  renderTypingStop(event);
}

export const openConnection = (user) => {
  socket.send(JSON.stringify(new CustomEvent('USER_CONNECT', user)));
};

export const sendMessage = (message) => {
  socket.send(JSON.stringify(new CustomEvent('MESSAGE_SENT', null, message)));
};

export const sendPrivateMessage = (receiver, content) => {
  socket.send(
    JSON.stringify(new CustomEvent('WHISPER_SENT', null, { receiver, content }))
  );
};

export const listUsers = () => {
  socket.send(JSON.stringify(new CustomEvent('CURRENT_USERS')));
};

export const listHistory = () => {
  socket.send(JSON.stringify(new CustomEvent('LIST_HISTORY')));
};

export const startTyping = (user) => {
  socket.send(JSON.stringify(new CustomEvent('MESSAGE_TYPING_START', user)));
};

export const stopTyping = (user) => {
  socket.send(JSON.stringify(new CustomEvent('MESSAGE_TYPING_END', user)));
};

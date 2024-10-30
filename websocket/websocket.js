import { createClient } from 'redis';
import { WebSocketServer } from 'ws';

class Event {
  constructor(type, user, message) {
    this.type = type;
    this.user = user;
    this.message = message;
  }
  validateEvent() {
    return this.type;
  }
}

const users = new Map();

const client = await createClient({
  url: 'redis://localhost:6379',
})
  .on('error', (err) => console.log('Redis Client Error', err))
  .connect();

const wss = new WebSocketServer({ port: 80 });

const events = {
  USER_CONNECT: connect,
  MESSAGE_SENT: sendMessage,
  WHISPER_SENT: sendPrivateMessage,
  CURRENT_USERS: listAllCurrentUsers,
  LIST_HISTORY: listHistory,
  MESSAGE_TYPING_START: startTyping,
  MESSAGE_TYPING_END: endTyping,
};

wss.on('connection', function connection(ws) {
  ws.on('message', (message) => {
    let object = parseEvent(message, ws);
    let ev = new Event(object.type, object.name, object.data);
    const event = events[object.type];
    if (!ev.validateEvent(event)) {
      ws.send('{"error": "Invalid event type"}');
      return;
    }
    event(object, ws);
  });

  ws.on('close', () => {
    users.forEach((value, key) => {
      if (key === ws) {
        var message = {
          type: 'ADMM_CREATED',
          message: `Usuario ${value.name} desconectado`,
          timestamp: new Date().toISOString(),
        };
        disconnect(new Event('USER_DISCONNECTED', value, message), ws);
        saveInCache(message, 'global_messages');
      }
    });
  });
});

function connect(event, ws) {
  if (!users.has(ws)) {
    const user = {
      name: event.name,
      createdAt: new Date().toISOString(),
    };
    users.set(ws, user);
    var message = {
      type: 'ADMM_CREATED',
      message: `Usuario ${user.name} conectado`,
      timestamp: new Date().toISOString(),
    };
    notificarTodos({ type: 'USER_CONNECTED', user, message });

    saveInCache(message, 'global_messages');

    listHistory(event, ws);
    return;
  }
  ws.send('{"error": "User already connected"}');
}

function sendMessage(event, ws) {
  if (users.has(ws)) {
    const messageData = {
      type: 'MESSAGE_CREATED',
      user: users.get(ws),
      message: event.message,
      timestamp: new Date().toISOString(),
    };
    notificarTodos(messageData);
    saveInCache(messageData, 'global_messages');
    return;
  }
  ws.send('{"error": "User not connected"}');
}

function sendPrivateMessage(event, ws) {
  if (users.has(ws)) {
    let sender = users.get(ws);
    let receiverName = event.message.receiver;
    let receiver = [...users.values()].find(
      (user) => user.name === receiverName
    );

    if (!receiver) {
      ws.send('{"error": "Receiver not connected"}');
      return;
    }

    const messageData = {
      type: 'WHISPER_CREATED',
      from: sender,
      to: receiver,
      message: event.message.content,
      timestamp: new Date().toISOString(),
    };

    // Notify both sender and receiver
    ws.send(JSON.stringify(messageData));
    users.forEach((user, userWs) => {
      if (user.name === receiverName) {
        userWs.send(JSON.stringify(messageData));
      }
    });

    saveInCache(messageData, 'private_messages');
    return;
  }
  ws.send('{"error": "Sender not connected"}');
}
async function listHistory(event, ws) {
  if (users.has(ws)) {
    let globalMessages = await client.get('global_messages');
    let privateMessages = await client.get('private_messages');

    let globalHistory = globalMessages ? JSON.parse(globalMessages) : [];
    let privateHistory = privateMessages ? JSON.parse(privateMessages) : [];

    const userName = users.get(ws).name;

    let filteredPrivateHistory = privateHistory.filter(
      (msg) => msg.from.name === userName || msg.to.name === userName
    );

    let combinedHistory = [...globalHistory, ...filteredPrivateHistory].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );
    ws.send(
      JSON.stringify(new Event('HISTORY', users.get(ws), combinedHistory))
    );
    return;
  }
  ws.send('{"error": "User not connected"}');
}

function listAllCurrentUsers(event, ws) {
  if (users.has(ws)) {
    const usersList = Array.from(users.values()).map((user) => ({
      name: user.name,
      createdAt: user.createdAt,
    }));
    ws.send(
      JSON.stringify(new Event('USERS_LISTED', users.get(ws), usersList))
    );
    return;
  }
}

async function saveInCache(event, historyType) {
  let hist = await client.get(historyType);
  let historyArray = hist ? JSON.parse(hist) : [];
  historyArray.push(event);
  await client.set(historyType, JSON.stringify(historyArray));
}

function disconnect(event, ws) {
  if (users.has(ws)) {
    users.delete(ws);
    notificarTodos(event);
    return;
  }
}

function notificarTodos(event) {
  users.forEach((user, userWs) => {
    if (userWs.readyState === WebSocket.OPEN) {
      userWs.send(JSON.stringify(event));
    }
  });
}

function parseEvent(message, ws) {
  try {
    return JSON.parse(message);
  } catch (error) {
    ws.send('{"error": "Invalid JSON"}');
    return;
  }
}

function startTyping(event, ws) {
  if (users.has(ws)) {
    notificarTodos({
      type: 'MESSAGE_TYPING_START',
      user: users.get(ws).name,
      timestamp: new Date().toISOString(),
    });
  }
}

function endTyping(event, ws) {
  if (users.has(ws)) {
    notificarTodos({
      type: 'MESSAGE_TYPING_END',
      user: users.get(ws).name,
      timestamp: new Date().toISOString(),
    });
  }
}

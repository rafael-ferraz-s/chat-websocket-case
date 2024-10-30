import {
  openConnection,
  listUsers,
  sendMessage,
  sendPrivateMessage,
  startTyping,
  stopTyping,
} from './conn.js';

const nameInput = document.querySelector('#nameInput');
const container = document.querySelector('.container');
const inputBox = document.querySelector('.input-box');
const conectedUsers = document.querySelector('.conected-users');
const conectedUsersList = document.querySelector('.conected-users-list');
const chatMessages = document.querySelector('.chat-messages');
const sendMessageInput = document.querySelector('.send-message');
const sendMessageForm = document.querySelector('.chat-input');
const buttonPrivateLeave = document.querySelector('#private-button-leave');
const chatUserTyping = document.querySelector('.chat-user-typing');
const chatMessagesContainer = document.querySelector(
  '.chat-messages-container'
);

var currentUser;
var isListOpen = false;
var isTyping = false;
var usersConnected = [];
var privateUser;

nameInput.addEventListener('keypress', function (e) {
  if (e.key !== 'Tab') e.stopImmediatePropagation();
  if (e.key === 'Enter' && nameInput.value.trim() !== '') {
    currentUser = nameInput.value;
    openConnection(currentUser);
    container.classList.add('hide');
    setTimeout(() => {
      container.classList.remove('hide');
      inputBox.style.display = 'none';
      container.classList.add('show-chat');
    }, 300);
  }
});

document.addEventListener('keydown', function (e) {
  e.stopImmediatePropagation();
  if (e.key === 'Tab') {
    e.preventDefault();
    isListOpen = !isListOpen;
    if (!isListOpen) {
      conectedUsers.classList.toggle('show');
      setTimeout(() => {
        conectedUsersList.innerHTML = '';
      }, 300);
      return;
    }
    listUsers();
    conectedUsers.classList.toggle('show');
  }
});

sendMessageForm.addEventListener('submit', function (e) {
  e.stopImmediatePropagation();
  e.preventDefault();
  if (sendMessageInput.value == '') {
    return;
  }
  stopTyping(currentUser);
  isTyping = false;
  if (!sendMessageInput.classList.contains('private')) {
    sendMessage(sendMessageInput.value);
  } else {
    console.log(privateUser);
    sendPrivateMessage(privateUser, sendMessageInput.value);
  }
  sendMessageInput.value = '';
});

buttonPrivateLeave.addEventListener('click', (e) => {
  e.preventDefault();
  sendMessageInput.classList.remove('private');
  buttonPrivateLeave.classList.remove('active');
});

sendMessageInput.addEventListener('input', (e) => {
  e.stopImmediatePropagation();
  if (!isTyping) {
    startTyping(currentUser);
  }
  isTyping = true;
});

sendMessageInput.addEventListener('focusout', (e) => {
  e.stopImmediatePropagation();
  stopTyping(currentUser);
  isTyping = false;
});

function clickEvent(e) {
  privateUser = e.target.innerText;
  sendMessageInput.classList.toggle('private');
  buttonPrivateLeave.classList.toggle('active');
}

function updateClickEvent() {
  const userWhisper = document.getElementsByClassName('user-name-message');
  const usersWhisper = Array.from(userWhisper);

  usersWhisper.forEach((user) => {
    user.removeEventListener('click', clickEvent);
    user.addEventListener('click', clickEvent);
  });
}

export function listConectedUsers(type, users) {
  if (type == 'USERS_LISTED') {
    users.forEach((user) => {
      var userConected = document.createElement('div');
      userConected.classList.add('conected-user');
      if (user.name === currentUser) {
        userConected.classList.add('conected');
      }
      userConected.innerText = user.name;
      conectedUsersList.appendChild(userConected);
      usersConnected.push(user);
    });
    return;
  }

  if (type == 'USER_CONNECTED') {
    if (users.name === currentUser) {
      return;
    }
    var userConected = document.createElement('div');
    userConected.classList.add('conected-user');
    userConected.innerText = users.name;
    conectedUsersList.appendChild(userConected);
    usersConnected.push(users);
    return;
  }

  if (type == 'USER_DISCONNECTED') {
    var userIndex = usersConnected.findIndex(
      (user) => user.name === users.name
    );
    console.log(userIndex);
    if (userIndex !== -1 && conectedUsersList.childNodes[userIndex]) {
      conectedUsersList.removeChild(conectedUsersList.childNodes[userIndex]);
      usersConnected.splice(userIndex, 1);
    }
    return;
  }
}

export function renderHistory(messages) {
  messages.forEach((message) => {
    if (message.type == 'MESSAGE_CREATED') {
      var mesg = document.createElement('div');
      mesg.classList.add('message');
      if (message.user.name === currentUser) {
        mesg.classList.add('message-sent');
        mesg.innerText = `${message.message}`;
      } else {
        mesg.classList.add('message-received');
        mesg.innerHTML = `<p><span class="user-name-message">${message.user.name}</span>: ${message.message}<p>`;
      }
      chatMessages.appendChild(mesg);
      return;
    }

    if (message.type == 'ADMM_CREATED') {
      var mesg = document.createElement('div');
      mesg.classList.add('message');
      mesg.classList.add('message-admin');
      mesg.innerText = message.message;
      chatMessages.appendChild(mesg);
      return;
    }

    if (message.type == 'WHISPER_CREATED') {
      var mesg = document.createElement('div');
      mesg.classList.add('message');
      if (message.from.name === currentUser) {
        mesg.classList.add('message-private-sent');
        mesg.innerText = `${message.message}`;
      } else {
        mesg.classList.add('message-private-received');
        mesg.innerHTML = `<p><span class="user-name-message">[${message.from.name}]</span>: ${message.message}</p>`;
      }
      chatMessages.appendChild(mesg);
      return;
    }
  });
  updateClickEvent();
  chatMessagesContainer.scrollTo(0, chatMessagesContainer.scrollHeight);
}

export function renderMessage(message) {
  if (message.type == 'MESSAGE_CREATED') {
    var mesg = document.createElement('div');
    mesg.classList.add('message');
    if (message.user.name === currentUser) {
      mesg.classList.add('message-sent');
      mesg.innerText = `${message.message}`;
    } else {
      mesg.classList.add('message-received');
      mesg.innerHTML = `<p><span class="user-name-message">${message.user.name}</span>: ${message.message}</p>`;
    }
    chatMessages.appendChild(mesg);
  }

  if (message.type == 'ADMM_CREATED') {
    setTimeout(() => {
      var mesg = document.createElement('div');
      mesg.classList.add('message');
      mesg.classList.add('message-admin');
      mesg.innerText = message.message;
      chatMessages.appendChild(mesg);
    }, 300);
  }

  if (message.type == 'WHISPER_CREATED') {
    var mesg = document.createElement('div');
    mesg.classList.add('message');
    if (message.from.name === currentUser) {
      mesg.classList.add('message-private-sent');
      mesg.innerText = `${message.message}`;
    } else {
      mesg.classList.add('message-private-received');
      mesg.innerHTML = `<p>[<span class="user-name-message">${message.from.name}</span>]: ${message.message}</p>`;
    }
    chatMessages.appendChild(mesg);
  }
  updateClickEvent();
}

export function renderTyping(event) {
  if (event.user != currentUser) {
    var textTyping = document.createElement('p');
    textTyping.className = event.user;
    textTyping.innerText = `${event.user} is typing...`;
    chatUserTyping.appendChild(textTyping);
  }
}

export function renderTypingStop(event) {
  if (event.user != currentUser) {
    var textTyping = document.getElementsByClassName(event.user);
    var textTypingArray = Array.from(textTyping);
    textTypingArray.forEach((text) => {
      chatUserTyping.removeChild(text);
    });
  }
}

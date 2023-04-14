const socket = io();

const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messages = document.querySelector('.messages');

sendButton.addEventListener('click', function() {
  const message = messageInput.value;
  if (message.trim()) {
    socket.emit('message', message);
    messageInput.value = '';
  }
});

socket.on('message', function(message) {
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messages.appendChild(messageElement);
  messages.scrollTop = messages.scrollHeight;
});

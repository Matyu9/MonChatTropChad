const socket = io();
const messageFeed = document.getElementById('message-feed')
let userName = prompt('Quelle est ton nom? ')
socket.emit('userLog', userName);

function addMessage(content, time, isMine){
    const messageElement = document.createElement('div');
    
    messageElement.setAttribute('class', isMine ? 'message message-me' : 'message');

    const messageTime = document.createElement('p');
    messageTime.setAttribute('class', 'message-time');
    messageTime.innerText = time;

    const messageContent = document.createElement('p');
    messageContent.setAttribute('class', 'message-content');
    messageContent.innerText = content;

    messageElement.appendChild(messageTime);
    messageElement.appendChild(messageContent);

    messageFeed.appendChild(messageElement);
    messageFeed.scrollTo(0, messageFeed.scrollHeight);
}

const messageForm = document.getElementById('message-form')
const messageInput = document.getElementById('message-input')


messageForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const msg = {
        content: messageInput.value,
        author: userName
    }
    if (msg != '') {
        socket.emit('message', msg);
        messageInput.value = '';
    }
});

socket.on('message-receive', (data) => {
    addMessage(data.content, data.time + ' • ' + data.author , data.author == userName);
})
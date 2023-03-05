import { networkInterfaces } from 'os'
import express from 'express'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io';
import { existsSync, readFileSync, writeFileSync } from 'fs';

// get Timee
function prettyTime() {
    const time = new Date();

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');

    return hours+':'+minutes+':'+seconds
}

// Constantes 
const port = 3001;
const address = networkInterfaces()['wlo1'][0].address;


// Serveurs
const serverExpress = express();
const httpServer = createServer(serverExpress);
const socketServer = new SocketIOServer(httpServer);

serverExpress.use(express.static('../public/'))

if (!existsSync('./messages.json')){
    writeFileSync('./messages.json', '[]');
}

if (!existsSync('./users.json')){
    writeFileSync('./users.json', '[]');
}

const messages = JSON.parse(readFileSync('./messages.json'))
const users = JSON.parse(readFileSync('./users.json'))

function sendMessage(socket, message, time, author) {
    let data  = {
        content: message,
        time: time,
        author: author,
        isMine: socket.conn.remoteAddress === author
    }
    socket.emit('message-receive', data);
}

async function broadcast(message, time, author) {
    const sockets = await socketServer.of('/').sockets;
    console.log(sockets)
    for (let sock of sockets){
        sendMessage(sock, message, time, author);
    }
}

// Socket
socketServer.on('connection', (socket) => {
    console.log('UN NOUVEAU! ' + socket.conn.remoteAddress);
    let logged = false;
    socket.on('userLog', (userName) => {
        for (let user of users){
            if (user.ip !== socket.conn.remoteAddress && user.username === userName){
                socket.emit('UserFoundButIt\'sNotYou', 'data');
                socket.disconnect(true);
            }
            else {
                logged = true;
                if (user.ip !== socket.conn.remoteAddress) users.push({username: userName, ip:socket.conn.remoteAddress});
                break;  
            }
        }
    })

    messages.forEach((msg) => {
        console.log(msg);
        sendMessage(socket, msg.content, msg.time, msg.author);
    })

    socket.on('message', (msg) => {
        if (!logged) socket.disconnect(true);
        console.log(msg.content, prettyTime(), msg.author);
        broadcast(msg.content, prettyTime(), msg.author);
        messages.push({
            author: msg.author,
            content: msg.content,
            time: prettyTime()
        });
    });
});

// Démarrage des Serveurs
httpServer.listen(port, () => {
    console.log(`Listening on ${address}:${port}`)
})


process.on('SIGINT', () => {
    writeFileSync('./messages.json', JSON.stringify(messages));
    writeFileSync('./users.json', JSON.stringify(users));
    process.exit();
});
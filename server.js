const express = require('express');
const app = express();
// const cors = require('cors')
// app.use(cors())

const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});

app.use('/peerjs', peerServer);
app.set('view engine', 'ejs');
app.use(express.static('public'));

const reUuid = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

app.get('/', (req, res) => {
    res.render('main');
});

app.get('/:room', (req, res) => {
    if (reUuid.test(req.params.room)) {
        res.render('room', { roomId: req.params.room });
    } else {
        res.render('404');
    }
});

app.use((req, res) => {
    res.render('404');
});

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId, userName) => {
        socket.join(roomId);
        socket.to(roomId).broadcast.emit('user-connected', userId, userName);
        // messages
        socket.on('message', (data) => {
            // send message to the same room
            io.to(roomId).emit('createMessage', data);
        });

        socket.on('disconnect', () => {
            socket.to(roomId).broadcast.emit('user-disconnected', userId);
        });

        socket.on('stop-user-video', (userId) => {
            io.to(roomId).emit('user-disabled-video', userId);
        });

        socket.on('start-user-video', (userId) => {
            io.to(roomId).emit('user-included-video', userId);
        });
    });
});

server.listen(process.env.PORT || 443);

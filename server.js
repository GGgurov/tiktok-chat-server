const express = require('express');
const { WebcastPushConnection } = require('tiktok-live-connector');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" }
});

io.on('connection', (socket) => {
    let tiktokLiveConnection = null;

    socket.on('set-username', (username) => {
        tiktokLiveConnection = new WebcastPushConnection(username);

        tiktokLiveConnection.connect().then(state => {
            socket.emit('sys-message', `✅ Подключено: ${username}`);
        }).catch(err => {
            socket.emit('sys-message', `❌ Ошибка: ${err.message}`);
        });

        tiktokLiveConnection.on('roomUser', data => {
            socket.emit('viewer-count', data.viewerCount);
        });

        tiktokLiveConnection.on('chat', data => {
            socket.emit('chat', {
                nickname: data.nickname,
                comment: data.comment,
                profilePictureUrl: data.profilePictureUrl
            });
        });
    });

    socket.on('disconnect', () => {
        if (tiktokLiveConnection) tiktokLiveConnection.disconnect();
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));

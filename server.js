const express = require('express');
const { WebcastPushConnection } = require('tiktok-live-connector');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: { origin: "*" } // Разрешаем подключение с любого сайта (твоего GitHub Pages)
});

io.on('connection', (socket) => {
    let tiktokLiveConnection = null;

    socket.on('set-username', (username) => {
        console.log(`Connecting to TikTok Live: ${username}`);
        tiktokLiveConnection = new WebcastPushConnection(username);

        tiktokLiveConnection.connect().then(state => {
            console.info(`Connected to room ${state.roomId}`);
            socket.emit('sys-message', `✅ Успешно подключено к стриму: ${username}`);
        }).catch(err => {
            console.error('Failed to connect', err);
            socket.emit('sys-message', `❌ Ошибка подключения: стрим оффлайн или неверный ник.`);
        });

        // Слушаем чат
        tiktokLiveConnection.on('chat', data => {
            socket.emit('chat', {
                uniqueId: data.uniqueId,
                nickname: data.nickname,
                comment: data.comment,
                profilePictureUrl: data.profilePictureUrl
            });
        });
    });

    socket.on('disconnect', () => {
        if (tiktokLiveConnection) {
            tiktokLiveConnection.disconnect();
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
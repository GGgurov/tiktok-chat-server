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
        // Настройки для обхода блокировок
        tiktokLiveConnection = new WebcastPushConnection(username, {
            processInitialData: true,
            enableWebsocket: true,
            requestOptions: {
                timeout: 10000,
                headers: {
                    // Маскируемся под реальный браузер
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            }
        });

        tiktokLiveConnection.connect().then(state => {
            console.log(`Connected to room ${state.roomId}`);
            socket.emit('sys-message', `✅ Чат подключен!`);
        }).catch(err => {
            console.error('Connection Error:', err);
            // Если всё равно ошибка, выводим её подробно
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

        // Если TikTok сам разорвал соединение
        tiktokLiveConnection.on('disconnected', () => {
            socket.emit('sys-message', `⚠️ Соединение разорвано`);
        });
    });

    socket.on('disconnect', () => {
        if (tiktokLiveConnection) {
            tiktokLiveConnection.disconnect();
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));

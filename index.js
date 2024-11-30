import express from 'express';
import { cpuTemperature, mem, currentLoad, fsSize, time, networkStats } from 'systeminformation';
import { WebSocketServer } from 'ws';

const app = express();
const PORT = 3001;

// Створюємо HTTP сервер
const server = app.listen(PORT, () => {
    console.log(`HTTP server running on http://localhost:${PORT}`);
});

// Створюємо WebSocket сервер
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    const intervalId = setInterval(async () => {
        try {
            const [cpuTemp, memoryInfo, loadInfo, diskInfo, uptime, networkStatsData] = await Promise.all([
                cpuTemperature(),
                mem(),
                currentLoad(),
                fsSize(),
                time(),
                networkStats(),
            ]);

            // Обробка мережевих даних
            const networkData = networkStatsData.map(stat => ({
                interface: stat.interface,
                rxBytes: stat.rx_bytes,
                txBytes: stat.tx_bytes,
                rxDropped: stat.rx_dropped,
                txDropped: stat.tx_dropped,
                rxSpeed: (stat.rx_bytes / 1024 / 1024).toFixed(2) + ' MB/s',
                txSpeed: (stat.tx_bytes / 1024 / 1024).toFixed(2) + ' MB/s',
            }));

            // Формуємо повідомлення
            const data = {
                cpuTemp: cpuTemp.main || 'N/A',
                totalMemory: (memoryInfo.total / (1024 ** 3)).toFixed(2), // Перетворення на ГБ
                freeMemory: (memoryInfo.free / (1024 ** 3)).toFixed(2),
                usedMemory: ((memoryInfo.used / memoryInfo.total) * 100).toFixed(2), // Відсоток використаної пам'яті
                loadAvg: loadInfo.currentLoad.toFixed(2),
                uptime: Math.floor(uptime.uptime / 60), // Оновлення часу в хвилинах
                diskUsage: (diskInfo[0].used / diskInfo[0].size * 100).toFixed(2), // Відсоток використаного диска
                networkStats: networkData,
            };

            // Перевірка на готовність WebSocket перед відправкою
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error fetching system information:', error);
        }
    }, 1000); // Оновлення кожні 5 секунд

    // Якщо клієнт відключається, зупиняємо передачу даних
    ws.on('close', () => {
        clearInterval(intervalId);
        console.log('Client disconnected');
    });
});
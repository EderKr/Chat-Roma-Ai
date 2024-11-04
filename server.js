require('dotenv').config();
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const axios = require('axios');
const winston = require('winston');
const NodeCache = require('node-cache');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const cache = new NodeCache({ stdTTL: 300 }); // Cache com TTL de 5 minutos

// Configuração de logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'server.log' })
    ]
});

app.use(express.static('public'));

io.on('connection', (socket) => {
    logger.info(`Usuário conectado: ${socket.id}`);

    socket.on('chatMessage', async (msg) => {
        if (msg.startsWith('/image')) {
            const prompt = sanitizeInput(msg.replace('/image', '').trim());
            if (prompt) {
                const cachedImage = cache.get(prompt);
                if (cachedImage) {
                    socket.emit('imageResponse', cachedImage);
                    logger.info(`Imagem servida do cache para o prompt: ${prompt}`);
                    return;
                }

                try {
                    const imageUrl = await generateImage(prompt);
                    cache.set(prompt, imageUrl);
                    socket.emit('imageResponse', imageUrl);
                } catch (error) {
                    logger.error(`Erro ao gerar imagem: ${error.message}`);
                    socket.emit('errorResponse', 'Desculpe, ocorreu um problema ao gerar a imagem.');
                }
            } else {
                socket.emit('errorResponse', 'O prompt para gerar imagem está vazio ou é inválido.');
            }
        } else {
            socket.emit('chatResponse', `Mensagem recebida: ${msg}`);
        }
    });

    socket.on('disconnect', () => {
        logger.info(`Usuário desconectado: ${socket.id}`);
    });
});

function sanitizeInput(input) {
    return input.replace(/[^a-zA-Z0-9 à-ü]/g, ''); // Remove caracteres especiais perigosos
}

async function generateImage(prompt) {
    if (!process.env.OPENAI_API_KEY) {
        logger.error('Chave de API da OpenAI não encontrada.');
        throw new Error('Chave de API não configurada.');
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/images/generations',
            {
                prompt: prompt,
                n: 1,
                size: '300x300'
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.data[0].url;
    } catch (error) {
        logger.error(`Erro ao chamar API externa: ${error.response ? error.response.data : error.message}`);
        throw new Error('Falha ao gerar imagem. Verifique o prompt e tente novamente.');
    }
}

server.listen(PORT, () => {
    logger.info(`Servidor rodando em http://localhost:${PORT}`);
});

require('dotenv').config();
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const axios = require('axios');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.use(express.static(path.join(__dirname)));

app.use(express.static(path.join(__dirname, 'public'))); 

io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);

    socket.on('chatMessage', async (msg) => {
        if (msg.startsWith('/image')) {
            const prompt = msg.replace('/image', '').trim();
            if (prompt) {
                try {
                    const imageUrl = await generateImage(prompt);
                    socket.emit('imageResponse', { imageUrl, command: msg });
                } catch (error) {
                    console.error("Erro ao gerar imagem:", error.message);
                    socket.emit('imageResponse', { message: "Erro ao gerar a imagem." });
                }
            } else {
                socket.emit('imageResponse', { message: "Por favor, forneça um prompt após /image." });
            }
        } else {
            // Mensagem padrão de chat
            io.emit('chatMessage', msg);
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado:', socket.id);
    });
});

// Função para chamar a API da OpenAI e gerar a imagem
async function generateImage(prompt) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Chave de API da OpenAI não encontrada.");
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/images/generations',
            {
                prompt: prompt,
                n: 1,
                size: "256x256",
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data.data[0].url; // Retorna a URL da imagem gerada
    } catch (error) {
        console.error("Erro ao gerar imagem:", error.response ? error.response.data : error.message);
        throw new Error("Falha ao gerar imagem. Verifique o prompt e tente novamente.");
    }
}

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

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

    socket.on('chatMessage', async (data) => {
        const { username, message } = data;

        io.emit('chatMessage', { username, message }); // Emite a mensagem para todos os clientes

        if (message.startsWith('/image')) {
            const prompt = message.replace('/image', '').trim();
            if (prompt) {
                try {
                    const imageUrl = await generateImage(prompt);
                    io.emit('imageResponse', { imageUrl, command: message });
                } catch (error) {
                    console.error("Erro ao gerar imagem:", error.message);
                    io.emit('imageResponse', { message: "Erro ao gerar a imagem." });
                }
            } else {
                io.emit('imageResponse', { message: "Por favor, forneça um prompt após /image." });
            }
        } else if (message.startsWith('/text')) {
            const prompt = message.replace('/text', '').trim();
            if (prompt) {
                try {
                    const textResponse = await getOpenAIResponse(prompt);
                    io.emit('chatMessage', { username: 'Bot', message: textResponse });
                } catch (error) {
                    console.error("Erro ao gerar resposta:", error.message);
                    io.emit('chatMessage', { username: 'Bot', message: 'Erro ao gerar resposta.' });
                }
            } else {
                io.emit('chatMessage', { username: 'Bot', message: 'Por favor, forneça um prompt após /text.' });
            }
        } else if (message.startsWith('/gif')) {
            const query = message.replace('/gif', '').trim();
            if (query) {
                try {
                    const gifUrl = await getGif(query);
                    if (gifUrl) {
                        io.emit('imageResponse', { imageUrl: gifUrl, command: message });
                    } else {
                        io.emit('imageResponse', { message: "Nenhum GIF encontrado para esse termo." });
                    }
                } catch (error) {
                    console.error("Erro ao buscar GIF:", error.message);
                    io.emit('imageResponse', { message: "Erro ao buscar o GIF." });
                }
            } else {
                io.emit('imageResponse', { message: "Por favor, forneça um termo para busca de GIF após /gif." });
            }
        } else if (message.startsWith('/cat')) {
            try {
                const catImageUrl = await getCatImage();
                io.emit('imageResponse', { imageUrl: catImageUrl, command: message });
            } catch (error) {
                console.error("Erro ao obter imagem do gato:", error.message);
                io.emit('chatMessage', { username: 'Bot', message: 'Erro ao obter a imagem do gato.' });
            }
        } else if (message.startsWith('/dog')) {
            try {
                const dogImageUrl = await getDogImage();
                io.emit('imageResponse', { imageUrl: dogImageUrl, command: message });
            } catch (error) {
                console.error("Erro ao obter imagem do cachorro:", error.message);
                io.emit('chatMessage', { username: 'Bot', message: 'Erro ao obter a imagem do cachorro.' });
            }
        } else if (message.startsWith('/fox')) {
            try {
                const foxImageUrl = await getFoxImage();
                io.emit('imageResponse', { imageUrl: foxImageUrl, command: message });
            } catch (error) {
                console.error("Erro ao obter imagem da raposa:", error.message);
                io.emit('chatMessage', { username: 'Bot', message: 'Erro ao obter a imagem da raposa.' });
            }
        } else if (message.startsWith('/audio')) {
            const audioCommand = message.replace('/audio', '').trim();
            if (audioCommand) {
                io.emit('chatMessage', { username: 'Bot', message: 'Reproduzindo áudio' });
                io.emit('audioResponse', { command: `/audio ${audioCommand}` });
            } else {
                io.emit('chatMessage', { username: 'Bot', message: 'Por favor, forneça um comando de áudio após /audio.' });
            }
        } else if (message.startsWith('/help')) {
            const helpMessage = 
            "- /image [descrição]: Gera uma imagem com o prompt fornecido.<br>" +
            "- /text [pergunta]: Recebe uma resposta gerada pela OpenAI.<br>" +
            "- /gif [termo]: Busca um GIF com o termo fornecido.<br>" +
            "- /cat: Envia uma imagem de um gato.<br>" +
            "- /dog: Envia uma imagem de um cachorro.<br>" +
            "- /fox: Envia uma imagem de uma raposa.<br>" +
            "- /audio [descricao]: Reproduz um dos oito áudios disponíveis.<br>" +
            "- /help: Exibe essa lista de comandos.";
            io.emit('chatMessage', { username: 'Bot', message: helpMessage });
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuário desconectado:', socket.id);
    });
});

// Função para gerar imagem com a OpenAI
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
        return response.data.data[0].url;
    } catch (error) {
        console.error("Erro ao gerar imagem:", error.response ? error.response.data : error.message);
        throw new Error("Falha ao gerar imagem. Verifique o prompt e tente novamente.");
    }
}

// Função para gerar resposta com a OpenAI
async function getOpenAIResponse(prompt) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("Chave de API da OpenAI não encontrada.");
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "Você é um assistente útil." },
                    { role: "user", content: prompt },
                ],
                max_tokens: 150,
                temperature: 0.7,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error("Erro ao gerar resposta da OpenAI:", error.response ? error.response.data : error.message);
        throw new Error('Erro ao gerar resposta da OpenAI');
    }
}

// Função para obter uma imagem de um gato
async function getCatImage() {
    try {
        const response = await axios.get('https://api.thecatapi.com/v1/images/search', {
            headers: {
                'x-api-key': process.env.CAT_API_KEY
            }
        });
        return response.data[0].url;
    } catch (error) {
        console.error("Erro ao obter imagem do gato:", error.message);
        throw new Error("Falha ao obter imagem do gato.");
    }
}

// Função para obter uma imagem de um cachorro
async function getDogImage() {
    try {
        const response = await axios.get('https://dog.ceo/api/breeds/image/random');
        return response.data.message;
    } catch (error) {
        console.error("Erro ao obter imagem do cachorro:", error.message);
        throw new Error("Falha ao obter imagem do cachorro.");
    }
}

// Função para obter uma imagem de uma raposa
async function getFoxImage() {
    try {
        const response = await axios.get('https://randomfox.ca/floof/');
        return response.data.image;
    } catch (error) {
        console.error("Erro ao obter imagem da raposa:", error.message);
        throw new Error("Falha ao obter imagem da raposa.");
    }
}

async function getGif(query) {
    try {
        const response = await axios.get('https://api.giphy.com/v1/gifs/search', {
            params: {
                api_key: process.env.GIPHY_API_KEY,
                q: query,
                limit: 1
            }
        });
        if (response.data.data.length > 0) {
            return response.data.data[0].images.original.url;
        } else {
            throw new Error('Nenhum GIF encontrado.');
        }
    } catch (error) {
        console.error("Erro ao buscar GIF:", error.message);
        throw new Error('Falha ao buscar GIF.');
    }
}

server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

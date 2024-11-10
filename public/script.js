// Função para tocar o áudio específico com base no comando
function playAudio(command) {
    const audioFile = audioMap[command];
    if (audioFile) {
        const audio = new Audio(audioFile);
        audio.play().then(() => {
            console.log(`Reproduzindo o áudio para o comando: ${command}`);
        }).catch((error) => {
            console.error(`Erro ao reproduzir o áudio para o comando: ${command}`, error);
        });
    } else {
        console.warn(`Nenhum áudio mapeado para o comando: ${command}`);
    }
}

// Função para exibir mensagens no chat
function displayMessage(message, messageType) {
    const chatMessages = document.getElementById('chat-messages');
    const msgElement = document.createElement('li');
    msgElement.innerHTML = message;
    msgElement.classList.add(messageType); // Define como 'sent' ou 'received'
    chatMessages.appendChild(msgElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Rolagem automática
}

// Função para enviar a mensagem ao servidor
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();

    if (message.startsWith("/text ")) {
        // Remove o comando /text e envia o conteúdo à API da OpenAI
        const userMessage = message.replace("/text ", "");
        fetch('/openai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userMessage })
        })
        .then(response => response.json())
        .then(data => {
            if (data.response) {
                displayMessage(data.response, 'received');
            } else {
                displayMessage("Erro na resposta da API.", 'received');
            }
        })
        .catch(error => {
            console.error("Erro ao se comunicar com a API OpenAI:", error);
            displayMessage("Erro ao se comunicar com a API.", 'received');
        });
    } else if (message.startsWith("/image") || message === "/cat" || message === "/dog" || message === "/fox" || message.startsWith("/gif")) {
        // Toca o áudio e busca a imagem para os comandos /image, /cat, /dog, /fox e /gif
        playAudio(message);

        let url = '';
        if (message.startsWith("/gif")) {
            url = `/api/gif${message.replace("/gif", "").trim() ? "?query=" + message.replace("/gif", "").trim() : ''}`;
        } else {
            url = `/api${message === '/cat' ? '/cat' : message === '/dog' ? '/dog' : '/fox'}`;
        }

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.url) {
                    displayMessage(`<img src="${data.url}" alt="Imagem" class="${message.slice(1)}-image">`, 'received');
                } else {
                    displayMessage("Erro ao buscar a imagem.", 'received');
                }
            })
            .catch(error => {
                console.error(`Erro ao buscar a imagem:`, error);
                displayMessage("Erro ao buscar a imagem.", 'received');
            });
    } else if (message) {
        displayMessage(message, 'sent'); // Exibe como mensagem enviada
        socket.emit('chatMessage', message); // Envia ao servidor
        messageInput.value = ''; // Limpa o campo de entrada
    }
}

// Adiciona um listener para a tecla Enter
document.getElementById('messageInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Evita a nova linha
        sendMessage(); // Chama a função de enviar mensagem
    }
});

// Receber mensagens do servidor e exibir
socket.on('chatMessage', (msg) => {
    displayMessage(msg, 'received');
});

// Receber a URL da imagem e o comando do servidor
socket.on('imageResponse', (data) => {
    if (data.imageUrl) {
        displayMessage(`<img src="${data.imageUrl}" alt="Imagem gerada" class="generated-image">`, 'received');
    } else if (data.message) {
        displayMessage(data.message, 'received');
    }
});

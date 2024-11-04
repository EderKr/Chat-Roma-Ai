// Mapeamento de comandos para arquivos de áudio
const audioMap = {
    "/image gato": "audios/Gato.m4a",
    "/image cachorro": "audios/Cachorro.m4a",
    "/image raposa": "audios/Raposa.m4a",
    "/image urso": "audios/Urso.m4a",
    "/image grito": "audios/Wilhelm Scream.m4a",
    "/image cano de metal": "audios/Metal Pipe.m4a",
    "/image sonic": "audios/Sonic Jumping.m4a",
    "/image cabra gritando": "audios/Goat Scream.m4a"
};

// Função para tocar o áudio específico com base no comando
function playAudio(command) {
    const audioFile = audioMap[command];
    if (audioFile) {
        const audio = new Audio(audioFile);
        audio.play().catch((error) => {
            console.error("Erro ao reproduzir o áudio:", error);
        });
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
    if (message) {
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
        // Exibe a imagem gerada
        displayMessage('<img src="' + data.imageUrl + '" alt="Imagem gerada" />', 'received');
    } else {
        displayMessage(data.message, 'received'); // Exibe mensagem de erro
    }

    // Verifica o comando e toca o áudio correspondente
    playAudio(data.command); // Passa o comando para a função playAudio
});

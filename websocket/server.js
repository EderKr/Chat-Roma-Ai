// Conectando ao servidor com Socket.IO
const socket = io();

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

// Receber URLs de imagens do servidor e exibir
socket.on('imageResponse', (urlOrMessage) => {
    if (urlOrMessage.startsWith('http')) {
        displayMessage('<img src="' + urlOrMessage + '" alt="Imagem gerada" />', 'received');
    } else {
        displayMessage(urlOrMessage, 'received'); // Mensagem de erro, por exemplo
    }
});

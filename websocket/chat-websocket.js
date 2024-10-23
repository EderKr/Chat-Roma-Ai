const wbs = require("ws");
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

// Função para servir arquivos
const serveFile = (filePath, res) => {
    const extname = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end("404 - Arquivo não encontrado", 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Erro ao carregar o arquivo: ' + err.code, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
};

// Criar servidor HTTP
const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? './websocket/chat-websocket.html' : '.' + req.url;
    serveFile(filePath, res);
});

// Criar servidor WebSocket
const ws = new wbs.Server({ server });

ws.on("connection", (skt) => {
    skt.on("message", (msg) => {
        console.log(`Mensagem recebida: ${msg.toString("utf-8")}`);
        
        ws.clients.forEach((client) => {
            if (client.readyState === wbs.OPEN) {
                client.send(msg);
            }
        });
    });
});

// Iniciar o servidor
server.listen(PORT, () => {
    console.log(`Servidor está rodando na porta ${PORT}`);
});

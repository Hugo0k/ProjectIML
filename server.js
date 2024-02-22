const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Création du serveur HTTP
const server = http.createServer((req, res) => {
    // Récupérer le chemin du fichier demandé
    let filePath;
    if (req.headers['user-agent'].includes('Mobile')) {
        filePath = '.' + req.url;
        if (filePath === './') {
            filePath = './index_mobile.html';
        }
    } else {
        filePath = '.' + req.url;
        if (filePath === './') {
            filePath = './index.html';
        }
    }

    // Lire le fichier demandé
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Si le fichier n'existe pas, retourner une erreur 404
                res.writeHead(404);
                res.end('Fichier non trouvé');
            } else {
                // Sinon, retourner une erreur interne du serveur
                res.writeHead(500);
                res.end('Erreur du serveur');
            }
        } else {
            // Si le fichier est trouvé, retourner son contenu
            res.writeHead(200, { 'Content-Type': getContentType(filePath) });
            res.end(content, 'utf-8');
        }
    });
});

// Fonction pour déterminer le type de contenu en fonction de l'extension du fichier
function getContentType(filePath) {
    const extname = path.extname(filePath);
    switch (extname) {
        case '.html':
            return 'text/html';
        case '.js':
            return 'text/javascript';
        case '.css':
            return 'text/css';
        default:
            return 'text/plain';
    }
}

// Création du serveur WebSocket
const wss = new WebSocket.Server({ server });

wss.onopen = function(event) {
    console.log('Connexion WebSocket établie.');
};

wss.on('connection', function connection(ws) {
    console.log('Nouvelle connexion WebSocket');

    ws.on('message', function incoming(message) {
        const message2 = Buffer.from(message, 'hex').toString('utf8');
        console.log('Message reçu : %s', message2);
        if (message2 === 'NextButtonClicked') {
            // Envoyer le message au téléphone seulement
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {      
                    //client.send('ShowQuestion');
                }
            });
        } else {
            // Envoyer la réponse de l'utilisateur au PC
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    });

    ws.on('close', function close() {
        console.log('Connexion WebSocket fermée');
    });
});

const PORT = process.env.PORT || 3000;
// Démarrer le serveur et écouter sur le port spécifié
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});

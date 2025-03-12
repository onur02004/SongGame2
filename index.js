const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const server = http.createServer((req, res) => {
    if (req.url === "/") {
        fs.readFile(path.join(__dirname, "index.html"), (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end("Error loading page");
            } else {
                res.writeHead(200, { "Content-Type": "text/html" });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404);
        res.end("Not Found");
    }
});

const wss = new WebSocket.Server({ server });

let users = new Map();

wss.on("connection", (ws) => {
    let userID = "Player" + Math.floor(Math.random() * 1000);
    users.set(ws, userID);
    console.log(`${userID} joined.`);

    // Notify all clients that a user has joined
    broadcast(JSON.stringify({ type: "join", user: userID }));

    ws.on("message", (message) => {
        console.log("Received:", message);
        broadcast(message);
    });

    ws.on("close", () => {
        console.log("Game terminated.");
        users.delete(ws);
        broadcast(JSON.stringify({ type: "game_end", message: "Game terminated" }));
    });

    function broadcast(data) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
});

server.listen(8080, () => {
    console.log("Server running on http://localhost:8080");
});

const io = require("socket.io-client");

const socket = io("https://barkevunsalruzgarbulutalyamelihonur.glitch.me", {
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("✅ Connected");

  socket.emit("register", {
    username: "CLI Tester",
    avatar: "/avatars/test.png",
    isHost: false
  });

  socket.emit("get-non-hosts");
});

socket.on("non-hosts-list", (data) => {
  console.log("📋 Non-hosts:", data);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error", err.message);
});

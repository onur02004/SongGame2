//git add .
//git commit -m "barkev"
//git push -u origin main


const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static('public'));
app.use('/avatars', express.static(path.join(__dirname, 'public/avatars')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/ProfilePics', express.static(path.join(__dirname, 'ProfilePics')));

// File upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Upload endpoint
app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  res.json({ path: `/uploads/${req.file.filename}` });
});

app.get('/getusers', (req, res) => {
  const nonHosts = getNonHostUsers();
  res.json(nonHosts);
});

app.get('/api/avatars', (req, res) => {
  const dirPath = path.join(__dirname, 'ProfilePics');
  fs.readdir(dirPath, (err, files) => {
    if (err) return res.status(500).send('Failed to read directory');

    const imageFiles = files.filter(file =>
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );

    res.json(imageFiles); // Return only filenames
  });
});



const users = {}; // key: socket.id, value: { username, avatar }

io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('register', ({ username, avatar, isHost }) => {
    const user = { username, avatar, isHost: !!isHost };
    users[socket.id] = user;
    console.log(`${isHost ? '[HOST]' : '[CLIENT]'} ${username} registered with avatar: ${avatar}`);
    

    socket.emit('go-to-quiz', user);

    socket.broadcast.emit('user-joined', user);
  });
  
  

  socket.on('answer', (option) => {
    const user = users[socket.id];
    if (user) {
      console.log(`User ${user.username} chose: ${option}`);
          
    } else {
      console.log(`Unknown user chose: ${option}`);
    }

    socket.broadcast.emit('answer', {
            user: user,
            answer: option
          });
  });

  socket.on('disconnect', () => {
    delete users[socket.id];
    console.log('User disconnected');
  
    const nonHosts = getNonHostUsers();
    socket.broadcast.emit("non-hosts-list", nonHosts);
  });
  

  socket.on('get-non-hosts', () => {
    const nonHosts = getNonHostUsers();
    socket.emit('non-hosts-list', nonHosts);
  });

  socket.on('oyunBasladi', () => {
    socket.broadcast.emit('oyunBasladi');
  });

  socket.on('butonAc', (data) => {
    socket.broadcast.emit('butonAc', data); // forward the same data
  });


  socket.on('muzikBilgi', (data) => {
    io.emit('muzikBilgi', data);
  });
});
  


server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});


function getNonHostUsers() {
  return Object.values(users)
    .filter(user => !user.isHost)
    .map(user => ({
      username: user.username,
      avatar: user.avatar
    }));
}

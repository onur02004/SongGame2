//git add .
//git commit -m "barkev"
//git push -u origin main


// node js backend server

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
let spotifyAccessToken = '';
const SPOTIFY_CLIENT_ID = '950bdffcc24d4b9188b13c2bc7e6d867';
const SPOTIFY_CLIENT_SECRET = '6a7f862f25784276970e9731802db0a7';


const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files
app.use(express.static('public'));
app.use('/avatars', express.static(path.join(__dirname, 'public/avatars')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/ProfilePics', express.static(path.join(__dirname, 'ProfilePics')));

// File upload setup // devam etmedim
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

// Upload endpoint // endpoint e devam etmedim ama hala calisiyo
app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  res.json({ path: `/uploads/${req.file.filename}` });
});

app.get('/getusers', (req, res) => {
  const nonHosts = getNonHostUsers();
  res.json(nonHosts);
});

//default indexalt a redirect ama calismiyo anlamiyom neden
app.use(
  express.static(path.join(__dirname, 'public'), {
    index: 'indexalt.html',
  })
);

//ussteki redirect ile ayni islevi goruyo yani calismiyo
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'indexalt.html'));
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

app.get('/api/randomEmote', (req, res) => {
  const emoteDir = path.join(__dirname, 'public', 'random');

  fs.readdir(emoteDir, (err, files) => {
    if (err) {
      console.error('Failed to read random emote directory:', err);
      return res.status(500).json({ error: 'Could not load emotes' });
    }

    // (2) filter to images only
    const imageFiles = files.filter(f =>
      /\.(jpe?g|png|gif|webp)$/i.test(f)
    );

    if (imageFiles.length === 0) {
      return res.status(404).json({ error: 'No emotes found' });
    }

    // (3) pick a random one
    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    const chosen = imageFiles[randomIndex];

    // (4) return its public URL
    res.json({ file: `/random/${chosen}` });
  });
});


app.get('/api/randomEmoteContent', (req, res) => {
  const emoteDir = path.join(__dirname, 'public', 'random');

  fs.readdir(emoteDir, (err, files) => {
    if (err) {
      console.error('Failed to read random emote directory:', err);
      return res.status(500).json({ error: 'Could not load emotes' });
    }

    // (2) filter to images only
    const imageFiles = files.filter(f =>
      /\.(jpe?g|png|gif|webp)$/i.test(f)
    );

    if (imageFiles.length === 0) {
      return res.status(404).json({ error: 'No emotes found' });
    }

    // (3) pick a random one
    const randomIndex = Math.floor(Math.random() * imageFiles.length);
    const chosen = imageFiles[randomIndex];
    const fullPath = path.join(emoteDir, chosen);
    res.sendFile(fullPath, err => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(err.statusCode || 500).end();
      }
    });
  });
});




async function fetchSpotifyAccessToken() {
  console.log('[Spotify] NNOT FETCHING SONRA DEGISTIR ALOOOOO!!!!');
  return;
  try {
    const auth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

    const response = await axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    spotifyAccessToken = response.data.access_token;
    console.log('[Spotify] Token refreshed');

    // Refresh again in 59 minutes
    setTimeout(fetchSpotifyAccessToken, 59 * 60 * 1000);
  } catch (err) {
    console.error('[Spotify] Error fetching access token:', err.message);
    // Retry after 1 minute if there's an error
    setTimeout(fetchSpotifyAccessToken, 60 * 1000);
  }

}

fetchSpotifyAccessToken();




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

  socket.on('butonKapa', (data) => {
    socket.broadcast.emit('butonKapa', data); // forward the same data
  });

  socket.on('userScores', (data) => {
    socket.broadcast.emit('userScores', data); // forward the same data
  });

  socket.on('lyricsRealtime', (data) => {
    socket.broadcast.emit('lyricsRealtime', data); // forward the same data
  });

  socket.on('buyukEkran', (data) => {
    socket.broadcast.emit('buyukEkran', data); // forward the same data
  });



  socket.on('muzikBilgi', async (data) => {
    const { artist, songName } = data;

    let artistInfo = null;
    if (false) {
      try {
        const response = await axios.get(`https://api.spotify.com/v1/search`, {
          headers: { Authorization: `Bearer ${spotifyAccessToken}` },
          params: {
            q: artist,
            type: 'artist',
            limit: 1
          }
        });

        if (response.data.artists.items.length > 0) {
          const a = response.data.artists.items[0];
          artistInfo = {
            name: a.name,
            genres: a.genres,
            popularity: a.popularity,
            followers: a.followers.total,
            image: a.images.length > 0 ? a.images[0].url : null
          };
        }
      } catch (err) {
        console.error('[Spotify] Error fetching artist info:', err.message);
      }
    }

    io.emit('muzikBilgi', {
      ...data,
      artistInfo
    });
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

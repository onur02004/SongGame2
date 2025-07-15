// aciklama: index.html js file

const socket = io();
let avatar = '';
let username = '';
let oyunBasladi = false;

async function getAvatars() {
  const container = document.getElementById('avatar-list');
  const response = await fetch('/api/avatars');
  const avatars = await response.json();

  avatars.forEach(filename => {
    const imgWrapper = document.createElement('div');
    imgWrapper.style.display = 'flex';
    imgWrapper.style.flexDirection = 'column';
    imgWrapper.style.alignItems = 'center';
    imgWrapper.style.margin = '5px';

    const img = document.createElement('img');
    img.src = `/ProfilePics/${filename}`;
    img.width = 60;
    img.style.cursor = 'pointer';

    const baseName = filename.split('-')[0];
    const label = document.createElement('div');
    label.innerText = baseName;
    label.style.fontSize = '12px';
    label.style.color = 'white';
    label.style.marginTop = '4px';
    label.style.fontFamily = 'SEGOE UI, sans-serif';
    label.style.fontWeight = 'bold';

    img.onclick = () => {
      username = document.getElementById('username').value.trim();
      if (!username) return alert('Please enter a username.');
      avatar = filename;

      socket.emit('register', { username, avatar });

      document.getElementById('login').style.display = 'none';
      document.getElementById('quiz').style.display = 'block';
    };

    imgWrapper.appendChild(img);
    imgWrapper.appendChild(label);
    container.appendChild(imgWrapper);
  });


}

getAvatars();

// kullanilmiyo neden duruyo bilmiom
socket.on('go-to-quiz', () => {
  document.getElementById('login').style.display = 'none';
  document.getElementById('quiz').style.display = 'block';
  window.scrollTo(0, 0);
  document.body.style.overflow = 'hidden'; 
});

socket.on('oyunBasladi', () => {
  oyunBasladi = true;
  setOptionsEnabled(false);
  window.scrollTo(0, 0);
  document.body.style.overflow = 'hidden'; 

});

socket.on('butonAc', (data) => {
  window.scrollTo(0, 0);
  document.body.style.overflow = 'hidden'; 
  document.getElementById('MuzikBilgiPanel').innerHTML = '';
  document.body.style.background = '#181818'; // reset to default

  const buttons = document.querySelectorAll('.option');
  if (typeof data === 'object' && data.options) {
    data.options.forEach((text, i) => {
      if (buttons[i]) buttons[i].textContent = text;
    });
  }

  document.getElementById('answer-status').textContent = 'Please answer!';
  setOptionsEnabled(true);

  const quiz = document.getElementById('quiz');
  quiz.style.display = 'block';
});



socket.on('butonKapa', () => {
  setOptionsEnabled(false);
});

document.querySelectorAll('.option').forEach(btn => {
  btn.onclick = () => {
    socket.emit('answer', btn.textContent);
    if (oyunBasladi) setOptionsEnabled(false);
    markAnswered();
  };
});

function markAnswered() {
  document.getElementById('answer-status').textContent = 'You answered!';
}

function setOptionsEnabled(enabled) {
  document.querySelectorAll('.option').forEach(btn => {
    btn.disabled = !enabled;
  });
}


socket.on('muzikBilgi', (data) => {
  document.body.style.overflow = 'scroll'; 
  const panel = document.getElementById('MuzikBilgiPanel');
  panel.innerHTML = ''; // Clear previous content

  const dom = `rgb(${data.dominantWhole[0]}, ${data.dominantWhole[1]}, ${data.dominantWhole[2]})`;

  // 🎨 4-corner gradient using dominantCorners
  if (data.dominantCorners) {
    const c = data.dominantCorners;

    const tl = `rgb(${c.top_left[0]}, ${c.top_left[1]}, ${c.top_left[2]})`;
    const tr = `rgb(${c.top_right[0]}, ${c.top_right[1]}, ${c.top_right[2]})`;
    const bl = `rgb(${c.bottom_left[0]}, ${c.bottom_left[1]}, ${c.bottom_left[2]})`;
    const br = `rgb(${c.bottom_right[0]}, ${c.bottom_right[1]}, ${c.bottom_right[2]})`;


    document.documentElement.style.height = '100%';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflowX = 'hidden';

    document.body.style.background = `
      radial-gradient(circle at top left, ${tl}, transparent 70%),
      radial-gradient(circle at top right, ${tr}, transparent 70%),
      radial-gradient(circle at bottom left, ${bl}, transparent 70%),
      radial-gradient(circle at bottom right, ${br}, transparent 70%),
      #222
    `;
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.backgroundSize = 'cover';
    document.body.style.transition = 'background 0.6s ease-in-out';

  }

  // Create cover image
  const img = document.createElement('img');
  img.src = data.coverUrl;
  img.alt = 'Cover';
  img.style.width = '200px';
  img.style.borderRadius = '10px';
  img.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
  img.style.marginBottom = '10px';
  img.style.transition = 'transform 0.3s ease';
  img.paddingTop = '30px';
  img.style.borderRadius = '8px';

  // Song name
  const infoText = document.createElement('div');
  infoText.textContent = `${data.songName}`;
  infoText.style.fontWeight = 'bold';
  infoText.style.fontSize = '30px';
  infoText.style.marginBottom = '10px';
  infoText.style.color = dom || '#ffff';
  infoText.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
  infoText.style.fontFamily = 'SEGOE UI, sans-serif';
  infoText.style.paddingTop = '30px';

  // Result
  const resultText = document.createElement('div');
  resultText.textContent = data.correct ? '✅ Correct!' : '❌ Wrong!';
  resultText.style.fontSize = '20px';
  resultText.style.color = data.correct ? '#27ae60' : '#e74c3c';
  resultText.style.fontWeight = 'bold';
  resultText.style.paddingTop = '10px';
  resultText.style.paddingBottom = '10px';
  resultText.style.fontFamily = 'SEGOE UI, sans-serif';
  resultText.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
  resultText.style.transition = 'color 0.3s ease';
  resultText.style.backgroundColor = '#181818';
  resultText.style.maxWidth = '300px';
  resultText.style.borderRadius = '12px';


  // Artist 
  const artistText = document.createElement('div');
  artistText.textContent = `${data.artist}`;
  artistText.style.fontWeight = 'bold';
  artistText.style.fontSize = '20px';
  artistText.style.marginBottom = '10px';
  artistText.style.color = dom || '#ffff';
  artistText.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
  artistText.style.fontFamily = 'SEGOE UI, sans-serif';

  // Append
  panel.style.marginTop = '30px';
  panel.style.textAlign = 'center';
  panel.appendChild(img);
  panel.appendChild(infoText);
  panel.appendChild(resultText);
  panel.appendChild(artistText);

  // Hide quiz
  const quiz = document.getElementById('quiz');
  quiz.style.display = 'none';


  if (data.artistInfo) {
    const artistImg = document.createElement('img');
    artistImg.src = data.artistInfo.image;
    artistImg.alt = 'Artist';
    artistImg.style.width = '150px';
    artistImg.style.borderRadius = '8px';
    artistImg.style.marginBottom = '10px';
    artistImg.style.borderRadius = '8px';
    artistImg.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
    artistImg.style.transition = 'transform 0.3s ease';
    artistImg.style.cursor = 'pointer';
    artistImg.onclick = () => {
      window.open(`https://open.spotify.com/artist/${data.artistInfo.id}`, '_blank');
    };
    artistImg.style.paddingTop = '30px';
    panel.appendChild(artistImg);

    const genres = document.createElement('div');
    genres.textContent = 'Genres: ' + (data.artistInfo.genres.join(', ') || 'N/A');
    genres.style.fontSize = '14px';
    genres.style.color = dom || '#ffff';
    genres.style.marginBottom = '10px';
    panel.appendChild(genres);
  }

  if (Array.isArray(data.lyrics) && data.lyrics.length > 0) {
    const lyricsContainer = document.createElement('div');
    lyricsContainer.style.marginTop = '20px';
    lyricsContainer.style.maxWidth = '90%';
    lyricsContainer.style.marginLeft = 'auto';
    lyricsContainer.style.marginRight = 'auto';
    lyricsContainer.style.fontFamily = "'Segoe UI', sans-serif";
    lyricsContainer.style.color = '#fff';
    lyricsContainer.style.textAlign = 'center';
    lyricsContainer.style.lineHeight = '1.6';
    lyricsContainer.style.fontSize = '18px';
    lyricsContainer.style.padding = '10px';
    lyricsContainer.style.borderRadius = '12px';
    lyricsContainer.style.background = 'rgba(0,0,0,0.3)';
    lyricsContainer.style.backdropFilter = 'blur(5px)';

    data.lyrics.forEach((line) => {
      const lineElem = document.createElement('div');
      lineElem.textContent = line;
      lineElem.style.marginBottom = '8px';
      lineElem.className = 'lyrics-line';
      lineElem.style.transition = 'color 0.3s ease';
      lineElem.style.fontFamily = 'SEGOE UI, sans-serif';
      lineElem.style.fontSize = '18px';
      lineElem.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
      lineElem.style.padding = '5px';
      lineElem.style.fontWeight = '900';
      lyricsContainer.appendChild(lineElem);
    });

    panel.appendChild(lyricsContainer);
  }


fetch('https://api.imgflip.com/get_memes')
  .then(res => res.json())
  .then(json => {
    if (json.success) {
      const memes = json.data.memes;
      const randomMeme = memes[Math.floor(Math.random() * memes.length)];

      const memeTitle = document.createElement('div');
      memeTitle.textContent = '🎉 Here’s a meme!';
      memeTitle.style.marginTop = '20px';
      memeTitle.style.fontWeight = 'bold';
      memeTitle.style.fontSize = '20px';
      memeTitle.style.color = '#fff';
      memeTitle.style.textShadow = '1px 1px 2px black';
      memeTitle.style.fontFamily = 'Segoe UI, sans-serif';

      const memeImg = document.createElement('img');
      memeImg.src = randomMeme.url;
      memeImg.alt = randomMeme.name;
      memeImg.style.maxWidth = '100%';
      memeImg.style.marginTop = '10px';
      memeImg.style.borderRadius = '10px';
      memeImg.style.boxShadow = '0 4px 10px rgba(0,0,0,0.4)';

      panel.appendChild(memeTitle);
      panel.appendChild(memeImg);
    }
  })
  .catch(err => {
    console.error('Failed to load meme:', err);
  });

});


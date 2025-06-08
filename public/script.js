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
      label.style.color = '#333';
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

socket.on('go-to-quiz', () => {
  document.getElementById('login').style.display = 'none';
  document.getElementById('quiz').style.display = 'block';
});

socket.on('oyunBasladi', () => {
  oyunBasladi = true;
  setOptionsEnabled(false);
});

socket.on('butonAc', (data) => {
  document.getElementById('MuzikBilgiPanel').innerHTML = '';
  document.body.style.background = '#f4f4f4'; // reset to default

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


    document.body.style.backgroundImage = `
      radial-gradient(circle at top left, ${tl}, transparent 70%),
      radial-gradient(circle at top right, ${tr}, transparent 70%),
      radial-gradient(circle at bottom left, ${bl}, transparent 70%),
      radial-gradient(circle at bottom right, ${br}, transparent 70%)
    `;
    document.body.style.backgroundColor = '#222'; // base color to blend with
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundSize = '100% 100%';
  }

  // Create cover image
  const img = document.createElement('img');
  img.src = data.coverUrl;
  img.alt = 'Cover';
  img.style.width = '200px';
  img.style.borderRadius = '10px';
  img.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
  img.style.marginBottom = '10px';

  // Artist + song name
  const infoText = document.createElement('div');
  infoText.textContent = `${data.artist} – ${data.songName}`;
  infoText.style.fontWeight = 'bold';
  infoText.style.fontSize = '18px';
  infoText.style.marginBottom = '10px';
  infoText.style.color = dom || '#fff';


  // Result
  const resultText = document.createElement('div');
  resultText.textContent = data.correct ? '✅ Correct!' : '❌ Wrong!';
  resultText.style.fontSize = '20px';
  resultText.style.color = data.correct ? '#27ae60' : '#e74c3c';
  resultText.style.fontWeight = 'bold';

  // Append
  panel.style.marginTop = '30px';
  panel.style.textAlign = 'center';
  panel.appendChild(img);
  panel.appendChild(infoText);
  panel.appendChild(resultText);

  // Hide quiz
  const quiz = document.getElementById('quiz');
  quiz.style.display = 'none';
});


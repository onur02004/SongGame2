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

socket.on('butonAc', () => {
  document.getElementById('answer-status').textContent = 'Please answer!';
  setOptionsEnabled(true);
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

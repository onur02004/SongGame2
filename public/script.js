const socket = io();
let avatar = '';
let username = '';
let oyunBasladi = false;

async function getAvatars() {
  const container = document.getElementById('avatar-list');
  const response = await fetch('/public/avatar');
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = [...doc.querySelectorAll('a')].filter(a => a.href.match(/\.(jpg|jpeg|png|gif)$/));

  links.forEach(link => {
    const img = document.createElement('img');
    img.src = link.href;
    img.width = 50;
    img.onclick = () => avatar = img.src;
    container.appendChild(img);
  });
}
getAvatars();

document.getElementById('avatar-upload').addEventListener('change', async (e) => {
  const formData = new FormData();
  formData.append('avatar', e.target.files[0]);
  const res = await fetch('/upload-avatar', {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  avatar = data.path;
});

document.getElementById('start-btn').onclick = () => {
  username = document.getElementById('username').value;
  if (!username || !avatar) return alert('Please enter username and select/upload avatar.');
  socket.emit('register', { username, avatar });
};

socket.on('go-to-quiz', () => {
  document.getElementById('login').style.display = 'none';
  document.getElementById('quiz').style.display = 'block';
});

socket.on('oyunBasladi', () => {
  oyunBasladi = true;
  setOptionsEnabled(false);
});

socket.on('butonAc', () => {
  setOptionsEnabled(true);
});

socket.on('butonKapa', () => {
  setOptionsEnabled(false);
});

document.querySelectorAll('.option').forEach(btn => {
  btn.onclick = () => {
    socket.emit('answer', btn.textContent);
    if(oyunBasladi)
      setOptionsEnabled(false);
  };
});

function setOptionsEnabled(enabled) {
  document.querySelectorAll('.option').forEach(btn => {
    btn.disabled = !enabled;
  });
}


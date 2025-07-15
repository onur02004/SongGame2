const socket = io();
let avatar = '';
let username = '';
let oyunBasladi = false;
const grid = document.querySelector('.grid-2x2');


//baslangic
async function getAvatars() {
    const container = document.getElementById('avatar-list');
    const response = await fetch('/api/avatars');
    const avatars = await response.json();
    document.getElementById('detailsPanel').style.display = 'none';
    document.getElementById('upperHolderPanel').style.display = 'none';
    document.getElementById('puanHolderPanel').style.display = 'none';
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
            document.getElementById('puanHolderPanel').style.display = 'block';

        };

        imgWrapper.appendChild(img);
        imgWrapper.appendChild(label);
        container.appendChild(imgWrapper);
    });


}
getAvatars();


//asagisi oyun
socket.on('oyunBasladi', () => {
    oyunBasladi = true;
    setOptionsEnabled(false);
    window.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';


    const buttons = document.querySelectorAll('.grid-2x2 > button');

    buttons.forEach((btn, i) => {
        const span = btn.querySelector('span');
        if (span) {
            span.textContent = "...";
        }

        btn.style.setProperty('--bg', `url(https://d33wubrfki0l68.cloudfront.net/e0519fd6fa113912df237f6bd97394bb319cca32/b6a09/uploads/slidin-squares.gif)`);
    });

    document.getElementById('answer-status').textContent = 'Please answer!';

    grid.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    document.getElementById('detailsPanel').style.display = 'none'; //bura
    document.getElementById('upperHolderPanel').style.display = 'flex';
});

function setOptionsEnabled(enabled) {
    document.querySelectorAll('.grid-2x2 > button').forEach(btn => {
        btn.disabled = !enabled;
    });
}




socket.on('butonAc', (data) => {
    document.getElementById('detailsPanel').style.display = 'none';
    document.getElementById('upperHolderPanel').style.display = 'flex';

    grid.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
    window.scrollTo(0, 0);

    if (!data || !Array.isArray(data.options) || data.options.length < 8) return;

    // grab the 4 buttons
    const buttons = document.querySelectorAll('.grid-2x2 > button');

    buttons.forEach((btn, i) => {
        // 1) set the text
        const span = btn.querySelector('span');
        if (span) {
            span.textContent = data.options[i];
        }

        // 2) set the background image URL
        const imageUrl = data.options[4 + i];
        btn.style.setProperty('--bg', `url(${imageUrl})`);
    });

    document.getElementById('answer-status').textContent = 'Please answer!';
    setOptionsEnabled(true);

    grid.classList.add('entering');
    setTimeout(() => grid.classList.remove('entering'), 800);

    // retrigger your typewriter animation
    const status = document.getElementById('answer-status');
    status.style.animation = 'none';
    void status.offsetWidth;
    status.style.animation = '';
});




socket.on('butonKapa', () => {
    console.log('Time is up! Disabling options');
    setOptionsEnabled(false);
    document.getElementById('answer-status').textContent = 'Time is up!';
});




grid.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn || !grid.contains(btn)) return;

    // 1) Clear previous selection
    grid.querySelectorAll('button').forEach(b => b.classList.remove('selected'));

    // 2) Mark this one
    btn.classList.add('selected');

    // 3) Emit, disable all, and mark answered
    socket.emit('answer', btn.textContent.trim());
    if (oyunBasladi) setOptionsEnabled(false);
    markAnswered();
});


function markAnswered() {
    document.getElementById('answer-status').textContent = 'You answered!';
}





socket.on('muzikBilgi', (data) => {
    document.body.style.overflowY = 'auto';
    document.body.style.overflowX = 'hidden';
    const quiz = document.getElementById('upperHolderPanel');
    const details = document.getElementById('detailsPanel');

    quiz.style.display = 'none';
    details.style.display = 'flex';

    // set the 4-corner gradient on detailsPanel as before...
    if (data.dominantCorners) {
        const [tl, tr, bl, br] = [
            data.dominantCorners.top_left,
            data.dominantCorners.top_right,
            data.dominantCorners.bottom_left,
            data.dominantCorners.bottom_right
        ].map(rgb => `rgb(${rgb.join(',')})`);

        details.style.background = `
      radial-gradient(circle at top left,    ${tl}, transparent 70%),
      radial-gradient(circle at top right,   ${tr}, transparent 70%),
      radial-gradient(circle at bottom left, ${bl}, transparent 70%),
      radial-gradient(circle at bottom right,${br}, transparent 70%),
      #222
    `;
    }

    // update each details <img class="sarkidetayimg">
    document.querySelectorAll('.sarkidetayimg').forEach(img => {
        img.src = data.coverUrl;
    });

    document.getElementById('albumcoverimg').src = data.artistImg;
    document.getElementById('genrecoverimg').src = data.coverUrl;


    // Create cover image
    const img = document.getElementsByClassName('sarkidetayimg');
    img.src = data.coverUrl;

    // Song name
    const infoText = document.getElementById('song-name');
    infoText.textContent = `${data.songName}`;

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
    const artistText = document.getElementById('artist-name');
    artistText.textContent = `${data.artist}`;


    if (data.artistInfo) {
        const artistImg = document.getElementById('albumcoverimg');
        artistImg.src = data.artistInfo.image;
        artistImg.alt = 'Artist';
        artistImg.onclick = () => {
            window.open(`https://open.spotify.com/artist/${data.artistInfo.id}`, '_blank');
        };

        const genres = document.getElementById('artist-genres');
        genres.textContent = 'Genres: ' + (data.artistInfo.genres.join(', ') || 'N/A');
    }

    if (Array.isArray(data.lyrics) && data.lyrics.length > 0) {
        // instead of getElementById:
        const lyricsContainer = document.querySelector('.lyrics-container');
        lyricsContainer.innerHTML = '';
        if (lyricsContainer && Array.isArray(data.lyrics)) {
            data.lyrics.forEach(line => {
                const lineElem = document.createElement('p');
                lineElem.textContent = `-${line}`;
                // …
                lyricsContainer.appendChild(lineElem);
            });
        }


    }


    fetch('https://api.imgflip.com/get_memes')
        .then(res => res.json())
        .then(json => {
            if (json.success) {
                const memes = json.data.memes;
                const randomMeme = memes[Math.floor(Math.random() * memes.length)];

                const memeImg = document.getElementById('memeimg');
                memeImg.src = randomMeme.url;
                memeImg.alt = randomMeme.name;
            }
        })
        .catch(err => {
            console.error('Failed to load meme:', err);
        });

});

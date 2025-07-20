const socket = io();
let avatar = '';
let username = '';
let oyunBasladi = false;
const grid = document.querySelector('.grid-2x2');
let dogruYanlisLabel;
let sonTurCevap = '';

//baslangic
async function getAvatars() {
    if (dogruYanlisLabel) {
        dogruYanlisLabel.textContent = "Loading…";
    } else {
        console.warn('#dogruCevapBaslik not found in DOM');
    }
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

            document.getElementById('profilePic').src = img.src;

            socket.emit('register', { username, avatar });

            document.getElementById('login').style.display = 'none';
            document.getElementById('quiz').style.display = 'block';
            document.getElementById('upperHolderPanel').style.display = 'flex';
            document.getElementById('puanHolderPanel').style.display = 'flex';

        };

        imgWrapper.appendChild(img);
        imgWrapper.appendChild(label);
        container.appendChild(imgWrapper);
    });


}
getAvatars();

document.addEventListener('DOMContentLoaded', () => {
    dogruYanlisLabel = document.getElementById('dogruCevapBasliklabel');
    console.log('dogruYanlisLabel:', dogruYanlisLabel);
});

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
    sonTurCevap = "";
    dogruYanlisLabel.textContent = "Loading...";
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
    sonTurCevap = btn.textContent;
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

    loadRandomEmote();
    document.getElementById('albumcoverimg').src = data.artistImg;
    document.getElementById('genrecoverimg').src = data.coverUrl;


    // Create cover image
    const img = document.getElementsByClassName('sarkidetayimg');
    img.src = data.coverUrl;

    // Song name
    const infoText = document.getElementById('song-name');
    infoText.textContent = `${data.songName}`;

    // Artist 
    const artistText = document.getElementById('artist-name');
    artistText.textContent = `${data.artist}`;

    console.log('sonTurCevap>' + sonTurCevap.trim() + "< cevap>" + data.songName + "<");
    if (sonTurCevap.trim() == data.songName.trim()) {
        console.log("Correct answer!");
        dogruYanlisLabel.style.background = '#27ae60';
        dogruYanlisLabel.textContent = "CORRECT!";
    } else if(sonTurCevap.trim() !== "") {
        console.log("Wrong answer!");
        dogruYanlisLabel.textContent = "NOT CORRECT. ANSWER: " + data.songName;
        dogruYanlisLabel.style.background = '#e74c3c';
    }else {
        dogruYanlisLabel.textContent = "ANSWER: " + data.songName;
        dogruYanlisLabel.style.background = '#f39c12';
    }


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

    loadArtistAssets(data.artist);

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

async function loadRandomEmote() {
  try {
    const res = await fetch('/api/randomEmote');
    if (!res.ok) throw new Error('Network response was not ok');
    const { file } = await res.json();
    const img = document.getElementById('randomImage');
    img.src = file;
  } catch (err) {
    console.error('Could not load random emote:', err);
  }
}



function getMyScoreAndRank(users) {
    // 1) sort descending by score
    const sorted = [...users].sort((a, b) => b.score - a.score);

    // 2) assign rank (1-based). Ties get distinct ranks, but you can adjust tie logic if you want
    sorted.forEach((u, i) => u.rank = i + 1);

    // 3) find the current user
    return sorted.find(u => u.username === username);
}

socket.on('userScores', users => {
    console.log('Received user scores:', users);
    const me = getMyScoreAndRank(users);
    if (!me) return console.warn('Got scores but no entry for me!');

    // now update the UI in your puanHolderPanel
    const panel = document.getElementById('puanHolderPanel');
    // assume you’ve got an <h3> in there to show place & points:
    const h3 = panel.querySelector('h3');
    h3.textContent = `Place: #${me.rank} || POINTS: ${me.score}`;
});




socket.on('lyricsRealtime', data => {

    highlightLine(data);
});
function highlightLine(n) {
    // clear any previous highlights
    document.querySelectorAll('.lyrics-container p')
        .forEach(p => p.classList.remove('highlight'));

    const lines = document.querySelectorAll('.lyrics-container p');
    if (n >= 0 && n < lines.length) {
        const target = lines[n];
        // trigger reflow (in some browsers) so transition always runs
        void target.offsetWidth;
        target.classList.add('highlight');
    }
}



//artist info
async function findArtistQID(artistName) {
  // 1) Search for the Wikipedia page
  const wikiRes = await fetch(
    `https://en.wikipedia.org/w/api.php?` +
    new URLSearchParams({
      action:   "query",
      list:     "search",
      srsearch: artistName,
      format:   "json",
      origin:   "*"
    })
  );
  const wikiData = await wikiRes.json();
  const title = wikiData.query.search[0].title;

  // 2) Get Wikidata entity for that page
  const pageRes = await fetch(
    `https://en.wikipedia.org/w/api.php?` +
    new URLSearchParams({
      action:    "query",
      prop:      "pageprops",
      titles:    title,
      format:    "json",
      origin:    "*"
    })
  );
  const pageData = await pageRes.json();
  const pageId = Object.keys(pageData.query.pages)[0];
  return pageData.query.pages[pageId].pageprops.wikibase_item;  // e.g. "Q###"
}

async function fetchArtistMedia(qid) {
  // SPARQL to get portrait + official YouTube video if any
  const sparql = `
    SELECT ?portrait ?video WHERE {
      wd:${qid} wdt:P18    ?portrait .         # main image
      OPTIONAL { wd:${qid} wdt:P1091 ?video }  # official music video
    }
  `;
  const url = "https://query.wikidata.org/sparql?" +
    new URLSearchParams({ query: sparql, format: "json" });
  const res = await fetch(url);
  const data = await res.json();
  if (!data.results.bindings.length) return {};
  const { portrait, video } = data.results.bindings[0];
  return {
    imageUrl: portrait.value,         // e.g. https://commons.wikimedia.org/…
    videoUrl: video?.value || null    // YouTube link or null
  };
}

async function loadArtistAssets(artistName) {
  try {
    const qid = await findArtistQID(artistName);
    const { imageUrl, videoUrl } = await fetchArtistMedia(qid);

    // Show portrait
    document.getElementById('albumcoverimg').src = imageUrl;
  } catch (err) {
    console.error("Failed to load artist media:", err);
  }
}

function emitBuyukEkran() {
    console.log('Emitting buyukEkran event with random image URL: ' + document.getElementById('randomImage').src);
    socket.emit('buyukEkran', document.getElementById('randomImage').src);
}




const listBackBtn = document.getElementById("listBackBtn");
const songBackBtn = document.getElementById("songBackBtn");
const folderSelectDiv = document.getElementById("folderSelectDiv");
const musicListDiv = document.getElementById("musicListDiv");
const musicPlayerDiv = document.getElementById("musicPlayerDiv");
const selectFolderBtn = document.getElementById("selectFolderBtn");
const songList = document.getElementById("songList");
const allSongList = document.getElementsByClassName("allSongList");
const currentSongTitle = document.getElementById("currentSongTitle");
const currentSongArtist = document.getElementById("currentSongArtist");
const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

let songs = [];

//on load, check for last folder and load songs
window.onload = async () => {
    const config = await window.electron.loadConfig();
    if (config) {
        const { lastFolder, lastSong } = config;
        // alert(`Loading last session from folder: ${lastFolder}`);
        // Load songs from the last folder
        songs = await window.electron.loadSongs(lastFolder);
        if (songs && songs.length > 0) {
            //Set loading for folder click btn
            selectFolderBtn.textContent = "loading";
            selectFolderBtn.disabled = true;

            folderSelectDiv.classList.add("hidden");
            musicListDiv.classList.remove("hidden");
            listAllSongs(songs);
            setupHoverEffects();
            // If there was a last song, play it
            // alert(`Resuming last session. Playing: ${lastSong}`);
            if (lastSong) {
                const lastPlayedSong = songs.find(s => s.path === lastSong);
                if (lastPlayedSong) {
                    playSong(lastPlayedSong.id);
                }
            }
        }


    };
    selectFolderBtn.textContent = "Select Music Folder";
    selectFolderBtn.disabled = false;
};

//function to send last session data to main process
async function saveLastSession(songId) {

    const song = songs.find(s => s.id === songId);
    if (song) {
        // Call Electron API to save config
        const success = await window.electron.saveConfig(song.path, songId);
        // if (success) {
        //     alert("Last session saved successfully.");
        // } else {
        //     alert("Failed to save last session.");
        // }
    }
}


// Event listeners for navigation buttons
listBackBtn.addEventListener("click", () => {
    if (audio) {
        alert("Going to main screen. Music will stop playing.", { type: "warning" },);
        audio.pause();
        audio.currentTime = 0;
        audio = null;
        currentSongId = null;
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
    musicListDiv.classList.add("hidden");
    folderSelectDiv.classList.remove("hidden");
});

songBackBtn.addEventListener("click", () => {
    musicPlayerDiv.classList.add("hidden");
    musicListDiv.classList.remove("hidden");
});

// Event listener for folder selection button
selectFolderBtn.addEventListener("click", async () => {
    // Call Electron API to select folder and get songs
    songs = await window.electron.selectFolder();
    if (songs && songs.length > 0) {
        folderSelectDiv.classList.add("hidden");
        musicListDiv.classList.remove("hidden");
        listAllSongs(songs);
        setupHoverEffects();
    } else {
        alert("No audio files found in the selected folder.");
    }
});

// Function to play the selected song
let audio = null;
let currentSongId = null;

function playSong(songId) {
    // Find the song details from the list using the songId
    const song = Array.from(songs).find(item => item.id === songId);
    if (song) {
        musicListDiv.classList.add("hidden");
        musicPlayerDiv.classList.remove("hidden");
        saveLastSession(songId);
        currentSongTitle.textContent = song.title;
        currentSongArtist.textContent = song.artist;

        // If audio exists, pause and reset it
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        audio = new Audio(song.path);
        currentSongId = songId;
        audio.play();
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';

        playBtn.onclick = () => {
            if (audio.paused) {
                audio.play();
                playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            } else {
                audio.pause();
                playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';

            }
        };
        prevBtn.onclick = () => {
            //Restart song logic
            audio.currentTime = 0;
            audio.play();
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        };
        prevBtn.ondblclick = () => {
            // Logic to play previous song
            const currentIndex = songs.findIndex(s => s.id === currentSongId);
            const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
            playSong(songs[prevIndex].id);
        };
        nextBtn.onclick = () => {
            // Logic to play next song
            const currentIndex = songs.findIndex(s => s.id === currentSongId);
            const nextIndex = (currentIndex + 1) % songs.length;
            playSong(songs[nextIndex].id);
        };

        // Update play button when song ends
        audio.onended = () => {
            playBtn.textContent = "Play";
            const currentIndex = songs.findIndex(s => s.id === currentSongId);
            const nextIndex = (currentIndex + 1) % songs.length;
            playSong(songs[nextIndex].id);
        };

        //Progress bar update
        const progressBar = document.getElementById("progressBar");
        const currentTimeEl = document.getElementById("currentTime");
        const totalTimeEl = document.getElementById("totalTime");

        audio.ontimeupdate = () => {
            if (audio.duration) {
                const progressPercent = (audio.currentTime / audio.duration) * 100;
                progressBar.value = progressPercent;
                currentTimeEl.textContent = formatTime(audio.currentTime);
                totalTimeEl.textContent = formatTime(audio.duration);
            }
        };

        progressBar.oninput = () => {
            if (audio.duration) {
                const seekTime = (progressBar.value / 100) * audio.duration;
                audio.currentTime = seekTime;
            }
        };
    }
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

// Function to list all songs in the UI
async function listAllSongs(songs) {
    songList.innerHTML = '';
    let html = "";
    for (const song of songs) {
        html += `<div id="${song.id}" class="allSongList flex p-4 items-center rounded-lg justify-between mb-2 p-2 bg-gradient-to-r from-[#0e7490] via-[#3b82f6] to-[#4f46e5] cursor-pointer
    transform hover:scale-105 transition duration-300 ease-in-out hover:shadow-lg
    ">
    <div class="flex items-center">
        <img src="${song.cover || 'https://via.placeholder.com/50'}" alt="Cover" class="w-12 h-12 rounded mr-4 object-cover">
        <div>
            <h2 class="text-lg font-semibold">${song.title}</h2>
            <p class="text-sm text-gray-200">${song.artist} - ${song.album}</p>
        </div>
    </div>
    <div class="text-sm durationClass text-gray-200">${Math.floor(song.duration / 60)}:${('0' + (song.duration % 60)).slice(-2)}</div>
    <div class="hidden playbtnClass flex items-center">
        <button class="playBtn bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-2 rounded" data-id="${song.id}">Play</button>
    </div>
</div>`;
    }
    songList.innerHTML = html;
    setupHoverEffects(); // Attach event listeners to new elements
}

// Hover effect for song items
function setupHoverEffects() {
    const allSongList = document.getElementsByClassName("allSongList");
    Array.from(allSongList).forEach(item => {
        item.addEventListener("mouseenter", () => {
            const durationDiv = item.querySelector('.durationClass');
            const playDiv = item.querySelector('.playbtnClass');
            if (durationDiv && playDiv) {
                durationDiv.classList.add('hidden');
                playDiv.classList.remove('hidden');
            }
            item.classList.add("bg-blue-600");
        });
        item.addEventListener("mouseleave", () => {
            const durationDiv = item.querySelector('.durationClass');
            const playDiv = item.querySelector('.playbtnClass:not(.hidden)');
            if (durationDiv && playDiv) {
                durationDiv.classList.remove('hidden');
                playDiv.classList.add('hidden');
            }
            item.classList.remove("bg-blue-600");
        });
        // Play On click of play button
        // const playBtn = item.querySelector('.playBtn');
        // if (playBtn) {
        //     playBtn.addEventListener("click", (event) => {
        //         event.stopPropagation(); // Prevent parent click
        //         const songId = playBtn.getAttribute('data-id');
        //         playSong(songId);
        //     });
        // }
        // Optional: If you want clicking the whole item to play the song (not just the button), keep this:
        item.addEventListener("click", () => {
            playSong(item.id);
        });
        //progress bar update

    });
}




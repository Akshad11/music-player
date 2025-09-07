const { app, BrowserWindow, ipcMain, dialog } = require('electron/main');
const path = require('node:path');
const fs = require('fs');
const mm = require('music-metadata');
const { randomUUID } = require('node:crypto');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 450,
        height: 350,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(__dirname, "assets/icon.png"),

    })
    win.loadFile("index.html");
    win.setMenuBarVisibility(false);
};

//Handle folder selection
ipcMain.handle("select-audio", async () => {
    const result = await dialog.showOpenDialog(win, {
        properties: ['openDirectory']
    });

    if (result.canceled) {
        return [];
    }
    const folderPath = result.filePaths[0];

    const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];

    const files = fs.readdirSync(folderPath)
        .filter(file => audioExtensions.includes(path.extname(file).toLowerCase()))
        .map(file => path.join(folderPath, file));

    const songs = [];
    for (const file of files) {
        try {
            const metadata = await mm.parseFile(file);
            const common = metadata.common;
            let pictureBase64 = null;
            let coverExt = '.jpg'; // default extension

            if (common.picture && common.picture.length > 0) {
                const picture = common.picture[0];
                let format = picture.format || 'image/jpeg';
                // Set extension based on format
                if (format === 'image/png') coverExt = '.png';
                else coverExt = '.jpg';

                // Create base64 string for renderer
                pictureBase64 = `data:${format};base64,${picture.data.toString('base64')}`;

                // Optionally, save the cover image to disk
                // await writeCoverToFileAsync(
                //     pictureBase64,
                //     `covers/${path.basename(file, path.extname(file))}${coverExt}`
                // );
            }

            songs.push({
                path: file,
                title: common.title || path.basename(file),
                artist: common.artist || 'Unknown Artist',
                album: common.album || 'Unknown Album',
                duration: metadata.format.duration ? Math.floor(metadata.format.duration) : 0,
                cover: pictureBase64,
                id: randomUUID()
            });
        } catch (error) {
            songs.push({
                path: file,
                title: path.basename(file),
                artist: 'Unknown Artist',
                album: 'Unknown Album',
                duration: 0,
                cover: null
            });
        }
    }
    return songs;
});


async function writeCoverToFileAsync(base64Data, filePath) {
    if (!base64Data) return; // Skip if no cover

    const dir = path.dirname(filePath);
    // Ensure the directory exists
    await fs.promises.mkdir(dir, { recursive: true });

    const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    const imageBuffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');
    await fs.promises.writeFile(filePath, imageBuffer);
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
})

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
})

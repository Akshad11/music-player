const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    selectFolder: () => ipcRenderer.invoke('select-audio'),
    saveConfig: (songPath, songID) => ipcRenderer.invoke('save-config', { songPath, songID }),
    loadConfig: () => ipcRenderer.invoke('load-config'),
    loadSongs: (folderPath) => ipcRenderer.invoke('load-songs', folderPath)
}); 
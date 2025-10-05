const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('api', {
  safeFunc: () => {
    console.log('This is safe Node API exposure.');
  }
});

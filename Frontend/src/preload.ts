import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel: string, args: any) => ipcRenderer.send(channel, args),
    on: (channel: string, func: (event: any, args: any) => void) =>
      ipcRenderer.on(channel, (event, args) => func(event, args)),
    once: (channel: string, func: (event: any, args: any) => void) =>
      ipcRenderer.once(channel, (event, args) => func(event, args)),
    invoke: (channel: string, args: any) => ipcRenderer.invoke(channel, args),
  },
  app: {
    getVersion: () => ipcRenderer.invoke('app:get-version'),
    getPath: (name: string) => ipcRenderer.invoke('app:get-path', name),
  },
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
  },
  notifications: {
    send: (title: string, options: any) =>
      ipcRenderer.invoke('notification:send', { title, options }),
  },
});

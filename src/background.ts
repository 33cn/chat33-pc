'use strict';
// tslint:disable
import electron, { app, protocol, BrowserWindow, Menu, dialog, Tray } from 'electron';
import * as path from 'path';
import { format as formatUrl } from 'url';
import {
  createProtocol
  // installVueDevtools,
} from 'vue-cli-plugin-electron-builder/lib';
import { ipcMain } from 'electron';
import fs from 'fs';
import fsExtra from 'fs-extra';
import crypto from 'crypto';
import OSS from 'ali-oss';
import getVideoInfo from './utils/app/getVideoInfo';
import getUsefulFileName from './utils/app/getUsefulFileName';
import os from 'os';

// config
const SMALL_WINDOW = { // 登录窗口固定尺寸 todo 提出config
  width: 400,
  height: 500
};
const LARGE_WINDOW = { // 聊天窗口默认尺寸
  width: 1000,
  height: 800
};
const LARGE_WINDOW_MIN = { // 聊天窗口最小尺寸
  minWidth: 840,
  minHeight: 500
};

let allowUpdateQuit = false;

if (process.platform === 'win32') {
  app.setUserTasks([]); // 任务栏自定义菜单项清除
  app.setAppUserModelId('com.33.chat33pc'); // 支持windows下系统通知
}

const isDevelopment = process.env.NODE_ENV !== 'production';
if (isDevelopment) {
  // Don't load any native (external) modules until the following line is run:
  require('module').globalPaths.push(process.env.NODE_MODULES_PATH);
}

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: any; // BrowserWindow

// Standard scheme must be registered before the app is ready
// protocol.registerStandardSchemes(['app'], { secure: true });

protocol.registerSchemesAsPrivileged([{
  scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true },
}]);
function createMainWindow() {

  if (process.platform === 'darwin') { // 支持mac下的复制粘贴
    const template = [
      {
        label: 'Application',
        submenu: [
          {
            label: '退出', accelerator: 'Command+Q', click: function () {
              app.quit();
            }
          }
        ]
      },
      {
        label: '编辑',
        submenu: [
          { label: '复制', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
          { label: '剪切', accelerator: 'CommandOrControl+X', selector: 'cut:' },
          { label: '粘贴', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
          { label: '撤销', accelerator: 'CommandOrControl+Z', selector: 'undo:' },
          { label: '重做', accelerator: 'Shift+CommandOrControl+Z', selector: 'redo:' },
          { label: '全选', accelerator: 'CommandOrControl+A', selector: 'selectAll:' }
        ]
      }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  } else {
    Menu.setApplicationMenu(null);
  }

  const window = new BrowserWindow({
    height: SMALL_WINDOW.height,
    width: SMALL_WINDOW.width,
    minHeight: SMALL_WINDOW.height,
    minWidth: SMALL_WINDOW.width,
    backgroundColor: '#fff',
    frame: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: { webSecurity: false, nodeIntegration: true, nodeIntegrationInWorker: true },
    show: false,
    resizable: false,
    fullscreenable: false
    // transparent: true,
  });

  if (isDevelopment) {
    window.webContents.openDevTools();
    // BrowserWindow.addDevToolsExtension(path.join('E:/myRepository/vue-devtools/shells/chrome'));
    // Load the url of the dev server if in development mode
    window.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    window.setResizable(true); // dev下可调窗口
  } else {
    createProtocol('app');
    //   Load the index.html when not in development
    window.loadURL(
      formatUrl({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file',
        slashes: true,
      }),
    );
    // window.webContents.openDevTools();
    // window.setMenu();
  }

  app.commandLine.appendSwitch("--disable-http-cache");
  // 点击关闭时仅隐藏窗口，不结束渲染进程 mac only
  window.on('close', (e: any) => {
    if (process.platform === 'darwin') { // 避免windows下导致结束后未关闭进程
      if (allowUpdateQuit) return;
      if (!mainWindow) return; // 访问时window仍存在
      e.preventDefault();
      if (window.isFullScreen()) { // 全屏时先退出全屏再隐藏窗口，避免黑屏
        window.once('leave-full-screen', () => {
          window.hide();
        });
        window.setFullScreen(false);
      } else {
        window.hide();
      }
    } else {
      if (!mainWindow) return; // 访问时window仍存在
      e.preventDefault();
      window.hide();
    }
  });

  window.on('restore', () => {
    mainWindow.webContents.send('on-window-focus');
  });

  window.once('ready-to-show', () => {
    window.show();
    if (isDevelopment && process.platform === 'win32') {
      window.show(); // 临时解决windows下serve模式无法打开显示窗口
    }
  });

  // window.on('closed', (e: any) => {
  //   mainWindow = null;
  // });

  // window.webContents.on('devtools-opened', () => {
  //   window.focus();
  //   setImmediate(() => {
  //     window.focus();
  //   });
  // });

  return window;
}

// 初始化自动更新事件========================================================
const { autoUpdater } = require('electron-updater');

autoUpdater.autoDownload = false;

autoUpdater.on('error', (err: any) => {
  mainWindow.webContents.send('update-error', err);
});

autoUpdater.on('update-available', (info: any) => {
  mainWindow.webContents.send('get-update-available', info);
});

autoUpdater.on('update-not-available', () => {
  mainWindow.webContents.send('no-update');
});

autoUpdater.on('update-downloaded', () => {
  allowUpdateQuit = true;
  autoUpdater.quitAndInstall();
});

autoUpdater.on('download-progress', (process: any) => {
  mainWindow.webContents.send('on-progress', process);
});

// 注册监听渲染进程事件========================================================

// windows only
ipcMain.on('window-hind', () => {
  mainWindow.minimize();
});

ipcMain.on('onSocketMsg', (event: any) => {
  event.returnValue = mainWindow.isMinimized();
});


ipcMain.on('getMac', (event: any) => { // 未处理切换网卡
  require('macaddress').one((err: any, mac: string) => {
    if (err) {
      throw err;
    }
    event.returnValue = mac;
  });
});

ipcMain.on('check_device_name', (event: any) => {
  event.returnValue = require('os').hostname();
});

ipcMain.on('check-update', () => {
  autoUpdater.checkForUpdates();
});

ipcMain.on('click-start-download', () => {
  autoUpdater.downloadUpdate();
});

// ipcMain.on('click-install', () => { // 废弃，目前为下载完成自动安装
//   autoUpdater.quitAndInstall();
// });

ipcMain.on('resize-window', () => {
  mainWindow.setSize(LARGE_WINDOW.width, LARGE_WINDOW.height);
  mainWindow.center();
  mainWindow.setResizable(true);
  mainWindow.setFullScreenable(true);
  mainWindow.setMinimumSize(LARGE_WINDOW_MIN.minWidth, LARGE_WINDOW_MIN.minHeight); // 坑：windows下需要先setResizable
});

ipcMain.on('resize-window-small', () => {
  mainWindow.setMinimumSize(SMALL_WINDOW.width, SMALL_WINDOW.height);
  mainWindow.setSize(SMALL_WINDOW.width, SMALL_WINDOW.height);
  mainWindow.center();
  if (!isDevelopment) {
    mainWindow.setResizable(false); // 登录窗口不可调整大小
  }
  mainWindow.setFullScreenable(false);
});

ipcMain.on('focus-app', () => {
  mainWindow.show();
});

/**
 * 保存图片
 */
ipcMain.on('show-save-dialog', (event: any, arg: string) => {
  dialog.showSaveDialog({ defaultPath: `${Date.now()}.jpg` }).then((response) => {
    if (response.filePath) {
      const base64 = arg.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64, 'base64');
      fs.writeFile(response.filePath, buffer, (err: any) => {
        if (err) {
          dialog.showErrorBox('异常', '保存失败');
        }
      });
    }
  });
});

/**
 * 另存为(文件/视频消息)
 */
ipcMain.on('save-to-dir', (event: any, arg: any) => {
  dialog.showSaveDialog({ defaultPath: arg.name }).then((res) => {
    if (res.filePath) {
      fsExtra.copy(arg.path, res.filePath).catch((e: any) => {
        mainWindow.webContents.send('save-to-dir-fail', e);
      });
    }
  });
});

// 发送文件选取弹窗
ipcMain.on('show-file-select', () => {
  dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'] // [允许选择文件,支持多选]
  }).then((res) => {
    mainWindow.webContents.send('after-file-select', res.filePaths);
  })
});

ipcMain.on('show-video-select', () => {
  dialog.showOpenDialog({
    filters: [
      {
        extensions: ['mp4', 'avi', 'mov'], // 'ogg', 'flv', 'rmvb', 'f4v', 'mkv' 不支持/未测试获取信息 不支持'mpg'
        name: 'video'
      }
    ],
    properties: ['openFile', 'multiSelections']
  }).then((res) => {
    mainWindow.webContents.send('after-video-select', res.filePaths);
  });
});

ipcMain.on('show-video-pic-select', () => {
  dialog.showOpenDialog({
    filters: [
      {
        extensions: ['mp4', 'avi', 'mov', 'png', 'jpg', 'jpeg'], // 'ogg', 'flv', 'rmvb', 'f4v', 'mkv' 不支持/未测试获取信息
        name: 'videoPic'
      }
    ],
    properties: ['openFile', 'multiSelections']
  }).then((res) => {
    mainWindow.webContents.send('after-video-pic-select', res.filePaths);
  });
});

ipcMain.on('get-video-info', (event: any, path: string) => {
  getVideoInfo(path).then((info) => {
    mainWindow.webContents.send(`get-video-info${path}`, info);
  });
});

function uploadFile(arg: any) { // todo 优化上传文件
  const listenEvent = arg.listenEvent;
  const stream = fs.createReadStream(arg.path); // render进程create oss无法识别为ReadableStream?
  const fsHash = crypto.createHash('md5');
  stream.on('data', (d) => {
    fsHash.update(d);
  });

  stream.on('end', () => {
    const md5 = fsHash.digest('hex');
    const userId = arg.userId;
    const client = new OSS({ // 在render进程不支持Stream
      endpoint: process.env.VUE_APP_OSSIP,
      accessKeyId: process.env.VUE_APP_OSSKEY,
      accessKeySecret: process.env.VUE_APP_OSSSECRET,
      bucket: process.env.VUE_APP_OSSBUKET
    });
    const fileType = (stream as any).path.split('.').pop();
    let url = `chat33/file/${Date.now()}_${userId}_${Math.floor(Math.random() * 10000)}.${fileType}`;

    const name = path.basename(arg.path);
    client.put(url, arg.path).then((res: any) => {
      // 拷贝文件到文件存储目录
      const userDir = (electron.app || electron.remote.app).getPath('userData');
      const fileDirPath = path.join(userDir, 'file');
      const localName = getUsefulFileName(name); // 本地文件名(不重复)
      const localPath = path.join(fileDirPath, localName);
      fsExtra.copy(arg.path, localPath).then(() => {
        mainWindow.webContents.send(listenEvent, {
          oss: res,
          md5,
          size: stream.bytesRead,
          name,
          localPath
        });
      }).catch(() => {
        mainWindow.webContents.send(listenEvent, {
          oss: res,
          md5,
          size: stream.bytesRead,
          name,
          err: '文件转存失败',
          localPath
        });
      });
    }).catch(() => {
      mainWindow.webContents.send(listenEvent, {
        oss: null,
        md5,
        size: stream.bytesRead,
        name,
        err: '上传失败',
        localPath: ''
      });
    });
  });
}

async function uploadVideo(arg: any) { // todo 优化上传文件
  const listenEvent = arg.listenEvent;
  const userId = arg.userId;
  const client = new OSS({ // 在render进程不支持Stream
    endpoint: process.env.VUE_APP_OSSIP,
    accessKeyId: process.env.VUE_APP_OSSKEY,
    accessKeySecret: process.env.VUE_APP_OSSSECRET,
    bucket: process.env.VUE_APP_OSSBUKET
  });
  const fileType = path.extname(arg.path);
  let url = `chat33/video/${Date.now()}_${userId}_${Math.floor(Math.random() * 10000)}.${fileType}`;
  const name = path.basename(arg.path);
  client.put(url, arg.path).then((res: any) => {
    // 拷贝文件到文件存储目录
    const userDir = (electron.app || electron.remote.app).getPath('userData');
    const fileDirPath = path.join(userDir, 'file');
    const localPath = path.join(fileDirPath, name);
    fsExtra.copy(arg.path, localPath).then(() => {
      mainWindow.webContents.send(listenEvent, {
        oss: res,
        size: fs.lstatSync(arg.path).size,
        name: name,
        localPath
      });
    }).catch((e: any) => {
      mainWindow.webContents.send(listenEvent, {
        oss: res,
        size: fs.lstatSync(arg.path).size,
        name: name,
        err: '文件转存失败',
        localPath
      });
    });
  }).catch((e: any) => {
    mainWindow.webContents.send(listenEvent, {
      oss: null,
      size: 0,
      name: name,
      err: '上传失败',
      localPath: ''
    });
  });
}

async function uploadChatPic(arg: any) {
  const listenEvent = arg.listenEvent;
  const userId = arg.userId;
  const client = new OSS({ // 在render进程不支持Stream
    endpoint: process.env.VUE_APP_OSSIP,
    accessKeyId: process.env.VUE_APP_OSSKEY,
    accessKeySecret: process.env.VUE_APP_OSSSECRET,
    bucket: process.env.VUE_APP_OSSBUKET
  });
  const fileType = path.extname(arg.path);
  let url = `chat33/chatList/picture/${Date.now()}_${userId}_${Math.floor(Math.random() * 10000)}.${fileType}`;
  client.put(url, arg.path).then((res: any) => {
    mainWindow.webContents.send(listenEvent, res.url);
  }).catch(() => {
    mainWindow.webContents.send(listenEvent, '');
  });
}

// 上传文件(文件消息)
ipcMain.on('upload-oss-file', (event: any, arg: any) => {
  uploadFile(arg);
});

ipcMain.on('upload-oss-video', (event: any, arg: any) => {
  uploadVideo(arg);
});

ipcMain.on('upload-oss-pic', (event: any, arg: any) => {
  uploadChatPic(arg);
});
/**
 * 加密密码算法
 * */
ipcMain.on('crypto-password', (event: any, arg: any) => {
  crypto.pbkdf2(String(arg.password), String(arg.password) + "pqb20180625@developmentgroup", 102400, 32, 'sha512', (err, result) => {
    mainWindow.webContents.send(arg.listenEvent, result);
  });
});

// 注册app事件========================================================

// quit application when all windows are closed
app.on('window-all-closed', () => {

  // app.quit();
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform === 'darwin') {
    app.quit();
  }
});

// 再次点击时显示app,只适用于mac
app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
  }
  // on macOS it is common to re-create a window even after all windows have been closed
  // if (mainWindow === null) {
  //   mainWindow = createMainWindow();
  // }
});

let tray = null

// create main BrowserWindow when electron is ready
app.on('ready', async () => {
  // if (isDevelopment && !process.env.IS_TEST) {
  //   // Install Vue Devtools
  //   await installVueDevtools();
  // }

  // dialog.showMessageBox({
  //   title: "系统托盘图标地址",
  //   message:path.join(__dirname, './tray.png')
  // })

  if (isDevelopment) {
    tray = new Tray(path.join(process.cwd(), '/public/tray.png'));
  } else {
    tray = new Tray(path.join(__dirname, './tray.png'));
  }

  tray.on('click', (event) => {
    mainWindow.show();
  })
  tray.setToolTip('chat33');
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出', accelerator: 'CmdOrCtrl+Q', click: function () {
        app.quit();
      }
    }
  ])

  tray.setContextMenu(contextMenu)

  mainWindow = createMainWindow();
});

app.on('before-quit', () => {
  mainWindow = null;
  tray = null;
  console.log('quit');
});

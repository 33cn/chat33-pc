import electron from 'electron';
import fs from 'fs';
import Https from 'https';
import Http from 'http';
import path from 'path';
import {FileFolderName} from '@/config/type';
import {openLocalFile} from '@/utils/tool';
import {setFileMap} from '@/utils/app/index';
import getUsefulFileName from '@/utils/app/getUsefulFileName';

interface DownloadFile2LocalParam {
  url: string;
  name: string;
  onStart?: (total: number) => void;
  onProcess?: (count: number) => void;
  autoOpen?: boolean; // 是否自动打开下载的文件
  onError?: (e: any) => void;
  onFinish?: (path: string) => void;
}


/**
 * 下载用户上传的文件
 */
export function downloadFile2Local(arg: DownloadFile2LocalParam) { // todo 移至app/index
  const userDir = (electron.app || electron.remote.app).getPath('userData');
  const fileDirPath = path.join(userDir, FileFolderName);
  if (!fs.existsSync(fileDirPath)) {
    fs.mkdirSync(fileDirPath);
  }
  const protocol = arg.url.indexOf('https://') === 0 ? Https : Http;
  protocol.get(arg.url, (res) => {
    if (res.statusCode !== 200) {
      if (arg.onError) {
        arg.onError(res.statusCode);
      }
    } else {
      if (arg.onStart) {
        arg.onStart(Number(res.headers['content-length']));
      }
      res.setEncoding('binary');
      let fileData = '';
      res.on('data', (chunk) => {
        fileData = fileData + chunk;
        if (arg.onProcess) {
          arg.onProcess(fileData.length);
        }
      });
      res.on('end', () => {
        const localName = getUsefulFileName(arg.name);
        const fullPath = path.join(fileDirPath, localName);
        fs.writeFile(fullPath, fileData, 'binary', (err) => {
          if (err) {
            if (arg.onError) {
              arg.onError(err);
            }
          } else {
            setFileMap(arg.url, fullPath);
            if (arg.onFinish) {
              arg.onFinish(fullPath);
            }
            if (arg.autoOpen) {
              openLocalFile(fullPath);
            }
          }
        });
      });
    }
  }).on('error', (e) => {
    if (arg.onError) {
      arg.onError(e);
    }
  });
}

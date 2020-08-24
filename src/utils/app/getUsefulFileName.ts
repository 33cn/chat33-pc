/**
 * 获取file文件下可用文件名（不重复)
 */
import {FileFolderName} from '../../config/type';
import electron from 'electron';
import path from 'path';
import fs from 'fs-extra';

function getUseful(dir: string, name: string): string {
  const filePath = path.join(dir, name); // name: name.txt
  if (fs.pathExistsSync(filePath)) { // 已存在该文件：尝试(n)+1
    const extName = path.extname(name); // .txt
    const baseName = path.basename(name, extName); // name(n)
    const LEFT = '(';
    const RIGHT = ')';
    const len = baseName.length;
    let fileIndex = 1;
    let natureName = baseName; // name
    if (baseName[len - 1] === RIGHT && baseName[len - 3] === LEFT) { // 已存在(n)
      fileIndex = Number(baseName[len - 2]) + 1;
      natureName = baseName.substring(0, len - 3);
    }
    return getUseful(dir, `${natureName}${LEFT}${fileIndex}${RIGHT}${extName}`);
  } else {
    return name;
  }
}

export default function(name: string) {
  const userDir = (electron.app || electron.remote.app).getPath('userData');
  const fileDirPath = path.join(userDir, FileFolderName);
  return getUseful(fileDirPath, name);
}

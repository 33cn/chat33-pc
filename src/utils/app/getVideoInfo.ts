import ffprobe from 'ffprobe';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';

export interface GetVideoInfoReturn {
  duration: number; // 秒
  width: number;
  height: number;
}

/**
 * 获取本地视频信息，用于主进程（渲染进程路径错误）, 暂支持'mp4', 'avi', 'mov', 'mpg'
 */
export default async function(localPath: string): Promise<GetVideoInfoReturn | null> {
  const sep = path.sep; // 分隔符
  // const staticDen = require.resolve('ffprobe-static') as string; // 依赖ffprobe-static的相对路径
  // const staticDir = staticDen.substring(staticDen.indexOf(sep), staticDen.lastIndexOf(sep)); // 去除./和/index.js
  const staticDir = `${sep}node_modules${sep}ffprobe-static`;
  let staticPath = '';
  if (process.env.NODE_ENV !== 'production') {
    staticPath = ffprobeStatic.path.replace(`${sep}dist_electron`, `${staticDir}`);
  } else {
    staticPath = ffprobeStatic.path.replace('app.asar', `app.asar.unpacked${staticDir}`);
  }
  try {
    const info = await ffprobe(localPath, {
      path: staticPath // 修复路径错误
    });
    const video = info.streams[0].codec_type === 'video' ? info.streams[0] : info.streams[1];
    return {
      duration: video.duration,
      width: video.width,
      height: video.height
    };
  } catch (e) {
    return null;
  }
}

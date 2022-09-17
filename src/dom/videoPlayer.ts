import { dom } from './elements';
import { settings } from '../settings';

const video: Record<string, HTMLElement> = {};

const loadCSS = () => {
  const style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = `
    .input { height: auto; object-fit: contain; object-position: left; cursor: progress; visibility: hidden; min-width: 100px; }
    .input-bar { object-fit: contain; object-position: left; cursor: progress; visibility: hidden; background-color: #666666; color: white; z-index: 99; padding: 4px; align-items: center; overflow: hidden; white-space: nowrap }
  `;
  document.getElementsByTagName('head')[0].appendChild(style);
};

const createMediaPlayer = () => {
  const html = `
    <video id="video" class="input" style="width: -webkit-fill-available"></video>
    <div id="media-bottom" class="input-bar" style="width: -webkit-fill-available; font-size: 1.6rem; letter-spacing: -2px; display: flex; cursor: pointer">
      <span style="min-width: 4px"></span>
      <i id="video-play" class="mdi mdi-pause-circle" title="play / pause"></i>
      <span style="min-width: 14px"> </span>
      <div id="video-status" style="font-size: 0.7rem; letter-spacing: normal; min-width: 60px; display: block">
        <div id="video-frame" title="current processed frame"></div>
        <div id="video-time" title="current video timestamp"></div>
        <div id="video-rate" title="current video playback rate"></div>
      </div>
    </div>
  `;
  dom.media.innerHTML = html;
  dom.media.style.left = `${settings.menu.width + 20}px`;
  dom.video = document.getElementById('video') as HTMLVideoElement;
  video.Play = document.getElementById('video-play') as HTMLLIElement;
  video.Bottom = document.getElementById('media-bottom') as HTMLDivElement;
  video.Status = document.getElementById('video-status') as HTMLDivElement;
  video.Frame = document.getElementById('video-frame') as HTMLSpanElement;
  video.Time = document.getElementById('video-time') as HTMLSpanElement;
  video.SeekControls = document.getElementById('video-seekable') as HTMLSpanElement;
};

const setPlayButton = (status: boolean) => {
  if (!status) {
    video.Play.classList.remove('mdi-play-circle');
    video.Play.classList.add('mdi-pause-circle');
  } else {
    video.Play.classList.add('mdi-play-circle');
    video.Play.classList.remove('mdi-pause-circle');
  }
};

export async function updateVideoBar() {
  // @ts-ignore
  video.Bottom.style.visibility = 'visible';
  const w = parseInt(dom.video.style.width.replace('px', ''));
  video.Status.style.visibility = (video.Bottom.style.visibility === 'visible') && (w >= 355) ? 'visible' : 'hidden';
  setPlayButton(dom.video.paused);
}

export async function initVideoPlayer() {
  await loadCSS();
  await createMediaPlayer();
  dom.video.autoplay = true;
  dom.video.muted = true;
  dom.video.disablePictureInPicture = true;
  dom.video.disableRemotePlayback = true;
  dom.video.loop = true;

  video.Play.onclick = () => {
    setPlayButton(!dom.video.paused);
    if (dom.video.paused) dom.video.play();
    else dom.video.pause();
  };
}

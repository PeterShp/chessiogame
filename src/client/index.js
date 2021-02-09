import { connect, play } from './networking';
import { startRendering, stopRendering, setPlaySide } from './render';
import { startCapturingInput, stopCapturingInput } from './input';
import { downloadAssets } from './assets';
import { setLeaderboardHidden } from './leaderboard';

import './css/bootstrap-reboot.css';
import './css/main.css';

const cam = require('./camera').default.object;

const playMenu = document.getElementById('play-menu');
const playButton = document.getElementById('play-button');
const usernameInput = document.getElementById('username-input');
const kingw = document.getElementById('king-w');
const kingb = document.getElementById('king-b');

Promise.all([
  connect(onGameOver),
  downloadAssets(),
]).then(() => {
  playMenu.classList.remove('hidden');
  usernameInput.focus();
  kingw.style.border = '1px solid black';
  playButton.style.border = '1px solid black';
  playButton.style.borderRadius = '12px';
  playMenu.style.border = '1px solid black';
  playMenu.style.borderRadius = '12px';
  kingw.onclick = () => {
    kingw.style.border = '1px solid black';
    kingb.style.border = '';
    setPlaySide(true);
  };
  kingb.onclick = () => {
    kingb.style.border = '1px solid black';
    kingw.style.border = '';
    setPlaySide(false);
  };
  playButton.onclick = () => {
    // Play!
    play(usernameInput.value);
    playMenu.classList.add('hidden');
    startCapturingInput();
    startRendering();
    setLeaderboardHidden(false);
    cam.setCameraCellDestination(-1, -1);
  };
}).catch(console.error);

function onGameOver() {
  stopCapturingInput();
  stopRendering();
  playMenu.classList.remove('hidden');
  setLeaderboardHidden(true);
}

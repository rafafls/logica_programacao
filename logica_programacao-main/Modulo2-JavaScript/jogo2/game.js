/* ================================
   game.js — Versão final ajustada
   Comentários em português
   ================================ */

/* === Elementos DOM e contexto === */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let W = canvas.width = canvas.clientWidth;
let H = canvas.height = canvas.clientHeight;

/* Sprites carregados via <img hidden> no HTML */
const playerImg = document.getElementById('playerSprite');
const obstacleImg = document.getElementById('obstacleSprite');

/* Elementos de UI */
const scoreEl = document.getElementById('score');
const bestEl  = document.getElementById('best');
const bestListEl = document.getElementById('bestList');
const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnRestart = document.getElementById('btnRestart');
const btnTryAgain = document.getElementById('btnTryAgain');
const gameOverScreen = document.getElementById('gameOver');

/* Touch buttons (mobile) */
const btnLeft = document.getElementById('btnLeft');
const btnRight = document.getElementById('btnRight');

/* === Estado do jogo === */
let running = false;
let paused  = false;
let lastTime = 0;
let spawnTimer = 0;
let score = 0;
let speed = 300;

/* Trilhos (lanes) normalizados */
const lanes = [0.2, 0.5, 0.8];
const laneX = i => Math.round(W * lanes[i]);

/* Tamanho do sprite do jogador NO CANVAS */
const PLAYER_DRAW_W = 110;
const PLAYER_DRAW_H = 110;

/* Jogador e hitbox reduzida para colisões justas */
const player = {
  lane: 1,
  x: laneX(1),
  y: H - 150,
  width: PLAYER_DRAW_W,
  height: PLAYER_DRAW_H,
  vy: 0,
  grounded: true,
  targetX: laneX(1),
  hitbox: {
    w: PLAYER_DRAW_W * 0.55,   // largura do hitbox (menor que sprite)
    h: PLAYER_DRAW_H * 0.65,   // altura do hitbox
    offsetY: 18                // deslocamento vertical do hitbox (ancorado ao pé)
  }
};

/* Arrays de entidades do jogo */
const obstacles = [];
const coins = [];   // moeda: {x,y,size,rot,state,t,anim}
const particles = [];

/* Parâmetros de spawn e física */
let spawnInterval = 0.9;
let gravity = 1800;

/* ----------------------
   Funções utilitárias
   ---------------------- */

/* Toca um beep simples (quando possível) */
function beep(freq = 600, time = 0.12) {
  try {
    const A = window.AudioContext || window.webkitAudioContext;
    const ctxA = new A();
    const o = ctxA.createOscillator();
    const g = ctxA.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    o.connect(g); g.connect(ctxA.destination);
    g.gain.setValueAtTime(0.0001, ctxA.currentTime);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.08, ctxA.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctxA.currentTime + time);
    o.stop(ctxA.currentTime + time + 0.02);
  } catch (e) { /* Áudio pode ser bloqueado */ }
}

function rand(a,b){ return Math.random() * (b - a) + a; }
function randInt(a,b){ return Math.floor(rand(a,b+1)); }

/* Ajusta canvas quando a tela muda (responsivo) */
function resize(){
  W = canvas.width = canvas.clientWidth;
  H = canvas.height = canvas.clientHeight;
  player.y = H - 150;
  player.targetX = laneX(player.lane);
}
window.addEventListener('resize', resize);

/* ----------------------
   Spawn — obstáculos e moedas
   ---------------------- */
function spawnObstacle(){
  const l = randInt(0,2);
  const size = 84;
  obstacles.push({ x: laneX(l), y: -size - 10, lane: l, w: size, h: size });
}

function spawnCoinPattern(){
  const count = randInt(1,4);
  const baseLane = randInt(0,2);
  for(let i=0;i<count;i++){
    const lane = Math.min(2, Math.max(0, baseLane + (i - Math.floor(count/2))));
    coins.push({ x: laneX(lane), y: -40 - i*30, lane, size: 18, rot: 0, state: 'idle', t:0, anim:0 });
  }
}

/* Partículas simples (coleta / colisão) */
function spawnParticles(x,y,color='#ffd24d',count=12){
  for(let i=0;i<count;i++){
    particles.push({
      x, y,
      vx: rand(-220,220),
      vy: rand(-420,-80),
      life: rand(0.5,0.9),
      t: 0,
      size: rand(2,5),
      color
    });
  }
}

/* Colisão retângulo por centro (AABB) */
function collideRect(aCx,aCy,aW,aH,bCx,bCy,bW,bH){
  return Math.abs(aCx - bCx) < (aW/2 + bW/2) && Math.abs(aCy - bCy) < (aH/2 + bH/2);
}

/* ----------------------
   Input — teclado e touch
   ---------------------- */

/* Teclas: setas apenas (removido o uso da tecla Espaço) */
window.addEventListener('keydown', (e) => {
  if(e.code === 'ArrowLeft') move(-1);
  if(e.code === 'ArrowRight') move(1);
  if(e.code === 'KeyP') paused = !paused;
});

/* Clique simples no canvas avança uma lane (útil em desktop) */
canvas.addEventListener('click', () => move(1));

/* Swipe para pular (mobile) */
let touchStart = null;
canvas.addEventListener('touchstart', (ev) => {
  const t = ev.touches[0];
  touchStart = { x: t.clientX, y: t.clientY, time: Date.now() };
}, { passive:true });

canvas.addEventListener('touchend', (ev) => {
  if(!touchStart) return;
  const t = ev.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  touchStart = null;
  if(Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)){
    if(dx > 0) move(1); else move(-1);
  } else if(dy < -40){
    jump(); // swipe para cima = pular
  } else {
    move(1); // toque curto = avançar uma lane
  }
}, { passive:true });

/* Botões visíveis no mobile */
if(btnLeft && btnRight){
  btnLeft.addEventListener('touchstart', (e)=>{ e.preventDefault(); move(-1); }, {passive:false});
  btnRight.addEventListener('touchstart', (e)=>{ e.preventDefault(); move(1); }, {passive:false});
  // também responder a clique mouse
  btnLeft.addEventListener('click', ()=>move(-1));
  btnRight.addEventListener('click', ()=>move(1));
}

/* Move e jump (pulo) */
function move(d){
  if(!running) return;
  player.lane = Math.min(2, Math.max(0, player.lane + d));
  player.targetX = laneX(player.lane);
}
function jump(){
  if(!running) return;
  if(player.grounded){
    player.vy = -700;
    player.grounded = false;
    beep(880);
  }
}

/* ----------------------
   Botões UI (painel)
   ---------------------- */
btnStart.onclick = () => { if(!running) startGame(); paused = false; };
btnPause.onclick = () => { paused = !paused; btnPause.textContent = paused ? 'Retomar' : 'Pausar'; };
btnRestart.onclick = () => startGame(true);
btnTryAgain.onclick = () => { gameOverScreen.classList.remove('show'); startGame(true); };

/* ----------------------
   Melhores pontuações (Top 5)
   - Armazenadas em localStorage chave 'naruto_bestScores'
   ---------------------- */
function loadBestScores(){
  try {
    const raw = localStorage.getItem('naruto_bestScores');
    if(!raw) return [];
    const arr = JSON.parse(raw);
    if(!Array.isArray(arr)) return [];
    return arr.slice(0,5);
  } catch(e){
    return [];
  }
}

function saveBestScores(arr){
  const top = arr.slice(0,5);
  localStorage.setItem('naruto_bestScores', JSON.stringify(top));
}

/* Atualiza a lista visível no painel */
function updateBestListUI(){
  const arr = loadBestScores();
  bestListEl.innerHTML = '';
  arr.forEach((v,i)=>{
    const li = document.createElement('li');
    li.textContent = `${i+1}. ${v}`;
    bestListEl.appendChild(li);
  });
  bestEl.textContent = arr.length ? arr[0] : '0';
}

/* Insere uma nova pontuação na lista Top */
function pushScoreToBest(value){
  const arr = loadBestScores();
  arr.push(value);
  arr.sort((a,b)=>b-a);
  saveBestScores(arr);
  updateBestListUI();
}

/* ----------------------
   Controle do jogo (start/reset)
   ---------------------- */
function resetWorld(fullReset=false){
  obstacles.length = 0;
  coins.length = 0;
  particles.length = 0;
  score = 0;
  spawnTimer = 0;
  player.lane = 1;
  player.x = laneX(1);
  player.targetX = player.x;
  player.vy = 0;
  player.grounded = true;
}

function startGame(resetAll=false){
  resetWorld(resetAll);
  running = true;
  paused = false;
  lastTime = performance.now();
  loop(lastTime);
}

/* ----------------------
   Loop principal
   ---------------------- */
function loop(t){
  if(!running) return;
  const dt = Math.min(0.033, (t - lastTime) / 1000);
  lastTime = t;
  if(!paused) update(dt);
  render();
  requestAnimationFrame(loop);
}

/* ----------------------
   Atualização da lógica
   ---------------------- */
function update(dt){
  spawnTimer += dt;
  if(spawnTimer > spawnInterval){
    spawnTimer = 0;
    if(Math.random() < 0.65) spawnObstacle();
    if(Math.random() < 0.9) spawnCoinPattern();
  }

  const dy = speed * dt;
  for(let i = obstacles.length -1; i >= 0; i--){
    obstacles[i].y += dy;
    if(obstacles[i].y > H + 120) obstacles.splice(i,1);
  }

  for(let i = coins.length -1; i >= 0; i--){
    const c = coins[i];
    if(c.state === 'idle') c.y += dy;
    else if(c.state === 'collected'){
      c.t += dt;
      c.anim = c.t / 0.35;
    }
    if(c.y > H + 120 && c.state === 'idle') coins.splice(i,1);
    if(c.state === 'collected' && c.t > 0.36) coins.splice(i,1);
  }

  for(let i = particles.length -1; i >= 0; i--){
    const p = particles[i];
    p.t += dt;
    p.vy += 1200 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if(p.t > p.life) particles.splice(i,1);
  }

  // física do jogador
  player.vy += gravity * dt;
  player.y += player.vy * dt;
  if(player.y >= H - 150){
    player.y = H - 150;
    player.vy = 0;
    player.grounded = true;
  }

  // interpolação suave entre trilhos
  player.x += (player.targetX - player.x) * Math.min(1, 0.25 * 60 * dt);

  // hitbox do jogador (centro)
  const phx = player.x;
  const phy = player.y - player.hitbox.offsetY - (player.hitbox.h / 2);
  const phw = player.hitbox.w;
  const phh = player.hitbox.h;

  // colisões com obstáculos
  for(let i = obstacles.length -1; i >= 0; i--){
    const o = obstacles[i];
    const ohx = o.x;
    const ohy = o.y;
    const ohw = o.w;
    const ohh = o.h;
    if(collideRect(phx, phy, phw, phh, ohx, ohy, ohw, ohh)){
      // partículas de dano + som
      spawnParticles(player.x, player.y - 40, '#ff4655', 28);
      beep(120, 0.25);
      // atualizar melhores e mostrar Game Over
      const best = Math.max(score, Number(localStorage.getItem('naruto_bestScores') ? (JSON.parse(localStorage.getItem('naruto_bestScores'))[0]||0) : 0));
      // push na lista de top
      pushScoreToBest(score);
      gameOver();
      return;
    }
  }

  // coleta de moedas
  for(let i = coins.length -1; i >= 0; i--){
    const c = coins[i];
    if(c.state === 'idle'){
      const cx = c.x;
      const cy = c.y;
      const cw = c.size * 2;
      const ch = c.size * 2;
      if(collideRect(phx, phy, phw, phh, cx, cy, cw, ch)){
        c.state = 'collected';
        c.t = 0; c.anim = 0;
        score += 10;
        spawnParticles(c.x, c.y, '#ffd24d', 14);
        beep(1200, 0.08);
      }
    }
  }

  // crescimento de score ao longo do tempo
  score += Math.floor(Math.max(0, speed / 200 * dt * 10));
  scoreEl.textContent = score;
  // atualiza melhor temporário (painel)
  const currentBest = (loadBestScores()[0]) || 0;
  bestEl.textContent = Math.max(score, currentBest);
}

/* ----------------------
   Game Over
   ---------------------- */
function gameOver(){
  running = false;
  // atualiza UI do top 5 já feita por pushScoreToBest()
  updateBestListUI();
  // mostra modal de Game Over com pontuação final
  const finalScoreEl = document.getElementById('finalScore');
  if(finalScoreEl) finalScoreEl.textContent = `Sua pontuação: ${score}`;
  setTimeout(()=>gameOverScreen.classList.add('show'), 220);
}

/* ----------------------
   Render (desenha tudo)
   ---------------------- */
function render(){
  ctx.clearRect(0,0,W,H);

  // fundo gradiente
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, '#0b1220'); g.addColorStop(1, '#061021');
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

  // chão/track
  const trackH = 240;
  const trackY = H - trackH;
  ctx.fillStyle = '#071926';
  ctx.fillRect(0, trackY, W, trackH);

  // indicadores de trilho
  for(let i=0;i<3;i++){
    const x = laneX(i);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(x - 4, trackY, 8, trackH);
  }

  // moedas
  for(const c of coins){
    ctx.save();
    ctx.translate(c.x, c.y);
    if(c.state === 'idle'){
      c.rot += 0.12;
      ctx.rotate(c.rot);
      const scale = 1 + 0.06 * Math.sin(c.rot * 2);
      ctx.scale(scale, 1);
      ctx.fillStyle = '#ffd24d';
      ctx.beginPath(); ctx.arc(0,0,c.size,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.ellipse(-c.size*0.18,-c.size*0.18,c.size*0.42,c.size*0.26,0,0,Math.PI*2); ctx.fill();
    } else if(c.state === 'collected'){
      const t = Math.min(1, c.anim);
      const scale = 1 + t * 1.2;
      const alpha = 1 - t;
      ctx.globalAlpha = alpha;
      ctx.scale(scale, scale);
      ctx.fillStyle = '#ffd24d';
      ctx.beginPath(); ctx.arc(0,0,c.size,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // obstáculos (sprite)
  for(const o of obstacles){
    ctx.drawImage(obstacleImg, o.x - o.w/2, o.y - o.h/2, o.w, o.h);
  }

  // sombra do jogador
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 40, 40, 12, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();

  // personagem (sprite) — alinhado para "checar" com hitbox reduzida
  ctx.drawImage(playerImg, player.x - PLAYER_DRAW_W/2, player.y - PLAYER_DRAW_H, PLAYER_DRAW_W, PLAYER_DRAW_H);

  // partículas
  for(const p of particles){
    const alpha = Math.max(0, 1 - p.t / p.life);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // HUD simples in-canvas (opcional)
  ctx.fillStyle = '#fff';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Pontos: ${score}`, 20, 30);
}

/* ----------------------
   Inicialização
   ---------------------- */
updateBestListUI();
resize();

// esboço visual inicial (sem loop até Iniciar)
(function idleScreen(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#071226';
  ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#d7e6ff';
  ctx.font = '22px Inter, Arial';
  ctx.fillText('Clique em Iniciar para jogar', 36, 80);
})();
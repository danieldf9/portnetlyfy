// ── MOBILE DETECTION ───────────────────────────────────────────
const isMobile = () => window.innerWidth <= 768;

// ── BOOT SEQUENCE ──────────────────────────────────────────────
(function boot() {
  const pct = document.getElementById('boot-pct');
  let p = 0;
  const iv = setInterval(() => {
    p += Math.floor(Math.random() * 8) + 3;
    if (p >= 100) { p = 100; clearInterval(iv); showSplash(); }
    if (pct) pct.textContent = p;
  }, 120);
})();

function showSplash() {
  setTimeout(() => {
    const boot = document.getElementById('boot-screen');
    const splash = document.getElementById('splash');
    if (boot) boot.style.display = 'none';
    if (splash) { splash.style.display = 'flex'; }
  }, 600);
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('explore-btn');
  if (btn) btn.addEventListener('click', enterDesktop);
  document.getElementById('terminal-input').addEventListener('keydown', handleTerminalInput);
  document.getElementById('clippy-next').addEventListener('click', nextClippyTip);
  startClock();
  setTimeout(() => drawRadar(), 800);
});

function enterDesktop() {
  document.getElementById('splash').style.display = 'none';
  document.getElementById('status-bar').style.display = 'flex';
  document.getElementById('desktop').style.display = 'block';
  document.getElementById('taskbar').style.display = 'flex';
  // auto-open terminal on load
  setTimeout(() => openWindow('terminal-window', 'icon-terminal'), 200);
  // show clippy after delay
  setTimeout(() => document.getElementById('clippy').classList.add('visible'), 4000);
}

// ── CLOCK ───────────────────────────────────────────────────────
function startClock() {
  function tick() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const el = document.getElementById('clock');
    if (el) el.textContent = h + ':' + m;
  }
  tick();
  setInterval(tick, 10000);
}

// ── WINDOW MANAGEMENT ───────────────────────────────────────────
let zTop = 200;

function openWindow(winId, iconId) {
  const win = document.getElementById(winId);
  if (!win) return;
  win.classList.add('visible', 'focused');
  win.style.zIndex = ++zTop;
  removeFocusAll(winId);
  if (iconId) document.getElementById(iconId)?.classList.add('active');
  addTaskbarBtn(winId, iconId);
  if (winId === 'radar-window') setTimeout(drawRadar, 100);
}

function closeWindow(winId, iconId) {
  const win = document.getElementById(winId);
  if (!win) return;
  win.classList.remove('visible', 'focused');
  if (iconId) document.getElementById(iconId)?.classList.remove('active');
  removeTaskbarBtn(winId);
}

function focusWindow(winId) {
  removeFocusAll(winId);
  const win = document.getElementById(winId);
  if (win) { win.classList.add('focused'); win.style.zIndex = ++zTop; }
}

function removeFocusAll(exceptId) {
  document.querySelectorAll('.window').forEach(w => {
    if (w.id !== exceptId) w.classList.remove('focused');
  });
}

// ── TASKBAR ─────────────────────────────────────────────────────
const taskbarMap = {};
function addTaskbarBtn(winId, iconId) {
  if (taskbarMap[winId]) return;
  const container = document.getElementById('taskbar-windows');
  const btn = document.createElement('button');
  btn.className = 'taskbar-btn active';
  btn.id = 'tb-' + winId;
  const labels = {
    'terminal-window': ['>_', 'Terminal'],
    'about-window': ['👤', 'About'],
    'skills-window': ['⚙', 'Skills'],
    'logs-window': ['📋', 'Logs'],
    'projects-window': ['📁', 'Projects'],
    'project-detail-window': ['📄', 'Detail'],
    'awards-window': ['🏆', 'Awards'],
    'timeline-window': ['📅', 'Timeline'],
    'files-window': ['📂', 'Files'],
    'radar-window': ['📊', 'Radar'],
    'resume-window': ['📄', 'Resume'],
  };
  const [icon, label] = labels[winId] || ['🗔', winId];
  btn.innerHTML = icon + '<span>' + label + '</span>';
  btn.onclick = () => {
    const win = document.getElementById(winId);
    if (win && win.classList.contains('visible')) {
      closeWindow(winId, iconId);
    } else {
      openWindow(winId, iconId);
    }
  };
  container.appendChild(btn);
  taskbarMap[winId] = btn;
}

function removeTaskbarBtn(winId) {
  const btn = taskbarMap[winId];
  if (btn) { btn.remove(); delete taskbarMap[winId]; }
}

// ── DRAG ────────────────────────────────────────────────────────
let dragState = null;

function startDrag(e, winId) {
  if (isMobile()) return;
  const win = document.getElementById(winId);
  focusWindow(winId);
  const rect = win.getBoundingClientRect();
  dragState = { winId, ox: e.clientX - rect.left, oy: e.clientY - rect.top };
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
}

function onDrag(e) {
  if (!dragState) return;
  const win = document.getElementById(dragState.winId);
  if (!win) return;
  let x = e.clientX - dragState.ox;
  let y = e.clientY - dragState.oy;
  const maxX = window.innerWidth - win.offsetWidth;
  const maxY = window.innerHeight - win.offsetHeight;
  x = Math.max(0, Math.min(x, maxX));
  y = Math.max(24, Math.min(y, maxY - 40));
  win.style.left = x + 'px';
  win.style.top = y + 'px';
}

function stopDrag() {
  dragState = null;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
}

// ── TERMINAL ────────────────────────────────────────────────────
const termHistory = [];
let histIdx = -1;

const COMMANDS = {
  help: () => `<span class="yellow">Available commands:</span><br>
about &nbsp;&nbsp;&nbsp;&nbsp;- Open About window<br>
skills &nbsp;&nbsp;&nbsp;- Open Skills window<br>
experience - Open Experience log<br>
projects &nbsp;- Open Projects window<br>
awards &nbsp;&nbsp;&nbsp;- Open Awards window<br>
timeline &nbsp;- Open Career Timeline<br>
resume &nbsp;&nbsp;&nbsp;- Open Resume viewer<br>
radar &nbsp;&nbsp;&nbsp;&nbsp;- Open Skill Radar<br>
files &nbsp;&nbsp;&nbsp;&nbsp;- Open File Explorer<br>
whoami &nbsp;&nbsp;&nbsp;- Display user info<br>
clear &nbsp;&nbsp;&nbsp;&nbsp;- Clear terminal<br>
contact &nbsp;&nbsp;- Show contact details`,

  whoami: () => `<span class="green">daniel</span> — Automation Test Engineer<br>
Location: Bengaluru, Karnataka<br>
Company: OneOrigin (Oct 2023 - Present)<br>
Skills: Playwright, Cypress, Selenium, Python, AWS`,

  contact: () => `<span class="yellow">Contact Info:</span><br>
Email: fernanesdaniel.df9@gmail.com<br>
Phone: 9740937182<br>
LinkedIn: linkedin.com/in/daniel-fernandes-1808b51b1/`,

  about:      () => { openWindow('about-window','icon-about'); return '<span class="green">Opening ABOUT_ME.info...</span>'; },
  skills:     () => { openWindow('skills-window','icon-skills'); return '<span class="green">Opening TECH_STACK.cfg...</span>'; },
  experience: () => { openWindow('logs-window','icon-logs'); return '<span class="green">Opening SYSTEM_LOGS.txt...</span>'; },
  projects:   () => { openWindow('projects-window','icon-projects'); return '<span class="green">Opening PROJECTS/...</span>'; },
  awards:     () => { openWindow('awards-window','icon-awards'); return '<span class="green">Opening ACHIEVEMENTS.exe...</span>'; },
  timeline:   () => { openWindow('timeline-window','icon-timeline'); return '<span class="green">Opening CAREER_TIMELINE.exe...</span>'; },
  resume:     () => { openWindow('resume-window','icon-resume'); return '<span class="green">Opening RESUME.pdf...</span>'; },
  radar:      () => { openWindow('radar-window','icon-radar'); return '<span class="green">Opening SKILL_RADAR.dat...</span>'; },
  files:      () => { openWindow('files-window','icon-files'); return '<span class="green">Opening D:\\PORTFOLIO_ARCHIVE...</span>'; },
  clear:      () => '__clear__',
};

function handleTerminalInput(e) {
  const input = document.getElementById('terminal-input');
  if (e.key === 'ArrowUp') {
    if (histIdx < termHistory.length - 1) histIdx++;
    input.value = termHistory[termHistory.length - 1 - histIdx] || '';
    return;
  }
  if (e.key === 'ArrowDown') {
    if (histIdx > 0) histIdx--;
    input.value = termHistory[termHistory.length - 1 - histIdx] || '';
    return;
  }
  if (e.key !== 'Enter') return;
  const cmd = input.value.trim().toLowerCase();
  input.value = '';
  histIdx = -1;
  if (!cmd) return;
  termHistory.push(cmd);
  appendTermLine(`<span class="prompt">root@daniel:~$</span> ${escHtml(cmd)}`);
  const fn = COMMANDS[cmd];
  if (fn) {
    const out = fn();
    if (out === '__clear__') {
      document.querySelector('.terminal-output').innerHTML = '';
    } else {
      appendTermLine(out);
    }
  } else {
    appendTermLine(`<span style="color:#ff6b6b">Command not found: ${escHtml(cmd)}. Type 'help' for commands.</span>`);
  }
}

function appendTermLine(html) {
  const out = document.querySelector('.terminal-output');
  if (!out) return;
  const div = document.createElement('div');
  div.innerHTML = html;
  out.appendChild(div);
  const content = document.getElementById('terminal-content');
  if (content) content.scrollTop = content.scrollHeight;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── PROJECTS ────────────────────────────────────────────────────
const PROJECTS = {
  playwright: {
    title: 'Playwright Web Automation Framework',
    meta: 'Stack: Playwright · JavaScript · BDD Cucumber | Company: OneOrigin',
    bullets: [
      'Built end-to-end test automation framework using Playwright with JavaScript',
      'Implemented Page Object Model (POM) design pattern for maintainability',
      'Integrated BDD Cucumber for business-readable test scenarios',
      'Achieved 65% increase in testing efficiency vs manual approach',
      'Reduced testing cycle time by 20% through parallel test execution',
      'CI/CD pipeline integration for automated regression runs',
    ]
  },
  cypress: {
    title: 'Cypress Data Validation Suite',
    meta: 'Stack: Cypress · JavaScript · SQL | Company: Cognizant',
    bullets: [
      'Developed automated data validation suite using Cypress',
      'Reduced audit team involvement by 60% through automated checks',
      'Validated data integrity across multiple database tables',
      'Created reusable custom commands for common validation patterns',
      'Integrated with JIRA for automatic defect logging',
    ]
  },
  chatbot: {
    title: 'Chatbot QA — Cigna Healthcare',
    meta: 'Stack: Manual + Automated Testing · Cigna | Company: Cognizant',
    bullets: [
      'Led QA for Cigna Healthcare data intake automation chatbot',
      'Reduced data intake processing time by 50%',
      'Designed test cases covering 200+ conversation flows',
      'Performed NLP response validation and edge case testing',
      'Collaborated with ML team to improve chatbot accuracy',
    ]
  },
  python: {
    title: 'Python Test Automation Solution',
    meta: 'Stack: Python · PyCharm · Selenium | Company: Cognizant',
    bullets: [
      'Built Python-based automation solution from scratch',
      'Reduced testing cycle time by 75% vs previous manual process',
      'Automated 150+ regression test cases',
      'Integrated with existing CI/CD pipeline',
      'Mentored 3 junior engineers on Python automation best practices',
    ]
  },
  jmeter: {
    title: 'JMeter Performance Testing Suite',
    meta: 'Stack: JMeter · AWS · Performance Testing | Company: OneOrigin',
    bullets: [
      'Designed and executed performance test plans for 3 key applications',
      'Improved system stability by 40% through bottleneck identification',
      'Conducted load, stress, and spike testing scenarios',
      'Tested AWS-hosted applications under simulated peak traffic',
      'Delivered detailed performance reports with optimization recommendations',
    ]
  },
  salesportal: {
    title: 'MyCigna Sales Demo Portal',
    meta: 'Stack: HPE Service Virtualization · SoapUI | Company: Cognizant',
    bullets: [
      'Set up MyCigna sales demo portal using HPE Service Virtualization',
      'Enabled testing of dependent services without live backend',
      'Created virtual services for 10+ API endpoints',
      'Reduced environment dependency issues by 80%',
      'Supported sales team demos with stable, reliable test environment',
    ]
  }
};

function showProject(key) {
  const p = PROJECTS[key];
  if (!p) return;
  document.getElementById('proj-detail-title').textContent = p.title;
  const body = document.getElementById('proj-detail-body');
  body.innerHTML = `
    <div class="detail-title">${p.title}</div>
    <div class="detail-meta">${p.meta}</div>
    <div class="detail-body">
      ${p.bullets.map(b => `<div class="detail-bullet">${b}</div>`).join('')}
    </div>`;
  openWindow('project-detail-window', '');
}

// ── RADAR CHART ─────────────────────────────────────────────────
function drawRadar() {
  const canvas = document.getElementById('radar-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 30;

  const skills = [
    { label: 'Playwright', val: 0.92 },
    { label: 'Cypress',    val: 0.88 },
    { label: 'Selenium',   val: 0.90 },
    { label: 'Python',     val: 0.80 },
    { label: 'JMeter',     val: 0.82 },
    { label: 'AWS',        val: 0.72 },
    { label: 'SQL',        val: 0.78 },
    { label: 'JavaScript', val: 0.75 },
  ];
  const n = skills.length;
  const accent = '#00ff41';
  const muted = 'rgba(0,255,65,0.15)';
  const border = 'rgba(100,100,255,0.5)';

  ctx.clearRect(0, 0, W, H);

  // grid rings
  for (let r = 1; r <= 4; r++) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i / n) - Math.PI / 2;
      const x = cx + (R * r / 4) * Math.cos(angle);
      const y = cy + (R * r / 4) * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // spokes
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + R * Math.cos(angle), cy + R * Math.sin(angle));
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // filled polygon
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    const x = cx + R * skills[i].val * Math.cos(angle);
    const y = cy + R * skills[i].val * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = muted;
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  // dots
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    const x = cx + R * skills[i].val * Math.cos(angle);
    const y = cy + R * skills[i].val * Math.sin(angle);
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = accent;
    ctx.fill();
  }

  // labels
  ctx.fillStyle = '#e0e0e0';
  ctx.font = '10px Courier New';
  ctx.textAlign = 'center';
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i / n) - Math.PI / 2;
    const lx = cx + (R + 18) * Math.cos(angle);
    const ly = cy + (R + 18) * Math.sin(angle);
    ctx.fillText(skills[i].label, lx, ly + 4);
  }
}

// ── CLIPPY ──────────────────────────────────────────────────────
const CLIPPY_TIPS = [
  "It looks like you're hiring a QA engineer! May I suggest Daniel?",
  "Daniel has 4+ years of automation experience. Impressive!",
  "Tip: Open the Terminal and type 'help' for commands.",
  "Daniel reduced testing cycle time by 75% at Cognizant!",
  "AWS Certified + Google Cloud badges. Cloud-ready QA!",
  "Try opening the Radar chart to see skill proficiency.",
  "Daniel mentored junior engineers and boosted team productivity by 25%.",
  "Open to opportunities in Bengaluru and beyond!",
];
let clippyIdx = 0;

function nextClippyTip() {
  clippyIdx = (clippyIdx + 1) % CLIPPY_TIPS.length;
  document.getElementById('clippy-text').textContent = CLIPPY_TIPS[clippyIdx];
}

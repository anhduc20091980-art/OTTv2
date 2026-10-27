const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const port = Number(process.env.PORT || 6767);
const bindAddress = process.env.HOST || '0.0.0.0';
const publicDirectory = __dirname;
const dataDirectory = path.join(__dirname, 'data');
const usersFile = path.join(dataDirectory, 'users.json');
const logsFile = path.join(dataDirectory, 'gamelog.json');
const boardRoomsFile = path.join(dataDirectory, 'boardrooms.json');
fs.mkdirSync(dataDirectory, { recursive: true });

const sessions = new Map();
const contentTypes = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
};

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, value) {
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), { mode: 0o600 });
  fs.renameSync(temp, file);
}
function sendJson(res, status, body, extraHeaders = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extraHeaders });
  res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 16_384) { reject(new Error('Request body quá lớn.')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('Dữ liệu JSON không hợp lệ.')); }
    });
    req.on('error', reject);
  });
}
function cookieValue(req, name) {
  const cookie = req.headers.cookie || '';
  const match = cookie.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}
function currentUser(req) {
  const token = cookieValue(req, 'ottv2_session');
  const username = token && sessions.get(token);
  if (!username) return null;
  const user = readJson(usersFile, {})[username];
  return user ? { username: user.username } : null;
}
function validUsername(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{3,24}$/.test(value);
}
function passwordHash(password, salt = crypto.randomBytes(16).toString('hex')) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (err, key) => {
    if (err) reject(err); else resolve({ salt, hash: key.toString('hex') });
  }));
}
async function verifyPassword(password, user) {
  const result = await passwordHash(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(result.hash, 'hex'), Buffer.from(user.hash, 'hex'));
}
function setSession(res, username) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, username);
  res.setHeader('set-cookie', `ottv2_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`);
}
function resolveFilePath(pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  if (decoded === '/data' || decoded.startsWith('/data/')) return null;
  const requested = decoded === '/' ? '/index.html' : decoded;
  const filePath = path.resolve(publicDirectory, `.${requested}`);
  return filePath === publicDirectory || filePath.startsWith(`${publicDirectory}${path.sep}`) ? filePath : null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname === '/api/board-room') {
      const rooms = readJson(boardRoomsFile, {});
      if (req.method === 'GET') {
        const code = String(url.searchParams.get('room') || '').toUpperCase();
        if (!/^[A-Z0-9-]{3,12}$/.test(code)) return sendJson(res, 400, { error: 'Mã phòng không hợp lệ.' });
        return rooms[code] ? sendJson(res, 200, { game: rooms[code] }) : sendJson(res, 404, { error: 'Không tìm thấy phòng.' });
      }
      if (req.method === 'POST') {
        const input = await readBody(req);
        const code = String(input.room || '').toUpperCase();
        if (!/^[A-Z0-9-]{3,12}$/.test(code) || !['chess','xiangqi','go'].includes(input.kind)) return sendJson(res, 400, { error: 'Mã phòng hoặc trò chơi không hợp lệ.' });
        const safe = { room: code, kind: input.kind, fen: typeof input.fen === 'string' ? input.fen.slice(0, 200) : null, state: input.state && typeof input.state === 'object' ? input.state : null, turn: input.turn === 'b' ? 'b' : 'w', history: Array.isArray(input.history) ? input.history.slice(-300).map(x => String(x).slice(0,120)) : [], ended: !!input.ended, updated: Date.now() };
        rooms[code] = safe;
        const keys = Object.keys(rooms); if (keys.length > 500) for (const old of keys.slice(0, keys.length-500)) delete rooms[old];
        writeJson(boardRoomsFile, rooms);
        return sendJson(res, 200, { ok: true, room: code, updated: safe.updated });
      }
      return sendJson(res, 405, { error: 'Phương thức không được hỗ trợ.' }, { allow: 'GET, POST' });
    }
    if (url.pathname.startsWith('/api/')) {
      if (req.method === 'GET' && url.pathname === '/api/me') {
        return sendJson(res, 200, { user: currentUser(req) });
      }
      if (req.method === 'POST' && (url.pathname === '/api/register' || url.pathname === '/api/login')) {
        const { username, password } = await readBody(req);
        if (!validUsername(username)) return sendJson(res, 400, { error: 'Tên tài khoản cần 3–24 ký tự: chữ, số, _ hoặc -.' });
        if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
          return sendJson(res, 400, { error: 'Mật khẩu phải dài từ 8 đến 128 ký tự.' });
        }
        const users = readJson(usersFile, {});
        if (url.pathname === '/api/register') {
          if (users[username]) return sendJson(res, 409, { error: 'Tên tài khoản đã tồn tại.' });
          const credentials = await passwordHash(password);
          users[username] = { username, ...credentials, createdAt: Date.now() };
          writeJson(usersFile, users);
        } else {
          const user = users[username];
          if (!user || !(await verifyPassword(password, user))) return sendJson(res, 401, { error: 'Sai tên tài khoản hoặc mật khẩu.' });
        }
        setSession(res, username);
        return sendJson(res, 200, { user: { username } });
      }
      if (req.method === 'POST' && url.pathname === '/api/logout') {
        const token = cookieValue(req, 'ottv2_session');
        if (token) sessions.delete(token);
        return sendJson(res, 200, { ok: true }, { 'set-cookie': 'ottv2_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
      }
      if (req.method === 'GET' && url.pathname === '/api/gamelog') {
        const user = currentUser(req);
        if (!user) return sendJson(res, 401, { error: 'Hãy đăng nhập để xem Game Log.' });
        const logs = readJson(logsFile, []);
        return sendJson(res, 200, { logs: logs.filter(log => log.username === user.username).sort((a,b) => b.finishedAt - a.finishedAt).slice(0, 200) });
      }
      if (req.method === 'POST' && url.pathname === '/api/gamelog') {
        const user = currentUser(req);
        if (!user) return sendJson(res, 401, { error: 'Hãy đăng nhập để lưu Game Log.' });
        const input = await readBody(req);
        if (typeof input.eventId !== 'string' || typeof input.tableId !== 'string' || typeof input.result !== 'string') {
          return sendJson(res, 400, { error: 'Thiếu thông tin trận đấu.' });
        }
        const logs = readJson(logsFile, []);
        const exists = logs.some(log => log.username === user.username && log.eventId === input.eventId);
        if (!exists) {
          logs.push({
            username: user.username, eventId: input.eventId,
            tableId: String(input.tableId).slice(0, 32),
            round: Number(input.round) || 0,
            result: String(input.result).slice(0, 24),
            opponent: String(input.opponent || 'Không rõ').slice(0, 64),
            winner: String(input.winner || 'Không rõ').slice(0, 64),
            winKind: String(input.winKind || 'unknown').slice(0, 24),
            finishedAt: Number(input.finishedAt) || Date.now(),
          });
          writeJson(logsFile, logs.slice(-10000));
        }
        return sendJson(res, 200, { ok: true });
      }
      return sendJson(res, 405, { error: 'Phương thức hoặc API không được hỗ trợ.' }, { allow: 'GET, POST' });
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { allow: 'GET, HEAD' }); return res.end();
    }
    const filePath = resolveFilePath(url.pathname);
    if (!filePath) { res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Forbidden'); }
    fs.readFile(filePath, (error, content) => {
      if (error) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Not found'); }
      res.writeHead(200, { 'content-type': contentTypes[path.extname(filePath)] || 'application/octet-stream', 'cache-control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : content);
    });
  } catch (error) {
    if (!res.headersSent) sendJson(res, 500, { error: error.message || 'Lỗi máy chủ.' });
    else res.end();
  }
});

function localAddresses() {
  return Object.values(os.networkInterfaces()).flat().filter(entry => entry && entry.family === 'IPv4' && !entry.internal).map(entry => entry.address);
}
server.listen(port, bindAddress, () => {
  console.log(`OTTv2 board hall on http://localhost:${port}`);
  console.log(`Account data and Game Log are stored locally in: ${dataDirectory}`);
  for (const address of localAddresses()) console.log(`               and http://${address}:${port}`);
});

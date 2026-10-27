OTTv2 Board Games Update
========================

Files added/updated:
- board-games.html / board-games.js: cờ vua, cờ tướng, cờ vây, Bot local, local two-player, room-code synchronization prototype.
- styles.css: board layouts responsive.
- server.js: /api/board-room GET/POST endpoint storing room state in data/boardrooms.json.
- index.html: entry link to new game hall.

Run: npm.cmd start; open http://localhost:6767/board-games.html

IMPORTANT LIMITATIONS
- Chess rules use chess.js 0.10.3 from cdnjs, so browser needs Internet access.
- Xiangqi has basic legal movement/check filtering, but requires broader rules QA (especially flying general, checkmate/stalemate edge cases).
- Go implements placement, captures, suicide prevention and simple ko approximation. Territory scoring, superko variants, handicap and tournament rules are not implemented; after two passes the game ends but scoring is not yet adjudicated.
- Bot strength is heuristic and intentionally simple.
- Room sync is HTTP polling prototype (about 700 ms), not a WebSocket authoritative server. Room access is by code only; game state is client-trusted. Do not use for ranked/tournament play before security and rule-engine validation.
- Online sync should be tested with two browsers/devices; use the same room code, one player creates and the other joins. Deploying on a host with ephemeral storage may lose room states.


CAP NHAT THEO YEU CAU 27/10/2026
- Ban co tuong duoc doi sang dung kich thuoc 9 cot x 10 hang, ti le 9:10, co song va chu楚河/漢界; quan Do o phia duoi va quan Den o phia tren.
- Ca co vua, co tuong, co vay co cac che do Bot, hai nguoi cung may, Bot vs Bot va phong online bang ma phong.
- Online hien dong bo bang API polling; day la ban prototype. Truoc khi dua len mang cong khai can kiem thu hai thiet bi, xac thuc luot di o server, luu tru ben vung va hoan thien luat cham diem co vay.

# Qor Malikasi — Tundra integration

Status: disabled. The native Tundra command and response protocol has not been verified.

## Adapter contract
TUNDRA_BRIDGE points to an executable adapter, not directly to Tundra.exe or wine.
The adapter receives one JSON line on stdin:
- board: 64 integers, 0 empty, 1/-1 men, 2/-2 kings
- side: 1 or -1
- time: seconds
It returns a single JSON object with integer from and to indices (0–63).
The adapter must translate board orientation and capture sequences according to the verified native protocol.
Errors must exit nonzero. Do not substitute a different engine.

## Runtime
Dockerfile provides an isolated Wine/Xvfb environment, not a working adapter.
Supply original files privately at /opt/tundra after checking redistribution rights.
Do not enable the bot in lobby.js or rooms.js until real engine moves have been validated.

## Acceptance checks
- Both sides, initial position, forced captures, multiple captures, kings.
- Verify each returned move against the server legal move list.
- Verify timeouts, crashes and simultaneous requests.
- Verify Arena, reconnect and rating handling before enabling public play.

# Server

Bun + Hono + Drizzle + SQLite backend. See `../plans/server-backend-plan.md` for the full API.

```sh
bun install
bun run dev      # http://localhost:3000
bun test
```

| env | default |
|---|---|
| `PORT` | `3000` |
| `DATA_DIR` | `./data` |
| `DATABASE_URL` | `$DATA_DIR/database.db` |
| `SESSION_TTL_DAYS` | `30` |

From the Android emulator the base URL is `http://10.0.2.2:3000/api/v1`.

## Examples

All lengths are integer millimetres. Every endpoint except signup and login needs `Authorization: Bearer <token>`.

```sh
API=http://localhost:3000/api/v1

# sign up -> { token, user }
curl -X POST $API/auth/signup -H 'content-type: application/json' \
  -d '{"email":"alice@example.com","password":"password123","displayName":"Alice"}'

TOKEN=...

# create a room with a door
curl -X POST $API/rooms -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"name":"Bedroom","width":3000,"length":4000,"openings":[{"kind":"door","wall":"s","offset":200,"width":900}]}'

# create a project from that room -> full snapshot
curl -X POST $API/projects -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"name":"My room","baseRoomId":"<room id>"}'

# place furniture in a layout
curl -X POST $API/layouts/<layout id>/placements -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"furnitureId":"<furniture id>","x":0,"y":0,"rotation":90}'

# move it
curl -X PATCH $API/placements/<placement id> -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"x":500,"y":1200}'

# poll for changes, then re-fetch GET /projects/<id> when it differs
curl $API/projects/<project id>/revision -H "authorization: Bearer $TOKEN"
```

Errors look like `{ "error": { "code": "not_found", "message": "Project not found" } }`.

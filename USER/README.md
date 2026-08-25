USER FRONTEND - 6 COUNTRY FULL FIXED

Important game-count fixes:
- Route country is now detected from paths such as /australia/powerhit.
- Country aliases AU/IN/PK/CA/NP/AE are normalized.
- Ticket slug (powerhit/system/etc.) is detected from the second route segment.
- Game-count thunk now receives the selected ticketType.
- Game-count API supports array, data[], gameCounts[] and data.gameCounts[] responses.
- GameCounts fetch no longer depends on user.country being the full country name.

Existing fixes retained:
- Rules-of-Hooks fix
- India ticket-type import fix
- Country-specific Redux reducers
- Relative import fixes

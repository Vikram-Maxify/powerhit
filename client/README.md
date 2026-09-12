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

# Global Currency Setup

Your existing `src/utils/currency.js` is intentionally NOT included/replaced here.

Add these two files:

- `src/context/CurrencyContext.jsx`
- `src/hooks/useCurrency.js`

## 1. Wrap the app

Where your authenticated user is available:

```jsx
import { CurrencyProvider } from "./context/CurrencyContext";

<CurrencyProvider user={user}>
  <App />
</CurrencyProvider>;
```

If your `user` comes from Redux/Auth Context, pass that user object instead.

The provider expects:

```js
user.country;
```

Examples:

```js
"nepal"; // NPR
"Australia"; // AUD
"IN"; // INR
"UAE"; // AED
```

## 2. Use it anywhere

```jsx
import { useCurrency } from "../hooks/useCurrency";

const { formatAmount } = useCurrency();

<span>{formatAmount(100)}</span>;
```

The `100` is treated as 100 INR and converted to the logged-in user's currency.

## 3. Other values

```jsx
const {
  formatAmount,
  currencyCode,
  currencySymbol,
  loading,
  convertUserAmount,
} = useCurrency();
```

Examples:

```jsx
{
  formatAmount(balance);
}
{
  formatAmount(betAmount);
}
{
  formatAmount(winAmount);
}
{
  currencyCode;
}
{
  currencySymbol;
}
```

## Important

The existing utility's `getExchangeRates()` must return rates based on `BASE_CURRENCY`.

Example:

```json
{
  "INR": 1,
  "NPR": 1.6,
  "AUD": 0.016,
  "USD": 0.012
}
```

Do NOT store already-converted UI values in your database. Keep backend amounts in the base currency and convert only for display.

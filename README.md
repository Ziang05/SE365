# Event Extraction Dashboard

Frontend dashboard built with React, TypeScript, Vite, and Tailwind CSS for displaying AI-extracted financial events from news articles.

The app currently uses mock data only. There is no backend, authentication, database, or API integration yet.

## Features

- Financial dashboard layout with topic tabs, event cards, badges, chips, quote boxes, and confidence bars.
- Client-side topic filtering by `main_topic`.
- Client-side search across event title, event type, involved entities, and evidence text.
- Dynamic attribute rendering with support for units, percentages, arrays, null values, and status badges.
- Responsive layout for desktop, tablet, and mobile.
- Mock financial event data covering ownership/capital changes, business operations, financial results, and legal/governance events.

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- lucide-react

## Project Structure

```text
src/
  components/
    Badge.tsx
    ConfidenceBar.tsx
    EntityChips.tsx
    EventCard.tsx
    EventDashboard.tsx
    EventTabs.tsx
    KeyValueList.tsx
  data/
    mockEvents.ts
  types/
    event.ts
  utils/
    formatters.ts
  App.tsx
  main.tsx
  styles.css
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173/
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Data Model

Mock events follow the `FinancialEvent` type in `src/types/event.ts`:

```ts
type FinancialEvent = {
  id: string;
  main_topic: string;
  event_type: string;
  title: string;
  entities_involved: string[];
  context: {
    who?: string | null;
    what?: string | null;
    when?: string | null;
    where?: string | null;
    why?: string | null;
    how?: string | null;
    tense?: "planned" | "ongoing" | "completed" | "unknown";
    result?: string | null;
  };
  attributes: Record<string, unknown>;
  evidence_text: string;
  confidence: number;
};
```

To replace mock data with a real API later, keep the same event shape and swap the data source used by `EventDashboard`.

# Budgee - Personal Finance Dashboard

A modern, responsive budgeting application built with React, TypeScript, and Tailwind CSS. This app helps users track their spending, categorize transactions, and visualize their financial data through interactive charts and dashboards.

## Features

### Dashboard
- **Summary Cards**: Overview of savings rate, monthly expenses, and income with trend indicators
- **Category Spending**: Interactive pie chart showing spending breakdown by category
- **Income vs Expenses**: Monthly bar chart comparing income and expenses
- **Accounts Overview**: Net worth summary and account balances
- **Recurring Transactions**: Upcoming scheduled transactions and bills

### Transactions
- **Detailed Transaction Table**: Complete transaction history with search and filtering
- **Advanced Filters**: Filter by account, category, date, amount, and more
- **Transaction Categories**: Primary and detailed categorization with color-coded labels
- **Bulk Actions**: Select multiple transactions for batch operations

### Plaid Integration
- **Bank Account Linking**: Secure connection to bank accounts via Plaid
- **Real-time Sync**: Automatic transaction synchronization
- **Multi-account Support**: Connect multiple financial institutions

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: Zustand for global state
- **Charts**: Recharts for data visualization
- **Routing**: React Router v6
- **Notifications**: Sonner for toast notifications
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd budgee-ui
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_API_URL=http://localhost:3000
VITE_PLAID_ENV=sandbox
```

## Backend Integration

This frontend is designed to work with a Go backend that provides:

- **Plaid Integration**: Link tokens and account connection
- **Transaction Management**: Store and retrieve transaction data
- **Account Management**: Bank account information and balances
- **Data Aggregation**: Categorized spending analysis

### Available Endpoints

The backend should provide these endpoints:

- `POST /plaid/create-link-token` - Create Plaid link token
- `POST /plaid/exchange-public-token` - Exchange public token for access token
- `GET /plaid/items` - Get connected Plaid items
- `GET /plaid/accounts/{item_id}` - Get accounts for a Plaid item
- `GET /plaid/accounts/{item_id}/db` - Get accounts from database
- `GET /plaid/transactions/{item_id}/sync` - Sync transactions
- `GET /plaid/transactions/{account_id}` - Get transactions for account

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (Card, etc.)
│   ├── charts/         # Chart components
│   └── Layout.tsx      # Main layout component
├── pages/              # Page components
│   ├── Dashboard.tsx   # Dashboard page
│   └── Transactions.tsx # Transactions page
├── services/           # API and external service integrations
│   ├── api.ts          # API service layer
│   └── plaid.ts        # Plaid integration
├── stores/             # State management
│   └── appStore.ts     # Zustand store
├── types/              # TypeScript type definitions
│   └── index.ts        # All type definitions
├── utils/              # Utility functions
│   ├── formatters.ts   # Data formatting utilities
│   └── cn.ts           # Class name utilities
└── App.tsx             # Main application component
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run check` - Run TypeScript type checking

### Code Quality

The project uses:
- **ESLint** for code linting
- **TypeScript** for type safety
- **Prettier** for code formatting (when configured)

## Deployment

The application can be deployed to any static hosting service:

1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service

### Vercel Deployment

For Vercel deployment, the project includes a `vercel.json` configuration file.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

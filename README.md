# Personal Expense Tracker Web Application

A private, mobile-first expense tracking progressive web application built with Next.js, Framer Motion, and Tailwind CSS. The app uses Google Sheets as its primary database.

## Features

- **Quick Entry**: Add transactions simply by typing (e.g., `89 food d` or `500 petrol d 22/06`).
- **Google Sheets Integration**: Automatically categorizes transactions and writes them directly into an existing Google Workbook.
- **Auto Monthly Sheets**: Automatically detects the current month and creates a new sheet if it doesn't exist by copying the previous month's structure.
- **PWA Support**: Can be installed to an Android Home Screen directly from the browser for a native-like experience.
- **Secure Access**: Simple password-based authentication via environment variables.

## Transaction Format

The app accepts a short text format:

`<amount> <notes> <type> [date]`

- **amount**: The transaction amount (e.g., `89`).
- **notes**: A short description. Can be multiple words (e.g., `food` or `car service`).
- **type**: `d` for Debit (expense) or `c` for Credit (income).
- **date**: (Optional) Day and month in `DD/MM` format (e.g., `22/06`). Defaults to today if omitted.

**Examples**:
- `89 food d`
- `10000 salary c`
- `500 petrol d 22/06`

## Environment Variables

Create a `.env` or `.env.local` file with the following variables. Do NOT expose these publicly.

```env
APP_PASSWORD=your_secure_password
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_CLIENT_EMAIL=your_service_account_email
GOOGLE_PRIVATE_KEY="your_private_key_with_\n"
```

*Note: In Vercel, simply copy the `GOOGLE_PRIVATE_KEY` verbatim. The app will replace `\n` appropriately during runtime.*

## Deployment to Vercel

1. Push your code to a Git repository (GitHub/GitLab/Bitbucket).
2. Connect your repository to Vercel.
3. In the Vercel project settings, configure the environment variables as described above.
4. Deploy the application.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000` with your browser to see the result.

## PWA Setup

To install the app as a Progressive Web App on Android:
1. Open the web app URL in Chrome on your Android device.
2. Login to the application.
3. Tap the browser menu (three dots) and select "Add to Home screen" or "Install App".
4. The expense tracker will now behave like a native app on your phone.

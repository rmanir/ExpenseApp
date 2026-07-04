import { google } from 'googleapis';
import { ParsedTransaction } from './parser';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: privateKey,
    scopes: SCOPES
  });
}

const sheets = google.sheets({ version: 'v4', auth: getAuth() });
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

function getMonthName(dateStr: string): string {
  const d = new Date(dateStr);
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
  return formatter.format(d);
}

export async function saveTransaction(tx: ParsedTransaction, username?: string): Promise<string> {
  const sheetName = getMonthName(tx.date);
  
  // 1. Check if sheet exists
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const sheetsList = spreadsheet.data.sheets || [];
  const targetSheet = sheetsList.find(s => s.properties?.title === sheetName);

  if (!targetSheet) {
    // 2. Create new sheet
    // We try to find the previous month to copy from
    const d = new Date(tx.date);
    d.setMonth(d.getMonth() - 1);
    const prevMonthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d);
    
    const prevSheet = sheetsList.find(s => s.properties?.title === prevMonthName);
    
    if (prevSheet) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              duplicateSheet: {
                sourceSheetId: prevSheet.properties?.sheetId,
                insertSheetIndex: sheetsList.length,
                newSheetName: sheetName,
              }
            }
          ]
        }
      });
      // Clear all rows except header
      const newSheetRes = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
      const newSheetId = newSheetRes.data.sheets?.find(s => s.properties?.title === sheetName)?.properties?.sheetId;
      if (newSheetId) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                deleteRange: {
                  range: {
                    sheetId: newSheetId,
                    startRowIndex: 1, // Keep header
                  },
                  shiftDimension: "ROWS"
                }
              }
            ]
          }
        });
      }
    } else {
      // Create empty with headers
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetName,
                }
              }
            }
          ]
        }
      });
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${sheetName}'!A1:E1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [['Amount', 'Date', 'Type', 'Notes', 'Category']]
        }
      });
    }
  }

  // 3. Append transaction
  // Column order: Amount, Date, Type, Notes, Category
  const appendRes = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A:E`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [
        [tx.amount, tx.date, tx.type, tx.notes, tx.category]
      ]
    }
  });

  const updatedRange = appendRes.data.updates?.updatedRange;
  if (updatedRange) {
    const match = updatedRange.match(/[a-zA-Z]+(\d+):[a-zA-Z]+(\d+)/);
    if (match) {
      const startRow = parseInt(match[1], 10) - 1; // 0-indexed
      const endRow = parseInt(match[2], 10);
      
      const sheetId = targetSheet?.properties?.sheetId;
      let finalSheetId = sheetId;
      
      if (finalSheetId === undefined) {
        // If it was a new sheet, get the sheet ID
        const spreadsheet = await sheets.spreadsheets.get({
          spreadsheetId: SPREADSHEET_ID,
        });
        finalSheetId = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetName)?.properties?.sheetId;
      }

      if (finalSheetId !== undefined) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId: finalSheetId,
                    startRowIndex: startRow,
                    endRowIndex: endRow,
                    startColumnIndex: 0,
                    endColumnIndex: 5,
                  },
                  cell: {
                    userEnteredFormat: {
                      textFormat: {
                        bold: false,
                      },
                    },
                  },
                  fields: 'userEnteredFormat.textFormat.bold',
                }
              },
              {
                repeatCell: {
                  range: {
                    sheetId: finalSheetId,
                    startRowIndex: startRow,
                    endRowIndex: endRow,
                    startColumnIndex: 0,
                    endColumnIndex: 1,
                  },
                  cell: {
                    userEnteredFormat: {
                      horizontalAlignment: 'RIGHT',
                      backgroundColor: username === 'raji' ? { red: 242/255, green: 235/255, blue: 202/255 } : undefined,
                    },
                  },
                  fields: 'userEnteredFormat.horizontalAlignment' + (username === 'raji' ? ',userEnteredFormat.backgroundColor' : ''),
                }
              },
              {
                repeatCell: {
                  range: {
                    sheetId: finalSheetId,
                    startRowIndex: startRow,
                    endRowIndex: endRow,
                    startColumnIndex: 1,
                    endColumnIndex: 5,
                  },
                  cell: {
                    userEnteredFormat: {
                      horizontalAlignment: 'LEFT',
                    },
                  },
                  fields: 'userEnteredFormat.horizontalAlignment',
                }
              }
            ]
          }
        });
      }
    }
  }

  return sheetName;
}

export async function getRecentTransactions(days: number = 7) {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const sheetsList = spreadsheet.data.sheets || [];
  
  // We need to look at the current and maybe previous month sheet
  const now = new Date();
  const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);
  now.setMonth(now.getMonth() - 1);
  const prevMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);

  const sheetsToRead = [];
  if (sheetsList.some(s => s.properties?.title === currentMonth)) sheetsToRead.push(currentMonth);
  if (sheetsList.some(s => s.properties?.title === prevMonth)) sheetsToRead.push(prevMonth);

  const allTx = [];

  for (const sheetName of sheetsToRead) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A2:E`,
    });
    
    if (res.data.values) {
      for (const row of res.data.values) {
        if (row.length >= 5) {
          allTx.push({
            amount: parseFloat(row[0]),
            date: row[1],
            type: row[2],
            notes: row[3],
            category: row[4],
          });
        }
      }
    }
  }

  // Sort by date desc
  allTx.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter last 7 days
  const today = new Date();
  today.setHours(0,0,0,0);
  const cutoffDate = new Date(today.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  
  const recent = allTx.filter(tx => new Date(tx.date) >= cutoffDate);
  return recent;
}

export async function getSummaries() {
  // Use Asia/Kolkata timezone to get today's date
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const now = new Date();
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const todayDateStr = `${year}-${month}-${day}`;

  const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(now);

  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const sheetsList = spreadsheet.data.sheets || [];
  
  // We need to look at the current and maybe previous month sheet to get full 7 days and current month
  const prevDate = new Date(now);
  prevDate.setMonth(now.getMonth() - 1);
  const prevMonthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(prevDate);

  const sheetsToRead = [];
  if (sheetsList.some(s => s.properties?.title === currentMonthName)) sheetsToRead.push(currentMonthName);
  if (sheetsList.some(s => s.properties?.title === prevMonthName)) sheetsToRead.push(prevMonthName);

  const allTx = [];

  for (const sheetName of sheetsToRead) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A2:E`,
    });
    
    if (res.data.values) {
      for (const row of res.data.values) {
        if (row.length >= 5) {
          allTx.push({
            amount: parseFloat(row[0]),
            date: row[1],
            type: row[2],
            notes: row[3],
            category: row[4],
            sheetName: sheetName
          });
        }
      }
    }
  }

  const todayTx = allTx.filter(tx => tx.date === todayDateStr);
  
  const todayObj = new Date();
  todayObj.setHours(0,0,0,0);
  const cutoff7Days = new Date(todayObj.getTime() - 6 * 24 * 60 * 60 * 1000); // 7 days including today
  const last7DaysTx = allTx.filter(tx => new Date(tx.date) >= cutoff7Days);

  const currentMonthTx = allTx.filter(tx => tx.sheetName === currentMonthName);

  const calculateSummary = (txs: any[]) => {
    let income = 0;
    let expense = 0;
    for (const tx of txs) {
      if (tx.type.toLowerCase() === 'credit') {
        income += tx.amount;
      } else {
        expense += tx.amount;
      }
    }
    return { income, expense, net: income - expense };
  };

  return {
    today: calculateSummary(todayTx),
    last7Days: calculateSummary(last7DaysTx),
    currentMonth: calculateSummary(currentMonthTx)
  };
}

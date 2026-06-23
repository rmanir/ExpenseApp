type TransactionType = 'Credit' | 'Debit';

export interface ParsedTransaction {
  amount: number;
  notes: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  category: string;
}

const CATEGORY_MAP: Record<string, string> = {
  rent: "Rent",
  salary: "Income",
  income: "Income",
  pons: "Income",
  stock: "Investment",
  insurance: "Investment",
  gold: "Investment",
  investment: "Investment",
  "eb bill": "EB & EC",
  recharge: "EB & EC",
  ec: "EB & EC",
  "internet bill": "EB & EC",
  wifi: "EB & EC",
  gas: "Gas & Water",
  water: "Gas & Water",
  petrol: "Petrol",
  bus: "Travel",
  cab: "Travel",
  irctc: "Travel",
  fasttag: "Travel",
  car: "Travel",
  kiger: "Travel",
  travel: "Travel",
  grocery: "Grocery",
  rice: "Grocery",
  oil: "Grocery",
  milk: "Grocery",
  flour: "Grocery",
  chicken: "Grocery",
  mutton: "Grocery",
  coconut: "Grocery",
  fruits: "Grocery",
  fish: "Grocery",
  prawn: "Grocery",
  nuts: "Grocery",
  flower: "Grocery",
  liver: "Grocery",
  food: "Entertainment",
  snacks: "Entertainment",
  tea: "Entertainment",
  icecream: "Entertainment",
  "ice cream": "Entertainment",
  juice: "Entertainment",
  movie: "Entertainment",
  entertainment: "Entertainment",
  medicine: "Medicine",
  pregnancy: "Medicine",
  medical: "Medicine",
  ef: "Emergency Fund",
  "car service": "Car Maintenance",
  washcar: "Car Maintenance",
  "car puncture": "Car Maintenance",
  aircar: "Car Maintenance",
  "bike service": "Bike Maintenance",
  washbike: "Bike Maintenance",
  "bike puncture": "Bike Maintenance",
  airbike: "Bike Maintenance",
  dress: "Grooming",
  makeup: "Grooming",
  grooming: "Grooming",
  haircut: "Grooming",
  trip: "Trip/Vacation",
  vacation: "Trip/Vacation",
  emi: "EMI",
  "cc bill": "Last Month Debt",
  debt: "Last Month Debt",
  "last month debt": "Last Month Debt",
  hardware: "Home App/Maintenance",
  maintenance: "Home App/Maintenance",
  gym: "Self Improvement",
  yoga: "Self Improvement",
  walking: "Self Improvement",
  book: "Self Improvement",
  gift: "Gifts",
  birthday: "Gifts",
  moi: "Gifts",
  insurancehealth: "Insurance",
  insurancecar: "Insurance",
  insurancebike: "Insurance",
  relatives: "Relatives"
};

function getCategory(notes: string): string {
  const normalized = notes.toLowerCase().replace(/\s+/g, '').trim();
  for (const [key, category] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key.toLowerCase().replace(/\s+/g, ''))) {
      return category;
    }
  }
  return 'Others';
}

function parseDate(dateStr?: string): string {
  const now = new Date();
  
  // Use Asia/Kolkata timezone specifically
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const currentDateParts = formatter.formatToParts(now);
  const currentYear = currentDateParts.find(p => p.type === 'year')?.value;
  const currentMonth = currentDateParts.find(p => p.type === 'month')?.value;
  const currentDay = currentDateParts.find(p => p.type === 'day')?.value;

  if (!dateStr) {
    return `${currentYear}-${currentMonth}-${currentDay}`;
  }

  const [day, month] = dateStr.split('/');
  
  // Simple validation
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  if (isNaN(d) || isNaN(m) || d < 1 || d > 31 || m < 1 || m > 12) {
    throw new Error('Invalid Date. Example: 22/06');
  }

  return `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function parseTransaction(input: string): ParsedTransaction {
  const tokens = input.trim().split(/\s+/);
  if (tokens.length < 3) {
    throw new Error('Invalid Format. Examples: \n89 food d\n10000 salary c\n500 petrol d 22/06');
  }

  const amountStr = tokens[0];
  const amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Invalid Amount');
  }

  let dateStr: string | undefined = undefined;
  let typeStr: string;
  let notesTokens: string[];

  const lastToken = tokens[tokens.length - 1].toLowerCase();
  
  // Check if last token is date
  if (/^\d{1,2}\/\d{1,2}$/.test(lastToken)) {
    dateStr = lastToken;
    typeStr = tokens[tokens.length - 2].toLowerCase();
    notesTokens = tokens.slice(1, tokens.length - 2);
  } else {
    typeStr = lastToken;
    notesTokens = tokens.slice(1, tokens.length - 1);
  }

  if (typeStr !== 'c' && typeStr !== 'd') {
    throw new Error('Type must be:\nd = Debit\nc = Credit');
  }

  const type: TransactionType = typeStr === 'c' ? 'Credit' : 'Debit';
  const notes = notesTokens.join(' ');
  if (!notes) {
    throw new Error('Notes missing');
  }

  const date = parseDate(dateStr);
  const category = getCategory(notes);

  return {
    amount,
    notes,
    type,
    date,
    category,
  };
}

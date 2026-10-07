import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure data and uploads directories exist
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_FILE = path.resolve(DATA_DIR, 'archive.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Data models
export interface DiaryEntry {
  id: string;
  pageNumber: number;
  title: string;
  content: string;
  date: string; // ISO string or YYYY-MM-DD
  time: string; // e.g. "11:42 PM"
  mood?: string;
  images: Array<{
    id: string;
    url: string;
    caption?: string;
  }>;
  loves: number;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorProfile {
  name: string;
  bio: string;
  avatarUrl: string;
  coverQuote: string;
  authorTitle?: string;
  lastWritten?: string;
}

interface DatabaseSchema {
  author: AuthorProfile;
  authPasswordHash: string;
  entries: DiaryEntry[];
  loveVotes: Record<string, string[]>; // entryId -> array of hashed IPs/device tokens
}

// Initial seed data with authentic Bengali & English diary entries
const DEFAULT_QUOTE = `খুব গভীর ধ্যানে মগ্ন ছিলাম,
তাই আর বাস্তবতায় ফিরতে পারি নি
শেষে...`;

const INITIAL_DB: DatabaseSchema = {
  author: {
    name: 'Ash',
    bio: 'স্মৃতির রাখাল। একাকী সন্ধ্যা আর হারিয়ে যাওয়া মুহূর্তের দিনলিপি। Writing to preserve what time gently turns to dust.',
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
    coverQuote: DEFAULT_QUOTE,
    authorTitle: 'Keeper of Quiet Thoughts',
    lastWritten: '2026-10-07T21:30:00.000Z',
  },
  // Default password: archive2026 (SHA256 hashed)
  authPasswordHash: crypto.createHash('sha256').update('archive2026').digest('hex'),
  loveVotes: {},
  entries: [
    {
      id: 'entry-1',
      pageNumber: 1,
      title: 'প্রথম পাতার সূচনা (The First Inscription)',
      content: `একটি নতুন খাতার প্রথম সাদা পৃষ্ঠা সবসময়ই একটু ভয়ের, একটু বিস্ময়ের। কলমটি স্পর্শ করতেই বুকের ভেতর কেমন যেন এক অদ্ভুত শান্ত নিঃশব্দতা নেমে এলো।

আমরা প্রতিদিন কত শত কথা ভাবি, কত অনুভূতি বাতাসে উড়িয়ে দিই। অথচ খুব কম ভাবনাই আমাদের সাথে শেষ পর্যন্ত থেকে যায়। এই খাতাটি আমার সেই না-বলা কথার গোপন আশ্রয়। এখানে কোনো মুখোশ নেই, কোনো তাড়াহুড়ো নেই।

"খুব গভীর ধ্যানে মগ্ন ছিলাম, তাই আর বাস্তবতায় ফিরতে পারি নি শেষে..."
এই পঙক্তিটি যখন প্রথম ডায়রির মলাটে লিখেছিলাম, মনে হয়েছিল নিজের এক টুকরো আত্মাকেই চিরদিনের জন্য বন্দি করে রাখলাম। আজ থেকে এই আর্কাইভের প্রতিটি পাতা আমার নীরবতার সাক্ষী থাকবে।`,
      date: '2025-01-01',
      time: '11:15 PM',
      mood: 'Reflective · অন্তর্মুখী',
      images: [
        {
          id: 'img-1',
          url: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1200&q=80',
          caption: 'প্রথম পাতার খসড়া ও পুরনো ফাউন্টেন পেন',
        },
      ],
      loves: 18,
      isDraft: false,
      createdAt: '2025-01-01T23:15:00.000Z',
      updatedAt: '2025-01-01T23:15:00.000Z',
    },
    {
      id: 'entry-2',
      pageNumber: 2,
      title: 'The Architecture of Solitude',
      content: `I have come to realize that solitude is not the absence of company; it is the presence of one's own unspoken essence. 

Walking by the riverbank as dusk slowly bled into twilight, the city seemed far away. The wind smelled of damp earth and river water. There is a strange comfort in watching ferry lights blink across the dark water—small beacons of transient lives passing each other in silence.

Sometimes I wonder if the memories we choose to write down are the ones that actually happened, or if writing them gives them a grace they never possessed in real life. Perhaps that is why we write: not to report reality, but to forgive it.`,
      date: '2025-09-14',
      time: '08:45 PM',
      mood: 'Calm · শান্ত',
      images: [
        {
          id: 'img-2',
          url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80',
          caption: 'Evening mist rising over the tranquil river',
        },
      ],
      loves: 24,
      isDraft: false,
      createdAt: '2025-09-14T20:45:00.000Z',
      updatedAt: '2025-09-14T20:45:00.000Z',
    },
    {
      id: 'entry-3',
      pageNumber: 3,
      title: 'এক বছর আগের একটি চিঠি (On This Day Memory)',
      content: `আজ হঠাৎ টেবিলের ড্রয়ার গুছাতে গিয়ে এক বছর পুরনো একটি চিরকুট পেলাম। ঠিক আজকের দিনে—৭ অক্টোবর, ২০২৫ তারিখে লেখা।

কখনও কখনও সময় এত দ্রুত গড়িয়ে যায় যে আমরা পেছনের চিহ্নগুলো দেখতে পাই না। চিরকুটে লেখা ছিল:
"যদি কোনোদিন হারিয়ে যাও, নিজের লেখার মাঝে ফিরে এসো।"

বাইরে তখন মৃদু বাতাস বইছিল। এক কাপ ব্ল্যাক কফি আর জানালার ওপারে ঝুলে থাকা অচেনা তারাগুলো। আমি কত বদলে গেছি এই এক বছরে, অথচ এই খাতার স্পর্শ এখনো সেই চিরচেনা উষ্ণতাই ধরে রেখেছে। আশ্চর্য এই স্মৃতির টান!`,
      date: '2025-10-07',
      time: '10:20 PM',
      mood: 'Nostalgic · স্মৃতিকাতর',
      images: [
        {
          id: 'img-3',
          url: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80',
          caption: 'হলদে হয়ে আসা কাগজের টুকরো ও কাঠের টেবিল',
        },
      ],
      loves: 42,
      isDraft: false,
      createdAt: '2025-10-07T22:20:00.000Z',
      updatedAt: '2025-10-07T22:20:00.000Z',
    },
    {
      id: 'entry-4',
      pageNumber: 4,
      title: 'বৃষ্টির রাতে কিছু না-বলা কথা',
      content: `আজ বিকেল থেকেই অবিশ্রান্ত বৃষ্টি। টিনের চালে বৃষ্টির যে সঙ্গীত, তা পৃথিবীর সবচেয়ে নিভৃত লোরি।

Bangla words have a unique weight when it rains. "ঝুম বৃষ্টি", "কদমফুল", "ভেজা মাটির সোঁদা গন্ধ"—you cannot translate these without losing half their soul. 

চা ঠান্ডা হয়ে এসেছে। ঘরের কোণে ছোট টিমটিমে টেবিল ল্যাম্পের আলোয় পাতার ওপর কলমের খসখস শব্দ ছাড়া আর কোনো শব্দ নেই। জীবনের সমস্ত অস্থিরতা যেন এই এক ফোঁটা আলোর বৃত্তে এসে থমকে দাঁড়িয়েছে। ভালো লাগে এমন রাত, যখন পৃথিবীর কোনো তাড়া থাকে না।`,
      date: '2026-10-01',
      time: '09:30 PM',
      mood: 'Melancholic · বিষণ্ণ',
      images: [
        {
          id: 'img-4',
          url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1200&q=80',
          caption: 'জানালার কাঁচে বৃষ্টির ফোঁটা ও নিভৃত বাতি',
        },
      ],
      loves: 31,
      isDraft: false,
      createdAt: '2026-10-01T21:30:00.000Z',
      updatedAt: '2026-10-01T21:30:00.000Z',
    },
    {
      id: 'entry-5',
      pageNumber: 5,
      title: 'A Strange Evening in Autumn',
      content: `The sky turned an unexpected shade of burnt amber this evening. 

I took the longer route home through the alleyways of the old quarter. Children were playing badminton under flickering streetlights; the smell of roasted peanuts and tea stalls hung thick in the cool October air.

There is a bittersweet elegance in autumn evenings. It reminds you that endings can be golden too, that letting go doesn't always have to feel like grief. I came home and immediately opened this archive. Writing these lines felt like preserving amber in resin before night completely devoured it.`,
      date: '2026-10-04',
      time: '07:15 PM',
      mood: 'Reflective · অন্তর্মুখী',
      images: [
        {
          id: 'img-5',
          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          caption: 'Autumn dusk turning golden amber',
        },
      ],
      loves: 19,
      isDraft: false,
      createdAt: '2026-10-04T19:15:00.000Z',
      updatedAt: '2026-10-04T19:15:00.000Z',
    },
    {
      id: 'entry-6',
      pageNumber: 6,
      title: 'নীরবতার ভাষা (The Language of Silence)',
      content: `আজ সারাদিন কারো সাথে বেশি কথা বলতে ইচ্ছে করেনি। কিছু কিছু দিন আসে যখন শব্দগুলো বড্ড ক্লান্তিজনক মনে হয়।

মানুষের মন কি আশ্চর্য এক জগত! আমরা যখন বাইরের কোলাহল থেকে মুখ ফিরিয়ে নিজের ভেতরে তাকাই, তখন বুঝতে পারি আমাদের ভেতরে কত সমুদ্র, কত নিঃশব্দ ঢেউ জমে আছে।

রাত গভীর হচ্ছে। ঘড়ির কাঁটার মৃদু টিকটিক শব্দ ছাড়া আর কিছুই শোনা যাচ্ছে না। ডায়রির এই পাতায় আজকের দিনটিকে রেখে দিলাম, যেন আগামী দিনে যখন এটি আবার পড়ব, আজকের এই নিস্তব্ধতার মূল্য আমি ভুলে না যাই।`,
      date: '2026-10-07',
      time: '11:45 PM',
      mood: 'Solitary · নিঃসঙ্গ',
      images: [
        {
          id: 'img-6',
          url: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1200&q=80',
          caption: 'রাতের অন্ধকার ও নিঃশব্দ দিগন্ত',
        },
      ],
      loves: 15,
      isDraft: false,
      createdAt: '2026-10-07T23:45:00.000Z',
      updatedAt: '2026-10-07T23:45:00.000Z',
    },
  ],
};

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DB, null, 2), 'utf-8');
      return INITIAL_DB;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Error reading DB, using initial state:', err);
    return INITIAL_DB;
  }
}

function writeDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing DB:', err);
    throw err;
  }
}

// In-memory active author tokens
const activeTokens = new Set<string>();

// Middleware for parsing JSON with high limit for images
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Auth verification helper
function authenticateAuthor(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Author credentials required' });
  }
  const token = authHeader.split(' ')[1];
  if (!activeTokens.has(token)) {
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }
  next();
}

// Optional auth helper (to check if request is by author)
function isRequestAuthor(req: Request): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  return activeTokens.has(token);
}

// --- API ROUTES ---

// 1. Author Authentication
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const db = readDb();
  const inputHash = crypto.createHash('sha256').update(String(password).trim()).digest('hex');

  if (inputHash === db.authPasswordHash) {
    const token = crypto.randomBytes(32).toString('hex');
    activeTokens.add(token);
    return res.json({
      success: true,
      token,
      author: db.author,
    });
  } else {
    return res.status(401).json({ error: 'Incorrect passphrase. Hint: default is archive2026' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    activeTokens.delete(token);
  }
  res.json({ success: true });
});

app.get('/api/auth/verify', (req: Request, res: Response) => {
  const isAuth = isRequestAuthor(req);
  const db = readDb();
  res.json({ authenticated: isAuth, author: db.author });
});

app.post('/api/auth/change-password', authenticateAuthor, (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long' });
  }

  const db = readDb();
  const oldHash = crypto.createHash('sha256').update(String(oldPassword).trim()).digest('hex');

  if (oldHash !== db.authPasswordHash) {
    return res.status(400).json({ error: 'Current password does not match' });
  }

  db.authPasswordHash = crypto.createHash('sha256').update(String(newPassword).trim()).digest('hex');
  writeDb(db);

  res.json({ success: true, message: 'Password updated successfully' });
});

// 2. Profile / Author Details
app.get('/api/profile', (req: Request, res: Response) => {
  const db = readDb();
  // Compute last written timestamp based on published entries
  const published = db.entries.filter((e) => !e.isDraft);
  let lastWritten = db.author.lastWritten;
  if (published.length > 0) {
    const sorted = [...published].sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')).getTime() - new Date(a.date + ' ' + (a.time || '00:00')).getTime());
    lastWritten = sorted[0].createdAt || sorted[0].date;
  }

  res.json({
    ...db.author,
    lastWritten,
    totalPublished: published.length,
    totalDrafts: isRequestAuthor(req) ? db.entries.filter((e) => e.isDraft).length : undefined,
  });
});

app.put('/api/profile', authenticateAuthor, (req: Request, res: Response) => {
  const { name, bio, avatarUrl, coverQuote, authorTitle } = req.body;
  const db = readDb();

  db.author = {
    ...db.author,
    name: name !== undefined ? String(name).trim() : db.author.name,
    bio: bio !== undefined ? String(bio).trim() : db.author.bio,
    avatarUrl: avatarUrl !== undefined ? String(avatarUrl).trim() : db.author.avatarUrl,
    coverQuote: coverQuote !== undefined ? String(coverQuote).trim() : db.author.coverQuote,
    authorTitle: authorTitle !== undefined ? String(authorTitle).trim() : db.author.authorTitle,
  };

  writeDb(db);
  res.json({ success: true, author: db.author });
});

// 3. Diary Entries (CRUD)
app.get('/api/entries', (req: Request, res: Response) => {
  const db = readDb();
  const isAuthor = isRequestAuthor(req);

  // If author, show all (including drafts), otherwise only published
  let list = db.entries;
  if (!isAuthor) {
    list = list.filter((e) => !e.isDraft);
  }

  // Sort chronologically ascending for diary page flipping experience
  list.sort((a, b) => {
    const timeA = new Date(a.date + ' ' + (a.time || '12:00 PM')).getTime();
    const timeB = new Date(b.date + ' ' + (b.time || '12:00 PM')).getTime();
    return timeA - timeB;
  });

  // Recompute realistic page numbers for public pages
  let currentPg = 1;
  const enriched = list.map((item) => {
    if (!item.isDraft) {
      return { ...item, pageNumber: currentPg++ };
    }
    return { ...item, pageNumber: 0 };
  });

  res.json(enriched);
});

// Get single entry
app.get('/api/entries/:id', (req: Request, res: Response) => {
  const db = readDb();
  const entry = db.entries.find((e) => e.id === req.params.id);

  if (!entry) {
    return res.status(404).json({ error: 'Diary entry not found' });
  }

  if (entry.isDraft && !isRequestAuthor(req)) {
    return res.status(403).json({ error: 'Drafts are private to the author' });
  }

  res.json(entry);
});

// Create entry (Author only)
app.post('/api/entries', authenticateAuthor, (req: Request, res: Response) => {
  const { title, content, date, time, mood, images, isDraft } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Diary content cannot be empty' });
  }

  const db = readDb();
  const now = new Date();
  const entryId = 'entry-' + Date.now();

  const formattedDate = date || now.toISOString().split('T')[0];
  const formattedTime = time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const publishedCount = db.entries.filter((e) => !e.isDraft).length;

  const newEntry: DiaryEntry = {
    id: entryId,
    pageNumber: isDraft ? 0 : publishedCount + 1,
    title: (title || '').trim(),
    content: content.trim(),
    date: formattedDate,
    time: formattedTime,
    mood: mood || undefined,
    images: Array.isArray(images) ? images : [],
    loves: 0,
    isDraft: Boolean(isDraft),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  db.entries.push(newEntry);
  if (!isDraft) {
    db.author.lastWritten = now.toISOString();
  }

  writeDb(db);
  res.status(201).json(newEntry);
});

// Update entry (Author only)
app.put('/api/entries/:id', authenticateAuthor, (req: Request, res: Response) => {
  const { title, content, date, time, mood, images, isDraft } = req.body;
  const db = readDb();
  const index = db.entries.findIndex((e) => e.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Diary entry not found' });
  }

  const existing = db.entries[index];
  const now = new Date();

  db.entries[index] = {
    ...existing,
    title: title !== undefined ? String(title).trim() : existing.title,
    content: content !== undefined ? String(content).trim() : existing.content,
    date: date !== undefined ? String(date) : existing.date,
    time: time !== undefined ? String(time) : existing.time,
    mood: mood !== undefined ? mood : existing.mood,
    images: Array.isArray(images) ? images : existing.images,
    isDraft: isDraft !== undefined ? Boolean(isDraft) : existing.isDraft,
    updatedAt: now.toISOString(),
  };

  if (!isDraft) {
    db.author.lastWritten = now.toISOString();
  }

  writeDb(db);
  res.json(db.entries[index]);
});

// Delete entry (Author only)
app.delete('/api/entries/:id', authenticateAuthor, (req: Request, res: Response) => {
  const db = readDb();
  const index = db.entries.findIndex((e) => e.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Diary entry not found' });
  }

  const deleted = db.entries.splice(index, 1)[0];
  writeDb(db);

  res.json({ success: true, deletedId: deleted.id });
});

// 4. Love Reaction
app.post('/api/entries/:id/love', (req: Request, res: Response) => {
  const entryId = req.params.id;
  const clientIdentifier = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'visitor';
  const hashedVisitor = crypto.createHash('md5').update(clientIdentifier).digest('hex');

  const db = readDb();
  const entry = db.entries.find((e) => e.id === entryId);

  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  if (!db.loveVotes) db.loveVotes = {};
  if (!db.loveVotes[entryId]) db.loveVotes[entryId] = [];

  const alreadyLoved = db.loveVotes[entryId].includes(hashedVisitor);
  if (alreadyLoved) {
    return res.json({ loves: entry.loves, alreadyLoved: true });
  }

  db.loveVotes[entryId].push(hashedVisitor);
  entry.loves = (entry.loves || 0) + 1;
  writeDb(db);

  res.json({ loves: entry.loves, loved: true });
});

// 5. "On This Day" Query
app.get('/api/on-this-day', (req: Request, res: Response) => {
  const db = readDb();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const currentYear = now.getFullYear();

  const published = db.entries.filter((e) => !e.isDraft);

  // Match month and day from a previous year
  const matches = published.filter((entry) => {
    const entryDate = new Date(entry.date);
    if (isNaN(entryDate.getTime())) return false;
    const m = entryDate.getMonth() + 1;
    const d = entryDate.getDate();
    const y = entryDate.getFullYear();
    return m === currentMonth && d === currentDay && y < currentYear;
  });

  res.json(matches);
});

// 6. Persistent Image Upload API
app.post('/api/upload', (req: Request, res: Response) => {
  try {
    const { image, filename } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Handle data URL (data:image/png;base64,...)
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let ext = 'jpg';

    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('gif')) ext = 'gif';
      else ext = 'jpg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(image, 'base64');
    }

    // Limit image size to 10MB
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image size exceeds maximum 10MB limit' });
    }

    const uniqueId = 'mem_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex') + '.' + ext;
    const targetPath = path.resolve(UPLOADS_DIR, uniqueId);

    fs.writeFileSync(targetPath, buffer);

    const publicUrl = `/api/uploads/${uniqueId}`;
    res.json({
      id: uniqueId,
      url: publicUrl,
      filename: filename || uniqueId,
    });
  } catch (err) {
    console.error('Image upload failed:', err);
    res.status(500).json({ error: 'Failed to process image upload. Please try again.' });
  }
});

// Serve uploaded images statically
app.get('/api/uploads/:filename', (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.resolve(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }

  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(filePath);
});

// --- Vite or Static Serving ---
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Ash’s Archive server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

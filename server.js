require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const db = new sqlite3.Database(process.env.DB_PATH);
const cors = require('cors');
const app = express();
const port = 3000;
const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server);

const activeUsers = new Map();
const chatHistory = new Map();

const activeTypers = new Map();
const MAX_HISTORY = 100; // Keep last 100 messages per chat

const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10; // Standard recommendation

const CAL_API_KEY = 'cal_live_80a4664b1ede141f895c18c8890c4b6c';

const crypto = require('crypto');

//optimization
const compression = require('compression');
const helmet = require('helmet');

//image
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/brands')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '-'))
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB limit
    },
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|webp|svg/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed!'));
    }
});


const ALLOWED_DOMAINS = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com'
];

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 requests per hour
    message: { error: 'Too many password reset attempts. Please try again later.' }
});

//change this based on what server
const BASE_URL = process.env.BASE_URL;
if (!BASE_URL) {
    console.warn('WARNING: BASE_URL not set in environment variables. Using default value.');
}

const defaultBaseUrl = 'http://192.168.68.121:3000/';
const baseUrl = BASE_URL || defaultBaseUrl;

// Ensure trailing slash is consistent
const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('user_connected', (userData) => {
        const user = JSON.parse(userData);
        activeUsers.set(socket.id, {
            id: user.id,
            username: user.username,
            role: user.role,
            lastActive: new Date()
        });
        
        // Broadcast updated active users count
        io.emit('active_users_update', Array.from(activeUsers.values()));
    });

    socket.on('disconnect', () => {
        if (activeUsers.has(socket.id)) {
            activeUsers.delete(socket.id);
            // Broadcast updated count
            io.emit('active_users_update', Array.from(activeUsers.values()));
        }
    });

    // Add heartbeat to keep track of active users
    socket.on('heartbeat', () => {
        if (activeUsers.has(socket.id)) {
            const userData = activeUsers.get(socket.id);
            userData.lastActive = new Date();
            activeUsers.set(socket.id, userData);
        }
    });
});

app.use(compression());
app.use(helmet());

app.use((req, res, next) => {
    // Static assets cache
    if (req.url.match(/\.(css|js|jpg|png|gif|ico)$/)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    } else {
      // Dynamic content
      res.setHeader('Cache-Control', 'public, max-age=0');
    }
    next();
  });
  
// Security Headers Middleware
app.use((req, res, next) => {
    // Prevent clickjacking attacks
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://app.cal.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.cal.com",
        "frame-src 'self' https://app.cal.com"
    ].join('; '));

    // HSTS - only add if you have HTTPS configured
    if (req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
});

function isValidEmail(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    return ALLOWED_DOMAINS.includes(domain);
}

// Generate secure random token
function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Create verification token for user
async function createVerificationToken(userId) {
    const token = generateVerificationToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // 24 hour expiry

    return new Promise((resolve, reject) => {
        const stmt = db.prepare(`
            INSERT INTO verification_tokens (user_id, token, expires_at)
            VALUES (?, ?, ?)
        `);
        
        stmt.run([userId, token, expires.toISOString()], function(err) {
            if (err) reject(err);
            resolve(token);
        });
        stmt.finalize();
    });
}

// Verify token
async function verifyToken(token) {
    return new Promise((resolve, reject) => {
        db.get(`
            SELECT vt.*, u.email 
            FROM verification_tokens vt
            JOIN users u ON u.id = vt.user_id
            WHERE vt.token = ? 
            AND vt.used = 0
            AND vt.expires_at > CURRENT_TIMESTAMP
        `, [token], (err, row) => {
            if (err) reject(err);
            resolve(row);
        });
    });
}

async function getChatHistory(roomId) {
    return chatHistory.get(roomId) || [];
}

// Create database folder if it doesn't exist
const DB_PATH = path.join(__dirname, 'data', 'database.sqlite');

// Configure CORS to allow requests from live server
app.use(cors({
    origin: [
        'http://192.168.68.121:3000',
        'http://192.168.68.121:5500',
        'http://192.168.68.121:5501',
        'http://192.168.254.105:3000',
        'http://localhost:3000',
        'http://localhost:5500',
        'http://localhost:5501'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Other middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database', err);
        return;
    }
    console.log('Connected to SQLite database');

    // Create tables
    db.serialize(() => {
        

        db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date)`);

        // Create users table if not exists
        db.run(`CREATE TABLE IF NOT EXISTS brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            logo TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (brand_id) REFERENCES brands (id)
        )`);

        // FAQ Categories Table
    db.run(`CREATE TABLE IF NOT EXISTS faq_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        display_order INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // FAQ Questions Table
    db.run(`CREATE TABLE IF NOT EXISTS faq_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        display_order INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES faq_categories (id)
    )`);

        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS contact_submissions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                message TEXT,
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);
        });

        db.run(`CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone_number TEXT,
            booking_date DATETIME NOT NULL,
            inquiry TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            cal_booking_id TEXT UNIQUE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS verification_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            used INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            used INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT,
            fullName TEXT,
            mobile TEXT,
            address TEXT,
            province TEXT,
            city TEXT,
            zipCode TEXT,
            role TEXT NOT NULL DEFAULT 'member',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            email_verified INTEGER DEFAULT 0,
            verification_token TEXT,
            token_expiry DATETIME
        )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err);
                return;
            }
            
            // Check if admin exists before creating
            db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, user) => {
                if (err) {
                    console.error('Error checking admin:', err);
                    return;
                }
                
                // Only create admin if it doesn't exist
                if (!user) {
                    const stmt = db.prepare(`
                        INSERT INTO users (username, email, password, fullName, role)
                        VALUES (?, ?, ?, ?, ?)
                    `);
                    
                    stmt.run(['admin', 'admin@example.com', 'admin123', 'System Administrator', 'admin'], 
                        function(err) {
                            if (err) {
                                console.error('Error creating admin:', err);
                            } else {
                                console.log('Initial admin account created');
                            }
                            stmt.finalize();
                        }
                    );
                }
            });
        });
        
    });
});

// Admin middleware
const requireAdmin = (req, res, next) => {
    try {
        const token = req.cookies.token; // If you're using cookie-based auth
        // Or from Authorization header if using token-based auth
        const user = verifyUser(token); // Your verification function
        
        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication required' });
    }
};

// Apply to dashboard routes
app.get('/dashboard', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve the verification page
app.get('/verify-email', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verify-email.html'));
});

// Update your verification endpoint
app.get('/api/verify-email', async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
    }

    try {
        // Check token in database
        db.get(
            'SELECT * FROM users WHERE verification_token = ? AND token_expiry > CURRENT_TIMESTAMP',
            [token],
            async (err, user) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!user) {
                    return res.status(400).json({ error: 'Invalid or expired verification token' });
                }

                // Update user verification status
                db.run(
                    'UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?',
                    [user.id],
                    (err) => {
                        if (err) {
                            console.error('Update error:', err);
                            return res.status(500).json({ error: 'Failed to verify email' });
                        }

                        res.json({
                            success: true,
                            message: 'Email verified successfully. You can now log in.'
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Failed to verify email' });
    }
});

app.post('/api/register', async (req, res) => {
    const { username, email, password, confirmPassword, fullName, mobile, address, province, city, zipCode, role } = req.body;

    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    // Check password match
    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
            error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number' 
        });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Domain validation
    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const domain = email.split('@')[1].toLowerCase();
    if (!allowedDomains.includes(domain)) {
        return res.status(400).json({ 
            error: 'Please use a valid email provider (Gmail, Yahoo, Outlook, or Hotmail)' 
        });
    }

    try {
        // Check if user already exists
        db.get('SELECT email FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            if (existingUser) {
                return res.status(400).json({ error: 'Email already registered' });
            }

            try {
                // Generate verification token
                const verificationToken = crypto.randomBytes(32).toString('hex');
                const tokenExpiry = new Date();
                tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hour expiry

                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);

                // Start transaction
                db.serialize(() => {
                    db.run('BEGIN TRANSACTION');

                    // Insert user
                    const stmt = db.prepare(`
                        INSERT INTO users (
                            username, 
                            email, 
                            password, 
                            fullName, 
                            mobile, 
                            address, 
                            province, 
                            city, 
                            zipCode, 
                            role,
                            email_verified,
                            verification_token,
                            token_expiry
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `);

                    stmt.run([
                        username,
                        email,
                        hashedPassword,
                        fullName || null,
                        mobile || null,
                        address || null,
                        province || null,
                        city || null,
                        zipCode || null,
                        role || 'member',
                        0, // email_verified
                        verificationToken,
                        tokenExpiry.toISOString()
                    ], async function(err) {
                        if (err) {
                            console.error('Insert error:', err);
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Failed to create user' });
                        }

                        try {
                            // Send verification email
                            const verificationLink = `${normalizedBaseUrl}verify-email?token=${verificationToken}`;
                            
                            const mailOptions = {
                                from: process.env.EMAIL_USER,
                                to: email,
                                subject: 'Verify your email address - FG Cabahug Trading',
                                html: `
                                    <h2>Welcome to FG Cabahug Trading!</h2>
                                    <p>Please verify your email address by clicking the link below:</p>
                                    <p><a href="${verificationLink}" style="
                                        display: inline-block;
                                        padding: 10px 20px;
                                        background-color: #105231;
                                        color: white;
                                        text-decoration: none;
                                        border-radius: 5px;
                                        margin: 20px 0;">Verify Email Address</a></p>
                                    <p>Or copy and paste this link in your browser:</p>
                                    <p>${verificationLink}</p>
                                    <p>This link will expire in 24 hours.</p>
                                    <p><small>If you didn't create an account, please ignore this email.</small></p>
                                `
                            };

                            await transporter.sendMail(mailOptions);
                            
                            // Commit transaction
                            db.run('COMMIT');
                            
                            res.json({ 
                                success: true,
                                message: 'Registration successful! Please check your email to verify your account.'
                            });
                        } catch (error) {
                            console.error('Email error:', error);
                            db.run('ROLLBACK');
                            res.status(500).json({ error: 'Failed to send verification email' });
                        }
                    });
                    stmt.finalize();
                });
            } catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({ error: 'Server error during registration' });
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ error: 'Email/Username and password required' });
    }

    try {
        // Check if input is email or username
        const isEmail = email.includes('@');
        
        // Get user from database using either email or username
        const query = isEmail ? 
            'SELECT * FROM users WHERE email = ?' : 
            'SELECT * FROM users WHERE username = ?';
        
        db.get(query, [email], async (err, user) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }

            // Generic error message to prevent user enumeration
            const invalidCredentialsMessage = 'Invalid credentials';

            if (!user) {
                return res.status(401).json({ error: invalidCredentialsMessage });
            }

            try {
                // Verify password
                const validPassword = await bcrypt.compare(password, user.password);
                
                if (!validPassword) {
                    return res.status(401).json({ error: invalidCredentialsMessage });
                }

                // Check email verification
                if (!user.email_verified) {
                    // Check if verification token is expired
                    const tokenExpired = new Date(user.token_expiry) < new Date();
                    
                    if (tokenExpired) {
                        // Generate new verification token
                        const newToken = crypto.randomBytes(32).toString('hex');
                        const newExpiry = new Date();
                        newExpiry.setHours(newExpiry.getHours() + 24);

                        // Update token in database
                        db.run(`
                            UPDATE users 
                            SET verification_token = ?, token_expiry = ? 
                            WHERE id = ?
                        `, [newToken, newExpiry.toISOString(), user.id]);

                        // Send new verification email
                        const verificationLink = `${process.env.BASE_URL}/verify-email?token=${newToken}`;
                        await transporter.sendMail({
                            from: process.env.EMAIL_USER,
                            to: user.email,
                            subject: 'Verify your email address - FG Cabahug Trading',
                            html: `
                                <h2>Email Verification Required</h2>
                                <p>Please verify your email address by clicking the link below:</p>
                                <p><a href="${verificationLink}">Verify Email Address</a></p>
                                <p>This link will expire in 24 hours.</p>
                            `
                        });
                    }

                    return res.status(403).json({ 
                        error: 'Please verify your email address before logging in. Check your email for the verification link.' 
                    });
                }

                // Create user response object without sensitive data
                const userResponse = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role
                };

                res.json({ 
                    success: true,
                    user: userResponse
                });

            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ error: 'Server error during login' });
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


// Get all users (admin only)
app.get('/api/users', (req, res) => {
    db.all(`SELECT 
        id, username, email, fullName, mobile, 
        address, province, city, zipCode, role, 
        created_at as joinDate 
        FROM users 
        ORDER BY created_at DESC`, [], (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(users);
    });
});

// Delete user (admin only)
app.delete('/api/users/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // Prevent deleting the last admin
    db.get('SELECT COUNT(*) as adminCount FROM users WHERE role = "admin"', [], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (user.role === 'admin' && result.adminCount <= 1) {
                return res.status(400).json({ error: 'Cannot delete the last admin user' });
            }

            db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to delete user' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'User not found' });
                }
                res.json({ success: true });
            });
        });
    });
});

// Update user role (admin only)
app.put('/api/users/:userId/role', (req, res) => {
    const userId = req.params.userId;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    // Prevent removing the last admin
    db.get('SELECT COUNT(*) as adminCount FROM users WHERE role = "admin"', [], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (user.role === 'admin' && role !== 'admin' && result.adminCount <= 1) {
                return res.status(400).json({ error: 'Cannot remove the last admin' });
            }

            db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update user role' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'User not found' });
                }
                res.json({ success: true });
            });
        });
    });
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // limit each IP to 5 requests per windowMs
});

app.use('/api/send-email', limiter);

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

// Basic route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        // Validate inputs
        if (!name || !email || !phone || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Email content lydiaskitchenresto@gmail.com
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'tebithegamer@gmail.com', // Replace with your email
            subject: 'New Contact Form Submission',
            text: `
                Name: ${name}
                Email: ${email}
                Phone: ${phone}
                
                Message:
                ${message}
            `,
            replyTo: email
        };

        // Send email
        await transporter.sendMail(mailOptions);
        res.json({ success: true });

    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// Reviews file path
const REVIEWS_FILE = path.join(__dirname, 'data', 'reviews.json');

// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = path.join(__dirname, 'data');
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir);
    }
}

// Initialize reviews file if it doesn't exist
async function initializeReviewsFile() {
    try {
        await fs.access(REVIEWS_FILE);
    } catch {
        await fs.writeFile(REVIEWS_FILE, JSON.stringify([]));
    }
}

// Rate limiter for reviews submission
const reviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 reviews per hour
    message: { error: 'Too many reviews submitted. Please try again later.' }
});

// Initialize data storage
(async () => {
    await ensureDataDir();
    await initializeReviewsFile();
})();

// Middleware for parsing JSON with size limit
app.use(express.json({ limit: '10kb' }));

// Brand and Product endpoints
app.get('/api/brands', (req, res) => {
    db.all('SELECT * FROM brands ORDER BY name', [], (err, brands) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(brands);
    });
});

app.post('/api/brands', upload.single('logo'), (req, res) => {
    const { name, description, type } = req.body;
    const logo = req.file ? req.file.filename : null;
    
    if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
    }

    const stmt = db.prepare('INSERT INTO brands (name, description, type, logo) VALUES (?, ?, ?, ?)');
    stmt.run([name, description, type, logo], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to create brand' });
        }
        res.json({ 
            success: true, 
            brandId: this.lastID 
        });
    });
    stmt.finalize();
});

app.get('/api/brands/:brandId/products', (req, res) => {
    const brandId = req.params.brandId;
    
    db.get('SELECT * FROM brands WHERE id = ?', [brandId], (err, brand) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!brand) {
            return res.status(404).json({ error: 'Brand not found' });
        }
        
        db.all('SELECT * FROM products WHERE brand_id = ?', [brandId], (err, products) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ brand, products });
        });
    });
});

app.post('/api/brands/:brandId/products', (req, res) => {
    const brandId = req.params.brandId;
    const { name, description } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Product name is required' });
    }

    const stmt = db.prepare('INSERT INTO products (brand_id, name, description) VALUES (?, ?, ?)');
    stmt.run([brandId, name, description], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to create product' });
        }
        res.json({ 
            success: true, 
            productId: this.lastID 
        });
    });
    stmt.finalize();
});

// Update a brand
app.put('/api/brands/:brandId', upload.single('logo'), (req, res) => {
    const brandId = req.params.brandId;
    const { name, description, type } = req.body;
    
    if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' });
    }

    let query = 'UPDATE brands SET name = ?, description = ?, type = ?';
    let params = [name, description, type];

    // If a new logo was uploaded, update it
    if (req.file) {
        query += ', logo = ?';
        params.push(req.file.filename);
    }

    query += ' WHERE id = ?';
    params.push(brandId);

    const stmt = db.prepare(query);
    stmt.run(params, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update brand' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Brand not found' });
        }
        res.json({ success: true });
    });
    stmt.finalize();
});

// Update a product
app.put('/api/brands/:brandId/products/:productId', (req, res) => {
    const { brandId, productId } = req.params;
    const { name, description } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Product name is required' });
    }

    const stmt = db.prepare('UPDATE products SET name = ?, description = ? WHERE id = ? AND brand_id = ?');
    stmt.run([name, description, productId, brandId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update product' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true });
    });
    stmt.finalize();
});

// Delete a product
app.delete('/api/brands/:brandId/products/:productId', (req, res) => {
    const { brandId, productId } = req.params;
    
    db.run('DELETE FROM products WHERE id = ? AND brand_id = ?', [productId, brandId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete product' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true });
    });
});

// Delete a brand and all its products
app.delete('/api/brands/:brandId', (req, res) => {
    const { brandId } = req.params;
    
    db.serialize(() => {
        // First delete all products of this brand
        db.run('DELETE FROM products WHERE brand_id = ?', [brandId], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete brand products' });
            }
            
            // Then delete the brand
            db.run('DELETE FROM brands WHERE id = ?', [brandId], function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to delete brand' });
                }
                if (this.changes === 0) {
                    return res.status(404).json({ error: 'Brand not found' });
                }
                res.json({ success: true });
            });
        });
    });
});

// Reviews endpoints
app.get('/api/reviews', async (req, res) => {
    try {
        const reviewsData = await fs.readFile(REVIEWS_FILE, 'utf8');
        const reviews = JSON.parse(reviewsData);
        // Sort reviews by date (newest first)
        reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        // Return only the most recent 50 reviews
        res.json(reviews.slice(0, 50));
    } catch (error) {
        console.error('Error reading reviews:', error);
        res.status(500).json({ error: 'Failed to load reviews' });
    }
});

app.get('/reviews', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'review.html'));
});

app.post('/api/reviews', reviewLimiter, async (req, res) => {
    try {
        const { rating, name, email, serviceType, review } = req.body;

        // Validate required fields
        if (!rating || !name || !email || !serviceType || !review) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Invalid rating value' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Validate service type
        const validServices = ['tinting', 'ppf', 'both'];
        if (!validServices.includes(serviceType)) {
            return res.status(400).json({ error: 'Invalid service type' });
        }

        // Read existing reviews
        const reviewsData = await fs.readFile(REVIEWS_FILE, 'utf8');
        const reviews = JSON.parse(reviewsData);

        // Create new review object
        const newReview = {
            id: Date.now().toString(),
            rating: parseInt(rating),
            name: name.trim(),
            email: email.trim(),
            serviceType,
            review: review.trim(),
            date: new Date().toISOString()
        };

        // Add to reviews array
        reviews.unshift(newReview);

        // Keep only the most recent 1000 reviews
        const trimmedReviews = reviews.slice(0, 1000);

        // Save back to file
        await fs.writeFile(REVIEWS_FILE, JSON.stringify(trimmedReviews, null, 2));

        res.status(201).json({ success: true, review: newReview });
    } catch (error) {
        console.error('Error saving review:', error);
        res.status(500).json({ error: 'Failed to save review' });
    }
});

// Add API endpoint for contact form
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Required fields missing' });
    }

    try {
        // First save to database
        const stmt = db.prepare(`
            INSERT INTO contact_submissions (name, email, phone, message)
            VALUES (?, ?, ?, ?)
        `);

        stmt.run([name, email, phone, message]);
        stmt.finalize();

        // Then send email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'tebithegamer@gmail.com', // Your email address
            subject: 'New Contact Form Submission',
            text: `
                Name: ${name}
                Email: ${email}
                Phone: ${phone}
                
                Message:
                ${message}
            `,
            replyTo: email
        };

        await transporter.sendMail(mailOptions);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process submission' });
    }
});

// Add API endpoint for dashboard metrics
app.get('/api/dashboard/metrics', async (req, res) => {
    try {
        db.all(`
            SELECT 
                (SELECT COUNT(*) FROM users) as userCount,
                (SELECT COUNT(*) FROM products) as productCount,
                (SELECT COUNT(*) FROM contact_submissions) as inquiryCount
        `, [], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch metrics' });
            }
            res.json(result[0]); // Send the first (and only) row
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

app.get('/api/cal/bookings', async (req, res) => {
    try {
        const response = await fetch('https://api.cal.com/v2/bookings', {
            headers: {
                'Authorization': `Bearer ${CAL_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        const responseData = await response.json();
        console.log('Cal.com API response:', responseData);

        if (!responseData.data || !responseData.data.bookings) {
            console.error('Unexpected API response format:', responseData);
            return res.status(500).json({ error: 'Invalid API response format' });
        }

        const bookings = responseData.data.bookings;

        // Insert into database
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO bookings (
                full_name, email, phone_number, booking_date, inquiry, status, cal_booking_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const booking of bookings) {
            if (booking.attendees && booking.attendees.length > 0) {
                const attendee = booking.attendees[0];
                const phoneNumber = booking.responses?.['phone-number'] || attendee.phone || 'N/A';
                const inquiry = booking.responses?.['inquiry'] || 'No inquiry provided';
                stmt.run([
                    attendee.name || 'No Name',
                    attendee.email || 'No Email',
                    phoneNumber,
                    booking.startTime,
                    inquiry,
                    'pending',
                    booking.id
                ]);
            }
        }
        
        stmt.finalize();

        // Return all bookings from database
        db.all('SELECT * FROM bookings ORDER BY booking_date DESC', [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(rows);
        });

    } catch (error) {
        console.error('Error fetching Cal.com bookings:', error);
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

// Update booking status
app.put('/api/bookings/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    db.run('UPDATE bookings SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update status' });
        }
        res.json({ success: true });
    });
});

// Delete booking
app.delete('/api/bookings/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM bookings WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete booking' });
        }
        res.json({ success: true });
    });
});

app.delete('/api/reviews/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Read existing reviews
        const reviewsData = await fs.readFile(REVIEWS_FILE, 'utf8');
        const reviews = JSON.parse(reviewsData);

        // Find index of review to delete
        const reviewIndex = reviews.findIndex(review => review.id === id);

        if (reviewIndex === -1) {
            return res.status(404).json({ error: 'Review not found' });
        }

        // Remove the review
        reviews.splice(reviewIndex, 1);

        // Save updated reviews
        await fs.writeFile(REVIEWS_FILE, JSON.stringify(reviews, null, 2));

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});

// FAQ API Endpoints
app.get('/api/faq', (req, res) => {
    db.all(`
        SELECT 
            c.id as category_id,
            c.name as category_name,
            q.id as question_id,
            q.question,
            q.answer,
            q.display_order
        FROM faq_categories c
        LEFT JOIN faq_questions q ON c.id = q.category_id
        ORDER BY c.display_order, q.display_order
    `, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        // Group by category
        const faqData = rows.reduce((acc, row) => {
            if (!acc[row.category_id]) {
                acc[row.category_id] = {
                    id: row.category_id,
                    name: row.category_name,
                    questions: []
                };
            }
            if (row.question_id) {
                acc[row.category_id].questions.push({
                    id: row.question_id,
                    question: row.question,
                    answer: row.answer,
                    displayOrder: row.display_order
                });
            }
            return acc;
        }, {});

        res.json(Object.values(faqData));
    });
});

// Admin endpoints for FAQ management
app.post('/api/faq/categories', (req, res) => {
    const { name } = req.body;
    
    db.get('SELECT MAX(display_order) as maxOrder FROM faq_categories', [], (err, row) => {
        const newOrder = (row.maxOrder || 0) + 1;
        
        const stmt = db.prepare('INSERT INTO faq_categories (name, display_order) VALUES (?, ?)');
        stmt.run([name, newOrder], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to create category' });
            }
            res.json({ id: this.lastID, name, displayOrder: newOrder });
        });
        stmt.finalize();
    });
});

app.post('/api/faq/questions', (req, res) => {
    const { categoryId, question, answer } = req.body;
    
    db.get('SELECT MAX(display_order) as maxOrder FROM faq_questions WHERE category_id = ?', 
        [categoryId], (err, row) => {
        const newOrder = (row.maxOrder || 0) + 1;
        
        const stmt = db.prepare(`
            INSERT INTO faq_questions (category_id, question, answer, display_order) 
            VALUES (?, ?, ?, ?)`
        );
        stmt.run([categoryId, question, answer, newOrder], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to create question' });
            }
            res.json({ 
                id: this.lastID, 
                categoryId, 
                question, 
                answer, 
                displayOrder: newOrder 
            });
        });
        stmt.finalize();
    });
});

// Edit FAQ category
app.put('/api/faq/categories/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    
    db.run('UPDATE faq_categories SET name = ? WHERE id = ?', [name, id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update category' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ success: true });
    });
});

// Delete FAQ category
app.delete('/api/faq/categories/:id', (req, res) => {
    const { id } = req.params;
    
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // First delete all questions in this category
        db.run('DELETE FROM faq_questions WHERE category_id = ?', [id], (err) => {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Failed to delete questions' });
            }
            
            // Then delete the category
            db.run('DELETE FROM faq_categories WHERE id = ?', [id], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Failed to delete category' });
                }
                
                db.run('COMMIT');
                res.json({ success: true });
            });
        });
    });
});

// Edit FAQ question
app.put('/api/faq/questions/:id', (req, res) => {
    const { id } = req.params;
    const { question, answer } = req.body;
    
    db.run('UPDATE faq_questions SET question = ?, answer = ? WHERE id = ?', 
        [question, answer, id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to update question' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }
        res.json({ success: true });
    });
});

// Delete FAQ question
app.delete('/api/faq/questions/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM faq_questions WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete question' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }
        res.json({ success: true });
    });
});

app.put('/api/users/settings', async (req, res) => {
    const { username, fullName, mobile, address, city, province, zipCode, currentPassword, newPassword } = req.body;
    
    try {
        // Get current user from the database
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // If changing password, verify current password
            if (currentPassword && newPassword) {
                const validPassword = await bcrypt.compare(currentPassword, user.password);
                if (!validPassword) {
                    return res.status(400).json({ error: 'Current password is incorrect' });
                }
                
                // Hash new password
                const hashedPassword = await bcrypt.hash(newPassword, 10);
                user.password = hashedPassword;
            }

            // Update user information
            const updateQuery = `
                UPDATE users 
                SET fullName = ?, mobile = ?, address = ?, 
                    city = ?, province = ?, zipCode = ?
                    ${currentPassword ? ', password = ?' : ''}
                WHERE username = ?
            `;

            const params = [
                fullName,
                mobile,
                address,
                city,
                province,
                zipCode
            ];

            if (currentPassword) {
                params.push(user.password);
            }
            params.push(username);

            db.run(updateQuery, params, function(err) {
                if (err) {
                    console.error('Update error:', err);
                    return res.status(500).json({ error: 'Failed to update settings' });
                }
                
                res.json({ 
                    success: true,
                    message: 'Settings updated successfully'
                });
            });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Request password reset
app.post('/api/request-password-reset', passwordResetLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        // Check if user exists
        db.get('SELECT id, email_verified FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            // Don't reveal if user exists or not
            if (!user || !user.email_verified) {
                return res.json({ 
                    success: true, 
                    message: 'If an account exists with this email, you will receive a password reset link.' 
                });
            }

            // Generate reset token
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date();
            expires.setHours(expires.getHours() + 1); // 1 hour expiry

            // Save token to database
            const stmt = db.prepare(`
                INSERT INTO password_reset_tokens (user_id, token, expires_at)
                VALUES (?, ?, ?)
            `);

            stmt.run([user.id, token, expires.toISOString()], async function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to create reset token' });
                }

                // Send reset email
                const resetLink = `${normalizedBaseUrl}reset-password?token=${token}`;
                
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: email,
                    subject: 'Password Reset Request - FG Cabahug Trading',
                    html: `
                        <h2>Password Reset Request</h2>
                        <p>A password reset was requested for your account. Click the link below to reset your password:</p>
                        <p><a href="${resetLink}" style="
                            display: inline-block;
                            padding: 10px 20px;
                            background-color: #105231;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                            margin: 20px 0;">Reset Password</a></p>
                        <p>This link will expire in 1 hour.</p>
                        <p><small>If you didn't request this reset, please ignore this email.</small></p>
                    `
                };

                await transporter.sendMail(mailOptions);

                res.json({
                    success: true,
                    message: 'If an account exists with this email, you will receive a password reset link.'
                });
            });
            stmt.finalize();
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
});

// Reset password with token
app.post('/api/reset-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    try {
        // Verify token
        db.get(`
            SELECT rt.*, u.id as user_id 
            FROM password_reset_tokens rt
            JOIN users u ON u.id = rt.user_id
            WHERE rt.token = ? 
            AND rt.used = 0
            AND rt.expires_at > CURRENT_TIMESTAMP
        `, [token], async (err, resetToken) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!resetToken) {
                return res.status(400).json({ error: 'Invalid or expired reset token' });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Update password and mark token as used
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                db.run('UPDATE users SET password = ? WHERE id = ?', 
                    [hashedPassword, resetToken.user_id]);

                db.run('UPDATE password_reset_tokens SET used = 1 WHERE id = ?',
                    [resetToken.id]);

                db.run('COMMIT', (err) => {
                    if (err) {
                        console.error('Transaction error:', err);
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Failed to update password' });
                    }

                    res.json({
                        success: true,
                        message: 'Password has been reset successfully'
                    });
                });
            });
        });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// Single server.listen call
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

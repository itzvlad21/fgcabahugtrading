const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Import your DB_PATH
const DB_PATH = path.join(__dirname, 'data', 'database.sqlite');

function initializeDatabase() {
    const db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('Error opening database', err);
            return;
        }
        console.log('Connected to SQLite database');

        // Create indexes and tables
        db.serialize(() => {
            // Create indexes
            db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id)`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date)`);

            // Create tables
            const tables = [
                // Brands table
                `CREATE TABLE IF NOT EXISTS brands (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    type TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    logo TEXT
                )`,

                // Products table
                `CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    brand_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    description TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (brand_id) REFERENCES brands (id)
                )`,

                // FAQ Categories table
                `CREATE TABLE IF NOT EXISTS faq_categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    display_order INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,

                // FAQ Questions table
                `CREATE TABLE IF NOT EXISTS faq_questions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    category_id INTEGER NOT NULL,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    display_order INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES faq_categories (id)
                )`,

                // Contact submissions table
                `CREATE TABLE IF NOT EXISTS contact_submissions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone TEXT,
                    message TEXT,
                    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,

                // Bookings table
                `CREATE TABLE IF NOT EXISTS bookings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    full_name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    phone_number TEXT,
                    booking_date DATETIME NOT NULL,
                    inquiry TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    cal_booking_id TEXT UNIQUE
                )`,

                // Verification tokens table
                `CREATE TABLE IF NOT EXISTS verification_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    token TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at DATETIME NOT NULL,
                    used INTEGER DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )`,

                // Password reset tokens table
                `CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    token TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    expires_at DATETIME NOT NULL,
                    used INTEGER DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )`,

                // Users table
                `CREATE TABLE IF NOT EXISTS users (
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
                )`
            ];

            // Execute each table creation query
            tables.forEach(table => {
                db.run(table, (err) => {
                    if (err) {
                        console.error('Error creating table:', err);
                    }
                });
            });

            // Create initial admin user if not exists
            createAdminIfNotExists(db);
        });
    });

    return db;
}

function createAdminIfNotExists(db) {
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], (err, user) => {
        if (err) {
            console.error('Error checking admin:', err);
            return;
        }
        
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
}

module.exports = {
    initializeDatabase,
    DB_PATH
};

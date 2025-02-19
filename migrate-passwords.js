const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'database.sqlite');
const SALT_ROUNDS = 10;

const db = new sqlite3.Database(DB_PATH);

async function migratePasswords() {
    try {
        // Get all users
        db.all('SELECT id, password FROM users', async (err, users) => {
            if (err) {
                console.error('Error fetching users:', err);
                process.exit(1);
            }

            console.log(`Found ${users.length} users to migrate`);

            for (const user of users) {
                // Only hash if password isn't already hashed
                if (!user.password.startsWith('$2b$')) {
                    const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
                    
                    // Update user's password
                    db.run('UPDATE users SET password = ? WHERE id = ?', 
                        [hashedPassword, user.id],
                        (err) => {
                            if (err) {
                                console.error(`Error updating user ${user.id}:`, err);
                            } else {
                                console.log(`Updated password for user ${user.id}`);
                            }
                        }
                    );
                }
            }

            console.log('Migration completed');
        });
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migratePasswords();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
const dbPath = path.resolve(__dirname, 'database', 'ecommerce.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// --- API ROUTES ---

// 1. Authentication

// Register
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
        db.run(sql, [username, email, hashedPassword], function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: "Username or email already exists" });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "User registered successfully", userId: this.lastID });
        });
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ?";
    db.get(sql, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(400).json({ error: "User not found" });

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            // In a real app, use JWT here. For simplicity, returning user info.
            res.json({ message: "Login successful", user: { id: user.id, username: user.username, email: user.email } });
        } else {
            res.status(400).json({ error: "Invalid credentials" });
        }
    });
});

// 2. Products

// Get All Products
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// Get Single Product
app.get('/api/products/:id', (req, res) => {
    const sql = "SELECT * FROM products WHERE id = ?";
    db.get(sql, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Product not found" });
        res.json({ data: row });
    });
});

// 3. Orders

// Place Order
app.post('/api/orders', (req, res) => {
    const { userId, items, total } = req.body; // items = [{ productId, quantity, price }]

    if (!userId || !items || items.length === 0) {
        return res.status(400).json({ error: "Invalid order data" });
    }

    const date = new Date().toISOString();

    // Start transaction (serialized)
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        const insertOrder = "INSERT INTO orders (user_id, total, date) VALUES (?, ?, ?)";
        db.run(insertOrder, [userId, total, date], function (err) {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: err.message });
            }

            const orderId = this.lastID;
            const insertItem = "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)";
            const stmt = db.prepare(insertItem);

            items.forEach(item => {
                stmt.run([orderId, item.productId, item.quantity, item.price]);
            });

            stmt.finalize((err) => {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: err.message });
                }
                db.run("COMMIT");
                res.json({ message: "Order placed successfully", orderId });
            });
        });
    });
});

// Get User Orders
app.get('/api/orders/:userId', (req, res) => {
    const sql = "SELECT * FROM orders WHERE user_id = ?";
    db.all(sql, [req.params.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

// Serve frontend (handled by express.static)
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

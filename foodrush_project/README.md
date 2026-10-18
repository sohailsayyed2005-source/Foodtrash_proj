# 🔥 FoodRush — Full Stack Food Delivery Website

A fully animated, production-grade food delivery website built with **PHP backend** and **HTML/CSS/JS frontend**.

---

## 🗂 Project Structure

```
foodrush/
├── index.html          # Main frontend page
├── css/
│   └── style.css       # Full stylesheet (animations, responsive)
├── js/
│   └── app.js          # Frontend logic (cart, search, API calls)
└── php/
    ├── api.php          # Main REST API (menu, orders, restaurants)
    ├── auth.php         # User authentication (register/login)
    └── schema.sql       # MySQL database schema + seed data
```

---

## ⚡ Features

### Frontend
- 🎨 **Bold dark theme** with fire-orange accents
- 🖱️ **Custom animated cursor** with trail effect
- 📱 **Fully responsive** (mobile, tablet, desktop)
- 🧠 **Animated hero** with floating food emojis + phone mockup
- 🔡 **Infinite ticker** showing food categories
- 🔍 **Live search overlay** with real-time filtering
- 🛒 **Cart sidebar** with qty controls + coupon system
- 🎉 **Order success modal** with animated progress steps
- 🔔 **Toast notifications** for all actions
- 📜 **Scroll-reveal animations** on all sections
- ⏱️ **Offer countdown timer**
- ❤️ **Favourites system**
- 💫 **Parallax blobs** on hero section

### Backend (PHP)
- 📋 **Menu API** — fetch all dishes with categories
- 🏪 **Restaurants API** — top restaurants near you
- 📦 **Orders API** — place & track orders
- 🔍 **Search API** — query dishes by name/category
- ⭐ **Reviews API** — customer testimonials
- 🔐 **Auth system** — register, login, session management
- 🗄️ **MySQL schema** — complete relational database design

---

## 🚀 Setup Instructions

### Option A: Static (No PHP Server)
Just open `index.html` in a browser. The app uses **built-in mock data** when no PHP server is detected — all features work!

### Option B: Full Stack with PHP

#### Prerequisites
- PHP 8.0+
- MySQL 5.7+ or MariaDB
- Apache/Nginx (or use PHP's built-in server)

#### Steps

1. **Set up the database:**
   ```sql
   mysql -u root -p < php/schema.sql
   ```

2. **Update DB credentials** in `php/api.php`:
   ```php
   private $host = 'localhost';
   private $db   = 'foodrush';
   private $user = 'root';
   private $pass = 'your_password';
   ```

3. **Start PHP server:**
   ```bash
   cd foodrush
   php -S localhost:8080
   ```

4. **Open** `http://localhost:8080` in your browser.

#### Using XAMPP/WAMP/LAMP
- Copy the `foodrush/` folder to your `htdocs` or `www` directory
- Start Apache + MySQL
- Import `php/schema.sql` via phpMyAdmin
- Visit `http://localhost/foodrush`

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Primary (Fire) | `#FF4D00` |
| Secondary (Gold) | `#FFB830` |
| Background | `#0A0F1E` |
| Card | `#151D35` |
| Font Heading | Syne (800) |
| Font Body | DM Sans |

---

## 🛒 Coupon Codes (Demo)

| Code | Discount | Min Order |
|------|----------|-----------|
| `FIRST50` | 50% off | ₹200 |
| `FLAT100` | ₹100 off | ₹500 |
| `WELCOME30` | 30% off | No min |

---

## 📡 API Reference

```
GET  php/api.php?action=menu              → All menu items
GET  php/api.php?action=restaurants       → Restaurant list
GET  php/api.php?action=search&q=pizza    → Search
GET  php/api.php?action=reviews           → Reviews
POST php/api.php?action=place_order       → Place order
GET  php/api.php?action=track_order       → Track order

POST php/auth.php  { action: 'register' } → Register user
POST php/auth.php  { action: 'login' }    → Login
POST php/auth.php  { action: 'logout' }   → Logout
POST php/auth.php  { action: 'me' }       → Get current user
```

---

## 🤝 Tech Stack

- **Frontend:** HTML5, CSS3 (animations, variables, grid/flex), Vanilla JS (ES6+)
- **Backend:** PHP 8 (PDO, sessions, REST API)
- **Database:** MySQL (relational schema)
- **Fonts:** Google Fonts (Syne + DM Sans)
- **No frameworks. No dependencies. Pure code.**

---

Built with ❤️ and 🔥

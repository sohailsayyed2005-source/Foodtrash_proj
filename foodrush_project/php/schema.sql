-- ============================================================
-- FoodRush Database Schema — Full Version with Order Storage
-- Run this in phpMyAdmin: Import tab → select this file → Go
-- ============================================================

CREATE DATABASE IF NOT EXISTS foodrush CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE foodrush;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    email        VARCHAR(150) UNIQUE NOT NULL,
    phone        VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    address      TEXT,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Restaurants ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurants (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    cuisine       VARCHAR(100),
    rating        DECIMAL(2,1) DEFAULT 0.0,
    delivery_time VARCHAR(20),
    min_order     DECIMAL(10,2) DEFAULT 0,
    image_url     VARCHAR(255),
    is_active     TINYINT(1) DEFAULT 1,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Menu Items ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_items (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_id INT,
    name          VARCHAR(150) NOT NULL,
    description   TEXT,
    price         DECIMAL(10,2) NOT NULL,
    category      VARCHAR(80),
    image_url     VARCHAR(255),
    rating        DECIMAL(2,1) DEFAULT 0.0,
    prep_time     INT DEFAULT 15,
    badge         VARCHAR(50),
    is_available  TINYINT(1) DEFAULT 1,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL
);

-- ── Orders ───────────────────────────────────────────────────
-- This is the MAIN table where customer orders are saved
CREATE TABLE IF NOT EXISTS orders (
    id                   INT AUTO_INCREMENT PRIMARY KEY,
    order_ref            VARCHAR(20) UNIQUE NOT NULL,       -- e.g. FR3A7B2C1
    -- Customer Details
    customer_name        VARCHAR(100) NOT NULL,
    phone                VARCHAR(15) NOT NULL,
    email                VARCHAR(150) NOT NULL,
    -- Delivery Address
    delivery_address     TEXT NOT NULL,
    city                 VARCHAR(80) NOT NULL,
    pincode              VARCHAR(10) NOT NULL,
    special_instructions TEXT,
    -- Order Items (stored as JSON string)
    order_items          LONGTEXT NOT NULL,                 -- JSON array of items
    -- Pricing
    subtotal             DECIMAL(10,2) NOT NULL,
    delivery_fee         DECIMAL(10,2) DEFAULT 40,
    discount             DECIMAL(10,2) DEFAULT 0,
    total_amount         DECIMAL(10,2) NOT NULL,
    coupon_code          VARCHAR(30),
    -- Payment & Status
    payment_method       VARCHAR(50) DEFAULT 'Cash on Delivery',
    status               ENUM('pending','confirmed','preparing','out_for_delivery','delivered','cancelled') DEFAULT 'pending',
    estimated_delivery   INT DEFAULT 30,                    -- minutes
    -- Timestamps
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── Reviews ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT,
    restaurant_id INT,
    order_id      INT,
    rating        INT CHECK (rating BETWEEN 1 AND 5),
    comment       TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL
);

-- ── Coupons ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(30) UNIQUE NOT NULL,
    discount_type   ENUM('percent','flat') DEFAULT 'percent',
    discount_value  DECIMAL(10,2) NOT NULL,
    min_order_value DECIMAL(10,2) DEFAULT 0,
    max_uses        INT DEFAULT 100,
    used_count      INT DEFAULT 0,
    expires_at      DATETIME,
    is_active       TINYINT(1) DEFAULT 1
);

-- ── Sample Restaurants ───────────────────────────────────────
INSERT IGNORE INTO restaurants (name, cuisine, rating, delivery_time, min_order) VALUES
('The Pizza Republic', 'Italian',  4.8, '20-30', 199),
('Burger District',    'American', 4.7, '15-25', 149),
('Tokyo Garden',       'Japanese', 4.9, '25-35', 299),
('Spice Route',        'Indian',   4.8, '20-30', 249);

-- ── Sample Coupons ───────────────────────────────────────────
INSERT IGNORE INTO coupons (code, discount_type, discount_value, min_order_value) VALUES
('FIRST50',   'percent', 50,  200),
('FLAT100',   'flat',    100, 500),
('WELCOME30', 'percent', 30,  0);

-- ── Sample Order (so admin panel is not empty) ───────────────
INSERT IGNORE INTO orders
    (order_ref, customer_name, phone, email, delivery_address, city, pincode,
     order_items, subtotal, delivery_fee, discount, total_amount, payment_method, status)
VALUES
    ('FRSAMPLE1', 'Rahul Sharma', '9876543210', 'rahul@example.com',
     '12 MG Road, Bandra', 'Mumbai', '400050',
     '[{"id":1,"name":"Margherita Pizza","image":"🍕","price":299,"qty":2},{"id":9,"name":"Butter Chicken","image":"🍛","price":269,"qty":1}]',
     867, 40, 0, 907, 'Cash on Delivery', 'confirmed');

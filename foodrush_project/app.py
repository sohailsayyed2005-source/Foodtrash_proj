
from flask import Flask, request, render_template_string, redirect, url_for, session
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = "replace_this_with_a_long_random_secret"

def get_db():
    connection = sqlite3.connect("foodrush.db")
    connection.row_factory = sqlite3.Row
    return connection

with get_db() as db:
    db.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

PAGE = """
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FoodRush Account</title>
<style>
* { box-sizing: border-box; }
body {
    margin: 0; min-height: 100vh; display: flex;
    align-items: center; justify-content: center;
    font-family: Arial, sans-serif; color: white;
    background: linear-gradient(135deg, #10172a, #38201d);
}
.card {
    width: 380px; max-width: 94%; padding: 32px;
    background: #192239; border-radius: 18px;
    box-shadow: 0 12px 40px #0005;
}
h1 { color: #ff641c; margin-bottom: 8px; }
p { color: #c4cada; }
.tabs { display: flex; gap: 10px; margin: 22px 0; }
.tabs a {
    flex: 1; text-align: center; padding: 12px;
    border-radius: 8px; text-decoration: none;
    background: #27334d; color: white;
}
.tabs .active { background: #ff641c; }
input {
    width: 100%; padding: 13px; margin: 8px 0;
    border: 1px solid #46516b; border-radius: 8px;
    background: #10172a; color: white;
}
button {
    width: 100%; padding: 13px; margin-top: 14px;
    border: 0; border-radius: 8px;
    background: #ff641c; color: white;
    font-weight: bold; cursor: pointer;
}
.error { color: #ff9d8a; }
.success { color: #8ce9ad; }
a.back { color: #ff9865; text-decoration: none; }
.show { display: flex; gap: 8px; align-items: center; margin-top: 8px; }
.show input { width: auto; }
</style>
</head>
<body>
<div class="card">
    <h1>🔥 FoodRush</h1>
    <p>Good food is just a sign-in away.</p>

    <div class="tabs">
        <a href="/signin" class="{{ 'active' if mode == 'signin' else '' }}">Sign In</a>
        <a href="/register" class="{{ 'active' if mode == 'register' else '' }}">Create Account</a>
    </div>

    <h2>{{ 'Welcome Back!' if mode == 'signin' else 'Join FoodRush!' }}</h2>

    <form method="POST">
        {% if mode == 'register' %}
        <input name="name" placeholder="Your full name" required maxlength="100">
        {% endif %}

        <input type="email" name="email" placeholder="Email address"
               required maxlength="150" autocomplete="email">

        <input type="password" id="password" name="password"
               placeholder="Password" required minlength="8"
               autocomplete="{{ 'current-password' if mode == 'signin' else 'new-password' }}">

        {% if mode == 'register' %}
        <input type="password" name="confirm_password"
               placeholder="Confirm password" required minlength="8">
        {% endif %}

        <label class="show">
            <input type="checkbox" onclick="
                document.querySelectorAll('input[type=password], input[type=text]')
                .forEach(e => e.type = this.checked ? 'text' : 'password')">
            Show password
        </label>

        <button type="submit">
            {{ 'Sign In' if mode == 'signin' else 'Create Account' }}
        </button>
    </form>

    {% if message %}
    <p class="{{ 'success' if success else 'error' }}">{{ message }}</p>
    {% endif %}

    <p><a class="back" href="/">← Back to FoodRush</a></p>
</div>
</body>
</html>
"""

def show_page(mode, message="", success=False):
    return render_template_string(
        PAGE, mode=mode, message=message, success=success
    )

@app.route("/")
def home():
    return """
    <h1>🔥 FoodRush</h1>
    <a href="/signin">Sign In</a>
    <a href="/register">Create Account</a>
    """

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return show_page("register")

    name = request.form.get("name", "").strip()
    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")
    confirm = request.form.get("confirm_password", "")

    if not name or not email:
        return show_page("register", "Please complete all required fields.")

    if len(password) < 8:
        return show_page("register", "Password must be at least 8 characters.")

    if password != confirm:
        return show_page("register", "Passwords do not match.")

    try:
        with get_db() as db:
            db.execute(
                "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
                (name, email, generate_password_hash(password))
            )
        return show_page("signin", "Account created! You can now sign in.", True)
    except sqlite3.IntegrityError:
        return show_page("register", "This email is already registered.")

@app.route("/signin", methods=["GET", "POST"])
def signin():
    if request.method == "GET":
        return show_page("signin")

    email = request.form.get("email", "").strip().lower()
    password = request.form.get("password", "")

    with get_db() as db:
        user = db.execute(
            "SELECT * FROM users WHERE email = ?", (email,)
        ).fetchone()

    if user and check_password_hash(user["password"], password):
        session.clear()
        session["user_id"] = user["id"]
        session["user_name"] = user["name"]
        return redirect(url_for("dashboard"))

    return show_page("signin", "Incorrect email or password. Please try again.")

@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect(url_for("signin"))

    name = session.get("user_name", "Customer")
    return f"""
    <h1>Welcome to FoodRush, {name}!</h1>
    <p>You are successfully signed in.</p>
    <a href="/logout">Sign Out</a>
    """

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("signin"))

if __name__ == "__main__":
    app.run(debug=True)

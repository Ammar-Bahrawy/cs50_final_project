from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session, jsonify
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from flask_uploads import UploadSet, configure_uploads, IMAGES
import datetime

from helpers import login_required

app = Flask(__name__)


# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///project.db")

# Configure file management
photos = UploadSet('photos', IMAGES)
app.config['UPLOADED_PHOTOS_DEST'] = 'static/profile_pictures'
configure_uploads(app, photos)


@app.route("/")
@login_required
def main():
    return render_template("layout.html")

# Login, logout and registeration

@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")

    username = request.form.get("username")
    password = request.form.get("password")
    confirmation = request.form.get("confirmation")
    db_username = db.execute(
        "SELECT username FROM users WHERE username = :username", username=username)
    # Ensure username was submitted
    if not username:
        return apology("must provide username", 400)
    # Ensure password was submitted
    elif not password:
        return apology("must provide password", 400)
    elif not confirmation:
        return apology("must provide password confrmation", 400)
    elif password != confirmation:
        return apology("password does not match confirmation", 400)
    elif db_username:
        return apology("username exists, please choose another", 400)

    hash_pass = generate_password_hash(password)

    db.execute("INSERT INTO users (username, hash) VALUES (?, ?)", username, hash_pass)

    return redirect("/")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 403)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 403)

        # Query database for username
        rows = db.execute(
            "SELECT * FROM users WHERE username = ?", request.form.get("username")
        )

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(
            rows[0]["hash"], request.form.get("password")
        ):
            return apology("invalid username and/or password", 403)

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")

@app.route("/settings")
@login_required
def settings():
    return render_template("/settings.html")


@app.route("/upload")
@login_required
def upload():
    return redirect("settings.html")

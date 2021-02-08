#############################
# author:    Stepan Tikunov #
# telegram:    googolplexxx #
# email: gglplxxx@gmail.com #
#   January - February 2021 #
#############################

from os import getenv
from datetime import datetime, timedelta

from flask import Flask, make_response, render_template, send_file, request, redirect
from flask_migrate import Migrate
from jwt import encode, decode

from models import *

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
JWT_SECRET = getenv("JWT_SECRET", "maga2020!")

db.app = app
db.init_app(app)

migrate = Migrate(app, db)

@app.cli.command("create_all")
def create_all():
	db.create_all()

@app.before_request
def set_user():
	jwt_key = request.cookies.get("key", None)

	if (jwt_key is None):
		request.environ["user"] = AnonymousUser()
		db.session.add(request.environ["user"])
		db.session.commit()
		jwt_key = encode({ "id": request.environ["user"].id }, JWT_SECRET, algorithm="HS256")
	else:
		id = decode(jwt_key, JWT_SECRET, algorithms=["HS256"])["id"]
		request.environ["user"] = AnonymousUser.query.get(id)

	request.environ["jwt_key"] = jwt_key

@app.after_request
def set_cookie(response):
	response.set_cookie("key", request.environ["jwt_key"], expires=datetime.max)
	return response


@app.route("/favicon.ico")
def favicon():
	return send_file("static/ico/favicon.ico")

@app.route("/")
@app.route("/<id>", methods=["GET"])
def article(id=None):
	if id:
		if Article.query.get(id) is None:
			return redirect("/")
	return render_template("index.html")

@app.route("/save", methods=["POST"])
def save_article():
	now = datetime.now()
	text: str = request.json.get("text", "")
	id: str = request.json.get("id", "")

	text = text.replace("\r\n", "\n")
	text = text.replace("\r", "\n")

	lines = text.split("\n")

	title = lines[0].strip()
	author = lines[1].strip()

	errors = []

	if (4 > len(title)):
		errors.append({"at": "#title", "message": "Title is too short."})
	if (250 < len(title)):
		errors.append({"at": "#title", "message": "Title is too long."})
	if (4 > len(author)):
		errors.append({"at": "#author", "message": "Author's name is too short."})
	if (100 < len(author)):
		errors.append({"at": "#author", "message": "Author's name is too long."})
	if (len("".join(lines[2:]).replace(" ", "")) == 0):
		errors.append({"at": "#content-wrapper>:nth-child(3)", "message": "Empty article."})

	if (len(errors)):
		return (400, {"ok": False, "errors": errors})

	article: Article = Article.query.get(id)
	if (article is None):
		id = f"{title.replace(' ', '-')}-{str(int(now.timestamp()))}".lower()
		article = Article(id=id, author_user=request.environ["user"], author=author, time=now, title=title)
		db.session.add(article)
	elif article.author_user != request.environ["user"]:
		return (403, {"ok": False})

	article.title = title
	article.author = author
	article.content_chunks = []
	for line in lines[2:]:
		new_paragraph = Paragraph(text=line)
		db.session.add(new_paragraph)
		article.content_chunks.append(new_paragraph)

	db.session.commit()

	return {"ok": True, "id": id}

@app.route("/get_article_content")
def get_article_content():
	id = request.args.get("id", "")

	article = Article.query.get(id)
	if (article is None):
		return {
			"text": "",
			"editable": True
		}

	newline = "\n"
	text = f"{article.title}\n{article.author}\n{newline.join((chunk.text for chunk in article.content_chunks))}"

	return {
		"text": text,
		"editable": request.environ["user"] == article.author_user
	}

if __name__ == "__main__":
	app.run(host="0.0.0.0", port=8000, debug=True)

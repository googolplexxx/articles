#############################
# author:    Stepan Tikunov #
# telegram:    googolplexxx #
# email: gglplxxx@gmail.com #
#   January - February 2021 #
#############################

from os import getenv
from datetime import datetime, timedelta
from json import loads

from flask import Flask, make_response, render_template, send_file, request, redirect
from flask_migrate import Migrate
from flask_minify import minify
from jwt import encode, decode
from transliterate import translit

from models import *

app = Flask(__name__)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
JWT_SECRET = getenv("JWT_SECRET", "maga2020!")

db.app = app
db.init_app(app)

minify(app=app, html=True, js=False, cssless=True)

migrate = Migrate(app, db)

host = "https://da1cd24c4f41.ngrok.io"

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
	return send_file("assets/favicon.ico")

@app.route("/")
@app.route("/<id>", methods=["GET"])
def article_view(id=None):
	meta_tags = {
		"title": "New Article",
		"description": "You can write your own article using this website.",
		"url": host
	}
	if id:
		article: Article = Article.query.get(id)
		if article is None:
			return redirect("/")
		else:
			meta_tags["title"] = article.title
			meta_tags["description"] = article.text_content[:247] + ("..." if len(article.text_content) > 247 else "")
			meta_tags["url"] = host + f"/{id}"
	return render_template("index.html", meta_tags=meta_tags)

def translit_or_keep(text):
	try:
		return translit(text, reversed=True)
	except:
		return text

@app.route("/save", methods=["POST"])
def save_article():
	now = datetime.now()
	text: str = request.json.get("text", "")
	formatting = request.json.get("formatting", '{}')
	id: str = request.json.get("id", "")

	text = text.replace("\r\n", "\n").replace("\r", "\n")

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
		id = "-".join("".join((char for char in translit_or_keep(title) if char.isalnum() or char in (' ', '-', '_'))).split())
		id = f"{id}-{int(now.timestamp())}"
		article = Article(id=id, author_user=request.environ["user"], author=author, date=now, title=title)
		db.session.add(article)
	elif article.author_user != request.environ["user"]:
		return (403, {"ok": False})

	article.title = title
	article.author = author
	article.formatting = formatting
	for chunk in article.content_chunks:
		db.session.delete(chunk)
	article.content_chunks = []
	for line in lines[2:]:
		new_paragraph = Paragraph(text=line)
		db.session.add(new_paragraph)
		article.content_chunks.append(new_paragraph)

	db.session.commit()


	return {
		"ok": True,
		"id": id,
		"title": title,
		"date": article.date_text
	}

@app.route("/<id>/raw_content")
def raw_article_content(id):
	article: Article = Article.query.get(id)
	if (article is None):
		return {
			"text": "",
			"title": "New Article",
			"editable": True
		}

	text = f"{article.title}\n{article.author}\n{article.text_content}"

	return {
		"text": text,
		"formatting": article.formatting,
		"editable": request.environ["user"] == article.author_user,
		"date": article.date_text,
		"title": article.title
	}

if __name__ == "__main__":
	app.run(host="0.0.0.0", port=8000, debug=True)

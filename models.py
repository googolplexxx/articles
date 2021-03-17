from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, String, Text, Integer, LargeBinary, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.orderinglist import ordering_list
from datetime import datetime

db = SQLAlchemy()

class AnonymousUser(db.Model):
	id: int = Column(Integer(), primary_key=True)

	__tablename__ = "anonymous_user"

class Chunk(db.Model):
	id: int = Column(Integer(), primary_key=True)
	type: str = Column(String(128))
	order: int = Column(Integer())

	article_id: str = Column(String(512), ForeignKey("article.id"))

	__tablename__ = "chunk"
	__mapper_args__ = {
		"polymorphic_on": type,
		"polymorphic_identity": "chunk"
	}

class Paragraph(Chunk):
	id: int = Column(Integer(), ForeignKey("chunk.id"), primary_key=True)

	text: str = Column(Text())

	__tablename__ = "paragraph"
	__mapper_args__ = {
		"polymorphic_identity": "paragraph"
	}

class Quote():
	pass # TODO

class Embedded():
	pass # TODO

class Picture(Chunk):
	id: int = Column(Integer(), ForeignKey("chunk.id"), primary_key=True)

	caption: str = Column(String(256))
	content: bytes = Column(LargeBinary())

	__tablename__ = "picture"
	__mapper_args__ = {
		"polymorphic_identity": "picture"
	}

class Article(db.Model):
	id: str = Column(String(length=512), primary_key=True)

	author_user_id: int = Column(Integer(), ForeignKey("anonymous_user.id"))
	author_user: AnonymousUser = relationship("AnonymousUser")

	author: str = Column(String(length=100))
	date: datetime = Column(DateTime())
	title: str = Column(String(length=250))

	formatting: str = Column(Text)
	content_chunks: list = relationship("Chunk", order_by="Chunk.order", collection_class=ordering_list("order"), cascade="all,delete,delete-orphan")

	@property
	def text_content(self):
		return "\n".join((chunk.text for chunk in self.content_chunks if isinstance(chunk, Paragraph)))

	@property
	def date_text(self):
		months = ("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December")
		return f"{self.date.hour:02}:{self.date.minute:02}, {months[self.date.month - 1]} {self.date.day:02}, {self.date.year}"

	__tablename__ = "article"
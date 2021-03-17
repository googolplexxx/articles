function Formatter(f) {
	this.bold = f.bold || [];
	this.italic = f.italic || [];
	this.strike = f.strike || [];
	this.underlined = f.underlined || [];
	this.links = f.links || [];
}

Formatter.prototype = {
	toggleBold (start, end) {
		for (let i = 0; i < this.bold.length; ++i) {
			const currentRange = this.bold[i];
			const startInRange = inRange(start, currentRange.start, currentRange.end);
			const endInRange = inRange(end, currentRange.start, currentRange.end);
			if (currentRange.start == start && currentRange.end == end) {
				this.bold.splice(i, 1);
				--i;
				return;
			} else if (startInRange && !endInRange) {
				this.bold[i].end = end;
				return;
			} else if (endInRange && !startInRange) {
				this.bold[i].start = start;
				return;
			} else if (startInRange && endInRange) {
				this.bold.push({
					start: end,
					end: this.bold[i].end
				});
				this.bold[i].end = start;
				return;
			}
		}
		this.bold.push({
			start,
			end
		});
		return {
			type: "bold",
			start,
			end
		}
	},
	toggleItalic (start, end) {
		for (let i = 0; i < this.italic.length; ++i) {
			const currentRange = this.italic[i];
			const startInRange = inRange(start, currentRange.start, currentRange.end);
			const endInRange = inRange(end, currentRange.start, currentRange.end);
			if (currentRange.start == start && currentRange.end == end) {
				this.italic.splice(i, 1);
				--i;
				return;
			} else if (startInRange && !endInRange) {
				this.italic[i].end = end;
				return;
			} else if (endInRange && !startInRange) {
				this.italic[i].start = start;
				return;
			} else if (startInRange && endInRange) {
				this.italic.push({
					start: end,
					end: this.italic[i].end
				});
				this.italic[i].end = start;
				return;
			}
		}
		this.italic.push({
			start,
			end
		});
		return {
			type: "italic",
			start,
			end
		}
	},
	toggleStrike (start, end) {
		for (let i = 0; i < this.strike.length; ++i) {
			const currentRange = this.strike[i];
			const startInRange = inRange(start, currentRange.start, currentRange.end);
			const endInRange = inRange(end, currentRange.start, currentRange.end);
			if (currentRange.start == start && currentRange.end == end) {
				this.strike.splice(i, 1);
				--i;
				return;
			} else if (startInRange && !endInRange) {
				this.strike[i].end = end;
				return;
			} else if (endInRange && !startInRange) {
				this.strike[i].start = start;
				return;
			} else if (startInRange && endInRange) {
				this.strike.push({
					start: end,
					end: this.strike[i].end
				});
				this.strike[i].end = start;
				return;
			}
		}
		this.strike.push({
			start,
			end
		});
		return {
			type: "strike",
			start,
			end
		}
	},
	toggleUnderlined (start, end) {
		for (let i = 0; i < this.underlined.length; ++i) {
			const currentRange = this.underlined[i];
			const startInRange = inRange(start, currentRange.start, currentRange.end);
			const endInRange = inRange(end, currentRange.start, currentRange.end);
			if (currentRange.start == start && currentRange.end == end) {
				this.underlined.splice(i, 1);
				--i;
				return;
			} else if (startInRange && !endInRange) {
				this.underlined[i].end = end;
				return;
			} else if (endInRange && !startInRange) {
				this.underlined[i].start = start;
				return;
			} else if (startInRange && endInRange) {
				this.underlined.push({
					start: end,
					end: this.underlined[i].end
				});
				this.underlined[i].end = start;
				return;
			}
		}
		this.underlined.push({
			start,
			end
		});
		return {
			type: "underlined",
			start,
			end
		}
	},
	toggleLink (start, end, link) {
		for (let i = 0; i < this.links.length; ++i) {
			const currentRange = this.links[i];
			const startInRange = inRange(start, currentRange.start, currentRange.end);
			const endInRange = inRange(end, currentRange.start, currentRange.end);
			if (startInRange || endInRange) {
				this.links.splice(i, 1);
				return;
			}
		}
		this.links.push({
			start,
			end,
			link
		});
		return {
			type: "link",
			start,
			end,
			link
		}
	},
	makeChange(change) {
		switch(change.type) {
		case "bold":
			this.toggleBold(change.start, change.end);
			break;
		case "italic":
			this.toggleItalic(change.start, change.end);
			break;
		case "strike":
			this.toggleStrike(change.start, change.end);
			break;
		case "underlined":
			this.toggleUnderlined(change.start, change.end);
			break;
		}
	},
	applyFormatting() {
		const lines = textarea.value.split("\n");
		for (let i = 0; i < lines.length; ++i) {
			contentWrapper.children[i].querySelector(".text-content").innerHTML = lines[i];
		}
		const boldTag = document.createElement("b");
		const italicTag = document.createElement("i");
		const strikeTag = document.createElement("strike");
		const underlinedTag = document.createElement("span");
		underlinedTag.className = "underlined";

		for (let i = 0; i < this.bold.length; ++i) {
			wrapTextContentWith(boldTag, this.bold[i].start, this.bold[i].end, true);
		}
		for (let i = 0; i < this.italic.length; ++i) {
			wrapTextContentWith(italicTag, this.italic[i].start, this.italic[i].end, true);
		}
		for (let i = 0; i < this.strike.length; ++i) {
			wrapTextContentWith(strikeTag, this.strike[i].start, this.strike[i].end, true);
		}
		for (let i = 0; i < this.underlined.length; ++i) {
			wrapTextContentWith(underlinedTag, this.underlined[i].start, this.underlined[i].end, true);
		}
		for (let i = 0; i < this.links.length; ++i) {
			const currentLink = document.createElement("a");
			currentLink.href = this.links[i].link;
			wrapTextContentWith(currentLink, this.links[i].start, this.links[i].end, true);
		}
		const selected = document.createElement("span");
		selected.className = "selected";
		wrapTextContentWith(selected, window.selectionStart, window.selectionEnd)
	},
	deleteRange(start, end) {
		if (start == end) return;
		for (let i = 0; i < this.bold.length; ++i) {
			const startInRange = inRange(start, this.bold[i].start, this.bold[i].end);
			const endInRange = inRange(end, this.bold[i].start, this.bold[i].end);
			if (end <= this.bold[i].start) {
				this.bold[i].start -= end - start;
				this.bold[i].end -= end - start;
			} else if (startInRange && endInRange) {
				this.bold[i].end -= end - start;
			} else if (startInRange) {
				this.bold[i].end = start;
			} else if (endInRange && end != this.bold[i].end) {
				this.bold[i].start = end;
			} else if (start <= this.bold[i].start && end >= this.bold[i].end) {
				this.bold.splice(i, 1);
				--i;
			}
		}
		for (let i = 0; i < this.italic.length; ++i) {
			const startInRange = inRange(start, this.italic[i].start, this.italic[i].end);
			const endInRange = inRange(end, this.italic[i].start, this.italic[i].end);
			if (end <= this.italic[i].start) {
				this.italic[i].start -= end - start;
				this.italic[i].end -= end - start;
			} else if (startInRange && endInRange) {
				this.italic[i].end -= end - start;
			} else if (startInRange) {
				this.italic[i].end = start;
			} else if (endInRange && end != this.italic[i].end) {
				this.italic[i].start = end;
			} else if (start <= this.italic[i].start && end >= this.italic[i].end) {
				this.italic.splice(i, 1);
				--i;
			}
		}
		for (let i = 0; i < this.strike.length; ++i) {
			const startInRange = inRange(start, this.strike[i].start, this.strike[i].end);
			const endInRange = inRange(end, this.strike[i].start, this.strike[i].end);
			if (end <= this.strike[i].start) {
				this.strike[i].start -= end - start;
				this.strike[i].end -= end - start;
			} else if (startInRange && endInRange) {
				this.strike[i].end -= end - start;
			} else if (startInRange) {
				this.strike[i].end = start;
			} else if (endInRange && end != this.strike[i].end) {
				this.strike[i].start = end;
			} else if (start <= this.strike[i].start && end >= this.strike[i].end) {
				this.strike.splice(i, 1);
				--i;
			}
		}
		for (let i = 0; i < this.underlined.length; ++i) {
			const startInRange = inRange(start, this.underlined[i].start, this.underlined[i].end);
			const endInRange = inRange(end, this.underlined[i].start, this.underlined[i].end);
			if (end <= this.underlined[i].start) {
				this.underlined[i].start -= end - start;
				this.underlined[i].end -= end - start;
			} else if (startInRange && endInRange) {
				this.underlined[i].end -= end - start;
			} else if (startInRange) {
				this.underlined[i].end = start;
			} else if (endInRange && end != this.underlined[i].end) {
				this.underlined[i].start = end;
			} else if (start <= this.underlined[i].start && end >= this.underlined[i].end) {
				this.underlined.splice(i, 1);
				--i;
			}
		}
		for (let i = 0; i < this.links.length; ++i) {
			const startInRange = inRange(start, this.links[i].start, this.links[i].end);
			const endInRange = inRange(end, this.links[i].start, this.links[i].end);
			if (end <= this.links[i].start) {
				this.links[i].start -= end - start;
				this.links[i].end -= end - start;
			} else if (startInRange && endInRange) {
				this.links[i].end -= end - start;
			} else if (startInRange) {
				this.links[i].end = start;
			} else if (endInRange && end != this.links[i].end) {
				this.links[i].start = end;
			} else if (start <= this.links[i].start && end >= this.links[i].end) {
				this.links.splice(i, 1);
				--i;
			}
		}
	},
	pushAllAfter(at, length) {
		for (let i = 0; i < this.bold.length; ++i) {
			if (at <= this.bold[i].start) {
				this.bold[i].start += length;
				this.bold[i].end += length;
			}
			if (inRange(at, this.bold[i].start, this.bold[i].end)) {
				this.bold[i].end += length;
			}
		}
		for (let i = 0; i < this.italic.length; ++i) {
			if (at <= this.italic[i].start) {
				this.italic[i].start += length;
				this.italic[i].end += length;
			}
			if (inRange(at, this.italic[i].start, this.italic[i].end)) {
				this.italic[i].end += length;
			}
		}
		for (let i = 0; i < this.strike.length; ++i) {
			if (at <= this.strike[i].start) {
				this.strike[i].start += length;
				this.strike[i].end += length;
			}
			if (inRange(at, this.strike[i].start, this.strike[i].end)) {
				this.strike[i].end += length;
			}
		}
		for (let i = 0; i < this.underlined.length; ++i) {
			if (at <= this.underlined[i].start) {
				this.underlined[i].start += length;
				this.underlined[i].end += length;
			}
			if (inRange(at, this.underlined[i].start, this.underlined[i].end)) {
				this.underlined[i].end += length;
			}
		}
		for (let i = 0; i < this.links.length; ++i) {
			if (at <= this.links[i].start) {
				this.links[i].start += length;
				this.links[i].end += length;
			}
			if (inRange(at, this.links[i].start, this.links[i].end)) {
				this.links[i].end += length;
			}
		}
	}
};

function inRange(n, start, end) {
	return n > start && n <= end;
}
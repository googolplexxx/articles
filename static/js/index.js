const select = (query) => document.querySelector(query);

const TITLE_MIN_LENGTH = 4;
const TITLE_MAX_LENGTH = 250;
const AUTHOR_MIN_LENGTH = 4;
const AUTHOR_MAX_LENGTH = 100;

contentWrapper = select("#content-wrapper");
textarea = select("textarea");

window.prevCursorPos = null;

String.prototype.splice = function(start, delCount, newSubStr="") {
	if (delCount === undefined)
		delCount = this.length;
	return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
};

Array.prototype.indexOf = function(element) {
	for(var i=0, l=this.length; i<l; i++) {
		if(this[i] == element) return i;
	}
	return -1;
};

function addClass(element, className) {
	if (element === null || element === undefined)
		return;
	let newClasses = element.getAttribute("class") || "";
	let classes = newClasses.split(" ");
	const index = classes.findIndex((cl) => cl === className);
	if (index === -1)
		classes.push(className);
	newClasses = classes.filter(cl => cl).join(" ");
	element.setAttribute("class", newClasses);
}

function removeClass(element, className) {
	if (element === null || element === undefined)
		return;
	let newClasses = element.getAttribute("class") || "";
	let classes = newClasses.split(" ");
	const index = classes.findIndex((cl) => cl === className);
	if (index !== -1)
		classes.splice(index, 1);
	newClasses = classes.join(" ");
	element.setAttribute("class", newClasses);
}

function getLineHeight(element) {
	const compStyle = getComputedStyle(element);
    const temp = document.createElement(element.nodeName);
	temp.style.margin = 0;
	temp.style.padding = 0;
	temp.style.fontFamily = compStyle.fontFamily || "Georgia";
	temp.style.fontSize = compStyle.fontSize || "16px";
    temp.innerHTML = "A";
	element.parentNode.appendChild(temp);
    let ret = temp.clientHeight;
    temp.parentNode.removeChild(temp);
    return ret;
}

function articleIsEmpty(nospaces=false) {
	const lines = textarea.value.split("\n");
	if (nospaces)
		return lines.slice(2).join("").replaceAll(" ", "") === ""
	else
		return lines.slice(2).join("") === ""
}

function params(json) {
	let paramsArr = [];
	for (const key in json) {
		paramsArr.push(`${key}=${json[key]}`);
	}
	return paramsArr.join("&");
}

async function onLoad(e) {
	id = window.location.pathname.replaceAll("/", "");
	const args = {
		id
	}
	const response = await (await fetch(`/get_article_content?${params(args)}`)).json();
	textarea.value = response.text;
	editable = response.editable;
	editing = id == "";
	if (!editing) {
		addClass(select("#cursor"), "transparent");
		removeClass(select("#cursor"), "blink");
		removeClass(select("#cursor"), "smooth");
		select("#content-wrapper").setAttribute("contenteditable", "false");
		if (editable) {
			select(".button").style.removeProperty("display");
			select(".button").textContent = "edit";
		}
	} else if (editing) {
		select(".button").style.removeProperty("display");
		textarea.focus();
	}
	onTextareaKeydown();
}

function onTextareaKeydown(e) {
	const prevContent = textarea.value;
	setTimeout(() => {
		const changed = textarea.value !== prevContent
		let {selectionStart, selectionEnd} = textarea;
		let lines = textarea.value.split("\n");
		if (lines.length < 3) {
			textarea.value += "\n".repeat(3 - lines.length);
			textarea.selectionStart = selectionStart;
			textarea.selectionEnd = selectionEnd;
			lines = textarea.value.split("\n");
		}
		let cursorLine = lines.length, endLine = lines.length;
		let currentLength = 0;
		for (let i = 0; i < lines.length; i++) {
			if (i < contentWrapper.children.length) {
				contentWrapper.children[i].querySelector(".text-content").textContent = lines[i];
				contentWrapper.children[i].querySelector(".text-content").innerHTML += "<br>";
				if (e !== null && e !== undefined && changed) {
					removeClass(contentWrapper.children[i], "bad");
					addClass(select("#cursor"), "transparent");
					removeClass(select("#cursor"), "blink");
					removeClass(select("#cursor"), "smooth");
					setTimeout(() => onTextareaKeydown(), 200);
				}
				if (i < 2) {
					if (lines[i].length === 0)
						addClass(contentWrapper.children[i], "empty");
					else
						removeClass(contentWrapper.children[i], "empty");
				} else {
					if (articleIsEmpty())
						addClass(contentWrapper.children[i], "empty");
					else
						removeClass(contentWrapper.children[i], "empty");
				}
			} else {
				const newParagraph = document.createElement("p");
				const newParagraphContent = document.createElement("span");
				newParagraphContent.textContent = lines[i];
				newParagraph.appendChild(newParagraphContent);
				addClass(newParagraphContent, "text-content");
				newParagraphContent.innerHTML += "<br>";
				if (lines[i].length === 0) {
					addClass(newParagraph, "empty");
				} else {
					removeClass(newParagraph, "empty");
				}
				contentWrapper.appendChild(newParagraph);
			}
			currentLength += lines[i].length + 1;
			if (currentLength > selectionStart) {
				if (i < cursorLine) {
					cursorLine = i;
					selectionStart -= currentLength - lines[i].length - 1;
				}
			}
			if (currentLength > selectionEnd) {
				if (i < endLine) {
					endLine = i;
					selectionEnd -= currentLength - lines[i].length - 1;
				}
			}
		}

		for (let i = contentWrapper.children.length - 1; i >= lines.length; i--) {
			contentWrapper.children[i].remove();
		}
		cursorLine %= lines.length;
		if (selectionStart === selectionEnd && cursorLine === endLine && { selectionStart, selectionEnd, cursorLine, endLine } !== prevCursorPos) {
			const textContent = contentWrapper.children[cursorLine].querySelector(".text-content");
			if (textContent.textContent.split(" ").filter)
			textContent.innerHTML = `<span>${textContent.textContent.splice(selectionStart)}</span><span id="cursor-pos"></span><span>${textContent.textContent.slice(selectionStart)}</span><br>`;
			if (editing) {
				addClass(select("#cursor"), "smooth");
				removeClass(select("#cursor"), "transparent");
				removeClass(select("#cursor"), "blink");
				setTimeout(() => {addClass(select("#cursor"), "blink")}, 250);
			}
			select("#cursor").style.height =`${getLineHeight(contentWrapper.children[cursorLine])}px`;
			select("#cursor").style.top = `${select("#cursor-pos").getBoundingClientRect().top + window.scrollY}px`;
			select("#cursor").style.left = `${select("#cursor-pos").getBoundingClientRect().left + window.scrollX - select("article").getBoundingClientRect().left}px`;
			let {fontFamily, fontSize, fontWeight} = getComputedStyle(select("#cursor").parentElement);
			textarea.style.fontFamily = fontFamily;
			textarea.style.fontSize = fontSize;
			textarea.style.fontWeight = fontWeight;
			prevCursorPos = { selectionStart, selectionEnd, cursorLine, endLine };
		} else {
			if (cursorLine === endLine) {
				addClass(select("#cursor"), "transparent");
				removeClass(select("#cursor"), "blink");
				removeClass(select("#cursor"), "smooth");
				const currentElement = contentWrapper.children[cursorLine].querySelector(".text-content");
				currentElement.textContent = lines[cursorLine];
				currentElement.innerHTML = `<span class="before">${currentElement.innerHTML.slice(0, selectionStart)}</span><span class="selected">${currentElement.innerHTML.slice(selectionStart, selectionEnd)}</span><span class="after">${currentElement.innerHTML.slice(selectionEnd)}</span><br>`;
			} else {
				const startElement = contentWrapper.children[cursorLine].querySelector(".text-content");
				startElement.textContent = lines[cursorLine];
				startElement.innerHTML = `<span class="before">${startElement.innerHTML.slice(0, selectionStart)}</span><span class="selected">${startElement.innerHTML.slice(selectionStart)}<br></span>`;
				for (let i = cursorLine + 1; i < endLine; i++) {
					const currentElement = contentWrapper.children[i].querySelector(".text-content");
					currentElement.textContent = lines[i];
					currentElement.innerHTML = `<span class="before"></span><span class="selected">${currentElement.innerHTML}</span><span class="after"></span><br>`
				}
				const endElement = contentWrapper.children[endLine].querySelector(".text-content");
				endElement.textContent = lines[endLine];
				endElement.innerHTML = `<span class="before"></span><span class="selected">${endElement.textContent.slice(0, selectionEnd)}</span><span class="after">${endElement.textContent.slice(selectionEnd)}</span><br>`;
			}
		}
	}, 1);
}

function onTextareaPaste(e) {
	e.preventDefault();
	var text;
	var clp = (e.originalEvent || e).clipboardData;
	if (clp === undefined || clp === null) {
		text = window.clipboardData.getData("text") || "";
		if (text !== "") {
			text = text.replace(/<[^>]*>/g, "");
			if (window.getSelection) {
				var newNode = document.createElement("span");
				newNode.innerHTML = text;
				window.getSelection().getRangeAt(0).insertNode(newNode);
			} else {
				document.selection.createRange().pasteHTML(text);
			}
		}
	} else {
		text = clp.getData("text/plain") || "";
		if (text !== "") {
			text = text.replace(/<[^>]*>/g, "");
			document.execCommand("insertText", false, text);
		}
	}
}

function onTextareaFocusout(e) {
	if (!editing) return;
	addClass(select("#cursor"), "transparent");
	removeClass(select("#cursor"), "blink");
	removeClass(select("#cursor"), "smooth");
}

function onArticleMousedown(e) {
	if (!editing) return;
	if (!window.mousedown) {
		addClass(select("#cursor"), "transparent");
		removeClass(select("#cursor"), "blink");
		removeClass(select("#cursor"), "smooth");
		const selected = document.querySelectorAll(".selected");
		for (let i = 0; i < selected.length; i++){
			removeClass(selected[i], "selected");
			addClass(selected[i], "selected-not-active")
		}
	}
	window.mousedown = true;
}

function getParents(node) {
	let parent = node.parentElement;
	let parents = [node, parent]
	while (parent !== document.body) {
		parent = parent.parentElement;
		parents.push(parent);
	}
	return parents;
}

function leastCommonParent(a, b) {
	const aParents = getParents(a);
	const bParents = getParents(b);

	for (let i = 0; i < aParents.length; i++) {
		if (bParents.indexOf(aParents[i]) !== -1) {
			return aParents[i];
		}
	}
}

function onArticleMouseup(e) {
	if (!window.mousedown) return;
	window.mousedown = false;
	if (document.getSelection().rangeCount == 0) {
		textarea.focus();
		onTextareaKeydown();
		return;
	}
	let {startOffset, startContainer, endOffset, endContainer} = document.getSelection().getRangeAt(0);
	const lines = textarea.value.split("\n");
	let selecting = true;
	if (endOffset === undefined || endContainer === undefined || startOffset === endOffset || startContainer.parentNode.isSameNode(endContainer.parentNode))
		selecting = false;
	if (!selecting) {
		for (let i = 0; i < contentWrapper.children.length; i++) {
			if (contentWrapper.children[i].isSameNode(leastCommonParent(contentWrapper.children[i], startContainer))) {
				break;
			} else {
				startOffset += lines[i].length + 1;
			}
		}
		endOffset = startOffset;
	}
	else {
		for (let i = 0; i < contentWrapper.children.length; i++) {
			if (contentWrapper.children[i].isSameNode(leastCommonParent(contentWrapper.children[i], startContainer))) {
				break;
			} else {
				startOffset += lines[i].length + 1;
			}
		}
		for (let i = 0; i < contentWrapper.children.length; i++) {
			if (contentWrapper.children[i].isSameNode(leastCommonParent(contentWrapper.children[i], endContainer))) {
				break;
			} else {
				endOffset += lines[i].length + 1;
			}
		}
		if (startContainer.parentNode.className == "selected-not-active")
			startOffset += startContainer.parentNode.querySelector(".before").textContent.length;
		if (startContainer.parentNode.className == "after")
			startOffset += startContainer.parentNode.querySelector(".before").textContent.length + startContainer.parentNode.querySelector(".selected-not-active").textContent.length;
		if (endContainer.parentNode.className == "selected-not-active")
			endOffset += startContainer.parentNode.querySelector(".before").textContent.length;
		if (endContainer.parentNode.className == "after")
			endOffset += startContainer.parentNode.querySelector(".before").textContent.length + startContainer.parentNode.querySelector(".selected-not-active").textContent.length;
	}
	textarea.focus();
	textarea.selectionStart = startOffset;
	textarea.selectionEnd = endOffset;
	onTextareaKeydown();
}

function showError(element, content) {
	if (element === null || element === undefined)
		return
	addClass(element, "bad");
	addClass(element, "bad-transparent");
	setTimeout(() => removeClass(element, "bad-transparent"), 1);
	addClass(select("#cursor"), "transparent");
	removeClass(select("#cursor"), "blink");
	removeClass(select("#cursor"), "smooth");
	setTimeout(() => onTextareaKeydown(), 200);
	element.setAttribute("data-error", content);
}

async function onButtonClick(e) {
	if (!editing) {
		editing = true;
		select(".button").textContent = "publish";
		select("#content-wrapper").setAttribute("contenteditable", "true");
		addClass(select("#cursor"), "blink");
		textarea.focus();
		onTextareaKeydown();
		return;
	}
	const lines = textarea.value.split("\n");

	const title = lines[0].trim();
	const author = lines[1].trim();

	let foundErrors = [];

	if (4 > title.length)
		foundErrors.push({at: "#title", message: "Title is too short."})
	if (250 < title.length)
		foundErrors.push({at: "#title", message: "Title is too long."})
	if (4 > author.length)
		foundErrors.push({at: "#author", message: "Author's name is too short."})
	if (100 < author.length)
		foundErrors.push({at: "#author", message: "Author's name is too long."})
	if (articleIsEmpty(true))
		foundErrors.push({at: "#content-wrapper>:nth-child(3)", message: "Empty article."})

	if (foundErrors.length != 0) {
		for (let i = 0; i < foundErrors.length; i++) {
			showError(select(foundErrors[i].at), foundErrors[i].message);
		}
		return;
	}

	const data = {
		id: window.id,
		text: textarea.value
	}

	const response = await (await fetch("/save", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(data)
	})).json();

	const {ok, id, errors} = response;

	if (ok) {
		if (id !== window.id) {
			window.id = id;
			history.pushState({id}, "New Article", `/${id}`);
		}
		editing = false;
		select(".button").textContent = "edit";
		select("#content-wrapper").setAttribute("contenteditable", "false");
		addClass(select("#cursor"), "transparent");
		removeClass(select("#cursor"), "blink");
		removeClass(select("#cursor"), "smooth");
	} else {
		for (const error in errors) {
			showError(select(error.at), error.message);
		}
	}
}

let {selectionStart, selectionEnd} = textarea;
let lines = textarea.value.split("\n");
if (lines.length < 3) {
	textarea.value += "\n".repeat(3 - lines.length);
	textarea.selectionStart = selectionStart;
	textarea.selectionEnd = selectionEnd;
}

window.addEventListener("resize", onTextareaKeydown);
window.addEventListener("load", onLoad);
document.addEventListener("mouseup", onArticleMouseup);
document.addEventListener("touchend", onArticleMouseup);
select(".button").addEventListener("click", onButtonClick);
textarea.addEventListener("keydown", onTextareaKeydown);
textarea.addEventListener("focusout", onTextareaFocusout);
textarea.addEventListener("paste", onTextareaPaste);
contentWrapper.addEventListener("mousedown", onArticleMousedown);
contentWrapper.addEventListener("touchstart", onArticleMousedown);

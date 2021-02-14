const select = (query) => document.querySelector(query);

const TITLE_MIN_LENGTH = 4;
const TITLE_MAX_LENGTH = 250;
const AUTHOR_MIN_LENGTH = 4;
const AUTHOR_MAX_LENGTH = 100;

contentWrapper = select("#content-wrapper");
textarea = select("textarea");

String.prototype.splice = function (start, delCount, newSubStr="") {
	return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
};

Array.prototype.indexOf = function (element) {
	for (let i = 0, l = this.length; i < l; ++i) {
		if (this[i] == element) {
			return i;
		}
	}
	return -1;
};

function addClass(element, className) {
	if (!element) {
		return;
	}
	let newClasses = element.getAttribute("class") || "";
	let classes = newClasses.split(" ");
	const index = classes.findIndex((cl) => cl === className);
	if (index === -1) {
		classes.push(className);
	}
	newClasses = classes.filter(cl => cl).join(" ");
	element.setAttribute("class", newClasses);
}

function removeClass(element, className) {
	if (!element) {
		return;
	}
	let newClasses = element.getAttribute("class") || "";
	let classes = newClasses.split(" ");
	const index = classes.findIndex((cl) => cl === className);
	if (index !== -1) {
		classes.splice(index, 1);
	}
	newClasses = classes.join(" ");
	element.setAttribute("class", newClasses);
}

function wrapNodeWith(node, wrapper) {
	const currentWrapper = wrapper.cloneNode(false);
	currentWrapper.append(node.cloneNode(true));
	node.replaceWith(currentWrapper);
	return currentWrapper;
}

function getAllTextNodesIn(element) {
	let ans = [];
	for (let i = 0; i < element.childNodes.length; ++i) {
		if (element.childNodes[i].nodeType === Node.TEXT_NODE) {
			ans.push(element.childNodes[i]);
		} else {
			ans = [...ans, ...getAllTextNodesIn(element.childNodes[i])];
		}
	}
	return ans;
}

function splitNodeAt(node, at, ...insert) {
	if (at == 0) {
		node.prepend(...insert);
		return;
	}
	if (at == node.textContent.length) {
		node.append(...insert);
		return;
	}

	const textNodes = getAllTextNodesIn(node);
	let previousLength = 0;
	let cutNode = null;
	for (let i = 0; i < textNodes.length; ++i) {
		if (previousLength < at && at <= previousLength + textNodes[i].length) {
			cutNode = textNodes[i];
			break;
		}
		previousLength += textNodes[i].length;
	}

	at -= previousLength;

	let leftPart = document.createTextNode(cutNode.textContent.slice(0, at)), rightPart = document.createTextNode(cutNode.textContent.slice(at));

	for (let currentNode = cutNode; currentNode !== node; currentNode = currentNode.parentNode) {
		let newLeftPart = currentNode.parentNode.cloneNode(false);
		newLeftPart.append(leftPart);
		let newRightPart = currentNode.parentNode.cloneNode(false);
		newRightPart.append(rightPart);
		leftPart = newLeftPart;
		rightPart = newRightPart;

		for (let prev = currentNode.previousSibling; prev; prev = prev.previousSibling) {
			leftPart.prepend(prev.cloneNode(true));
		}
		for (let next = currentNode.nextSibling; next; next = next.nextSibling) {
			rightPart.append(next.cloneNode(true));
		}
	}

	node.replaceChildren(...leftPart.childNodes, ...insert, ...rightPart.childNodes);
}

function splitTextContentAt(at, ...insert) {
	let prev = 0;
	for (let i = 0; i < contentWrapper.children.length; ++i) {
		const current = contentWrapper.children[i].querySelector(".text-content");
		if (prev <= at && at <= prev + current.textContent.length) {
			splitNodeAt(current, at - prev, ...insert);
			return;
		}
		prev += current.textContent.length + 1;
	}
}

function wrapTextWith(parent, wrapper, start, end) {
	if (start == end) {
		const curWrapper = wrapper.cloneNode(false)
		splitNodeAt(parent, start, curWrapper);
		return curWrapper;
	}
	splitNodeAt(parent, start);
	splitNodeAt(parent, end);
	const {childNodes} = parent;
	let previousLength = 0;
	let wrappedNodes = [];
	for (let i = 0; i < childNodes.length; ++i) {
		const current = childNodes[i];
		if (previousLength >= start && previousLength + current.textContent.length <= end) {
			wrappedNodes.push(current);
		}
		previousLength += current.textContent.length;
	}

	if (!wrappedNodes.length) {
		return;
	}

	wrapper = wrapNodeWith(wrappedNodes[0], wrapper.cloneNode(false));
	wrapper.append(...wrappedNodes.splice(1));
	return wrapper;
}

function wrapTextContentWith(wrapper, start, end) {
	let prev = 0;
	const startLine = getLine(start);
	const endLine = getLine(end);
	for (let i = 0; i < contentWrapper.children.length; ++i) {
		const current = contentWrapper.children[i].querySelector(".text-content");
		if (i >= startLine && i <= endLine) {
			let curStart = 0;
			let curEnd = current.textContent.length;
			if (i == startLine) {
				curStart = start - prev;
			}
			if (i == endLine) {
				curEnd = end - prev;
			}
			const curWrapper = wrapTextWith(current, wrapper, curStart, curEnd);
			if (i != endLine) {
				addClass(curWrapper, "imitate-line-break");
			}
		}
		prev += current.textContent.length + 1;
	}
}

function getLine(position) {
	let prev = 0;
	for (let i = 0; i < contentWrapper.children.length; ++i) {
		const current = contentWrapper.children[i].querySelector(".text-content");
		if (prev <= position && position < prev + current.textContent.length + 1) {
			return i;
		}
		prev += current.textContent.length + 1;
	}
}

function getLineHeight(element) {
	const compStyle = getComputedStyle(element);
    const temp = document.createElement(element.nodeName);
	temp.style.margin = 0;
	temp.style.padding = 0;
	temp.style.fontFamily = compStyle.fontFamily || "Georgia";
	temp.style.fontSize = compStyle.fontSize || "16px";
    temp.innerHTML = "A";
	element.parentNode.append(temp);
    let ret = temp.clientHeight;
    temp.parentNode.removeChild(temp);
    return ret;
}

function articleIsEmpty(nospaces=false) {
	const lines = textarea.value.split("\n");
	if (nospaces) {
		return lines.slice(2).join("").replaceAll(" ", "") === ""
	} else {
		return lines.slice(2).join("") === ""
	}
}

function params(json) {
	let paramsArr = [];
	for (const key in json) {
		paramsArr.push(`${key}=${json[key]}`);
	}
	return paramsArr.join("&");
}

async function onLoad(e) {
	mousedown = false;
	id = window.location.pathname.replaceAll("/", "");
	const response = await (await fetch(`/${id || "empty"}/raw_content`)).json();
	select("title").textContent = response.title;
	textarea.value = response.text || localStorage.getItem("draft");
	textarea.selectionStart = textarea.selectionEnd = 0;
	let lines = textarea.value.split("\n");
	if (lines.length < 3) {
		textarea.value += "\n".repeat(3 - lines.length);
	}
	editable = response.editable;
	editing = id == "";
	buffer = new UndoRedoBuffer(textarea.value);
	if (!editing) {
		const dateNode = document.createElement("span");
		dateNode.id = "date";
		dateNode.className = "transparent";
		setTimeout(() => dateNode.className = "", 1);
		dateNode.textContent = response.date;
		select("#author").append(dateNode);
		select("#author>br").remove();
		select("#author").append(document.createElement("br"));
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

function updateCursor() {
	textarea.style.top = `${select("#cursor-pos").getBoundingClientRect().top + window.scrollY}px`;
	select("#cursor").style.height = `${getLineHeight(contentWrapper.children[getLine(selectionStart)])}px`;
	select("#cursor").style.top = `${select("#cursor-pos").getBoundingClientRect().top + window.scrollY}px`;
	select("#cursor").style.left = `${select("#cursor-pos").getBoundingClientRect().left + window.scrollX - select("article").getBoundingClientRect().left}px`;
}

function onTextareaKeydown(e, startOffset, endOffset) {
	const prevContent = textarea.value;
	const prevSelectionStart = textarea.selectionStart;
	const prevSelectionEnd = textarea.selectionEnd;
	const prevSelectionDirection = textarea.selectionDirection;
	let undoRedo = false;
	if (e && e.ctrlKey) {
		if (e.code === "KeyZ") {
			e.preventDefault();
			undoRedo = true;
			let newVal, newSel;
			[newVal, newSel] = buffer.undo(prevSelectionStart, prevSelectionEnd, prevSelectionDirection);
			textarea.value = newVal;
			textarea.setSelectionRange(...newSel);
		} else if (e.code === "KeyY") {
			e.preventDefault();
			undoRedo = true;
			let newVal, newSel;
			[newVal, newSel] = buffer.redo();
			textarea.value = newVal;
			textarea.setSelectionRange(...newSel);
		}
	}
	setTimeout(() => {
		if (window.id === "") {
			localStorage.setItem("draft", textarea.value);
		}
		const changed = textarea.value !== prevContent;
		let {selectionStart, selectionEnd} = textarea;
		if (startOffset) {
			selectionStart = startOffset;
		}
		if (endOffset) {
			selectionEnd = endOffset;
		}
		if (changed && !undoRedo) {
			buffer.push(textarea.value, prevSelectionStart, prevSelectionEnd, prevSelectionDirection);
		}
		const caretMoved = selectionStart !== prevSelectionStart || selectionEnd !== prevSelectionEnd;
		let lines = textarea.value.split("\n");
		if (lines.length < 3) {
			textarea.value += "\n".repeat(3 - lines.length);
			textarea.selectionStart = selectionStart;
			textarea.selectionEnd = selectionEnd;
			lines = textarea.value.split("\n");
		}
		for (let i = 0; i < lines.length; ++i) {
			if (i < contentWrapper.children.length) {
				contentWrapper.children[i].querySelector(".text-content").textContent = lines[i];
				if (changed || caretMoved) {
					if (changed && contentWrapper.children[i].className.indexOf("bad") !== -1) {
						removeClass(contentWrapper.children[i], "bad");
						addClass(select("#cursor"), "transparent");
						removeClass(select("#cursor"), "smooth");
						setTimeout(() => onTextareaKeydown(), 200);
					}
					removeClass(select("#cursor"), "blink");
				}
				if (i < 2) {
					if (lines[i].length === 0) {
						addClass(contentWrapper.children[i], "empty");
					} else {
						removeClass(contentWrapper.children[i], "empty");
					}
				} else {
					if (articleIsEmpty()) {
						addClass(contentWrapper.children[i], "empty");
					} else {
						removeClass(contentWrapper.children[i], "empty");
					}
				}
			} else {
				const newParagraph = document.createElement("p");
				const newParagraphContent = document.createElement("span");
				newParagraphContent.textContent = lines[i];
				newParagraph.append(newParagraphContent);
				newParagraph.append(document.createElement("br"));
				addClass(newParagraphContent, "text-content");
				if (lines[i].length === 0) {
					addClass(newParagraph, "empty");
				} else {
					removeClass(newParagraph, "empty");
				}
				contentWrapper.append(newParagraph);
			}
		}

		for (let i = contentWrapper.children.length - 1; i >= lines.length; i--) {
			contentWrapper.children[i].remove();
		}
		if (selectionStart === selectionEnd) {
			const cursorPos = document.createElement("span");
			cursorPos.id = "cursor-pos";
			splitTextContentAt(selectionStart, cursorPos);
			if (editing) {
				addClass(select("#cursor"), "smooth");
				removeClass(select("#cursor"), "transparent");
				setTimeout(() => {addClass(select("#cursor"), "blink")}, 250);
			}
			textarea.style.top = `${select("#cursor-pos").getBoundingClientRect().top + window.scrollY}px`;
			textarea.style.height = `${getLineHeight(contentWrapper.children[getLine(selectionStart)])}px`;
			textarea.scrollIntoViewIfNeeded(false);
			if (window)
			select("#cursor").style.height = `${getLineHeight(contentWrapper.children[getLine(selectionStart)])}px`;
			select("#cursor").style.top = `${select("#cursor-pos").getBoundingClientRect().top + window.scrollY}px`;
			select("#cursor").style.left = `${select("#cursor-pos").getBoundingClientRect().left + window.scrollX - select("article").getBoundingClientRect().left}px`;
		} else if (selectionStart !== selectionEnd) {
			addClass(select("#cursor"), "transparent");
			removeClass(select("#cursor"), "smooth");
			removeClass(select("#cursor"), "blink");
			const selectedWrapper = document.createElement("span");
			selectedWrapper.className = "selected";
			wrapTextContentWith(selectedWrapper, selectionStart, selectionEnd);
		}
		let {fontFamily, fontSize, fontWeight} = getComputedStyle(contentWrapper.children[getLine(selectionStart)]);
		textarea.style.fontFamily = fontFamily;
		textarea.style.fontSize = fontSize;
		textarea.style.fontWeight = fontWeight;
	}, 1);
}

function onTextareaPaste(e) {
	e.preventDefault();
	var text;
	var clp = (e.originalEvent || e).clipboardData;
	if (!clp) {
		text = window.clipboardData.getData("text") || "";
		if (text !== "") {
			text = text.replace(/<[^>]*>/g, "");
			if (window.getSelection()) {
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
	if (!editing) {
		return;
	}
	addClass(select("#cursor"), "transparent");
	removeClass(select("#cursor"), "blink");
	removeClass(select("#cursor"), "smooth");
	const selected = document.querySelectorAll(".selected");
	for (let i = 0; i < selected.length; ++i) {
		selected[i].className = "selected-not-active";
	}
}

function onArticleMousedown(e) {
	if (!editing) {
		return;
	}
	if (!mousedown) {
		mousedown = true;
		const selected = document.querySelectorAll(".selected");
		for (let i = 0; i < selected.length; ++i) {
			selected[i].className = "selected-not-active";
		}
	}
}

function getParents(node) {
	if (node) {
		let parent = node.parentElement;
		let parents = [node, parent];
		while (parent !== document.body) {
			parent = parent.parentElement;
			parents.push(parent);
		}
		return parents;
	} else {
		return [];
	}
}

function leastCommonParent(a, b) {
	const aParents = getParents(a);
	const bParents = getParents(b);

	for (let i = 0; i < aParents.length; ++i) {
		if (bParents.indexOf(aParents[i]) !== -1) {
			return aParents[i];
		}
	}
	return null;
}

function getSelectionRange() {
	if (document.getSelection().rangeCount == 0)
		return null;
	const sel = document.getSelection();
	let {startOffset, startContainer, endOffset, endContainer} = document.getSelection().getRangeAt(0);
	startOffset = startContainer.textContent.length ? startOffset : 0;
	endOffset = endContainer.textContent.length ? endOffset : 0;

	const startParents = getParents(startContainer);
	const endParents = getParents(endContainer);
	if (startParents.indexOf(contentWrapper) === -1) {
		return null;
	}
	if (endParents.indexOf(contentWrapper) === -1) {
		return null;
	}

	let currentParrent = startContainer;
	for (let i = 0; i < startParents.length; ++i) {
		const parent = startParents[i];
		if (parent !== startContainer) {
			let tmp = currentParrent;
			while (tmp.previousSibling) {
				tmp = tmp.previousSibling;
				if (tmp.nodeName !== "BR") {
					let prevLength = tmp.textContent.length + (tmp.querySelectorAll ? tmp.querySelectorAll("br").length : 0);
					startOffset += prevLength;
				} else {
					++startOffset;
				}
			}
		}
		currentParrent = parent;
		if (parent === contentWrapper) {
			break;
		}
	}
	currentParrent = endContainer;
	for (let i = 0; i < endParents.length; ++i) {
		const parent = endParents[i];
		if (parent !== endContainer) {
			let tmp = currentParrent;
			while (tmp.previousSibling) {
				tmp = tmp.previousSibling;
				if (tmp.nodeName !== "BR") {
					let prevLength = tmp.textContent.length + (tmp.querySelectorAll ? tmp.querySelectorAll("br").length : 0);
					endOffset += prevLength;
				} else {
					++endOffset;
				}
			}
		}
		currentParrent = parent;
		if (parent === contentWrapper) {
			break;
		}
	}

	const position = sel.anchorNode.compareDocumentPosition(sel.focusNode);
	let backward = false;
	if (!position && sel.anchorOffset > sel.focusOffset || position === Node.DOCUMENT_POSITION_PRECEDING) {
		backward = true;
	}

	const direction = backward ? "backward" : "forward";

	return {startOffset, endOffset, direction};
}

function onArticleMouseup(e) {
	if (!editing) {
		return;
	}
	const {startOffset, endOffset, direction} = getSelectionRange();
	const selectedWrapper = document.createElement("span");
	selectedWrapper.className = "selected";
	if (startOffset != endOffset) {
		wrapTextContentWith(selectedWrapper, startOffset, endOffset);
	} else {
		onTextareaKeydown(undefined, startOffset, endOffset);
	}
	textarea.focus();
	textarea.setSelectionRange(startOffset, endOffset, direction);
	mousedown = false;
}

function showError(element, content) {
	if (!element) {
		return
	}
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
		select("#date").className = "transparent";
		setTimeout(() => select("#date").remove(), 100);
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

	if (4 > title.length) {
		foundErrors.push({at: "#title", message: "Title is too short."})
	}
	if (250 < title.length) {
		foundErrors.push({at: "#title", message: "Title is too long."})
	}
	if (4 > author.length) {
		foundErrors.push({at: "#author", message: "Author's name is too short."})
	}
	if (100 < author.length) {
		foundErrors.push({at: "#author", message: "Author's name is too long."})
	}
	if (articleIsEmpty(true)) {
		foundErrors.push({at: "#content-wrapper>:nth-child(3)", message: "Empty article."})
	}

	if (foundErrors.length != 0) {
		for (let i = 0; i < foundErrors.length; ++i) {
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

	const {ok, id, errors, date} = response;

	if (ok) {
		if (window.id === "") {
			localStorage.setItem("draft", "");
		}
		if (id !== window.id) {
			window.id = id;
			history.pushState({id}, "New Article", `/${id}`);
		}
		editing = false;
		const dateNode = document.createElement("span");
		dateNode.id = "date";
		dateNode.textContent = date;
		dateNode.className = "transparent";
		setTimeout(() => dateNode.className = "", 1);
		select("title").textContent = title;
		select("#author").append(dateNode);
		select("#author>br").remove();
		select("#author").append(document.createElement("br"));
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

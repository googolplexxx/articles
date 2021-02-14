function UndoRedoBuffer(firstStateText) {
	this.states = [[{
		type: '+',
		at: 0,
		content: firstStateText
	}]];
	this.selections = []
	this.currentState = 0;
	this.currentStateText = firstStateText;
}

UndoRedoBuffer.prototype = {
	undo(start, end, dir) {
		if (this.currentState == 0) {
			return [this.currentStateText, this.selections[this.currentState]];
		}
		this.selections.push([start, end, dir]);
		const state = this.states[this.currentState];
		let lastStateText = this.currentStateText;
		for (let i = state.length - 1; i >= 0; --i) {
			const change = state[i];
			switch (change.type) {
			case '+':
				lastStateText = lastStateText.splice(change.at, change.content.length);
				break;
			case '-':
				lastStateText = lastStateText.splice(change.at, 0, change.content);
				break;
			}
		}
		--this.currentState;
		this.currentStateText = lastStateText;
		return [this.currentStateText, this.selections[this.currentState]];
	},
	redo() {
		if (this.currentState == this.states.length - 1) {
			return [this.currentStateText, this.selections[this.currentState]];
		}
		const state = this.states[this.currentState + 1];
		let nextStateText = this.currentStateText;
		for (let i = 0; i < state.length; ++i) {
			const change = state[i];
			switch (change.type) {
			case '+':
				nextStateText = nextStateText.splice(change.at, 0, change.content);
				break;
			case '-':
				nextStateText = nextStateText.splice(change.at, change.content.length);
				break;
			}
		}
		++this.currentState;
		this.currentStateText = nextStateText;
		return [this.currentStateText, this.selections[this.currentState]];
	},
	push(newStateText, start, end, dir) {
		const lines = newStateText.split("\n");
		if (lines.length < 3) {
			newStateText += "\n".repeat(3 - lines.length);
		}
		this.states = this.states.slice(0, this.currentState + 1);
		this.states.push(compare(this.currentStateText, newStateText));
		this.selections = this.selections.slice(0, this.currentState);
		this.selections.push([start, end, dir]);

		++this.currentState;
		this.currentStateText = newStateText;
	},
}

function compare(a, b) {
	const diff = new Diff();
	const chunks = diff.diff(a, b);
	let state = [];
	let len = 0;
	for (let i = 0; i < chunks.length; ++i) {
		const chunk = chunks[i];
		if (chunk.added) {
			state.push({
				type: '+',
				at: len,
				content: chunk.value
			});
		} else if (chunk.removed) {
			state.push({
				type: '-',
				at: len,
				content: chunk.value
			});
			len -= chunk.value.length;
		}
		len += chunk.value.length;
	}
	return state;
}
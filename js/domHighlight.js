/* File used to store DOM animation functions */

/**
 * Highlights (or removes highlight from) a block in the main memory with the color
 * passed by parameter
 * @param {String} bgcolor color with which highlight the row
 * @param {HTMLTableRowElement} mmLine the main memory table row  in which block is allocated
 */
function toggleHglMmBlock(bgcolor = "", mmLine) {
	mmLine[0].scrollIntoView({
		behavior: "smooth",
		block: "nearest",
		inline: "start",
	});

	mmLine.removeClass();
	if (bgcolor) mmLine.toggleClass(bgcolor);
}

/**
 * Highlights (or removes highlight from) the valid bit cell
 * @param {String} bgcolor color with which highlight the cell
 * @param {HTMLTableRowElement} line cache row where the cell is allocated
 */
function toggleHglValid(bgcolor = "", line = "") {
	// Highlight a specific line
	if (line) {
		line.find("td:eq(1)").removeClass();
		if (bgcolor) line.find("td:eq(1)").toggleClass(bgcolor);
	} else {
		let currLine;
		// Highlight all lines according to the placement policy
		for (i = 0; i < nway; i++) {
			// If fully associative, get every column in the table
			if (ppolicy == "fullyAssociative") currLine = $("#way-0 > tbody > tr:eq(" + i + ") > td:eq(1)");
			// Otherwise, get the corresponding line on each table
			else currLine = $("#way-" + i + " > tbody > tr:eq(" + set + ") > td:eq(1)");

			// highlight
			currLine.removeClass();
			if (bgcolor) currLine.toggleClass(bgcolor);
		}
	}
}

/**
 * Highlights (or removes highlight from) the tag bits cell
 * @param {String} bgcolor color with which highlight the cell
 * @param {HTMLTableRowElement} line cache row where the cell is allocated
 */
function toggleHglTag(bgcolor = "", line = "") {
	// Highlight a specific line
	if (line) {
		line.find("td:eq(3)").removeClass();
		if (bgcolor) line.find("td:eq(3)").toggleClass(bgcolor, 500);
	} else {
		let currLine;
		// Highlight all lines according to the placement policy
		for (i = 0; i < nway; i++) {
			// If fully associative, get every column in the table
			if (ppolicy == "fullyAssociative") currLine = $("#way-0 > tbody > tr:eq(" + i + ") > td:eq(3)");
			// Otherwise, get the corresponding line on each table
			else currLine = $("#way-" + i + " > tbody > tr:eq(" + set + ") > td:eq(3)");

			// highlight
			currLine.removeClass();
			if (bgcolor) currLine.toggleClass(bgcolor, 500);
		}
	}
}

/**
 * Highlights (or removes highlight from) the dirty bit cell
 * @param {String} bgcolor bgcolor color with which highlight the cell
 * @param {HTMLTableRowElement} line cache row where the cell is allocated
 */
function toggleHglDirty(bgcolor = "", line) {
	line.find("td:eq(2)").removeClass();
	if (bgcolor) line.find("td:eq(2)").toggleClass(bgcolor);
}

/**
 * Highlights (or removes highlight from) the replacement bits cells
 * @param {String} bgcolor bgcolor color with which highlight the cells
 */
function toggleHglReplBits(bgcolor) {
	let currLine;
	// Highlight all lines according to the placement policy
	for (i = 0; i < nway; i++) {
		// If fully associative, get every column in the table
		if (ppolicy == "fullyAssociative") currLine = $("#way-0 > tbody > tr:eq(" + i + ") > td:eq(4)");
		// Otherwise, get the corresponding line on each table
		else currLine = $("#way-" + i + " > tbody > tr:eq(" + set + ") > td:eq(4)");

		// highlight
		currLine.removeClass();
		if (bgcolor) currLine.toggleClass(bgcolor, 500);
	}
}

/**
 * Highlights (or removes highlight from) simulator message displayer
 * @param {String} bgcolor with which highlight simulator message displayer
 */
function toggleHglSimMsg(bgcolor = "") {
	let simMsg = $("#simMsg");
	simMsg.removeClass("red-5 blue-8 green-5");
	if (bgcolor) simMsg.toggleClass(bgcolor);
}

/**
 * Highlights (or removes highlight from) the cache row
 * passed by parameter
 * @param {String} bgcolor with which highlight simulator message displayer
 * @param {HTMLTableRowElement} line cache row where the block is allocated
 */
function toggleHglCacheLine(bgcolor = "", line) {
	line.find("td:gt(4)").removeClass();
	if (bgcolor) line.find("td:gt(4)").toggleClass(bgcolor);
}

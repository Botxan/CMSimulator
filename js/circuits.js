// Array to store all the connected elements;
var connections = [];
var svg = $("#circuitsSVG");
var sets;

/**
 * Draws the path in the screen depending on the given parameters.
 * @param {SVGPathElement} path the path to be drawn
 * @param {Number} startX the starting X position
 * @param {Number} startY the starting Y position
 * @param {Number} endX the ending X position
 * @param {Number} endY the ending Y position
 * @param {String} outputDir the side from where the path is arriving to the element
 * @param {String} inputDir the side from where the path is leaving the source element
 */
function drawPath(path, startX, startY, endX, endY, outputDir, inputDir) {
	if (outputDir === "bottom" && inputDir === "top") {
		path.attr("d", "M" + startX + " " + startY + " V" + (startY + 40) + " H" + endX + " V" + endY);
	} else if (outputDir === "bottom" && inputDir === "left") {
		// lines from breakdown table to set
		path.attr("d", "M" + startX + " " + startY + " V" + (startY + 30) + " H" + (endX - 30) + " V" + endY + " H" + endX);
	}
}

/**
 * Adjusts the input and output of the given path.
 * @param {SVGPathElement} path the SVG path to be adjusted
 * @param {HTMLElement} outputEl the element that marks the end point of the path
 * @param {HTMLElement} inputEl the element that marks the starting point of the path
 * @param {String} outputDir the side from where the path is arriving to the element
 * @param {String} inputDir the side from where the path is leaving the source element
 * @param {Number} inputN in case the destination element has more than one input
 * it is the flag that indicates the output position of the path
 */
function connectElements(path, outputEl, inputEl, outputDir, inputDir, inputN) {
	// if first element is lower than the second, swap!
	if (outputEl.offset().top > inputEl.offset().top) {
		var temp = outputEl;
		outputEl = inputEl;
		inputEl = temp;
	}
	// get (top, left) corner coordinates of the svg container
	var svgTop = svg.offset().top;
	var svgLeft = svg.offset().left;

	// get (top, left) coordinates for the two elements
	var startCoord = outputEl.offset();
	var endCoord = inputEl.offset();

	// calculate path's start (x,y) coords depending on outputDir parameter
	var startX;
	var startY;
	switch (outputDir) {
		case "top":
			startX = startCoord.left + 0.5 * outputEl.outerWidth() - svgLeft;
			startY = startCoord.top - svgTop;
			break;
		case "right":
			startX = startCoord.left + outputEl.outerWidth() - svgLeft;
			startY = startCoord.top + 0.5 * outputEl.outerHeight() - svgTop;
			break;
		case "bottom":
			startX = startCoord.left + 0.5 * outputEl.outerWidth() - svgLeft;
			startY = startCoord.top + outputEl.outerHeight() - svgTop;
			break;
		case "left":
			startX = startCoord.left - svgLeft;
			startY = startCoord.top + 0.5 * outputEl.outerHeight() - svgTop;
			break;
	}

	// calculate path's end (x,y) coords depending on inputDir parameter
	var endX;
	var endY;
	switch (inputDir) {
		case "top":
			// Comparer and AND gates have 2 input
			if (inputN === 1) endX = endCoord.left + 0.25 * inputEl.outerWidth() - svgLeft;
			else if (inputN === 2) endX = endCoord.left + 0.75 * inputEl.outerWidth() - svgLeft;
			else endX = endCoord.left + 0.5 * inputEl.outerWidth() - svgLeft;
			endY = endCoord.top - svgTop;
			break;
		case "right":
			endX = endCoord.left + inputEl.outerWidth() - svgLeft;
			endY = endCoord.top + 0.5 * inputEl.outerHeight() - svgTop;
			break;
		case "bottom":
			endX = endCoord.left + 0.5 * inputEl.outerWidth() - svgLeft;
			endY = endCoord.top + inputEl.outerHeight() - svgTop;
			break;
		case "left":
			endX = endCoord.left - svgLeft;
			endY = endCoord.top + 0.5 * inputEl.outerHeight() - svgTop;
			break;
	}

	// call function for drawing the path
	drawPath(path, startX, startY, endX, endY, outputDir, inputDir, inputN);
}

/**
 * Calls to connectElement with all the paths stored in connections array.
 */
function connectAll() {
	// connect all elements that are in connections array
	connections.forEach(function (connection) {
		connectElements(connection[0], connection[1], connection[2], connection[3], connection[4], connection[5], connection[6]);
	});
}

/**
 * Creates an SVG path element with the id passed by parameter.
 * @param {String} id the path id attribute
 * @returns SVG path element
 */
function createPath(id) {
	let newpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
	$(newpath).attr({
		id: id,
		d: "M0 0",
		style: "stroke: #555; stroke-width: 0.2em; fill: none; opacity: 0; transition: opacity 0.3s",
	});
	svg.append(newpath);
	return newpath;
}

/**
 * Creates the corresponding wires and functional units according to the placement policy.
 */
function drawCircuits() {
	sets = 1;
	if (ppolicy == "setAssociative") sets = nway;

	for (i = 0; i < sets; i++) {
		// Create paths from breakdown table (tag) to cache tables (tag)
		addCircuitWire("ItagbreakdownOtagcache" + i, $("#breakdown > tbody > tr:last > td:eq(0)"), $("#way-" + i + " > thead > tr:first > th:eq(3)"), "bottom", "top", 0);

		// Create paths from breakdown table (tag) to tag comparator
		addCircuitWire("ItagbreakdownOcomparator" + i, $("#breakdown > tbody > tr:last > td:eq(0)"), $("#comparatorWay" + i), "bottom", "top", 1);

		// Create wires from cache tables to tag comparator
		addCircuitWire("ItagcacheOcomparator" + i, $("#way-" + i + " > tbody > tr:last > td:eq(3)"), $("#comparatorWay" + i), "bottom", "top", 2);

		// Create wires from cache tables to and gate (valid bit)
		addCircuitWire("IvalidcacheOand" + i, $("#way-" + i + " > tbody > tr:last > td:eq(1)"), $("#andGateWay" + i), "bottom", "top", 1);

		// Create wires from comparator output to AND gate input
		addCircuitWire("IcomparatorOand" + i, $("#comparatorWay" + i), $("#andGateWay" + i), "bottom", "top", 2);
	}

	// Draw lines for:
	// breakdown set -> cache set
	for (i = 0; i < $("#way-0 tr").length - 1; i++) addCircuitWire("IbreakdownOsetcache" + i, $("#breakdown > tbody > tr:last > td:eq(1)"), $("#way-0 > tbody > tr:eq(" + i + ") > td:eq(0)"), "bottom", "left", 0);

	connectAll();
}

/**
 * Auxiliar function to create a path and push it to the array of connections.
 * @param {String} id path id
 * @param {HTMLElement} output path source HTML element
 * @param {HTMLElement} input path destination HTML element
 * @param {String} outputDir the side from where the path is arriving to the element
 * @param {String} inputDir the side from where the path is leaving the source element
 * @param {Number} nInput in case the destination element has more than one input
 * it is the flag that indicates the output position of the path
 */
function addCircuitWire(id, output, input, outputDir, inputDir, nInput) {
	// Create the path
	newpath = createPath(id);

	// Add new wire to array of wires
	connections.push([$(newpath), output, input, outputDir, inputDir, nInput]);
}

/**
 * Shows/Hides the given circuit element, with the color passed
 * by parameter.
 * @param {HTMLElement} el the element of the circuit
 * @param {String} color the color with which display the element
 */
function toggleCircuitEl(el, color = "") {
	// Remove element if no color is specified
	if (!color) {
		el.css({
			opacity: 0,
			stroke: "#555",
		});
	} else {
		el.css({
			opacity: 1,
			stroke: color,
		});
	}
}

$(document).ready(function () {
	connectAll();
});

/**
 * Maintains SVG's responsiveness when resizing the window/browser.
 */
$(window).resize(function () {
	$("#circuitsSVG").css("height", window.document.body.scrollHeight);
	connectAll();
});

/* ***** Cable toggling functions ***** */

/**
 * Displays/Hides the wires that connect the tag cell from breakdown table to
 * cache tables.
 * @param {String} color wire color
 */
function toggleBrtagCtagWs(color = "") {
	if (ppolicy === "setAssociative") sets = nway;
	for (i = 0; i < sets; i++) toggleCircuitEl($("#ItagbreakdownOtagcache" + i), color);
}

/**
 * Displays/Hides the wires that connect the set cell from breakdown table to
 * cache tables.
 * @param {String} color wire color
 */
function toggleBrsetCsetWs(color = "") {
	if (ppolicy === "fullyAssociative") for (i = 0; i < nway - 1; i++) toggleCircuitEl($("#IbreakdownOsetcache" + i), color);
	else toggleCircuitEl($("#IbreakdownOsetcache" + set), color);
}

/**
 * Displays/Hides the wires that connect the tag cell from breakdown table to
 * comparators.
 * @param {String} color wire color
 */
function toggleBrtagComp(color = "") {
	if (ppolicy == "setAssociative") sets = nway;
	for (i = 0; i < sets; i++) toggleCircuitEl($("#ItagbreakdownOcomparator" + i), color);
}

/**
 * Displays/Hides the wires that connect the tag cell from cache tables to
 * comparators.
 * @param {String} color wire color
 */
function toggleCtagComp(color = "") {
	for (i = 0; i < sets; i++) toggleCircuitEl($("#ItagcacheOcomparator" + i), color);
}

/**
 * Displays/Hides the wires that connect the valid cell from cache tables to
 * AND gates.
 * @param {String} color wire color
 */
function toggleValidAnd(color = "") {
	for (i = 0; i < sets; i++) toggleCircuitEl($("#IvalidcacheOand" + i), color);
}

/**
 * Displays/Hides the wires that connect the tag cell from comparators to
 * AND gates.
 * @param {String} color wire color
 */
function toggleCompAnd(color = "") {
	for (i = 0; i < sets; i++) toggleCircuitEl($("#IcomparatorOand" + i), color);
}

/**
 * Displays/Hides comparatos.
 * @param {String} on flag to show or hide the comparator
 */
function toggleComparator(on) {
	for (i = 0; i < sets; i++) toggleCircuitEl($("#comparatorWay" + i), on);
}

/**
 * Displays/Hides AND gates.
 * @param {String} src the source of the AND gate picture
 * @param {String} hitWay identifier of the table where the hit occurred
 */
function toggleAndGate(src, hitWay = -1) {
	if (src) {
		for (i = 0; i < sets; i++) {
			$("#andGateWay" + i).css("opacity", 1);
			if (i === hitWay) $("#andGateWay" + i).attr("src", "img/ANDhit.svg");
			else $("#andGateWay" + i).attr("src", src);
		}
	} else {
		for (i = 0; i < sets; i++) {
			$("#andGateWay" + i).css("opacity", 0);
			$("#andGateWay" + i).attr("src", "img/AND.svg");
		}
	}
}

// Dom elements
const instructionI = $("#instruction");
const genRandAddrBtn = $("#genRandAddr");
const sendBtn = $("#send");
const breakdownT = $("#breakdown");
const nextBtn = $("#next");
const fastForwardBtn = $("#fastForward");
const mmT = $("#mmTable > tbody:eq(0)");
const calcTBody = $("#calcTable > tbody:eq(0)");
const accessTT = $("#accessTimeTable > tbody:eq(0)");
const hitMissRateTable = $("#hitMissRateTable > tbody:eq(0)");

// Form values
var blsize, wsize, mmsize, tmm, tbuff, cmsize, tcm, ppolicy, nway, wpolicy, walloc, rpolicy;
var validSetup = false;

// Address structure bits
var brAddrBits, brByteBits, brWordBits, brBlockBits, brTagBits, brLineBits, brSetBits;
brAddrBits = brByteBits = brWordBits = brBlockBits = brTagBits = brLineBits = brSetBits = 0;

var addr, line, mmLine, hitLine, dirtyBit;

// Binary address
var binAddr;
// Adress breakdown
var byteBits, wordBits, blockBits, tagBits, setBits;
// Decimal equivalences for each part of the breakdown
var addr, byte, word, block, tag, set;

// Operation
var op;
var stage = -1;
var blockData = [];

// Times
var tBt; // time to transfer a block from main memory to cache memory
var pTime = 0; // partial time
var tTime = 0; // total time

// Charts
var hitMistRateChart;
var hits = 0;
var misses = 0;
var accessTimeChart;

// Open setup sidenav
openNav();

// Adds "Enter" key listener to instruction input
instructionI.on("keypress", function (e) {
	if (e.which == 13) processAddr();
});

/**
 * Enables nway input
 */
function enableNway() {
	let nway = $("[name='nway']");
	if (nway.is(":disabled")) nway.prop("disabled", false);
}

/**
 * Disables nway input
 */
function disableNway() {
	let nway = $("[name='nway']");
	if (!nway.is(":disabled")) nway.prop("disabled", true);
}

/**
 * Opens the sidenav
 */
function openNav() {
	$("#setupSidenav").css("transform", "translateX(0)");
	$("#main").css({
		opacity: ".6",
		"pointer-events": "none",
	});
}

/**
 * Closes the sidenav
 */
function closeNav() {
	if (validSetup === true) {
		$("#setupSidenav").css("transform", "translateX(-580px)");
		$("#main").css({
			opacity: "1",
			"pointer-events": "auto",
		});
	}
}

/**
 * @returns Changes the submit button to reset. Starts form validtion
 */
function onSubmit() {
	submitBtn = $("#submit");
	if (submitBtn.val() == "submit") {
		// Validate form
		valid = validateSetupForm();
		if (valid) {
			validSetup = true;
			// Mark
			// Disable setup form
			disableForm();
			// Change submit button to reset
			submitBtn.html("reset").val("reset").removeClass("btn-default").addClass("btn-danger");
			// Hide setup sidenav
			closeNav();
			// Setup simulator
			setupSimulator();
		}

		// Else, reload the app
	} else reset();

	// Don't refresh the app on submit
	return false;
}

/**
 * Disables the setup form
 */
function disableForm() {
	// Disable whole form pointer-events -
	$('form[name="setupForm"]').children().css("pointer-events", "none").not("#submit").css("opacity", ".5");

	// - Except submit button
	$("#submit").css("pointer-events", "auto");
}

/** Reload the app */
function reset() {
	location.reload();
}

/**
 * Setup form validation
 */
function validateSetupForm() {
	let err = "";
	let valid = true;

	// Get form fields
	blsize = parseInt($("#blsize").val());
	wsize = parseInt($("#wsize").val());

	mmsize = parseInt($("#mmsize").val());
	tmm = parseInt($("#tmm").val());
	tbuff = parseInt($("#tbuff").val());
	cmsize = parseInt($("#cmsize").val());
	tcm = parseInt($("#tcm").val());

	ppolicy = $('input[name="ppolicy"]:checked').val();
	nway = parseInt($("#nway").val());

	wpolicy = $('input[name="wpolicy"]:checked').val();
	walloc = $('input[name="walloc"]:checked').val();

	rpolicy = $('input[name="rpolicy"]:checked').val();

	// ***** Input validations *****

	// Block size must be power of two
	if (((blsize & (blsize - 1)) != 0) | Number.isNaN(blsize)) {
		err += "Block size has to be power of 2.\n";
		valid = false;
	}

	// Word size must be power of two
	if (((wsize & (wsize - 1)) != 0) | Number.isNaN(wsize)) {
		err += "Word size has to be power of 2.\n";
		valid = false;
	}

	// MM size must be power of two and can not be empty
	if ((mmsize & (mmsize - 1)) != 0 || Number.isNaN(mmsize)) {
		err += "Main memory size has to be power of 2.\n";
		valid = false;
	}

	// MM access time can not be empty
	if (Number.isNaN(tmm)) {
		err += "Access time for main memory must be specified.\n";
		valid = false;
	}

	// Interleaving buffers access time can not be empty
	if (Number.isNaN(tbuff)) {
		err += "Buffer access time must be specified.\n";
		valid = false;
	}

	// CM size must be power of two and can not be empty
	if ((cmsize & (cmsize - 1)) != 0 || Number.isNaN(cmsize)) {
		err += "Cache memory size has to be power of 2.\n";
		valid = false;
	}

	// CM access time can not be empty
	if (Number.isNaN(tcm)) {
		err += "Access time for cache memory must be specified.\n";
		valid = false;
	}

	// CM size can not be bigger than MM size
	if (cmsize > mmsize) {
		err += "Cache memory can not be bigger than the main memory.\n";
		valid = false;
	}

	// Word size must be smaller than MM and CM sizes
	if (wsize > cmsize || wsize > mmsize) {
		err += "Word size must be smaller than cache memory and main memory sizes.\n";
		valid = false;
	}

	// Nway must be specified in case of set associative

	if (ppolicy == "setAssociative" && ((nway != 2 && nway != 4) || isNaN(nway))) {
		err += "Nway must be specified in case of set-associative and must be 2 or 4.\n";
		valid = false;
	}

	// If form is valid, Calculate corresponding Nway
	if (valid) {
		nway = calcNWay(ppolicy, cmsize, blsize, wsize);
		$("#nway").val(nway);
	}
	// Otherwise alert errors
	else alert(err);

	// console.log("Block size (words): " + blsize + ".\nWord size: " + wsize
	//     + ".\n\nMain memory size: " + mmsize + ".\nMain memory access time: " + tmm
	//     + ".\nInterleaving buffer access time: " + tbuff
	//     + ".\n\nCache memory size: " + cmsize + ".\nCache memory access time: " + tcm
	//     + ".\n\nPlacement policy: "+ ppolicy + ".\nN-way: " + nway
	//     + ".\n\nWriting policy: " + wpolicy + ".\nWriting allocation: " + walloc
	//     + ".\n\nReplacement policy: " + rpolicy + "."
	// );

	return valid;
}

/**
 * Calculates the number of sets depending on placement policy
 * @param {string} ppolicy placement policy
 * @param {number} cmsize cache size
 * @param {number} blsize size of the block (words)
 * @param {number} wsize size(bytes) per word
 * @returns number of block
 */
function calcNWay(ppolicy, cmsize, blsize, wsize) {
	let nway;
	switch (ppolicy) {
		case "directMap":
			// one line = one set
			nway = 1;
			break;
		case "fullyAssociative":
			// same as number of lines
			nway = cmsize / (blsize * wsize);
			break;
		case "setAssociative":
			// the input introduced by the user
			nway = parseInt($("#nway").val());
			break;
	}
	return nway;
}

/**
 * Set up simulator when cache and main memory parameters are valid
 */
function setupSimulator() {
	// Calculate time to transfer a block
	tBt = tmm + (blsize - 1) * tbuff;

	// address breakdown
	calcAddressBreakdown(mmsize, cmsize, blsize, wsize);

	// Update address breakdown table
	updateBreakdownTable(brTagBits + "b", brSetBits + "b", brWordBits + "b", brByteBits + "b");

	// Prints breakdown calculations in the corresponding element
	calcTBody.find("tr:eq(0) > td:eq(1)").html("Log₂(" + mmsize + ") = " + brAddrBits + " bits");
	calcTBody.find("tr:eq(1) > td:eq(1)").html("Log₂(" + wsize + ") = " + brByteBits + " bits");
	calcTBody.find("tr:eq(2) > td:eq(1)").html("Log₂(" + blsize + ") = " + brWordBits + " bits");
	calcTBody.find("tr:eq(3) > td:eq(1)").html(brAddrBits + " - (" + brWordBits + " + " + brByteBits + ") = " + brBlockBits + " bits");
	calcTBody.find("tr:eq(4) > td:eq(1)").html("Log₂(" + lines + ") = " + brLineBits + " bits");
	calcTBody.find("tr:eq(5) > td:eq(1)").html("Log₂(" + lines + " / " + nway + ") = " + brSetBits + " bits");
	calcTBody.find("tr:eq(6) > td:eq(1)").html(brBlockBits + " - " + brSetBits + " = " + brTagBits + " bits");

	// Draw cache memory table/s
	buildCM();

	// Draw main memory table
	buildMM();

	// Focus address input
	instructionI.focus();

	// Setup access times chart
	setupAccessTimeChart();

	// Setup hit/miss rate chart
	setupHitMissRateChart();

	// Toggle simulator controls
	toggleSimBtns();
}

/**
 * Calculates breakdown bits
 * @param {number} mmsize
 * @param {number} cmsize
 * @param {number} blsize
 * @param {number} wsize
 */
function calcAddressBreakdown(mmsize, cmsize, blsize, wsize) {
	// Number of bits for whole address = log2(main memory size in bytes)
	brAddrBits = Math.log2(mmsize);
	// Bits to identify byte in a word = log2(word size in bytes)
	brByteBits = Math.log2(wsize);
	// Bits to identify a word in a block = log2(words per block)
	brWordBits = Math.log2(blsize);
	// Bits to identify a block in the memory =
	// whole address bits - bits for word in block - bits for byte in word
	brBlockBits = brAddrBits - (brWordBits + brByteBits);
	// Number of lines in cache = cache size / (words per block * word size in bytes)
	// or cache size / (bytes per block)
	lines = cmsize / (blsize * wsize);
	// Bits to identify a line in cache memory = log2(number of lines)
	brLineBits = Math.log2(lines);
	// Bits to identify the corresponding set for a block = log2(number of lines / nway)
	brSetBits = Math.log2(lines / nway);
	// Bits to identify the tag = bits for the whole block - bits for the set
	brTagBits = brBlockBits - brSetBits;
	// console.log("Bits:" + "\nTotal number of bits in address: " + addrBits + ".\nByte in a word: " + byteBits
	//     + ".\nWord in a block: " + wordBits + ".\nBlock: " + blockBits + ".\nLine: " + lineBits
	//     + ".\nsetBits: " + setBits + ".\ntagBits: " + tagBits);
}

/**
 * Updates the content of the breakdown table
 * @param {*} row table row
 * @param {*} cell table cell
 * @param {*} val new value
 */
function updateBreakdownTable(tag, set, word, byte) {
	row = "#breakdown > tbody > tr:eq(0) > ";
	$(row + "td:eq(0)").html(tag);
	$(row + "td:eq(1)").html(set);
	$(row + "td:eq(2)").html(word);
	$(row + "td:eq(3)").html(byte);
}

/**
 * Draws the cache memory on the screen
 */
function buildCM() {
	let cmtables = $("#cmTables");
	let sets = 1;
	if (ppolicy == "setAssociative") sets = nway;

	// Create as many tables as sets
	for (i = 0; i < sets; i++) {
		// Create table for set
		let wrapper = $("<div>").addClass("table-wrapper col-" + 12 / sets);
		let table = $("<table>")
			.attr("id", "way-" + i)
			.addClass("table table-bordered table-sm text-center z-depth-1");
		table.append("<thead><tr><th>set</th><th>valid</th><th>dirty</th><th>tag</th><th>repl</th><th colspan='" + blsize + "'>block</th></thead>");
		table.append("<tbody>");
		// Lines per set
		for (j = 0; j < lines / sets; j++) {
			table.append(
				"<tr><td>" +
					(ppolicy == "fullyAssociative" ? "-" : j) +
					"</td><td>0</td><td>0</td><td>-</td><td>" +
					(rpolicy === "random"
						? "-"
						: ppolicy == "fullyAssociative"
						? toPaddedBinary(j, Math.log2(nway))
						: ppolicy == "setAssociative"
						? toPaddedBinary(i, Math.log2(nway))
						: "-") +
					"</td>" +
					new Array(blsize + 1).join("<td>-</td>") +
					"</tr>"
			);
		}
		table.append("</tbody>");
		wrapper.append(table);
		cmtables.append(wrapper);
	}
}

/**
 * Draws the main memory on the screen
 */
function buildMM() {
	let row;

	// Block per row
	for (i = 0; i < mmsize / (blsize * wsize); i++) {
		row = "<tr>";
		for (j = 0; j < blsize; j++) row += "<td>B" + i + "W" + j + "</td>";
		row += "</tr>";
		mmT.append(row);
	}
}
/**
 * Returns a random valid address (byte)
 */
function getRandomAddr() {
	instructionI.val(Math.floor(Math.random() * mmsize));
}

/**
 * Checks if the input address is valid
 */
function isValidAddr(addr) {
	return addr < mmsize && addr >= 0;
}

/**
 * Takes the addr, separates it in bits and updates the address tables with the obtained values
 */
function processAddr() {
	// Validate input address
	addr = parseInt(instructionI.val());
	if (!isValidAddr(addr)) {
		alert("The address is not valid");
		return false;
	}

	// Disable address controls
	toggleAddrBtns();
	// Enable simulator controls
	toggleSimBtns();

	// Get operation (st or ld)
	op = $("#op").val();

	// Convert address to binary and split it in breakdown table
	binAddr = toPaddedBinary(addr, brAddrBits);

	byteBits = binAddr.substring(binAddr.length - brByteBits);
	byte = parseInt(byteBits, 2);

	wordBits = binAddr.substring(binAddr.length - (brWordBits + brByteBits), binAddr.length - brByteBits);
	word = parseInt(wordBits, 2);

	blockBits = binAddr.substring(0, brBlockBits);
	block = parseInt(blockBits, 2);

	tagBits = binAddr.substring(0, brTagBits);
	tag = parseInt(tagBits, 2);

	setBits = binAddr.substring(brTagBits, brTagBits + brSetBits);
	if (setBits === "") {
		// fully associative
		set = 0;
		setBits = "-";
	} else set = parseInt(setBits, 2);

	// Obtain block data
	for (i = 0; i < blsize; i++) blockData[i] = mmT.find("tr:eq(" + block + ") > td:eq(" + i + ")").html();

	// Update CM address table with binary address
	updateBreakdownTable(tagBits, setBits, wordBits, byteBits);

	// Clear access time table
	accessTT.find("tr:eq(0) > td:eq(0)").html("");
	accessTT.find("tr:eq(0) > td:eq(1)").html("");

	// R eset partial time
	pTime = 0;
	document.getElementById("submit").scrollIntoView();

	// Highlight the addressed block in the main memory
	mmLine = $("#mmTable > tbody > tr:eq(" + block + ")");
	toggleHglMmBlock("blue-8", mmLine);

	// Begin simulation
	stage++;
	step();
}

/**
 * Displays the next step in the simulation
 */
function step() {
	switch (stage) {
		case 0: // Begin simulation
			ptime = 0;
			// createTimeRow();
			simMsg("The address <b>" + addr + "</b>" + " is converted to binary <b>" + binAddr + "</b>. Instruction breakdown is displayed.");
			break;

		case 1: // Access cache memory. Compare valid bit and tag.
			addTime(tcm);
			updateAccessTT(tcm);
			switch (ppolicy) {
				case "directMap":
					simMsg("Placement policy is direct map. Valid bit and tag are compared in the corresponding line.");
					break;
				case "fullyAssociative":
					simMsg("Placement policy is fully associative. Valid bit and tag are compared with every line of the directory.");
					break;
				case "setAssociative":
					simMsg("Placement policy is set associative. Valid bit and tag are compared with every line of the corresponding set.");
					break;
			}

			// Highlight valid bit and tag columns
			toggleHglValid("yellow-5");
			toggleHglTag("yellow-5");

			break;

		case 2: // Resolve hit or miss and obtain the target line/block
			hit = isHit();
			if (hit) {
				// Highlight the hitline
				toggleHglValid("green-5", hitLine);
				toggleHglTag("green-5", hitLine);
				simMsg("A line with valid bit to 1 and matching tag has been found, so it is a cache <b>hit</b>.");
				toggleHglSimMsg("green-5");
				line = hitLine;
				validBit = line.find("td:eq(1)").html();
			} else {
				// Highlight all the lines according to the placement policy
				toggleHglValid("red-5");
				toggleHglTag("red-5");
				simMsg("Since there is not a line with the valid bit to 1 and same tag, it is a cache <b>miss</b>.");
				toggleHglSimMsg("red-5");
				line = rpolicy === "random" && ppolicy != "directMap" ? getRandomLine() : getOldestLine();
				validBit = line.find("td:eq(1)").html();
			}
			updateHitMissRateChart(hit);
			break;

		case 5: // Apply replacement policy
			// Hit&lru, miss&(lru|fifo)
			if (ppolicy != "directMap" && rpolicy != "random" && ((hitLine && rpolicy === "lru") || (!hitLine && (rpolicy === "lru" || rpolicy === "fifo")))) {
				updateReplBits(line);
				simMsg("Replacement bits are updated according to <b>" + rpolicy.toUpperCase() + "</b> policy.");
				toggleHglReplBits("blue-8");
			} else {
				stage++;
				return step();
			}
			break;

		case 6:
			endOfSimulation();
			break;

		default:
			// After hit or miss, depends on op
			op == "ld" ? loadStep() : storeStep();
			break;
	}
}

// Steps to follow in case of load (read) instruction
function loadStep() {
	switch (stage) {
		case 3: // HIT => Fetch Block (/)  MISS => Check dirty block
			if (hit) {
				msg = "Block is directly updated in the cache memory. ";
				toggleHglCacheLine("blue-8", line);
				// toggleHglCacheLine(line);
				if (!isDirty(line)) {
					msg += "The dirty bit is set to 1.";
					updateDirtyBit(line, 1);
					toggleHglDirty("blue-8", line);
				}
				simMsg(msg);
			} else {
				if (isDirty(line)) {
					simMsg("The block to be replaced is dirty, so it is transfered to the main memory.");
					toggleHglDirty("grey-5", line);
					toggleHglCacheLine("grey-5", line);
					addTime(tBt);
					updateAccessTT(tBt);
				} else {
					stage++;
					return step();
				}
			}
			break;

		case 4: // HIT => go to replacement policy stage  MISS => Transfer block andupdate dirty|valid bit/s
			msg = "";
			if (hit) {
				stage++;
				return step();
			} else {
				msg = "The block is transfered from main memory to cache memory. ";
				if (isDirty(line)) msg += "Dirty bit is updated to 0. ";
				toggleHglDirty("blue-8", line);
				simMsg(msg);
				transferBlock(line, blockData);
				toggleHglCacheLine("blue-8", line);

				addTime(tBt);
				updateAccessTT(tBt);

				if (isDirty(line)) updateDirtyBit(line, 0);
				updateTag(line, tag);
				if (validBit == 0) {
					updateValidBit(line, 1);
					toggleHglValid("blue-8", line);
				}
			}
			break;
	}
}

// Steps to follow in case of store (write) instruction
function storeStep() {
	switch (stage) {
		case 3:
			// HIT => (WriteBack > update dirty bit) | (WriteThrough > update main memory block)
			// MISS => (Write around general case) | (Write on allocate - Write Back transifer CM->MM if dirty bit == 1)
			if (hit) {
				if (wpolicy === "writeBack") {
					simMsg("Write policy is <b>Write Back</b>, so dirty bit is set to <b>1</b>.");
					updateDirtyBit(line, 1);
					toggleHglDirty("blue-8", line);
				} else {
					// write through
					simMsg("Block in main memory is updated.");
					addTime(tMM);
					updateAccessTT(tMM);
				}
			} else {
				// write around case: only main memory is updated
				if (walloc === "writeAround") {
					simMsg(
						"The write policy is <b>" +
							(wpolicy == "writeThrough" ? "Write Through" : "Write Back") +
							"</b> with <b>Write Around</b>, so the block is going to be updated just in main memory."
					);
					addTime(tMM);
					updateAccessTT(tMM);
					stage = 5; // En of simulation
				} else {
					// write on allocate
					if (wpolicy === "writeBack" && isDirty(line)) {
						simMsg("The dirty bit is equal to 1, so the previously updated block is transferred from cache memory to main memory.");
						toggleHglDirty("grey-5", line);
						toggleHglCacheLine("grey-5", line);
						addTime(tBt);
						updateAccessTT(tBt);
					} else {
						stage++;
						return step();
					}
				}
			}
			break;

		case 4:
			if (hit) {
				stage++;
				return step();
			} else {
				// write on allocate
				if (wpolicy === "writeBack") {
					simMsg(
						"The requested block is transfered from main memory to cache memory. New data is writen into the cache block. Dirty bit is set to 1."
					);
					updateDirtyBit(line, 1);
					toggleHglDirty("blue-8", line);
				} else {
					simMsg("The block is updated in the main memory. Then, it is transfered to the cache memory.");
				}
				// Transfer block MM > CM
				transferBlock(line, blockData);
				toggleHglCacheLine("blue-8", line);
				// Update the tag
				updateTag(line, tag);
				// Update valid bit if it is 0
				if (validBit == 0) {
					updateValidBit(line, 1);
					toggleHglValid("blue-8", line);
				}

				addTime(tBt);
				updateAccessTT(tBT);
			}
			break;
	}
}

function fastForward() {
	while (stage != -1) {
		stage++;
		step();
	}
}

/* Removes all the highlighted stuff in the tables and enables the address input */
function endOfSimulation() {
	// Print end of simulation message
	simMsg("End of the operation. Submit another address to continue.");

	// Update the access time chart
	updateAccessTimeChart(pTime);

	// Print total times in access time table
	timeSum = accessTT.find("tr:eq(0) > td:eq(0)");
	timeSum.html(timeSum.html().slice(0, -3));

	// Remove highlights
	toggleHglMmBlock("", mmLine);
	toggleHglValid();
	toggleHglDirty("", line);
	toggleHglTag();
	toggleHglReplBits();
	toggleHglCacheLine("", line);
	toggleHglSimMsg();

	// Reset variables
	hitLine = line = null;
	msg = "";
	validBit = -1;
	stage = -1;

	// Disable simulator controls
	toggleSimBtns();

	// Enable address controls
	toggleAddrBtns();
}

/** Check if there has been a hit or miss and updated the hitLine in case of hit*/
function isHit() {
	// Find line inside the set
	let lineToCompare;

	// Loop lines per set
	for (i = 0; i < nway; i++) {
		// If fully associative, compare with every line of the table
		if (ppolicy === "fullyAssociative") lineToCompare = "#way-0 > tbody > tr:eq(" + i + ")";
		// Otherwise, compare with the corresponding line on each table
		else lineToCompare = "#way-" + i + " > tbody > tr:eq(" + set + ")";
		tagToCompare = $(lineToCompare + " > td:eq(3)").html();
		if (tagToCompare === toPaddedBinary(tag, brTagBits) && $(lineToCompare + " > td:eq(1)").html() === "1") {
			hitLine = $(lineToCompare);
			return true;
		}
	}
	return false;
}

/**
 * Finds and returns the oldest line in cache memory
 * depending on placement policy
 * @returns The oldest line based on LRU/FIFO
 */
function getOldestLine() {
	let oldestLine = $("#way-0 > tbody > tr:eq(" + set + ")");
	let oldestLineReplBits = parseInt(oldestLine.find("td:eq(4)").html(), 2);
	let currLine;
	let currLineReplBits;
	for (i = 1; i < nway; i++) {
		if (ppolicy == "fullyAssociative") currLine = $("#way-0 > tbody > tr:eq(" + i + ")");
		else currLine = $("#way-" + i + " > tbody > tr:eq(" + set + ")");
		currLineReplBits = parseInt(currLine.find("td:eq(4)").html(), 2);

		// Compare oldest line bits with current line bits
		if (currLineReplBits < oldestLineReplBits) {
			oldestLine = currLine;
			oldestLineReplBits = currLineReplBits;
		}
	}
	return oldestLine;
}

/**
 * Finds a line with valid bit = 0. Otherwise, returns a random line.
 * @returns HTML table tr
 */
function getRandomLine() {
	let line;
	let validBit;

	for (i = 0; i < nway; i++) {
		// If fully associative, compare with every line of the table
		if (ppolicy === "fullyAssociative") line = "#way-0 > tbody > tr:eq(" + i + ")";
		// If set associative, compare with the corresponding line on each table
		else line = "#way-" + i + " > tbody > tr:eq(" + set + ")";

		validBit = $(line + " > td:eq(1)").html();
		if (validBit === "0") return $(line);
	}

	// If no line with valid bit is found, return random line
	lineNum = Math.floor(Math.random() * nway);
	if (ppolicy == "fullyAssociative") line = "#way-0 > tbody > tr:eq(" + lineNum + ")";
	else line = "#way-" + lineNum + " > tbody > tr:eq(" + set + ")";
	return $(line);
}

/**
 * Converts a decimal number to binary number with the desired zerofill
 * @param {number} n the number to get converted
 * @param {String} length length with zero fill
 * @returns the binary number with the selected zerofill
 */
function toPaddedBinary(n, length) {
	return n.toString(2).padStart(length, "0");
}

/**
 * Updates the replacement bits
 * @param {HTMLTableRowElement} line line in the cache memory
 */
function updateReplBits(lineToUpdate) {
	// Get the repl bits of the line to update
	lineToUpdateReplBits = parseInt(lineToUpdate.find("td:eq(4)").html(), 2);

	// Reduce replacement bits for the rest of lines with higher repl bits
	for (i = 0; i < nway; i++) {
		if (ppolicy === "fullyAssociative") currLine = $("#way-0 > tbody > tr:eq(" + i + ")");
		else currLine = $("#way-" + i + " > tbody > tr:eq(" + set + ")");

		if (!currLine.is(lineToUpdate)) {
			currLineReplBits = parseInt(currLine.find("td:eq(4)").html(), 2);
			// Check if replacement bits are higher than current line
			if (currLineReplBits > lineToUpdateReplBits) {
				currLine.find("td:eq(4)").html(toPaddedBinary(currLineReplBits - 1, Math.log2(nway)));
			}
		}
	}

	// Update the replacement bits of updated line
	lineToUpdate.find("td:eq(4)").html(toPaddedBinary(nway - 1, Math.log2(nway)));
}

/**
 * Updates the tag
 * @param {HTMLTableRowElement} line line in the cache memory
 * @param {String} tag the new tag
 */
function updateTag(line, tag) {
	line.find("td:eq(3)").html(toPaddedBinary(tag, brTagBits));
}

/**
 * Updates the valid bit
 * @param {HTMLTableRowElement} line line in the cache memory
 * @param {String} bit the new valid bit
 */
function updateValidBit(line, bit) {
	line.find("td:eq(1)").html(bit);
}

/**
 * Gets the dirty bit from the cache memory line
 * @param {HTMLTableRowElement} line line in the cache memory
 * @returns the dirty bit
 */
function isDirty(line) {
	return line.find("td:eq(2)").html() === "1";
}

/**
 * Updates the dirty bit in the cache line
 * @param {HTMLTableRowElement} line line in the cache memory
 * @param {String} bit the new dirty bit
 */
function updateDirtyBit(line, bit) {
	line.find("td:eq(2)").html(bit);
}

/**
 * Simulates a block transference from main memory to cache memory
 * @param {HTMLTableRowElement} line  line in cache memory
 * @param {String} block the data block
 */
function transferBlock(line, block) {
	for (i = 0; i < blsize; i++) line.find("td:eq(" + (i + 5) + ")").html(block[i]);
}

/**
 * Prints on the screen the simulator status
 * @param {String} msg the message to get printed
 * @param {String} bgColor the background for the message wrapper
 */
function simMsg(msg) {
	$("#simMsg").html(msg);
}

/**
 * Enables/disables the address input
 */
function toggleAddrBtns() {
	genRandAddrBtn.toggleClass("disabled");
	sendBtn.toggleClass("disabled");
}

/** Enables/disables the simulator controller */
function toggleSimBtns() {
	nextBtn.toggleClass("disabled");
	fastForwardBtn.toggleClass("disabled");
}

function addTime(cycles) {
	pTime += cycles;
	tTime += cycles;
}

/**
 * Renders the access time chart
 */
function setupAccessTimeChart() {
	var ctxL = document.getElementById("accessTimeChart").getContext("2d");
	var gradientFill = ctxL.createLinearGradient(0, 0, 0, 290);
	gradientFill.addColorStop(0, "rgba(0, 125, 250, 1)");
	gradientFill.addColorStop(1, "rgba(0, 125, 250, 0.1)");
	accessTimeChart = new Chart(ctxL, {
		type: "line",
		data: {
			labels: [],
			datasets: [
				{
					label: "Access time per instruction",
					data: [],
					backgroundColor: gradientFill,
					borderColor: ["#007DFA"],
					borderWidth: 2,
					pointBorderColor: "#007DFA",
					pointBackgroundColor: "rgba(0, 125, 250, 1)",
				},
			],
		},
		options: {
			scales: {
				xAxes: [
					{
						gridLines: {
							display: false,
						},
						scaleLabel: {
							display: true,
							// labelString: "Instruction",
						},
					},
				],
				yAxes: [
					{
						display: true,
						ticks: {
							min: 0,
							max: tcm + Math.max(2 * tBt, tBt + tmm), // longest time between wb/wt miss
						},
						gridLines: {
							display: false,
						},
						scaleLabel: {
							display: true,
							// labelString: "Access time",
						},
					},
				],
			},
			legend: {
				onClick: (e) => e.stopPropagation(),
			},
			responsive: true,
		},
	});
}

/**
 * Updates the access time chart
 * @param {Number} cycles number of cycles to complete the operation
 */
function updateAccessTimeChart(cycles) {
	// Add new access time
	accessTimeChart.data.labels.push(instructionI.val());
	accessTimeChart.data.datasets[0].data.push(cycles);

	if (accessTimeChart.data.datasets[0].data.length == 10) {
		accessTimeChart.data.labels.shift();
		accessTimeChart.data.datasets[0].data.shift();
	}
	accessTimeChart.update();
}

/**
 * Updates the access time table
 */
function updateAccessTT(cycles) {
	accessTT.find("tr:eq(0) > td:eq(0)").append(cycles + " + ");
	accessTT.find("tr:eq(0) > td:eq(1)").html(pTime + " cycles");
	accessTT.find("tr:eq(0) > td:eq(2)").html(tTime + " cycles");
}

/**
 * Renders the hit/miss rate chart
 */
function setupHitMissRateChart() {
	var ctxP = document.getElementById("hitMissRateChart").getContext("2d");
	hitMistRateChart = new Chart(ctxP, {
		// plugins: [ChartDataLabels],
		type: "pie",
		data: {
			labels: ["Hit", "Miss"],
			datasets: [
				{
					data: [0, 0],
					backgroundColor: ["#2ECC71", "#E74C3C"],
					hoverBackgroundColor: ["#58D68D", "#EC7063"],
				},
			],
		},
		options: {
			responsive: true,
		},
	});
}

/**
 * Updates the hit/miss rate chart
 * @param {boolean} hit whether the operation has been a hit or not
 */
function updateHitMissRateChart(hit) {
	if (hit) {
		hits++;
		hitMistRateChart.data.datasets[0].data[0]++;
	} else {
		misses++;
		hitMistRateChart.data.datasets[0].data[1]++;
	}
	hitMistRateChart.update();
	hitMissRateTable.find("tr:eq(0) > td:eq(0)").html(((100 * hits) / (hits + misses)).toFixed(2) + "%");
	hitMissRateTable.find("tr:eq(0) > td:eq(1)").html(((100 * misses) / (hits + misses)).toFixed(2) + "%");
}

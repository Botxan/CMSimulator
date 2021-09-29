// Form values
var cmsize, tCM, mmsize, tMM, tBuff, wsize, wperb, nwayInput, nway, ppolicy, wpolicy, wrAlloc, rpolicy, lines;

// Address structure bits
var addrBits, byteBits, wordBits, blockBits, tagBits, lineBits, setBits;
bitsByte = bitsWord = bitsBlock = bitsTag = bitsLine = bitsSet = 0;

var addr, hit, line, busyBit, dirtyBit;

// Bits of specific address
var bitsB, bitsW, bitsBl, BitsT, bitsS;

// Decimal values of address bits
var byte, word, block, tag, set;

// Operation
var op
var blockData = [];
var s = 0;

// Times
var pTime = 0;
var tTime = 0;
var tBt;

// Address tables
cmAddr = document.getElementById("CMAddr").tBodies[0];
mmAddr = document.getElementById("MMAddr").tBodies[0];

// Cache memory and main memory tables
var directory = document.getElementById("directory").tBodies[0];
var content = document.getElementById("content");
var mm = document.getElementById("mm").tBodies[0];

// Enable "number of sets" field only in set-associative option
var ppolicies = document.forms["setupForm"].elements["ppolicy"];
for (ppolicy in ppolicies) {
    ppolicies[ppolicy].onclick = function(e) {
        let nwayInput = document.forms["setupForm"]["nway"];
        if (ppolicies[2].checked) {
            nwayInput.disabled = false;
        } else {
            nwayInput.disabled = true;
        }
    }
}

function onSubmit() {
    submitBtn = document.getElementById("submit");
    if(submitBtn.value == "submit") {
        validateSetupForm();
        submitBtn.innerHTML = "reset";
        submitBtn.value = "reset";
        submitBtn.classList.replace("btn-default", "btn-danger");
        disableForm();
    } else {
        reset();
        submitBtn.innerHTML = "submit";
        submitBtn.value = "submit";
        submitBtn.classList.replace("btn-danger", "btn-default");
    }
    return false;
}

function disableForm() {
    document.getElementById("setup").style.backgroundColor = "#dddddd";
    document.getElementById("sizes").style.pointerEvents = "none";
    document.getElementById("ppolicy").style.pointerEvents = "none";
    document.getElementById("wpolicy").style.pointerEvents = "none";
    document.getElementById("rpolicy").style.pointerEvents = "none";   
}

/** Resets the app */
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
    mmsize = parseInt(document.forms["setupForm"]["mmsize"].value);
    tCM = parseInt(document.forms["setupForm"]["tCM"].value);
    cmsize = parseInt(document.forms["setupForm"]["cmsize"].value);
    tMM = parseInt(document.forms["setupForm"]["tMM"].value);
    tBuff = parseInt(document.forms["setupForm"]["tBuff"].value);
    wsize = parseInt(document.forms["setupForm"]["wsize"].value);
    wperb = parseInt(document.forms["setupForm"]["wperb"].value);
    nwayInput = document.forms["setupForm"]["nway"];
    ppolicy = document.querySelector('input[name="ppolicy"]:checked').value;
    wpolicy = document.querySelector('input[name="wpolicy"]:checked').value;
    wrAlloc = document.querySelector('input[name="wrAlloc"]:checked').value;
    rpolicy = document.querySelector('input[name="rpolicy"]:checked').value;

    // Validate form
    if (mmsize % 2 != 0 || mmsize == undefined) {
        err += "The main memory size has to be power of 2.\n";
        valid = false;
    }

    if (cmsize % 2 != 0 || cmsize == undefined) {
        err += "The cache memory size has to be power of 2.\n";
        valid = false;
    }

    if (cmsize > mmsize) {
        err += "The cache memory can not be bigger than the main memory.\n";
        valid = false;
    }

    if (Number.isNaN(wsize)) {
        err += "Choose a word size.\n";
        valid = false;
    }

    if (wsize > cmsize || wsize > mmsize) {
        err += "The word size cannot be bigger than main memory size or cache memory size.\n";
        valid = false;
    }

    if (Number.isNaN(wperb)) {
        err += "Choose words per block.\n";
        valid = false;
    }
    
    if (valid) {
        // Calculate n-way the selected placement policy
        nway = calcNWay(ppolicy, cmsize, wperb, wsize);
        nwayInput.value = nway;

        // Calculate time to transfer a block
        tBt = tMM + (wperb - 1) * tBuff;

        // Calculate address bits for cache memory and main memory address structure
        calcAddrBits(mmsize, cmsize, wperb, wsize);

        // Update CM table
        updateCMTable(0, 0, tagBits + "b");
        updateCMTable(0, 1, setBits + "b");
        updateCMTable(0, 2, wordBits + "b");
        updateCMTable(0, 3, byteBits + "b");

        // Update MM table
        updateMMTable(0, 0, blockBits + "b");
        updateMMTable(0, 1, wordBits + "b");
        updateMMTable(0, 2, byteBits + "b");

        printCalculations();
        buildCM();
        buildMM();
        document.getElementById("address-input").focus();
        document.getElementById("addressInput").style.pointerEvents = "auto";
    } else alert(err);

    // console.log("Form values:\n" + "Cache memory size: " + cmsize + ".\nCache memory access time; " + tCM
    //     + ".\nMain memory size: " + mmsize + ".\nMain memory access time: " + tMM
    //     + ".\nInterleaving buffer access time: " + tBuff + ".\nWord size: " + wsize
    //     + ".\nWords per block: " + wperb + ".\nN-way: " + nway + ".\nPlacement policy: "+ ppolicy
    //     + ".\nWriting policy: " + wpolicy + ".\nWriting allocation: " + wrAlloc
    //     + ".\nReplacement policy: " + rpolicy + "."
    // );
}

/**
 * Calculates the number of sets depending on placement policy
 * @param {string} ppolicy placement policy
 * @param {number} cmsize cache size
 * @param {number} wperb words/lines per block
 * @param {number} wsize size(bytes) per word
 * @returns number of block
 */
function calcNWay(ppolicy, cmsize, wperb, wsize) {
    let nway;
    switch (ppolicy) {
        case "directMap":
            // one line = one set
            nway = 1;
            break;
        case "fullyAssociative":
            // same as number of lines
            nway = parseInt(cmsize / (wperb * wsize));
            break;
        case "setAssociative":
            // the input introduced by the user
            nway = parseInt(window.nwayInput.value);
            break;
    }
    return nway;
}

/**
 * Calculates corresponding bits for each part of main memory and cache memory addresses
 * @param {number} mmsize
 * @param {number} cmsize
 * @param {number} wperb
 * @param {number} wsize
 */
function calcAddrBits(mmsize, cmsize, wperb, wsize) {
    // Number of bits for whole address = log2(main memory size in bytes)
    addrBits = Math.log2(mmsize); 
    // Bits to identify byte in a word = log2(word size in bytes)
    byteBits = Math.log2(wsize);
    // Bits to identify a word in a block = log2(words per block)
    wordBits = Math.log2(wperb);
    // Bits to identify a block in the memory = 
    // whole address bits - bits for word in block - bits for byte in word
    blockBits = addrBits - (wordBits + byteBits);
    // Number of lines in cache = cache size / (words per block * word size in bytes)
    // or cache size / (bytes per block)
    lines = cmsize / (wperb * wsize);
    // Bits to identify a line in cache memory = log2(number of lines)
    lineBits = Math.log2(lines);
    // Bits to identify the corresponding set for a block = log2(number of lines / nway)
    setBits = Math.log2(lines / nway);
    // Bits to identify the tag = bits for the whole block - bits for the set
    tagBits = blockBits - setBits;
    // console.log("Bits:" + "\nTotal number of bits in address: " + addrBits + ".\nByte in a word: " + byteBits
    //     + ".\nWord in a block: " + wordBits + ".\nBlock: " + blockBits + ".\nLine: " + lineBits
    //     + ".\nsetBits: " + setBits + ".\ntagBits: " + tagBits);
}

function updateCMTable(row, cell, val) {
    cmAddr.rows[row].cells[cell].innerHTML = val;
}

function updateMMTable(row, cell, val) {
    mmAddr.rows[row].cells[cell].innerHTML = val;
}

function printCalculations() {
    calcTable = document.getElementById("calcTable").tBodies[0];
    calcTable.rows[0].cells[1].innerHTML = "Log₂(" + mmsize + ") = " + addrBits + " bits";
    calcTable.rows[1].cells[1].innerHTML = "Log₂(" + wsize + ") = " + byteBits + " bits";
    calcTable.rows[2].cells[1].innerHTML = "Log₂(" + wperb + ") = " + wordBits + " bits";
    calcTable.rows[3].cells[1].innerHTML = addrBits + " - (" + wordBits + " + " + byteBits + ") = " + blockBits + " bits.";
    calcTable.rows[4].cells[1].innerHTML = "Log₂(" + lines + ") = " + lineBits + " bits.";
    calcTable.rows[5].cells[1].innerHTML = "Log₂(" + lines + " / " + nway + ") = " + setBits + " bits";
    calcTable.rows[6].cells[1].innerHTML = blockBits +  " - " + setBits + " = " + tagBits + " bits.";
}

function buildCM() {
    let row;

    // Empty in case there was previous data
    directory.innerHTML = "";
    content.tBodies[0].innerHTML = "";

    for (i = 0; i < lines; i++) {
        
        // Directory
        row = directory.insertRow();
        row.insertCell().innerHTML = Math.floor(i / nway);
        for (j = 0; j < 2; j++) row.insertCell().innerHTML = 0;
        row.insertCell().innerHTML = "-";
        row.insertCell().innerHTML = toBinary(i % nway, Math.log2(nway));

        // // Content
        content.tHead.rows[0].cells[0].colSpan = wperb;
        row = content.tBodies[0].insertRow();
        for (k = 0; k < lines; k++) row.insertCell().innerHTML = "-";
    }
}

function buildMM() {
    let blSize = wperb * wsize;
    let row;

    // Empty in case there was previous data
    mm.innerHTML = "";

    // Block per row
    for (i = 0; i < mmsize / blSize; i++) {
        row = mm.insertRow();
        for (j = 0; j < wperb; j++) {
            row.insertCell().innerHTML = "B" + i + "W" + j;
        }
    }
}

/**
 * Returns a random valid address (byte)
 */
function getRandomAddr() {
    let address = document.getElementById("address-input");
    console.log("The address", address);
    address.value = Math.floor(Math.random() * (mmsize));
    console.log(mmsize);
}

/**
 * Checks if the input address is valid
 */
function isValidAddr() {
    addr = parseInt(document.getElementById('address-input').value);
    return addr < mmsize;
}

function processAddr() {
    op = document.getElementById("operation").value;
    binAddr = toBinary(addr, addrBits);

    bitsB = binAddr.substring(binAddr.length - byteBits);  
    byte = parseInt(bitsB, 2);

    bitsW = binAddr.substring(binAddr.length - (wordBits+byteBits), binAddr.length - byteBits);
    word = parseInt(bitsW, 2);
    
    bitsBl = binAddr.substring(0, blockBits);
    block = parseInt(bitsBl, 2);

    bitsT = binAddr.substring(0, tagBits);
    tag = parseInt(bitsT, 2);

    bitsS = binAddr.substring(tagBits, tagBits + setBits);
    if (bitsS == "") set = 0; // fully associative has not bits for set
    else set = parseInt(bitsS, 2);

    // Obtain block data
    for (i = 0; i < wperb; i++) blockData[i] = mm.rows[block].cells[i].innerHTML;

    // Update CM address table with binary address
    updateCMTable(0, 0, bitsT);
    updateCMTable(0, 1, bitsS);
    updateCMTable(0, 2, bitsW);
    updateCMTable(0, 3, bitsB);

    // // Update MM address table with binary address
    updateMMTable(0, 0, bitsBl);
    updateMMTable(0, 1, bitsW);
    updateMMTable(0, 2, bitsB);
}

function checkHit() {
    // Find line into set
    hit = false;
    busyBit;
    let oldTag;
    for (i = 0; i < nway; i++) {
        line = directory.rows[set*nway+i];
        oldTag = line.cells[3].innerHTML;
        busyBit = line.cells[1].innerHTML;
        // If busy bit is one and tags are the same
        if (busyBit == 1 && oldTag == toBinary(tag, tagBits)) {
            hit = true;
            break;
        }
    }
}

function step() {
    if (!isValidAddr(addr)) return alert("Invalid address");
    if (s == 0) {
        // Cycles per instruction are reseted
        pTime = 0;
        document.getElementById("addressInput").style.pointerEvents = "none";
        document.getElementById("simController").style.pointerEvents = "auto";
    }
    // Go to next step
    s++;
    let ins = document.getElementById("operation").value;
    if (s > 3) {
        if (ins == "ld") loadStep();
        else storeStep();
    } generalStep();
}

// Steps to follow in any case
function generalStep() {
    switch(s) {
        case 1: // Read address and separate and split it in corresponding bits
            processAddr();
            printSimStatus("The address <b>" + addr + "</b>" + 
            " is converted to binary <b>" + binAddr + 
            "</b> and separated into corresponding bits within the address.");
            highlightMMBlock("rgba(93, 173, 226, .5)");
            break;

        case 2: // Compare busy bit and tag
            printSimStatus("For every line, check if busy bit is 1 and tags are equal.");    
            removeMMBlockHighlight();       
            highlightSet("#F9E79F");
            highlightBusyBit("#F1C40F");
            highlightTag("#F1C40F");
            pTime = tCM;
            tTime += tCM;
            break;

        case 3: // Resolve hit or miss
            checkHit();
            if (hit) {
                printSimStatus("A line with busy bit to 1 and matching tag has been found, so it is a cache <b>hit</b>.", "rgba(88, 214, 141, .5)");
                highlightLine(line, "rgba(88, 214, 141, .5)");
            } else {
                printSimStatus("Since there is not a line with the busy bit to 1 and same tag, it is a cache <b>miss</b>.", "rgba(236, 112, 99, .5)");
                highlightSet("rgba(236, 112, 99, .5)")
                // get line depending on replacement policy
                if (rpolicy == "no") { // Update random line
                    let randLine = Math.floor(Math.random() * (set*nway+nway - set*nway) + set*nway);
                    line = directory.rows[randLine];
                } else line = getOldestLine();
            }
            break;
    }
}

// Steps to follow in case of load (read) instruction
function loadStep() {
    switch (s) {
        case 4: // hit => Fetch block. Miss => if dirty == 1 transfer block CM > MM
            removeContentHighlight(line);
            if (hit) {
                printSimStatus("The block is fetched from cache memory.", "#fff");
            } else {
                // Check dirty bit for next step;
                if (line.cells[2].innerHTML == 0) return step();
                printSimStatus("Dirty bit is <b>1</b>, so the block is transfered from cache memory to main memory.");
                pTime += tBt;
                tTime += tBt;
            }
            break;

        case 5: // (miss) Block transfer MM > CM
            if (hit) return step();
            else {
                printSimStatus("The block is translated from main memory to cache memory.");
                // Transfer block MM > CM
                transferBlock(line, blockData);
                // Update the tag
                updateTag(line, tag);
                // Update busy bit if it is 0
                if (busyBit == 0) updateBusyBit(line, 1);
                pTime += tBt;
                tTime += tBt;
            }
            break;

        case 6: // Apply replacement policy
            if (ppolicy == "directMap") return step();
            // If hit and lru or miss and lru|fifo => change replacement bits
            let replace = (hit && rpolicy == "lru") || (!hit && (rpolicy == "lru" | rpolicy == "fifo")) ? true : false;
            if (replace) {
                hightlightReplacementBits("#AF7AC5", "#D7BDE2");
                updateReplBits(line);
                printSimStatus("Replacement bits are updated according to replacement policy <b>" + rpolicy + "</b>.");
            } else return step();
            break;
        case 7:
            endOfSimulation();
            break;
    }
}

// Steps to follow in case of store (write) instruction
function storeStep() {
    switch(s) {
        case 4:
            if (hit) {
                if (wpolicy == "writeBack") {
                    printSimStatus("Write policy is write back, so dirty bit is set to 1.");
                    updateDirtyBit(line, 1);
                } else { // write through
                    printSimStatus("Block in main memory is updated");
                    pTime += tMM;
                    tTime += tMM;
                }
            } else { // write around case
                if (wrAlloc == "writeAround") {
                    printSimStatus("The write policy is <b>" + wpolicy == "writeThrough" ? "write through" : "write back" + "</b> and "
                    +  "<b>write on allocate</b>, so the block is going to be updated just in main memory.");
                    pTime += tMM;
                    tTime += tMM;
                } else return step();
            }
            break;

        case 5:
            if (hit) return step();
            else {
                console.log("policy: " + wpolicy + " " + wrAlloc);
                if (wpolicy == "writeBack" && wrAlloc == "writeOnAllocate") {
                    if (checkDirtyBit(line) == 1) {
                        printSimStatus("The write policy is <b>write back</b> and <b>write on allocate</b>. The dirty bit is equal to 1, so the block is transferred from cache memory to main memory.");
                        pTime += tBt;
                        tTime += tBt;
                    }
                    else return step(); // write around with write on allocate
                } else endOfSimulation();
            }
            break;
        case 6:
            if (hit) return step();
            else {
                printSimStatus("The block is tranfered from main memory to cache memory.");
                // Transfer block MM > CM
                transferBlock(line, blockData);
                // Update the tag
                updateTag(line, tag);
                // Change dirty bit if it set to 1
                if (checkDirtyBit(line) == 1) updateDirtyBit(line, 0);
                // Update busy bit if it is 0
                if (busyBit == 0) updateBusyBit(line, 1);
                    pTime += tBt;
                    tTime += tBt;
            }
            break;
        case 7: // Apply replacement policy
            if (ppolicy == "directMap") return step();
            // If hit and lru or miss and lru|fifo => change replacement bits
            let replace = (hit && rpolicy == "lru") || (!hit && (rpolicy == "lru" | rpolicy == "fifo")) ? true : false;
            if (replace) {
                hightlightReplacementBits("#AF7AC5", "#D7BDE2");
                updateReplBits(line);
                printSimStatus("Replacement bits are updated according to replacement policy <b>" + rpolicy + "</b>.");
            } else return step();
            break;
        case 8:
            endOfSimulation();

    }
}

function endOfSimulation() {
    printSimStatus("End of the operation. Submit another address to continue.");
    s = 0;
    removeSetHighlight();
    removeContentHighlight(line);
    removeMMBlockHighlight();
    document.getElementById("simController").style.pointerEvents = "none";
    document.getElementById("addressInput").style.pointerEvents = "auto";

    console.log("Partial time: ", pTime);
    console.log("Total time: ", tTime);
}

function toBinary(n, fill) {
    return ("0".repeat(fill)+n.toString(2)).slice(-fill);
}

function updateReplBits(line) {
    // Reduce replacement bits for the rest of lines with higher repl bits
    for (i = 0; i < nway; i++) {
        if (set*nway+i != line.rowIndex-1) {
            currLine = set*nway+i;
            currLine = directory.rows[currLine];
            currLineReplBits = parseInt(currLine.cells[4].innerHTML, 2);
            // Check if replacement bits are higher than current line
            if (currLineReplBits > parseInt(line.cells[4].innerHTML)) {
                currLine.cells[4].innerHTML = toBinary(currLineReplBits-1, Math.log2(nway));
            }
        }
    }

    // Update the replacement bits of updated line
    line.cells[4].innerHTML = toBinary(nway-1, Math.log2(nway));
}

function updateTag(line, tag) {
    line.cells[3].innerHTML = toBinary(tag, tagBits);
}

function updateBusyBit(line, bit)  {
    line.cells[1].innerHTML = bit;
}

function checkDirtyBit(line) {
    return line.cells[2].innerHTML;
}

function updateDirtyBit(line, bit) {
    line.cells[2].innerHTML = bit;
}

function getOldestLine() {
    // Find the oldest line (LRU or FIFO is same on miss)
    let oldestLine = directory.rows[set*nway];
    let oldestLineReplBits = parseInt(oldestLine.cells[4].innerHTML);
    for (i = 1; i < nway; i++) {
        let currLine = directory.rows[set*nway+i];
        let currLineReplBits = parseInt(currLine.cells[4].innerHTML);
        // Compare oldest line bits with current line bits
        if (currLineReplBits < oldestLineReplBits) {
            oldestLine = currLine;
            oldestLineReplBits = currLineReplBits;
        }
    }
    return oldestLine;
}

function transferBlock(line, block) {
    for (i = 0; i < wperb; i++) content.rows[line.rowIndex].cells[i].innerHTML = block[i];
}

function printSimStatus(msg, bgColor = "#fff") {
    document.getElementById("simMsg").innerHTML = msg;
    document.getElementById("simMsgWrapper").style.backgroundColor = bgColor;
}

// ---------------Element highlighters---------------

function highlightSet(color) {
    for (i = 0; i < nway; i++) {
        let line = directory.rows[set*nway+i];
        for (j = 0; j < 5; j++) line.cells[j].style.backgroundColor = color;
    }
}

function highlightLine(line, color) {
    for (i = 0; i < 5; i++) line.cells[i].style.backgroundColor = color;
}

function highlightBusyBit(color) {
    for (i = 0; i < nway; i++) {
        let line = set*nway+i;
        directory.rows[line].cells[1].style.backgroundColor = color;
    }
}

function highlightTag(color) {
    for (i = 0; i < nway; i++) {
        let line = set*nway+i;
        directory.rows[line].cells[3].style.backgroundColor = color;
    }
}

function highlightContent(color) {
    for (i = 0; i < wperb; i++) content.tBodies[0].rows[line].cells[i].style.backgroundColor = color;
}

function highlightDirtyBit(color) {
    directory.rows[line].cells[2].style.backgroundColor = color;
}

function hightlightReplacementBits(colorOldest, colorRest) {
    line.cells[4].style.backgroundColor = colorOldest;
    for (i = 0; i < nway; i++) {
        let currLine = directory.rows[set*nway+i];
        if (currLine.rowIndex != line.rowIndex) currLine.cells[4].style.backgroundColor = colorRest;
    }
}

function highlightMMBlock(color) {
    for (i = 0; i < wperb; i++) mm.rows[block].cells[i].style.backgroundColor = color; 
}

function removeSetHighlight() {
    for (i = 0; i < nway; i++) {
        let line = set*nway+i;
        for(j = 0; j < 5; j++) directory.rows[line].cells[j].style.backgroundColor = "#fff";
    }
}

function removeContentHighlight(line) {
    console.log("The fucking line is: ", line);
    for (i = 0; i < wperb; i++) content.tBodies[0].rows[line.rowIndex].cells[i].style.backgroundColor = "#fff";
}

function removeMMBlockHighlight() {
    for (i = 0; i < wperb; i++) mm.rows[block].cells[i].style.backgroundColor = "#fff";
}
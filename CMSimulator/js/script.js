// Form values
var cmsize, tCM, mmsize, tMM, tBuff, wsize, wperb, nwayInput, nway, ppolicy, wpolicy, wrAlloc, rpolicy, lines;

// Address structure bits
var addrBits, byteBits, wordBits, blockBits, tagBits, lineBits, setBits;
bitsByte = bitsWord = bitsBlock = bitsTag = bitsLine = bitsSet = 0;

// Bits of specific address
var bitsB, bitsW, bitsBl, BitsT, bitsS;
// Decimal values of address bits
var byte, word, block, tag, set;
// Operation
var op
var blockData = [];

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

        // Change cache memory header (line/set) to line or set depending on placement policy
        let lineSetHeader = document.getElementById("CMAddr").tHead.rows[0].cells[1];
        if (ppolicy = "setAssociative") lineSetHeader.innerHTML = "SET";
        else lineSetHeader.innerHTML = "LINE";


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
        document.getElementById("address-input").focus();
        buildCM();
        buildMM();
    } else alert(err);

    console.log("Form values:\n" + "Cache memory size: " + cmsize + ".\nCache memory access time; " + tCM
        + ".\nMain memory size: " + mmsize + ".\nMain memory access time: " + tMM
        + ".\nInterleaving buffer access time: " + tBuff + ".\nWord size: " + wsize
        + ".\nWords per block: " + wperb + ".\nN-way: " + nway + ".\nPlacement policy: "+ ppolicy
        + ".\nWriting policy: " + wpolicy + ".\nWriting allocation: " + wrAlloc
        + ".\nReplacement policy: " + rpolicy + "."
    );
    return false;
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
    document.getElementById("results").innerHTML = 
    "Log₂(" + mmsize + ") = " + addrBits + " bits.<br />" +
    "Log₂(" + wsize + ") = " + byteBits + " bits.<br />" +
    "Log₂(" + wperb + ") = " + wordBits + " bits.<br />" +
    addrBits + " - (" + wordBits + " + " + byteBits + ") = " + blockBits + " bits.<br />" +
    "Log₂(" + lines + ") = " + lineBits + " bits.<br />" +
    "Log₂(" + lines + " / " + nway + ") = " + setBits + " bits.<br />" +
    blockBits +  " - " + setBits + " = " + tagBits + " bits.";
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
    address.value = Math.floor(Math.random() * (mmsize));
}

/**
 * Checks if the input address is valid
 */
function isValidAddr(addr) {
    return addr < mmsize;
}

function processAddr(addr) {
    if (!isValidAddr(addr)) return alert("Invalid address");
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

    printSimStatus("The address <b>" + addr + "</b>" + 
        " is converted to binary <b>" + binAddr + 
        "</b> and separated into corresponding bits within the address."
    );

    // Find corresponding set in cache
    let directory = document.getElementById("directory").tBodies[0];
    
    // Find line into set
    let hit = false;
    let line;
    let busyBit;
    let oldTag;
    for (i = 0; i < nway; i++) {
        line = set*nway+i;
        oldTag = directory.rows[line].cells[3].innerHTML;
        busyBit = directory.rows[line].cells[1].innerHTML;
        if (busyBit == 1 && oldTag == toBinary(tag, tagBits)) {
            hit = true;
            break;
        }
    }

    if (hit) {
        if (op == "ld") { // read
            // If LRU, update LRU
            if (rpolicy == "lru") {
                let hitLine = directory.rows[line];
                updateReplBits(hitLine)
            }
            // Print status
            printSimStatus("It is a <b>hit</b>, so data is fetched from cache.");
        } else { // write
            console.log("Now we're writing on hit");
        }
        
    } else { // miss
        // Replace the block
        if (op == "ld") { // reading
            let line;
            if (rpolicy == "fifo" || rpolicy == "lru") { // FIFO or LRU
                line = getOldestLine();
                // Update the replacement bits
                updateReplBits(line);
            } else { // random
                let randLine = Math.floor(Math.random() * (set*nway+nway - set*nway) + set*nway);
                line = directory.rows[randLine];
            }
            // Tansfer the block
            transferBlock(line, blockData);
            // Update the tag
            updateTag(line, tag);
            // Update busy bit
            if (busyBit == 0) updateBusyBit(line, 1);
        } else { // writing
            console.log("Now we're writing on miss");
        }
    }
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

function printSimStatus(msg, bgColor) {
    document.getElementById("simMsg").innerHTML = msg;
    document.getElementById("simMsgWrapper").style.backgroundColor = bgColor;
}
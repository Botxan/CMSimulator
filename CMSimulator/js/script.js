// Form values
var cmsize, mmsize, wsize, wperb, nwayInput, nway, ppolicy, wpolicy, rpolicy, lines;

// Address bits
var addrBits, byteBits, wordBits, blockBits, tagBits, lineBits, setBits;
bitsByte = bitsWord = bitsBlock = bitsTag = bitsLine = bitsSet = 0;

// Address tables
cmAddr = document.getElementById("CMAddr").tBodies[0];
mmAddr = document.getElementById("MMAddr").tBodies[0];

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
    mmsize = parseInt(document.forms["setupForm"]["mmsize"].value);
    cmsize = parseInt(document.forms["setupForm"]["cmsize"].value);
    wsize = parseInt(document.forms["setupForm"]["wsize"].value);
    wperb = parseInt(document.forms["setupForm"]["wperb"].value);
    nwayInput = document.forms["setupForm"]["nway"];
    ppolicy = document.querySelector('input[name="ppolicy"]:checked').value;
    wpolicy = document.querySelector('input[name="wpolicy"]:checked').value;
    rpolicy = document.querySelector('input[name="rpolicy"]:checked').value;

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
        updateAddrTables();
        printCalculations();
        buildCM();
        buildMM();
    } else alert(err);

    // console.log("Form values:\n" + "Main memory size: " + mmsize + ".\nCache memory size: " + cmsize
    //     + ".\nWord size: " + wsize + ".\nWords per block: " + wperb + ".\nN-way: " + nway
    //     + ".\nPlacement policy: " + ppolicy + ".\nWriting policy: " + wpolicy + ".\nWriting policy: " + rpolicy
    // );
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
            nway = cmsize / (wperb * wsize);
            break;
        case "setAssociative":
            // the input introduced by the user
            nway = window.nwayInput.value;
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

function updateAddrTables() {
    // Update cache memory table
    cmAddr.rows[0].cells[0].innerHTML = tagBits + "b";
    cmAddr.rows[0].cells[1].innerHTML = setBits + "b";
    cmAddr.rows[0].cells[2].innerHTML = wordBits + "b";
    cmAddr.rows[0].cells[3].innerHTML = byteBits + "b";
     
    // Update main memory table
    mmAddr.rows[0].cells[0].innerHTML = blockBits + "b";
    mmAddr.rows[0].cells[1].innerHTML = wordBits + "b";
    mmAddr.rows[0].cells[2].innerHTML = byteBits + "b";
}

function printCalculations() {
    document.getElementById("results").innerHTML = 
    "Log₂(" + mmsize + ") = " + addrBits + " bits.<br />" +
    "Log₂(" + wsize + ") = " + byteBits + " bits.<br />" +
    "Log₂(" + wperb + ") = " + wordBits + " bits.<br />" +
    addrBits + " - (" + wordBits + " + " + byteBits + ") = " + blockBits + " bits.<br />" +
    "Log₂(" + lines + ") = " + lineBits + " bits.<br />" +
    "Log₂(" + lines + " / " + nway + ") = " + setBits + " bits.<br />" +
    blockBits +  " - " + setBits + " = " + tagBits + " bits."
}

function buildCM() {
    let directory = document.getElementById("directory").tBodies[0];
    let content = document.getElementById("content");
    let row;

    // Empty in case there was previous data
    directory.innerHTML = "";
    content.tBodies[0].innerHTML = "";

    for (i = 0; i < lines; i++) {
        // Directory
        row = directory.insertRow();
        row.insertCell().innerHTML = i;
        for (j = 0; j < 3; j++) row.insertCell().innerHTML = 0;
        row.insertCell(3).innerHTML = "-";
        // // Content
        content.tHead.rows[0].cells[0].colSpan = lines;
        row = content.tBodies[0].insertRow();
        for (k = 0; k < lines; k++) row.insertCell().innerHTML = "-";
    }
}

function buildMM() {
    let mm = document.getElementById("mm").tBodies[0];
    let blSize = wperb * wsize;
    let row;

    // Empty in case there was previous data
    mm.innerHTML = "";

    // Block per row
    for (i = 0; i < mmsize / blSize; i++) {
        row = mm.insertRow();
        for (j = 0; j < wperb; j++) {
            row.insertCell().innerHTML = "B:" + i + " W:" + j;
        }
    }
}

function getRandomAddr() {
    let address = document.getElementById("address-input");
    address.value = Math.floor(Math.random() * (mmsize));
}
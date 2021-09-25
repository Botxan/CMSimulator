// Form values
var mmsize, cmsize, wsize, wperb, nwayInput, nway, ppolicy, wpolicy, rpolicy, lines;

// Address bits
var addrBits, byteBits, wordBits, blockBits, tagBits, lineBits, setBits;
bitsByte = bitsWord = bitsBlock = bitsTag = bitsLine = bitsSet = 0;

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
        console.log(nway);

        // Calculate address bits for cache memory and main memory address structure
        calcAddrBits(mmsize, cmsize, wperb, wsize);
    } else alert(err);

    // console.log("Form values:\n" + "Main memory size: " + mmsize + ".\nCache memory size: " + cmsize
    //     + ".\nWord size: " + wsize + ".\nWords per block: " + wperb + ".\nN-way: " + nwayVal
    //     + ".\nPlacement policy: " + ppolicy + ".\nWriting policy: " + wpolicy + ".\nWriting policy: " + rpolicy
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
 * 
 * @param {number} mmsize
 * @param {number} cmsize
 * @param {number} wperb
 * @param {number} wsize
 */
function calcAddrBits(mmsize, cmsize, wperb, wsize) {
    // var addrBits, byteBits, wordBits, blockBits, tagBits, lineBits, setBits;
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

    console.log("Bits:" + "\nTotal number of bits in address: " + addrBits + ".\nByte in a word: " + byteBits
        + ".\nWord in a block: " + wordBits + ".\nBlock: " + blockBits + ".\nLine: " + lineBits
        + ".\nsetBits: " + setBits + ".\ntagBits: " + tagBits);
}


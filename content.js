const winkNLP = require('wink-nlp');
const model = require('wink-eng-lite-web-model');
const nlp = winkNLP(model);

const jsonData = require('./data.js');

function get_pos(pos) {
  if (pos === "NOUN" || "PRON" || "PROPN") {
      return 1;
  }
  if (pos === "VERB" || "ADV") {
      return 2;
  }
  if (pos === "ADJ" || "ADP") {
      return 3;
  }
  return 4;
}

// Converted ML model into if-else statement
function get_difficulty(no_of_char, syllable_count, presence_of_ch_sh_th_st_f, part_of_speech, pronounce_c_k, pronounce_g_j) {
  if (no_of_char <= 0.50) {
      if (syllable_count <= 0.50) {
          if (presence_of_ch_sh_th_st_f <= 0.50) {
              return 0;
          } else {
              if (pronounce_c_k <= 0.50) {
                  return 0;
              } else {
                  return 1;
              }
          }
      } else {
          if (part_of_speech <= 2.00) {
              if (pronounce_g_j <= 0.50) {
                  return 0;
              } else {
                  return 1;
              }
          } else {
              return 1;
          }
      }
  } else {
      if (syllable_count <= 0.50) {
          if (presence_of_ch_sh_th_st_f <= 0.50) {
              if (pronounce_c_k <= 0.50) {
                  if (part_of_speech <= 1.50) {
                      return 0;
                  } else {
                      return 1;
                  }
              } else {
                  return 1;
              }
          } else {
              return 1;
          }
      } else {
          return 1;
      }
  }
}

// Function to count syllables in word
function get_syllable_count(word) {
  if (word.length === 0) { return 0; }
  word = word.toLowerCase();
  if (word.length <= 3) { return 1; }
  word = word.replace(' ', '&#13');
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  // Use try-catch block to handle the potential null value from match()
  try {
    const matches = word.match(/[aeiouy]{1,2}/g);
    // If matches is null or undefined, return 0 or the length accordingly
    return matches ? matches.length : 0;
  } catch (error) {
    console.error('Error in counting syllables:', error);
    return 0; // Return 0 in case of an error
  }
}

function isFirstLetterCapitalized(word) {
  return word[0] === word[0].toUpperCase();
}

function find_synonym(word) {
  const firstLetter = word.charAt(0).toLowerCase();
  const lemma = word.toLowerCase();

  if (jsonData[firstLetter] && jsonData[firstLetter][lemma] && jsonData[firstLetter][lemma].length > 0) {
    let synonym = jsonData[firstLetter][lemma][0]; // Only the first synonym

    // Check if the word ends in "ing" or "ed"
    // This is a temporary fix to improve contex swaps for words
    // TODO proper solution by refractoring database
    const endsInIng = lemma.endsWith("ing");
    const endsInEd = lemma.endsWith("ed");

    if (endsInIng || endsInEd) {
      // Check if the synonym ends in "ing" or "ed"
      const synonymEndsInIng = synonym.toLowerCase().endsWith("ing");
      const synonymEndsInEd = synonym.toLowerCase().endsWith("ed");

      // Check if the synonym isn't the same as the word and doesn't have the same suffix
      if (synonym === word || ((endsInIng && !synonymEndsInIng) || (endsInEd && !synonymEndsInEd))) {
        return word;
      }
    } else {
      if (isFirstLetterCapitalized(word)) {
        synonym = synonym.charAt(0).toUpperCase() + synonym.slice(1);
      }
      if (synonym === word) {
        return word;
      }
      console.log(word);
      console.log("replaced by:");
      console.log(synonym);
      return synonym;
    }
  }

  return word; // Return original word if synonym not found or synonym array is empty
}




function valid_swap(word) {
      let length = word.length > 6;
      // In the dataset used, the syllables feature is marked as 1 if there are more than 2 in a word and 0 if not
      let syllableCount = get_syllable_count(word) > 2;
      // Extract presence_of_ch, sh, th, st, or f
      let presence = word.includes("ch") || word.includes("sh") || word.includes("th") || word.includes("st") || word.includes("f") ? 1 : 0;
      // Extract pronounciation of g or j
      let pronounce1 = word.includes("g") || word.includes("j") ? 1 : 0;
      // Extract pronounciation of c or k
      let pronounce2 = word.includes("c") || word.includes("k") ? 1 : 0;


      // Use wink library to detect part of speech value in words
      let doc = nlp.readDoc(word);
      if (!doc) {
        return false; // If the document doesn't exist, return false
      }

      let t1 = doc.tokens().itemAt(0);
      if (!t1) {
        return false; // If the token doesn't exist, return false
      }

      let pos = t1.out(nlp.its.pos);
      if (!pos) {
        return false; // If the POS doesn't exist, return false
      }

      let posValue = get_pos(pos);
      // Assuming get_pos() returns a value; you can handle its existence if necessary


      if (get_difficulty(length, syllableCount, presence, posValue, pronounce1, pronounce2)) {
            return true;
          }
          return false;
      }

function replaceWordsInSpecifiedTags() {
  const allowedTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'P', 'A', 'CAPTION', 'SPAN', 'TD'];

  allowedTags.forEach(tag => {
    const elements = document.getElementsByTagName(tag);
    Array.from(elements).forEach(element => {
      const textNodes = getTextNodesWithinElement(element);
      textNodes.forEach(node => {
        const words = node.nodeValue.split(/\s+/);
        const replacedWords = words.map(word => {
            if (valid_swap(word)) {
                return find_synonym(word);
            } else {
                return word;
            }
        }).join(' ');
        node.nodeValue = replacedWords;
    });
    });
  });
}

function getTextNodesWithinElement(element) {
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const textNodes = [];
  let node;

  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  return textNodes;
}

replaceWordsInSpecifiedTags();

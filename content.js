const winkNLP = require('wink-nlp');
const model = require('wink-eng-lite-web-model');
const nlp = winkNLP(model);

const jsonData = require('./data.js');

// Function to retrieve synonym for word from database
function find_synonym(word) {
    const firstLetter = word.charAt(0).toLowerCase();
    const lemma = word.toLowerCase();
  
    if (jsonData[firstLetter] && jsonData[firstLetter][lemma] && jsonData[firstLetter][lemma].length > 0) {
      return jsonData[firstLetter][lemma][0]; // Only the first synonym
    } else {
      return null; // Return null if synonym not found or synonym array is empty
    }
}

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
function get_difficulty(no_of_char, syllable_count, presence_of_ch_sh_th_st_f, part_of_speech, Pronounce_c_k, pronounce_g_j) {
  if (no_of_char <= 0.50) {
      if (syllable_count <= 0.50) {
          if (presence_of_ch_sh_th_st_f <= 0.50) {
              return 0;
          } else {
              if (Pronounce_c_k <= 0.50) {
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
              if (Pronounce_c_k <= 0.50) {
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

// Recursive function to handle each node of text from web page
function handle_text_nodes(node) {

  // Only modify pure text nodes
  if (
      node.nodeType === Node.TEXT_NODE &&
      (node.parentNode.tagName === 'H1' ||
          node.parentNode.tagName === 'H2' ||
          node.parentNode.tagName === 'H3' ||
          node.parentNode.tagName === 'H4' ||
          node.parentNode.tagName === 'H5' ||
          node.parentNode.tagName === 'P' ||
          node.parentNode.tagName === 'A' ||
          node.parentNode.tagName === 'CAPTION' ||
          node.parentNode.tagName === 'SPAN' ||
          node.parentNode.tagName === 'TD' || 
          node.parentNode.tagName === 'DIV')
  ) {

      // Split the text content into words by space
      const words = node.textContent.split(/\s+/);

      // Loop through each word
      const modifiedWords = words.map(word => {
        if (!word || /[^a-zA-Z]/.test(words)) {
          return word;
        }

        // Extract the features of each word for our ML model

        // In the dataset used, the length feature is marked as 1 if longer than 6 and 0 if not
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
        let t1 = doc.tokens().itemAt(0);
        let pos = t1.out(nlp.its.pos);
        let posValue = get_pos(pos);

          if (get_difficulty(length, syllableCount, presence, posValue, pronounce1, pronounce2)) {
              // TODO integrate database to replace detected hard words
              // Generic replacement text for now
              let synonym = find_synonym(word);
              if (synonym) {
                if (isFirstLetterCapitalized(word)) {
                  synonym = synonym.charAt(0).toUpperCase() + synonym.slice(1);
                }
                console.log(word, length, syllableCount, presence, posValue, pronounce1, pronounce2, get_difficulty(length, syllableCount, presence, posValue, pronounce1, pronounce2));
                console.log("replaced with");
                console.log(synonym);
                return synonym;
              }
          }
          return word;
      });

      node.textContent = modifiedWords.join(' ');
  } 
  
  // If the node has children, call the function on all of it's children
  else if (node.nodeType === Node.ELEMENT_NODE) {
      for (let i = 0; i < node.childNodes.length; i++) {
          handle_text_nodes(node.childNodes[i]);
      }
  }
}

function observe_DOM_changes() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        // Check if nodes were added or their content changed
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(addedNode => {
            handle_text_nodes(addedNode);
          });
        }
      });
    });
  
    // Configuration of the observer - observe the entire document body for changes
    const observerConfig = {
      childList: true,
      subtree: true,
    };
  
    // Start observing the document body
    observer.observe(document.body, observerConfig);
  }
  
  // Start observing DOM changes
  observe_DOM_changes();
  
  // Initial processing of text nodes
  handle_text_nodes(document.body);
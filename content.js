//Function to get amount of syllables in word
function new_count(word) {
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

// Get all elements on the page
const elements = document.querySelectorAll('h1, h2, h3, h4, h5, p, a, caption, span, td');

// Load "wink-nlp" package.
const winkNLP = require('wink-nlp');
// Load english language model — light version.
const model = require('wink-eng-lite-web-model');
// Instantiate wink-nlp.
const nlp = winkNLP(model);

// Iterate over each element
elements.forEach(element => {
  // Get the inner text of the element
  const text = element.innerText;

  // Check if text is defined and not empty
  if (text && text.trim() !== '') {
    // Split the text into words
    const words = text.split(' ');

    // Iterate over each word
    words.forEach(word => {
      // Extract the features needed for our ML model from each word
      let length = word.length;

      if (word.length > 10) {
        let syllableCount = new_count(word);

        // Extract presence_of_ch, sh, th, st, or f
        let presence = word.includes("ch") || word.includes("sh") || word.includes("th") || word.includes("st") || word.includes("f") ? 1 : 0;

        let pronounce1 = word.includes("g") || word.includes("j") ? 1 : 0;

        let pronounce2 = word.includes("c") || word.includes("k") ? 1 : 0;

        // Check if the text is suitable for nlp.readDoc
        if (text && text.trim() !== '') {
          let doc = nlp.readDoc(text);
          let t1 = doc.tokens().itemAt(0);
          let posValue = t1.out(nlp.its.pos);

          console.log(posValue);
          console.log(syllableCount);
        }
      }

      // If the word is longer than 10 characters, add the span class
      if (word.length > 10) {
        element.innerHTML = element.innerHTML.replace(word, `<span class="blue">${word}</span>`);
      }
    });
  }
});
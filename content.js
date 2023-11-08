// Get all elements on the page
//const elements = document.querySelectorAll('*');
const elements = document.querySelectorAll('h1, h2, h3, h4, h5, p, a, caption, span, td');

import posTagger from 'wink-pos-tagger';

// Iterate over each element
elements.forEach(element => {
  // Get the inner text of the element
  const text = element.innerText;

  // Split the text into words
  const words = text.split(' ');

  // Iterate over each word
  words.forEach(word => {
    // Extract the features needed for our ML model from each word
    let length = word.length;

    let syllableCount = 0;

    // Extract presence_of_ch,sh,th,st, or f
    let presence = string.includes("ch") || string.includes("sh") || string.includes("th") || string.includes("st") || string.includes("f") ? 1 : 0;

    let pronounce1 = string.includes("g") || string.includes("j") ? 1 : 0;

    let pronounce2 = string.includes("c") || string.includes("k") ? 1 : 0;

    // If the word is longer than 10 characters, add the span class
    if (word.length > 10) {
      element.innerHTML = element.innerHTML.replace(word, `<span class="blue">${word}</span>`);
    }
  });
});

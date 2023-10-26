// Get all elements on the page
//const elements = document.querySelectorAll('*');
const elements = document.querySelectorAll('h1, h2, h3, h4, h5, p, a, caption, span, td');

// Iterate over each element
elements.forEach(element => {
  // Get the inner text of the element
  const text = element.innerText;

  // Split the text into words
  const words = text.split(' ');

  // Iterate over each word
  words.forEach(word => {
    // If the word is longer than 5 characters, add the span class
    if (word.length > 10) {
      element.innerHTML = element.innerHTML.replace(word, `<span class="blue">${word}</span>`);
    }
  });
});

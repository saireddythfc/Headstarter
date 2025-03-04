import "./styles.css"; // Import the CSS file

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

var textboxDiv = document.querySelector('div[role="textbox"]');
if (textboxDiv) {
  observeTextbox(textboxDiv);
} 

function observeTextbox(divElement) {
  // Create a MutationObserver to watch for changes in the div
  let observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Check if a span with data-text="true" is added
      const spanWithDataText = divElement.querySelector('span[data-text="true"]');
      if (spanWithDataText) {
        // Extract the text content of the span
        const textContent = spanWithDataText.textContent;
        console.log("Text content of the span:", textContent);

        // Apply autocomplete functionality to the span
        handleInput(spanWithDataText);
      }
    });
  });

  // Start observing the div for changes
  observer.observe(divElement, { childList: true, subtree: true });
}

export async function getLLMSuggestion(userInput) {
  if (!userInput) {
    return ""; // Return an empty string if userInput is undefined
  }

  // Add website metadata for context
  const websiteMetadata = {
    title: document.title, // Website title
    url: window.location.href, // Current URL
    description: document.querySelector('meta[name="description"]')?.content || "", // Meta description
  };

  // Prepare the prompt for the LLM
  const prompt = `You are an AI autocomplete assistant who will suggest a completion for the user's input. Ensure the response is to only complete the user's input which may or may not be a complete sentence.
  Here is the user's input: "${userInput}"
  Use the context of the website (title: ${websiteMetadata.title}, URL: ${websiteMetadata.url}, description: ${websiteMetadata.description}) if necessary to guide your response.`;

  try {
    // Make the API call to OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "applications/json",
        Authorization: "Bearer ", 
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo", 
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 50,
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const suggestion = data.choices[0]?.message?.content.trim();

    // Ensure the suggestion is a complete sentence and within the character limit
    if (suggestion && suggestion.length <= 300 && suggestion.endsWith(".")) {
      return suggestion;
    } else {
      return ""; // Return an empty string if the suggestion is invalid
    }
  } catch (error) {
    console.error("Error fetching suggestion from OpenRouter:", error);
    return ""; // Return an empty string in case of an error
  }
}

export async function getGeminiSuggestion(userInput) {
  if (!userInput) {
    return ""; // Return an empty string if userInput is undefined
  }

  // Add website metadata for context
  const websiteMetadata = {
    title: document.title, // Website title
    url: window.location.href, // Current URL
    description: document.querySelector('meta[name="description"]')?.content || "", // Meta description
  };

  // Prepare the prompt for the LLM
  const prompt = `You are an AI autocomplete assistant who will suggest a completion for the user's input. Ensure the response is to only complete the user's input which may or may not be a complete sentence.
  Here is the user's input: "${userInput}"
  Use the context of the website (title: ${websiteMetadata.title}, URL: ${websiteMetadata.url}, description: ${websiteMetadata.description}) if necessary to guide your response.`;

  const { GoogleGenerativeAI } = require("@google/generative-ai");

  const genAI = new GoogleGenerativeAI("");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(prompt);

  return result.response.text();
}

// Helper function to check if an element is a text input
function isTextInput(element) {
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute('role');

  console.log(role);
  return (
    //  role === 'textbox' ||
    tagName === "input" ||
    tagName === "textarea" ||
    (tagName === "div" && element.isContentEditable)
   
  );
}

// Function to get the cursor position in an input or textarea
function getCursorPosition(inputElement) {
  if (inputElement.selectionStart !== undefined) {
    return inputElement.selectionStart;
  }
  return 0; // Fallback for unsupported browsers
}

// Function to display the suggestion
function displaySuggestion(inputElement, suggestion) {
  const existingSuggestion = inputElement.nextElementSibling;
  if (existingSuggestion && existingSuggestion.classList.contains("suggestion")) {
    existingSuggestion.remove();
  }

  // Get the cursor position
  const cursorPosition = getCursorPosition(inputElement);

  // Split the input text into two parts: before and after the cursor
  const textBeforeCursor = inputElement.value.slice(0, cursorPosition);
  const textAfterCursor = inputElement.value.slice(cursorPosition);

  
  // Create a suggestion element
  const suggestionElement = document.createElement("span");
  suggestionElement.className = "suggestion";
  suggestionElement.textContent = suggestion;

  // Insert the suggestion element after the cursor
  inputElement.parentNode.insertBefore(suggestionElement, inputElement.nextSibling);

  // Position the suggestion element inline with the cursor
  const inputRect = inputElement.getBoundingClientRect();
  const textBeforeCursorWidth = getTextWidth(textBeforeCursor, inputElement);
  const cursorLeft = inputRect.left + textBeforeCursorWidth;
  const cursorTop = inputRect.top;

  const X_offset = 11.5;
  const Y_offset = 11.5;

  suggestionElement.style.position = "absolute";
  suggestionElement.style.left = `${inputRect.left + textBeforeCursorWidth + X_offset + window.scrollX}px`;
  suggestionElement.style.top = `${inputRect.top + Y_offset + window.scrollY}px`;
  suggestionElement.style.color = "#999"; // Light grey color
  // suggestionElement.style.pointerEvents = "none"; // Ensure the suggestion doesn't interfere with typing
}

// Function to calculate the width of text in an input or textarea
function getTextWidth(text, inputElement) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const fontStyle = window.getComputedStyle(inputElement).font;
  context.font = fontStyle;
  return context.measureText(text).width;
}

// Function to handle user input
async function handleInput(event) {
  const inputElement = event.target;
  var userInput = inputElement.value;

  console.log("this is the event", event.target);
  console.log("this is user input", userInput);

  const element = event.target;
  const role = element.getAttribute('role');
  if (!isTextInput(element) && !(element.isContentEditable)) return;

  console.log("role in input", role);
  // if (role === "textbox"){
  //   console.log("In role check");
  //   var ele = document.activeElement;
  //   const spanElement = ele.querySelector('span[data-text="true"]');
  //   if (spanElement){
  //   userInput = spanElement.textContent;}
  //   else{
  //     userInput = element.text;
  //   }
  //   console.log("postcheck")
  // }

  // Remove existing suggestions
  const existingSuggestion = inputElement.nextElementSibling;
  if (existingSuggestion && existingSuggestion.classList.contains("suggestion")) {
    existingSuggestion.remove();
  }

  if (element.isContentEditable) {
    console.log("this is a content editable element", element.innerText);
    let text = '';
    // Get all text nodes within the element
    const walk = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let node;
    while (node = walk.nextNode()) {
        text += node.textContent;
    }

    userInput = text;
    console.log("this is the user input", userInput);
  }

  // If the user is typing, get a suggestion
  if (userInput.length > 3) {
    let suggestion;
    try {
      suggestion = await getGeminiSuggestion(userInput);
    } catch (error) {
      console.error("Error fetching suggestion from Gemini:", error);
      suggestion = "Hey ya";
    }
    
    if (suggestion) {
      // For contentEditable divs, compute caret coordinates via Selection API
      if (element.isContentEditable) {
        // element.innerText += suggestion;
        displaySuggestion(element, suggestion);
      } else {
        // For inputs or textareas, use your existing method
        displaySuggestion(element, suggestion);
      }
    }
  } else {
    // Remove the suggestion if the input is empty
    const existingSuggestion = inputElement.nextElementSibling;
    if (existingSuggestion && existingSuggestion.classList.contains("suggestion")) {
      existingSuggestion.remove();
    }
  }
}

// Function to handle tab key press
function handleKeyDown(event) {

  if (event.ctrlKey && event.key === "z") {
    const inputElement = event.target;
    if (inputElement.dataset.lastSuggestion) {
      inputElement.value = inputElement.value.replace(inputElement.dataset.lastSuggestion, "");
      delete inputElement.dataset.lastSuggestion;
    }
  }  

  else if (event.key === "Tab") {
    const inputElement = event.target;
    const suggestionElement = inputElement.nextElementSibling;
    inputElement.dataset.lastSuggestion = suggestionElement.textContent;
    const cursorPosition = getCursorPosition(inputElement);
    // If a suggestion exists, append it to the input
    if (suggestionElement && suggestionElement.classList.contains("suggestion")) {
      event.preventDefault(); // Prevent default tab behavior
      const cursorPosition = getCursorPosition(inputElement);
      // const textBeforeCursor = inputElement.value.slice(0, cursorPosition);
      // const textAfterCursor = inputElement.value.slice(cursorPosition);
      inputElement.value += suggestionElement.textContent;
      suggestionElement.remove(); // Remove the suggestion

      // Move the cursor to the end of the inserted suggestion
      const newCursorPosition = cursorPosition + suggestionElement.textContent.length;
      inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
    }
  }

}

// Attach event listeners
document.addEventListener("input", debounce(handleInput, 5));
document.addEventListener("keydown", handleKeyDown);
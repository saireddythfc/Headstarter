import "./styles.css"; // Import the CSS file

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
  const prompt = `Complete the following sentence in a meaningful way, ensuring the response is a complete sentence and does not exceed 300 characters. Use the context of the website (title: ${websiteMetadata.title}, URL: ${websiteMetadata.url}, description: ${websiteMetadata.description}) to guide your response. Here is the user's input: "${userInput}"`;

  try {
    // Make the API call to OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "applications/json",
        Authorization: "Bearer <token>", 
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

// Helper function to check if an element is a text input
function isTextInput(element) {
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute('role');

  console.log(role);
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    (tagName === "div" && element.isContentEditable) ||
    role === 'textbox'
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

  suggestionElement.style.position = "absolute";
  suggestionElement.style.left = `${cursorLeft}px`;
  suggestionElement.style.top = `${cursorTop}px`;
  suggestionElement.style.color = "#999"; // Light grey color
  suggestionElement.style.pointerEvents = "none"; // Ensure the suggestion doesn't interfere with typing
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
  const userInput = inputElement.value;

  console.log("this is the event", event.target);
  console.log("this is user input", userInput);

  const element = event.target;
  if (!isTextInput(element)) return;

  // Remove existing suggestions
  const existingSuggestion = inputElement.nextElementSibling;
  if (existingSuggestion && existingSuggestion.classList.contains("suggestion")) {
    existingSuggestion.remove();
  }

  // If the user is typing, get a suggestion
  if (userInput.length > 3) {
    const suggestion = await getLLMSuggestion(userInput);
    displaySuggestion(inputElement, suggestion);
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
  if (event.key === "Tab") {
    const inputElement = event.target;
    const suggestionElement = inputElement.nextElementSibling;

    // If a suggestion exists, append it to the input
    if (suggestionElement && suggestionElement.classList.contains("suggestion")) {
      event.preventDefault(); // Prevent default tab behavior
      // const cursorPosition = getCursorPosition(inputElement);
      // const textBeforeCursor = inputElement.value.slice(0, cursorPosition);
      // const textAfterCursor = inputElement.value.slice(cursorPosition);
      inputElement.value = suggestionElement.textContent;
      suggestionElement.remove(); // Remove the suggestion

      // Move the cursor to the end of the inserted suggestion
      const newCursorPosition = cursorPosition + suggestionElement.textContent.length;
      inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
    }
  }
}

// Attach event listeners
document.addEventListener("input", handleInput);
document.addEventListener("keydown", handleKeyDown);
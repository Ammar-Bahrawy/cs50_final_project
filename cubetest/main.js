import "./style.css";

const examples = {
  example1: () => import("./examples/example1.js"),
  example2: () => import("./examples/example2.js"),
  example3: () => import("./examples/example3.js"),
  example4: () => import("./examples/example4.js"),
  example5: () => import("./examples/example5.js"),
  example6: () => import("./examples/example6.js"),
  example7: () => import("./examples/example7.js"),
  example8: () => import("./examples/example8.js"),
};

const container = document.getElementById("container");

function loadExample(example) {
  examples[example]()
    .then((module) => {
      container.innerHTML = ""; // Clear previous example
      module.default(container); // Load the selected example
    })
    .catch((error) => {
      console.error(`Error loading example ${example}:`, error);
    });
}

// Add event listeners for buttons
document
  .getElementById("example1Button")
  .addEventListener("click", () => loadExample("example1"));
document
  .getElementById("example2Button")
  .addEventListener("click", () => loadExample("example2"));
document
  .getElementById("example3Button")
  .addEventListener("click", () => loadExample("example3"));
document
  .getElementById("example4Button")
  .addEventListener("click", () => loadExample("example4"));
document
  .getElementById("example5Button")
  .addEventListener("click", () => loadExample("example5"));
document
  .getElementById("example6Button")
  .addEventListener("click", () => loadExample("example6"));
document
  .getElementById("example7Button")
  .addEventListener("click", () => loadExample("example7"));
document
  .getElementById("example8Button")
  .addEventListener("click", () => loadExample("example8"));

// Load the first example by default
loadExample("example8");

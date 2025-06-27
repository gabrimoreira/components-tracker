let font = 16;

const applyfont = (size) => {
  document.documentElement.style.fontSize = `${size}px`;
};

document.getElementById("increase-font").addEventListener("click", () => {
  if (font < 24) {
    font += 2;
    applyfont(font);
  }
});

document.getElementById("decrease-font").addEventListener("click", () => {
  if (font > 12) {
    font -= 2;
    applyfont(font);
  }
});


const contrastToggle = document.getElementById("contrast-toggle");
const html = document.documentElement;

contrastToggle.addEventListener("click", () => {
  html.classList.toggle("contrast-mode");

  if (html.classList.contains("contrast-mode")) {
    localStorage.setItem("contrast", "on");
  } else {
    localStorage.setItem("contrast", "off");
  }
});

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("contrast") === "on") {
    html.classList.add("contrast-mode");
  }
});

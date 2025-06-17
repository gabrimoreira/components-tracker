let font = 16; 

const applyfont = (size) => {
  document.documentElement.style.fontSize = `${size}px`;
};

document.getElementById("increase-font").addEventListener("click", () => {
  if (font < 24) { 
    font += 2;
    applyfont(font);
  }
  console.log(font);
});

document.getElementById("decrease-font").addEventListener("click", () => {
  if (font > 12) {
    font -= 2;
    applyfont(font);
  }
    console.log(font);

});

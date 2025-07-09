const fs = require("fs");
const path = require("path");

function readComponentes() {
  const componentes = fs.readFileSync(
    path.join(__dirname, "../data", "componentes.json"),
    "utf-8"
  );
  return JSON.parse(componentes);
}

function saveComponentes(componentes) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(componentes, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar no JSON:", err);
  }
}
function loadUsers() {
  const users = fs.readFileSync(
    path.join(__dirname, "../data", "users.json"),
    "utf-8"
  );
  return JSON.parse(users);
}

function saveUsers(users) {
  try {
    fs.writeFileSync(
      path.join(__dirname, "../data", "users.json"),
      JSON.stringify(users, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error("Erro ao salvar users.json:", err);
  }
}

module.exports = {
  readComponentes,
  saveComponentes,
  loadUsers,
  saveUsers,
};

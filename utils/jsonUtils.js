const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/test.json');

function readComponentes() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Erro ao ler o JSON:', err);
    return [];
  }
}

function saveComponentes(componentes) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(componentes, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar no JSON:', err);
  }
}

module.exports = {
  readComponentes,
  saveComponentes,
};

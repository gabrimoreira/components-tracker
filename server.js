const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index');
});
app.get('/login', (req, res) => {
  res.render('login');
});
app.get('/sign-up', (req, res) => {
  res.render('sign-up');
});

const PORT =  3000;
app.listen(PORT, () => {
  console.log(`Rodando na Porta: http://localhost:${PORT}`);
});

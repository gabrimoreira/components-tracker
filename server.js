const express = require("express");
const path = require("path");
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/sign-up", (req, res) => {
  res.render("sign-up");
});

app.get("/student/praticas", (req, res) => {
  const user = { name: "Gabriel" };

  const praticas = [
    {
      title: "Montagem de LED com resistor",
      data: "2025-06-26",
      components: ["LED", "Resistor 220Ω", "Protoboard"],
      description:
        "Aprender como ligar um LED com resistor para limitar a corrente.",
      status: "Planejada",
      file: "pratica2.pdf",
    },
    {
      title: "Montagem de LED com resistor",
      data: "2025-06-26",
      components: ["LED", "Resistor 220Ω", "Protoboard"],
      description:
        "Aprender como ligar um LED com resistor para limitar a corrente.",
      status: "Planejada",
      file: "pratica1.pdf",
    },
  ];

  res.render("student/praticas", { user, praticas });
});


const componentes = [
  {
    nome: 'HC-05',
    quantidade: 12,
    laboratorio: 'Lab. de Eletrônica'
  },
  {
    nome: 'Protoboard',
    quantidade: 30,
    laboratorio: 'Lab. de Robótica'
  },
  {
    nome: 'Resistor 220Ω',
    quantidade: 200,
    laboratorio: 'Lab. de Física'
  }
];


app.get('/student/componentes', (req, res) => {
  const { search } = req.query;

  let resultado = componentes;

  if (search) {
    const termo = search.toLowerCase();
    resultado = componentes.filter(c =>
      c.nome.toLowerCase().includes(termo)
    );
  }

  res.render('student/componentes', { componentes: resultado, search });
});

app.post("/sign-up", (req, res) => {
  const user = { name: "Gabriel" };
  res.render("student/index", { user });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Rodando na Porta: http://localhost:${PORT}`);
});

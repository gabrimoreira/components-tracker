const express = require("express");
const path = require("path");
const { readComponentes, saveComponentes } = require("./utils/jsonUtils");
const componentesBase = require("./data/componentesBase");

const app = express();
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));
const componentes = [];

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/sign-up", (req, res) => {
  res.render("sign-up");
});
app.get("/professor", (req, res) => {
  const user = { name: "Gabriel" };
  res.render("professor/index", { user });
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

app.get("/student/componentes", (req, res) => {
  const search = req.query.search?.toLowerCase() || "";
  const componentes = readComponentes();

  const resultado = componentes.filter((c) =>
    c.nome.toLowerCase().includes(search)
  );

  res.render("student/componentes", { componentes: resultado, search });
});


app.get("/tecnico", (req, res) => {
  const user = { name: "Gabriel" };
  res.render("tecnico/index", { user });
});

app.post("/sign-up", (req, res) => {
  const user = { name: "Gabriel" };
  res.render("student/index", { user });
});


app.get("/tecnico", (req, res) => {
  const user = { name: "Gabriel" };
  res.render("tecnico/index", { user });
});

app.get("/tecnico/add-componentes", (req, res) => {
  const user = { name: "Gabriel" };
  res.render("tecnico/add-componentes", { user, componentesBase });
});

app.post('/add-componentes', (req, res) => {
  const { nome, laboratorio, categoria } = req.body;
  const hasId = req.body.hasId === 'on';

  if (hasId) {
    const ids = req.body.ids
      .split('\n')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    ids.forEach(id => {
      componentes.push({
        nome,
        laboratorio,
        categoria,
        idUnico: id,
        comId: true
      });
    });

  } else {
    const quantidade = parseInt(req.body.quantidade);
    componentes.push({
      nome,
      laboratorio,
      categoria,
      quantidade,
      comId: false
    });
  }

  res.redirect('/student/componentes');
});




const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Rodando na Porta: http://localhost:${PORT}`);
});

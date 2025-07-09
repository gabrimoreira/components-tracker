const express = require("express");
const path = require("path");
const {
  readComponentes,
  saveComponentes,
  loadUsers,
  saveUsers,
} = require("./utils/jsonUtils");
const componentesBase = require("./data/componentesBase");
const fs = require("fs");

const app = express();
app.use(express.urlencoded({ extended: true }));

app.post("/sign-up", (req, res) => {
  const users = loadUsers();
  const { name, accountType, school, email, password, confirmPassword } =
    req.body;

  if (password !== confirmPassword) {
    return res.status(400).send("As senhas não coincidem.");
  }

  let profile;
  switch (accountType) {
    case "basic":
      profile = "student";
      break;
    case "premium":
      profile = "tecnico";
      break;
    case "admin":
      profile = "professor";
      break;
    default:
      return res.status(400).send("Tipo de conta inválido.");
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    password,
    profile,
    school,
  };

  if (profile === "student" || profile === "professor") {
    newUser.turmasIds = [];
    newUser.praticasIds = [];
  }

  users.push(newUser);
  saveUsers(users);

  if (profile === "student") {
    res.render("student/index", { user: newUser });
  } else if (profile === "professor") {
    res.render("professor/index", { user: newUser });
  } else {
    res.render("tecnico/index", { user: newUser });
  }
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
let userTest = null;
app.use(express.static(path.join(__dirname, "public")));
const componentes = [];

app.get("/", (req, res) => {
  res.render("index");
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const users = loadUsers();

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).send("Usuário não encontrado.");
  }
  userTest = user;

  const profile = user.profile;
  if (profile === "student") return res.redirect("/student");
  if (profile === "tecnico") return res.redirect("/tecnico");
  if (profile === "professor") return res.redirect("/professor");

  res.redirect("/");
});

app.get("/sign-up", (req, res) => {
  res.render("sign-up");
});
app.get("/professor", (req, res) => {
  const user = { name: "Gabriel" };
  res.render("professor/index", { user });
});

app.get("/student", (req, res) => {
  if (!userTest || userTest.profile !== "student") {
    return res.status(403).send("Acesso negado.");
  }

  res.render("student/index", { user: userTest });
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
  res.render("student/componentes"); 
});



app.get("/api/componentes", (req, res) => {
  const filePath = path.join(__dirname, "data/componentes.json");

  try {
    const data = fs.readFileSync(filePath, "utf8");
    const componentes = JSON.parse(data);
    res.json(componentes);
  } catch (err) {
    console.error("Erro ao ler componentes.json:", err);
    res.status(500).json({ error: "Erro ao carregar componentes" });
  }
});

app.get("/tecnico", (req, res) => {
  const user = { name: "Gabriel" };
  res.render("tecnico/index", { user });
});

app.get("/tecnico", (req, res) => {
  const user = { name: "Gabriel" };
  res.render("tecnico/index", { user });
});

app.get("/tecnico/add-componentes", (req, res) => {
  const user = { name: "Gabriel" };
  res.render("tecnico/add-componentes", { user, componentesBase });
});

app.post("/add-componentes", (req, res) => {
  const { nome, laboratorio, categoria } = req.body;
  const hasId = req.body.hasId === "on";

  if (hasId) {
    const ids = req.body.ids
      .split("\n")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    ids.forEach((id) => {
      componentes.push({
        nome,
        laboratorio,
        categoria,
        idUnico: id,
        comId: true,
      });
    });
  } else {
    const quantidade = parseInt(req.body.quantidade);
    componentes.push({
      nome,
      laboratorio,
      categoria,
      quantidade,
      comId: false,
    });
  }

  res.redirect("/student/componentes");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Rodando na Porta: http://localhost:${PORT}`);
});

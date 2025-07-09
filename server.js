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
  if (!userTest || userTest.profile !== "professor") {
    return res.status(403).send("Acesso negado.");
  }

  res.render("professor/index", { user: userTest });
});

app.get("/student", (req, res) => {
  if (!userTest || userTest.profile !== "student") {
    return res.status(403).send("Acesso negado.");
  }

  res.render("student/index", { user: userTest });
});

app.get("/student/praticas", (req, res) => {
  const users = loadUsers();
  const user = users.find((u) => u.profile === "student");

  if (!user) {
    return res.status(404).send("Usuário não encontrado.");
  }

  res.render("student/praticas", { user });
});

app.get("/api/praticas", (req, res) => {
  const filePath = path.join(__dirname, "data", "praticas.json");
  const userId = parseInt(req.query.userId);

  try {
    const data = fs.readFileSync(filePath, "utf8");
    const allPraticas = JSON.parse(data);
    if (userId) {
      const users = loadUsers();
      const user = users.find(
        (u) => u.id === userId && u.profile === "student"
      );

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const praticasDoAluno = allPraticas.filter((pratica) =>
        user.turmasIds.includes(pratica.turmaId)
      );res.redi

      return res.json(praticasDoAluno);
    }

    res.json(allPraticas);
  } catch (err) {
    console.error("Erro ao ler praticas.json:", err);
    res.status(500).json({ error: "Erro ao carregar práticas" });
  }
});

app.get("/student/turmas", (req, res) => {
  const users = loadUsers();
  const user = users.find((u) => u.profile === "student");

  if (!user) {
    return res.status(404).send("Usuário não encontrado.");
  }

  res.render("student/turmas", { user });
});

app.get("/api/turmas", (req, res) => {
  const filePath = path.join(__dirname, "data", "turmas.json");
  const userId = parseInt(req.query.userId);

  try {
    const data = fs.readFileSync(filePath, "utf8");
    const allTurmas = JSON.parse(data);

    if (userId) {
      const users = loadUsers();
      const user = users.find(
        (u) => u.id === userId && u.profile === "student"
      );

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const minhasTurmas = allTurmas.filter((turma) =>
        turma.alunosIds.includes(user.id)
      );

      const outrasTurmas = allTurmas.filter(
        (turma) => !turma.alunosIds.includes(user.id)
      );

      return res.json({ minhasTurmas, outrasTurmas });
    }

    res.json(allTurmas);
  } catch (err) {
    console.error("Erro ao ler turmas.json:", err);
    res.status(500).json({ error: "Erro ao carregar turmas" });
  }
});

app.post("/student/turmas", (req, res) => {
  const turmaId = parseInt(req.body.turmaId);
  const usersPath = path.join(__dirname, "data", "users.json");
  const turmasPath = path.join(__dirname, "data", "turmas.json");

  const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
  const turmas = JSON.parse(fs.readFileSync(turmasPath, "utf8"));

  const user = users.find((u) => u.profile === "student");

  if (!user) {
    return res.status(404).send("Usuário não encontrado.");
  }

  const turma = turmas.find((t) => t.id === turmaId);

  if (!turma) {
    return res.status(404).send("Turma não encontrada.");
  }

  const jaInscrito = turma.alunosIds.includes(user.id);

  if (!jaInscrito) {
    turma.alunosIds.push(user.id);
    user.turmasIds.push(turma.id);

    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf8");
    fs.writeFileSync(turmasPath, JSON.stringify(turmas, null, 2), "utf8");
  }

  res.redirect("/student/turmas");
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
  if (!userTest || userTest.profile !== "tecnico") {
    return res.status(403).send("Acesso negado.");
  }

  res.render("tecnico/index", { user: userTest });
});

app.get("/tecnico/componentes", (req, res) => {
  res.render("tecnico/componentes");
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

app.get("/tecnico/add-componentes", (req, res) => {
  res.render("tecnico/add-componentes"); 
});


app.post("/add-componentes", (req, res) => {
  const { nome, hasId, quantidade, ids, laboratorio, categoria } = req.body;

  const exigeId = hasId === "on"; 

  const novoComponente = {
    nome,
    laboratorio,
    tipo: categoria,
    descricao: "Sem descrição ainda",
    exigeId
  };

  if (exigeId) {
    const idsArray = ids
      .split("\n")
      .map(id => id.trim())
      .filter(id => id !== "");

    novoComponente.ids = idsArray;
  } else {
    novoComponente.quantidade = parseInt(quantidade, 10) || 0;
  }

  const filePath = path.join(__dirname, "data", "componentes.json");
  const componentes = JSON.parse(fs.readFileSync(filePath, "utf8"));

  componentes.push(novoComponente);

  fs.writeFileSync(filePath, JSON.stringify(componentes, null, 2), "utf8");

  res.redirect("/tecnico/componentes");
});



app.get("/professor/componentes", (req, res) => {
  res.render("professor/componentes");
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

app.get("/professor/praticas", (req, res) => {
  const users = loadUsers();
  const user = users.find((u) => u.profile === "professor");

  if (!user) {
    return res.status(404).send("Usuário não encontrado.");
  }

  res.render("professor/praticas", { user });
});


app.get("/professor/add-componentes", (req, res) => {
  res.render("professor/add-componentes"); 
});


app.post("/add-componentes-professor", (req, res) => {
  const { nome, hasId, quantidade, ids, laboratorio, categoria } = req.body;

  const exigeId = hasId === "on"; 

  const novoComponente = {
    nome,
    laboratorio,
    tipo: categoria,
    descricao: "Sem descrição ainda",
    exigeId
  };

  if (exigeId) {
    const idsArray = ids
      .split("\n")
      .map(id => id.trim())
      .filter(id => id !== "");

    novoComponente.ids = idsArray;
  } else {
    novoComponente.quantidade = parseInt(quantidade, 10) || 0;
  }

  const filePath = path.join(__dirname, "data", "componentes.json");
  const componentes = JSON.parse(fs.readFileSync(filePath, "utf8"));

  componentes.push(novoComponente);

  fs.writeFileSync(filePath, JSON.stringify(componentes, null, 2), "utf8");

  res.redirect("/professor/componentes");
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Rodando na Porta: http://localhost:${PORT}`);
});

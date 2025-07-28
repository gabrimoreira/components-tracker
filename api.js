require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const app = express();

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT_API || 5000;

app.use(express.json());

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

const readJson = (file) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "data", file), "utf8"));
const writeJson = (file, data) =>
  fs.writeFileSync(
    path.join(__dirname, "data", file),
    JSON.stringify(data, null, 2)
  );

// Auth
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const users = readJson("users.json");
  const user = users.find((u) => u.email === email);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send("Email ou senha inválidos.");
  }

  res.json({ id: user.id, name: user.name, profile: user.profile });
});

app.post("/auth/register", async (req, res) => {
  try {
    const users = readJson("users.json");
    const { name, email, password, accountType, school } = req.body;

    if (!name || !email || !password || !accountType) {
      return res.status(400).send("Todos os campos são obrigatórios.");
    }
    if (password.length < 3) {
      return res
        .status(400)
        .send("A senha precisa ter no mínimo 3 caracteres.");
    }
    if (users.find((u) => u.email === email)) {
      return res.status(400).send("Email já cadastrado");
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

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      id: Date.now(),
      name,
      email,
      password: hashedPassword,
      profile,
      school,
      turmasIds: [],
      praticasIds: [],
    };

    users.push(newUser);
    writeJson("users.json", users);

    res.status(201).json({ id: newUser.id, name: newUser.name, profile });
  } catch (error) {
    console.error("ERRO NO REGISTRO (API):", error);
    res.status(500).send("Ocorreu um erro fatal no servidor da API.");
  }
});

// Componentes
app.get("/componentes", verifyToken, (req, res) => {
  res.json(readJson("componentes.json"));
});

app.post("/componentes", verifyToken, (req, res) => {
  try {
    const componentes = readJson("componentes.json");

    const { nome, descricao, laboratorio, tipo, exigeId, quantidade, ids } =
      req.body;

    const novoComponente = {
      nome: nome,
      tipo: tipo,
      descricao: descricao || "Sem descrição ainda",
      laboratorio: laboratorio,
      exigeId: exigeId === "true",
      quantidade: exigeId === "true" ? 0 : parseInt(quantidade) || 0,
      ids:
        exigeId === "true" && ids
          ? ids.split(/\s*[\n\r]+\s*/).filter((id) => id)
          : [],
    };

    componentes.push(novoComponente);
    writeJson("componentes.json", componentes);
    res.status(201).json(novoComponente);
  } catch (error) {
    console.error("ERRO AO ADICIONAR COMPONENTE:", error);
    res.status(500).send("Ocorreu um erro interno no servidor.");
  }
});

// Turmas
app.get("/turmas", verifyToken, (req, res) => {
  try {
    const turmas = readJson("turmas.json");
    const users = readJson("users.json");
    const user = users.find((u) => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const minhasTurmas = turmas.filter(
      (t) => user.turmasIds && t.alunosIds?.includes(user.id)
    );
    const outrasTurmas = turmas.filter(
      (t) => !user.turmasIds || !t.alunosIds?.includes(user.id)
    );

    res.json({ minhasTurmas, outrasTurmas });
  } catch (error) {
    console.error("ERRO AO BUSCAR TURMAS (API):", error);
    res
      .status(500)
      .json({ error: "Ocorreu um erro interno ao processar as turmas." });
  }
});

app.post("/turmas/inscrever", verifyToken, (req, res) => {
  try {
    const users = readJson("users.json");
    const turmas = readJson("turmas.json");

    const { turmaId } = req.body;
    const userId = req.user.id;

    const user = users.find((u) => u.id === userId);
    const turma = turmas.find((t) => t.id === parseInt(turmaId));

    if (!user || !turma) {
      return res.status(404).send("Usuário ou turma não encontrado");
    }

    if (!turma.alunosIds.includes(user.id)) {
      turma.alunosIds.push(user.id);
      if (!user.turmasIds) {
        user.turmasIds = [];
      }
      user.turmasIds.push(turma.id);

      writeJson("users.json", users);
      writeJson("turmas.json", turmas);
    }
    res.status(200).send("Inscrito");
  } catch (error) {
    console.error("ERRO AO INSCREVER NA TURMA:", error);
    res.status(500).send("Ocorreu um erro interno no servidor.");
  }
});
app.get("/turmas/professor/:professorId", verifyToken, (req, res) => {
  try {
    const turmas = readJson("turmas.json");
    const professorId = parseInt(req.params.professorId);

    const turmasDoProfessor = turmas.filter(
      (t) => t.professoresIds && t.professoresIds.includes(professorId)
    );

    res.json(turmasDoProfessor);
  } catch (error) {
    console.error("Erro ao buscar turmas do professor:", error);
    res.status(500).send("Erro interno ao buscar turmas.");
  }
});

app.post("/turmas", verifyToken, (req, res) => {
  try {
    if (req.user.profile !== "professor") {
      return res.status(403).send("Apenas professores podem criar turmas.");
    }
    const turmas = readJson("turmas.json");
    const { nome } = req.body;

    if (!nome) return res.status(400).send("O nome da turma é obrigatório.");

    const novaTurma = {
      id: Date.now(),
      nome,
      professoresIds: [req.user.id],
      alunosIds: [],
      praticasIds: [],
    };
    turmas.push(novaTurma);
    writeJson("turmas.json", turmas);
    res.status(201).json(novaTurma);
  } catch (error) {
    res.status(500).send("Erro ao criar a turma.");
  }
});

app.get("/turmas/:id", verifyToken, (req, res) => {
  try {
    const turmas = readJson("turmas.json");
    const users = readJson("users.json");
    const turma = turmas.find((t) => t.id === parseInt(req.params.id));

    if (!turma) return res.status(404).send("Turma não encontrada.");

    turma.alunos = turma.alunosIds
      .map((alunoId) => {
        const alunoInfo = users.find((u) => u.id === alunoId);
        return {
          id: alunoInfo.id,
          name: alunoInfo.name,
          email: alunoInfo.email,
        };
      })
      .filter(Boolean);

    res.json(turma);
  } catch (error) {
    res.status(500).send("Erro ao buscar detalhes da turma.");
  }
});

app.put("/turmas/:id", verifyToken, (req, res) => {
  try {
    if (req.user.profile !== "professor")
      return res.status(403).send("Acesso negado.");

    const turmas = readJson("turmas.json");
    const turmaIndex = turmas.findIndex(
      (t) => t.id === parseInt(req.params.id)
    );
    if (turmaIndex === -1) return res.status(404).send("Turma não encontrada.");

    const { nome, alunosIds } = req.body;
    turmas[turmaIndex].nome = nome || turmas[turmaIndex].nome;
    turmas[turmaIndex].alunosIds = alunosIds || turmas[turmaIndex].alunosIds;

    writeJson("turmas.json", turmas);
    res.json(turmas[turmaIndex]);
  } catch (error) {
    res.status(500).send("Erro ao atualizar a turma.");
  }
});

app.delete("/turmas/:id", verifyToken, (req, res) => {
  try {
    if (req.user.profile !== "professor")
      return res.status(403).send("Acesso negado.");

    let turmas = readJson("turmas.json");
    let users = readJson("users.json"); 
    const turmaId = parseInt(req.params.id);

    const turmasRestantes = turmas.filter((t) => t.id !== turmaId);
    if (turmas.length === turmasRestantes.length)
      return res.status(404).send("Turma não encontrada.");


    users.forEach((user) => {
      if (user.turmasIds && user.turmasIds.includes(turmaId)) {
        user.turmasIds = user.turmasIds.filter((id) => id !== turmaId);
      }
    });

    writeJson("turmas.json", turmasRestantes);
    writeJson("users.json", users); 
    res.status(204).send();
  } catch (error) {
    res.status(500).send("Erro ao excluir a turma.");
  }
});
// Práticas
app.get("/praticas", verifyToken, (req, res) => {
  try {
    const praticas = readJson("praticas.json");
    const { profile, id } = req.user;

    if (profile === "tecnico" || profile === "professor") {
      return res.json(praticas);
    }

    if (profile === "student") {
      const users = readJson("users.json");
      const user = users.find((u) => u.id === id);
      if (!user)
        return res.status(404).json({ error: "Usuário não encontrado" });
      const minhasPraticas = praticas.filter(
        (p) => user.turmasIds && user.turmasIds.includes(p.turmaId)
      );
      return res.json(minhasPraticas);
    }

    res.status(403).json({ error: "Perfil não autorizado para ver práticas." });
  } catch (error) {
    console.error("Erro ao buscar práticas:", error);
    res.status(500).send("Erro interno ao buscar práticas.");
  }
});

app.post("/praticas", verifyToken, (req, res) => {
  try {
    if (req.user.profile !== "professor") {
      return res.status(403).send("Apenas professores podem criar práticas.");
    }

    const praticas = readJson("praticas.json");
    let { titulo, descricao, turmaId, componentes } = req.body;

    if (!titulo || !turmaId) {
      return res.status(400).send("Título e Turma são obrigatórios.");
    }

    if (typeof componentes === "string") {
      try {
        componentes = JSON.parse(componentes);
      } catch (e) {
        return res
          .status(400)
          .send("Formato inválido para a lista de componentes.");
      }
    }
    if (!Array.isArray(componentes)) {
      componentes = [];
    }

    const novaPratica = {
      id: Date.now(),
      titulo,
      descricao: descricao || "Sem descrição.",
      turmaId: parseInt(turmaId),
      componentes: componentes,
    };

    praticas.push(novaPratica);
    writeJson("praticas.json", praticas);

    res.status(201).json(novaPratica);
  } catch (error) {
    console.error("ERRO AO CRIAR PRÁTICA:", error);
    res.status(500).send("Ocorreu um erro interno no servidor.");
  }
});

app.get("/praticas/:id", verifyToken, (req, res) => {
  try {
    const praticas = readJson("praticas.json");
    const pratica = praticas.find((p) => p.id === parseInt(req.params.id));
    if (!pratica) {
      return res.status(404).send("Prática não encontrada.");
    }
    res.json(pratica);
  } catch (error) {
    res.status(500).send("Erro ao buscar a prática.");
  }
});

app.delete("/praticas/:id", verifyToken, (req, res) => {
  try {
    if (req.user.profile !== "professor") {
      return res.status(403).send("Apenas professores podem excluir práticas.");
    }
    const praticas = readJson("praticas.json");
    const praticaIndex = praticas.findIndex(
      (p) => p.id === parseInt(req.params.id)
    );

    if (praticaIndex === -1) {
      return res.status(404).send("Prática não encontrada.");
    }

    praticas.splice(praticaIndex, 1);
    writeJson("praticas.json", praticas);

    res.status(204).send();
  } catch (error) {
    console.error("ERRO AO EXCLUIR PRÁTICA:", error);
    res.status(500).send("Ocorreu um erro interno no servidor.");
  }
});

app.put("/praticas/:id", verifyToken, (req, res) => {
  try {
    if (req.user.profile !== "professor") {
      return res.status(403).send("Apenas professores podem editar práticas.");
    }
    const praticas = readJson("praticas.json");
    const praticaIndex = praticas.findIndex(
      (p) => p.id === parseInt(req.params.id)
    );

    if (praticaIndex === -1) {
      return res.status(404).send("Prática não encontrada.");
    }

    const { titulo, descricao, turmaId, componentes } = req.body;
    const praticaAtualizada = {
      id: parseInt(req.params.id),
      titulo,
      descricao,
      turmaId: parseInt(turmaId),
      componentes,
    };

    praticas[praticaIndex] = praticaAtualizada;
    writeJson("praticas.json", praticas);

    res.json(praticaAtualizada);
  } catch (error) {
    console.error("ERRO AO ATUALIZAR PRÁTICA:", error);
    res.status(500).send("Ocorreu um erro interno no servidor.");
  }
});
app.listen(PORT, () => console.log(`Rodando api.js na porta ${PORT}`));

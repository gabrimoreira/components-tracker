
function loadComponentes() {
  const container = document.getElementById("componentes-container");
  const searchInput = document.querySelector("input[name='search']");
  let todosComponentes = [];

  function renderComponentes(filtro = "") {
    if (!container) return;
    container.innerHTML = ""; 

    const componentesFiltrados = todosComponentes.filter(comp =>
      comp.nome.toLowerCase().includes(filtro.toLowerCase())
    );

    if (componentesFiltrados.length === 0) {
      container.innerHTML = "<p>Nenhum componente encontrado.</p>";
      return;
    }

    componentesFiltrados.forEach(comp => {
      const card = document.createElement("div");
      card.classList.add("componentes-card");

      const idsHtml = comp.exigeId && Array.isArray(comp.ids)
        ? `<p><strong>IDs:</strong></p>
           <ul>${comp.ids.map(id => `<li>${id}</li>`).join("")}</ul>`
        : `<p><strong>Quantidade:</strong> ${comp.quantidade || 0}</p>`;

      card.innerHTML = `
        <h2>${comp.nome}</h2>
        <p><strong>Tipo:</strong> ${comp.tipo}</p>
        <p><strong>Descrição:</strong> ${comp.descricao}</p>
        ${idsHtml}
      `;
      container.appendChild(card);
    });
  }

  fetch("/professor/componentes/json")
    .then(res => res.json())
    .then(data => {
      todosComponentes = data;
      renderComponentes();
    })
    .catch(err => {
      console.error("Erro ao buscar componentes:", err);
      if (container) {
        container.innerHTML = "<p>Erro ao carregar componentes.</p>";
      }
    });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderComponentes(searchInput.value);
    });
  }
}


function loadPraticas() {
    const container = document.getElementById("praticas-container");
    if (!container) return;

    fetch('/professor/praticas/json')
        .then(res => res.json())
        .then(praticas => {
            container.innerHTML = '';
            if (praticas.length === 0) {
                container.innerHTML = '<p>Nenhuma prática cadastrada.</p>';
                return;
            }
            praticas.forEach(pratica => {
                const card = document.createElement('div');
                card.classList.add('student-card'); 
                card.innerHTML = `
                    <h2>${pratica.titulo}</h2>
                    <p><strong>Descrição:</strong> ${pratica.descricao}</p>
                    <p><strong>ID da Turma:</strong> ${pratica.turmaId}</p>
                    <p><strong>Componentes Necessários:</strong></p>
                    <ul>
                        ${pratica.componentes.map(c => `<li>${c.nome} (Qtd: ${c.quantidade})</li>`).join('')}
                    </ul>
                `;
                container.appendChild(card);
            });
        })
        .catch(err => {
            console.error('Erro ao buscar práticas:', err);
            container.innerHTML = '<p>Erro ao carregar as práticas.</p>';
        });
}



function initializeAddComponentesForm() {

  const checkbox = document.getElementById("exigeId");

  const quantidadeInput = document.getElementById("quantidade");
  const quantidadeWrapper = document.getElementById("quantidade-wrapper");
  const idsInput = document.getElementById("ids"); 
  const idsWrapper = document.getElementById("ids-wrapper");

  if (!checkbox) return;

  function toggleFields() {
    if (checkbox.checked) {
      quantidadeInput.disabled = true;
      quantidadeInput.required = false;
      quantidadeInput.value = '';
      quantidadeWrapper.style.display = 'none';

      idsInput.disabled = false;
      idsInput.required = true;
      idsWrapper.style.display = 'block';
    } 
    else {
      quantidadeInput.disabled = false;
      quantidadeInput.required = true;
      quantidadeWrapper.style.display = 'block';

      idsInput.disabled = true;
      idsInput.required = false;
      idsInput.value = '';
      idsWrapper.style.display = 'none';
    }
  }

  checkbox.addEventListener("change", toggleFields);

  toggleFields();
}


function initializeAddPraticasForm() {
    const form = document.getElementById('add-pratica-form');
    const componenteSelect = document.getElementById('componente-select');
    const addComponenteBtn = document.getElementById('add-componente-btn');
    const listaComponentesContainer = document.getElementById('lista-componentes-container');
    const componentesHiddenInput = document.getElementById('componentes-hidden-input');

    if (!form) return;

    let componentesSelecionados = [];

    function renderizarLista() {
        listaComponentesContainer.innerHTML = '';
        componentesSelecionados.forEach((comp, index) => {
            const item = document.createElement('div');
            item.classList.add('componente-item');
            item.innerHTML = `
                <span>${comp.nome} (Qtd: ${comp.quantidade})</span>
                <button type="button" class="btn-remover" data-index="${index}">&times;</button>
            `;
            listaComponentesContainer.appendChild(item);
        });
        
        componentesHiddenInput.value = JSON.stringify(componentesSelecionados);
    }

    addComponenteBtn.addEventListener('click', () => {
        const nomeComponente = componenteSelect.value;
        if (!nomeComponente) return;
        
        const quantidade = parseInt(prompt(`Qual a quantidade de "${nomeComponente}"?`, '1'), 10);
        if (isNaN(quantidade) || quantidade <= 0) return;

        componentesSelecionados.push({ nome: nomeComponente, quantidade: quantidade });
        renderizarLista();
    });

    listaComponentesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remover')) {
            const index = parseInt(e.target.dataset.index, 10);
            componentesSelecionados.splice(index, 1);
            renderizarLista();
        }
    });
}



function loadPraticas() {
    const container = document.getElementById("praticas-container");
    if (!container) return;

    fetch('/professor/praticas/json')
        .then(res => res.json())
        .then(praticas => {
            container.innerHTML = '';
            if (praticas.length === 0) {
                container.innerHTML = '<p>Nenhuma prática cadastrada. <a href="/professor/add-praticas">Crie a primeira!</a></p>';
                return;
            }
            praticas.forEach(pratica => {
                const card = document.createElement('div');
                card.classList.add('student-card');
                card.innerHTML = `
                    <div class="card-content">
                        <h2>${pratica.titulo}</h2>
                        <p><strong>Descrição:</strong> ${pratica.descricao}</p>
                        </div>
                    <div class="card-actions">
                        <button class="btn-editar" data-id="${pratica.id}">Editar</button>
                        <button class="btn-excluir" data-id="${pratica.id}">Excluir</button>
                    </div>
                `;
                container.appendChild(card);
            });
        })
        .catch(err => console.error('Erro ao buscar práticas:', err));

    container.addEventListener('click', async (e) => {
        const target = e.target;
        const id = target.dataset.id;

        if (target.classList.contains('btn-excluir')) {
            if (confirm('Tem certeza que deseja excluir esta prática?')) {
                const response = await fetch(`/professor/praticas/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    loadPraticas(); 
                } else {
                    alert('Falha ao excluir a prática.');
                }
            }
        }

        if (target.classList.contains('btn-editar')) {
            window.location.href = `/professor/praticas/${id}/edit`;
        }
    });
}



/**
 * @param {Array} componentesIniciais 
 */
function initializeEditPraticasForm(componentesIniciais = []) {
    const form = document.getElementById('edit-pratica-form');
    const praticaId = document.getElementById('pratica-id').value;
    
    
    const componenteSelect = document.getElementById('componente-select');
    const addComponenteBtn = document.getElementById('add-componente-btn');
    const listaComponentesContainer = document.getElementById('lista-componentes-container');
    const componentesHiddenInput = document.getElementById('componentes-hidden-input');

    if (!form || !componenteSelect || !addComponenteBtn || !listaComponentesContainer) {
        console.error("Um ou mais elementos do formulário de edição de prática não foram encontrados.");
        return;
    }

    let componentesSelecionados = componentesIniciais;


    function renderizarLista() {
        listaComponentesContainer.innerHTML = '';

        componentesSelecionados.forEach((comp, index) => {
            const item = document.createElement('div');
            item.classList.add('componente-item');
            item.innerHTML = `
                <span>${comp.nome} (Qtd: ${comp.quantidade})</span>
                <button type="button" class="btn-remover" data-index="${index}">&times;</button>
            `;
            listaComponentesContainer.appendChild(item);
        });
        

        componentesHiddenInput.value = JSON.stringify(componentesSelecionados);
    }

    addComponenteBtn.addEventListener('click', () => {
        const nomeComponente = componenteSelect.value;
        if (!nomeComponente) {
            alert('Por favor, selecione um componente.');
            return;
        }
        
        const quantidade = parseInt(prompt(`Qual a quantidade de "${nomeComponente}"?`, '1'), 10);
        if (isNaN(quantidade) || quantidade <= 0) {
            return;
        }

        componentesSelecionados.push({ nome: nomeComponente, quantidade: quantidade });
        renderizarLista(); 
    });

    listaComponentesContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remover')) {
            const index = parseInt(e.target.dataset.index, 10);
            componentesSelecionados.splice(index, 1); 
            renderizarLista(); 
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            titulo: document.getElementById('titulo').value,
            descricao: document.getElementById('descricao').value,
            turmaId: document.getElementById('turmaId').value,
            componentes: componentesSelecionados
        };

        const response = await fetch(`/professor/praticas/${praticaId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            alert('Prática atualizada com sucesso!');
            window.location.href = '/professor/praticas';
        } else {
            alert('Falha ao atualizar a prática.');
        }
    });


    renderizarLista(); 
}



function initializeTurmasPage() {
    const container = document.getElementById('turmas-container');
    if (!container) return;

    container.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-excluir')) {
            const id = e.target.dataset.id;
            if (confirm(`Tem certeza que deseja excluir a turma ${id}? Esta ação não pode ser desfeita.`)) {
                const response = await fetch(`/professor/turmas/${id}`, {
                    method: 'DELETE',
                });
                if (response.ok) {
                    document.querySelector(`.turma-card[data-turma-id='${id}']`).remove();
                } else {
                    alert('Falha ao excluir a turma.');
                }
            }
        }
    });
}
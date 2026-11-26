// BIBLIODUSGURI – mesma lógica do biblio.js do console, agora no navegador.
// No console os livros ficavam no livros.json; aqui ficam no localStorage.
// Onde o console perguntava com rl.question, aqui usamos prompt().

// ---------- CONFIGURAÇÕES ----------
const CHAVE = "bibliodusguri-livros";
const PRAZO_DIAS = 7;
const UM_DIA = 24 * 60 * 60 * 1000;

// ---------- SALVAR E CARREGAR ----------

function diasAtras(dias) {
  return new Date(Date.now() - dias * UM_DIA).toISOString();
}

function livrosExemplo() {
  return [
    { titulo: "Dom Casmurro", autor: "Machado de Assis", ano: 1899, emprestadoPara: "Bruno", dataEmprestimo: diasAtras(10), vezesEmprestado: 5 },
    { titulo: "O Cortiço", autor: "Aluísio Azevedo", ano: 1890, emprestadoPara: null, vezesEmprestado: 1 },
    { titulo: "Memórias Póstumas de Brás Cubas", autor: "Machado de Assis", ano: 1881, emprestadoPara: null },
    { titulo: "Iracema", autor: "José de Alencar", ano: 1865, emprestadoPara: null, vezesEmprestado: 2 },
    { titulo: "O Guarani", autor: "José de Alencar", ano: 1857, emprestadoPara: null },
    { titulo: "Vidas Secas", autor: "Graciliano Ramos", ano: 1938, emprestadoPara: null, vezesEmprestado: 4 },
    { titulo: "Capitães da Areia", autor: "Jorge Amado", ano: 1937, emprestadoPara: "Ana", dataEmprestimo: diasAtras(2), vezesEmprestado: 3 },
    { titulo: "A Hora da Estrela", autor: "Clarice Lispector", ano: 1977, emprestadoPara: null },
    { titulo: "O Quinze", autor: "Rachel de Queiroz", ano: 1930, emprestadoPara: null, vezesEmprestado: 1 },
    { titulo: "Macunaíma", autor: "Mário de Andrade", ano: 1928, emprestadoPara: null },
  ];
}

function carregarLivros() {
  try {
    let texto = localStorage.getItem(CHAVE);
    if (texto === null) return livrosExemplo(); // primeira vez
    return JSON.parse(texto);                   // texto → array
  } catch {
    return livrosExemplo();
  }
}

function salvarLivros() {
  localStorage.setItem(CHAVE, JSON.stringify(livros)); // array → texto
}

let livros = carregarLivros();

// ---------- AUXILIARES ----------

function dataDevolucao(livro) {
  return new Date(new Date(livro.dataEmprestimo).getTime() + PRAZO_DIAS * UM_DIA);
}

function estaAtrasado(livro) {
  return Boolean(livro.emprestadoPara && livro.dataEmprestimo && new Date() > dataDevolucao(livro));
}

function formatarData(data) {
  return data.toLocaleDateString("pt-BR");
}

function situacao(livro) {
  if (!livro.emprestadoPara) return "Disponível";
  if (estaAtrasado(livro)) return "Atrasado (" + livro.emprestadoPara + ")";
  return "Emprestado até " + formatarData(dataDevolucao(livro)) + " (" + livro.emprestadoPara + ")";
}

function anoValido(ano) {
  let anoAtual = new Date().getFullYear();
  return Number.isInteger(ano) && ano >= 1 && ano <= anoAtual;
}

function tituloRepetido(titulo, ignorar) {
  return livros.some((l) => l !== ignorar && l.titulo.toLowerCase() === titulo.toLowerCase());
}

// Impede que um título com HTML (ex.: "<b>oi</b>") vire código na página
function escaparHTML(texto) {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// ---------- 2, 3, 6 e 9: LISTAR, PESQUISAR E FILTRAR ----------

function mostrarLivros() {
  let termo = document.getElementById("busca").value.trim().toLowerCase();
  let filtro = document.getElementById("filtro").value;

  let lista = livros.filter((livro) => {
    let achou = livro.titulo.toLowerCase().includes(termo) || livro.autor.toLowerCase().includes(termo);
    if (filtro === "disponiveis") return achou && !livro.emprestadoPara;
    if (filtro === "atrasados") return achou && estaAtrasado(livro);
    return achou;
  });

  let tabela = document.getElementById("tabela");
  tabela.innerHTML = "";

  if (lista.length === 0) {
    tabela.innerHTML = "<tr><td colspan='5'>Nenhum livro encontrado.</td></tr>";
  }

  for (let livro of lista) {
    let i = livros.indexOf(livro); // posição na lista principal
    let botaoEmprestimo = livro.emprestadoPara
      ? "<button onclick='devolver(" + i + ")'>Devolver</button>"
      : "<button onclick='emprestar(" + i + ")'>Emprestar</button>";

    tabela.innerHTML +=
      "<tr" + (estaAtrasado(livro) ? " class='atrasado'" : "") + ">" +
      "<td>" + escaparHTML(livro.titulo) + "</td>" +
      "<td>" + escaparHTML(livro.autor) + "</td>" +
      "<td>" + livro.ano + "</td>" +
      "<td>" + escaparHTML(situacao(livro)) + "</td>" +
      "<td>" + botaoEmprestimo +
      " <button onclick='editar(" + i + ")'>Editar</button>" +
      " <button onclick='remover(" + i + ")'>Remover</button></td>" +
      "</tr>";
  }

  mostrarResumo();
  mostrarRanking();
}

// ---------- 1: CADASTRAR ----------

document.getElementById("form-cadastro").addEventListener("submit", function (evento) {
  evento.preventDefault(); // não recarrega a página

  let titulo = document.getElementById("titulo").value.trim();
  let autor = document.getElementById("autor").value.trim();
  let ano = Number(document.getElementById("ano").value);

  if (titulo === "" || autor === "") {
    alert("Título e autor não podem ficar vazios.");
    return;
  }
  if (!anoValido(ano)) {
    alert("Ano inválido. Digite um ano entre 1 e " + new Date().getFullYear() + ".");
    return;
  }
  if (tituloRepetido(titulo)) {
    alert("Esse livro já está cadastrado.");
    return;
  }

  livros.push({ titulo: titulo, autor: autor, ano: ano, emprestadoPara: null });
  salvarLivros();
  mostrarLivros();
  evento.target.reset(); // limpa os campos
});

// ---------- 4: EMPRESTAR ----------

function emprestar(i) {
  let livro = livros[i];
  let aluno = prompt("Nome do aluno que vai pegar \"" + livro.titulo + "\":");
  if (aluno === null) return; // clicou em Cancelar
  aluno = aluno.trim();
  if (aluno === "") {
    alert("Digite o nome do aluno.");
    return;
  }

  livro.emprestadoPara = aluno;
  livro.vezesEmprestado = (livro.vezesEmprestado || 0) + 1;
  livro.dataEmprestimo = new Date().toISOString();
  salvarLivros();
  mostrarLivros();
  alert("Empréstimo registrado! Devolver até " + formatarData(dataDevolucao(livro)) + ".");
}

// ---------- 5: DEVOLVER ----------

function devolver(i) {
  let livro = livros[i];
  let atrasado = estaAtrasado(livro); // guarda ANTES de apagar a data

  livro.emprestadoPara = null;
  delete livro.dataEmprestimo;
  salvarLivros();
  mostrarLivros();

  if (atrasado) alert("Devolvido com atraso!");
  else alert("Devolução registrada!");
}

// ---------- 7: REMOVER ----------

function remover(i) {
  let livro = livros[i];
  if (livro.emprestadoPara) {
    alert("Não é possível remover um livro emprestado.");
    return;
  }
  if (!confirm("Remover \"" + livro.titulo + "\"?")) return;

  livros = livros.filter((l) => l !== livro);
  salvarLivros();
  mostrarLivros();
}

// ---------- 10: EDITAR ----------

function editar(i) {
  let livro = livros[i];

  // prompt já vem preenchido com o valor atual
  let novoTitulo = prompt("Título:", livro.titulo);
  if (novoTitulo === null) return;
  let novoAutor = prompt("Autor:", livro.autor);
  if (novoAutor === null) return;
  let novoAno = prompt("Ano:", livro.ano);
  if (novoAno === null) return;

  novoTitulo = novoTitulo.trim();
  novoAutor = novoAutor.trim();
  novoAno = Number(novoAno);

  if (novoTitulo === "" || novoAutor === "") {
    alert("Título e autor não podem ficar vazios.");
    return;
  }
  if (tituloRepetido(novoTitulo, livro)) {
    alert("Já existe outro livro com esse título.");
    return;
  }
  if (!anoValido(novoAno)) {
    alert("Ano inválido.");
    return;
  }

  // Só altera depois de validar tudo
  livro.titulo = novoTitulo;
  livro.autor = novoAutor;
  livro.ano = novoAno;
  salvarLivros();
  mostrarLivros();
}

// ---------- 8: RESUMO ----------

function mostrarResumo() {
  let emprestados = livros.filter((livro) => livro.emprestadoPara).length;
  let atrasados = livros.filter((livro) => estaAtrasado(livro)).length;

  document.getElementById("resumo").textContent =
    "Total: " + livros.length +
    " | Disponíveis: " + (livros.length - emprestados) +
    " | Emprestados: " + emprestados +
    " | Atrasados: " + atrasados;
}

// ---------- 11: RANKING ----------

function mostrarRanking() {
  let ordenados = [...livros]
    .filter((livro) => (livro.vezesEmprestado || 0) > 0)
    .sort((a, b) => b.vezesEmprestado - a.vezesEmprestado)
    .slice(0, 5); // só os 5 primeiros

  let lista = document.getElementById("ranking");
  lista.innerHTML = "";
  for (let livro of ordenados) {
    lista.innerHTML += "<li>" + escaparHTML(livro.titulo) + " (" + livro.vezesEmprestado + "x)</li>";
  }
}

// ---------- QUANDO A PÁGINA ABRE ----------

document.getElementById("busca").addEventListener("input", mostrarLivros);
document.getElementById("filtro").addEventListener("change", mostrarLivros);

mostrarLivros();

const alunos = [];
const listaAlunos = document.getElementById('lista-alunos');
const nomeInput = document.getElementById('nome');
const notaInput = document.getElementById('nota');

document.getElementById('cadastrar').addEventListener('click', () => {
  const nome = nomeInput.value.trim();
  const nota = parseFloat(notaInput.value);

  if (nome && !isNaN(nota) && nota >= 0 && nota <= 10) {
    alunos.push({ nome, nota });
    nomeInput.value = '';
    notaInput.value = '';
    exibirAlunos(alunos);
  } else {
    alert('Por favor, insira um nome válido e uma nota entre 0 e 10.');
  }
});

document.getElementById('filtrar-aprovados').addEventListener('click', () => {
  const aprovados = alunos.filter(aluno => aluno.nota >= 7);
  exibirAlunos(aprovados);
});

document.getElementById('mostrar-todos').addEventListener('click', () => {
  exibirAlunos(alunos);
});

function exibirAlunos(lista) {
  listaAlunos.innerHTML = '';
  lista.forEach(aluno => {
    const li = document.createElement('li');
    li.textContent = `${aluno.nome} - Nota: ${aluno.nota}`;
    li.className = aluno.nota >= 7 ? 'aprovado' : 'reprovado';
    listaAlunos.appendChild(li);
  });
}
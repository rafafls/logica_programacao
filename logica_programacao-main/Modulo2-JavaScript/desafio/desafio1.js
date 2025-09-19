function calcularMedia() {
    let n1 = parseFloat(document.getElementById("nota1").value);
    let n2 = parseFloat(document.getElementById("nota2").value);

    let media = (n1 + n2) / 2;
    document.getElementById("resultado").innerText = "Média: " + media.toFixed(2);
  }
document.body.style.backgroundColor = "black"
// document.body.style.color = "purple"

// window.alert("SEJA BEM-VINDO")

// window.prompt("LOGIN")
// window.prompt("SENHA")



// window.confirm("Site")

//----------TAG---------------------//
// document.getElementsByTagName("input")[0]
 
let paragrafo1 = document.getElementsByTagName("p")[0]
paragrafo1.innerHTML = "USANDO O TAG NAME"
paragrafo1.style.backgroundColor = "grey"
paragrafo1.style.color = "black"

let paragrafo2 = document.getElementById("paragrafo2")
paragrafo2.innerHTML = "USANDO O ID"
paragrafo2.style.backgroundColor = "red"
paragrafo2.style.color = "white"

let paragrafo3 = document.getElementsByClassName("paragrafo3")[0]
paragrafo3.innerHTML = "CU"
paragrafo3.style.backgroundColor = "orange"
paragrafo3.style.color = "black"

let paragrafo4 = document.querySelector("#paragrafo4")
paragrafo4.innerHTML = "USANDO O QUERY SLECTOR"
paragrafo4.style.backgroundColor = "navy"

let paragrafo5 = document.querySelectorAll("p")[4]
paragrafo5.innerHTML = "USANDO O QUERY SLECTOR ALL"
paragrafo5.style.backgroundColor = "purple"
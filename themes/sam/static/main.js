function toggleTheme() {
  let body = document.getElementsByTagName("body")[0];
  if (body) {
    body.style.transition = "background-color 1s ease-in-out";
    if (body.getAttribute("data-theme") === "light") {
      body.setAttribute("data-theme", "dark");
      window.localStorage.setItem("theme", "dark");
    } else if (body.getAttribute("data-theme") === "dark") {
      body.setAttribute("data-theme", "light");
      window.localStorage.setItem("theme", "light");
    } else {
      body.setAttribute("data-theme", "light");
      window.localStorage.setItem("theme", "light");
    }
  }
}

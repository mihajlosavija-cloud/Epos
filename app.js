
let currentUser = null;
let db = {
  users: [],
  sales: [] 
};

const $ = (id) => document.getElementById(id);

function showMsg(el, text) {
  el.textContent = text;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3500);
}

function setLoggedInUI() {
  const userLabel = $("userLabel");
  const logoutBtn = $("logoutBtn");
  const locked = !currentUser;

  userLabel.textContent = locked ? "Niste prijavljeni" : `Prijavljen: ${currentUser}`;
  logoutBtn.classList.toggle("hidden", locked);


  $("dataCard").style.opacity = locked ? "0.55" : "1";
  $("forecastCard").style.opacity = locked ? "0.55" : "1";
}

function renderSales() {
  const tbody = $("salesTbody");
  const rows = db.sales.filter(s => s.userEmail === currentUser);

  if (!currentUser) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">Ulogujte se da biste videli podatke.</td></tr>`;
    return;
  }
  if (rows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="muted">Nema unosa još.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .sort((a,b) => (a.date < b.date ? 1 : -1))
    .map(r => `
      <tr>
        <td>${escapeHtml(r.productName)}</td>
        <td>${r.date}</td>
        <td>${r.qty}</td>
        <td class="right"><button class="btn btn-ghost" data-del="${r.id}">Obriši</button></td>
      </tr>
    `).join("");


  tbody.querySelectorAll("button[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-del"));
      db.sales = db.sales.filter(s => s.id !== id);
      renderSales();
    });
  });
}

function escapeHtml(str){
  return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

document.querySelectorAll(".tab").forEach(t => {
  t.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");

    const tab = t.dataset.tab;
    $("registerPanel").classList.toggle("hidden", tab !== "register");
    $("loginPanel").classList.toggle("hidden", tab !== "login");
  });
});


$("registerBtn").addEventListener("click", () => {
  const email = $("regEmail").value.trim();
  const pass = $("regPass").value;

  if (!email || !pass) return showMsg($("authMsg"), "Unesite email i lozinku.");
  if (db.users.some(u => u.email === email)) return showMsg($("authMsg"), "Ovaj email već postoji.");

  db.users.push({ email, pass });
  showMsg($("authMsg"), "Nalog kreiran. Sada se ulogujte.");
  $("regPass").value = "";
});

$("loginBtn").addEventListener("click", () => {
  const email = $("logEmail").value.trim();
  const pass = $("logPass").value;

  const u = db.users.find(u => u.email === email && u.pass === pass);
  if (!u) return showMsg($("authMsg"), "Pogrešan email ili lozinka.");

  currentUser = email;
  showMsg($("authMsg"), "Uspešno ste se ulogovali.");
  setLoggedInUI();
  renderSales();
});

$("logoutBtn").addEventListener("click", () => {
  currentUser = null;
  setLoggedInUI();
  renderSales();
  $("forecastValue").textContent = "—";
  $("stockValue").textContent = "—";
  $("orderValue").textContent = "—";
});

$("addSaleBtn").addEventListener("click", () => {
  if (!currentUser) return showMsg($("dataMsg"), "Morate biti ulogovani.");

  const productName = $("productName").value.trim();
  const stock = Number($("productStock").value);
  const date = $("saleDate").value;
  const qty = Number($("saleQty").value);

  if (!productName) return showMsg($("dataMsg"), "Unesite naziv proizvoda.");
  if (!date) return showMsg($("dataMsg"), "Izaberite datum.");
  if (!Number.isFinite(stock) || stock < 0) return showMsg($("dataMsg"), "Unesite validno stanje zaliha.");
  if (!Number.isFinite(qty) || qty < 0) return showMsg($("dataMsg"), "Unesite validnu količinu prodaje.");

  db.sales.push({
    id: Date.now(),
    userEmail: currentUser,
    productName,
    stock,
    date,
    qty
  });

  showMsg($("dataMsg"), "Unos prodaje sačuvan.");
  renderSales();
});

$("forecastBtn").addEventListener("click", () => {
  if (!currentUser) return showMsg($("forecastMsg"), "Morate biti ulogovani.");

  const months = Number($("months").value);
  const productName = $("productName").value.trim();

  if (!productName) return showMsg($("forecastMsg"), "Unesite/birajte proizvod (naziv) da bi predikcija znala za šta računa.");

  const rows = db.sales
    .filter(s => s.userEmail === currentUser && s.productName.toLowerCase() === productName.toLowerCase())
    .sort((a,b)=> (a.date > b.date ? 1 : -1));

  if (rows.length < 2) return showMsg($("forecastMsg"), "Unesite bar 2 unosa prodaje za taj proizvod.");

  const total = rows.reduce((sum, r) => sum + r.qty, 0);
  const avgPerEntry = total / rows.length;

  const forecast = Math.round(avgPerEntry * (months * 4));

  const stock = Number(rows[rows.length - 1].stock || 0);
  const recommendedOrder = Math.max(0, forecast - stock);

  $("forecastValue").textContent = String(forecast);
  $("stockValue").textContent = String(stock);
  $("orderValue").textContent = String(recommendedOrder);

  showMsg($("forecastMsg"), "Predikcija generisana (MVP statistički metod).");
});


setLoggedInUI();

renderSales();

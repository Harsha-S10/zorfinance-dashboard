const DATA_KEY = "student-finance-data";
const ROLE_KEY = "student-finance-role";
const THEME_KEY = "student-finance-theme";

const app = {
  role: localStorage.getItem(ROLE_KEY) || "viewer",
  theme: localStorage.getItem(THEME_KEY) || "light",
  page: "overview",
  search: "",
  filterType: "all",
  sortBy: "date",
  sortDir: "desc",
  data: loadData()
};

const el = {
  tabs: document.querySelectorAll(".tab"),
  pages: document.querySelectorAll(".page"),
  pageLabel: document.getElementById("pageLabel"),
  role: document.getElementById("role"),
  themeBtn: document.getElementById("themeBtn"),
  summary: document.getElementById("summary"),
  search: document.getElementById("search"),
  filterType: document.getElementById("filterType"),
  sortBy: document.getElementById("sortBy"),
  sortDir: document.getElementById("sortDir"),
  toggleForm: document.getElementById("toggleForm"),
  addForm: document.getElementById("addForm"),
  fDate: document.getElementById("fDate"),
  fDesc: document.getElementById("fDesc"),
  fAmount: document.getElementById("fAmount"),
  fCategory: document.getElementById("fCategory"),
  fType: document.getElementById("fType"),
  rows: document.getElementById("rows"),
  noData: document.getElementById("noData"),
  insightList: document.getElementById("insightList")
};

let trendChart;
let categoryChart;
let monthlyChart;

function loadData() {
  const saved = localStorage.getItem(DATA_KEY);
  if (saved) return JSON.parse(saved);

  return [
    { id: 1, date: "2026-01-03", desc: "Salary", category: "Salary", type: "income", amount: 60000 },
    { id: 2, date: "2026-01-05", desc: "House Rent", category: "Rent", type: "expense", amount: 18000 },
    { id: 3, date: "2026-01-10", desc: "Groceries", category: "Food", type: "expense", amount: 3500 },
    { id: 4, date: "2026-02-03", desc: "Freelance", category: "Freelance", type: "income", amount: 15000 },
    { id: 5, date: "2026-02-08", desc: "Electricity", category: "Utilities", type: "expense", amount: 2200 },
    { id: 6, date: "2026-03-04", desc: "Salary", category: "Salary", type: "income", amount: 62000 },
    { id: 7, date: "2026-03-16", desc: "Shopping", category: "Shopping", type: "expense", amount: 4200 }
  ];
}

function saveData() {
  localStorage.setItem(DATA_KEY, JSON.stringify(app.data));
}

function money(value) {
  return "₹" + Number(value).toLocaleString("en-IN");
}

function totals() {
  let income = 0;
  let expense = 0;

  app.data.forEach((item) => {
    if (item.type === "income") income += item.amount;
    else expense += item.amount;
  });

  return { income, expense, balance: income - expense };
}

function filteredData() {
  const list = app.data.filter((item) => {
    const text = (item.desc + " " + item.category).toLowerCase();
    const okSearch = text.includes(app.search.toLowerCase());
    const okType = app.filterType === "all" || item.type === app.filterType;
    return okSearch && okType;
  });

  list.sort((a, b) => {
    let x = a[app.sortBy];
    let y = b[app.sortBy];

    if (app.sortBy === "date") {
      x = new Date(x).getTime();
      y = new Date(y).getTime();
    }

    if (app.sortDir === "asc") return x > y ? 1 : -1;
    return x < y ? 1 : -1;
  });

  return list;
}

function renderSummary() {
  const t = totals();
  el.summary.innerHTML = `
    <div class="mini-card">
      <p>Total Balance</p>
      <h3>${money(t.balance)}</h3>
    </div>
    <div class="mini-card">
      <p>Total Income</p>
      <h3>${money(t.income)}</h3>
    </div>
    <div class="mini-card">
      <p>Total Expense</p>
      <h3>${money(t.expense)}</h3>
    </div>
  `;
}

function renderRows() {
  const list = filteredData();
  el.noData.classList.toggle("hidden", list.length > 0);

  el.rows.innerHTML = list
    .map((item) => {
      const amountClass = item.type === "income" ? "income" : "expense";
      const editDisabled = app.role !== "admin" ? "disabled" : "";

      return `
        <tr>
          <td>${item.date}</td>
          <td>${item.desc}</td>
          <td>${item.category}</td>
          <td>${item.type}</td>
          <td class="${amountClass}">${money(item.amount)}</td>
          <td><button data-id="${item.id}" ${editDisabled}>Edit</button></td>
        </tr>
      `;
    })
    .join("");
}

function topCategory() {
  const map = {};
  app.data.forEach((item) => {
    if (item.type === "expense") {
      map[item.category] = (map[item.category] || 0) + item.amount;
    }
  });

  let topName = "No Data";
  let topValue = 0;

  Object.keys(map).forEach((key) => {
    if (map[key] > topValue) {
      topValue = map[key];
      topName = key;
    }
  });

  return { topName, topValue };
}

function monthData() {
  const map = {};
  app.data.forEach((item) => {
    const m = item.date.slice(0, 7);
    if (!map[m]) map[m] = { income: 0, expense: 0 };
    map[m][item.type] += item.amount;
  });

  const months = Object.keys(map).sort();
  return {
    months,
    income: months.map((m) => map[m].income),
    expense: months.map((m) => map[m].expense)
  };
}

function renderInsights() {
  const top = topCategory();
  const m = monthData();

  let compare = "Not enough month data";
  if (m.months.length >= 2) {
    const last = m.expense[m.expense.length - 1];
    const prev = m.expense[m.expense.length - 2];
    const diff = last - prev;
    if (diff > 0) compare = `Expense increased by ${money(diff)}`;
    else if (diff < 0) compare = `Expense decreased by ${money(Math.abs(diff))}`;
    else compare = "Expense stayed same as last month";
  }

  el.insightList.innerHTML = `
    <div class="mini-card">
      <p>Highest Spending Category</p>
      <h3>${top.topName} (${money(top.topValue)})</h3>
    </div>
    <div class="mini-card">
      <p>Monthly Comparison</p>
      <h3>${compare}</h3>
    </div>
    <div class="mini-card">
      <p>Total Transactions</p>
      <h3>${app.data.length}</h3>
    </div>
  `;
}

function createCharts() {
  trendChart = new Chart(document.getElementById("trendChart"), {
    type: "line",
    data: { labels: [], datasets: [{ label: "Balance", data: [] }] },
    options: { responsive: true, maintainAspectRatio: false }
  });

  categoryChart = new Chart(document.getElementById("categoryChart"), {
    type: "pie",
    data: { labels: [], datasets: [{ data: [] }] },
    options: { responsive: true, maintainAspectRatio: false }
  });

  monthlyChart = new Chart(document.getElementById("monthlyChart"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Income",
          data: [],
          backgroundColor: "rgba(244, 114, 182, 0.75)",
          borderColor: "rgba(236, 72, 153, 1)",
          borderWidth: 1
        },
        {
          label: "Expense",
          data: [],
          backgroundColor: "rgba(236, 72, 153, 0.75)",
          borderColor: "rgba(219, 39, 119, 1)",
          borderWidth: 1
        }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function updateCharts() {
  const byDate = [...app.data].sort((a, b) => new Date(a.date) - new Date(b.date));
  let running = 0;
  const trendLabels = [];
  const trendValues = [];

  byDate.forEach((item) => {
    trendLabels.push(item.date);
    running += item.type === "income" ? item.amount : -item.amount;
    trendValues.push(running);
  });

  trendChart.data.labels = trendLabels;
  trendChart.data.datasets[0].data = trendValues;
  trendChart.update();

  const map = {};
  app.data.forEach((item) => {
    if (item.type === "expense") {
      map[item.category] = (map[item.category] || 0) + item.amount;
    }
  });

  const pieLabels = Object.keys(map);
  const pieValues = Object.values(map);

  categoryChart.data.labels = pieLabels.length ? pieLabels : ["No Data"];
  categoryChart.data.datasets[0].data = pieValues.length ? pieValues : [1];
  categoryChart.update();

  const m = monthData();
  monthlyChart.data.labels = m.months;
  monthlyChart.data.datasets[0].data = m.income;
  monthlyChart.data.datasets[1].data = m.expense;
  monthlyChart.update();
}

function redraw() {
  renderSummary();
  renderRows();
  renderInsights();
  updateCharts();
}

function showPage(name) {
  app.page = name;
  el.pages.forEach((page) => page.classList.toggle("active", page.id === name));
  el.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.page === name));
  el.pageLabel.textContent = name.charAt(0).toUpperCase() + name.slice(1);
}

function setRole(role) {
  app.role = role;
  localStorage.setItem(ROLE_KEY, role);
  el.toggleForm.style.display = role === "admin" ? "inline-block" : "none";
  if (role !== "admin") el.addForm.classList.add("hidden");
  renderRows();
}

function setTheme(theme) {
  app.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  document.body.classList.toggle("dark", theme === "dark");
  el.themeBtn.textContent = theme === "dark" ? "Light" : "Dark";
}

function addEvents() {
  el.tabs.forEach((tab) => {
    tab.addEventListener("click", () => showPage(tab.dataset.page));
  });

  el.role.addEventListener("change", (e) => setRole(e.target.value));

  el.themeBtn.addEventListener("click", () => {
    const next = app.theme === "light" ? "dark" : "light";
    setTheme(next);
  });

  el.search.addEventListener("input", (e) => {
    app.search = e.target.value;
    renderRows();
  });

  el.filterType.addEventListener("change", (e) => {
    app.filterType = e.target.value;
    renderRows();
  });

  el.sortBy.addEventListener("change", (e) => {
    app.sortBy = e.target.value;
    renderRows();
  });

  el.sortDir.addEventListener("click", () => {
    app.sortDir = app.sortDir === "asc" ? "desc" : "asc";
    el.sortDir.textContent = app.sortDir === "asc" ? "Asc" : "Desc";
    renderRows();
  });

  el.toggleForm.addEventListener("click", () => {
    el.addForm.classList.toggle("hidden");
  });

  el.addForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const entry = {
      id: Date.now(),
      date: el.fDate.value,
      desc: el.fDesc.value.trim(),
      amount: Number(el.fAmount.value),
      category: el.fCategory.value,
      type: el.fType.value
    };

    if (!entry.date || !entry.desc || !entry.amount) return;

    app.data.push(entry);
    saveData();
    redraw();
    el.addForm.reset();
    el.fDate.value = new Date().toISOString().slice(0, 10);
    el.addForm.classList.add("hidden");
  });

  el.rows.addEventListener("click", (e) => {
    const id = e.target.dataset.id;
    if (!id || app.role !== "admin") return;

    const txn = app.data.find((x) => x.id === Number(id));
    if (!txn) return;

    const updated = prompt("Edit description", txn.desc);
    if (!updated) return;

    txn.desc = updated.trim();
    saveData();
    redraw();
  });
}

function start() {
  createCharts();
  addEvents();

  el.role.value = app.role;
  el.filterType.value = app.filterType;
  el.sortBy.value = app.sortBy;
  el.sortDir.textContent = app.sortDir === "asc" ? "Asc" : "Desc";
  el.fDate.value = new Date().toISOString().slice(0, 10);

  setTheme(app.theme);
  setRole(app.role);
  showPage(app.page);
  redraw();
}

start();
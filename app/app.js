const STORAGE_KEY = "arrendamento_data";
const SESSION_KEY = "arrendamento_session";

const CATEGORY_OPTIONS = {
  income: ["Renda", "Caução", "Outras receitas"],
  expense: ["Condomínio", "IMI", "Reparações", "Devolução de caução"],
};

const ui = {
  loginCard: document.getElementById("loginCard"),
  appView: document.getElementById("appView"),
  sessionSummary: document.getElementById("sessionSummary"),
  loginForm: document.getElementById("loginForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  menuView: document.getElementById("menuView"),
  propertiesView: document.getElementById("propertiesView"),
  expenseView: document.getElementById("expenseView"),
  incomeView: document.getElementById("incomeView"),
  summaryView: document.getElementById("summaryView"),
  propertyForm: document.getElementById("propertyForm"),
  propertyId: document.getElementById("propertyId"),
  propertyName: document.getElementById("propertyName"),
  propertyAddress: document.getElementById("propertyAddress"),
  propertyList: document.getElementById("propertyList"),
  propertyReset: document.getElementById("propertyReset"),
  expenseForm: document.getElementById("expenseForm"),
  expenseId: document.getElementById("expenseId"),
  expenseProperty: document.getElementById("expenseProperty"),
  expenseCategory: document.getElementById("expenseCategory"),
  expenseAmount: document.getElementById("expenseAmount"),
  expenseDate: document.getElementById("expenseDate"),
  expenseNotes: document.getElementById("expenseNotes"),
  expenseList: document.getElementById("expenseList"),
  expenseReset: document.getElementById("expenseReset"),
  incomeForm: document.getElementById("incomeForm"),
  incomeId: document.getElementById("incomeId"),
  incomeProperty: document.getElementById("incomeProperty"),
  incomeCategory: document.getElementById("incomeCategory"),
  incomeAmount: document.getElementById("incomeAmount"),
  incomeDate: document.getElementById("incomeDate"),
  incomeNotes: document.getElementById("incomeNotes"),
  incomeList: document.getElementById("incomeList"),
  incomeReset: document.getElementById("incomeReset"),
  filterYear: document.getElementById("filterYear"),
  filterMonth: document.getElementById("filterMonth"),
  filterReset: document.getElementById("filterReset"),
  summaryTable: document.getElementById("summaryTable"),
  adminSection: document.getElementById("adminSection"),
  userForm: document.getElementById("userForm"),
  userName: document.getElementById("userName"),
  userEmail: document.getElementById("userEmail"),
  userPassword: document.getElementById("userPassword"),
  userRole: document.getElementById("userRole"),
  userList: document.getElementById("userList"),
};

const createId = () => crypto.randomUUID();

const defaultData = () => ({
  users: [
    {
      id: createId(),
      name: "Administrador",
      email: "admin@arrendamento.local",
      password: "Admin123",
      role: "admin",
    },
  ],
  properties: [],
  transactions: [],
});

const loadData = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const initial = defaultData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(raw);
};

const saveData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const loadSession = () => {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
};

const saveSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-PT").format(new Date(value));
};

const currentYear = () => new Date().getFullYear();

const setSessionSummary = (user) => {
  if (!user) {
    ui.sessionSummary.innerHTML = "";
    return;
  }
  ui.sessionSummary.innerHTML = `
    <p><strong>${user.name}</strong></p>
    <p class="hint">${user.email}</p>
    <span class="badge">${user.role === "admin" ? "Administrador" : "Utilizador"}</span>
    <div class="row" style="margin-top:12px;">
      <button class="ghost" id="logoutButton">Sair</button>
    </div>
  `;
  document.getElementById("logoutButton").addEventListener("click", () => {
    clearSession();
    location.reload();
  });
};

let activeSession = null;

const setView = (viewId) => {
  const views = [
    ui.menuView,
    ui.propertiesView,
    ui.expenseView,
    ui.incomeView,
    ui.summaryView,
  ];
  views.forEach((view) => {
    if (view) {
      view.hidden = view.id !== viewId;
    }
  });
  if (ui.adminSection) {
    if (viewId === "menuView") {
      ui.adminSection.hidden = !activeSession || activeSession.role !== "admin";
    } else {
      ui.adminSection.hidden = true;
    }
  }
};

const wireNavigation = () => {
  ui.menuView.querySelectorAll(".menu-card").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.target;
      if (target) {
        setView(target);
      }
    });
  });

  document.querySelectorAll("[data-action='back']").forEach((button) => {
    button.addEventListener("click", () => {
      setView("menuView");
    });
  });
};

const renderPropertyOptions = (properties) => {
  const options = properties
    .map((property) => `<option value="${property.id}">${property.name}</option>`)
    .join("");
  ui.expenseProperty.innerHTML = options;
  ui.incomeProperty.innerHTML = options;
};

const renderCategoryOptions = () => {
  ui.expenseCategory.innerHTML = CATEGORY_OPTIONS.expense
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");
  ui.incomeCategory.innerHTML = CATEGORY_OPTIONS.income
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");
};

const renderProperties = (data, user) => {
  if (data.properties.length === 0) {
    ui.propertyList.innerHTML = "<p class=\"hint\">Ainda não existem imóveis.</p>";
    renderPropertyOptions([]);
    return;
  }

  renderPropertyOptions(data.properties);
  ui.propertyList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Morada</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${data.properties
          .map(
            (property) => `
          <tr>
            <td>${property.name}</td>
            <td>${property.address}</td>
            <td>
              <button class="ghost" data-action="edit" data-id="${property.id}">Editar</button>
              <button class="danger" data-action="delete" data-id="${property.id}">Remover</button>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  ui.propertyList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      const propertyId = button.dataset.id;
      const property = data.properties.find((item) => item.id === propertyId);
      if (!property) return;
      if (action === "edit") {
        ui.propertyId.value = property.id;
        ui.propertyName.value = property.name;
        ui.propertyAddress.value = property.address;
        return;
      }
      if (action === "delete") {
        data.properties = data.properties.filter((item) => item.id !== propertyId);
        data.transactions = data.transactions.filter(
          (item) => item.propertyId !== propertyId
        );
        saveData(data);
        refreshApp(data, user);
      }
    });
  });
};

const renderTransactions = (data, user) => {
  if (data.transactions.length === 0) {
    ui.expenseList.innerHTML = "<p class=\"hint\">Nenhuma despesa registada.</p>";
    ui.incomeList.innerHTML = "<p class=\"hint\">Nenhuma receita registada.</p>";
    return;
  }

  const propertyLookup = new Map(
    data.properties.map((property) => [property.id, property.name])
  );

  const sorted = data.transactions
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const expenseRows = sorted
    .filter((transaction) => transaction.type === "expense")
    .map((transaction) => transactionRow(transaction, propertyLookup))
    .join("");

  const incomeRows = sorted
    .filter((transaction) => transaction.type === "income")
    .map((transaction) => transactionRow(transaction, propertyLookup))
    .join("");

  ui.expenseList.innerHTML = buildTransactionTable(expenseRows);
  ui.incomeList.innerHTML = buildTransactionTable(incomeRows);

  [ui.expenseList, ui.incomeList].forEach((list) => {
    list.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        const transactionId = button.dataset.id;
        const transaction = data.transactions.find((item) => item.id === transactionId);
        if (!transaction) return;
        if (action === "edit") {
          if (transaction.type === "expense") {
            setView("expenseView");
            ui.expenseId.value = transaction.id;
            ui.expenseProperty.value = transaction.propertyId;
            ui.expenseCategory.value = transaction.category;
            ui.expenseAmount.value = transaction.amount;
            ui.expenseDate.value = transaction.date;
            ui.expenseNotes.value = transaction.notes || "";
          } else {
            setView("incomeView");
            ui.incomeId.value = transaction.id;
            ui.incomeProperty.value = transaction.propertyId;
            ui.incomeCategory.value = transaction.category;
            ui.incomeAmount.value = transaction.amount;
            ui.incomeDate.value = transaction.date;
            ui.incomeNotes.value = transaction.notes || "";
          }
          return;
        }
        if (action === "delete") {
          data.transactions = data.transactions.filter((item) => item.id !== transactionId);
          saveData(data);
          refreshApp(data, user);
        }
      });
    });
  });
};

const transactionRow = (transaction, propertyLookup) => `
  <tr>
    <td>${formatDate(transaction.date)}</td>
    <td>${propertyLookup.get(transaction.propertyId) || "-"}</td>
    <td>${transaction.category}</td>
    <td>${formatCurrency(transaction.amount)}</td>
    <td>${transaction.notes || "-"}</td>
    <td class="audit">
      Criado por ${transaction.createdBy}
      ${transaction.updatedBy ? `<br/>Atualizado por ${transaction.updatedBy}` : ""}
    </td>
    <td>
      <button class="ghost" data-action="edit" data-id="${transaction.id}">Editar</button>
      <button class="danger" data-action="delete" data-id="${transaction.id}">Remover</button>
    </td>
  </tr>
`;

const buildTransactionTable = (rows) => {
  if (!rows || rows.trim() === "") {
    return "<p class=\"hint\">Sem movimentos neste tipo.</p>";
  }
  return `
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Imóvel</th>
          <th>Categoria</th>
          <th>Valor</th>
          <th>Notas</th>
          <th>Auditoria</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

const renderSummary = (data) => {
  const selectedYear = Number(ui.filterYear.value) || currentYear();
  const selectedMonth = ui.filterMonth.value === "" ? null : Number(ui.filterMonth.value);

  const filterByDate = (transaction) => {
    const date = new Date(transaction.date);
    if (Number.isNaN(date.getTime())) return false;
    if (date.getFullYear() !== selectedYear) return false;
    if (selectedMonth === null) return true;
    return date.getMonth() === selectedMonth;
  };

  const filtered = data.transactions.filter(filterByDate);

  const totals = {
    income: 0,
    expense: 0,
  };

  const byProperty = data.properties.map((property) => {
    const propertyTransactions = filtered.filter(
      (transaction) => transaction.propertyId === property.id
    );
    const sum = propertyTransactions.reduce(
      (acc, transaction) => {
        acc[transaction.type] += Number(transaction.amount || 0);
        return acc;
      },
      { income: 0, expense: 0 }
    );
    totals.income += sum.income;
    totals.expense += sum.expense;
    return {
      property,
      ...sum,
      result: sum.income - sum.expense,
    };
  });

  const periodLabel = selectedMonth === null
    ? `Resultados anuais ${selectedYear}`
    : `Resultados de ${new Date(selectedYear, selectedMonth).toLocaleString("pt-PT", {
        month: "long",
      })} ${selectedYear}`;

  ui.summaryTable.innerHTML = `
    <p class="hint">${periodLabel}</p>
    <table>
      <thead>
        <tr>
          <th>Imóvel</th>
          <th>Receitas</th>
          <th>Despesas</th>
          <th>Resultado</th>
        </tr>
      </thead>
      <tbody>
        ${byProperty
          .map(
            (item) => `
          <tr>
            <td>${item.property.name}</td>
            <td>${formatCurrency(item.income)}</td>
            <td>${formatCurrency(item.expense)}</td>
            <td>${formatCurrency(item.result)}</td>
          </tr>
        `
          )
          .join("")}
        <tr>
          <th>Total</th>
          <th>${formatCurrency(totals.income)}</th>
          <th>${formatCurrency(totals.expense)}</th>
          <th>${formatCurrency(totals.income - totals.expense)}</th>
        </tr>
      </tbody>
    </table>
  `;
};

const renderUsers = (data, session) => {
  if (!session || session.role !== "admin") {
    ui.adminSection.hidden = true;
    return;
  }
  ui.adminSection.hidden = false;

  ui.userList.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Email</th>
          <th>Papel</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${data.users
          .map(
            (user) => `
          <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>
              ${
                user.id === session.id
                  ? "Sessão ativa"
                  : `<button class="danger" data-id="${user.id}">Remover</button>`
              }
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  ui.userList.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      const userId = button.dataset.id;
      data.users = data.users.filter((item) => item.id !== userId);
      saveData(data);
      refreshApp(data, session);
    });
  });
};

const refreshApp = (data, session) => {
  renderProperties(data, session);
  renderTransactions(data, session);
  renderSummary(data);
  renderUsers(data, session);
};

const init = () => {
  const data = loadData();
  const session = loadSession();
  activeSession = session;

  ui.filterYear.value = currentYear();
  renderCategoryOptions();
  wireNavigation();

  if (session) {
    ui.loginCard.hidden = true;
    ui.appView.hidden = false;
    setSessionSummary(session);
    refreshApp(data, session);
    setView("menuView");
  } else {
    ui.loginCard.hidden = false;
    ui.appView.hidden = true;
    setSessionSummary(null);
  }

  ui.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = ui.loginEmail.value.trim();
    const password = ui.loginPassword.value.trim();
    const found = data.users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password
    );

    if (!found) {
      alert("Credenciais inválidas.");
      return;
    }
    saveSession(found);
    location.reload();
  });

  ui.propertyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const sessionData = loadSession();
    if (!sessionData) return;
    const name = ui.propertyName.value.trim();
    const address = ui.propertyAddress.value.trim();
    if (!name || !address) return;

    const id = ui.propertyId.value;
    if (id) {
      const property = data.properties.find((item) => item.id === id);
      if (!property) return;
      property.name = name;
      property.address = address;
    } else {
      data.properties.push({
        id: createId(),
        name,
        address,
      });
    }
    saveData(data);
    ui.propertyForm.reset();
    refreshApp(data, sessionData);
  });

  ui.propertyReset.addEventListener("click", () => {
    ui.propertyForm.reset();
    ui.propertyId.value = "";
  });

  ui.expenseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const sessionData = loadSession();
    if (!sessionData) return;
    const id = ui.expenseId.value;
    const payload = {
      propertyId: ui.expenseProperty.value,
      type: "expense",
      category: ui.expenseCategory.value,
      amount: Number(ui.expenseAmount.value),
      date: ui.expenseDate.value,
      notes: ui.expenseNotes.value.trim(),
    };

    if (id) {
      const transaction = data.transactions.find((item) => item.id === id);
      if (!transaction) return;
      Object.assign(transaction, payload, { updatedBy: sessionData.name });
    } else {
      data.transactions.push({
        id: createId(),
        ...payload,
        createdBy: sessionData.name,
        updatedBy: "",
      });
    }

    saveData(data);
    ui.expenseForm.reset();
    ui.expenseId.value = "";
    ui.expenseDate.value = new Date().toISOString().split("T")[0];
    refreshApp(data, sessionData);
  });

  ui.expenseReset.addEventListener("click", () => {
    ui.expenseForm.reset();
    ui.expenseId.value = "";
    ui.expenseDate.value = new Date().toISOString().split("T")[0];
  });

  ui.incomeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const sessionData = loadSession();
    if (!sessionData) return;
    const id = ui.incomeId.value;
    const payload = {
      propertyId: ui.incomeProperty.value,
      type: "income",
      category: ui.incomeCategory.value,
      amount: Number(ui.incomeAmount.value),
      date: ui.incomeDate.value,
      notes: ui.incomeNotes.value.trim(),
    };

    if (id) {
      const transaction = data.transactions.find((item) => item.id === id);
      if (!transaction) return;
      Object.assign(transaction, payload, { updatedBy: sessionData.name });
    } else {
      data.transactions.push({
        id: createId(),
        ...payload,
        createdBy: sessionData.name,
        updatedBy: "",
      });
    }

    saveData(data);
    ui.incomeForm.reset();
    ui.incomeId.value = "";
    ui.incomeDate.value = new Date().toISOString().split("T")[0];
    refreshApp(data, sessionData);
  });

  ui.incomeReset.addEventListener("click", () => {
    ui.incomeForm.reset();
    ui.incomeId.value = "";
    ui.incomeDate.value = new Date().toISOString().split("T")[0];
  });

  ui.filterYear.addEventListener("input", () => renderSummary(data));
  ui.filterMonth.addEventListener("change", () => renderSummary(data));

  ui.filterReset.addEventListener("click", () => {
    ui.filterYear.value = currentYear();
    ui.filterMonth.value = "";
    renderSummary(data);
  });

  ui.userForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const sessionData = loadSession();
    if (!sessionData || sessionData.role !== "admin") return;
    const name = ui.userName.value.trim();
    const email = ui.userEmail.value.trim();
    const password = ui.userPassword.value.trim();
    const role = ui.userRole.value;

    if (!name || !email || !password) return;
    const exists = data.users.some((user) => user.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      alert("Já existe um utilizador com este email.");
      return;
    }

    data.users.push({
      id: createId(),
      name,
      email,
      password,
      role,
    });
    saveData(data);
    ui.userForm.reset();
    refreshApp(data, sessionData);
  });

  const today = new Date().toISOString().split("T")[0];
  ui.expenseDate.value = today;
  ui.incomeDate.value = today;
};

init();

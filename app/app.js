const STORAGE_KEY = "arrendamento_data";
const SESSION_KEY = "arrendamento_session";

const CATEGORY_OPTIONS = {
  income: ["Renda", "Caução", "Outras receitas"],
  expense: [
    "Condomínio",
    "IMI",
    "Gestão de Arrendamento",
    "Reparações",
    "Devolução de caução",
    "Outras despesas",
  ],
};

const ui = {
  loginForm: document.getElementById("loginForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  appView: document.getElementById("appView"),
  sessionSummary: document.getElementById("sessionSummary"),
  menuView: document.getElementById("menuView"),
  usersView: document.getElementById("usersView"),
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
  summaryYear: document.getElementById("summaryYear"),
  summaryProperties: document.getElementById("summaryProperties"),
  summaryReset: document.getElementById("summaryReset"),
  summaryTable: document.getElementById("summaryTable"),
  adminTools: document.getElementById("adminTools"),
  profileTools: document.getElementById("profileTools"),
  userForm: document.getElementById("userForm"),
  userId: document.getElementById("userId"),
  userName: document.getElementById("userName"),
  userEmail: document.getElementById("userEmail"),
  userPassword: document.getElementById("userPassword"),
  userRole: document.getElementById("userRole"),
  userList: document.getElementById("userList"),
  userReset: document.getElementById("userReset"),
  profileSummary: document.getElementById("profileSummary"),
  passwordForm: document.getElementById("passwordForm"),
  profilePassword: document.getElementById("profilePassword"),
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
  if (!ui.sessionSummary) return;
  if (!user) {
    ui.sessionSummary.innerHTML = "";
    return;
  }
  const userButtonLabel = user.role === "admin" ? "Gerir utilizadores" : "Minha conta";
  ui.sessionSummary.innerHTML = `
    <p><strong>${user.name}</strong></p>
    <p class="hint">${user.email}</p>
    <span class="badge">${user.role === "admin" ? "Administrador" : "Utilizador"}</span>
    <div class="row" style="margin-top:12px;">
      <button class="ghost" id="userMenuButton">${userButtonLabel}</button>
      <button class="ghost" id="logoutButton">Sair</button>
    </div>
  `;
  document.getElementById("userMenuButton").addEventListener("click", () => {
    setView("usersView");
  });
  document.getElementById("logoutButton").addEventListener("click", () => {
    clearSession();
    location.href = "../login/";
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
    ui.usersView,
  ];
  views.forEach((view) => {
    if (view) {
      view.hidden = view.id !== viewId;
    }
  });
  if (ui.usersView) {
    if (viewId === "usersView") {
      if (activeSession && activeSession.role === "admin") {
        ui.adminTools.hidden = false;
        ui.profileTools.hidden = true;
      } else {
        ui.adminTools.hidden = true;
        ui.profileTools.hidden = false;
      }
    }
  }
};

const wireNavigation = () => {
  if (!ui.menuView) return;
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
  if (ui.expenseProperty) {
    ui.expenseProperty.innerHTML = options;
  }
  if (ui.incomeProperty) {
    ui.incomeProperty.innerHTML = options;
  }
  if (ui.summaryProperties) {
    const allOption = `<option value="all">Todos os imóveis</option>`;
    ui.summaryProperties.innerHTML = allOption + options;
    if (!Array.from(ui.summaryProperties.options).some((option) => option.selected)) {
      ui.summaryProperties.options[0].selected = true;
    }
  }
};

const renderCategoryOptions = () => {
  if (ui.expenseCategory) {
    ui.expenseCategory.innerHTML = CATEGORY_OPTIONS.expense
      .map((category) => `<option value="${category}">${category}</option>`)
      .join("");
  }
  if (ui.incomeCategory) {
    ui.incomeCategory.innerHTML = CATEGORY_OPTIONS.income
      .map((category) => `<option value="${category}">${category}</option>`)
      .join("");
  }
};

const renderProperties = (data, user) => {
  if (!ui.propertyList) return;
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
  if (!ui.expenseList || !ui.incomeList) return;
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

const SUMMARY_MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const INCOME_ROWS = [
  { label: "Rendas", categories: ["Renda"] },
  { label: "Caução", categories: ["Caução"] },
  { label: "Outras receitas", categories: ["Outras receitas"] },
];

const EXPENSE_ROWS = [
  { label: "Condomínio", categories: ["Condomínio"] },
  { label: "IMI", categories: ["IMI"] },
  { label: "Gestão de Arrendamento", categories: ["Gestão de Arrendamento"] },
  { label: "Reparações", categories: ["Reparações"] },
  { label: "Devolução de caução", categories: ["Devolução de caução"] },
  { label: "Outras despesas", categories: ["Outras despesas"] },
];

const getSelectedPropertyIds = (data) => {
  if (!ui.summaryProperties) {
    return data.properties.map((property) => property.id);
  }
  const selected = Array.from(ui.summaryProperties.options)
    .filter((option) => option.selected)
    .map((option) => option.value);
  if (selected.length === 0 || selected.includes("all")) {
    return data.properties.map((property) => property.id);
  }
  return selected;
};

const buildSummaryRow = (label, values, rowClass = "") => {
  const total = values.reduce((sum, value) => sum + value, 0);
  return `
    <tr class="${rowClass}">
      <th>${label}</th>
      ${values.map((value) => `<td>${formatCurrency(value)}</td>`).join("")}
      <th>${formatCurrency(total)}</th>
    </tr>
  `;
};

const renderSummary = (data) => {
  if (!ui.summaryTable || !ui.summaryYear) return;
  const selectedYear = Number(ui.summaryYear.value) || currentYear();
  const selectedPropertyIds = getSelectedPropertyIds(data);
  const selectedPropertyNames = data.properties
    .filter((property) => selectedPropertyIds.includes(property.id))
    .map((property) => property.name);
  const propertyLabel =
    data.properties.length === 0
      ? "Sem imóveis"
      : selectedPropertyNames.length === data.properties.length
      ? "Todos os imóveis"
      : selectedPropertyNames.join(", ");

  const filtered = data.transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    if (Number.isNaN(date.getTime())) return false;
    if (date.getFullYear() !== selectedYear) return false;
    return selectedPropertyIds.includes(transaction.propertyId);
  });

  const buildValues = (rows, type) =>
    rows.map((row) => {
      const monthly = Array.from({ length: 12 }, () => 0);
      filtered
        .filter((transaction) => transaction.type === type)
        .forEach((transaction) => {
          if (!row.categories.includes(transaction.category)) return;
          const month = new Date(transaction.date).getMonth();
          monthly[month] += Number(transaction.amount || 0);
        });
      return { label: row.label, monthly };
    });

  const incomeData = buildValues(INCOME_ROWS, "income");
  const expenseData = buildValues(EXPENSE_ROWS, "expense");

  const incomeTotals = Array.from({ length: 12 }, () => 0);
  const expenseTotals = Array.from({ length: 12 }, () => 0);

  incomeData.forEach((row) => {
    row.monthly.forEach((value, index) => {
      incomeTotals[index] += value;
    });
  });

  expenseData.forEach((row) => {
    row.monthly.forEach((value, index) => {
      expenseTotals[index] += value;
    });
  });

  const resultTotals = incomeTotals.map((value, index) => value - expenseTotals[index]);

  const resultClass = (value) =>
    value >= 0 ? "result-positive" : "result-negative";

  ui.summaryTable.innerHTML = `
    <p class="hint">${propertyLabel} — ${selectedYear}</p>
    <table class="summary-table">
      <thead>
        <tr>
          <th></th>
          ${SUMMARY_MONTHS.map((month) => `<th>${month}</th>`).join("")}
          <th>Total</th>
        </tr>
        <tr class="summary-section income-section">
          <th colspan="14">Receitas</th>
        </tr>
      </thead>
      <tbody>
        ${incomeData
          .map((row) => buildSummaryRow(row.label, row.monthly, "income-row"))
          .join("")}
        ${buildSummaryRow("Total Receitas", incomeTotals, "income-total")}
      </tbody>
      <thead>
        <tr class="summary-section expense-section">
          <th colspan="14">Despesas</th>
        </tr>
      </thead>
      <tbody>
        ${expenseData
          .map((row) => buildSummaryRow(row.label, row.monthly, "expense-row"))
          .join("")}
        ${buildSummaryRow("Total Despesas", expenseTotals, "expense-total")}
      </tbody>
      <tfoot>
        <tr class="summary-section result-row">
          <th>Resultado</th>
          ${resultTotals
            .map(
              (value) =>
                `<th class="${resultClass(value)}">${formatCurrency(value)}</th>`
            )
            .join("")}
          <th class="${resultClass(resultTotals.reduce((a, b) => a + b, 0))}">
            ${formatCurrency(resultTotals.reduce((a, b) => a + b, 0))}
          </th>
        </tr>
      </tfoot>
    </table>
  `;
};

const renderUsers = (data, session) => {
  if (!ui.usersView) return;
  if (!session) return;

  if (session.role === "admin") {
    if (!ui.userList) return;
    ui.adminTools.hidden = false;
    ui.profileTools.hidden = true;
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
                <button class="ghost" data-action="edit" data-id="${user.id}">Editar</button>
                ${
                  user.id === session.id
                    ? "Sessão ativa"
                    : `<button class="danger" data-action="delete" data-id="${user.id}">Remover</button>`
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
        const action = button.dataset.action;
        const userId = button.dataset.id;
        const target = data.users.find((item) => item.id === userId);
        if (!target) return;
        if (action === "edit") {
          ui.userId.value = target.id;
          ui.userName.value = target.name;
          ui.userEmail.value = target.email;
          ui.userRole.value = target.role;
          ui.userPassword.value = "";
          return;
        }
        if (action === "delete") {
          data.users = data.users.filter((item) => item.id !== userId);
          saveData(data);
          refreshApp(data, session);
        }
      });
    });
  } else {
    ui.adminTools.hidden = true;
    ui.profileTools.hidden = false;
    const currentUser = data.users.find((user) => user.id === session.id);
    if (!currentUser) return;
    if (ui.profileSummary) {
      ui.profileSummary.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Papel</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${currentUser.name}</td>
              <td>${currentUser.email}</td>
              <td>${currentUser.role}</td>
            </tr>
          </tbody>
        </table>
      `;
    }
  }
};

const refreshApp = (data, session) => {
  renderProperties(data, session);
  renderTransactions(data, session);
  renderSummary(data);
  renderUsers(data, session);
};

const setupLoginPage = (data, session) => {
  if (!ui.loginForm) return;
  if (session) {
    location.href = "../main/";
    return;
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
    location.href = "../main/";
  });
};

const setupMainPage = (data, session) => {
  if (!ui.appView) return;
  if (!session) {
    location.href = "../login/";
    return;
  }

  activeSession = session;
  setSessionSummary(session);
  renderCategoryOptions();
  wireNavigation();
  refreshApp(data, session);
  setView("menuView");

  if (ui.summaryYear) {
    ui.summaryYear.value = currentYear();
  }

  if (ui.propertyForm) {
    ui.propertyForm.addEventListener("submit", (event) => {
      event.preventDefault();
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
      refreshApp(data, session);
    });
  }

  if (ui.propertyReset) {
    ui.propertyReset.addEventListener("click", () => {
      ui.propertyForm.reset();
      ui.propertyId.value = "";
    });
  }

  if (ui.expenseForm) {
    ui.expenseForm.addEventListener("submit", (event) => {
      event.preventDefault();
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
        Object.assign(transaction, payload, { updatedBy: session.name });
      } else {
        data.transactions.push({
          id: createId(),
          ...payload,
          createdBy: session.name,
          updatedBy: "",
        });
      }

      saveData(data);
      ui.expenseForm.reset();
      ui.expenseId.value = "";
      ui.expenseDate.value = new Date().toISOString().split("T")[0];
      refreshApp(data, session);
    });
  }

  if (ui.expenseReset) {
    ui.expenseReset.addEventListener("click", () => {
      ui.expenseForm.reset();
      ui.expenseId.value = "";
      ui.expenseDate.value = new Date().toISOString().split("T")[0];
    });
  }

  if (ui.incomeForm) {
    ui.incomeForm.addEventListener("submit", (event) => {
      event.preventDefault();
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
        Object.assign(transaction, payload, { updatedBy: session.name });
      } else {
        data.transactions.push({
          id: createId(),
          ...payload,
          createdBy: session.name,
          updatedBy: "",
        });
      }

      saveData(data);
      ui.incomeForm.reset();
      ui.incomeId.value = "";
      ui.incomeDate.value = new Date().toISOString().split("T")[0];
      refreshApp(data, session);
    });
  }

  if (ui.incomeReset) {
    ui.incomeReset.addEventListener("click", () => {
      ui.incomeForm.reset();
      ui.incomeId.value = "";
      ui.incomeDate.value = new Date().toISOString().split("T")[0];
    });
  }

  if (ui.summaryYear) {
    ui.summaryYear.addEventListener("input", () => renderSummary(data));
  }
  if (ui.summaryProperties) {
    ui.summaryProperties.addEventListener("change", () => renderSummary(data));
  }
  if (ui.summaryReset) {
    ui.summaryReset.addEventListener("click", () => {
      ui.summaryYear.value = currentYear();
      if (ui.summaryProperties) {
        Array.from(ui.summaryProperties.options).forEach((option) => {
          option.selected = option.value === "all";
        });
      }
      renderSummary(data);
    });
  }

  if (ui.userForm) {
    ui.userForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (session.role !== "admin") return;
      const name = ui.userName.value.trim();
      const email = ui.userEmail.value.trim();
      const password = ui.userPassword.value.trim();
      const role = ui.userRole.value;

      if (!name || !email) return;
      const id = ui.userId.value;
      const emailExists = data.users.some(
        (user) => user.email.toLowerCase() === email.toLowerCase() && user.id !== id
      );
      if (emailExists) {
        alert("Já existe um utilizador com este email.");
        return;
      }

      if (id) {
        const existing = data.users.find((user) => user.id === id);
        if (!existing) return;
        existing.name = name;
        existing.email = email;
        existing.role = role;
        if (password) {
          existing.password = password;
        }
      } else {
        if (!password) {
          alert("Indique uma palavra-passe para o novo utilizador.");
          return;
        }
        data.users.push({
          id: createId(),
          name,
          email,
          password,
          role,
        });
      }
      saveData(data);
      ui.userForm.reset();
      ui.userId.value = "";
      refreshApp(data, session);
      setView("menuView");
    });
  }

  if (ui.userReset) {
    ui.userReset.addEventListener("click", () => {
      ui.userForm.reset();
      ui.userId.value = "";
    });
  }

  if (ui.passwordForm) {
    ui.passwordForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (session.role === "admin") return;
      const newPassword = ui.profilePassword.value.trim();
      if (!newPassword) return;
      const currentUser = data.users.find((user) => user.id === session.id);
      if (!currentUser) return;
      currentUser.password = newPassword;
      saveData(data);
      ui.passwordForm.reset();
      alert("Palavra-passe atualizada com sucesso.");
    });
  }

  const today = new Date().toISOString().split("T")[0];
  if (ui.expenseDate) ui.expenseDate.value = today;
  if (ui.incomeDate) ui.incomeDate.value = today;
};

const init = () => {
  const data = loadData();
  const session = loadSession();
  setupLoginPage(data, session);
  setupMainPage(data, session);
};

init();

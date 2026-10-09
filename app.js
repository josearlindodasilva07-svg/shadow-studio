/* ==========================================
   SHADOW STUDIO — APP.JS
========================================== */

"use strict";

const $ = id => document.getElementById(id);

const state = {
  selected: 3,
  nextId: 4,
  lightTheme: false,
  nodes: [
    {
      id: 1,
      type: "ScreenGui",
      name: "MinhaInterface",
      parent: null,
      x: 0, y: 0, w: 100, h: 100,
      bg: "#0b0c10",
      text: "",
      textColor: "#ffffff",
      fontSize: 14,
      visible: true,
      z: 0
    },
    {
      id: 2,
      type: "Frame",
      name: "MainFrame",
      parent: 1,
      x: 12, y: 15, w: 76, h: 38,
      bg: "#20232b",
      text: "",
      textColor: "#ffffff",
      fontSize: 14,
      visible: true,
      z: 1
    },
    {
      id: 3,
      type: "TextLabel",
      name: "Title",
      parent: 1,
      x: 20, y: 19, w: 60, h: 9,
      bg: "#20232b",
      text: "SHADOW HUB",
      textColor: "#ffffff",
      fontSize: 20,
      visible: true,
      z: 2
    }
  ]
};

const getNode = id => state.nodes.find(n => n.id === id);

const children = id => state.nodes
  .filter(n => n.parent === id)
  .sort((a, b) => a.z - b.z);

const clamp = (n, min, max) =>
  Math.max(min, Math.min(max, n));

function status(message) {
  $("status").textContent = message;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function selectNode(id) {
  state.selected = id;
  renderTree();
  renderProperties();
  renderStage();
}

function renderTree() {
  const tree = $("tree");
  tree.replaceChildren();

  function addRow(node, depth) {
    const row = document.createElement("div");

    row.className = "tree-item" +
      (node.id === state.selected ? " active" : "");

    row.style.paddingLeft = `${5 + depth * 9}px`;

    const name = document.createElement("div");
    name.textContent = node.name;

    const type = document.createElement("span");
    type.className = "type";
    type.textContent = node.type;

    row.append(name, type);
    row.onclick = () => selectNode(node.id);

    tree.appendChild(row);

    children(node.id).forEach(child => addRow(child, depth + 1));
  }

  addRow(getNode(1), 0);
}

function renderStage() {
  const stage = $("stage");

  stage.querySelectorAll(".element").forEach(el => el.remove());

  function draw(node) {
    if (node.id !== 1) {
      const el = document.createElement("div");

      el.className = "element" +
        (node.id === state.selected ? " selected" : "");

      Object.assign(el.style, {
        left: `${node.x}%`,
        top: `${node.y}%`,
        width: `${node.w}%`,
        height: `${node.h}%`,
        background: node.bg,
        color: node.textColor,
        fontSize: `${node.fontSize}px`,
        zIndex: node.z,
        display: node.visible ? "flex" : "none",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center"
      });

      el.textContent = node.text || "";

      if (node.type === "TextButton" ||
          node.type === "ImageButton") {
        el.style.border = "1px solid #ffffff55";
        el.style.borderRadius = "5px";
      }

      const handle = document.createElement("div");
      handle.className = "resize";
      el.appendChild(handle);

      stage.appendChild(el);

      el.addEventListener("pointerdown", event => {
        if (event.target === handle) return;

        event.stopPropagation();
        selectNode(node.id);

        const rect = stage.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;
        const oldX = node.x;
        const oldY = node.y;

        function move(ev) {
          node.x = clamp(
            oldX + (ev.clientX - startX) / rect.width * 100,
            0,
            100 - node.w
          );

          node.y = clamp(
            oldY + (ev.clientY - startY) / rect.height * 100,
            0,
            100 - node.h
          );

          el.style.left = `${node.x}%`;
          el.style.top = `${node.y}%`;
        }

        function end() {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", end);
          window.removeEventListener("pointercancel", end);
          renderProperties();
        }

        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", end);
        window.addEventListener("pointercancel", end);
      });

      handle.addEventListener("pointerdown", event => {
        event.stopPropagation();

        const rect = stage.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;
        const oldW = node.w;
        const oldH = node.h;

        function move(ev) {
          node.w = clamp(
            oldW + (ev.clientX - startX) / rect.width * 100,
            3,
            100 - node.x
          );

          node.h = clamp(
            oldH + (ev.clientY - startY) / rect.height * 100,
            3,
            100 - node.y
          );

          el.style.width = `${node.w}%`;
          el.style.height = `${node.h}%`;
        }

        function end() {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", end);
          window.removeEventListener("pointercancel", end);
          renderProperties();
        }

        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", end);
        window.addEventListener("pointercancel", end);
      });
    }

    children(node.id).forEach(draw);
  }

  draw(getNode(1));

  stage.onclick = event => {
    if (event.target === stage) selectNode(1);
  };
}

function field(label, key, value, type = "text") {
  return `
    <div class="field">
      <label>${label}</label>
      <input
        data-key="${key}"
        type="${type}"
        value="${escapeHTML(value)}"
      >
    </div>
  `;
}

function renderProperties() {
  const node = getNode(state.selected);

  if (!node) return;

  if (node.id === 1) {
    $("props").innerHTML = `
      <div class="section">PROJETO</div>
      ${field("Nome da GUI", "name", node.name)}
      <p class="hint">
        Selecione um elemento no Explorer para editar suas propriedades.
      </p>
    `;

    bindProperties(node);
    return;
  }

  $("props").innerHTML = `
    <div class="section">GERAL</div>

    ${field("Nome", "name", node.name)}

    <div class="field">
      <label>Tipo</label>
      <select data-key="type">
        ${[
          "Frame",
          "TextLabel",
          "TextButton",
          "TextBox",
          "ImageLabel",
          "ImageButton",
          "ScrollingFrame"
        ].map(type => `
          <option ${node.type === type ? "selected" : ""}>
            ${type}
          </option>
        `).join("")}
      </select>
    </div>

    <div class="section">POSIÇÃO E TAMANHO</div>

    <div class="grid">
      ${field("X (%)", "x", node.x, "number")}
      ${field("Y (%)", "y", node.y, "number")}
      ${field("Largura (%)", "w", node.w, "number")}
      ${field("Altura (%)", "h", node.h, "number")}
    </div>

    <div class="section">APARÊNCIA</div>

    ${field("Texto", "text", node.text)}

    <div class="grid">
      ${field("Cor de fundo", "bg", node.bg, "color")}
      ${field("Cor do texto", "textColor", node.textColor, "color")}
    </div>

    <div class="grid">
      ${field("Tamanho do texto", "fontSize", node.fontSize, "number")}
      ${field("Ordem Z", "z", node.z, "number")}
    </div>

    <div class="field">
      <label>
        <input
          type="checkbox"
          data-key="visible"
          ${node.visible ? "checked" : ""}
          style="width:auto"
        >
        Visível
      </label>
    </div>
  `;

  bindProperties(node);
}

function bindProperties(node) {
  $("props").querySelectorAll("[data-key]").forEach(input => {
    input.addEventListener("change", () => {
      const key = input.dataset.key;
      let value;

      if (input.type === "checkbox") {
        value = input.checked;
      } else if (input.type === "number") {
        value = Number(input.value);
      } else {
        value = input.value;
      }

      if (["x", "y", "w", "h"].includes(key)) {
        value = clamp(value, 0, 100);
      }

      if (key === "w") value = Math.max(3, value);
      if (key === "h") value = Math.max(3, value);
      if (key === "fontSize") value = clamp(value, 1, 100);
      if (key === "z") value = clamp(value, 0, 10000);

      node[key] = value;

      renderTree();
      renderStage();
      status("Propriedade atualizada");
    });
  });
}

function addElement(type = "Frame") {
  let parent = getNode(state.selected) || getNode(1);

  if (!["ScreenGui", "Frame", "ScrollingFrame"].includes(parent.type)) {
    parent = getNode(1);
  }

  const id = state.nextId++;

  const node = {
    id,
    type,
    name: `${type}_${id}`,
    parent: parent.id,
    x: 20,
    y: 25,
    w: 40,
    h: 15,
    bg: "#30333d",
    text: type === "TextLabel" ? "Novo texto" :
          type === "TextButton" ? "Botão" : "",
    textColor: "#ffffff",
    fontSize: 16,
    visible: true,
    z: Math.max(0, ...state.nodes.map(n => n.z)) + 1
  };

  state.nodes.push(node);
  selectNode(id);
  status("Elemento adicionado");
}

function deleteSelected() {
  const node = getNode(state.selected);

  if (!node || node.id === 1) {
    status("Não é possível apagar a raiz da GUI");
    return;
  }

  const ids = new Set();

  function collect(id) {
    ids.add(id);
    children(id).forEach(child => collect(child.id));
  }

  collect(node.id);

  state.nodes = state.nodes.filter(n => !ids.has(n.id));

  selectNode(1);
  status("Elemento apagado");
}

function duplicateSelected() {
  const node = getNode(state.selected);

  if (!node || node.id === 1) {
    status("Selecione um elemento para duplicar");
    return;
  }

  const copy = {
    ...node,
    id: state.nextId++,
    name: `${node.name}_Copy`,
    x: clamp(node.x + 3, 0, 100 - node.w),
    y: clamp(node.y + 3, 0, 100 - node.h),
    z: Math.max(0, ...state.nodes.map(n => n.z)) + 1
  };

  state.nodes.push(copy);
  selectNode(copy.id);
  status("Elemento duplicado");
}

function luaString(value) {
  return JSON.stringify(String(value ?? ""));
}

function rgb(hex) {
  const h = String(hex || "#ffffff").replace("#", "");

  return [
    parseInt(h.slice(0, 2), 16) || 0,
    parseInt(h.slice(2, 4), 16) || 0,
    parseInt(h.slice(4, 6), 16) || 0
  ];
}

function exportLua() {
  const lines = [
    "-- Criado no Shadow Studio",
    "local Players = game:GetService('Players')",
    "local PlayerGui = Players.LocalPlayer:WaitForChild('PlayerGui')",
    "local ScreenGui = Instance.new('ScreenGui')",
    `ScreenGui.Name = ${luaString(getNode(1).name)}`,
    "ScreenGui.ResetOnSpawn = false",
    "ScreenGui.Parent = PlayerGui",
    ""
  ];

  function build(node, parentName) {
    const variable = `obj${node.id}`;

    lines.push(
      `local ${variable} = Instance.new(${luaString(node.type)})`,
      `${variable}.Name = ${luaString(node.name)}`
    );

    if (node.type.startsWith("Text")) {
      lines.push(
        `${variable}.Text = ${luaString(node.text)}`,
        `${variable}.TextColor3 = Color3.fromRGB(${rgb(node.textColor).join(", ")})`,
        `${variable}.TextSize = ${Math.round(node.fontSize)}`
      );
    }

    lines.push(
      `${variable}.BackgroundColor3 = Color3.fromRGB(${rgb(node.bg).join(", ")})`,
      `${variable}.Position = UDim2.new(${node.x / 100}, 0, ${node.y / 100}, 0)`,
      `${variable}.Size = UDim2.new(${node.w / 100}, 0, ${node.h / 100}, 0)`,
      `${variable}.Visible = ${node.visible}`,
      `${variable}.ZIndex = ${Math.max(1, node.z)}`,
      `${variable}.Parent = ${parentName}`,
      ""
    );

    children(node.id).forEach(child => build(child, variable));
  }

  children(1).forEach(node => build(node, "ScreenGui"));

  return lines.join("\n");
}

function saveProject() {
  try {
    localStorage.setItem(
      "shadowStudioProject",
      JSON.stringify({
        nodes: state.nodes,
        nextId: state.nextId
      })
    );

    status("Projeto salvo neste navegador");
  } catch {
    status("Não foi possível salvar o projeto");
  }
}

function loadProject() {
  try {
    const data = JSON.parse(
      localStorage.getItem("shadowStudioProject")
    );

    if (!data || !Array.isArray(data.nodes)) {
      throw new Error("Projeto não encontrado");
    }

    state.nodes = data.nodes;
    state.nextId = data.nextId || 4;

    selectNode(1);
    status("Projeto carregado");
  } catch {
    status("Nenhum projeto salvo neste navegador");
  }
}

function openEditor(title, content, mode) {
  state.modalMode = mode;

  $("modalTitle").textContent = title;
  $("codeArea").value = content;
  $("modal").classList.add("open");
}

function applyEditor() {
  if (state.modalMode !== "import") {
    status("Copie o código exportado para utilizá-lo no Roblox");
    return;
  }

  try {
    const data = JSON.parse($("codeArea").value);

    if (!Array.isArray(data.nodes)) {
      throw new Error("Formato de projeto inválido");
    }

    state.nodes = data.nodes;
    state.nextId = data.nextId || 4;

    selectNode(1);
    $("modal").classList.remove("open");
    status("Projeto importado");
  } catch {
    status("Importação falhou: use um projeto JSON válido");
  }
}

function toggleTheme() {
  state.lightTheme = !state.lightTheme;
  document.body.classList.toggle("light-theme", state.lightTheme);
}

function init() {
  $("addBtn").onclick = () => addElement();

  $("deleteBtn").onclick = deleteSelected;
  $("duplicateBtn").onclick = duplicateSelected;

  document.querySelectorAll("[data-add]").forEach(button => {
    button.addEventListener("click", () => {
      addElement(button.dataset.add);
    });
  });

  $("frontBtn").onclick = () => {
    const node = getNode(state.selected);

    if (!node || node.id === 1) return;

    node.z = Math.max(...state.nodes.map(n => n.z)) + 1;

    renderStage();
    renderProperties();
    status("Elemento trazido à frente");
  };

  $("saveBtn").onclick = saveProject;
  $("loadBtn").onclick = loadProject;
  $("themeBtn").onclick = toggleTheme;

  $("exportBtn").onclick = () => {
    openEditor("Exportar GUI para Lua", exportLua(), "export");
  };

  $("modifyBtn").onclick = () => {
    openEditor(
      "Modificar projeto JSON",
      JSON.stringify({
        nodes: state.nodes,
        nextId: state.nextId
      }, null, 2),
      "import"
    );
  };

  $("closeModal").onclick = () => {
    $("modal").classList.remove("open");
  };

  $("applyBtn").onclick = applyEditor;

  $("copyBtn").onclick = async () => {
    const area = $("codeArea");

    try {
      await navigator.clipboard.writeText(area.value);
      status("Código copiado");
    } catch {
      area.focus();
      area.select();
      status("Selecione o código e copie manualmente");
    }
  };

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      $("modal").classList.remove("open");
    }

    if (
      event.key === "Delete" &&
      !$("modal").classList.contains("open")
    ) {
      deleteSelected();
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "s"
    ) {
      event.preventDefault();
      saveProject();
    }
  });

  renderTree();
  selectNode(state.selected);
}

init();

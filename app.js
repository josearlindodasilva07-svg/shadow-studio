"use strict";

const $ = id => document.getElementById(id);

const canvas = $("canvas");
const explorer = $("explorer");

const state = {
  elements: [],
  selectedId: null,
  nextId: 1,
  zoom: 100
};

const defaults = {
  Frame: {
    width: 150,
    height: 80,
    color: "#7029d9",
    textColor: "#ffffff",
    text: "",
    radius: 8
  },
  TextLabel: {
    width: 160,
    height: 36,
    color: "#20202b",
    textColor: "#ffffff",
    text: "TextLabel",
    radius: 4
  },
  TextButton: {
    width: 140,
    height: 42,
    color: "#7029d9",
    textColor: "#ffffff",
    text: "Button",
    radius: 8
  },
  ImageLabel: {
    width: 120,
    height: 100,
    color: "#252532",
    textColor: "#ffffff",
    text: "",
    radius: 6
  }
};

const icons = {
  Frame: "F",
  TextLabel: "T",
  TextButton: "B",
  ImageLabel: "I"
};

function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.shadowToastTimer);
  window.shadowToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function color(value, fallback = "#7029d9") {
  return /^#[0-9a-fA-F]{6}$/.test(value)
    ? value
    : fallback;
}

function rgb(hex) {
  hex = color(hex);
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

function selected() {
  return state.elements.find(
    item => item.id === state.selectedId
  ) || null;
}

function addElement(type) {
  if (!defaults[type]) return;

  const d = defaults[type];
  const n = state.nextId++;

  const element = {
    id: "element_" + n,
    type,
    name: type + n,
    x: 15,
    y: 15,
    width: d.width,
    height: d.height,
    color: d.color,
    textColor: d.textColor,
    text: d.text,
    visible: true,
    transparency: 0,
    radius: d.radius
  };

  state.elements.push(element);
  state.selectedId = element.id;
  renderAll();
  notify(type + " adicionado");
}

document.querySelectorAll("[data-add]").forEach(button => {
  button.addEventListener("click", () => {
    addElement(button.dataset.add);
  });
});

function renderCanvas() {
  canvas.querySelectorAll(".gui-object").forEach(node => {
    node.remove();
  });

  $("canvasWelcome").hidden = state.elements.length > 0;

  state.elements.forEach(element => {
    const node = document.createElement("div");
    node.className = "gui-object";
    node.dataset.id = element.id;

    Object.assign(node.style, {
      position: "absolute",
      left: element.x + "px",
      top: element.y + "px",
      width: element.width + "px",
      height: element.height + "px",
      display: element.visible ? "flex" : "none",
      alignItems: "center",
      justifyContent: "center",
      boxSizing: "border-box",
      overflow: "visible",
      background: element.color,
      color: element.textColor,
      opacity: 1 - element.transparency / 100,
      borderRadius: element.radius + "px",
      border: element.id === state.selectedId
        ? "2px solid #c5a0ff"
        : "1px solid #ffffff24",
      boxShadow: element.id === state.selectedId
        ? "0 0 0 2px #8b45f766"
        : "none",
      fontSize: "12px",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
      cursor: "grab",
      userSelect: "none",
      touchAction: "none"
    });

    if (element.type === "ImageLabel") {
      node.style.background =
        "linear-gradient(135deg,#39244f,#191923)";
    }

    const label = document.createElement("span");
    label.textContent = element.text ||
      (element.type === "Frame" ? "" : element.name);

    label.style.pointerEvents = "none";
    label.style.overflowWrap = "anywhere";
    node.appendChild(label);

    node.addEventListener("pointerdown", event => {
      if (event.target.classList.contains("gui-resize-handle")) {
        return;
      }

      if (event.button === 2) return;

      event.preventDefault();
      state.selectedId = element.id;

      const startX = event.clientX;
      const startY = event.clientY;
      const originalX = element.x;
      const originalY = element.y;

      renderAll();

      function move(e) {
        element.x = Math.round(
          originalX + e.clientX - startX
        );
        element.y = Math.round(
          originalY + e.clientY - startY
        );

        renderCanvas();
        updateProperties();
        updateStatus();
      }

      function end() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
      }

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
    });

    if (element.id === state.selectedId) {
      const handle = document.createElement("div");
      handle.className = "gui-resize-handle";

      Object.assign(handle.style, {
        position: "absolute",
        right: "-5px",
        bottom: "-5px",
        width: "12px",
        height: "12px",
        background: "#8b45f7",
        border: "2px solid white",
        borderRadius: "3px",
        cursor: "nwse-resize",
        touchAction: "none"
      });

      handle.addEventListener("pointerdown", event => {
        event.preventDefault();
        event.stopPropagation();

        const sx = event.clientX;
        const sy = event.clientY;
        const sw = element.width;
        const sh = element.height;

        function resize(e) {
          element.width = clamp(
            Math.round(sw + e.clientX - sx), 10, 2000
          );
          element.height = clamp(
            Math.round(sh + e.clientY - sy), 10, 2000
          );

          renderCanvas();
          updateProperties();
        }

        function finish() {
          window.removeEventListener("pointermove", resize);
          window.removeEventListener("pointerup", finish);
          window.removeEventListener("pointercancel", finish);
        }

        window.addEventListener("pointermove", resize);
        window.addEventListener("pointerup", finish);
        window.addEventListener("pointercancel", finish);
      });

      node.appendChild(handle);
    }

    canvas.appendChild(node);
  });
}

function renderExplorer() {
  explorer.innerHTML = "";

  if (state.elements.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "Nenhum elemento";
    empty.style.padding = "12px";
    empty.style.color = "#999";
    explorer.appendChild(empty);
    return;
  }

  state.elements.forEach(element => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "explorer-item";
    item.textContent =
      (icons[element.type] || "?") + "  " + element.name;

    item.style.width = "100%";
    item.style.textAlign = "left";
    item.style.padding = "9px";
    item.style.marginBottom = "4px";
    item.style.border = "1px solid #ffffff14";
    item.style.borderRadius = "6px";
    item.style.background =
      element.id === state.selectedId ? "#45236d" : "#191922";
    item.style.color = "#fff";

    item.addEventListener("click", () => {
      state.selectedId = element.id;
      renderAll();
    });

    explorer.appendChild(item);
  });
}

function updateProperties() {
  const element = selected();

  const panel = $("properties");
  if (!panel) return;

  panel.querySelectorAll("[data-prop]").forEach(input => {
    const key = input.dataset.prop;

    input.disabled = !element;
    if (!element) {
      input.value = "";
      return;
    }

    if (key in element) {
      input.value = element[key];
    }
  });

  const nameInput = $("elementName");
  if (nameInput) {
    nameInput.disabled = !element;
    nameInput.value = element ? element.name : "";
  }
}

function updateStatus() {
  const status = $("status");
  if (status) {
    status.textContent = state.elements.length +
      " elemento(s) | Zoom " + state.zoom + "%";
  }
}

function renderAll() {
  renderCanvas();
  renderExplorer();
  updateProperties();
  updateStatus();
}

document.querySelectorAll("[data-prop]").forEach(input => {
  const update = () => {
    const element = selected();
    if (!element) return;

    const key = input.dataset.prop;
    if (!(key in element)) return;

    let value = input.value;

    if ([
      "x", "y", "width", "height",
      "transparency", "radius"
    ].includes(key)) {
      value = Number(value);

      if (!Number.isFinite(value)) return;

      if (key === "width" || key === "height") {
        value = clamp(value, 10, 2000);
      }

      if (key === "transparency" || key === "radius") {
        value = clamp(value, 0, 100);
      }

      if (key === "x" || key === "y") {
        value = clamp(value, -2000, 2000);
      }
    }

    if (key === "color" || key === "textColor") {
      value = color(value, element[key]);
    }

    element[key] = value;
    renderCanvas();
    renderExplorer();
    updateStatus();
  };

  input.addEventListener("input", update);
  input.addEventListener("change", update);
});

const nameInput = $("elementName");

if (nameInput) {
  nameInput.addEventListener("input", () => {
    const element = selected();
    if (!element) return;

    element.name = nameInput.value;
    renderExplorer();
  });
}

function deleteSelected() {
  if (!state.selectedId) {
    notify("Selecione um elemento primeiro");
    return;
  }

  state.elements = state.elements.filter(
    element => element.id !== state.selectedId
  );

  state.selectedId = null;
  renderAll();
  notify("Elemento removido");
}

function clearAll() {
  if (state.elements.length === 0) {
    notify("A tela já está vazia");
    return;
  }

  state.elements = [];
  state.selectedId = null;
  renderAll();
  notify("Tela limpa");
}

const deleteButton = $("deleteElement");
if (deleteButton) {
  deleteButton.addEventListener("click", deleteSelected);
}

const clearButton = $("clear");
if (clearButton) {
  clearButton.addEventListener("click", clearAll);
}

function alignSelected(position) {
  const element = selected();
  if (!element) {
    notify("Selecione um elemento");
    return;
  }

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (position === "left") element.x = 0;
  if (position === "top") element.y = 0;

  if (position === "center") {
    element.x = Math.round((width - element.width) / 2);
  }

  if (position === "middle") {
    element.y = Math.round((height - element.height) / 2);
  }

  if (position === "right") {
    element.x = width - element.width;
  }

  if (position === "bottom") {
    element.y = height - element.height;
  }

  renderAll();
}

document.querySelectorAll("[data-align]").forEach(button => {
  button.addEventListener("click", () => {
    alignSelected(button.dataset.align);
  });
});

function setZoom(value) {
  state.zoom = clamp(Number(value) || 100, 25, 200);

  const stage = $("canvasStage");
  if (stage) {
    stage.style.transform = "scale(" + state.zoom / 100 + ")";
    stage.style.transformOrigin = "top left";
  }

  updateStatus();

  const zoomLabel = $("zoomLabel");
  if (zoomLabel) {
    zoomLabel.textContent = state.zoom + "%";
  }
}

const zoomIn = $("zoomIn");
if (zoomIn) {
  zoomIn.addEventListener("click", () => {
    setZoom(state.zoom + 10);
  });
}

const zoomOut = $("zoomOut");
if (zoomOut) {
  zoomOut.addEventListener("click", () => {
    setZoom(state.zoom - 10);
  });
}

const zoomReset = $("zoomReset");
if (zoomReset) {
  zoomReset.addEventListener("click", () => {
    setZoom(100);
  });
}

function getProject() {
  return {
    app: "Shadow Studio",
    version: 1,
    elements: state.elements,
    nextId: state.nextId
  };
}

function saveProject() {
  try {
    localStorage.setItem(
      "shadowStudioProject",
      JSON.stringify(getProject())
    );
    notify("Projeto salvo neste celular");
  } catch (error) {
    notify("Não foi possível salvar o projeto");
  }
}

function loadProject(project) {
  if (!project || !Array.isArray(project.elements)) {
    notify("Arquivo de projeto inválido");
    return;
  }

  state.elements = project.elements
    .filter(element =>
      element &&
      typeof element.id === "string" &&
      defaults[element.type]
    )
    .map(element => {
      const base = defaults[element.type];

      return {
        ...base,
        ...element,
        name: String(element.name || element.type),
        x: Number(element.x) || 0,
        y: Number(element.y) || 0,
        width: clamp(Number(element.width) || base.width, 10, 2000),
        height: clamp(Number(element.height) || base.height, 10, 2000),
        color: color(element.color, base.color),
        textColor: color(element.textColor, base.textColor),
        text: String(element.text || ""),
        visible: element.visible !== false,
        transparency: clamp(Number(element.transparency) || 0, 0, 100),
        radius: clamp(Number(element.radius) || 0, 0, 100)
      };
    });

  state.nextId = Math.max(
    Number(project.nextId) || 1,
    state.elements.length + 1
  );

  state.selectedId = null;
  renderAll();
  notify("Projeto aberto");
}

function downloadText(filename, content) {
  const blob = new Blob([content], {
    type: "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportJSON() {
  downloadText(
    "shadow-studio.json",
    JSON.stringify(getProject(), null, 2)
  );
}

function exportLua() {
  const lines = [
    "-- Shadow Studio - Exportação Lua",
    "-- Copie este código para usar como referência no Roblox Studio.",
    "local Players = game:GetService('Players')",
    "local player = Players.LocalPlayer",
    "local playerGui = player:WaitForChild('PlayerGui')",
    "",
    "local screenGui = Instance.new('ScreenGui')",
    "screenGui.Name = 'ShadowStudioGui'",
    "screenGui.ResetOnSpawn = false",
    "screenGui.Parent = playerGui",
    ""
  ];

  state.elements.forEach((element, index) => {
    const variable = "element" + (index + 1);
    const className = element.type === "Frame"
      ? "Frame"
      : element.type === "TextLabel"
      ? "TextLabel"
      : element.type === "TextButton"
      ? "TextButton"
      : "ImageLabel";

    lines.push(
      "local " + variable + " = Instance.new('" + className + "')",
      variable + ".Name = " + JSON.stringify(element.name),
      variable + ".Position = UDim2.fromOffset(" +
        element.x + ", " + element.y + ")",
      variable + ".Size = UDim2.fromOffset(" +
        element.width + ", " + element.height + ")",
      variable + ".BackgroundColor3 = Color3.fromRGB(" +
        rgb(element.color).r + ", " +
        rgb(element.color).g + ", " +
        rgb(element.color).b + ")",
      variable + ".BackgroundTransparency = " +
        (element.transparency / 100),
      variable + ".Visible = " + String(element.visible),
      variable + ".Parent = screenGui",
      ""
    );

    if (className === "TextLabel" || className === "TextButton") {
      const textRgb = rgb(element.textColor);

      lines.push(
        variable + ".Text = " + JSON.stringify(element.text),
        variable + ".TextColor3 = Color3.fromRGB(" +
          textRgb.r + ", " + textRgb.g + ", " + textRgb.b + ")",
        ""
      );
    }

    if (className === "Frame" ||
        className === "TextLabel" ||
        className === "TextButton" ||
        className === "ImageLabel") {
      lines.push(
        "local corner" + (index + 1) + " = Instance.new('UICorner')",
        "corner" + (index + 1) + ".CornerRadius = UDim.new(0, " +
          element.radius + ")",
        "corner" + (index + 1) + ".Parent = " + variable,
        ""
      );
    }
  });

  downloadText("shadow-studio.lua", lines.join("\n"));
}

const saveButton = $("save");
if (saveButton) {
  saveButton.addEventListener("click", saveProject);
}

const exportButton = $("exportLua");
if (exportButton) {
  exportButton.addEventListener("click", exportLua);
}

const openButton = $("open");
if (openButton) {
  openButton.addEventListener("click", () => {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = ".json,application/json";

    picker.addEventListener("change", async () => {
      const file = picker.files && picker.files[0];
      if (!file) return;

      try {
        const project = JSON.parse(await file.text());
        loadProject(project);
      } catch (error) {
        notify("Não foi possível abrir esse arquivo");
      }
    });

    picker.click();
  });
}

try {
  const saved = localStorage.getItem("shadowStudioProject");

  if (saved) {
    loadProject(JSON.parse(saved));
  } else {
    renderAll();
  }
} catch (error) {
  renderAll();
}

setZoom(100);

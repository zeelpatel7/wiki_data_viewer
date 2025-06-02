const sheetConfigs = {
  "All Tests": { filters: ["Test/Survey:", "Version:", "Age:", "Type:", "Source", "Study"] },
  "ABC": { filters: ["Test/Survey:", "Version:", "Age:"] },
  "EHS": { filters: ["Test/Survey:", "Version:", "Age:"] },
  "HSIS": { filters: ["Test/Survey:", "Version:"] },
  "Perry": { filters: ["Test/Survey:", "Version:", "Age:"] },
  "HS FACES": { filters: ["Test/Survey:", "Version:"] },
  "NFP-M": { filters: ["Test/Survey:", "Version:", "Age:"] },
};

fetch("Wiki_AH.xlsx")
  .then(res => res.arrayBuffer())
  .then(ab => {
    const workbook = XLSX.read(ab, { type: "array", cellStyles: true });

    Object.entries(sheetConfigs).forEach(([sheetName, config]) => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;
      let data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (!data.length) return;

      const hyperlinkMap = {};
      Object.keys(sheet).forEach((cellAddr) => {
        const cell = sheet[cellAddr];
        if (cell && cell.l && cell.v === "⓪") {
          const colLetter = cellAddr.replace(/[0-9]/g, "");
          const rowNumber = cellAddr.replace(/[^0-9]/g, "");
          const key = `${rowNumber}-${colLetter}`;
          const link = cell.l.Target;
          if (link) {
            const fileMatch = decodeURIComponent(link).match(/fileName=([^&]+)/);
            if (fileMatch) {
              hyperlinkMap[key] = fileMatch[1];
            }
          }
        }
      });

      const columnsToKeep = Object.keys(data[0]).filter(col =>
        data.some(row => row[col] !== "" && row[col] !== null && row[col] !== undefined)
      );

      data = data.map((row, idx) => {
        const newRow = {};
        columnsToKeep.forEach(col => {
          let value = row[col];
          if (value === "⓪") {
            const colIndex = Object.keys(data[0]).indexOf(col);
            const colLetter = String.fromCharCode(65 + colIndex);
            const key = `${idx + 2}-${colLetter}`;
            const filename = hyperlinkMap[key];
            if (filename) {
              value = `<a href="./files/${filename}" target="_blank">📄</a>`;
            }
          }
          newRow[col] = value;
        });
        return newRow;
      });

      const container = document.createElement("div");
      container.className = `tab-pane fade${sheetName === "All Tests" ? " show active" : ""}`;
      container.id = sheetName.replace(/[^a-zA-Z0-9]/g, '_');

      const filterDiv = document.createElement("div");
      filterDiv.className = "filters-section d-flex flex-wrap gap-3 mb-3";
      const filterInputs = {};

      config.filters.forEach(filter => {
        if (filter === "Study") {
          const group = document.createElement("div");
          group.innerHTML = `<label class='form-label d-block'>Study</label>
            <div class='d-flex flex-wrap gap-2'>
              ${["ABC", "Perry", "HSIS", "NFP", "IHDP", "EHS"].map(s => `
                <div class='form-check'>
                  <input type='checkbox' class='form-check-input' id='${sheetName}_study_${s}' value='${s}'>
                  <label class='form-check-label' for='${sheetName}_study_${s}'>${s}</label>
                </div>
              `).join("")}
            </div>`;
          filterInputs["Study"] = () => {
            return ["ABC", "Perry", "HSIS", "NFP", "IHDP", "EHS"].filter(s =>
              document.getElementById(`${sheetName}_study_${s}`)?.checked
            );
          };
          filterDiv.appendChild(group);
        } else {
          const select = document.createElement("select");
          select.className = "form-select";
          select.innerHTML = `<option value=''>-- Show All --</option>` +
            [...new Set(data.map(row => row[filter]).filter(Boolean))]
              .map(val => `<option value="${val}">${val}</option>`).join("");
          const group = document.createElement("div");
          group.innerHTML = `<label class='form-label'>${filter.replace(":", "")}</label>`;
          group.appendChild(select);
          filterInputs[filter] = () => select.value;
          filterDiv.appendChild(group);

          select.addEventListener("change", () => applyFilters());
        }
      });

      container.appendChild(filterDiv);

      const tableWrapper = document.createElement("div");
      tableWrapper.className = "table-wrapper";
      tableWrapper.id = `${sheetName.replace(/[^a-zA-Z0-9]/g, '_')}_table_wrapper`;

      const table = document.createElement("table");
      table.innerHTML = "<thead></thead><tbody></tbody>";
      table.id = `${sheetName.replace(/[^a-zA-Z0-9]/g, '_')}_table`;
      tableWrapper.appendChild(table);
      container.appendChild(tableWrapper);
      document.getElementById("sheetContent").appendChild(container);

      // For "All Tests" only: add fixed horizontal scrollbar
      let fixedBar;
      if (sheetName === "All Tests") {
        fixedBar = document.createElement("div");
        fixedBar.id = "fixed-scrollbar";
        fixedBar.className = "fixed-scrollbar";
        fixedBar.innerHTML = `<div class="scroll-track"></div>`;
        document.body.appendChild(fixedBar);
      }

      const renderTable = (rows) => {
        const thead = table.querySelector("thead");
        const tbody = table.querySelector("tbody");
        thead.innerHTML = tbody.innerHTML = "";
        if (!rows.length) {
          tbody.innerHTML = "<tr><td colspan='5'>No data to show.</td></tr>";
          return;
        }

        const headers = Object.keys(rows[0]);
        thead.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>`;
        tbody.innerHTML = rows.map(row =>
          `<tr>${headers.map(h => `<td>${row[h] || ""}</td>`).join("")}</tr>`
        ).join("");

        if (sheetName === "All Tests" && fixedBar) {
          const scrollTrack = fixedBar.querySelector(".scroll-track");
          scrollTrack.style.width = `${tableWrapper.scrollWidth}px`;

          fixedBar.onscroll = () => {
            tableWrapper.scrollLeft = fixedBar.scrollLeft;
          };
          tableWrapper.onscroll = () => {
            fixedBar.scrollLeft = tableWrapper.scrollLeft;
          };
        }
      };

      const applyFilters = () => {
        const filtered = data.filter(row => {
          return config.filters.every(f => {
            if (f === "Study") {
              const studies = filterInputs[f]();
              return studies.length === 0 || studies.some(s => row[s]?.toString().trim() !== "");
            } else {
              const selected = filterInputs[f]();
              return !selected || row[f] === selected;
            }
          });
        });
        renderTable(filtered);
      };

      ["ABC", "Perry", "HSIS", "NFP", "IHDP", "EHS"].forEach(s => {
        const el = document.getElementById(`${sheetName}_study_${s}`);
        if (el) el.addEventListener("change", applyFilters);
      });

      renderTable(data);
    });
  });

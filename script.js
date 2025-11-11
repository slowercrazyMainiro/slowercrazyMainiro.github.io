const { jsPDF } = window.jspdf;

const appliances = {
  refrigerador: { watts: 150, tarifa: 1.7, recomendacion: "Mantén la puerta cerrada y revisa el sellado para evitar fugas de aire frío." },
  tv: { watts: 100, tarifa: 1.6, recomendacion: "Apaga el televisor cuando no lo uses y ajusta el brillo para ahorrar energía." },
  computadora: { watts: 250, tarifa: 1.8, recomendacion: "Usa el modo ahorro de energía y apágala por completo al final del día." },
  foco: { watts: 10, tarifa: 1.5, recomendacion: "Utiliza focos LED y apágalos cuando no sean necesarios." },
  lavadora: { watts: 500, tarifa: 2.0, recomendacion: "Lava con carga completa y utiliza ciclos de agua fría." },
  microondas: { watts: 800, tarifa: 2.1, recomendacion: "Evita abrir la puerta antes de terminar el tiempo de cocción." },
  licuadora: { watts: 300, tarifa: 1.8, recomendacion: "Usa solo el tiempo necesario y evita el uso prolongado." },
  ventilador: { watts: 75, tarifa: 1.6, recomendacion: "Úsalo en lugar del aire acondicionado cuando sea posible." },
  aire: { watts: 1200, tarifa: 2.3, recomendacion: "Ajusta el termostato a 24°C y realiza mantenimiento frecuente." },
  plancha: { watts: 1000, tarifa: 2.0, recomendacion: "Plancha varias prendas en una sola sesión para aprovechar el calor." },
  consola: { watts: 200, tarifa: 1.7, recomendacion: "Activa el modo de bajo consumo y apágala completamente al terminar." },
  router: { watts: 15, tarifa: 1.5, recomendacion: "Desconéctalo por la noche si no lo necesitas." }
};

const tableBody = document.querySelector("#deviceTable tbody");
const totalKwhSpan = document.getElementById("totalKwh");
const totalCostSpan = document.getElementById("totalCost");
const addBtn = document.getElementById("addBtn");
const canvas = document.getElementById("usageChart");
let chartInstance = null;
let devices = [];

addBtn.addEventListener("click", () => {
  const appliance = document.getElementById("appliance").value;
  const hours = parseFloat(document.getElementById("hours").value);
  const quantity = parseInt(document.getElementById("quantity").value);

  if (!appliance || !hours || hours <= 0 || !quantity || quantity <= 0) {
    alert("Por favor completa todos los campos correctamente.");
    return;
  }

  const { watts, tarifa } = appliances[appliance];
  const kwhMes = ((watts * hours * 30) / 1000) * quantity;
  const costo = kwhMes * tarifa;

  devices.push({ appliance, hours, quantity, kwhMes, costo });
  renderTable();
  updateTotals();
  renderChart();
});

function renderTable() {
  tableBody.innerHTML = "";
  devices.forEach(d => {
    const row = `
      <tr>
        <td>${capitalize(d.appliance)}</td>
        <td>${d.quantity}</td>
        <td>${d.hours}</td>
        <td>${d.kwhMes.toFixed(2)}</td>
        <td>${d.costo.toFixed(2)}</td>
      </tr>`;
    tableBody.innerHTML += row;
  });
}

function updateTotals() {
  const totalKwh = devices.reduce((a, b) => a + b.kwhMes, 0);
  const totalCost = devices.reduce((a, b) => a + b.costo, 0);

  totalKwhSpan.textContent = totalKwh.toFixed(2);
  totalCostSpan.textContent = totalCost.toFixed(2);
}

// ✅ Gráfico circular (Pie Chart)
function renderChart() {
  const labels = devices.map(d => capitalize(d.appliance));
  const data = devices.map(d => d.kwhMes);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(canvas, {
    type: "pie",
    data: {
      labels,
      datasets: [{
        label: "Consumo mensual (kWh)",
        data,
        backgroundColor: [
          "#00c853cc", "#0091ea", "#ffab00", "#ff5252", "#6200ea",
          "#d500f9", "#1de9b6", "#ff6d00", "#00bfa5", "#ff1744",
          "#aa00ff", "#64dd17"
        ],
        borderColor: "#ffffff",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true, // Evita que se deforme
      plugins: {
        legend: { position: "bottom" },
        tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed.toFixed(2)} kWh` } }
      }
    }
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ✅ Generar PDF con gráfico circular bien proporcionado
document.getElementById("generatePdf").addEventListener("click", () => {
  const userName = document.getElementById("userName").value.trim() || "Usuario";
  const date = new Date().toLocaleDateString("es-MX");

  if (devices.length === 0) {
    alert("Agrega al menos un aparato para generar el PDF.");
    return;
  }

  const doc = new jsPDF();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 51, 102);
  doc.text("Reporte de Consumo Energético - EcoAhorro", 20, 20);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Generado por: ${userName}`, 20, 30);
  doc.text(`Fecha: ${date}`, 150, 30);

  const tableData = devices.map(d => [
    capitalize(d.appliance),
    d.quantity,
    d.hours,
    d.kwhMes.toFixed(2),
    `$${d.costo.toFixed(2)}`
  ]);

  doc.autoTable({
    startY: 40,
    head: [["Aparato", "Cantidad", "Horas/Día", "Consumo (kWh)", "Costo (MXN)"]],
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [0, 70, 140], textColor: 255, halign: "center" },
    bodyStyles: { fillColor: [230, 240, 255], textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    margin: { left: 15, right: 15 }
  });

  const totalKwh = devices.reduce((a, b) => a + b.kwhMes, 0);
  const totalCost = devices.reduce((a, b) => a + b.costo, 0);

  let y = doc.lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 51, 102);
  doc.text(`Total mensual: ${totalKwh.toFixed(2)} kWh`, 20, y);
  y += 8;
  doc.text(`Costo estimado: $${totalCost.toFixed(2)} MXN`, 20, y);

  // Recomendaciones
  y += 15;
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.text("Recomendaciones personalizadas:", 20, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  devices.forEach((d, i) => {
    const rec = appliances[d.appliance].recomendacion;
    const text = `• ${capitalize(d.appliance)}: ${rec}`;
    doc.text(text, 25, y);
    y += 7;
    if (y > 260) {
      doc.addPage();
      y = 30;
    }
  });

  // Gráfico circular con proporciones correctas
  const chartImage = canvas.toDataURL("image/png", 1.0);
  if (y > 180) {
    doc.addPage();
    y = 30;
  }
  y += 10;
  doc.text("Distribución de Consumo Energético", 20, y);
  y += 10;
  doc.addImage(chartImage, "PNG", 55, y, 100, 100); // tamaño fijo para que no se deforme

  doc.save("Reporte_EcoAhorro.pdf");
});
// Limpia los datos al recargar la página
window.addEventListener("load", () => {
  document.getElementById("device-form").reset(); // limpia el formulario
  document.getElementById("results").innerHTML = ""; // limpia los resultados
  totalKwh = 0;
  totalCost = 0;
});

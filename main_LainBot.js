const TelegramBot = require("node-telegram-bot-api");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const ExcelJS = require("exceljs");
const { promisePool } = require("./sql/connection.js");
require("dotenv").config({ path: "./env/.env" });

//CONFIG
const token_bot = process.env["TOKEN_BOT"];
console.log(token_bot); // Muestra el token del bot
console.log("TOKEN_BOT:", process.env.TOKEN_BOT); // Muestra el token del bot también
console.log("Polling-test: ", TelegramBot); // Muestra información sobre TelegramBot
const bot = new TelegramBot(token_bot, {
  polling: true,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4,
    },
  },
});

//BOT PRENDIDO
bot
  .getMe()
  .then((user) => {
    console.log(`Bot prendido con nombre: @${user.username}`);
  })
  .catch((error) => {
    console.error("ERROR AL OBTENER INF. DEL BOT", error);
  });

//CREA LA CONSTANTE QUE DEFINE LA RUTA DE LA CARPETA "commands"
const commandsDir = path.join(__dirname, "/bot/commands");

//VERIFICA SI LA CARPETA "commands" existe
if (fs.existsSync(commandsDir)) {
  console.log("Carpeta de comandos detectada:", commandsDir + "\n");
} else {
  console.log("La carpeta de comandos no se encuentra en:", commandsDir + "\n");
}

//CARGA LOS COMANDOS DE LA CARPETA "commands"

//Defino la variable que leerá los archivos
const readFiles = fs.readdirSync(commandsDir);
//Ejecuto la lógica
readFiles.forEach((file) => {
  const commandPath = path.join(commandsDir, file);
  const command = require(commandPath);
  command(bot);
  console.log(readFiles);
  console.log(`Comando cargado: ${file}`);
});


// Tu ID de Telegram
const ADMIN_ID = 6484858971;

// Función para generar y enviar el Excel
async function generarYEnviarExcel() {
  try {
    // Obtener consultas de los últimos 7 días
    const sql = `
      SELECT id_telegram, name_telegram, consulta, valor_consulta, fecha_hora, exitoso
      FROM consultas
      WHERE fecha_hora >= NOW() - INTERVAL 7 DAY
    `;
    const [rows] = await promisePool.execute(sql);

    if (rows.length === 0) {
      bot.sendMessage(ADMIN_ID, "No hay consultas en los últimos 7 días.");
      return;
    }

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Consultas");

    // Agregar encabezados
    worksheet.columns = [
      { header: "ID Telegram", key: "id_telegram", width: 15 },
      { header: "Nombre Telegram", key: "name_telegram", width: 25 },
      { header: "Consulta", key: "consulta", width: 30 },
      { header: "Valor Consulta", key: "valor_consulta", width: 20 },
      { header: "Fecha y Hora", key: "fecha_hora", width: 20 },
      { header: "Exitoso", key: "exitoso", width: 10 },
    ];

    // Agregar datos
    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    // Guardar archivo en el sistema
    const fechaHoy = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD
    const nombreArchivo = `consultas_${fechaHoy}.xlsx`;
    const rutaArchivo = path.join(__dirname, nombreArchivo);

    await workbook.xlsx.writeFile(rutaArchivo);

    // Enviar el archivo por Telegram
    await bot.sendDocument(ADMIN_ID, rutaArchivo, {
      caption: `Aquí tienes el reporte de consultas de los últimos 7 días (${fechaHoy}).`,
    });

    // Borrar el archivo después de enviarlo
    fs.unlinkSync(rutaArchivo);

    // Eliminar registros antiguos
    await promisePool.execute(`DELETE FROM consultas WHERE fecha_hora < NOW() - INTERVAL 7 DAY`);
    bot.sendMessage(ADMIN_ID, "Registros antiguos eliminados de la base de datos.");

  } catch (error) {
    console.error("Error al generar y enviar el Excel:", error);
    bot.sendMessage(ADMIN_ID, "Hubo un error al generar el Excel.");
  }
}

// Programar la tarea para ejecutarse cada 7 días (domingo a las 00:00)
cron.schedule("0 0 * * 0", () => {
  generarYEnviarExcel();
  console.log("Tarea programada ejecutada: Generación y envío de Excel.");
});

// Inicia el bot y muestra el mensaje de confirmación
bot.getMe().then((user) => {
  console.log(`Bot prendido con nombre: @${user.username}`);
});

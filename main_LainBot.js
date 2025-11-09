const TelegramBot = require("node-telegram-bot-api");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const ExcelJS = require("exceljs");
const { promisePool } = require("./sql/connection.js");
require("dotenv").config({ path: "./env/.env" });

// CONFIGURACIÓN DEL BOT
const token_bot = process.env["TOKEN_BOT"];
const bot = new TelegramBot(token_bot, {
  polling: true,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4,
    },
  },
});

// VERIFICAR QUE EL BOT ESTÉ PRENDIDO
bot
  .getMe()
  .then((user) => {
    console.log(`✅ Bot prendido con nombre: @${user.username}`);
  })
  .catch((error) => {
    console.error("❌ ERROR AL OBTENER INFO DEL BOT:", error);
  });

bot.onText(/\/contacto/, (msg) => {
  const chatId = msg.chat.id;
  const enlaceSoporte = `tg://user?id=8194230892`; // tu ID o variable de entorno
  const enlaceCanal = "https://t.me/+3wg61KTkS-9iMjU5"; // tu canal o grupo oficial

  const mensaje = `
<b>[ ☁️ LAIN_DATA ]</b>  
<b>¡Hola, ${msg.from.first_name}!</b> 👋  

🛰️ <b>Nuevo bot disponible:</b> <a href="https://t.me/LainData_Bot">@LainData_Bot</a>  
🔥 <b>Regístrate y disfruta las nuevas funciones:</b>  
➤ Mayor compatibilidad  
➤ Más estabilidad  
➤ Comandos mejorados  

📢 POR FAVOR, INICIA Y REGÍSTRATE EN EL NUEVO BOT, SI ERES CLIENTE SERÁ DE MUCHA IMPORTANCIA PARA TRASLADAR TU MEMBRESÍA. CONTACTA A TU VENDEDOR, EN ESTOS DÍAS SE ESTARÁ DANDO INFORMANDO CUANDO INICIA EL NUEVO BOT.

💬 <b>Opciones de contacto:</b>  
• <b>Contactar con la dueña</b> (compras, soporte).  
• <b>Unirte al canal oficial</b> (novedades, precios y actualizaciones).
`;

  const opciones = {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "💬 Contactar con la dueña", url: enlaceSoporte }],
        [{ text: "📣 Canal oficial", url: enlaceCanal }],
      ],
    },
  };

  bot.sendMessage(chatId, mensaje, opciones);
});

// CARGA DE COMANDOS DESDE /bot/commands
const commandsDir = path.join(__dirname, "/bot/commands");

if (fs.existsSync(commandsDir)) {
  console.log("📁 Carpeta de comandos detectada:", commandsDir + "\n");

  // Leer solo archivos .js
  const readFiles = fs
    .readdirSync(commandsDir)
    .filter((f) => f.endsWith(".js"));

  readFiles.forEach((file) => {
    const commandPath = path.join(commandsDir, file);
    try {
      const command = require(commandPath);
      if (typeof command === "function") {
        command(bot);
        console.log(`✅ Comando cargado: ${file}`);
      } else {
        console.warn(`⚠️ El archivo ${file} no exporta una función válida.`);
      }
    } catch (error) {
      console.warn(`⚠️ No se pudo cargar el comando ${file}: ${error.message}`);
    }
  });
} else {
  console.log(
    "❌ La carpeta de comandos no se encuentra en:",
    commandsDir + "\n"
  );
}

// ID DE TELEGRAM PARA ADMIN
const ADMIN_ID = 6484858971;

// FUNCIÓN PARA GENERAR Y ENVIAR EXCEL
async function generarYEnviarExcel() {
  try {
    const sql = `
      SELECT id_telegram, name_telegram, consulta, valor_consulta, fecha_hora, exitoso
      FROM consultas
      WHERE fecha_hora >= NOW() - INTERVAL 7 DAY
    `;
    const [rows] = await promisePool.execute(sql);

    if (rows.length === 0) {
      bot.sendMessage(ADMIN_ID, "📊 No hay consultas en los últimos 7 días.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Consultas");

    worksheet.columns = [
      { header: "ID Telegram", key: "id_telegram", width: 15 },
      { header: "Nombre Telegram", key: "name_telegram", width: 25 },
      { header: "Consulta", key: "consulta", width: 30 },
      { header: "Valor Consulta", key: "valor_consulta", width: 20 },
      { header: "Fecha y Hora", key: "fecha_hora", width: 20 },
      { header: "Exitoso", key: "exitoso", width: 10 },
    ];

    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    const fechaHoy = new Date().toISOString().split("T")[0];
    const nombreArchivo = `consultas_${fechaHoy}.xlsx`;
    const rutaArchivo = path.join(__dirname, nombreArchivo);

    await workbook.xlsx.writeFile(rutaArchivo);

    await bot.sendDocument(ADMIN_ID, rutaArchivo, {
      caption: `📄 Reporte de consultas de los últimos 7 días (${fechaHoy}).`,
    });

    fs.unlinkSync(rutaArchivo);

    await promisePool.execute(
      `DELETE FROM consultas WHERE fecha_hora < NOW() - INTERVAL 7 DAY`
    );
    bot.sendMessage(
      ADMIN_ID,
      "🧹 Registros antiguos eliminados de la base de datos."
    );
  } catch (error) {
    console.error("❌ Error al generar y enviar el Excel:", error);
    bot.sendMessage(ADMIN_ID, "❌ Hubo un error al generar el Excel.");
  }
}

// TAREA PROGRAMADA CADA DOMINGO A LAS 00:00
cron.schedule("0 0 * * 0", () => {
  generarYEnviarExcel();
  console.log("🕛 Tarea programada ejecutada: Generación y envío de Excel.");
});

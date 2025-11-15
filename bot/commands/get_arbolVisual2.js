const fs = require("fs");
const path = require("path");

const dataStorage = {};

// Rutas y datos
const rangosFilePath = require("../config/rangos/rangos.json");
const { arbolVisual2 } = require("../api/api_Variados.js");
const { registrarConsulta } = require("../../sql/consultas.js");

// Manejo anti-spam
const usuariosEnConsulta = {};
const antiSpam = {};

const tumblr = path.join(__dirname, "../img/arbolicon.jpg");
const dirDoc = path.join(__dirname, "../../fichasDocuments/arbolVisual");

// ALMACENAR LOS MENSAJES ID
const comandoInvocado = {};
let messageId;

let buttonId;

// Se define dirBase fuera del módulo para que sea accesible globalmente
let dirBase = "";
let dni;

module.exports = (bot) => {
  bot.onText(/[\/.$?!]famivi (.+)/, async (msg, match) => {
    // Manejo de errores de polling
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    // Ayudas rápidas
    dni = match[1];
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const typeChat = msg.chat.type;
    const groupName = msg.chat.title;
    const firstName = msg.from.first_name;
    const messageOptions = {
      reply_to_message_id: msg.message_id,
      parse_mode: "Markdown",
    };

    // BOTON - CFG
    messageId = msg.message_id; // PRIMER MSG - ID
    // console.log("PRIMER ID DE MENSAJE...", messageId);

    comandoInvocado[userId] = messageId + 1;

    // Verificación de rangos
    const isDev = rangosFilePath.DEVELOPER.includes(userId);
    const isAdmin = rangosFilePath.ADMIN.includes(userId);

    const { checkIsBuyer } = require("../../sql/checkbuyer.js");
    //Rango Comprador
    const isBuyer = await checkIsBuyer(userId);

    const gruposPermitidos = require("../config/gruposManager/gruposPermitidos.js");
    const gruposBloqueados = require("../config/gruposManager/gruposBloqueados.js");

    const grupoBloqueado = gruposBloqueados.includes(chatId);

    if (grupoBloqueado) {
      try {
        if (isDev) {
          let messageAdmin = `*[ ☑️ ] La prueba ha sido exitosa* querida administradora.`;
          bot.sendMessage(chatId, messageAdmin, messageOptions).then(() => {
            console.log("Test Positivo");
          });
          return;
        } else {
          let grupoBloqueado = `*[ ✖️ ] Grupo bloqueado*`;
          bot.sendMessage(chatId, grupoBloqueado, messageOptions).then(() => {
            console.log("Grupo bloqueado");
          });
          return;
        }
      } catch (error) {
        console.log("Error en la detección de grupo bloqueado: ", error);
      }
    }

    const botInfo = await bot.getMe();
    const botMember = await bot
      .getChatMember(chatId, botInfo.id)
      .catch((err) => {
        console.log(
          "Error al obtener la información del Bot en el comando Ficha Azul: ",
          err
        );
      });
    const botIsAdmin = botMember.status === "administrator";

    if (typeChat === "private" && !isDev && !isBuyer) {
      let x = `*[ ✖️ ] PORFAVOR, VE AL NUEVO BOT @LainData_Bot, ESTE BOT HA SIDO DEJADO EN DESUSO. SI SIGUES TENIENDO UN PLAN ACTIVO CON NOSOTROS, VE AL BOT NUEVO Y COMÚNICATE CON LA DUEÑA O ADMINS*`;

      const opts = {
        ...messageOptions,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🔗 Grupo PÚBLICO 🛡️",
                url: "https://t.me/+-nHDtyXT-V45Yjlh",
              },
            ],
          ],
        },
      };

      bot
        .sendMessage(chatId, x, opts)
        .then(() => {
          console.log(
            `El usuario ${userId} con nombre ${firstName} ha intentado usarme de forma privada.`
          );
        })
        .catch((err) => {
          console.log(
            `Error al mandar el mensaje "no uso-privado": `,
            err.message
          );
        });

      return;
    }

    if (!botIsAdmin && typeChat === "group" && !isDev) {
      let noAdmin = `*[ 💤 ] Dormiré* hasta que no me hagan *administradora* _zzz 😴_`;
      bot.sendMessage(chatId, noAdmin, messageOptions);
      return;
    }

    if (!gruposPermitidos.includes(chatId) && !isAdmin && !isDev && !isBuyer) {
      bot
        .sendMessage(
          chatId,
          `*[ ✖️ ] Este grupo* no ha sido *autorizado* para mi uso.`,
          messageOptions
        )
        .then(() => {
          console.log(
            `Se ha añadido e intentado usar el bot en el grupo con ID ${chatId} y NOMBRE ${groupName}`
          );
          let noGrupo = `*[ 🔌 ] Se me han querido usar* en este grupo:\n\n`;
          noGrupo += `*-👥:* \`${groupName}\`\n`;
          noGrupo += `*-🆔:* \`${chatId}\`\n`;

          if (botIsAdmin) {
            bot
              .exportChatInviteLink(chatId)
              .then((inviteLink) => {
                if (inviteLink) {
                  noGrupo += `*-🔗:* ${inviteLink}\n`;
                }
                return bot.sendMessage(6484858971, noGrupo, {
                  parse_mode: "Markdown",
                  disable_web_page_preview: true,
                });
              })
              .catch((error) => {
                console.log(
                  "Error al obtener el enlace de invitación del grupo: ",
                  error.message
                );
              });
          } else {
            return bot.sendMessage(6484858971, noGrupo, {
              parse_mode: "Markdown",
              disable_web_page_preview: true,
            });
          }
        })
        .catch((error) => {
          console.log(
            "Error al enviar el mensaje de grupo no autorizado: ",
            error.message
          );
        });
      return;
    }

    if (!isDev && !isAdmin) {
      const tiempoEspera = antiSpam[userId] || 0;
      const tiempoRestante = Math.max(
        0,
        tiempoEspera - Math.floor(Date.now() / 1000)
      );
      if (tiempoRestante > 0) {
        bot.sendMessage(
          chatId,
          `*[ ⏳ ] ${firstName},* debes esperar \`${tiempoRestante} segundos\` para volver a utilizar este comando.`,
          messageOptions
        );
        delete usuariosEnConsulta[userId];
        return;
      }
    }

    if (dni.length !== 8) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/famivi\`*]* seguido de un número de *dni* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/famivi 06256217\`*]*\n\n`;
      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando* \`FAMILIA VISUAL\` *del* *➜ dni* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    usuariosEnConsulta[userId] = true;

    try {
      const datos = await arbolVisual2(dni, "Lain Data", userId);

      if (datos.status !== 200 && !datos.pdf) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        let yyx = `*[ ✖️ ] No se encontraron familiares* para el *DNI proporcionado.*`;
        return bot.sendMessage(chatId, yyx, messageOptions);
      }

      // Datos obtenidos
      const pdfBase64 = datos.pdf;

      // Elimina el encabezado si viene en formato Data URI
      const cleanBase64 = pdfBase64.replace(
        /^data:application\/pdf;base64,/,
        ""
      );

      // Convierte a Buffer
      const pdfBuffer = Buffer.from(cleanBase64, "base64");

      //PROPIETARIO

      // const apepaterno = dataPropietario.AP_PRIMER;
      // const apematerno = dataPropietario.AP_SEGUNDO;
      // const nombres = dataPropietario.PRENOM_INSCRITO;
      // const ubicacion = dataPropietario.DISTRITO;
      // const nuEdad = dataPropietario.NU_EDAD;

      // Datos dni

      let caption = `<b>[#LAIN-DOX 🌐] ➤ #ARBOLVISUAL</b>\n\n`;

      caption += `<b>[ ☑️ ]  FAMILIA VISUAL -</b> <code>${dni}</code> <b>- 👪</b>\n\n`;

      caption += `<b>➤ DATA ARBOL:</b>\n\n`;
      caption += `  <code>⌞</code> <b>CANTIDAD TOTAL:</b> <code>${datos.data_arbol.cantidad_registros}</code>\n`;
      caption += `  <code>⌞</code> <b>FAMI. PATERNOS:</b> <code>${datos.data_arbol.total_paterno}</code>\n`;
      caption += `  <code>⌞</code> <b>FAMI. MATERNOS:</b> <code>${datos.data_arbol.total_materno}</code>\n\n`;

      caption += `<b>➤ CONSULTADO POR:</b>\n`;
      caption += `<code>⌞</code> <b>USUARIO:</b> <code>${userId}</code>\n`;
      caption += `<code>⌞</code> <b>NOMBRE:</b> <code>${firstName}</code>\n\n`;
      caption += `<b>MENSAJE:</b> <i>La consulta se hizo de manera exitosa ♻.</i>\n\n`;

      // Crea el directorio si no existe
      if (!fs.existsSync(dirDoc)) {
        fs.mkdirSync(dirDoc, { recursive: true });
      }

      const filePath = path.join(
        dirDoc,
        `FAMILIA_VISUAL_PROFESIONAL_${dni}.pdf`
      );
      const tumblrStream = fs.createReadStream(tumblr);

      // Guarda el buffer PDF en disco
      fs.writeFileSync(filePath, pdfBuffer);
      await bot.deleteMessage(chatId, consultandoMessage.message_id);
      bot
        .sendDocument(chatId, filePath, {
          caption: caption,
          thumbnail: tumblrStream,
          reply_to_message_id: msg.message_id,
          parse_mode: "HTML",
        })
        .then(async () => {
          await registrarConsulta(
            userId,
            firstName,
            "FAMILIA VISUAL",
            dni,
            true
          );
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error("Error al eliminar el archivo:", err);
              return;
            }
            console.log("Archivo eliminado exitosamente");
          });

          if (!isDev && !isAdmin && !isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 150;
          }
          //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
          else if (isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 100;
          }
        });
    } catch (error) {
      console.log(error);

      let xerror = `*[ ✖️ ] Error en la consulta.*`;
      await bot.deleteMessage(chatId, consultandoMessage.message_id);

      bot.sendMessage(chatId, xerror, messageOptions);
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};

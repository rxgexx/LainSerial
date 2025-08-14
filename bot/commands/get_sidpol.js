const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");
const thumbPath = path.join(__dirname, "../img/img_denuncia.jpg"); // Asegúrate de tener esta imagen

// Rutas y datos
const { denuncias } = require("../api/api_Legales.js");

const rangosFilePath = require("../config/rangos/rangos.json");
const { getReniec } = require("../api/apis.js");
const { registrarConsulta } = require("../../sql/consultas.js");

// Manejo anti-spam
const usuariosEnConsulta = {};
const antiSpam = {};

const img = path.join(__dirname, "../img/rqPersona.jpg");
const dirDoc = path.join(__dirname, "../../fichasDocuments/rqPer");

// ALMACENAR LOS MENSAJES ID
const comandoInvocado = {};
let messageId;


module.exports = (bot) => {
  bot.onText(/[\/.$?!]denuncias (.+)/, async (msg, match) => {
    // Manejo de errores de polling
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    // Ayudas rápidas
    const dni = match[1];
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const typeChat = msg.chat.type;
    const groupName = msg.chat.title;
    const firstName = msg.from.first_name;
    const messageOptions = {
      reply_to_message_id: msg.message_id,
      parse_mode: "Markdown",
    };

    comandoInvocado[userId] = messageId + 1;

    // Verificación de rangos
    const isDev = rangosFilePath.DEVELOPER.includes(userId);
    const isAdmin = rangosFilePath.ADMIN.includes(userId);
    //Rango Comprador
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
      let x = `*[ ✖️ ] Uso privado* deshabilitado en mi *fase - beta.*`;
      bot
        .sendMessage(chatId, x, messageOptions)
        .then(() => {
          console.log(
            `El usuario ${userId} con nombre ${firstName} ha intentado usarme de forma privada.`
          );
        })
        .catch((err) => {
          console.log(
            `Error al mandar el mensaje "no uso-privado: `,
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/denuncias\`*]* seguido de un número de *dni* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/denuncias 41996680\`*]*\n\n`;
      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando* \`denuncias\` *del* *➜ dni* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    usuariosEnConsulta[userId] = true;

    try {
      const datos = await denuncias(dni);
      const reniec = await getReniec(dni);

      //PROPIETARIO

      const dataPersona = reniec.data.data_reniec;
      const listaAni = dataPersona.listaAni[0];

      const {
        apeMaterno, // Apellido materno
        apePaterno, // Apellido paterno
        departamento, // Departamento
        distrito, // Distrito
        estatura, // Estatura
        feNacimiento, // Fecha de nacimiento
        nomMadre, // Nombre de la madre
        nomPadre, // Nombre del padre
        preNombres, // Nombres
        provincia, // Provincia
      } = listaAni;

      // Datos dni

      let caption = `<b>[#LAIN-DOX 🌐] ➤ #DENUNCIA</b>\n\n`;

      caption += `<b>[ ☑️ ] DENUNCIA PERSONA. -</b> <code>${dni}</code> <b>- 👮‍♀️</b>\n\n`;

      caption += `<b>➤ CONSULTADO:</b>\n`;
      caption += `  ⌞ <b>NOMBRE:</b> <code>${preNombres} ${apePaterno} ${apeMaterno}</code>\n`;
      caption += `  ⌞ <b>ESTATURA:</b> <code>${estatura}</code>\n`;
      caption += `  ⌞ <b>NOM. PADRE:</b> <code>${nomPadre}</code>\n`;
      caption += `  ⌞ <b>NOM. MADRE:</b> <code>${nomMadre}</code>\n`;
      caption += `  ⌞ <b>TIPO. DOCUMENTO:</b> <code>DNI</code>\n`;
      caption += `  ⌞ <b>FECHA. NACIMIENTO:</b> <code>${feNacimiento}</code>\n`;
      caption += `  ⌞ <b>LUGAR. NACIMIENTO:</b> <code>${departamento} - ${provincia} ${distrito}</code>\n\n`;

      caption += `<b>➤ CONSULTADO POR:</b>\n`;
      caption += `⌞ <b>USUARIO:</b> <code>${userId}</code>\n`;
      caption += `⌞ <b>NOMBRE:</b> <code>${firstName}</code>\n\n`;

      caption += `<b>MENSAJE:</b> <i>La consulta se hizo de manera exitosa ♻.</i>\n\n`;

      // Crear carpeta temporal si no existe
      const tempFolder = path.join(
        __dirname,
        "../../fichasDocuments/temp_denuncias"
      );
      if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder);

      await bot.deleteMessage(chatId, consultandoMessage.message_id);

      for (let i = 0; i < datos.denuncias.length; i++) {
        const denuncia = datos.denuncias[i];

        const buffer = Buffer.from(denuncia.base64, "base64");
        const fileName = denuncia.nombre || `Denuncia_${i + 1}-${dni}.pdf`;
        const filePath = path.join(tempFolder, fileName);

        // Guardar PDF localmente
        fs.writeFileSync(filePath, buffer);

        // Puedes usar cualquier imagen local como thumbnail (PNG/JPG)

        // Enviar PDF con thumb
        await bot.sendDocument(chatId, filePath, {
          reply_to_message_id: msg.message_id,
          caption,
          parse_mode: "HTML",
          thumb: fs.existsSync(thumbPath) ? thumbPath : undefined,
        });

        // Esperar 5 segundos antes de enviar el siguiente
        await new Promise((r) => setTimeout(r, 5000));

        // Opcional: borrar el archivo después de enviarlo
        fs.unlinkSync(filePath);
      }
      registrarConsulta(userId, firstName, "DENUNCIAS", dni, true)
      //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
      if (!isDev && !isAdmin && !isBuyer) {
        antiSpam[userId] = Math.floor(Date.now() / 1000) + 300;
      }
      //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
      else if (isBuyer) {
        antiSpam[userId] = Math.floor(Date.now() / 1000) + 250;
      }
    } catch (error) {
      console.log(error);

      let xerror = `*[ ✖️ ] No se encontraron denuncias.*`;
      await bot.deleteMessage(chatId, consultandoMessage.message_id);

      bot.sendMessage(chatId, xerror, messageOptions);

      //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
      if (!isDev && !isAdmin && !isBuyer) {
        antiSpam[userId] = Math.floor(Date.now() / 1000) + 150;
      }
      //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 40 segundos.
      else if (isBuyer) {
        antiSpam[userId] = Math.floor(Date.now() / 1000) + 20;
      }
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};

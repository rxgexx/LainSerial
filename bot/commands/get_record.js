const { detalleLicencia } = require("../api/api_Variados");

const fs = require("fs");
const path = require("path");


const rangosFilePath = require("../config/rangos/rangos.json");

// Manejo anti-spam
const usuariosEnConsulta = {};
const antiSpam = {};

const img = path.join(__dirname, "../img/record.jpg");
const dirDoc = path.join(__dirname, "../../fichasDocuments/recordPersona");

// ALMACENAR LOS MENSAJES ID
const comandoInvocado = {};
let messageId;

let buttonId;

// Se define dirBase fuera del módulo para que sea accesible globalmente
let dirBase = "";
let dni;

module.exports = (bot) => {
  bot.onText(/[\/.$?!]reve (.+)/, async (msg, match) => {
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
    const { checkIsBuyer } = require("../../sql/checkbuyer");
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/reve\`*]* seguido de un número de *dni* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/reve 45454545\`*]*\n\n`;
      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando* \`RECORD VEHICULAR\` *del* *➜ DNI* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    usuariosEnConsulta[userId] = true;

    try {
      const datos = await detalleLicencia(dni);

      if (datos.status === false && datos.msg === `No se encontro datos de ${dni}`) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        let yyx = `*[ ✖️ ] Sin DATOS* encontrados.`;
        return bot.sendMessage(chatId, yyx, messageOptions);
      }

      // Datos obtenidos
      const pdf = datos.data.pdf;

      const pdfdata = pdf.replace(/^data:image\/jpeg;base64,/, "");
      const pdfbuffer = Buffer.from(pdfdata, "base64");

      //PROPIETARIO

      const informacionPersona = datos.data.informacionPersona[0];

      const Clase = informacionPersona.Clase;
      const Categoria = informacionPersona.Categoria;
      const Restricciones1 = informacionPersona.Restricciones1;
      const fecNacimiento = informacionPersona.fecNacimiento;
      const departamento = informacionPersona.Departamento;
      const distrito = informacionPersona.Distrito;
      const direccion = informacionPersona.Direccion;
      const nomCompletos = informacionPersona.Nombre + ` ` + informacionPersona.ApellidoPaterno + ` ` + informacionPersona.ApellidoMaterno;
      const FechaExpedicion = informacionPersona.FechaExpedicion;
      const NumLicencia = informacionPersona.NumLicencia;
      const EstadoLicencia = informacionPersona.EstadoLicencia;

      // Datos dni

      let caption = `*[#LAIN-DOX 🌐] ➤ #RECORD-VEHICULAR*\n\n`;

      caption += `*[ ☑️ ] RECORD VEHICULAR. -* \`${dni}\` *- 🚗*\n\n`;

      caption += `*➤ CONSULTADO:*\n`;
      caption += `  \`⌞\` *NOMBRE:* \`${nomCompletos}\`\n`;
      caption += `  \`⌞\` *CLASE:* \`${Clase}\`\n`;
      caption += `  \`⌞\` *CATEGORIA:* \`${Categoria}\`\n`;
      caption += `  \`⌞\` *RESTRICCIONES:* \`${Restricciones1}\`\n`;
      caption += `  \`⌞\` *FE. EXPEDICION:* \`${FechaExpedicion}\`\n`;
      caption += `  \`⌞\` *NUMERO. LICENCIA:* \`${NumLicencia}\`\n`;
      caption += `  \`⌞\` *ESTADO. LICENCIA:* \`${EstadoLicencia}\`\n`;
      caption += `  \`⌞\` *UBICA. RESIDENCIAL:* \`${departamento}\` *-* \`${distrito}\`\n`;
      caption += `  \`⌞\` *LUGAR. RESIDENCIAL:* \`${direccion}\`\n\n`;

      caption += `*➤ CONSULTADO POR:*\n`;
      caption += `\`⌞\` *USUARIO:* \`${userId}\`\n`;
      caption += `\`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      caption += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

      // Crea el directorio si no existe
      if (!fs.existsSync(dirDoc)) {
        fs.mkdirSync(dirDoc, { recursive: true });
      }

      // Define la ruta del archivo
      const filePath = path.join(dirDoc, `recordPersona_${dni}.pdf`);

      // Guarda el PDF en el sistema de archivos
      fs.writeFileSync(filePath, pdfbuffer);

      await bot.deleteMessage(chatId, consultandoMessage.message_id);
      bot
        .sendDocument(chatId, filePath, {
          caption: caption,
          reply_to_message_id: msg.message_id,
          parse_mode: "Markdown",
          thumb: img,
        })
        .then(() => {
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

      let xerror = `*[ ✖️ ] Error en la consulta.`;
      await bot.deleteMessage(chatId, consultandoMessage.message_id);

      bot.sendMessage(chatId, xerror, messageOptions);
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};

//SE REQUIRE LAS APIS
const iconv = require("iconv-lite");
const { mpfnDni } = require("../api/api_Legales.js");

const path = require("path");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

const img = path.join(__dirname, "../img/mpfn.jpg");
const dirDoc = path.join(__dirname, "../../fichasDocuments/mpfnDoc");

//FS
const fs = require("fs");

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]mpfn (.+)/, async (msg, match) => {
    //POLLING ERROR
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    //BOT ANTI - BUG
    // const botStartTime = Date.now() / 1000; // Tiempo de inicio del bot en segundos
    // const messageTime = msg.date + 1; // Tiempo del mensaje en segundos + 1 segundo

    // // Ignorar mensajes que son más antiguos que el tiempo de inicio del bot
    // if (messageTime < botStartTime) {
    //   return;
    // }

    //Ayudas rápidas como declarar nombres, opciones de mensajes, chatId, etc
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

    //Se declaran los rangos

    //Rango Developer
    const isDev = rangosFilePath.DEVELOPER.includes(userId);

    //Rango Administrador
    const isAdmin = rangosFilePath.ADMIN.includes(userId);

    //Rango Comprador
    const { checkIsBuyer } = require("../../sql/checkbuyer");
    //Rango Comprador
    const isBuyer = await checkIsBuyer(userId);

    const gruposPermitidos = require("../config/gruposManager/gruposPermitidos.js");
    const botInfo = await bot.getMe();
    const botMember = await bot
      .getChatMember(chatId, botInfo.id)
      .catch((err) => {
        console.log(
          "Error al obtener la información del Bot en el comando titularMov: ",
          err
        );
      });
    const botIsAdmin = botMember.status === "administrator";

    //Si el chat lo usan de forma privada
    if (typeChat === "private" && !isDev && !isBuyer && !isAdmin) {
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

    //Si lo usan en un grupo no permitido
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

          // Obtener el enlace de invitación del grupo
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
        })
        .catch((error) => {
          console.log(
            "Error al enviar el mensaje de grupo no autorizado: ",
            error.message
          );
        });
      return;
    }

    //Se verifica si el usuario tiene un anti - spam agregado
    if (!isDev && !isAdmin) {
      const tiempoEspera = antiSpam[userId] || 0;
      const tiempoRestante = Math.max(
        0,
        tiempoEspera - Math.floor(Date.now() / 1000)
      );
      if (tiempoRestante > 0) {
        //Se envía el mensaje indicado cuanto tiempo tiene
        bot.sendMessage(
          chatId,
          `*[ ✖️ ] ${firstName},* debes esperar \`${tiempoRestante} segundos\` para volver a utilizar este comando.`,
          messageOptions
        );
        delete usuariosEnConsulta[userId];
        return;
      }
    }
    if (dni.length !== 8) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/fxmpfn\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/fxmpfn 27427864\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando* \`CASOS MPFN\` del *➜ DNI* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      //CORREGIR RESPONSE
      // Función para normalizar la cadena JSON

      const response_api = await mpfnDni(dni);

      const response = response_api.respuesta;
      
      if (
        response === "No se encontraron registros para su búsqueda"
      ) {
        await bot.deleteMessage(chatId, consultandoMessage.message_id);
        return bot.sendMessage(
          chatId,
          `*[ ✖️ ] No se encontraron* casos para el *DNI* \`${dni}\`.`,
          messageOptions
        );
      } 
      const casos = response;

      await bot.deleteMessage(chatId, consultandoMessage.message_id);

      casos.forEach((dato, index) => {
        const numero = index + 1;
        const caso = dato.caso;
        const codigoDet = dato.codigoDet;
        const delito = dato.delito;
        const fechDetencion = dato.fechDetencion;
        const genero = dato.genero;
        const nombres = dato.nombres;
        const oficinaRegistro = dato.oficinaRegistro;
        const pdf = dato.pdf;

        const pdfdata = pdf.replace(/^data:image\/jpeg;base64,/, "");
        const pdfbuffer = Buffer.from(pdfdata, "base64");

        // Define la ruta del archivo
        const filePath = path.join(dirDoc, `reporteMPFN_${dni}_${numero}.pdf`);

        // Guarda el PDF en el sistema de archivos
        fs.writeFileSync(filePath, pdfbuffer);

        // Construir el mensaje/caption
        let res = `*[#LAIN-DOX 🌐] ➤ #CASOSMPFN*\n\n`;
        res += `*[ ☑️ ] REGISTRO ${numero}:*\n\n`;
        res += `➜ *CASO:* \`${caso}\`\n`;
        res += `  \`⌞\` *DELITO:* \`${delito}\`\n`;
        res += `  \`⌞\` *GÉNERO:* \`${genero}\`\n`;
        res += `  \`⌞\` *NOMBRES:* \`${nombres}\`\n`;
        res += `  \`⌞\` *CÓDIGO. DETENCIÓN:* \`${codigoDet}\`\n`;
        res += `  \`⌞\` *FECHA. DETENCIÓN:* \`${fechDetencion}\`\n`;
        res += `  \`⌞\` *OFICINA. REGISTRO:* \`${oficinaRegistro}\`\n\n`;
        res += `*NOTA:* Para saber más detalles sobre su *consulta*, puede utilizar el *comando* \`/fxcaso ${caso}\`*.*\n\n`;
  
        res += `*➤ CONSULTADO POR:*\n`;
        res += `\`⌞\` *USUARIO:* \`${userId}\`\n`;
        res += `\`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
        res += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;
  
        // Asegurarse de que la longitud del mensaje esté dentro del límite
        if (res.length > 1024) {
          console.error("Error: El mensaje es demasiado largo.");
          return; // O manejarlo de otra manera (dividir mensaje, etc.)
        }

        bot
          .sendDocument(chatId, filePath, {
            caption: res,
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
              console.log(`Archivo ${filePath} eliminado exitosamente`);
            });
          })
          .catch((error) => {
            console.log("Error al enviar el documento:", error.message);
          });
      });

      //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 1000 segundos
      if (!isDev && !isAdmin && !isBuyer) {
        antiSpam[userId] = Math.floor(Date.now() / 1000) + 1000;
      }
      //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
      else if (isBuyer) {
        antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
      }
    } catch (error) {
      // let xerror = `*[ ✖️ ] Ha ocurrido* un error en la consulta. _La búsqueda_ no ha sido completada.`;
      `*[ ✖️ ] No se encontraron* casos para el *DNI* \`${dni}\`.`,
        console.log(error);
      await bot
        .deleteMessage(chatId, consultandoMessage.message_id)
        .then(() => {
          bot.sendMessage(chatId, xerror, messageOptions);
        });
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};

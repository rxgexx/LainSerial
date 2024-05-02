//APIS
const { dniElectronico } = require("../api/api_Persona.js");

//SE REQUIERE "path"
const path = require("path");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]dnie (.+)/, async (msg, match) => {
    //POLLING ERROR
    bot.on("polling_error", (error) => {
      console.error("Error en el bot de Telegram:", error);
    });

    // //BOT ANTI - BUG
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
    const isBuyer =
      rangosFilePath.BUYER && rangosFilePath.BUYER.includes(userId);

    const gruposPermitidos = require("../config/gruposManager/gruposPermitidos.js");
    const botInfo = await bot.getMe();
    const botMember = await bot
      .getChatMember(chatId, botInfo.id)
      .catch((err) => {
        console.log(
          "Error al obtener la información del Bot en el comando Acta Nacimiento: ",
          err
        );
      });
    const botIsAdmin = botMember.status === "administrator";

    //Si el chat lo usan de forma privada
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

    if (!botIsAdmin && typeChat === "group" && !isDev && !isBuyer) {
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
          `*[ ⏳ ] ${firstName},* debes esperar \`${tiempoRestante} segundos\` para volver a utilizar este comando.`,
          messageOptions
        );
        delete usuariosEnConsulta[userId];
        return;
      }
    }

    if (dni.length !== 8) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/dniv\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/dnie 07768359\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    const y = `*[ ⚙️ ] Construyendo* el \`DNI ELECTRÓNICO\` del *➜ DNI* \`${dni}\``;

    //Si todo se cumple, se iniciará con la consulta...
    const consultandoMessage = await bot.sendMessage(chatId, y, messageOptions);

    usuariosEnConsulta[userId] = true;

    try {
      const consultaStartTime = Date.now(); // Guardamos el tiempo de inicio de la consulta

      const responseDniVirtual = await dniElectronico(dni);

      //SI NO HAY FOTO
      const isFoto = responseDniVirtual.mensaje;

      if (isFoto === "No existe foto para el DNI consultado") {
        let xnofoto = `*[ ✖️ ] El DNI consultado* no cuenta con \`DATOS SUFICIENTES\` para *la construcción* del _dni virtual_.`;

        await bot
          .deleteMessage(chatId, consultandoMessage.message_id)
          .then(bot.sendMessage(chatId, xnofoto, messageOptions));

        return;
      }

      const listaAni = responseDniVirtual.datos;

      const {
        apeMaterno, // Apellido materno
        apePaterno, // Apellido paterno
        desDireccion, // Descripción de la dirección
        feEmision, // Fecha de emisión del documento
        feNacimiento, // Fecha de nacimiento
        nuDni, // Número de DNI
        preNombres, // Nombres
      } = listaAni;

      const caraDni = responseDniVirtual.frontal;
      const atrasDni = responseDniVirtual.atras;

      //TEXTO QUE ACOMPAÑARÁ AL DNI VIRTUAL
      let replyDni = `*[#LAIN-DOX 🌐] ➤ #DNIELECTRONICO*\n\n`;
      replyDni += `*[ ☑️ ] DNI ELECTRÓNICO*\n\n`;
      replyDni += `*➤ INF. PERSONA:*\n`;
      replyDni += `  \`⌞\` *DNI:* \`${nuDni}\`\n`;
      replyDni += `  \`⌞\` *NOMBRES:* \`${preNombres}\`\n`;
      replyDni += `  \`⌞\` *APELLIDOS:* \`${apePaterno}\` - \`${apeMaterno}\`\n`;
      replyDni += `  \`⌞\` *FECHA. EMISIÓN:* \`${feEmision}\`\n`;
      replyDni += `  \`⌞\` *FECHA. NACIMIENTO:* \`${feNacimiento}\`\n`;
      replyDni += `  \`⌞\` *DIRECCIÓN RENIEC:* \`${desDireccion}\`\n\n`;
      replyDni += `*➤ CONSULTADO POR:*\n`;
      replyDni += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
      replyDni += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      replyDni += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

      const mediaGroup = [];

      if (caraDni) {
        const caraDniFoto = caraDni.replace(/^data:image\/jpeg;base64,/, "");
        const fotoBuffer = Buffer.from(caraDniFoto, "base64");
        mediaGroup.push({ type: "photo", media: fotoBuffer });
      }

      if (atrasDni) {
        const atrasDniFoto = atrasDni.replace(/^data:image\/jpeg;base64,/, "");
        const fotoBuffer2 = Buffer.from(atrasDniFoto, "base64");
        mediaGroup.push({
          type: "photo",
          media: fotoBuffer2,
          caption: replyDni,
          parse_mode: "Markdown",
        });
      }

      await bot.deleteMessage(chatId, consultandoMessage.message_id);
      bot
        .sendMediaGroup(chatId, mediaGroup, {
          reply_to_message_id: msg.message_id,
        })
        .then(() => {
          //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 1000 segundos
          if (!isDev && !isAdmin && !isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 200;
          }
          //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
          else if (isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
          }
        })
        .catch((err) => {
          console.log("Error al envíar las imágenes: ", err.message);
        });
    } catch (error) {
      let xerror = `*[ 💤 ] Los servidores de RENIEC* andan apagados, no se ha *completado* la _búsqueda._`;
      console.log(error)
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

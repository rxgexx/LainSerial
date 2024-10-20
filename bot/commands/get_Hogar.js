//SE REQUIRE LAS APIS
const { apiHogar } = require("../api/api_Persona.js");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//MOMENTO
const moment = require("moment");

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]hogar (.+)/, async (msg, match) => {
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/hogar\`*]* seguido de un número de *DNI* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/hogar 44443333\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;
    try {
      const responseHogar = await apiHogar(dni);
      const datosHogar = responseHogar.response;

      if (datosHogar.PGH === "No existe registro.") {
        bot.sendMessage(
          chatId,
          `*[ ✖️ ] El DNI consultado* no se encuentra registrado en el PGH.`,
          messageOptions
        );
      } else {
        const integrantes = datosHogar.integrantes;
        const pgh = datosHogar.PGH;
        const fsu = datosHogar.FSU;

        //DATOS FSU
        const Fecha_de_empadronamiento = fsu.Fecha_de_empadronamiento;

        //DATOS PGH
        const Clasificación_socioeconómica = pgh.Clasificación_socioeconómica;
        const Departamento = pgh.Departamento;
        const Dirección = pgh.Dirección;
        const Distrito = pgh.Distrito;
        const Estado = pgh.Estado;
        const Provincia = pgh.Provincia;

        let res = `*[#LAIN-DOX 🌐] ➤ #HOGAR*\n\n`;

        res += `*- 🏠 - INFORMACIÓN. HOGAR\n\n*`;
        res += `  \`⌞\` *ESTADO:* \`${Estado}\`\n`;
        res += `  \`⌞\` *FECHA. EMPADRONAMIENTO:* \`${Fecha_de_empadronamiento}\`\n`;
        res += `  \`⌞\` *CLASIFICACIÓN SOCIOECONÓMICA:* \`${Clasificación_socioeconómica}\`\n`;
        res += `  \`⌞\` *DEPARTAMENTO:* \`${Departamento}\`\n`;
        res += `  \`⌞\` *PROVINCIA:* \`${Provincia}\`\n`;
        res += `  \`⌞\` *DISTRITO* \`${Distrito}\`\n`;
        res += `  \`⌞\` *DIRECCIÓN* \`${Dirección}\`\n\n`;

        // PERSONA CONSULTADA
        const consultado = datosHogar.consultado;

        res += `*- 👪 - INTEGRANTES. HOGAR\n\n*`;
        res += `*➜ La persona consultada es * \`${consultado}\`\n`;
        res += `*➜ Se han encontrado* \`${datosHogar.cantIntegrantes}\` _integrantes del hogar_ para el *DNI ${dni}.*\n\n`;

        function jefeTitular(jefe) {
          if (jefe === "Jefe") {
            return "Titular del Hogar";
          }
          return jefe;
        }

        console.log(integrantes.length);

        if (integrantes.length <= 10) {
          integrantes.forEach((dato, index) => {
            const numero = index + 1;
            const apeMaterno = dato.apMat;
            const apePaterno = dato.apPat;
            const feNacimiento = dato.fechaNacimiento;
            const nuDni = dato.nuDni;
            const preNombres = dato.preNombres;
            const relacion = jefeTitular(dato.relacion);

            res += `  \`⌞\` *NÚMERO:* \`${numero}\`\n`;
            res += `  \`⌞\` *N° DNI:* \`${nuDni}\`\n`;
            res += `  \`⌞\` *APELLIDOS:* \`${apePaterno} ${apeMaterno}\`\n`;
            res += `  \`⌞\` *NOMBRES:* \`${preNombres}\`\n`;
            res += `  \`⌞\` *FE. NACIMIENTO:* \`${feNacimiento}\`\n`;
            res += `  \`⌞\` *RELACIÓN:* \`${relacion}\`\n\n`;
          });

          res += `*➤ CONSULTADO POR:*\n`;
          res += `\`⌞\` *USUARIO:* \`${userId}\`\n`;
          res += `\`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
          res += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

          bot.sendMessage(chatId, res, messageOptions);

          //Se le agrega tiempos de spam si la consulta es exitosa, en este caso es de 60 segundos
          if (!isDev && !isAdmin && !isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 60;
          }
          //Se le agrega al rango comprador un tiempo de spam más corto, en este caso 30 segundos.
          else if (isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 40;
          }
        } else {
          // //TXT
          // const maxResultsToShow = 6;
          // //RESULTADOS QUE SE VAN A MOSTRAR CON EL TXT
          // const resultadosParaMostrar = dataNumeros.slice(0, maxResultsToShow);
          // const resultadosRestantes = dataNumeros.slice(maxResultsToShow);
        }
      }
    } catch (error) {
      let xerror = `*[ ✖️ ] Ha ocurrido* un error en la consulta. _La búsqueda_ no ha sido completada.`;
      console.log(error);

      bot.sendMessage(chatId, xerror, messageOptions);
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};

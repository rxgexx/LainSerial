const { apiPlaca, apiPlaca_2 } = require("../api/api_Variados");

//SE REQUIRE LAS APIS
const { validarOp, apiBitel } = require("../api/api_Telefonia.js");

//RANGOS
delete require.cache[require.resolve("../config/rangos/rangos.json")];
const rangosFilePath = require("../config/rangos/rangos.json");

//MANEJO ANTI - SPAM
const usuariosEnConsulta = {};
const antiSpam = {};

//MOMENTO
const moment = require("moment");
const { registrarConsulta } = require("../../sql/consultas.js");

//SE INICIA CON EL BOT
module.exports = (bot) => {
  bot.onText(/[\/.$?!]placa (.+)/, async (msg, match) => {
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
    const placa = match[1];
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
    if (placa.length !== 6) {
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/placa\`*]* seguido de una serie de *PLACA* de \`6 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/placa F5U597\`*]*\n\n`;

      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    //Agregar a los usuarios en un anti-spam temporal hasta que se cumpla la consulta
    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Consultando la* \`PLACA\` *➜* \`${placa}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    //SE LE PONE SPAM
    usuariosEnConsulta[userId] = true;

    try {
      // const response = await apiPlaca(placa);
      // const foto = response.base.img64;

      // const imgPlaca = foto.replace(/^data:image\/jpeg;base64,/, "");
      // const fotoBuffer = Buffer.from(imgPlaca, "base64");

      const res = await apiPlaca_2(placa);
      const response_2 = res.data.data_placa.dataSunarp;
      //console.log(response_2)
      //console.log(res.data.datosVehiculares.LPropietario[0])
      //Propietario
      const datos_propietario = response_2.LPropietario[0];
      //      console.log("datos vehiculares:", datos_propietario)
      const NombrePropietario = datos_propietario.NombrePropietario;
      const TipoPartic = datos_propietario.TipoPartic;
      const TipoDocumento = datos_propietario.TipoDocumento;
      const NroDocumento = datos_propietario.NroDocumento;
      const FechaPropiedad = datos_propietario.FechaPropiedad;
      const Direccion = datos_propietario.Direccion;

      //Detalles del vehículo
      const detalles_vehiculo = response_2;

      const numPartida = detalles_vehiculo.numPartida;
      const anMode = detalles_vehiculo.anMode;
      const fecIns = detalles_vehiculo.fecIns;
      const descTipoCarr = detalles_vehiculo.descTipoCarr;
      const marca = detalles_vehiculo.marca;
      const modelo = detalles_vehiculo.modelo;
      const anoFab = detalles_vehiculo.anoFab;
      const descTipoComb = detalles_vehiculo.descTipoComb;
      const numCilindros = detalles_vehiculo.numCilindros;
      const color = detalles_vehiculo.color;
      const numMotor = detalles_vehiculo.numMotor;
      const numSerie = detalles_vehiculo.numSerie;
      const descTipoUso = detalles_vehiculo.descTipoUso;
      const numRuedas = detalles_vehiculo.numRuedas;
      const numPasajeros = detalles_vehiculo.numPasajeros;
      const numAsientos = detalles_vehiculo.numAsientos;
      const longitud = detalles_vehiculo.longitud;
      const altura = detalles_vehiculo.altura;
      const ancho = detalles_vehiculo.ancho;
      const estado = detalles_vehiculo.estado;

      let mssg = `*[#LAIN-DOX 🌐] ➤ #PLACAS*\n\n`;
      mssg += `*[ ☑️ ] BÚSQUEDA DE PLACA -* \`${placa}\` *- *\n\n`;
      mssg += `*➤ PROPIETARIO:*\n`;
      mssg += `  \`⌞\` *NOMBRE:* \`${NombrePropietario}\`\n`;
      mssg += `  \`⌞\` *TIPO. PARTIDA:* \`${TipoPartic}\`\n`;
      mssg += `  \`⌞\` *TIPO. DOCUMENTO:* \`${TipoDocumento}\`\n`;
      mssg += `  \`⌞\` *NÚMERO. DOCUMENTO:* \`${NroDocumento}\`\n`;
      mssg += `  \`⌞\` *FECHA. PROPIEDAD:* \`${FechaPropiedad}\`\n`;
      mssg += `  \`⌞\` *DIRECCIÓN:* \`${Direccion}\`\n\n`;
      mssg += `*➤ DETALLES DEL VEHÍCULO:*\n\n`;
      mssg += `*NÚMERO. PARTIDA:* \`${numPartida}\`\n`;
      mssg += `*AÑO. MODELO:* \`${anMode}\`\n`;
      mssg += `*FECHA. INSCRIPCIÓN:* \`${fecIns}\`\n`;
      mssg += `*DESCRIPCIÓN TIPO CARR:* \`${descTipoCarr}\`\n`;
      mssg += `*MARCA:* \`${marca}\`\n`;
      mssg += `*MODELO:* \`${modelo}\`\n`;
      mssg += `*AÑO DE FABRICACIÓN:* \`${anoFab}\`\n`;
      mssg += `*TIPO DE COMBUSTIBLE:* \`${descTipoComb}\`\n`;
      mssg += `*NÚMERO DE CILINDROS:* \`${numCilindros}\`\n`;
      mssg += `*COLOR:* \`${color}\`\n`;
      mssg += `*NÚMERO DE MOTOR:* \`${numMotor}\`\n`;
      mssg += `*NÚMERO DE SERIE:* \`${numSerie}\`\n`;
      mssg += `*TIPO DE USO:* \`${descTipoUso}\`\n`;
      mssg += `*NÚMERO DE RUEDAS:* \`${numRuedas}\`\n`;
      mssg += `*NÚMERO DE PASAJEROS:* \`${numPasajeros}\`\n`;
      mssg += `*NÚMERO DE ASIENTOS:* \`${numAsientos}\`\n`;
      mssg += `*LONGITUD:* \`${longitud}\`\n`;
      mssg += `*ALTURA:* \`${altura}\`\n`;
      mssg += `*ANCHO:* \`${ancho}\`\n`;
      mssg += `*ESTADO:* \`${estado}\`\n\n`;

      mssg += `*➤ CONSULTADO POR:*\n`;
      mssg += `  \`⌞\` *USUARIO:* \`${userId}\`\n`;
      mssg += `  \`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      mssg += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

      const foto = res.data.img_placa;
      const fotoData = foto.replace(/^data:image\/jpeg;base64,/, "");
      const fotoBuffer = Buffer.from(fotoData, "base64");

      await bot
        .deleteMessage(chatId, consultandoMessage.message_id)
        .then(async () => {
          bot.sendPhoto(chatId, fotoBuffer, {
            caption: mssg,
            reply_to_message_id: msg.message_id,
            parse_mode: "Markdown",
          });

          await registrarConsulta(userId, firstName, `PLACA`, placa, true);
        });
    } catch (error) {
      let xerror = `*[ ✖️ ] Ha ocurrido* un error en la consulta. _La búsqueda_ no ha sido completada.`;
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

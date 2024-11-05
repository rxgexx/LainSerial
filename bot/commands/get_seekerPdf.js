// const fs = require("fs");
// const PDFDocument = require("pdfkit");
// const path = require("path");

// const dataStorage = {};

// // Rutas y datos
// const { seekerpdf } = require("../api/api_Persona.js");
// const rangosFilePath = require("../config/rangos/rangos.json");

// // Manejo anti-spam
// const usuariosEnConsulta = {};
// const antiSpam = {};

// const img = path.join(__dirname, "../img/seeker.jpg");
// const dirDoc = path.join(__dirname, "../../fichasDocuments/seekerpdf");

// // ALMACENAR LOS MENSAJES ID
// const comandoInvocado = {};
// let messageId;

// let buttonId;

// // Se define dirBase fuera del módulo para que sea accesible globalmente
// let dirBase = "";
// let dni;

// module.exports = (bot) => {
//   bot.onText(/[\/.$?!]seeker (.+)/, async (msg, match) => {
//     // Manejo de errores de polling
//     bot.on("polling_error", (error) => {
//       console.error("Error en el bot de Telegram:", error);
//     });

//     // Ayudas rápidas
//     dni = match[1];
//     const chatId = msg.chat.id;
//     const userId = msg.from.id;
//     const typeChat = msg.chat.type;
//     const groupName = msg.chat.title;
//     const firstName = msg.from.first_name;
//     const messageOptions = {
//       reply_to_message_id: msg.message_id,
//       parse_mode: "Markdown",
//     };

//     // BOTON - CFG
//     messageId = msg.message_id; // PRIMER MSG - ID
//     // console.log("PRIMER ID DE MENSAJE...", messageId);

//     comandoInvocado[userId] = messageId + 1;

//     // Verificación de rangos
//     const isDev = rangosFilePath.DEVELOPER.includes(userId);
//     const isAdmin = rangosFilePath.ADMIN.includes(userId);
//     const { checkIsBuyer } = require("../../sql/checkbuyer");
//     //Rango Comprador
//     const isBuyer = await checkIsBuyer(userId);


//     const gruposPermitidos = require("../config/gruposManager/gruposPermitidos.js");
//     const gruposBloqueados = require("../config/gruposManager/gruposBloqueados.js");

//     const grupoBloqueado = gruposBloqueados.includes(chatId);

//     if (grupoBloqueado) {
//       try {
//         if (isDev) {
//           let messageAdmin = `*[ ☑️ ] La prueba ha sido exitosa* querida administradora.`;
//           bot.sendMessage(chatId, messageAdmin, messageOptions).then(() => {
//             console.log("Test Positivo");
//           });
//           return;
//         } else {
//           let grupoBloqueado = `*[ ✖️ ] Grupo bloqueado*`;
//           bot.sendMessage(chatId, grupoBloqueado, messageOptions).then(() => {
//             console.log("Grupo bloqueado");
//           });
//           return;
//         }
//       } catch (error) {
//         console.log("Error en la detección de grupo bloqueado: ", error);
//       }
//     }

//     const botInfo = await bot.getMe();
//     const botMember = await bot
//       .getChatMember(chatId, botInfo.id)
//       .catch((err) => {
//         console.log(
//           "Error al obtener la información del Bot en el comando Ficha Azul: ",
//           err
//         );
//       });
//     const botIsAdmin = botMember.status === "administrator";

//     if (typeChat === "private" && !isDev && !isBuyer) {
//       let x = `*[ ✖️ ] Uso privado* deshabilitado en mi *fase - beta.*`;
//       bot
//         .sendMessage(chatId, x, messageOptions)
//         .then(() => {
//           console.log(
//             `El usuario ${userId} con nombre ${firstName} ha intentado usarme de forma privada.`
//           );
//         })
//         .catch((err) => {
//           console.log(
//             `Error al mandar el mensaje "no uso-privado: `,
//             err.message
//           );
//         });
//       return;
//     }

//     if (!botIsAdmin && typeChat === "group" && !isDev) {
//       let noAdmin = `*[ 💤 ] Dormiré* hasta que no me hagan *administradora* _zzz 😴_`;
//       bot.sendMessage(chatId, noAdmin, messageOptions);
//       return;
//     }

//     if (!gruposPermitidos.includes(chatId) && !isAdmin && !isDev && !isBuyer) {
//       bot
//         .sendMessage(
//           chatId,
//           `*[ ✖️ ] Este grupo* no ha sido *autorizado* para mi uso.`,
//           messageOptions
//         )
//         .then(() => {
//           console.log(
//             `Se ha añadido e intentado usar el bot en el grupo con ID ${chatId} y NOMBRE ${groupName}`
//           );
//           let noGrupo = `*[ 🔌 ] Se me han querido usar* en este grupo:\n\n`;
//           noGrupo += `*-👥:* \`${groupName}\`\n`;
//           noGrupo += `*-🆔:* \`${chatId}\`\n`;

//           if (botIsAdmin) {
//             bot
//               .exportChatInviteLink(chatId)
//               .then((inviteLink) => {
//                 if (inviteLink) {
//                   noGrupo += `*-🔗:* ${inviteLink}\n`;
//                 }
//                 return bot.sendMessage(6484858971, noGrupo, {
//                   parse_mode: "Markdown",
//                   disable_web_page_preview: true,
//                 });
//               })
//               .catch((error) => {
//                 console.log(
//                   "Error al obtener el enlace de invitación del grupo: ",
//                   error.message
//                 );
//               });
//           } else {
//             return bot.sendMessage(6484858971, noGrupo, {
//               parse_mode: "Markdown",
//               disable_web_page_preview: true,
//             });
//           }
//         })
//         .catch((error) => {
//           console.log(
//             "Error al enviar el mensaje de grupo no autorizado: ",
//             error.message
//           );
//         });
//       return;
//     }

//     if (!isDev && !isAdmin) {
//       const tiempoEspera = antiSpam[userId] || 0;
//       const tiempoRestante = Math.max(
//         0,
//         tiempoEspera - Math.floor(Date.now() / 1000)
//       );
//       if (tiempoRestante > 0) {
//         bot.sendMessage(
//           chatId,
//           `*[ ⏳ ] ${firstName},* debes esperar \`${tiempoRestante} segundos\` para volver a utilizar este comando.`,
//           messageOptions
//         );
//         delete usuariosEnConsulta[userId];
//         return;
//       }
//     }

//     if (dni.length !== 8) {
//       let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/seeker\`*]* seguido de un número de *dni* de \`8 dígitos\`\n\n`;
//       replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/seeker 44443333\`*]*\n\n`;
//       bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
//       return;
//     }

//     if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
//       console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
//       return;
//     }

//     // Si todo se cumple, se iniciará con la consulta...
//     let yx = `*[ 💬 ] Buscando* \`DATA GENERAL\` en *SEEKER del* *➜ DNI* \`${dni}\``;
//     const consultandoMessage = await bot.sendMessage(
//       chatId,
//       yx,
//       messageOptions
//     );

//     usuariosEnConsulta[userId] = true;

//     try {
//       const datos = await seekerpdf(dni);

//       // Datos obtenidos
//       const pdf = datos.data.pdfSeeker;

//       const pdfdata = pdf.replace(/^data:image\/jpeg;base64,/, "");
//       const pdfbuffer = Buffer.from(pdfdata, "base64");

//       //PROPIETARIO

//       const dataPersona = datos.data;

//       const direccion = dataPersona.direccion;
//       const edad = dataPersona.edad;
//       const estadoCivil = dataPersona.estadoCivil;
//       const fechaNacimiento = dataPersona.fechaNacimiento;
//       const nombreCompleto = dataPersona.nombreCompleto;
//       const nuDni = dataPersona.nuDni;
//       const padre = dataPersona.padre;
//       const sexo = dataPersona.sexo;
//       const ubicacion = dataPersona.ubicacion;
//       const madre = dataPersona.madre;

//       // Datos dni

//       let caption = `*[#LAIN-DOX 🌐] ➤ #SEEKERPDF*\n\n`;

//       caption += `*[ ☑️ ] SEEKER TIME REAL -* \`${dni}\` *-🧖🏻‍♀️*\n\n`;

//       caption += `*➤ PERSONA:*\n`;
//       caption += `  \`⌞\` *NOMBRE:* \`${nombreCompleto}\`\n`;
//       caption += `  \`⌞\` *DOCUMENTO:* \`${nuDni}\`\n`;
//       caption += `  \`⌞\` *NOMBRE. PADRE:* \`${padre}\`\n`;
//       caption += `  \`⌞\` *NOMBRE. MADRE:* \`${madre}\`\n`;
//       caption += `  \`⌞\` *DETALLE UBIGEO:* \`${ubicacion
//         .replace("Ubicación:", "")
//         .trim()}\`\n`;
//       caption += `  \`⌞\` *DIRECCION EXACTA:* \`${direccion
//         .replace("Dirección:", "")
//         .trim()}\`\n\n`;

//       caption += `*➤ CONSULTADO POR:*\n`;
//       caption += `\`⌞\` *USUARIO:* \`${userId}\`\n`;
//       caption += `\`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
//       caption += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

//       // Crea el directorio si no existe
//       if (!fs.existsSync(dirDoc)) {
//         fs.mkdirSync(dirDoc, { recursive: true });
//       }

//       // Define la ruta del archivo de forma única usando el message_id o un timestamp
//       const timestamp = Date.now();
//       const uniqueFilePath = path.join(
//         dirDoc,
//         `seekerData_${dni}_${timestamp}.pdf`
//       );

//       // Guarda el PDF en el sistema de archivos
//       fs.writeFileSync(uniqueFilePath, pdfbuffer);

//       // Envía el documento con la ruta única
//       await bot.deleteMessage(chatId, consultandoMessage.message_id);
//       bot
//         .sendDocument(chatId, uniqueFilePath, {
//           caption: caption,
//           reply_to_message_id: msg.message_id,
//           parse_mode: "Markdown",
//           thumb: img,
//         })
//         .then(() => {
//           if (!isDev && !isAdmin && !isBuyer) {
//             antiSpam[userId] = Math.floor(Date.now() / 1000) + 150;
//           } else if (isBuyer) {
//             antiSpam[userId] = Math.floor(Date.now() / 1000) + 100;
//           }
//         });
//     } catch (error) {
//       let xerror = `*[ ✖️ ] No se ha encontrado* DATA para el DNI.`;
//       await bot.deleteMessage(chatId, consultandoMessage.message_id);

//       bot.sendMessage(chatId, xerror, messageOptions);
//     } finally {
//       delete usuariosEnConsulta[userId];
//     }
//   });
// };


//* SEEKER NIGHT

const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require("path");

const dataStorage = {};

// Rutas y datos
const { seekerpdf } = require("../api/api_Persona.js");
const rangosFilePath = require("../config/rangos/rangos.json");

// Manejo anti-spam
const usuariosEnConsulta = {};
const antiSpam = {};

const img = path.join(__dirname, "../img/seeker.jpg");
const dirDoc = path.join(__dirname, "../../fichasDocuments/seekerpdf");

// ALMACENAR LOS MENSAJES ID
const comandoInvocado = {};
let messageId;

let buttonId;

// Se define dirBase fuera del módulo para que sea accesible globalmente
let dirBase = "";
let dni;

module.exports = (bot) => {
  bot.onText(/[\/.$?!]seeker (.+)/, async (msg, match) => {
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
      let replyToUsoIncorrecto = `*[ ✖️ ] Uso incorrecto*, utiliza *[*\`/seeker\`*]* seguido de un número de *dni* de \`8 dígitos\`\n\n`;
      replyToUsoIncorrecto += `*➜ EJEMPLO:* *[*\`/seeker 44443333\`*]*\n\n`;
      bot.sendMessage(chatId, replyToUsoIncorrecto, messageOptions);
      return;
    }

    if (usuariosEnConsulta[userId] && !isDev && !isAdmin) {
      console.log(`El usuario ${msg.from.first_name} anda haciendo spam`);
      return;
    }

    // Si todo se cumple, se iniciará con la consulta...
    let yx = `*[ 💬 ] Buscando* \`DATA GENERAL\` en *SEEKER del* *➜ DNI* \`${dni}\``;
    const consultandoMessage = await bot.sendMessage(
      chatId,
      yx,
      messageOptions
    );

    usuariosEnConsulta[userId] = true;

    try {
      const datos = await seekerpdf(dni);

      // Datos obtenidos
      const pdf = datos.preview ;

      const pdfdata = pdf.replace(/^data:image\/jpeg;base64,/, "");
      const pdfbuffer = Buffer.from(pdfdata, "base64");

      //PROPIETARIO

      const dataPersona = datos.daSource;
      
      const direccion = dataPersona.desDireccion;
      const nombreCompleto = dataPersona.nombreCompleto;
      const nuDni = dataPersona.nuDni;
      const padre = dataPersona.nomPadre;
      const ubicacion = dataPersona.ubiDireccion;
      const madre = dataPersona.nomMadre;

      // Datos dni

      let caption = `*[#LAIN-DOX 🌐] ➤ #SEEKERPDF*\n\n`;

      caption += `*[ ☑️ ] SEEKER TIME REAL -* \`${dni}\` *-🧖🏻‍♀️*\n\n`;

      caption += `*➤ PERSONA:*\n`;
      caption += `  \`⌞\` *NOMBRE:* \`${nombreCompleto}\`\n`;
      caption += `  \`⌞\` *DOCUMENTO:* \`${nuDni}\`\n`;
      caption += `  \`⌞\` *NOMBRE. PADRE:* \`${padre}\`\n`;
      caption += `  \`⌞\` *NOMBRE. MADRE:* \`${madre}\`\n`;
      caption += `  \`⌞\` *DETALLE UBIGEO:* \`${ubicacion
        .replace("Ubicación:", "")
        .trim()}\`\n`;
      caption += `  \`⌞\` *DIRECCION EXACTA:* \`${direccion
        .replace("Dirección:", "")
        .trim()}\`\n\n`;

      caption += `*➤ CONSULTADO POR:*\n`;
      caption += `\`⌞\` *USUARIO:* \`${userId}\`\n`;
      caption += `\`⌞\` *NOMBRE:* \`${firstName}\`\n\n`;
      caption += `*MENSAJE:* _La consulta se hizo de manera exitosa ♻._\n\n`;

      // Crea el directorio si no existe
      if (!fs.existsSync(dirDoc)) {
        fs.mkdirSync(dirDoc, { recursive: true });
      }

      // Define la ruta del archivo de forma única usando el message_id o un timestamp
      const timestamp = Date.now();
      const uniqueFilePath = path.join(
        dirDoc,
        `seekerData_${dni}_${timestamp}.pdf`
      );

      // Guarda el PDF en el sistema de archivos
      fs.writeFileSync(uniqueFilePath, pdfbuffer);

      // Envía el documento con la ruta única
      await bot.deleteMessage(chatId, consultandoMessage.message_id);
      bot
        .sendDocument(chatId, uniqueFilePath, {
          caption: caption,
          reply_to_message_id: msg.message_id,
          parse_mode: "Markdown",
          thumb: img,
        })
        .then(() => {
          if (!isDev && !isAdmin && !isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 150;
          } else if (isBuyer) {
            antiSpam[userId] = Math.floor(Date.now() / 1000) + 100;
          }
        });
    } catch (error) {
      let xerror = `*[ ✖️ ] No se ha encontrado* DATA para el DNI.`;
      await bot.deleteMessage(chatId, consultandoMessage.message_id);

      bot.sendMessage(chatId, xerror, messageOptions);
    } finally {
      delete usuariosEnConsulta[userId];
    }
  });
};

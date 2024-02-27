//MENSAJES
const messages = {
  inicioCommands: (firsName) => {
    let inicioCommands = `*Bienvenido al panel de comandos ${firsName},* desde acá podrás navegar y utilizar de *una mejor manera el Bot.*\n\n`;
    inicioCommands += `*Cada comando* se ha _puesto_ en \`secciones\` para que la navegación sea la mejor 🚀`;
    return inicioCommands;
  },

  //RENIEC COMMANDS
  botonesReniec_1: () => {
    let botonesReniec_1 = `*[PÁGINA 1/𝟸]*\n\n`;
    botonesReniec_1 += `*➤ 𝙳𝙰𝚃𝙾𝚂 𝚁𝙴𝙽𝙸𝙴𝙲 - 🇵🇪 ↴*\n`;
    botonesReniec_1 += `*↯ - 𝗨𝗦𝗢:* _/dnix 78634161_ ➜ Usa el comando *(*\`/dnix\`*)* seguido de un *número de DNI.*\n`;
    botonesReniec_1 += `*↯ - 𝗗𝗘𝗦𝗖:* _Obtén_ \`foto, huellas, firma e información\` de una persona utilizando su *DNI.*\n`;
    botonesReniec_1 += `*↯ - 𝗦𝗣𝗔𝗠:* Se agrega un _anti - spam_ de \`75 segundos\` después de una *respuesta exitosa.*\n\n`;

    botonesReniec_1 += `*➤ 𝙱𝚄𝚂𝚀𝚄𝙴𝙳𝙰 𝙿𝙾𝚁 𝙽𝙾𝙼𝙱𝚁𝙴𝚂 - 🇵🇪 ↴*\n`;
    botonesReniec_1 += `*↯ - 𝗨𝗦𝗢:* _/nm nombre1 -nombre2-|apellidoPa|apellidoMa_ ➜ Usa el comando *(*\`/nm\`*)* seguido de los *nombres a buscar*\n`;
    botonesReniec_1 += `*↯ - 𝗗𝗘𝗦𝗖:* _Busca_ \`personas\` con sus *nombres*\n`;
    botonesReniec_1 += `*↯ - 𝗦𝗣𝗔𝗠:* Se agrega un _anti - spam_ de \`75 segundos\` después de una *respuesta exitosa.*\n\n`;

    return botonesReniec_1;
  },

  botonesReniec_2: () => {
    let botonesReniec_2 = `*[PÁGINA 𝟸/𝟸]*\n\n`;
    botonesReniec_2 += `*➤ 𝙰𝙲𝚃𝙰 𝙳𝙴 𝙽𝙰𝙲𝙸𝙼𝙸𝙴𝙽𝚃𝙾 - 🇵🇪 ↴*\n`;
    botonesReniec_2 += `*↯ - 𝗨𝗦𝗢:* _/fxnaci 07768359_ ➜ Usa el comando *(*\`/fxnaci\`*)* seguido de un *número de DNI.*\n`;
    botonesReniec_2 += `*↯ - 𝗗𝗘𝗦𝗖:* _Obtén_ \`la acta de nacimiento\` *original* de una persona utilizando su *DNI.*\n`;
    botonesReniec_2 += `*↯ - 𝗦𝗣𝗔𝗠:* Se agrega un _anti - spam_ de \`𝟷𝟸𝟹20 segundos\` después de una *respuesta exitosa.*\n\n`;

    botonesReniec_2 += `*➤ 𝙰𝙲𝚃𝙰 𝙳𝙴 𝙳𝙴𝙵𝚄𝙽𝙲𝙸Ó𝙽 - 🇵🇪 ↴*\n`;
    botonesReniec_2 += `*↯ - 𝗨𝗦𝗢:* _/fxdefu 07768359_ ➜ Usa el comando *(*\`/fxdefu\`*)* seguido de un *número de DNI.*\n`;
    botonesReniec_2 += `*↯ - 𝗗𝗘𝗦𝗖:* _Obtén_ \`la acta de defunción\` *original* de una persona utilizando su *DNI.*\n`;
    botonesReniec_2 += `*↯ - 𝗦𝗣𝗔𝗠:* Se agrega un _anti - spam_ de \`120 segundos\` después de una *respuesta exitosa.*\n\n`;

    botonesReniec_2 += `*➤ 𝙰𝙲𝚃𝙰 𝙳𝙴 𝙼𝙰𝚃𝚁𝙸𝙼𝙾𝙽𝙸𝙾 - 🇵🇪 ↴*\n`;
    botonesReniec_2 += `*↯ - 𝗨𝗦𝗢:* _/fxmat 07768359_ ➜ Usa el comando *(*\`/fxmat\`*)* seguido de un *número de DNI.*\n`;
    botonesReniec_2 += `*↯ - 𝗗𝗘𝗦𝗖:* _Obtén_ \`la acta de matrimonio(s)\` *original* de una persona utilizando su *DNI.*\n`;
    botonesReniec_2 += `*↯ - 𝗦𝗣𝗔𝗠:* Se agrega un _anti - spam_ de \`120 segundos\` después de una *respuesta exitosa.*\n\n`;

    return botonesReniec_2;
  },

  //MENSAJE START
  startMessages: (firstName) => {
    let startMessage = `*Bienvenido a Lain Serial, ${firstName},* para que _puedas usarme_ necesitas comprar *una membresía o estar en un grupo donde mi uso esté habilitado.*\n\n`;
    startMessage += `*RECUERDA 💡:* \`La membresía\` dura 1 mes, y se renueva mensualmente.\n\n`;
    startMessage += `*Compra tu membresía* haciendo _click al botón_ de abajo 🚀`;

    return startMessage;
  },
};

module.exports = { messages };

/**
 * ============================================================================
 * ⚜️ BOT DISCORD 01 • SISTEMA EXCLUSIVO DE REGISTRO & CARGOS ⚜️
 * FAMÍLIA NABRIZA & AMIGOS (VERSÃO ATUALIZADA PARA RAILWAY / NODE.JS)
 * ============================================================================
 */

try {
    require('dotenv').config();
} catch (_) {}

const http = require('http');
const {
    Client,
    GatewayIntentBits,
    Partials,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Events,
    ChannelType,
    PermissionsBitField
} = require('discord.js');

// 🛡️ SISTEMA ANTI-CRASH PROFISSIONAL
process.on('unhandledRejection', (reason, promise) => {
    console.error('🛡️ [ANTI-CRASH] Rejeição interceptada:', reason);
});
process.on('uncaughtException', (err, origin) => {
    console.error(`🛡️ [ANTI-CRASH] Exceção interceptada (${origin}):`, err.message || err);
});
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error(`🛡️ [ANTI-CRASH Monitor] Erro:`, err.message || err);
});

// ⚙️ CONFIGURAÇÃO CENTRALIZADA
const CONFIG = {
    token: process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.trim() : "",
    guildId: process.env.GUILD_ID ? process.env.GUILD_ID.trim() : null,
    nomeServidor: process.env.NOME_SERVIDOR || "Família & Amigos",
    corEmbed: "#D4AF37", // Dourado
    corChefe: "#FFD700", // Ouro

    // Tag Oficial da Família (Agora [NaBriza])
    tagFamilia: "[NaBriza]",
    tagAmigos: "[AMIGO]",

    // IDs de Cargos (Configuráveis via Railway Variables)
    cargoChefeId: process.env.CARGO_CHEFE_ID ? process.env.CARGO_CHEFE_ID.trim() : null,
    cargoFamiliaId: process.env.CARGO_FAMILIA_ID ? process.env.CARGO_FAMILIA_ID.trim() : "1546736138918694983",
    cargoAmigosId: process.env.CARGO_AMIGOS_ID ? process.env.CARGO_AMIGOS_ID.trim() : "1546736135965904926",
    cargoNaoRegistradoId: process.env.CARGO_NAO_REGISTRADO_ID ? process.env.CARGO_NAO_REGISTRADO_ID.trim() : "1515125826780135480",

    // Canal onde a Staff avalia as fichas
    canalAprovacaoId: process.env.CANAL_APROVACAO_ID ? process.env.CANAL_APROVACAO_ID.trim() : null,

    // Porta HTTP para Health Check da Railway
    port: process.env.PORT || 3000
};

// 🌐 SERVIDOR HTTP LEVE PARA HEALTH CHECK DA RAILWAY
let client = null;
const server = http.createServer((req, res) => {
    const isReady = client && client.isReady();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        sistema: 'Bot de Registro - Família NaBriza & Amigos',
        tagFamilia: CONFIG.tagFamilia,
        status: isReady ? 'online' : 'iniciando',
        bot: client?.user ? client.user.tag : 'Iniciando...',
        servidores: client?.guilds?.cache?.size || 0,
        uptime: Math.floor(process.uptime()),
        horarioBrasilia: getHorarioBrasiliaFormatado()
    }));
});

server.listen(CONFIG.port, () => {
    console.log(`🌐 [RAILWAY HTTP] Escutando na porta ${CONFIG.port}`);
});

function getHorarioBrasilia() {
    const agora = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false
    });
    const parts = formatter.formatToParts(agora);
    let hora = 0, minuto = 0, segundo = 0;
    for (const p of parts) {
        if (p.type === 'hour') hora = parseInt(p.value, 10);
        if (p.type === 'minute') minuto = parseInt(p.value, 10);
        if (p.type === 'second') segundo = parseInt(p.value, 10);
    }
    const dataFormatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return { hora, minuto, segundo, dataStr: dataFormatter.format(agora) };
}

function getHorarioBrasiliaFormatado() {
    const { hora, minuto, segundo, dataStr } = getHorarioBrasilia();
    return `${dataStr} ${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:${String(segundo).padStart(2, '0')} (Brasília)`;
}

client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,      // Ative no Developer Portal
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent     // Ative no Developer Portal
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

// 📜 PAINEL OFICIAL DE REGISTRO
function gerarPainelEscolhaCargos() {
    const embed = new EmbedBuilder()
        .setColor(CONFIG.corEmbed)
        .setTitle('╔══════════════════════════════════════════════╗\n║     ⚜️ REGISTRO OFICIAL DE CARGOS ⚜️         ║\n║             FAMÍLIA & AMIGOS                 ║\n╚══════════════════════════════════════════════╝')
        .setDescription(
            '👋 **Seja muito bem-vindo(a) ao servidor Família & Amigos!**\n\n' +
            'Para liberar o acesso aos canais de texto, jogos, bate-papo e salas de voz, escolha a sua categoria:\n\n' +
            '⚜️ **1. FAMÍLIA NABRIZA [NaBriza]**\n' +
            '> Membro oficial da Família NaBriza. Libera canais exclusivos da Família, reuniões e eventos.\n\n' +
            '🤝 **2. AMIGOS DA FAMÍLIA [AMIGO]**\n' +
            '> Amigo, aliado e parceiro para jogar GTA RP, resenhar e curtir as calls abertas.\n\n' +
            '──────────────────────────────────────────\n' +
            '📌 **COMO FUNCIONA O CADASTRO:**\n' +
            '1️⃣ Clique no botão correspondente abaixo (**Família** ou **Amigo**).\n' +
            '2️⃣ Preencha o formulário rápido com seu Nick RP e respostas.\n' +
            '3️⃣ A Staff avaliará sua ficha no canal privado de aprovação.\n' +
            '4️⃣ Sendo aprovado, seu cargo é entregue na hora e seu nick é atualizado com a tag!\n\n' +
            '👇 *Clique no botão abaixo para iniciar seu cadastro:*'
        )
        .setFooter({ text: 'Família & Amigos • Lealdade, União e Respeito ⚜️' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_iniciar_familia')
            .setLabel('Entrar na Família [NaBriza]')
            .setEmoji('⚜️')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('btn_iniciar_amigos')
            .setLabel('Entrar como Amigo [AMIGO]')
            .setEmoji('🤝')
            .setStyle(ButtonStyle.Success)
    );

    return { embeds: [embed], components: [row] };
}

function gerarCardRegistroMembro(user) {
    const embed = new EmbedBuilder()
        .setColor(CONFIG.corEmbed)
        .setTitle('⚜️ REGISTRO OFICIAL • FAMÍLIA NABRIZA & AMIGOS ⚜️')
        .setDescription(
            `Olá ${user ? `<@${user.id}>` : 'Membro'}! Seja bem-vindo(a) ao nosso servidor!\n\n` +
            'Escolha a sua categoria para liberar os canais:\n\n' +
            '⚜️ **1. FAMÍLIA NABRIZA [NaBriza]** (Tag `[NaBriza]` no Nick)\n' +
            '🤝 **2. AMIGOS DA FAMÍLIA [AMIGO]** (Tag `[AMIGO]` no Nick)\n\n' +
            '👇 *Clique no botão para preencher sua ficha:*'
        )
        .setFooter({ text: 'Família & Amigos • Lealdade, União e Respeito ⚜️' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_iniciar_familia')
            .setLabel('Entrar na Família [NaBriza]')
            .setEmoji('⚜️')
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('btn_iniciar_amigos')
            .setLabel('Entrar como Amigo [AMIGO]')
            .setEmoji('🤝')
            .setStyle(ButtonStyle.Success)
    );

    return { embeds: [embed], components: [row] };
}

client.once(Events.ClientReady, async (c) => {
    console.log(`🟢 [BOT ONLINE] Conectado como: ${c.user.tag}`);
    console.log(`🏷️ Tag Oficial: ${CONFIG.tagFamilia}`);
    c.user.setPresence({
        activities: [{ name: "⚜️ Família NaBriza | /registro | !ajuda", type: 3 }],
        status: "online"
    });
});

/**
 * 👤 Evento: Novo Membro Entra no Servidor
 * ✅ O bot NÃO manda mensagem no chat ao entrar uma pessoa!
 * ✅ Apenas entrega o cargo de 'Não Registrado' em silêncio.
 */
client.on(Events.GuildMemberAdd, async (member) => {
    try {
        console.log(`[NOVO MEMBRO SILENCIOSO] ${member.user.tag} (${member.id}) entrou no servidor.`);

        let roleNaoReg = member.guild.roles.cache.get(CONFIG.cargoNaoRegistradoId) ||
                         member.guild.roles.cache.find(r => r.name.includes('Não Registrado'));
        if (roleNaoReg) {
            await member.roles.add(roleNaoReg).catch(err => {
                console.error('Erro ao entregar cargo Não Registrado:', err.message);
            });
        }
        // NENHUMA MENSAGEM É ENVIADA QUANDO A PESSOA ENTRA!
    } catch (err) {
        console.error('Erro no guildMemberAdd:', err.message);
    }
});

// ⚡ INTERAÇÕES: MODAL, ENVIO E APROVAÇÃO PELA STAFF
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        // Abrir Modal
        if (interaction.isButton() && interaction.customId === 'btn_iniciar_familia') {
            const modal = new ModalBuilder().setCustomId('modal_familia').setTitle('Ficha: Família NaBriza [NaBriza]');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nome').setLabel('Seu Nome / Nick RP:').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('idade').setLabel('Sua Idade:').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p1').setLabel('Quem te convidou?').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p2').setLabel('Concorda em honrar a tag [NaBriza]?').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        if (interaction.isButton() && interaction.customId === 'btn_iniciar_amigos') {
            const modal = new ModalBuilder().setCustomId('modal_amigos').setTitle('Ficha: Amigos da Família [AMIGO]');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nome').setLabel('Seu Nome / Nick RP:').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('idade').setLabel('Sua Idade:').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p1').setLabel('De quem você é amigo na Família?').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p2').setLabel('Quais jogos costuma jogar?').setStyle(TextInputStyle.Paragraph).setRequired(true))
            );
            return await interaction.showModal(modal);
        }

        // Envio do formulário preenchido (SÓ AQUI MANDA MENSAGEM PARA APROVAR/REPROVAR)
        if (interaction.isModalSubmit() && (interaction.customId === 'modal_familia' || interaction.customId === 'modal_amigos')) {
            await interaction.deferReply({ ephemeral: true }).catch(() => {});

            const isFam = interaction.customId === 'modal_familia';
            const nome = interaction.fields.getTextInputValue('nome');
            const idade = interaction.fields.getTextInputValue('idade');
            const p1 = interaction.fields.getTextInputValue('p1');
            const p2 = interaction.fields.getTextInputValue('p2');

            let canalStaff = null;
            if (CONFIG.canalAprovacaoId) {
                canalStaff = interaction.guild?.channels.cache.get(CONFIG.canalAprovacaoId);
            }
            if (!canalStaff) {
                canalStaff = interaction.guild?.channels.cache.find(c => 
                    c.type === ChannelType.GuildText && (c.name.includes('aprovacao') || c.name.includes('fichas'))
                );
            }

            if (canalStaff) {
                const tag = isFam ? CONFIG.tagFamilia : CONFIG.tagAmigos;
                const embedStaff = new EmbedBuilder()
                    .setColor(isFam ? 0xD4AF37 : 0x2ECC71)
                    .setTitle(`📥 NOVA FICHA • ${isFam ? `⚜️ FAMÍLIA NABRIZA ${CONFIG.tagFamilia}` : `🤝 AMIGOS ${CONFIG.tagAmigos}`}`)
                    .setDescription(
                        `👤 **Membro:** <@${interaction.user.id}>\n` +
                        `🏷️ **Cargo Pretendido:** ${isFam ? 'Família NaBriza' : 'Amigo da Família'}\n` +
                        `📝 **Nick Solicitado:** **${nome}**\n` +
                        `🏷️ **Nick com Tag:** \`${tag} ${nome}\`\n` +
                        `🎂 **Idade:** ${idade}\n\n` +
                        `📋 **Respostas:**\n` +
                        `> **${isFam ? 'Quem convidou?' : 'Amigo de quem?'}**\n> ${p1}\n\n` +
                        `> **${isFam ? 'Honrará a tag [NaBriza]?' : 'Jogos que joga:'}**\n> ${p2}`
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp();

                const safeNick = encodeURIComponent(nome.replace(/\|/g, ''));
                const tipo = isFam ? 'fam' : 'amg';

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`apv|${interaction.user.id}|${tipo}|${safeNick}`)
                        .setLabel(`Aprovar ${tag}`)
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId(`rep|${interaction.user.id}`)
                        .setLabel('Reprovar')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('❌')
                );

                await canalStaff.send({ embeds: [embedStaff], components: [row] }).catch(() => {});
            }

            return await interaction.editReply({
                content: `✅ **Sua ficha foi enviada com sucesso!** Nossa Staff já a recebeu no canal de aprovação.`
            });
        }

        // Aprovação da Staff
        if (interaction.isButton() && interaction.customId.startsWith('apv|')) {
            const temPerm = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles) ||
                            interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
            if (!temPerm) return interaction.reply({ content: '❌ Apenas a Staff pode aprovar!', ephemeral: true });

            await interaction.deferUpdate().catch(() => {});
            const parts = interaction.customId.split('|');
            const userId = parts[1];
            const isFam = parts[2] === 'fam';
            const rawNick = decodeURIComponent(parts[3] || '');

            const member = await interaction.guild?.members.fetch(userId).catch(() => null);
            if (!member) return interaction.followUp({ content: '⚠️ Membro não encontrado!', ephemeral: true });

            // Cargo
            const roleId = isFam ? CONFIG.cargoFamiliaId : CONFIG.cargoAmigosId;
            const role = interaction.guild?.roles.cache.get(roleId) ||
                         interaction.guild?.roles.cache.find(r => r.name.toLowerCase().includes(isFam ? 'família' : 'amigo'));
            if (role) await member.roles.add(role).catch(() => {});

            // Remove Não Registrado
            if (CONFIG.cargoNaoRegistradoId) {
                const roleNaoReg = interaction.guild?.roles.cache.get(CONFIG.cargoNaoRegistradoId);
                if (roleNaoReg) await member.roles.remove(roleNaoReg).catch(() => {});
            }

            // Tag [NaBriza] no Nick
            const tagAplicada = isFam ? CONFIG.tagFamilia : CONFIG.tagAmigos;
            const novoNick = `${tagAplicada} ${rawNick}`;
            if (member.manageable) {
                await member.setNickname(novoNick.substring(0, 32)).catch(() => {});
            }

            await interaction.editReply({
                content: `✅ **Aprovado por <@${interaction.user.id}>!** Cargo entregue e nick alterado para \`${novoNick}\`.`,
                embeds: [],
                components: []
            });

            await member.send(`🎉 Sua ficha foi **APROVADA**! Seu nick foi atualizado para **${novoNick}**. Bom jogo! ⚜️`).catch(() => {});
            return;
        }

        // Reprovação
        if (interaction.isButton() && interaction.customId.startsWith('rep|')) {
            const temPerm = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles) ||
                            interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
            if (!temPerm) return interaction.reply({ content: '❌ Apenas a Staff pode reprovar!', ephemeral: true });

            return await interaction.update({
                content: `❌ **Registro Reprovado por <@${interaction.user.id}>.**`,
                embeds: [],
                components: []
            });
        }
    } catch (err) {
        console.error('Erro na interação:', err);
    }
});

// Comandos de prefixo !painel, !registro, !setupregistro
client.on(Events.MessageCreate, async (msg) => {
    if (msg.author.bot || !msg.guild) return;
    const content = msg.content.trim().toLowerCase();

    if (content === '!painel') {
        const perms = msg.member.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
                      msg.member.permissions.has(PermissionsBitField.Flags.Administrator);
        if (!perms) return msg.reply(gerarCardRegistroMembro(msg.author));
        return msg.channel.send(gerarPainelEscolhaCargos());
    }

    if (content === '!registro') {
        return msg.reply(gerarCardRegistroMembro(msg.author));
    }
});

// Login do Bot
if (CONFIG.token && CONFIG.token.length > 25) {
    client.login(CONFIG.token).catch(err => console.error('Erro no login:', err.message));
}

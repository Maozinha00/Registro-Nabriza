/**
 * ============================================================================
 * ⚜️ BOT DISCORD 01 • SISTEMA EXCLUSIVO DE REGISTRO & CARGOS ⚜️
 * FAMÍLIA & AMIGOS (VERSÃO INDEPENDENTE PARA RAILWAY)
 * ============================================================================
 * 
 * 🚀 CARACTERÍSTICAS DESTE BOT:
 * - 100% focado no Registro Oficial, Modais, Aprovação Staff e Tags no Nick.
 * - Não precisa de .env! Lê direto das "Variables" do painel da Railway.
 * - Mini servidor HTTP na porta 3000 para o Health Check da Railway.
 * - Horário de Brasília preciso via Intl.DateTimeFormat (America/Sao_Paulo).
 * - Anti-crash reforçado para nunca cair.
 * - Atribui tag [FN] ou [AMIGO] automaticamente ao aprovar.
 * - Remove automaticamente o cargo "Não Registrado".
 * - Suporta Slash Commands (/registro, /painel, /setupregistro, /statusregistro, /fichas, /regras).
 * - Suporta Comandos de Prefixo (!registro, !painel, !setupregistro, !registrar, !salachefes, !limpar, !status, !ajuda).
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
    console.error('🛡️ [ANTI-CRASH] Rejeição de Promise interceptada:', reason);
});

process.on('uncaughtException', (err, origin) => {
    console.error(`🛡️ [ANTI-CRASH] Exceção interceptada (${origin}):`, err.message || err);
});

process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error(`🛡️ [ANTI-CRASH Monitor] Erro detectado (${origin}):`, err.message || err);
});

// ⚙️ CONFIGURAÇÃO CENTRALIZADA (Lida das Variables da Railway ou .env)
const CONFIG = {
    token: process.env.DISCORD_TOKEN ? process.env.DISCORD_TOKEN.trim() : "",
    guildId: process.env.GUILD_ID ? process.env.GUILD_ID.trim() : null,
    nomeServidor: process.env.NOME_SERVIDOR || "Família & Amigos",
    corEmbed: "#D4AF37", // Dourado
    corChefe: "#FFD700", // Ouro

    // IDs de Cargos
    cargoChefeId: process.env.CARGO_CHEFE_ID ? process.env.CARGO_CHEFE_ID.trim() : null,
    cargoFamiliaId: process.env.CARGO_FAMILIA_ID ? process.env.CARGO_FAMILIA_ID.trim() : "1546736138918694983",
    cargoAmigosId: process.env.CARGO_AMIGOS_ID ? process.env.CARGO_AMIGOS_ID.trim() : "1546736135965904926",
    cargoNaoRegistradoId: process.env.CARGO_NAO_REGISTRADO_ID ? process.env.CARGO_NAO_REGISTRADO_ID.trim() : "1515125826780135480",

    // Canal de Aprovação Staff
    canalAprovacaoId: process.env.CANAL_APROVACAO_ID ? process.env.CANAL_APROVACAO_ID.trim() : null,

    // Porta HTTP para Health Check da Railway
    port: process.env.PORT || 3000
};

// 🌐 SERVIDOR HTTP LEVE PARA HEALTH CHECK DA RAILWAY
const server = http.createServer((req, res) => {
    const isReady = client && client.isReady();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        sistema: 'Bot de Registro - Família & Amigos',
        status: isReady ? 'online' : 'iniciando',
        bot: client?.user ? client.user.tag : 'Iniciando...',
        servidores: client?.guilds?.cache?.size || 0,
        uptime: Math.floor(process.uptime()),
        horarioBrasilia: getHorarioBrasiliaFormatado()
    }));
});

server.listen(CONFIG.port, () => {
    console.log(`🌐 [RAILWAY HTTP] Servidor de monitoramento escutando na porta ${CONFIG.port}`);
});

// ⏰ FUNÇÃO PRECISA PARA HORÁRIO DE BRASÍLIA
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

// 🤖 CLIENTE DISCORD COM INTENTS OBRIGATÓRIOS
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,      // ⚠️ Necessário ativar no Discord Developer Portal
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent     // ⚠️ Necessário ativar no Discord Developer Portal
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
            '⚜️ **1. FAMÍLIA NABRIZA [FN]**\n' +
            '> Membro oficial da Família Nabriza. Libera canais exclusivos da Família, reuniões e eventos.\n\n' +
            '🤝 **2. AMIGOS DA FAMÍLIA [AMIGO]**\n' +
            '> Amigo, aliado e parceiro para jogar GTA RP, resenhar e curtir as calls abertas.\n\n' +
            '──────────────────────────────────────────\n' +
            '📌 **COMO FUNCIONA O CADASTRO:**\n' +
            '1️⃣ Clique no botão correspondente abaixo (**Família** ou **Amigo**).\n' +
            '2️⃣ Preencha o formulário rápido com seu Nick RP e respostas.\n' +
            '3️⃣ A Staff avaliará sua ficha no canal de aprovação.\n' +
            '4️⃣ Sendo aprovado, seu cargo é entregue na hora e seu nick é atualizado com a tag!\n\n' +
            '👇 *Clique no botão abaixo para iniciar seu cadastro:*'
        )
        .setFooter({ text: 'Família & Amigos • Lealdade, União e Respeito ⚜️' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_iniciar_familia')
            .setLabel('Entrar na Família [FN]')
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

// 🎫 CARD INDIVIDUAL DE REGISTRO DO MEMBRO
function gerarCardRegistroMembro(user) {
    const embed = new EmbedBuilder()
        .setColor(CONFIG.corEmbed)
        .setTitle('⚜️ REGISTRO OFICIAL • FAMÍLIA & AMIGOS ⚜️')
        .setDescription(
            `Olá ${user ? `<@${user.id}>` : 'Membro'}! Seja muito bem-vindo(a) ao nosso servidor!\n\n` +
            'Para se cadastrar e liberar todos os canais de texto, resenha e salas de voz, escolha a sua categoria:\n\n' +
            '⚜️ **1. FAMÍLIA NABRIZA [FN]**\n' +
            '> Membro oficial da Família Nabriza. Libera canais exclusivos da Família. Recebe tag `[FN]` no Nick.\n\n' +
            '🤝 **2. AMIGOS DA FAMÍLIA [AMIGO]**\n' +
            '> Amigo, aliado e parceiro para curtir o servidor. Recebe tag `[AMIGO]` no Nick.\n\n' +
            '──────────────────────────────────────────\n' +
            '👇 *Clique em um dos botões abaixo para preencher sua ficha:*'
        )
        .setFooter({ text: 'Família & Amigos • Lealdade, União e Respeito ⚜️' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_iniciar_familia')
            .setLabel('Entrar na Família [FN]')
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

// 📜 REGRAS DO SERVIDOR
function gerarEmbedRegras() {
    return new EmbedBuilder()
        .setColor(CONFIG.corEmbed)
        .setTitle('📜 REGRAS DO SERVIDOR • FAMÍLIA & AMIGOS')
        .setDescription(
            'Para mantermos nosso servidor agradável, unido e divertido para todos, respeite as seguintes regras:\n\n' +
            '1️⃣ **Respeito Mútuo:** Trate todos os membros com educação. Ofensas pesadas, discriminação e toxicidade são estritamente proibidas.\n\n' +
            '2️⃣ **Uso Correto dos Canais:** Utilize cada canal para sua devida finalidade: bate-papo para conversas normais, jogos para resenhas gamers.\n\n' +
            '3️⃣ **Microfone nas Calls:** Evite gritos excessivos, áudios estourados ou sons desagradáveis durante as conversas.\n\n' +
            '4️⃣ **Spam e Divulgação:** Proibido divulgar links não autorizados, servidores externos ou fazer spam nos chats.\n\n' +
            '5️⃣ **Bom Senso:** Divirta-se e ajude a fortalecer a união entre a Família Nabriza e todos os nossos amigos!\n\n' +
            '💡 *Dúvidas ou problemas? Procure a Chefia ou um membro da Staff.*'
        )
        .setFooter({ text: 'Família & Amigos • Convivência em Harmonia ⚜️' })
        .setTimestamp();
}

// 🛡️ GARANTIR CARGOS DO SERVIDOR
async function configurarCargosOficiais(guild) {
    const rolesCreated = [];

    // Chefe
    let roleChefe = guild.roles.cache.find(r => r.name.includes('Chefe'));
    if (!roleChefe) {
        roleChefe = await guild.roles.create({
            name: '👑 Chefe',
            color: '#FFD700',
            hoist: true,
            permissions: [PermissionsBitField.Flags.ManageMessages]
        }).catch(() => null);
        if (roleChefe) rolesCreated.push('👑 Chefe');
    }

    // Família
    let roleFamilia = guild.roles.cache.get(CONFIG.cargoFamiliaId) || 
                      guild.roles.cache.find(r => r.name.includes('Família') || r.name.includes('Familia'));
    if (!roleFamilia) {
        roleFamilia = await guild.roles.create({
            name: '⚜️ Família',
            color: '#D4AF37',
            hoist: true
        }).catch(() => null);
        if (roleFamilia) rolesCreated.push('⚜️ Família');
    }

    // Amigos
    let roleAmigos = guild.roles.cache.get(CONFIG.cargoAmigosId) || 
                     guild.roles.cache.find(r => r.name.includes('Amigo'));
    if (!roleAmigos) {
        roleAmigos = await guild.roles.create({
            name: '🤝 Amigos',
            color: '#2ECC71',
            hoist: true
        }).catch(() => null);
        if (roleAmigos) rolesCreated.push('🤝 Amigos');
    }

    // Não Registrado
    let roleNaoReg = guild.roles.cache.get(CONFIG.cargoNaoRegistradoId) || 
                     guild.roles.cache.find(r => r.name.includes('Não Registrado'));
    if (!roleNaoReg) {
        roleNaoReg = await guild.roles.create({
            name: '❌ Não Registrado',
            color: '#95A5A6',
            hoist: false
        }).catch(() => null);
        if (roleNaoReg) rolesCreated.push('❌ Não Registrado');
    }

    return rolesCreated;
}

// ⚙️ CONFIGURAR CANAIS OFICIAIS DE REGISTRO E STAFF
async function configurarCanaisRegistro(guild) {
    const everyone = guild.roles.everyone;
    const rolesCreated = await configurarCargosOficiais(guild);

    let canalRegistro = guild.channels.cache.find(c => 
        c.type === ChannelType.GuildText && (c.name.includes('escolha-seu-cargo') || c.name === 'registro' || c.name.includes('cargos'))
    );

    if (!canalRegistro) {
        canalRegistro = await guild.channels.create({
            name: '📜・escolha-seu-cargo',
            type: ChannelType.GuildText,
            topic: '⚜️ Registro Oficial de Membros: Família Nabriza [FN] ou Amigos [AMIGO].',
            permissionOverwrites: [
                {
                    id: everyone.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory],
                    deny: [PermissionsBitField.Flags.SendMessages]
                }
            ]
        }).catch(() => null);
    }

    if (canalRegistro) {
        const painel = gerarPainelEscolhaCargos();
        const msgPainel = await canalRegistro.send(painel).catch(() => null);
        if (msgPainel) await msgPainel.pin().catch(() => {});
    }

    // Canal de Aprovação Staff
    let canalStaff = null;
    if (CONFIG.canalAprovacaoId) {
        canalStaff = guild.channels.cache.get(CONFIG.canalAprovacaoId);
    }
    if (!canalStaff) {
        canalStaff = guild.channels.cache.find(c => 
            c.type === ChannelType.GuildText && (c.name.includes('aprovacao') || c.name.includes('fichas-registro') || c.name.includes('fichas'))
        );
    }

    if (!canalStaff) {
        canalStaff = await guild.channels.create({
            name: '🛡️・fichas-aprovacao',
            type: ChannelType.GuildText,
            topic: '📥 Fichas de cadastro aguardando avaliação da Staff.',
            permissionOverwrites: [
                {
                    id: everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                }
            ]
        }).catch(() => null);
    }

    return {
        canalRegistro: canalRegistro ? canalRegistro.name : 'escolha-seu-cargo',
        canalRegistroId: canalRegistro ? canalRegistro.id : null,
        canalStaff: canalStaff ? canalStaff.name : 'fichas-aprovacao',
        canalStaffId: canalStaff ? canalStaff.id : null,
        roles: rolesCreated
    };
}

// 🔒 CRIAR SALA PRIVADA DOS CHEFES (BLINDADA)
async function configurarSalaPrivadaChefes(guild) {
    const everyone = guild.roles.everyone;

    let roleChefe = guild.roles.cache.find(r => r.name.includes('Chefe') || r.name.includes('Diretoria'));
    if (!roleChefe) {
        roleChefe = await guild.roles.create({
            name: '👑 Chefe',
            color: '#FFD700',
            hoist: true,
            permissions: [
                PermissionsBitField.Flags.ManageMessages,
                PermissionsBitField.Flags.MuteMembers,
                PermissionsBitField.Flags.DeafenMembers,
                PermissionsBitField.Flags.MoveMembers
            ],
            reason: 'Cargo para liderança e acesso à Sala Privada dos Chefes'
        }).catch(() => null);
    }

    if (roleChefe) {
        CONFIG.cargoChefeId = roleChefe.id;
        try {
            const owner = await guild.fetchOwner();
            if (owner && !owner.roles.cache.has(roleChefe.id)) {
                await owner.roles.add(roleChefe);
            }
        } catch (_) {}
    }

    const overwritesChefes = [
        { id: everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] }
    ];

    if (roleChefe) {
        overwritesChefes.push({
            id: roleChefe.id,
            allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.Connect,
                PermissionsBitField.Flags.Speak,
                PermissionsBitField.Flags.ManageMessages
            ]
        });
    }

    let catChefes = guild.channels.cache.find(c => 
        c.type === ChannelType.GuildCategory && (c.name.includes('CHEFIA') || c.name.includes('DIRETORIA'))
    );

    if (!catChefes) {
        catChefes = await guild.channels.create({
            name: '👑・CHEFIA & DIRETORIA (PV)',
            type: ChannelType.GuildCategory,
            permissionOverwrites: overwritesChefes
        });
    } else {
        await catChefes.permissionOverwrites.set(overwritesChefes).catch(() => {});
    }

    let canalTextoChefe = guild.channels.cache.find(c => 
        c.type === ChannelType.GuildText && c.parentId === catChefes.id && c.name.includes('chat-dos-chefes')
    );

    if (!canalTextoChefe) {
        canalTextoChefe = await guild.channels.create({
            name: '🔒・chat-dos-chefes',
            type: ChannelType.GuildText,
            parent: catChefes.id,
            permissionOverwrites: overwritesChefes,
            topic: '🔒 Sala Privada dos Chefes e Donos da Família & Amigos.'
        });

        const embedPv = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('👑 SALA PRIVADA DOS CHEFES • CONFIDENCIAL')
            .setDescription(
                '👋 **Bem-vindos à Sala Privada dos Chefes!**\n\n' +
                '🔒 **Esta sala é 100% blindada e invisível para visitantes e amigos.**\n' +
                'Apenas quem possui o cargo **👑 Chefe** tem acesso a este canal.\n\n' +
                '⚜️ *Decisões estratégicas, alianças e assuntos da liderança acontecem aqui.*'
            )
            .setTimestamp();

        await canalTextoChefe.send({ embeds: [embedPv] }).catch(() => {});
    }

    let canalVozChefe = guild.channels.cache.find(c => 
        c.type === ChannelType.GuildVoice && c.parentId === catChefes.id && c.name.includes('Chefes')
    );

    if (!canalVozChefe) {
        canalVozChefe = await guild.channels.create({
            name: '🔒・Voz dos Chefes (PV)',
            type: ChannelType.GuildVoice,
            parent: catChefes.id,
            permissionOverwrites: overwritesChefes
        });
    }

    return {
        categoria: catChefes.name,
        chatTexto: canalTextoChefe.name,
        chatVoz: canalVozChefe.name,
        cargoChefe: roleChefe ? roleChefe.name : null
    };
}

// ============================================================================
// 🤖 EVENTOS DO BOT DE REGISTRO
// ============================================================================

client.once(Events.ClientReady, async (c) => {
    console.log(`====================================================`);
    console.log(`🟢 [BOT 01 ONLINE] Registro & Cargos conectado como: ${c.user.tag}`);
    console.log(`⚜️ Servidores Conectados: ${c.guilds.cache.size}`);
    console.log(`⏰ Horário Brasília Atual: ${getHorarioBrasiliaFormatado()}`);
    console.log(`====================================================`);

    c.user.setPresence({
        activities: [{ name: "⚜️ Registro Família & Amigos | /registro | !ajuda", type: 3 }],
        status: "online"
    });

    // Registra Slash Commands de Registro
    const slashCommands = [
        {
            name: 'registro',
            description: '⚜️ Abra seu formulário de registro para entrar na Família Nabriza [FN] ou Amigos [AMIGO].'
        },
        {
            name: 'painel',
            description: '⚜️ (Staff) Envia o Painel Oficial de Registro com botões no canal atual.'
        },
        {
            name: 'setupregistro',
            description: '⚙️ (Staff) Cria e configura os canais #escolha-seu-cargo e #fichas-aprovacao.'
        },
        {
            name: 'statusregistro',
            description: '📊 Mostra as estatísticas de membros registrados no servidor.'
        },
        {
            name: 'fichas',
            description: '📋 (Staff) Localiza o canal de fichas de registro pendentes de avaliação.'
        },
        {
            name: 'regras',
            description: '📜 Envia as regras oficiais de convivência do servidor.'
        }
    ];

    setTimeout(async () => {
        try {
            if (c.application) {
                await c.application.commands.set(slashCommands).catch(() => {});
            }
            for (const guild of c.guilds.cache.values()) {
                await guild.commands.set(slashCommands).catch(() => {});
            }
            console.log('✅ Slash Commands de Registro registrados com sucesso!');
        } catch (err) {
            console.error('Aviso ao registrar slash commands:', err.message);
        }
    }, 2000);
});

// 👤 Evento: Novo Membro Entra no Servidor
client.on(Events.GuildMemberAdd, async (member) => {
    try {
        console.log(`[NOVO MEMBRO] ${member.user.tag} (${member.id}) entrou no servidor.`);

        // Entrega o cargo "Não Registrado"
        let roleNaoReg = member.guild.roles.cache.get(CONFIG.cargoNaoRegistradoId) ||
                         member.guild.roles.cache.find(r => r.name.includes('Não Registrado'));
        if (roleNaoReg) {
            await member.roles.add(roleNaoReg).catch(err => console.error('Erro ao entregar cargo Não Registrado:', err.message));
        }

        // Envia mensagem no canal de boas-vindas / avisos com os botões
        const canalAvisos = member.guild.channels.cache.find(c =>
            c.type === ChannelType.GuildText && (
                c.name.includes('avisos') || c.name.includes('geral') || c.name.includes('boas-vindas') || c.name.includes('chat')
            )
        );

        if (canalAvisos) {
            const canalPainel = member.guild.channels.cache.find(c =>
                c.type === ChannelType.GuildText && (c.name.includes('cargo') || c.name.includes('registro'))
            );

            const embedWelcome = new EmbedBuilder()
                .setColor(CONFIG.corEmbed)
                .setTitle(`👋 BEM-VINDO(A) À FAMÍLIA & AMIGOS! ⚜️`)
                .setDescription(
                    `Olá <@${member.id}>! Seja muito bem-vindo(a) ao nosso servidor!\n\n` +
                    `📌 **SISTEMA DE REGISTRO OFICIAL:**\n` +
                    `1️⃣ Você recebeu o cargo inicial **❌ Não Registrado**.\n` +
                    `2️⃣ Escolha sua categoria abaixo ou acesse ${canalPainel ? `<#${canalPainel.id}>` : '`#escolha-seu-cargo`'}:\n` +
                    `   • ⚜️ **Família Nabriza [FN]**\n` +
                    `   • 🤝 **Amigos da Família [AMIGO]**\n` +
                    `3️⃣ Clique em um dos botões abaixo para preencher sua ficha na hora!`
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setFooter({ text: 'Família & Amigos • Lealdade, União e Respeito ⚜️' })
                .setTimestamp();

            const rowWelcome = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('btn_iniciar_familia')
                    .setLabel('Entrar na Família [FN]')
                    .setEmoji('⚜️')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('btn_iniciar_amigos')
                    .setLabel('Entrar como Amigo [AMIGO]')
                    .setEmoji('🤝')
                    .setStyle(ButtonStyle.Success)
            );

            await canalAvisos.send({ content: `🎉 Olá <@${member.id}>!`, embeds: [embedWelcome], components: [rowWelcome] }).catch(() => {});
        }
    } catch (err) {
        console.error('Erro no guildMemberAdd:', err.message);
    }
});

// 💬 COMANDOS DE TEXTO COM PREFIXO
client.on(Events.MessageCreate, async (msg) => {
    if (msg.author.bot || !msg.guild) return;
    const content = msg.content.trim().toLowerCase();

    // !registro / !cadastrar
    if (content === '!registro' || content === '!cadastrar') {
        return msg.reply(gerarCardRegistroMembro(msg.author));
    }

    // !painel / !cargos
    if (content === '!painel' || content === '!cargos') {
        const perms = msg.member.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
                      msg.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!perms) return msg.reply(gerarCardRegistroMembro(msg.author));
        return msg.channel.send(gerarPainelEscolhaCargos());
    }

    // !setupregistro
    if (content === '!setupregistro') {
        const perms = msg.member.permissions.has(PermissionsBitField.Flags.ManageChannels) ||
                      msg.member.permissions.has(PermissionsBitField.Flags.Administrator);
        if (!perms) return msg.reply('❌ Apenas a Staff pode configurar canais de registro.');

        const waitMsg = await msg.reply('⏳ **Configurando canais oficiais de registro...**');
        const res = await configurarCanaisRegistro(msg.guild);
        const embedSetup = new EmbedBuilder()
            .setColor(CONFIG.corEmbed)
            .setTitle('⚜️ CANAIS DE REGISTRO CONFIGURADOS COM SUCESSO!')
            .setDescription(
                `📜 **Canal de Registro:** ${res.canalRegistroId ? `<#${res.canalRegistroId}>` : '`#escolha-seu-cargo`'}\n` +
                `🛡️ **Canal de Fichas (Staff):** ${res.canalStaffId ? `<#${res.canalStaffId}>` : '`#fichas-aprovacao`'}`
            )
            .setTimestamp();
        return waitMsg.edit({ content: null, embeds: [embedSetup] });
    }

    // !registrar @membro <familia|amigo> [nick]
    if (content.startsWith('!registrar')) {
        const perms = msg.member.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
                      msg.member.permissions.has(PermissionsBitField.Flags.Administrator);
        if (!perms) return msg.reply('❌ Apenas a Staff pode registrar diretamente.');

        const args = msg.content.trim().split(/ +/);
        const targetMember = msg.mentions.members?.first();
        if (!targetMember || args.length < 3) {
            return msg.reply('⚠️ Formato: `!registrar @Membro <familia|amigo> [Nick]`');
        }

        const isFam = args[2].toLowerCase().includes('fam');
        const rawNick = args.slice(3).join(' ') || targetMember.user.username;
        const novoNick = isFam ? `[FN] ${rawNick}` : `[AMIGO] ${rawNick}`;

        const roleId = isFam ? CONFIG.cargoFamiliaId : CONFIG.cargoAmigosId;
        const role = msg.guild.roles.cache.get(roleId) ||
                     msg.guild.roles.cache.find(r => r.name.toLowerCase().includes(isFam ? 'família' : 'amigo'));

        if (role) await targetMember.roles.add(role).catch(() => {});

        if (CONFIG.cargoNaoRegistradoId) {
            const roleNaoReg = msg.guild.roles.cache.get(CONFIG.cargoNaoRegistradoId) ||
                               msg.guild.roles.cache.find(r => r.name.includes('Não Registrado'));
            if (roleNaoReg) await targetMember.roles.remove(roleNaoReg).catch(() => {});
        }

        try {
            if (targetMember.manageable) {
                await targetMember.setNickname(novoNick.substring(0, 32)).catch(() => {});
            }
        } catch (_) {}

        return msg.reply(`✅ <@${targetMember.id}> foi registrado com sucesso como **${isFam ? '⚜️ Família Nabriza' : '🤝 Amigos'}**!`);
    }

    // !statusregistro
    if (content === '!statusregistro') {
        const roleFam = msg.guild.roles.cache.get(CONFIG.cargoFamiliaId) || msg.guild.roles.cache.find(r => r.name.includes('Família'));
        const roleAmg = msg.guild.roles.cache.get(CONFIG.cargoAmigosId) || msg.guild.roles.cache.find(r => r.name.includes('Amigo'));
        const roleNaoReg = msg.guild.roles.cache.get(CONFIG.cargoNaoRegistradoId) || msg.guild.roles.cache.find(r => r.name.includes('Não Registrado'));

        const embedStats = new EmbedBuilder()
            .setColor(CONFIG.corEmbed)
            .setTitle('📊 ESTATÍSTICAS DE REGISTRO • FAMÍLIA & AMIGOS')
            .setDescription(
                `👥 **Total de Membros:** ${msg.guild.memberCount}\n` +
                `⚜️ **Família Nabriza [FN]:** ${roleFam ? roleFam.members.size : 0}\n` +
                `🤝 **Amigos [AMIGO]:** ${roleAmg ? roleAmg.members.size : 0}\n` +
                `❌ **Não Registrados:** ${roleNaoReg ? roleNaoReg.members.size : 0}`
            );
        return msg.reply({ embeds: [embedStats] });
    }

    // !regras
    if (content === '!regras') {
        return msg.channel.send({ embeds: [gerarEmbedRegras()] });
    }

    // !salachefes
    if (content === '!salachefes') {
        const perms = msg.member.permissions.has(PermissionsBitField.Flags.Administrator) ||
                      msg.guild.ownerId === msg.author.id;
        if (!perms) return msg.reply('❌ Apenas Administradores podem configurar a Sala dos Chefes.');

        const waitMsg = await msg.reply('⏳ **Configurando Sala Privada dos Chefes de forma segura...**');
        const res = await configurarSalaPrivadaChefes(msg.guild);
        return waitMsg.edit({
            content: `✅ **Sala Privada configurada!**\n📁 Categoria: `${res.categoria}`\n💬 Chat: `${res.chatTexto}`\n🔊 Voz: `${res.chatVoz}``
        });
    }

    // !limpar
    if (content.startsWith('!limpar')) {
        const perms = msg.member.permissions.has(PermissionsBitField.Flags.ManageMessages);
        if (!perms) return msg.reply('❌ Você precisa da permissão de Gerenciar Mensagens!');
        const amount = parseInt(content.split(' ')[1], 10);
        if (isNaN(amount) || amount < 1 || amount > 100) return msg.reply('⚠️ Use: `!limpar 10` (1 a 100).');
        await msg.delete().catch(() => {});
        const deleted = await msg.channel.bulkDelete(amount, true).catch(() => null);
        const reply = await msg.channel.send(`🧹 **${deleted ? deleted.size : amount}** mensagens limpas.`);
        setTimeout(() => reply.delete().catch(() => {}), 3500);
        return;
    }

    // !status / !botinfo
    if (content === '!status' || content === '!botinfo') {
        const { hora, minuto, segundo, dataStr } = getHorarioBrasilia();
        const embedStatus = new EmbedBuilder()
            .setColor(CONFIG.corEmbed)
            .setTitle('📊 STATUS DO BOT DE REGISTRO (RAILWAY)')
            .setDescription(
                `🟢 **Sistema:** Bot de Registro & Cargos\n` +
                `📶 **Ping:** ${client.ws.ping}ms\n` +
                `⏰ **Horário de Brasília:** ${dataStr} ${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}:${String(segundo).padStart(2, '0')}\n` +
                `👥 **Membros no Servidor:** ${msg.guild.memberCount}`
            );
        return msg.reply({ embeds: [embedStatus] });
    }

    // !ajuda / !help
    if (content === '!ajuda' || content === '!help') {
        const embedAjuda = new EmbedBuilder()
            .setColor(CONFIG.corEmbed)
            .setTitle('📖 GUIA DO BOT DE REGISTRO • FAMÍLIA & AMIGOS')
            .setDescription(
                '**⚜️ COMANDOS DE MEMBRO:**\n' +
                '• `!registro` ou `/registro` - Abre o formulário pessoal para se registrar.\n' +
                '• `!regras` ou `/regras` - Visualiza as regras de convivência.\n\n' +
                '**🛡️ COMANDOS DA STAFF:**\n' +
                '• `!painel` ou `/painel` - Envia o painel com botões fixo no canal.\n' +
                '• `!setupregistro` ou `/setupregistro` - Cria os canais #escolha-seu-cargo e #fichas-aprovacao.\n' +
                '• `/fichas` - Localiza o canal de fichas para avaliação rápida.\n' +
                '• `!registrar @Membro <familia|amigo> [Nick]` - Registro manual direto.\n' +
                '• `!statusregistro` - Exibe quantidade de cadastrados por categoria.\n' +
                '• `!salachefes` - Cria a área blindada dos Chefes.\n' +
                '• `!limpar <1-100>` - Limpeza rápida de chat.\n' +
                '• `!status` - Diagnóstico do bot.'
            );
        return msg.reply({ embeds: [embedAjuda] });
    }
});

// ⚡ INTERAÇÕES: SLASH COMMANDS, BOTÕES E MODAIS
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        // 1. SLASH COMMANDS
        if (interaction.isChatInputCommand()) {
            const { commandName } = interaction;

            if (commandName === 'registro') {
                return interaction.reply({ ...gerarCardRegistroMembro(interaction.user), ephemeral: true });
            }

            if (commandName === 'painel') {
                const perms = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles) ||
                              interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
                if (!perms) return interaction.reply({ content: '❌ Apenas a Staff pode enviar o painel.', ephemeral: true });
                await interaction.channel?.send(gerarPainelEscolhaCargos());
                return interaction.reply({ content: '✅ Painel Oficial de Registro enviado!', ephemeral: true });
            }

            if (commandName === 'setupregistro') {
                const perms = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageChannels) ||
                              interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
                if (!perms) return interaction.reply({ content: '❌ Apenas a Staff pode configurar canais.', ephemeral: true });
                await interaction.deferReply({ ephemeral: true });
                const res = await configurarCanaisRegistro(interaction.guild);
                return interaction.editReply({ content: `✅ Canais configurados! Registro: <#${res.canalRegistroId}> | Staff: <#${res.canalStaffId}>` });
            }

            if (commandName === 'statusregistro') {
                const roleFam = interaction.guild?.roles.cache.get(CONFIG.cargoFamiliaId);
                const roleAmg = interaction.guild?.roles.cache.get(CONFIG.cargoAmigosId);
                return interaction.reply({
                    content: `📊 **Membros:** ${interaction.guild?.memberCount || 0} | ⚜️ Família: ${roleFam?.members.size || 0} | 🤝 Amigos: ${roleAmg?.members.size || 0}`,
                    ephemeral: true
                });
            }

            if (commandName === 'fichas') {
                const perms = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles) ||
                              interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
                if (!perms) return interaction.reply({ content: '❌ Apenas a Staff pode verificar fichas.', ephemeral: true });

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
                    return interaction.reply({
                        content: `📋 **Canal de Fichas da Staff:** <#${canalStaff.id}>\nTodas as fichas com botões de aprovação estão disponíveis lá.`,
                        ephemeral: true
                    });
                } else {
                    return interaction.reply({
                        content: '⚠️ Canal de aprovação não encontrado. Use `/setupregistro` para criá-lo automaticamente!',
                        ephemeral: true
                    });
                }
            }

            if (commandName === 'regras') {
                return interaction.reply({ embeds: [gerarEmbedRegras()] });
            }
        }

        // 2. BOTÕES DE ABERTURA DE MODAL
        if (interaction.isButton() && interaction.customId === 'btn_iniciar_familia') {
            const modal = new ModalBuilder().setCustomId('modal_familia').setTitle('Ficha: Família Nabriza [FN]');
            modal.addComponents(
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('nome').setLabel('Seu Nome / Nick RP:').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('idade').setLabel('Sua Idade:').setStyle(TextInputStyle.Short).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p1').setLabel('Quem te convidou?').setStyle(TextInputStyle.Paragraph).setRequired(true)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('p2').setLabel('Concorda em honrar a tag [FN]?').setStyle(TextInputStyle.Paragraph).setRequired(true))
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

        // 3. ENVIO DO FORMULÁRIO (MODAL SUBMIT)
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
                    c.type === ChannelType.GuildText && (
                        c.name.includes('aprovacao') || c.name.includes('staff') || c.name.includes('registro') || c.name.includes('fichas')
                    )
                );
            }

            if (canalStaff) {
                const embedStaff = new EmbedBuilder()
                    .setColor(isFam ? 0xD4AF37 : 0x2ECC71)
                    .setTitle(`📥 NOVA FICHA • ${isFam ? '⚜️ FAMÍLIA NABRIZA [FN]' : '🤝 AMIGOS [AMIGO]'}`)
                    .setDescription(
                        `👤 **Membro:** <@${interaction.user.id}>\n` +
                        `🏷️ **Cargo:** ${isFam ? 'Família Nabriza' : 'Amigo da Família'}\n` +
                        `📝 **Nick Solicitado:** **${nome}**\n` +
                        `🎂 **Idade:** ${idade}\n\n` +
                        `📋 **Respostas:**\n> 1. ${p1}\n> 2. ${p2}`
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp();

                const safeNick = encodeURIComponent(nome.replace(/\|/g, ''));
                const tipo = isFam ? 'fam' : 'amg';

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`apv|${interaction.user.id}|${tipo}|${safeNick}`)
                        .setLabel(`Aprovar ${isFam ? '[FN]' : '[AMIGO]'}`)
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId(`rep|${interaction.user.id}`)
                        .setLabel('Reprovar')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('❌')
                );

                await canalStaff.send({ embeds: [embedStaff], components: [row] }).catch(err => {
                    console.error('Erro ao enviar ficha staff:', err.message);
                });
            }

            return await interaction.editReply({
                content: `✅ **Sua ficha foi enviada com sucesso!** Nossa Staff já recebeu suas informações e avaliará seu cadastro.`
            });
        }

        // 4. APROVAÇÃO PELA STAFF
        if (interaction.isButton() && (interaction.customId.startsWith('apv|') || interaction.customId.startsWith('aprovar_'))) {
            const temPerm = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles) ||
                            interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);

            if (!temPerm) {
                return interaction.reply({ content: '❌ Apenas a Staff pode aprovar cadastros!', ephemeral: true });
            }

            await interaction.deferUpdate().catch(() => {});

            let userId, tipo, rawNick;
            if (interaction.customId.startsWith('apv|')) {
                const parts = interaction.customId.split('|');
                userId = parts[1];
                tipo = parts[2];
                rawNick = decodeURIComponent(parts[3] || '');
            } else {
                const parts = interaction.customId.split('_');
                userId = parts[1];
                tipo = parts[2];
                rawNick = decodeURIComponent(parts.slice(3).join('_') || '');
            }

            const isFam = tipo === 'fam' || tipo === 'familia';
            const member = await interaction.guild?.members.fetch(userId).catch(() => null);

            if (!member) {
                return interaction.followUp({ content: '⚠️ Membro não encontrado no servidor!', ephemeral: true });
            }

            // Entrega cargo oficial
            const roleId = isFam ? CONFIG.cargoFamiliaId : CONFIG.cargoAmigosId;
            const role = interaction.guild?.roles.cache.get(roleId) ||
                         interaction.guild?.roles.cache.find(r => r.name.toLowerCase().includes(isFam ? 'família' : 'amigo'));

            if (role) await member.roles.add(role).catch(() => {});

            // Remove cargo Não Registrado
            if (CONFIG.cargoNaoRegistradoId) {
                const roleNaoReg = interaction.guild?.roles.cache.get(CONFIG.cargoNaoRegistradoId) ||
                                   interaction.guild?.roles.cache.find(r => r.name.includes('Não Registrado'));
                if (roleNaoReg) await member.roles.remove(roleNaoReg).catch(() => {});
            }

            // Renomeia o nick com a tag
            const novoNick = isFam ? `[FN] ${rawNick}` : `[AMIGO] ${rawNick}`;
            try {
                if (member.manageable) {
                    await member.setNickname(novoNick.substring(0, 32)).catch(() => {});
                }
            } catch (_) {}

            await interaction.editReply({
                content: `✅ **Aprovado por <@${interaction.user.id}>!** Cargo **${isFam ? '⚜️ Família Nabriza' : '🤝 Amigos'}** entregue e nick atualizado para `${novoNick}`.`,
                embeds: [],
                components: []
            });

            await member.send(`🎉 Sua ficha para **${isFam ? 'Família Nabriza' : 'Amigos'}** foi **APROVADA**! Seu acesso aos canais foi liberado. Bom jogo! ⚜️`).catch(() => {});
            return;
        }

        // 5. REPROVAÇÃO PELA STAFF
        if (interaction.isButton() && (interaction.customId.startsWith('rep|') || interaction.customId.startsWith('reprovar_'))) {
            const temPerm = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles) ||
                            interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);

            if (!temPerm) return interaction.reply({ content: '❌ Apenas a Staff pode reprovar cadastros!', ephemeral: true });

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

// 🔑 LOGIN DO BOT NA RAILWAY
if (!CONFIG.token || CONFIG.token.length < 25) {
    console.log('====================================================');
    console.log('⚠️ [RAILWAY SETUP - AGUARDANDO DISCORD_TOKEN]');
    console.log('👉 No painel da Railway:');
    console.log('   1. Abra seu serviço do bot');
    console.log('   2. Vá na aba "Variables"');
    console.log('   3. Adicione DISCORD_TOKEN com seu token');
    console.log('====================================================');
} else {
    client.login(CONFIG.token).catch(err => {
        console.error('====================================================');
        console.error('❌ [ERRO AO LOGAR NO DISCORD]:', err.message);
        if (err.message.includes('disallowed intents') || err.code === 'DisallowedIntents') {
            console.error('📌 ATIVE OS PRIVILEGED GATEWAY INTENTS no Discord Developer Portal:');
            console.error('   • Server Members Intent (OBRIGATÓRIO)');
            console.error('   • Message Content Intent (OBRIGATÓRIO)');
        }
        console.error('====================================================');
    });
}

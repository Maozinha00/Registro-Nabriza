/**
 * ============================================================================
 * ⚜️ BOT DISCORD • SISTEMA EXCLUSIVO DE REGISTRO & CARGOS ⚜️
 * FAMÍLIA SOUZA & AMIGOS (SLASH COMMANDS + CANAL DE APROVAÇÃO OFICIAL)
 * ============================================================================
 * Canal Oficial de Aprovação: 1560365072822304900
 * Comandos Suportados:
 *   /registro        - Inicia o fluxo de registro interativo
 *   /painel          - Publica o painel oficial fixo de escolha de cargos
 *   /ficha           - Abre o seletor para preencher ficha de Família ou Amigo
 *   /cargos          - Lista cargos configurados e permissões
 *   /sincronizar     - Sincroniza tags [Souza] e [AMIGO] em lote no servidor
 *   /testaraprovacao - Envia ficha de teste no canal de aprovação 1560365072822304900
 * (Também suporta prefixos: !registro, !painel, !ficha, !cargos, !sincronizar)
 * ============================================================================
 */

require('dotenv').config();
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
    PermissionsBitField,
    REST,
    Routes,
    SlashCommandBuilder
} = require('discord.js');

// 🛡️ SISTEMA ANTI-CRASH PROFISSIONAL
process.on('unhandledRejection', (reason, promise) => {
    console.error('🛡️ [ANTI-CRASH] Rejeição interceptada:', reason);
});
process.on('uncaughtException', (err, origin) => {
    console.error(`🛡️ [ANTI-CRASH] Exceção capturada (${origin}):`, err.message || err);
});
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error(`🛡️ [ANTI-CRASH Monitor] Erro:`, err.message || err);
});

// ⚙️ CONFIGURAÇÃO CENTRALIZADA DA FAMÍLIA SOUZA
const CONFIG = {
    token: (process.env.DISCORD_TOKEN || "").trim(),
    clientId: (process.env.CLIENT_ID || "").trim(),
    guildId: (process.env.GUILD_ID || "").trim() || null,
    nomeServidor: process.env.NOME_SERVIDOR || "Família Souza & Amigos",
    corEmbed: 0xD4AF37, // Dourado Nobre
    corAmigos: 0x2ECC71, // Verde Amizade
    corErro: 0xE74C3C, // Vermelho

    // Tags Oficiais
    tagFamilia: "[Souza]",
    tagAmigos: "[AMIGO]",

    // Canal Oficial de Aprovação da Staff (ID fornecido pelo usuário)
    canalAprovacaoId: (process.env.CANAL_APROVACAO_ID || "1560365072822304900").trim(),

    // IDs opcionais de cargos (se deixado em branco, o bot busca pelo nome ou cria automaticamente)
    cargoFamiliaId: (process.env.CARGO_FAMILIA_ID || "").trim() || null,
    cargoAmigosId: (process.env.CARGO_AMIGOS_ID || "").trim() || null,
    cargoNaoRegistradoId: (process.env.CARGO_NAO_REGISTRADO_ID || "").trim() || null,

    // Porta HTTP para Health Check da Railway / Render / Discloud
    port: process.env.PORT || 3000
};

// Armazenamento em memória para dados de fichas pendentes (evita limite de 100 caracteres no customId do botão)
const fichasPendentes = new Map();

// 🌐 SERVIDOR HTTP LEVE PARA HEALTH CHECK DA HOSPEDAGEM
let client = null;
const server = http.createServer((req, res) => {
    const isReady = Boolean(client && client.isReady());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        sistema: 'Bot de Registro - Família Souza & Amigos',
        status: isReady ? 'online' : 'iniciando',
        canalAprovacao: CONFIG.canalAprovacaoId,
        bot: client?.user ? client.user.tag : 'Aguardando inicialização...',
        servidores: client?.guilds?.cache?.size || 0,
        uptime: Math.floor(process.uptime()),
        horarioBrasilia: getHorarioBrasiliaFormatado()
    }));
});

// Se executado diretamente como script de bot standalone
if (!process.env.DISABLE_BOT_HTTP_SERVER) {
    server.listen(CONFIG.port, () => {
        console.log(`🌐 [HTTP HEALTH-CHECK] Escutando na porta ${CONFIG.port}`);
    });
}

function getHorarioBrasiliaFormatado() {
    try {
        const agora = new Date();
        const formatter = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            dateStyle: 'short',
            timeStyle: 'medium'
        });
        return `${formatter.format(agora)} (Brasília)`;
    } catch {
        return new Date().toISOString();
    }
}

// Inicializa o Client com as Intents necessárias
client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,      // Necessário: Ativar no Discord Developer Portal
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent     // Necessário: Ativar no Discord Developer Portal
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

// ============================================================================
// 📜 DEFINIÇÃO DOS COMANDOS SLASH (/)
// ============================================================================
const slashCommands = [
    new SlashCommandBuilder()
        .setName('registro')
        .setDescription('⚜️ Inicie seu processo de registro na Família Souza ou Amigos'),

    new SlashCommandBuilder()
        .setName('ficha')
        .setDescription('📋 Escolha sua categoria e preencha a ficha para obter seu cargo'),

    new SlashCommandBuilder()
        .setName('painel')
        .setDescription('👑 [Staff] Envia o painel oficial fixo de escolha de cargos no canal'),

    new SlashCommandBuilder()
        .setName('cargos')
        .setDescription('📋 Lista os cargos configurados para a Família Souza e Amigos'),

    new SlashCommandBuilder()
        .setName('sincronizar')
        .setDescription('🔄 [Staff] Sincroniza em lote as tags [Souza] e [AMIGO] de todos os membros'),

    new SlashCommandBuilder()
        .setName('testaraprovacao')
        .setDescription('🧪 [Staff] Envia uma ficha de teste no canal de aprovação 1560365072822304900')
].map(cmd => cmd.toJSON());

/**
 * Registra os comandos Slash na API do Discord
 */
async function registrarComandosSlash(clientId, guildId = null) {
    if (!CONFIG.token) {
        console.warn('⚠️ [SLASH] DISCORD_TOKEN não fornecido. Pulei o registro de comandos.');
        return;
    }
    const rest = new REST({ version: '10' }).setToken(CONFIG.token);

    try {
        console.log('🔄 [SLASH] Registrando comandos de barra (/)...');

        if (guildId) {
            // Registro instantâneo no servidor específico (ideal para desenvolvimento e uso imediato)
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: slashCommands }
            );
            console.log(`✅ [SLASH] Comandos registrados instantaneamente no servidor (Guild: ${guildId})!`);
        }

        // Registro global (aparece em todos os servidores onde o bot está presente)
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: slashCommands }
        );
        console.log('✅ [SLASH] Comandos globais registrados com sucesso (/registro, /ficha, /painel, /cargos, /sincronizar, /testaraprovacao)!');
    } catch (err) {
        console.error('❌ [SLASH] Erro ao registrar comandos Slash:', err);
    }
}

// ============================================================================
// 🧠 DETECÇÃO E GERENCIAMENTO INTELIGENTE DE CARGOS & CANAIS
// ============================================================================

function normalizarTexto(txt) {
    return (txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

async function obterCargoFamilia(guild) {
    if (!guild) return null;
    await guild.roles.fetch().catch(() => {});

    if (CONFIG.cargoFamiliaId && guild.roles.cache.has(CONFIG.cargoFamiliaId)) {
        return guild.roles.cache.get(CONFIG.cargoFamiliaId);
    }

    let role = guild.roles.cache.find(r => {
        const n = normalizarTexto(r.name);
        return n.includes('souza') || n.includes('familia') || n.includes('[souza]') || n.includes('[fs]');
    });

    if (!role) {
        role = await guild.roles.create({
            name: '⚜️ Família Souza',
            color: '#D4AF37',
            hoist: true,
            reason: 'Cargo oficial da Família Souza gerado automaticamente pelo bot'
        }).catch(() => null);
    }

    if (role) CONFIG.cargoFamiliaId = role.id;
    return role;
}

async function obterCargoAmigos(guild) {
    if (!guild) return null;
    await guild.roles.fetch().catch(() => {});

    if (CONFIG.cargoAmigosId && guild.roles.cache.has(CONFIG.cargoAmigosId)) {
        return guild.roles.cache.get(CONFIG.cargoAmigosId);
    }

    let role = guild.roles.cache.find(r => {
        const n = normalizarTexto(r.name);
        return n.includes('amigo') || n.includes('amigos') || n.includes('[amigo]');
    });

    if (!role) {
        role = await guild.roles.create({
            name: '🤝 Amigos da Família',
            color: '#2ECC71',
            hoist: true,
            reason: 'Cargo oficial de Amigos gerado automaticamente pelo bot'
        }).catch(() => null);
    }

    if (role) CONFIG.cargoAmigosId = role.id;
    return role;
}

async function obterCargoNaoRegistrado(guild) {
    if (!guild) return null;
    await guild.roles.fetch().catch(() => {});

    if (CONFIG.cargoNaoRegistradoId && guild.roles.cache.has(CONFIG.cargoNaoRegistradoId)) {
        return guild.roles.cache.get(CONFIG.cargoNaoRegistradoId);
    }

    let role = guild.roles.cache.find(r => {
        const n = normalizarTexto(r.name);
        return n.includes('nao registrado') || n.includes('nao-registrado') || n.includes('unregistered');
    });

    if (!role) {
        role = await guild.roles.create({
            name: '❌ Não Registrado',
            color: '#95A5A6',
            hoist: false
        }).catch(() => null);
    }

    if (role) CONFIG.cargoNaoRegistradoId = role.id;
    return role;
}

/**
 * Localiza o canal de aprovação da Staff pelo ID oficial 1560365072822304900
 */
async function obterCanalAprovacao(guild) {
    if (!guild) return null;

    // 1. Tenta buscar pelo ID prioritário configurado (1560365072822304900)
    if (CONFIG.canalAprovacaoId) {
        try {
            const ch = await guild.channels.fetch(CONFIG.canalAprovacaoId).catch(() => null);
            if (ch && ch.isTextBased()) return ch;
        } catch (_) {}
    }

    // 2. Fallback: Procura por canais com nomes relacionados
    await guild.channels.fetch().catch(() => {});
    const fallback = guild.channels.cache.find(c =>
        c.type === ChannelType.GuildText &&
        (c.name.includes('aprovacao') || c.name.includes('fichas') || c.name.includes('staff-registro'))
    );

    return fallback || null;
}

function limparTagsAntigas(nome) {
    if (!nome) return 'Membro';
    return nome.replace(/^\[[^\]]+\]\s*/g, '').trim() || 'Membro';
}

function formatarNickComTag(nomeBase, tag) {
    const limpo = limparTagsAntigas(nomeBase);
    const prefixo = `${tag} `;
    const maxRestante = 32 - prefixo.length;
    return `${prefixo}${limpo.substring(0, Math.max(1, maxRestante))}`;
}

async function aplicarCargoETag(member, isFam, rawNick) {
    const guild = member.guild;
    const roleFamilia = await obterCargoFamilia(guild);
    const roleAmigos = await obterCargoAmigos(guild);
    const roleNaoReg = await obterCargoNaoRegistrado(guild);

    const cargoAlvo = isFam ? roleFamilia : roleAmigos;
    const cargoOposto = isFam ? roleAmigos : roleFamilia;
    const tagAlvo = isFam ? CONFIG.tagFamilia : CONFIG.tagAmigos;

    if (cargoAlvo) await member.roles.add(cargoAlvo).catch(() => {});
    if (cargoOposto && member.roles.cache.has(cargoOposto.id)) {
        await member.roles.remove(cargoOposto).catch(() => {});
    }
    if (roleNaoReg && member.roles.cache.has(roleNaoReg.id)) {
        await member.roles.remove(roleNaoReg).catch(() => {});
    }

    const base = rawNick || member.nickname || member.user.globalName || member.user.username;
    const novoNick = formatarNickComTag(base, tagAlvo);

    let alterouNick = false;
    if (member.manageable) {
        await member.setNickname(novoNick).then(() => { alterouNick = true; }).catch(() => {});
    }

    return {
        cargoEntregue: cargoAlvo?.name || (isFam ? 'Família Souza' : 'Amigos da Família'),
        novoNick,
        alterouNick
    };
}

async function sincronizarTagsTodosMembros(guild) {
    const roleFam = await obterCargoFamilia(guild);
    const roleAmg = await obterCargoAmigos(guild);
    await guild.members.fetch().catch(() => {});

    let atualizadosFam = 0;
    let atualizadosAmg = 0;
    let ignorados = 0;

    for (const member of guild.members.cache.values()) {
        if (member.user.bot) continue;

        const temFam = roleFam && member.roles.cache.has(roleFam.id);
        const temAmg = roleAmg && member.roles.cache.has(roleAmg.id);

        if (temFam) {
            const nomeBase = member.nickname || member.user.globalName || member.user.username;
            const novoNick = formatarNickComTag(nomeBase, CONFIG.tagFamilia);

            if (member.nickname !== novoNick) {
                if (member.manageable) {
                    await member.setNickname(novoNick).then(() => atualizadosFam++).catch(() => ignorados++);
                } else {
                    ignorados++;
                }
            }
        } else if (temAmg) {
            const nomeBase = member.nickname || member.user.globalName || member.user.username;
            const novoNick = formatarNickComTag(nomeBase, CONFIG.tagAmigos);

            if (member.nickname !== novoNick) {
                if (member.manageable) {
                    await member.setNickname(novoNick).then(() => atualizadosAmg++).catch(() => ignorados++);
                } else {
                    ignorados++;
                }
            }
        }
    }

    return {
        atualizadosFam,
        atualizadosAmg,
        total: atualizadosFam + atualizadosAmg,
        ignorados,
        roleFamNome: roleFam?.name || 'Família Souza',
        roleAmgNome: roleAmg?.name || 'Amigos da Família'
    };
}

// ============================================================================
// 🎨 CARDS E PAINÉIS VISUAIS (EMBEDS & BUTTONS)
// ============================================================================

function gerarPainelEscolhaCargos() {
    const embed = new EmbedBuilder()
        .setColor(CONFIG.corEmbed)
        .setTitle('⚜️ REGISTRO OFICIAL • FAMÍLIA SOUZA & AMIGOS ⚜️')
        .setDescription(
            '**Seja muito bem-vindo(a) ao servidor oficial da Família Souza!**\n\n' +
            'Para liberar acesso completo aos canais, escolha a sua categoria:\n\n' +
            '👑 **1. FAMÍLIA SOUZA**\n' +
            '• Receba o cargo oficial de membro da Família\n' +
            '• Ganha a tag `[Souza]` no início do seu apelido\n' +
            '• Acesso às salas exclusivas da Família\n\n' +
            '🤝 **2. AMIGOS DA FAMÍLIA**\n' +
            '• Receba o cargo de Amigo Oficial\n' +
            '• Ganha a tag `[AMIGO]` no apelido\n' +
            '• Acesso aos canais comunitários e jogos\n\n' +
            '📢 *Após preencher a ficha, ela será enviada para o canal de aprovação da Staff.*'
        )
        .setFooter({ text: 'Sistema de Registro Automático • Família Souza' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_iniciar_familia')
            .setLabel('Entrar na Família [Souza]')
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
        .setTitle('⚜️ REGISTRO DE MEMBRO • FAMÍLIA SOUZA ⚜️')
        .setDescription(
            `Olá ${user ? `<@${user.id}>` : 'Membro'}! Para começar sua jornada conosco, escolha sua categoria:\n\n` +
            '⚜️ **Família Souza:** Se você faz parte da Família (Tag `[Souza]`)\n' +
            '🤝 **Amigo da Família:** Se você é amigo ou visitante (Tag `[AMIGO]`)\n\n' +
            '👇 *Clique no botão correspondente abaixo para abrir sua ficha:*'
        )
        .setFooter({ text: 'Canal de Aprovação configurado: ' + CONFIG.canalAprovacaoId })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_iniciar_familia')
            .setLabel('Entrar na Família [Souza]')
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

// ============================================================================
// 🚀 EVENTO: CLIENT READY (LOGIN E REGISTRO DE SLASH COMMANDS)
// ============================================================================
client.once(Events.ClientReady, async (c) => {
    console.log(`\n======================================================`);
    console.log(`⚜️ [FAMÍLIA SOUZA] BOT CONECTADO COM SUCESSO!`);
    console.log(`👤 Usuário: ${c.user.tag} (ID: ${c.user.id})`);
    console.log(`📡 Servidores conectados: ${c.guilds.cache.size}`);
    console.log(`🎯 Canal de Aprovação Alvo: ${CONFIG.canalAprovacaoId}`);
    console.log(`======================================================\n`);

    // Registra os Slash Commands imediatamente
    const targetGuildId = CONFIG.guildId || c.guilds.cache.first()?.id;
    await registrarComandosSlash(c.user.id, targetGuildId);

    // Valida a existência do canal de aprovação em cada servidor
    for (const guild of c.guilds.cache.values()) {
        const canal = await obterCanalAprovacao(guild);
        if (canal) {
            console.log(`✅ [CANAL APROVAÇÃO] Encontrado no servidor "${guild.name}": #${canal.name} (ID: ${canal.id})`);
        } else {
            console.warn(`⚠️ [CANAL APROVAÇÃO] Canal ${CONFIG.canalAprovacaoId} não encontrado no servidor "${guild.name}". Verifique se o bot tem permissão de "Ver Canal".`);
        }
    }
});

// ============================================================================
// 👤 EVENTO: NOVO MEMBRO ENTRA (ENTREGA NÃO REGISTRADO SILENCIOSO)
// ============================================================================
client.on(Events.GuildMemberAdd, async (member) => {
    try {
        console.log(`[ENTRADA] ${member.user.tag} entrou no servidor.`);
        const roleNaoReg = await obterCargoNaoRegistrado(member.guild);
        if (roleNaoReg) {
            await member.roles.add(roleNaoReg).catch(() => {});
        }
    } catch (err) {
        console.error('Erro no guildMemberAdd:', err.message);
    }
});

// ============================================================================
// 🔄 EVENTO: DETECÇÃO AUTOMÁTICA DE ATRIBUIÇÃO MANUAL DE CARGOS
// ============================================================================
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    try {
        const guild = newMember.guild;
        const roleFam = await obterCargoFamilia(guild);
        const roleAmg = await obterCargoAmigos(guild);

        const tinhaFam = roleFam && oldMember.roles.cache.has(roleFam.id);
        const temFam = roleFam && newMember.roles.cache.has(roleFam.id);

        const tinhaAmg = roleAmg && oldMember.roles.cache.has(roleAmg.id);
        const temAmg = roleAmg && newMember.roles.cache.has(roleAmg.id);

        if (!tinhaFam && temFam) {
            const nomeBase = newMember.nickname || newMember.user.globalName || newMember.user.username;
            const novoNick = formatarNickComTag(nomeBase, CONFIG.tagFamilia);
            if (newMember.manageable && newMember.nickname !== novoNick) {
                await newMember.setNickname(novoNick).catch(() => {});
            }
        } else if (!tinhaAmg && temAmg) {
            const nomeBase = newMember.nickname || newMember.user.globalName || newMember.user.username;
            const novoNick = formatarNickComTag(nomeBase, CONFIG.tagAmigos);
            if (newMember.manageable && newMember.nickname !== novoNick) {
                await newMember.setNickname(novoNick).catch(() => {});
            }
        }
    } catch (err) {
        console.error('Erro no guildMemberUpdate:', err.message);
    }
});

// ============================================================================
// ⚡ EVENTO: INTERACTION CREATE (SLASH COMMANDS, BOTÕES E MODAIS)
// ============================================================================
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        // --------------------------------------------------------------------
        // 1. SLASH COMMANDS (/)
        // --------------------------------------------------------------------
        if (interaction.isChatInputCommand()) {
            const { commandName } = interaction;

            // /registro
            if (commandName === 'registro') {
                return await interaction.reply({
                    ...gerarCardRegistroMembro(interaction.user),
                    ephemeral: true
                });
            }

            // /ficha
            if (commandName === 'ficha') {
                return await interaction.reply({
                    ...gerarCardRegistroMembro(interaction.user),
                    ephemeral: true
                });
            }

            // /painel
            if (commandName === 'painel') {
                const perms = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles) ||
                              interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
                if (!perms) {
                    return await interaction.reply({
                        content: '❌ Apenas a Staff pode enviar o painel oficial de registro.',
                        ephemeral: true
                    });
                }

                await interaction.channel.send(gerarPainelEscolhaCargos());
                return await interaction.reply({
                    content: '✅ Painel oficial de registro enviado no canal com sucesso!',
                    ephemeral: true
                });
            }

            // /cargos
            if (commandName === 'cargos') {
                const roleFam = await obterCargoFamilia(interaction.guild);
                const roleAmg = await obterCargoAmigos(interaction.guild);
                const roleNaoReg = await obterCargoNaoRegistrado(interaction.guild);
                const canalApv = await obterCanalAprovacao(interaction.guild);

                const embedCargos = new EmbedBuilder()
                    .setColor(CONFIG.corEmbed)
                    .setTitle('📋 CONFIGURAÇÕES • FAMÍLIA SOUZA & AMIGOS')
                    .setDescription(
                        `⚜️ **Cargo Família:** ${roleFam ? `<@&${roleFam.id}> (ID: \`${roleFam.id}\`)` : '❌ Não encontrado'}\n` +
                        `🤝 **Cargo Amigos:** ${roleAmg ? `<@&${roleAmg.id}> (ID: \`${roleAmg.id}\`)` : '❌ Não encontrado'}\n` +
                        `❌ **Não Registrado:** ${roleNaoReg ? `<@&${roleNaoReg.id}> (ID: \`${roleNaoReg.id}\`)` : '❌ Não encontrado'}\n\n` +
                        `📥 **Canal de Aprovação:** ${canalApv ? `<#${canalApv.id}> (ID: \`${canalApv.id}\`)` : `❌ ID \`${CONFIG.canalAprovacaoId}\` não encontrado!`}`
                    )
                    .setFooter({ text: 'Família Souza • Sistema de Registro' })
                    .setTimestamp();

                return await interaction.reply({ embeds: [embedCargos], ephemeral: true });
            }

            // /sincronizar
            if (commandName === 'sincronizar') {
                const perms = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageNicknames) ||
                              interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
                if (!perms) {
                    return await interaction.reply({
                        content: '❌ Apenas a Staff pode sincronizar tags dos membros.',
                        ephemeral: true
                    });
                }

                await interaction.deferReply({ ephemeral: true });
                const res = await sincronizarTagsTodosMembros(interaction.guild);

                const embedRes = new EmbedBuilder()
                    .setColor(CONFIG.corEmbed)
                    .setTitle('🔄 SINCRONIZAÇÃO CONCLUÍDA • FAMÍLIA SOUZA')
                    .setDescription(
                        `⚜️ **Membros com [${res.roleFamNome}]:** ${res.atualizadosFam} atualizados com tag \`[Souza]\`\n` +
                        `🤝 **Membros com [${res.roleAmgNome}]:** ${res.atualizadosAmg} atualizados com tag \`[AMIGO]\`\n` +
                        `📊 **Total Atualizados:** ${res.total}\n` +
                        `${res.ignorados > 0 ? `⚠️ **Ignorados:** ${res.ignorados} (Cargos acima do bot ou Dono)` : '✅ Todos os membros elegíveis foram atualizados!'}`
                    );

                return await interaction.editReply({ embeds: [embedRes] });
            }

            // /testaraprovacao
            if (commandName === 'testaraprovacao') {
                const perms = interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
                if (!perms) {
                    return await interaction.reply({
                        content: '❌ Apenas administradores podem rodar o teste de aprovação.',
                        ephemeral: true
                    });
                }

                const canalApv = await obterCanalAprovacao(interaction.guild);
                if (!canalApv) {
                    return await interaction.reply({
                        content: `❌ Canal de aprovação (ID: \`${CONFIG.canalAprovacaoId}\`) não foi encontrado ou o bot não tem permissão de visualizá-lo!`,
                        ephemeral: true
                    });
                }

                const embedTeste = new EmbedBuilder()
                    .setColor(CONFIG.corEmbed)
                    .setTitle('🧪 TESTE DE CONEXÃO DO CANAL DE APROVAÇÃO')
                    .setDescription(
                        `✅ O bot conseguiu se comunicar com sucesso com este canal de aprovação!\n` +
                        `**Canal ID:** \`${canalApv.id}\`\n` +
                        `**Executor:** <@${interaction.user.id}>\n\n` +
                        `*Todas as fichas de registro de membros enviadas por /registro ou /ficha serão encaminhadas para cá com os botões de Aprovar e Reprovar.*`
                    )
                    .setTimestamp();

                await canalApv.send({ embeds: [embedTeste] });
                return await interaction.reply({
                    content: `✅ Mensagem de teste enviada com sucesso no canal <#${canalApv.id}>!`,
                    ephemeral: true
                });
            }
        }

        // --------------------------------------------------------------------
        // 2. BOTÕES DE ABERTURA DE MODAL (FICHA)
        // --------------------------------------------------------------------
        if (interaction.isButton()) {
            if (interaction.customId === 'btn_iniciar_familia') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_familia')
                    .setTitle('Ficha: Família Souza [Souza]');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('nome')
                            .setLabel('Seu Nome ou Nick RP:')
                            .setPlaceholder('Ex: Gabriel Souza')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(24)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('idade')
                            .setLabel('Sua Idade:')
                            .setPlaceholder('Ex: 18')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(3)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('p1')
                            .setLabel('Quem te convidou para os Souza?')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('p2')
                            .setLabel('Concorda em honrar a tag [Souza]?')
                            .setStyle(TextInputStyle.Short)
                            .setPlaceholder('Sim / Concordo')
                            .setRequired(true)
                    )
                );

                return await interaction.showModal(modal);
            }

            if (interaction.customId === 'btn_iniciar_amigos') {
                const modal = new ModalBuilder()
                    .setCustomId('modal_amigos')
                    .setTitle('Ficha: Amigo da Família [AMIGO]');

                modal.addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('nome')
                            .setLabel('Seu Nome ou Nick RP:')
                            .setPlaceholder('Ex: Lucas')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(24)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('idade')
                            .setLabel('Sua Idade:')
                            .setPlaceholder('Ex: 20')
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(3)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('p1')
                            .setLabel('De quem você é amigo na Família Souza?')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('p2')
                            .setLabel('Quais jogos você costuma jogar?')
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                );

                return await interaction.showModal(modal);
            }
        }

        // --------------------------------------------------------------------
        // 3. ENVIO DO FORMULÁRIO (MODAL SUBMIT)
        // --------------------------------------------------------------------
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modal_familia' || interaction.customId === 'modal_amigos') {
                await interaction.deferReply({ ephemeral: true });

                const isFam = interaction.customId === 'modal_familia';
                const tagAlvo = isFam ? CONFIG.tagFamilia : CONFIG.tagAmigos;
                const nome = interaction.fields.getTextInputValue('nome').trim();
                const idade = interaction.fields.getTextInputValue('idade').trim();
                const p1 = interaction.fields.getTextInputValue('p1').trim();
                const p2 = interaction.fields.getTextInputValue('p2').trim();

                const canalStaff = await obterCanalAprovacao(interaction.guild);

                if (!canalStaff) {
                    return await interaction.editReply({
                        content: `❌ O canal de aprovação da Staff (\`${CONFIG.canalAprovacaoId}\`) não foi encontrado. Contate um Administrador.`
                    });
                }

                // Cria ID único seguro para a ficha (evita limite de 100 caracteres no customId)
                const submissionId = `sub_${Date.now()}_${interaction.user.id.slice(-4)}`;
                fichasPendentes.set(submissionId, {
                    userId: interaction.user.id,
                    isFam,
                    nome,
                    idade,
                    p1,
                    p2,
                    data: new Date()
                });

                const nickPrevisto = formatarNickComTag(nome, tagAlvo);

                const embedStaff = new EmbedBuilder()
                    .setColor(isFam ? CONFIG.corEmbed : CONFIG.corAmigos)
                    .setTitle(`📥 NOVA FICHA DE REGISTRO • ${isFam ? `⚜️ FAMÍLIA SOUZA ${CONFIG.tagFamilia}` : `🤝 AMIGOS ${CONFIG.tagAmigos}`}`)
                    .setDescription(
                        `👤 **Membro:** <@${interaction.user.id}> (\`${interaction.user.tag}\`)\n` +
                        `🏷️ **Cargo Pretendido:** ${isFam ? '⚜️ Família Souza' : '🤝 Amigos da Família'}\n` +
                        `📝 **Nick Solicitado:** **${nome}**\n` +
                        `🏷️ **Nick com Tag Oficial:** \`${nickPrevisto}\`\n` +
                        `🎂 **Idade:** ${idade} anos\n\n` +
                        `📋 **Questionário:**\n` +
                        `> **${isFam ? 'Quem convidou:' : 'Amigo de quem:'}** ${p1}\n` +
                        `> **${isFam ? 'Honrar a tag:' : 'Jogos:'}** ${p2}`
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter({ text: `Canal de Aprovação ID: ${canalStaff.id} • Protocolo: ${submissionId}` })
                    .setTimestamp();

                const rowBotoes = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`apv|${submissionId}`)
                        .setLabel(`Aprovar ${tagAlvo}`)
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId(`rep|${submissionId}`)
                        .setLabel('Reprovar')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('❌')
                );

                await canalStaff.send({
                    content: `📢 **Nova ficha de registro recebida para avaliação!**`,
                    embeds: [embedStaff],
                    components: [rowBotoes]
                });

                return await interaction.editReply({
                    content: `✅ **Sua ficha para a Família Souza foi enviada com sucesso para a Staff no canal de aprovação!**\n\n` +
                             `Assim que um moderador avaliar sua solicitação, você receberá o cargo e seu apelido será ajustado para \`${nickPrevisto}\`.`
                });
            }
        }

        // --------------------------------------------------------------------
        // 4. APROVAÇÃO / REPROVAÇÃO PELA STAFF
        // --------------------------------------------------------------------
        if (interaction.isButton() && (interaction.customId.startsWith('apv|') || interaction.customId.startsWith('rep|'))) {
            const temPerm = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles) ||
                            interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);

            if (!temPerm) {
                return await interaction.reply({
                    content: '❌ Apenas membros da Staff com permissão de Gerenciar Cargos podem aprovar ou reprovar!',
                    ephemeral: true
                });
            }

            await interaction.deferUpdate();
            const [acao, subId] = interaction.customId.split('|');
            const ficha = fichasPendentes.get(subId);

            if (!ficha) {
                return await interaction.followUp({
                    content: '⚠️ Esta ficha não está mais no cache em memória. Caso o bot tenha reiniciado, peça para o usuário refazer a solicitação via `/registro`.',
                    ephemeral: true
                });
            }

            const member = await interaction.guild.members.fetch(ficha.userId).catch(() => null);

            if (acao === 'apv') {
                if (!member) {
                    return await interaction.followUp({
                        content: '⚠️ Membro não foi encontrado no servidor (pode ter saído).',
                        ephemeral: true
                    });
                }

                // Aplica cargo e tag no nick
                const resultado = await aplicarCargoETag(member, ficha.isFam, ficha.nome);

                // Notifica no canal de aprovação
                await interaction.editReply({
                    content: `✅ **FICHA APROVADA por <@${interaction.user.id}>!**\n` +
                             `👤 **Membro:** <@${member.id}>\n` +
                             `🏷️ **Cargo Entregue:** **${resultado.cargoEntregue}**\n` +
                             `📝 **Nick Ajustado:** \`${resultado.novoNick}\``,
                    components: []
                });

                // Notifica o membro no privado (DM)
                await member.send({
                    content: `🎉 **Parabéns! Sua ficha na Família Souza foi APROVADA!**\n\n` +
                             `⚜️ **Cargo:** ${resultado.cargoEntregue}\n` +
                             `🏷️ **Seu Nick:** \`${resultado.novoNick}\`\n\n` +
                             `Seja bem-vindo(a) e divirta-se em nossa comunidade!`
                }).catch(() => {});

                fichasPendentes.delete(subId);
            } else if (acao === 'rep') {
                await interaction.editReply({
                    content: `❌ **FICHA REPROVADA por <@${interaction.user.id}>.**\n` +
                             `👤 **Membro:** <@${ficha.userId}>`,
                    components: []
                });

                if (member) {
                    await member.send({
                        content: `❌ **Aviso:** Sua solicitação de entrada na **Família Souza** não foi aprovada pela moderação.`
                    }).catch(() => {});
                }

                fichasPendentes.delete(subId);
            }
        }
    } catch (err) {
        console.error('❌ Erro durante o processamento de interação:', err);
    }
});

// ============================================================================
// 💬 COMANDOS VIA MENSAGEM (!registro, !painel, !ficha, !cargos, !sincronizar)
// ============================================================================
client.on(Events.MessageCreate, async (msg) => {
    if (msg.author.bot || !msg.guild) return;
    const content = msg.content.trim().toLowerCase();

    if (content === '!registro' || content === '!ficha') {
        return msg.reply(gerarCardRegistroMembro(msg.author));
    }

    if (content === '!painel') {
        const perms = msg.member.permissions.has(PermissionsBitField.Flags.ManageRoles) ||
                      msg.member.permissions.has(PermissionsBitField.Flags.Administrator);
        if (!perms) return msg.reply('❌ Apenas a Staff pode enviar o painel oficial.');
        return msg.channel.send(gerarPainelEscolhaCargos());
    }

    if (content === '!cargos') {
        const roleFam = await obterCargoFamilia(msg.guild);
        const roleAmg = await obterCargoAmigos(msg.guild);
        const roleNaoReg = await obterCargoNaoRegistrado(msg.guild);
        const canalApv = await obterCanalAprovacao(msg.guild);

        const embedCargos = new EmbedBuilder()
            .setColor(CONFIG.corEmbed)
            .setTitle('📋 CARGOS CONFIGURADOS • FAMÍLIA SOUZA')
            .setDescription(
                `⚜️ **Família Souza:** ${roleFam ? `<@&${roleFam.id}> (ID: \`${roleFam.id}\`)` : '❌ Não encontrado'}\n` +
                `🤝 **Amigos:** ${roleAmg ? `<@&${roleAmg.id}> (ID: \`${roleAmg.id}\`)` : '❌ Não encontrado'}\n` +
                `❌ **Não Registrado:** ${roleNaoReg ? `<@&${roleNaoReg.id}> (ID: \`${roleNaoReg.id}\`)` : '❌ Não encontrado'}\n\n` +
                `📥 **Canal de Aprovação:** ${canalApv ? `<#${canalApv.id}> (\`${canalApv.id}\`)` : `❌ ID \`${CONFIG.canalAprovacaoId}\` não encontrado`}`
            );
        return msg.reply({ embeds: [embedCargos] });
    }

    if (content === '!sincronizartags' || content === '!sincronizar') {
        const perms = msg.member.permissions.has(PermissionsBitField.Flags.ManageNicknames) ||
                      msg.member.permissions.has(PermissionsBitField.Flags.Administrator);
        if (!perms) return msg.reply('❌ Apenas a Staff pode sincronizar tags.');

        const waitMsg = await msg.reply('⏳ **Sincronizando tags da Família Souza de todos os membros... Aguarde.**');
        const res = await sincronizarTagsTodosMembros(msg.guild);

        const embedRes = new EmbedBuilder()
            .setColor(CONFIG.corEmbed)
            .setTitle('🔄 SINCRONIZAÇÃO DE TAGS • FAMÍLIA SOUZA')
            .setDescription(
                `⚜️ **Membros com [${res.roleFamNome}]:** Atualizados com a tag \`[Souza]\` (${res.atualizadosFam})\n` +
                `🤝 **Membros com [${res.roleAmgNome}]:** Atualizados com a tag \`[AMIGO]\` (${res.atualizadosAmg})\n` +
                `📊 **Total de Nicks Atualizados:** ${res.total}\n` +
                `${res.ignorados > 0 ? `⚠️ **Ignorados:** ${res.ignorados} (Dono do servidor ou cargos acima do bot)` : '✅ Todos os membros atualizados com sucesso!'}`
            );

        return waitMsg.edit({ content: null, embeds: [embedRes] });
    }
});

// ============================================================================
// 🔑 INICIALIZAÇÃO DO BOT
// ============================================================================
if (CONFIG.token && CONFIG.token.length > 25) {
    client.login(CONFIG.token).catch(err => {
        console.error('❌ [DISCORD LOGIN] Erro ao conectar:', err.message);
    });
} else {
    console.log('ℹ️ [DISCORD] Nenhum DISCORD_TOKEN configurado no arquivo .env.');
    console.log('ℹ️ Para ativar o bot ao vivo, adicione DISCORD_TOKEN="seu_token_aqui" no arquivo .env');
}

module.exports = { client, CONFIG, registrarComandosSlash, obterCanalAprovacao };

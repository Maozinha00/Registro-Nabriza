/**
 * ============================================================================
 * ⚜️ BOT DISCORD 01 • SISTEMA EXCLUSIVO DE REGISTRO & CARGOS ⚜️
 * FAMÍLIA NABRIZA & AMIGOS (AUTO-TAG & DETECÇÃO INTELIGENTE DE CARGOS)
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
    console.error(`🛡️ [ANTI-CRASH] Exceção (${origin}):`, err.message || err);
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

    // Tags Oficiais
    tagFamilia: "[NaBriza]",
    tagAmigos: "[AMIGO]",

    // IDs opcionais (podem ser passados via Railway)
    cargoChefeId: process.env.CARGO_CHEFE_ID ? process.env.CARGO_CHEFE_ID.trim() : null,
    cargoFamiliaId: process.env.CARGO_FAMILIA_ID ? process.env.CARGO_FAMILIA_ID.trim() : null,
    cargoAmigosId: process.env.CARGO_AMIGOS_ID ? process.env.CARGO_AMIGOS_ID.trim() : null,
    cargoNaoRegistradoId: process.env.CARGO_NAO_REGISTRADO_ID ? process.env.CARGO_NAO_REGISTRADO_ID.trim() : null,

    // Canal de Aprovação Staff
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
        tagAmigos: CONFIG.tagAmigos,
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
        GatewayIntentBits.GuildMembers,      // Obrigatório no Discord Dev Portal
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent     // Obrigatório no Discord Dev Portal
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

// ============================================================================
// 🧠 DETECÇÃO E GERENCIAMENTO INTELIGENTE DE CARGOS
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
        return n.includes('nabriza') || n.includes('familia') || n.includes('[nabriza]') || n.includes('[fn]');
    });

    if (!role) {
        role = await guild.roles.create({
            name: '⚜️ Família NaBriza',
            color: '#D4AF37',
            hoist: true,
            reason: 'Cargo oficial da Família NaBriza gerado automaticamente pelo bot'
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
            name: '🤝 Amigos',
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

function limparTagsAntigas(nome) {
    if (!nome) return 'Membro';
    return nome.replace(/^\[[^\]]+\]\s*/g, '').trim() || 'Membro';
}

function formatarNickComTag(nomeBase, tag) {
    const limpo = limparTagsAntigas(nomeBase);
    const prefixo = `${tag} `;
    const maxRestante = 32 - prefixo.length;
    return `${prefixo}${limpo.substring(0, maxRestante)}`;
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

    if (member.manageable) {
        await member.setNickname(novoNick).catch(() => {});
    }

    return {
        cargoEntregue: cargoAlvo?.name || (isFam ? 'Família NaBriza' : 'Amigos'),
        novoNick
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
        roleFamNome: roleFam?.name || 'Família NaBriza',
        roleAmgNome: roleAmg?.name || 'Amigos'
    };
}

// 👤 Evento: Novo Membro Entra no Servidor (100% Silencioso)
client.on(Events.GuildMemberAdd, async (member) => {
    try {
        console.log(`[NOVO MEMBRO SILENCIOSO] ${member.user.tag} entrou.`);
        const roleNaoReg = await obterCargoNaoRegistrado(member.guild);
        if (roleNaoReg) {
            await member.roles.add(roleNaoReg).catch(() => {});
        }
    } catch (err) {
        console.error('Erro no guildMemberAdd:', err.message);
    }
});

// 🔄 Evento: Detecção Automática de Mudança de Cargo
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

// 💬 Comandos com Prefixo (!sincronizartags, !cargos, !painel)
client.on(Events.MessageCreate, async (msg) => {
    if (msg.author.bot || !msg.guild) return;
    const content = msg.content.trim().toLowerCase();

    if (content === '!sincronizartags' || content === '!atualizartags' || content === '!sincronizar') {
        const perms = msg.member.permissions.has(PermissionsBitField.Flags.ManageNicknames) ||
                      msg.member.permissions.has(PermissionsBitField.Flags.Administrator);
        if (!perms) return msg.reply('❌ Apenas a Staff pode sincronizar tags.');

        const waitMsg = await msg.reply('⏳ **Sincronizando tags de todos os membros do servidor... Aguarde.**');
        const res = await sincronizarTagsTodosMembros(msg.guild);

        const embedRes = new EmbedBuilder()
            .setColor(CONFIG.corEmbed)
            .setTitle('🔄 SINCRONIZAÇÃO DE TAGS CONCLUÍDA!')
            .setDescription(
                `⚜️ **Membros com Cargo [${res.roleFamNome}]:** Atualizados com a tag \`[NaBriza]\` (${res.atualizadosFam})\n` +
                `🤝 **Membros com Cargo [${res.roleAmgNome}]:** Atualizados com a tag \`[AMIGO]\` (${res.atualizadosAmg})\n` +
                `📊 **Total de Nicks Atualizados:** ${res.total}\n` +
                `${res.ignorados > 0 ? `⚠️ **Ignorados:** ${res.ignorados} (Dono do servidor ou cargos acima do bot)` : '✅ Todos os membros atualizados com sucesso!'}`
            )
            .setFooter({ text: 'O cargo do bot deve estar no topo para gerenciar todos os nicks!' })
            .setTimestamp();

        return waitMsg.edit({ content: null, embeds: [embedRes] });
    }

    if (content === '!cargos' || content === '!vercargos') {
        const roleFam = await obterCargoFamilia(msg.guild);
        const roleAmg = await obterCargoAmigos(msg.guild);
        const roleNaoReg = await obterCargoNaoRegistrado(msg.guild);

        const embedCargos = new EmbedBuilder()
            .setColor(CONFIG.corEmbed)
            .setTitle('📋 CARGOS CONFIGURADOS NO BOT')
            .setDescription(
                `⚜️ **Família NaBriza:** ${roleFam ? `<@&${roleFam.id}> (ID: \`${roleFam.id}\`)` : '❌ Não encontrado'}\n` +
                `🤝 **Amigos:** ${roleAmg ? `<@&${roleAmg.id}> (ID: \`${roleAmg.id}\`)` : '❌ Não encontrado'}\n` +
                `❌ **Não Registrado:** ${roleNaoReg ? `<@&${roleNaoReg.id}> (ID: \`${roleNaoReg.id}\`)` : '❌ Não encontrado'}`
            );
        return msg.reply({ embeds: [embedCargos] });
    }

    if (content === '!painel') {
        return msg.channel.send(gerarPainelEscolhaCargos());
    }

    if (content === '!registro') {
        return msg.reply(gerarCardRegistroMembro(msg.author));
    }
});

// Painéis e Botões
function gerarPainelEscolhaCargos() {
    const embed = new EmbedBuilder()
        .setColor(CONFIG.corEmbed)
        .setTitle('╔══════════════════════════════════════════════╗\n║     ⚜️ REGISTRO OFICIAL DE CARGOS ⚜️         ║\n║             FAMÍLIA & AMIGOS                 ║\n╚══════════════════════════════════════════════╝')
        .setDescription(
            '👋 **Seja muito bem-vindo(a) ao servidor Família & Amigos!**\n\n' +
            'Para liberar o acesso aos canais, escolha a sua categoria:\n\n' +
            '⚜️ **1. FAMÍLIA NABRIZA [NaBriza]** (Tag `[NaBriza]` no Nick)\n' +
            '🤝 **2. AMIGOS DA FAMÍLIA [AMIGO]** (Tag `[AMIGO]` no Nick)\n\n' +
            '👇 *Clique no botão abaixo para preencher sua ficha:*'
        );

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
            `Olá ${user ? `<@${user.id}>` : 'Membro'}! Escolha sua categoria:\n\n` +
            '⚜️ **1. FAMÍLIA NABRIZA [NaBriza]**\n' +
            '🤝 **2. AMIGOS DA FAMÍLIA [AMIGO]**\n\n' +
            '👇 *Clique no botão abaixo para preencher sua ficha:*'
        );

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

// ⚡ Interações: Modal e Aprovação
client.on(Events.InteractionCreate, async (interaction) => {
    try {
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
                    .setTitle(`📥 NOVA FICHA DE REGISTRO • ${isFam ? `⚜️ FAMÍLIA NABRIZA ${CONFIG.tagFamilia}` : `🤝 AMIGOS ${CONFIG.tagAmigos}`}`)
                    .setDescription(
                        `👤 **Membro:** <@${interaction.user.id}>\n` +
                        `🏷️ **Cargo:** ${isFam ? 'Família NaBriza' : 'Amigo da Família'}\n` +
                        `📝 **Nick Solicitado:** **${nome}**\n` +
                        `🏷️ **Nick com Tag:** \`${tag} ${limparTagsAntigas(nome)}\`\n` +
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
                content: `✅ **Sua ficha foi enviada com sucesso para a Staff!** Aguarde a aprovação para receber o cargo e a tag.`
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

            // Entrega o cargo exato e atualiza o nick com a tag
            const res = await aplicarCargoETag(member, isFam, rawNick);

            await interaction.editReply({
                content: `✅ **Aprovado por <@${interaction.user.id}>!**\n🏷️ Cargo entregue: **${res.cargoEntregue}**\n📝 Nick atualizado: \`${res.novoNick}\``,
                embeds: [],
                components: []
            });

            await member.send(`🎉 Sua ficha foi **APROVADA**! Você recebeu o cargo **${res.cargoEntregue}** e seu nick foi atualizado para **${res.novoNick}**. Bom jogo! ⚜️`).catch(() => {});
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

// Login do Bot
if (CONFIG.token && CONFIG.token.length > 25) {
    client.login(CONFIG.token).catch(err => console.error('Erro no login:', err.message));
}

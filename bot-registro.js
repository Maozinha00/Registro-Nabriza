/**
 * ============================================================================
 * ⚜️ BOT DISCORD OFICIAL • FAMÍLIA SOUZA & AMIGOS ⚜️
 * ============================================================================
 * 🚪 CANAL DE RECEPÇÃO: 1561031405100867644 (De Souza Para Família)
 * 🖼️ BANNER DE RECEPÇÃO: https://i.imgur.com/h8BPD29.png
 * 📋 CANAL DO PAINEL FIXO: 1560360800156385473 (👋・「pedir-cargo」)
 * 📥 CANAL DE APROVAÇÃO STAFF: 1560365072822304900
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

// 🛡️ SISTEMA ANTI-CRASH
process.on('unhandledRejection', (reason) => {
    console.error('🛡️ [ANTI-CRASH] Rejeição interceptada:', reason);
});
process.on('uncaughtException', (err, origin) => {
    console.error(`🛡️ [ANTI-CRASH] Exceção capturada (${origin}):`, err.message || err);
});

// ⚙️ CONFIGURAÇÕES CENTRALIZADAS
const CONFIG = {
    token: (process.env.DISCORD_TOKEN || "").trim(),
    clientId: (process.env.CLIENT_ID || "").trim(),
    guildId: (process.env.GUILD_ID || "").trim() || null,

    // 🚪 CANAL DE RECEPÇÃO & BOAS-VINDAS
    canalRecepcaoId: (process.env.CANAL_RECEPCAO_ID || "1561031405100867644").trim(),
    imagemRecepcaoUrl: (process.env.IMAGEM_RECEPCAO_URL || "https://i.imgur.com/h8BPD29.png").trim(),

    // 📋 CANAL DO PAINEL FIXO DE CARGOS (👋・「pedir-cargo」)
    canalPainelId: (process.env.CANAL_PAINEL_ID || "1560360800156385473").trim(),
    nomeCanalPainel: process.env.NOME_CANAL_PAINEL || "👋・「pedir-cargo」",

    // 📥 CANAL DE APROVAÇÃO DA STAFF
    canalAprovacaoId: (process.env.CANAL_APROVACAO_ID || "1560365072822304900").trim(),

    // Tags Oficiais
    tagFamilia: "[Souza]",
    tagAmigos: "[AMIGO]",

    // Cores das Embeds
    corEmbed: 0xD4AF37,  // Dourado Nobre
    corAmigos: 0x2ECC71, // Verde Amizade
    corErro: 0xE74C3C,   // Vermelho

    port: process.env.PORT || 3000
};

// Cache em memória para fichas de registro pendentes
const fichasPendentes = new Map();

// 🌐 SERVIDOR HTTP LEVE PARA HEALTH-CHECK DA HOSPEDAGEM (Discloud/Railway/Render)
let client = null;
const server = http.createServer((req, res) => {
    const isReady = Boolean(client && client.isReady());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        sistema: 'Bot Família Souza • Recepção & Cargos',
        status: isReady ? 'online' : 'iniciando',
        canalRecepcao: CONFIG.canalRecepcaoId,
        canalPainel: CONFIG.canalPainelId,
        canalAprovacao: CONFIG.canalAprovacaoId,
        bot: client?.user ? client.user.tag : 'Aguardando inicialização...',
        servidores: client?.guilds?.cache?.size || 0,
        uptime: Math.floor(process.uptime())
    }));
});

if (!process.env.DISABLE_BOT_HTTP_SERVER) {
    server.listen(CONFIG.port, () => {
        console.log(`🌐 [HTTP HEALTH-CHECK] Escutando na porta ${CONFIG.port}`);
    });
}

// Inicializa o Client Discord com as Intents necessárias
client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,      // Necessário: Ativar no Discord Developer Portal
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

// ============================================================================
// 📜 COMANDOS SLASH (/)
// ============================================================================
const slashCommands = [
    new SlashCommandBuilder()
        .setName('painel')
        .setDescription('👑 [Staff] Envia o painel oficial fixo de cargos no canal 👋・「pedir-cargo」'),

    new SlashCommandBuilder()
        .setName('cargos')
        .setDescription('📋 Lista os cargos configurados para a Família Souza e Amigos'),

    new SlashCommandBuilder()
        .setName('sincronizar')
        .setDescription('🔄 [Staff] Sincroniza em lote as tags [Souza] e [AMIGO] de todos os membros'),

    new SlashCommandBuilder()
        .setName('testarrecepcao')
        .setDescription('🧪 [Staff] Testa o envio da recepção no canal 1561031405100867644'),

    new SlashCommandBuilder()
        .setName('testaraprovacao')
        .setDescription('🧪 [Staff] Envia mensagem de teste no canal de aprovação 1560365072822304900')
].map(cmd => cmd.toJSON());

async function registrarComandosSlash(clientId, guildId = null) {
    if (!CONFIG.token) return;
    const rest = new REST({ version: '10' }).setToken(CONFIG.token);

    try {
        console.log('🔄 [SLASH] Registrando comandos de barra (/)...');
        if (guildId) {
            await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: slashCommands });
        }
        await rest.put(Routes.applicationCommands(clientId), { body: slashCommands });
        console.log('✅ [SLASH] Comandos registrados com sucesso!');
    } catch (err) {
        console.error('❌ [SLASH] Erro ao registrar comandos:', err.message);
    }
}

// ============================================================================
// 🎨 PAINEL OFICIAL DE CARGOS (CANAL 1560360800156385473)
// ============================================================================
function gerarPainelOficialCargos() {
    const embed = new EmbedBuilder()
        .setColor(CONFIG.corEmbed)
        .setTitle('⚜️ REGISTRO OFICIAL • FAMÍLIA SOUZA & AMIGOS ⚜️')
        .setDescription(
            '**Seja muito bem-vindo(a) ao canal oficial para solicitar seu cargo!**\n\n' +
            'Para liberar acesso completo aos canais, escolha a sua categoria clicando abaixo:\n\n' +
            '👑 **1. FAMÍLIA SOUZA**\n' +
            '• Receba o cargo oficial de membro da Família\n' +
            '• Tag `[Souza]` adicionada ao seu apelido\n' +
            '• Acesso às salas exclusivas da Família\n\n' +
            '🤝 **2. AMIGOS DA FAMÍLIA**\n' +
            '• Receba o cargo oficial de Amigo/Aliado\n' +
            '• Tag `[AMIGO]` no seu apelido\n' +
            '• Acesso aos canais comunitários e jogos\n\n' +
            '📢 *Após preencher a ficha, ela será enviada diretamente para o canal de aprovação da Staff.*'
        )
        .setImage(CONFIG.imagemRecepcaoUrl)
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

// ============================================================================
// 🚀 EVENTO: CLIENT READY
// ============================================================================
client.once(Events.ClientReady, async (c) => {
    console.log(`\n======================================================`);
    console.log(`⚜️ BOT FAMÍLIA SOUZA ONLINE COM SUCESSO!`);
    console.log(`👤 Bot: ${c.user.tag}`);
    console.log(`🚪 Canal Recepção: ${CONFIG.canalRecepcaoId}`);
    console.log(`📋 Canal Painel: ${CONFIG.canalPainelId} (${CONFIG.nomeCanalPainel})`);
    console.log(`📥 Canal Aprovação: ${CONFIG.canalAprovacaoId}`);
    console.log(`======================================================\n`);

    const guildId = CONFIG.guildId || c.guilds.cache.first()?.id;
    await registrarComandosSlash(c.user.id, guildId);
});

// ============================================================================
// 🚪 EVENTO: GUILD MEMBER ADD (RECEPÇÃO NO CANAL 1561031405100867644)
// ============================================================================
client.on(Events.GuildMemberAdd, async (member) => {
    console.log(`🚪 [NOVO MEMBRO] ${member.user.tag} (${member.id}) entrou no servidor.`);

    try {
        // Cargo "Não Registrado" silencioso se existir no servidor
        const roleNaoReg = member.guild.roles.cache.find(r =>
            r.name.toLowerCase().includes('nao registrado') || r.name.toLowerCase().includes('não registrado')
        );
        if (roleNaoReg) {
            await member.roles.add(roleNaoReg).catch(() => {});
        }

        // Canal de Recepção (1561031405100867644)
        const canalRecepcao = await member.guild.channels.fetch(CONFIG.canalRecepcaoId).catch(() => null);

        if (!canalRecepcao || !canalRecepcao.isTextBased()) {
            console.warn(`⚠️ [RECEPÇÃO] Canal ${CONFIG.canalRecepcaoId} não encontrado.`);
            return;
        }

        // Embed Nobre com Banner e Menção (ZERO COMANDOS EXPOSTOS AO USUÁRIO)
        const embedRecepcao = new EmbedBuilder()
            .setColor(CONFIG.corEmbed)
            .setTitle('⚜️ DE SOUZA PARA FAMÍLIA • BEM-VINDO(A)! ⚜️')
            .setDescription(
                `👑 **Saudações nobres, <@${member.id}>!**\n\n` +
                `É uma honra receber você em nossa família! Sinta-se em casa.\n` +
                `Para liberar acesso completo e receber sua tag oficial [Souza] ou [AMIGO]:\n\n` +
                `📜 **Como obter sua Tag Oficial:**\n` +
                `Vá até o canal <#${CONFIG.canalPainelId}> (**${CONFIG.nomeCanalPainel}**) e clique no botão do painel!\n\n` +
                `🏷️ **Categorias disponíveis:**\n` +
                `• ⚜️ **Família [Souza]:** Cargo oficial de membro da Família\n` +
                `• 🤝 **Amigos [AMIGO]:** Cargo para amigos e visitantes\n\n` +
                `📢 *Sua ficha irá para a Staff no canal oficial ${CONFIG.canalAprovacaoId}.*`
            )
            .setImage(CONFIG.imagemRecepcaoUrl) // https://i.imgur.com/h8BPD29.png
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setFooter({
                text: `Membro #${member.guild.memberCount} • De Souza Para Família`,
                iconURL: member.guild.iconURL() || undefined
            })
            .setTimestamp();

        // Envia no canal marcando com o @ da pessoa que entrou
        await canalRecepcao.send({
            content: `👋 Atenção Família Souza! <@${member.id}> acabou de chegar!`,
            embeds: [embedRecepcao]
        });

        console.log(`✅ [RECEPÇÃO] Boas-vindas enviadas para <@${member.id}> no canal #${canalRecepcao.name}`);
    } catch (err) {
        console.error('❌ [RECEPÇÃO] Erro ao processar entrada de membro:', err.message);
    }
});

// ============================================================================
// ⚡ INTERAÇÕES: SLASH COMMANDS, BOTÕES E MODAIS
// ============================================================================
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        // --- 1. COMANDOS SLASH ---
        if (interaction.isChatInputCommand()) {
            const { commandName } = interaction;

            // /painel - Publica no canal oficial 1560360800156385473 (👋・「pedir-cargo」)
            if (commandName === 'painel') {
                const perms = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles) ||
                              interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
                if (!perms) {
                    return interaction.reply({
                        content: '❌ Apenas a Staff pode enviar o painel oficial.',
                        ephemeral: true
                    });
                }

                const canalPainel = await interaction.guild.channels.fetch(CONFIG.canalPainelId).catch(() => null);
                const targetChannel = canalPainel || interaction.channel;

                await targetChannel.send(gerarPainelOficialCargos());
                return interaction.reply({
                    content: `✅ Painel oficial publicado com sucesso no canal <#${targetChannel.id}>!`,
                    ephemeral: true
                });
            }

            // /testarrecepcao - Testa envio no canal 1561031405100867644
            if (commandName === 'testarrecepcao') {
                const canalRecepcao = await interaction.guild.channels.fetch(CONFIG.canalRecepcaoId).catch(() => null);
                if (!canalRecepcao) {
                    return interaction.reply({
                        content: `❌ Canal de recepção \`${CONFIG.canalRecepcaoId}\` não encontrado!`,
                        ephemeral: true
                    });
                }

                const embedTeste = new EmbedBuilder()
                    .setColor(CONFIG.corEmbed)
                    .setTitle('⚜️ DE SOUZA PARA FAMÍLIA • RECEPÇÃO DE TESTE ⚜️')
                    .setDescription(
                        `👑 **Saudações nobres, <@${interaction.user.id}>!**\n\n` +
                        `Este é um teste visual de recepção para o canal \`${CONFIG.canalRecepcaoId}\`.\n\n` +
                        `• **Menção:** <@${interaction.user.id}>\n` +
                        `• **Aba do Painel:** <#${CONFIG.canalPainelId}> (${CONFIG.nomeCanalPainel})\n` +
                        `• **Canal de Aprovação:** <#${CONFIG.canalAprovacaoId}>`
                    )
                    .setImage(CONFIG.imagemRecepcaoUrl)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter({ text: 'De Souza Para Família • Teste de Recepção' })
                    .setTimestamp();

                await canalRecepcao.send({
                    content: `👋 Teste de Recepção: <@${interaction.user.id}>!`,
                    embeds: [embedTeste]
                });

                return interaction.reply({
                    content: `✅ Mensagem de teste enviada com sucesso no canal <#${canalRecepcao.id}>!`,
                    ephemeral: true
                });
            }

            // /cargos - Lista informações
            if (commandName === 'cargos') {
                const canalApv = await interaction.guild.channels.fetch(CONFIG.canalAprovacaoId).catch(() => null);
                const canalPnl = await interaction.guild.channels.fetch(CONFIG.canalPainelId).catch(() => null);

                const embedCargos = new EmbedBuilder()
                    .setColor(CONFIG.corEmbed)
                    .setTitle('📋 CONFIGURAÇÕES • FAMÍLIA SOUZA & AMIGOS')
                    .setDescription(
                        `⚜️ **Tag Família:** \`${CONFIG.tagFamilia}\`\n` +
                        `🤝 **Tag Amigos:** \`${CONFIG.tagAmigos}\`\n\n` +
                        `📋 **Canal do Painel:** ${canalPnl ? `<#${canalPnl.id}>` : `\`${CONFIG.canalPainelId}\``}\n` +
                        `📥 **Canal de Aprovação:** ${canalApv ? `<#${canalApv.id}>` : `\`${CONFIG.canalAprovacaoId}\``}\n` +
                        `🚪 **Canal de Recepção:** <#${CONFIG.canalRecepcaoId}>`
                    )
                    .setTimestamp();

                return interaction.reply({ embeds: [embedCargos], ephemeral: true });
            }

            // /sincronizar - Sincroniza tags de apelido
            if (commandName === 'sincronizar') {
                const perms = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageNicknames) ||
                              interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
                if (!perms) {
                    return interaction.reply({
                        content: '❌ Apenas a Staff pode sincronizar tags.',
                        ephemeral: true
                    });
                }

                await interaction.deferReply({ ephemeral: true });
                await interaction.guild.members.fetch().catch(() => {});

                let atualizados = 0;
                for (const m of interaction.guild.members.cache.values()) {
                    if (m.user.bot || !m.manageable) continue;
                    const temFam = m.roles.cache.some(r => r.name.toLowerCase().includes('souza'));
                    const temAmg = m.roles.cache.some(r => r.name.toLowerCase().includes('amigo'));

                    if (temFam) {
                        const base = (m.nickname || m.user.username).replace(/^\[[^\]]+\]\s*/g, '').trim();
                        const novo = `[Souza] ${base}`.substring(0, 32);
                        if (m.nickname !== novo) {
                            await m.setNickname(novo).then(() => atualizados++).catch(() => {});
                        }
                    } else if (temAmg) {
                        const base = (m.nickname || m.user.username).replace(/^\[[^\]]+\]\s*/g, '').trim();
                        const novo = `[AMIGO] ${base}`.substring(0, 32);
                        if (m.nickname !== novo) {
                            await m.setNickname(novo).then(() => atualizados++).catch(() => {});
                        }
                    }
                }

                return interaction.editReply({
                    content: `🔄 Sincronização concluída! **${atualizados}** membro(s) tiveram suas tags ajustadas.`
                });
            }

            // /testaraprovacao - Testa envio no canal 1560365072822304900
            if (commandName === 'testaraprovacao') {
                const canalApv = await interaction.guild.channels.fetch(CONFIG.canalAprovacaoId).catch(() => null);
                if (!canalApv) {
                    return interaction.reply({
                        content: `❌ Canal de aprovação \`${CONFIG.canalAprovacaoId}\` não encontrado.`,
                        ephemeral: true
                    });
                }

                const embedTeste = new EmbedBuilder()
                    .setColor(CONFIG.corEmbed)
                    .setTitle('🧪 TESTE DO CANAL DE APROVAÇÃO')
                    .setDescription(`Canal de aprovação conectado com sucesso: <#${canalApv.id}>`)
                    .setTimestamp();

                await canalApv.send({ embeds: [embedTeste] });
                return interaction.reply({ content: `✅ Teste enviado em <#${canalApv.id}>!`, ephemeral: true });
            }
        }

        // --- 2. BOTÕES DO PAINEL FIXO (ABERTURA DE MODAL) ---
        if (interaction.isButton()) {
            if (interaction.customId === 'btn_iniciar_familia' || interaction.customId === 'btn_iniciar_amigos') {
                const isFam = interaction.customId === 'btn_iniciar_familia';

                const modal = new ModalBuilder()
                    .setCustomId(isFam ? 'modal_familia' : 'modal_amigos')
                    .setTitle(isFam ? 'Ficha: Família Souza [Souza]' : 'Ficha: Amigo [AMIGO]');

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
                            .setStyle(TextInputStyle.Short)
                            .setMaxLength(3)
                            .setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId('motivo')
                            .setLabel(isFam ? 'Quem te convidou para os Souza?' : 'De quem você é amigo?')
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    )
                );

                return await interaction.showModal(modal);
            }
        }

        // --- 3. ENVIO DA FICHA PARA CANAL DE APROVAÇÃO (1560365072822304900) ---
        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'modal_familia' || interaction.customId === 'modal_amigos') {
                await interaction.deferReply({ ephemeral: true });

                const isFam = interaction.customId === 'modal_familia';
                const tagAlvo = isFam ? CONFIG.tagFamilia : CONFIG.tagAmigos;
                const nome = interaction.fields.getTextInputValue('nome').trim();
                const idade = interaction.fields.getTextInputValue('idade').trim();
                const motivo = interaction.fields.getTextInputValue('motivo').trim();

                const canalStaff = await interaction.guild.channels.fetch(CONFIG.canalAprovacaoId).catch(() => null);

                if (!canalStaff) {
                    return interaction.editReply({
                        content: `❌ Canal de aprovação da Staff (\`${CONFIG.canalAprovacaoId}\`) não encontrado!`
                    });
                }

                const subId = `sub_${Date.now()}`;
                fichasPendentes.set(subId, {
                    userId: interaction.user.id,
                    isFam,
                    nome,
                    idade,
                    motivo
                });

                const nickPrevisto = `${tagAlvo} ${nome}`;

                const embedStaff = new EmbedBuilder()
                    .setColor(isFam ? CONFIG.corEmbed : CONFIG.corAmigos)
                    .setTitle(`📥 NOVA FICHA • ${isFam ? '⚜️ FAMÍLIA SOUZA' : '🤝 AMIGOS'}`)
                    .setDescription(
                        `👤 **Membro:** <@${interaction.user.id}>\n` +
                        `🏷️ **Nick Solicitado:** **${nome}**\n` +
                        `🔖 **Nick Formatado:** \`${nickPrevisto}\`\n` +
                        `🎂 **Idade:** ${idade} anos\n` +
                        `📝 **Informações:** ${motivo}`
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter({ text: `Canal de Aprovação: ${canalStaff.id}` })
                    .setTimestamp();

                const rowAprovacao = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`apv|${subId}`)
                        .setLabel(`Aprovar ${tagAlvo}`)
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId(`rep|${subId}`)
                        .setLabel('Reprovar')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('❌')
                );

                await canalStaff.send({ embeds: [embedStaff], components: [rowAprovacao] });

                return interaction.editReply({
                    content: `✅ Sua ficha foi enviada com sucesso para a moderação! Assim que aprovada, seu apelido será formatado para \`${nickPrevisto}\`.`
                });
            }
        }

        // --- 4. STAFF: APROVAR OU REPROVAR ---
        if (interaction.isButton() && (interaction.customId.startsWith('apv|') || interaction.customId.startsWith('rep|'))) {
            const [acao, subId] = interaction.customId.split('|');
            const ficha = fichasPendentes.get(subId);

            if (!ficha) {
                return interaction.reply({ content: '⚠️ Ficha não encontrada ou já avaliada.', ephemeral: true });
            }

            const member = await interaction.guild.members.fetch(ficha.userId).catch(() => null);

            if (acao === 'apv') {
                if (member) {
                    const tag = ficha.isFam ? CONFIG.tagFamilia : CONFIG.tagAmigos;
                    const novoNick = `${tag} ${ficha.nome}`.substring(0, 32);

                    // Atribui cargo correspondente
                    const roleAlvo = member.guild.roles.cache.find(r =>
                        r.name.toLowerCase().includes(ficha.isFam ? 'souza' : 'amigo')
                    );
                    if (roleAlvo) await member.roles.add(roleAlvo).catch(() => {});

                    // Remove cargo Não Registrado
                    const roleNaoReg = member.guild.roles.cache.find(r =>
                        r.name.toLowerCase().includes('nao registrado') || r.name.toLowerCase().includes('não registrado')
                    );
                    if (roleNaoReg) await member.roles.remove(roleNaoReg).catch(() => {});

                    if (member.manageable) {
                        await member.setNickname(novoNick).catch(() => {});
                    }
                }

                await interaction.update({
                    content: `✅ **FICHA APROVADA por <@${interaction.user.id}>!** Membro: <@${ficha.userId}>`,
                    components: []
                });
                fichasPendentes.delete(subId);
            } else {
                await interaction.update({
                    content: `❌ **FICHA REPROVADA por <@${interaction.user.id}>.** Membro: <@${ficha.userId}>`,
                    components: []
                });
                fichasPendentes.delete(subId);
            }
        }
    } catch (e) {
        console.error('Erro na interação:', e);
    }
});

// ============================================================================
// 🚀 INICIALIZAÇÃO DO BOT
// ============================================================================
if (CONFIG.token && CONFIG.token.length > 25) {
    client.login(CONFIG.token).catch(err => console.error('Erro ao conectar bot:', err.message));
} else {
    console.log('ℹ️ Configure o DISCORD_TOKEN no arquivo .env para iniciar.');
}

/**
 * ============================================================================
 * ⚜️ BOT DISCORD OFICIAL • FAMÍLIA & AMIGOS ⚜️
 * ============================================================================
 * 🚪 CANAL DE RECEPÇÃO: 1561031405100867644 (De Souza Para Família)
 * 🖼️ BANNER DE RECEPÇÃO: https://i.imgur.com/h8BPD29.png
 * 📋 CANAL DO PAINEL FIXO: 1560360800156385473 (👋・「pedir-cargo」)
 * 📥 CANAL DE APROVAÇÃO STAFF: 1560365072822304900
 * ============================================================================
 * 👑 CARGOS OFICIAIS CONFIGURADOS:
 * - FAMÍLIA CARGO ID: 1552877590598000772 (Tag: [Familia])
 * - AMIGOS CARGO ID: 1552877591541842034 (Tag: [AMIGO])
 * ============================================================================
 * 🔄 SISTEMA AUTOMÁTICO DE TAGS:
 * Ao aprovar a ficha ou trocar de cargo manualmente, o bot atualiza a tag
 * no apelido na hora ([Familia] ou [AMIGO])!
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

    // 👑 CARGOS OFICIAIS FORNECIDOS
    cargoFamiliaId: (process.env.CARGO_FAMILIA_ID || "1552877590598000772").trim(),
    cargoAmigosId: (process.env.CARGO_AMIGOS_ID || "1552877591541842034").trim(),

    // 🏷️ TAGS OFICIAIS (A TAG DE FAMÍLIA É [Familia])
    tagFamilia: "[Familia]",
    tagAmigos: "[AMIGO]",

    corEmbed: 0xD4AF37,  // Dourado Nobre
    corAmigos: 0x2ECC71, // Verde
    port: process.env.PORT || 3000
};

// 🌐 SERVIDOR HTTP LEVE PARA HOSPEDAGEM
let client = null;
const server = http.createServer((req, res) => {
    const isReady = Boolean(client && client.isReady());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        sistema: 'Bot Família & Amigos • Recepção, Cargos & Aprovação',
        status: isReady ? 'online' : 'iniciando',
        cargoFamilia: CONFIG.cargoFamiliaId,
        cargoAmigos: CONFIG.cargoAmigosId,
        tagFamilia: CONFIG.tagFamilia,
        tagAmigos: CONFIG.tagAmigos
    }));
});

if (!process.env.DISABLE_BOT_HTTP_SERVER) {
    server.listen(CONFIG.port, () => {
        console.log(`🌐 [HTTP HEALTH-CHECK] Porta ${CONFIG.port}`);
    });
}

// Client com intents necessárias (GuildMembers é obrigatório no Discord Developer Portal!)
client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

// Limpa qualquer tag antiga entre colchetes ([Souza], [souza], etc.)
function limparTagsAntigas(nome) {
    if (!nome) return 'Membro';
    return nome.replace(/^\[[^\]]+\]\s*/gi, '').trim() || 'Membro';
}

function formatarNickComTag(nomeBase, tag) {
    const limpo = limparTagsAntigas(nomeBase);
    const prefixo = `${tag} `;
    const maxRestante = 32 - prefixo.length;
    return `${prefixo}${limpo.substring(0, Math.max(1, maxRestante))}`;
}

// 🎨 PAINEL OFICIAL DE CARGOS NO CANAL 1560360800156385473
function gerarPainelOficialCargos() {
    const embed = new EmbedBuilder()
        .setColor(CONFIG.corEmbed)
        .setTitle('⚜️ REGISTRO OFICIAL • FAMÍLIA & AMIGOS ⚜️')
        .setDescription(
            '**Seja muito bem-vindo(a) ao canal oficial para solicitar seu cargo!**\n\n' +
            'Para liberar acesso completo aos canais, escolha a sua categoria clicando abaixo:\n\n' +
            '👑 **1. FAMÍLIA**\n' +
            `• Cargo ID: \`${CONFIG.cargoFamiliaId}\`\n` +
            '• Tag `[Familia]` adicionada ao seu apelido\n' +
            '• Acesso às salas exclusivas da Família\n\n' +
            '🤝 **2. AMIGOS DA FAMÍLIA**\n' +
            `• Cargo ID: \`${CONFIG.cargoAmigosId}\`\n` +
            '• Tag `[AMIGO]` no seu apelido\n' +
            '• Acesso aos canais comunitários e jogos\n\n' +
            '📢 *Após preencher a ficha, ela será enviada para o canal de aprovação da Staff.*'
        )
        .setImage(CONFIG.imagemRecepcaoUrl)
        .setFooter({ text: 'Sistema de Registro Automático • Família & Amigos' })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('btn_iniciar_familia')
            .setLabel('Entrar na Família [Familia]')
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

// 🚀 EVENTO READY
client.once(Events.ClientReady, async (c) => {
    console.log(`\n⚜️ BOT FAMÍLIA & AMIGOS ONLINE COMO: ${c.user.tag}`);
    console.log(`🚪 Recepção: ${CONFIG.canalRecepcaoId}`);
    console.log(`📋 Painel: ${CONFIG.canalPainelId}`);
    console.log(`📥 Aprovação: ${CONFIG.canalAprovacaoId}`);
    console.log(`👑 Cargo Família: ${CONFIG.cargoFamiliaId} (Tag: ${CONFIG.tagFamilia})`);
    console.log(`🤝 Cargo Amigos: ${CONFIG.cargoAmigosId} (Tag: ${CONFIG.tagAmigos})\n`);
});

// 🔄 EVENTO: GUILD MEMBER UPDATE (AO TROCAR O CARGO JÁ MUDA A TAG NA HORA!)
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    try {
        if (newMember.user.bot) return;

        const tinhaFam = oldMember.roles.cache.has(CONFIG.cargoFamiliaId);
        const temFam = newMember.roles.cache.has(CONFIG.cargoFamiliaId);

        const tinhaAmg = oldMember.roles.cache.has(CONFIG.cargoAmigosId);
        const temAmg = newMember.roles.cache.has(CONFIG.cargoAmigosId);

        // Se recebeu o cargo Família
        if (!tinhaFam && temFam) {
            const base = limparTagsAntigas(newMember.nickname || newMember.user.globalName || newMember.user.username);
            const novoNick = formatarNickComTag(base, CONFIG.tagFamilia);

            if (newMember.manageable && newMember.nickname !== novoNick) {
                await newMember.setNickname(novoNick).catch(() => {});
                console.log(`[TAG AUTO] ${newMember.user.tag} recebeu cargo Família -> Nick: "${novoNick}"`);
            }
        }
        // Se recebeu o cargo Amigos
        else if (!tinhaAmg && temAmg) {
            const base = limparTagsAntigas(newMember.nickname || newMember.user.globalName || newMember.user.username);
            const novoNick = formatarNickComTag(base, CONFIG.tagAmigos);

            if (newMember.manageable && newMember.nickname !== novoNick) {
                await newMember.setNickname(novoNick).catch(() => {});
                console.log(`[TAG AUTO] ${newMember.user.tag} recebeu cargo Amigos -> Nick: "${novoNick}"`);
            }
        }
    } catch (err) {
        console.error('Erro no guildMemberUpdate:', err.message);
    }
});

// 🚪 EVENTO: ENTRADA DE NOVO MEMBRO NO CANAL 1561031405100867644
client.on(Events.GuildMemberAdd, async (member) => {
    try {
        const canalRecepcao = await member.guild.channels.fetch(CONFIG.canalRecepcaoId).catch(() => null);
        if (!canalRecepcao || !canalRecepcao.isTextBased()) return;

        const embedRecepcao = new EmbedBuilder()
            .setColor(CONFIG.corEmbed)
            .setTitle('⚜️ DE SOUZA PARA FAMÍLIA • BEM-VINDO(A)! ⚜️')
            .setDescription(
                `👑 **Saudações nobres, <@${member.id}>!**\n\n` +
                `É uma honra receber você em nossa família! Sinta-se em casa.\n` +
                `Para liberar acesso completo e receber sua tag oficial [Familia] ou [AMIGO]:\n\n` +
                `📜 **Como obter sua Tag Oficial:**\n` +
                `Vá até o canal <#${CONFIG.canalPainelId}> (**${CONFIG.nomeCanalPainel}**) e clique no botão do painel!\n\n` +
                `🏷️ **Categorias disponíveis:**\n` +
                `• ⚜️ **Família [Familia]:** Cargo oficial de membro da Família\n` +
                `• 🤝 **Amigos [AMIGO]:** Cargo para amigos e aliados\n\n` +
                `📢 *Sua ficha irá para a Staff no canal oficial ${CONFIG.canalAprovacaoId}.*`
            )
            .setImage(CONFIG.imagemRecepcaoUrl)
            .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
            .setFooter({ text: `Membro #${member.guild.memberCount} • De Souza Para Família` })
            .setTimestamp();

        await canalRecepcao.send({
            content: `👋 Atenção Família! <@${member.id}> acabou de chegar!`,
            embeds: [embedRecepcao]
        });
    } catch (err) {
        console.error('Erro na recepção:', err.message);
    }
});

// ⚡ INTERAÇÕES: MODAL, BOTÕES DO PAINEL E APROVAÇÃO DIRETA
client.on(Events.InteractionCreate, async (interaction) => {
    try {
        // 1. Abrir Modal ao Clicar no Painel
        if (interaction.isButton() && (interaction.customId === 'btn_iniciar_familia' || interaction.customId === 'btn_iniciar_amigos')) {
            const isFam = interaction.customId === 'btn_iniciar_familia';
            const modal = new ModalBuilder()
                .setCustomId(isFam ? 'modal_familia' : 'modal_amigos')
                .setTitle(isFam ? 'Ficha: Família [Familia]' : 'Ficha: Amigo [AMIGO]');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('nome')
                        .setLabel('Seu Nome ou Nick RP:')
                        .setPlaceholder('Ex: Gabriel')
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
                        .setLabel(isFam ? 'Quem te convidou para a Família?' : 'De quem você é amigo?')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(true)
                )
            );

            return await interaction.showModal(modal);
        }

        // 2. Envio da Ficha Preenchida para o Canal da Staff
        if (interaction.isModalSubmit() && (interaction.customId === 'modal_familia' || interaction.customId === 'modal_amigos')) {
            await interaction.deferReply({ ephemeral: true });

            const isFam = interaction.customId === 'modal_familia';
            const tagAlvo = isFam ? CONFIG.tagFamilia : CONFIG.tagAmigos;
            const cargoAlvoId = isFam ? CONFIG.cargoFamiliaId : CONFIG.cargoAmigosId;
            const nome = interaction.fields.getTextInputValue('nome').trim();
            const idade = interaction.fields.getTextInputValue('idade').trim();
            const motivo = interaction.fields.getTextInputValue('motivo').trim();

            const canalStaff = await interaction.guild.channels.fetch(CONFIG.canalAprovacaoId).catch(() => null);
            if (!canalStaff) {
                return interaction.editReply({ content: `❌ Canal de aprovação \`${CONFIG.canalAprovacaoId}\` não encontrado!` });
            }

            const nickPrevisto = formatarNickComTag(nome, tagAlvo);
            const nomeCodificado = encodeURIComponent(nome);

            const embedStaff = new EmbedBuilder()
                .setColor(isFam ? CONFIG.corEmbed : CONFIG.corAmigos)
                .setTitle(`📥 NOVA FICHA DE REGISTRO • ${isFam ? '👑 FAMÍLIA [Familia]' : '🤝 AMIGOS [AMIGO]'}`)
                .setDescription(
                    `👤 **Membro:** <@${interaction.user.id}> (\`${interaction.user.tag}\`)\n` +
                    `🏷️ **Cargo Alvo:** <@&${cargoAlvoId}> (\`${cargoAlvoId}\`)\n` +
                    `📝 **Nick Solicitado:** **${nome}**\n` +
                    `🔖 **Nick com Tag Oficial:** \`${nickPrevisto}\`\n` +
                    `🎂 **Idade:** ${idade} anos\n` +
                    `📝 **Informações:** ${motivo}`
                )
                .setThumbnail(interaction.user.displayAvatarURL())
                .setFooter({ text: `Canal de Aprovação: ${canalStaff.id} • Membro ID: ${interaction.user.id}` })
                .setTimestamp();

            // O botão armazena os dados para NUNCA perder o membro ao reiniciar
            const rowAprovacao = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`apv|${interaction.user.id}|${isFam ? 'fam' : 'amg'}|${nomeCodificado}`)
                    .setLabel(`Aprovar ${tagAlvo}`)
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅'),
                new ButtonBuilder()
                    .setCustomId(`rep|${interaction.user.id}`)
                    .setLabel('Reprovar')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('❌')
            );

            await canalStaff.send({ embeds: [embedStaff], components: [rowAprovacao] });

            return interaction.editReply({
                content: `✅ Sua ficha foi enviada para a Staff no canal <#${canalStaff.id}>! Assim que aprovada, você receberá o cargo <@&${cargoAlvoId}> e sua tag \`${tagAlvo}\` será aplicada no seu apelido.`
            });
        }

        // 3. Staff Clica em Aprovar ou Reprovar
        if (interaction.isButton() && (interaction.customId.startsWith('apv|') || interaction.customId.startsWith('rep|'))) {
            const perms = interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageRoles) ||
                          interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator);
            if (!perms) {
                return interaction.reply({
                    content: '❌ Apenas a Staff com permissão de Gerenciar Cargos pode aprovar/reprovar.',
                    ephemeral: true
                });
            }

            const partes = interaction.customId.split('|');
            const acao = partes[0];
            const targetUserId = partes[1];

            const member = await interaction.guild.members.fetch(targetUserId).catch(() => null);
            if (!member) {
                return interaction.reply({ content: '⚠️ Membro não encontrado no servidor.', ephemeral: true });
            }

            if (acao === 'apv') {
                const tipo = partes[2] || 'fam';
                const isFam = tipo === 'fam';
                const rawNome = partes[3] ? decodeURIComponent(partes[3]) : (member.nickname || member.user.username);

                const cargoAlvoId = isFam ? CONFIG.cargoFamiliaId : CONFIG.cargoAmigosId;
                const cargoOpostoId = isFam ? CONFIG.cargoAmigosId : CONFIG.cargoFamiliaId;
                const tag = isFam ? CONFIG.tagFamilia : CONFIG.tagAmigos;
                const novoNick = formatarNickComTag(rawNome, tag);

                let cargoAdicionado = false;
                let erroCargo = '';

                // Entrega direta do cargo pelo ID oficial
                try {
                    let roleAlvo = interaction.guild.roles.cache.get(cargoAlvoId);
                    if (!roleAlvo) {
                        roleAlvo = await interaction.guild.roles.fetch(cargoAlvoId).catch(() => null);
                    }

                    if (roleAlvo) {
                        await member.roles.add(roleAlvo);
                        cargoAdicionado = true;
                    } else {
                        await member.roles.add(cargoAlvoId);
                        cargoAdicionado = true;
                    }
                } catch (e) {
                    erroCargo = e.message || String(e);
                    console.error('❌ [CARGO ERROR]', erroCargo);
                }

                // Remove cargo oposto
                try {
                    if (cargoOpostoId && member.roles.cache.has(cargoOpostoId)) {
                        await member.roles.remove(cargoOpostoId);
                    }
                } catch (_) {}

                // Formata apelido com [Familia] ou [AMIGO]
                let nickAlterado = false;
                if (member.manageable) {
                    try {
                        await member.setNickname(novoNick);
                        nickAlterado = true;
                    } catch (_) {}
                }

                if (cargoAdicionado) {
                    await interaction.update({
                        content: `✅ **FICHA APROVADA por <@${interaction.user.id}>!**\n` +
                                 `👤 **Membro:** <@${member.id}>\n` +
                                 `👑 **Cargo Atribuído:** <@&${cargoAlvoId}> (ID: \`${cargoAlvoId}\`) ✅ **ENTREGUE COM SUCESSO**\n` +
                                 `🏷️ **Apelido com Tag:** \`${novoNick}\` ${nickAlterado ? '✅ **ALTERADO**' : '*(Necessita permissão de apelido)*'}`,
                        components: []
                    });

                    await member.send({
                        content: `🎉 **Parabéns! Sua ficha de registro foi APROVADA!**\n\n` +
                                 `👑 **Cargo Recebido:** <@&${cargoAlvoId}>\n` +
                                 `🏷️ **Apelido:** \`${novoNick}\`\n\n` +
                                 `Seja muito bem-vindo(a) e divirta-se!`
                    }).catch(() => {});
                } else {
                    await interaction.update({
                        content: `⚠️ **FICHA APROVADA por <@${interaction.user.id}>, MAS O DISCORD BLOQUEOU O CARGO:**\n\n` +
                                 `🔴 **Erro:** \`${erroCargo}\`\n\n` +
                                 `👉 **COMO RESOLVER NO SEU DISCORD:**\n` +
                                 `1. Vá em **Configurações do Servidor > Cargos**.\n` +
                                 `2. **Arraste o cargo do BOT para ficar ACIMA do cargo <@&${cargoAlvoId}>**.\n` +
                                 `3. Verifique se o bot tem a permissão **Gerenciar Cargos**.\n` +
                                 `*(O Discord não permite que um bot dê cargos que estejam acima dele próprio).*`,
                        components: []
                    });
                }
            } else {
                await interaction.update({
                    content: `❌ **FICHA REPROVADA por <@${interaction.user.id}>.** Membro: <@${member.id}>`,
                    components: []
                });

                await member.send({
                    content: `❌ Sua solicitação de registro não foi aprovada pela moderação.`
                }).catch(() => {});
            }
        }
    } catch (e) {
        console.error('Erro na interação:', e);
    }
});

// Inicia o bot
if (CONFIG.token && CONFIG.token.length > 25) {
    client.login(CONFIG.token).catch(err => console.error('Erro ao conectar bot:', err.message));
} else {
    console.log('ℹ️ Configure o DISCORD_TOKEN no .env para conectar.');
}

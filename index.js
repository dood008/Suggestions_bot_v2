const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const config = require('./config.json');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions]
});

const suggestionChannelId = config.suggestionChannelId;
const TOKEN = config.TOKEN;
const approverRoleId = config.approverRoleId;
const userVotes = {};

client.once('ready', () => {
    console.log('Bot is online!');
    console.log('Code by Wick Studio');
    console.log('discord.gg/wicks');
});

client.on('messageCreate', message => {
    if (message.channel.id === suggestionChannelId) {
        const messageContent = message.content;

        if (!messageContent.trim()) {
            console.log('تم ارسال اقتراح جديد.');
            return;
        }

        const suggestionEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('📝 اقتراح جديد')
            .setDescription(`**الاقتراح 
        \n\n:**\n\`\`\`${messageContent}\`\`\``)
            .setTimestamp()
            .setFooter({ text: `تم الارسال بواسطة : ${message.author.tag}` })
            .setThumbnail(message.author.displayAvatarURL())
            .addFields(
                { name: 'الحالة', value: '⏳ قيد الانتظار', inline: true },
                { name: 'الدعم', value: '<:p_arrow_up:1213552453375754380>   0 |  <:p_arrow_down:1213552445859299390>  0', inline: true }
            );
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`accept_${message.author.id}`)
                    .setLabel(' مقبولة ')
                    .setEmoji('1213717029756862485')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`reject_${message.author.id}`)
                    .setLabel(' مرفوضة ')
                    .setEmoji('1213717047830126692')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('upvote')
                    .setLabel(' مع ')
                    .setEmoji('1213552453375754380')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('downvote')
                    .setLabel(' ضد ')
                    .setEmoji('1213552445859299390')
                    .setStyle(ButtonStyle.Secondary)
            );

        message.channel.send({ embeds: [suggestionEmbed], components: [row] })
            .then(() => message.delete())
            .catch(console.error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const messageId = interaction.message.id;
    const userId = interaction.user.id;

    if (interaction.customId.startsWith('accept') || interaction.customId.startsWith('reject')) {
        const roleId = approverRoleId;
        if (!interaction.member.roles.cache.has(roleId)) {
            return interaction.reply({ content: 'ليس لديك صلاحية لاستخدام هذا الزر.', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId(`response-modal-${interaction.customId}`)
            .setTitle('Response');

        const reasonInput = new TextInputBuilder()
            .setCustomId('reason')
            .setLabel('Reason')
            .setStyle(TextInputStyle.Paragraph);

        const actionRow = new ActionRowBuilder().addComponents(reasonInput);

        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    } else if (interaction.customId === 'upvote' || interaction.customId === 'downvote') {
        if (!userVotes[messageId]) userVotes[messageId] = new Set();
        if (userVotes[messageId].has(userId)) {
            return interaction.reply({ content: 'لقد قمت بالتصويت على هذا الاقتراح بالفعل.', ephemeral: true });
        }
        userVotes[messageId].add(userId);

        const originalEmbed = interaction.message.embeds[0];
        const fields = originalEmbed.fields;

        // Extract upvotes and downvotes values from the voteText
        const upvotesText = fields[1].value.split('|')[0].trim().split(' ')[1].trim();
        const downvotesText = fields[1].value.split('|')[1].trim().split(' ')[1].trim();

        // Convert upvotes and downvotes to integers
        let upvotes = parseInt(upvotesText);
        let downvotes = parseInt(downvotesText);

        // Check if upvotes and downvotes are valid numbers, if not, set them to 0
        if (isNaN(upvotes)) upvotes = 0;
        if (isNaN(downvotes)) downvotes = 0;

        // Increment upvotes or downvotes based on the interaction customId
        if (interaction.customId === 'upvote') upvotes++;
        if (interaction.customId === 'downvote') downvotes++;

        // Update the embed with the new upvotes and downvotes values
        const updatedEmbed = new EmbedBuilder(originalEmbed)
            .spliceFields(1, 1, { name: 'الدعم', value: ` <:p_arrow_up:1213552453375754380> ${upvotes} | <:p_arrow_down:1213552445859299390> ${downvotes}`, inline: true });

        // Send the updated embed with interaction components
        await interaction.update({ embeds: [updatedEmbed], components: interaction.message.components });
    }
});

client.login(process.env.token);
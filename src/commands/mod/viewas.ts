import Discord, { CategoryChannel, CommandInteraction, GuildMember, MessageActionRow, MessageButton, MessageSelectMenu } from "discord.js";
import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import EmojiEmbed from "../../utils/generateEmojiEmbed.js";
import { WrappedCheck } from "jshaiku";
import getEmojiByName from "../../utils/getEmojiByName.js";
import pageIndicator from "../../utils/createPageIndicator.js";

const command = (builder: SlashCommandSubcommandBuilder) =>
    builder
    .setName("viewas")
    .setDescription("View the server as a specific member")
    .addUserOption(option => option.setName("member").setDescription("The member to view as").setRequired(true))

const callback = async (interaction: CommandInteraction): Promise<any> => {
    let channels = [];
    let m;
    interaction.guild.channels.cache.forEach(channel => {
        if (!channel.parent && channel.type !== "GUILD_CATEGORY") channels.push(channel)
    })
    channels = [channels]
    channels = channels.concat(interaction.guild.channels.cache
        .filter(c => c.type === "GUILD_CATEGORY")
        .map(c => (c as CategoryChannel).children.map(c => c))
    )
    let autoSortBelow = ["GUILD_VOICE", "GUILD_STAGE_VOICE"]
    channels = channels.map(c => c.sort((a, b) => {
        if (autoSortBelow.includes(a.type) && autoSortBelow.includes(b.type)) return a.position - b.position
        if (autoSortBelow.includes(a.type)) return 1
        if (autoSortBelow.includes(b.type)) return -1
        return a.position - b.position
    }))
    // Sort all arrays by the position of the first channels parent position
    channels = channels.sort((a, b) => {
        if (!a[0].parent) return -1
        if (!b[0].parent) return 1
        return a[0].parent.position - b[0].parent.position
    })
    let member = interaction.options.getMember("member") as Discord.GuildMember
    m = await interaction.reply({embeds: [new EmojiEmbed()
        .setEmoji("MEMBER.JOIN")
        .setTitle("Viewing as " + member.displayName)
        .setStatus("Success")
    ], ephemeral: true, fetchReply: true})
    let page = 0;
    while (true) {
        m = await interaction.editReply({embeds: [new EmojiEmbed()
            .setEmoji("MEMBER.JOIN")
            .setTitle("Viewing as " + member.displayName)
            .setStatus("Success")
            .setDescription(
                `**${channels[page][0].parent ? channels[page][0].parent.name  : "Uncategorised"}**` + "\n" +
                channels[page].map(c => {
                    let channelType = c.type
                    if (interaction.guild.rulesChannelId == c.id) channelType = "RULES"
                    else if ("nsfw" in c && c.nsfw) channelType += "_NSFW"
                    return c.permissionsFor(member).has("VIEW_CHANNEL") ? (
                        `${getEmojiByName("ICONS.CHANNEL." + channelType)} ${c.name}\n` + (() => {
                            if ("threads" in c && c.threads.cache.size > 0) {
                                return c.threads.cache.map(t => ` ${
                                    getEmojiByName("ICONS.CHANNEL.THREAD_PIPE") + " " +
                                    getEmojiByName("ICONS.CHANNEL.THREAD_CHANNEL")} ${t.name}`).join("\n") + "\n"
                            }return ""
                        })()) : ""
                }).join("") + "\n" + pageIndicator(channels.length, page)
            )
        ], components: [
            new MessageActionRow().addComponents([new MessageSelectMenu().setOptions(channels.map((c, index) => ({
                label: c[0].parent ? c[0].parent.name : "Uncategorised",
                value: index.toString(),
                default: page === index
            }))).setCustomId("select").setMaxValues(1).setMinValues(1).setPlaceholder("Select a category")]),
            new MessageActionRow().addComponents([
                new MessageButton()
                    .setLabel(page === 0 ? "" : (channels[page - 1][0].parent ? channels[page - 1][0].parent.name : "Uncategorised"))
                    .setDisabled(page === 0)
                    .setEmoji(getEmojiByName("CONTROL.LEFT", "id"))
                    .setStyle("PRIMARY")
                    .setCustomId("previous"),
                new MessageButton()
                    .setLabel(page === channels.length - 1 ? "" : (channels[page + 1][0].parent ? channels[page + 1][0].parent.name : "Uncategorised"))
                    .setDisabled(page === channels.length - 1)
                    .setEmoji(getEmojiByName("CONTROL.RIGHT", "id"))
                    .setStyle("PRIMARY")
                    .setCustomId("next")
            ])
        ]})
        let i;
        try {
            i = await m.awaitMessageComponent({ time: 300000 });
        } catch (e) { return }
        i.deferUpdate()
        if (i.customId === "next") { page++; }
        else if (i.customId === "previous") { page--; }
        else if (i.customId === "select") { page = parseInt(i.values[0]); }
    }
}


const check = (interaction: CommandInteraction, defaultCheck: WrappedCheck) => {
    let member = (interaction.member as GuildMember)
    if (! member.permissions.has("MANAGE_ROLES")) throw "You do not have the Manage roles permission";
    return true
}

export { command, callback, check };
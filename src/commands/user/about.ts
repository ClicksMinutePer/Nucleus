import Discord, { CommandInteraction, MessageActionRow, MessageButton } from "discord.js";
import { SelectMenuOption, SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { WrappedCheck } from "jshaiku";
import EmojiEmbed from "../../utils/generateEmojiEmbed.js";
import getEmojiByName from "../../utils/getEmojiByName.js";
import generateKeyValueList from "../../utils/generateKeyValueList.js";
import createPageIndicator from "../../utils/createPageIndicator.js";
import client from "../../utils/client.js"

const command = (builder: SlashCommandSubcommandBuilder) =>
    builder
    .setName("about")
    .setDescription("Shows info about a user")
    .addUserOption(option => option.setName("user").setDescription("The user to get info about | Default: Yourself"))


class Embed {
    embed: Discord.MessageEmbed;
    title: string;
    description: string = "";
    pageId: number = 0;
    setEmbed(embed: Discord.MessageEmbed) { this.embed = embed; return this; }
    setTitle(title: string) { this.title = title; return this; }
    setDescription(description: string) { this.description = description; return this; }
    setPageId(pageId: number) { this.pageId = pageId; return this; }
}


const callback = async (interaction: CommandInteraction): Promise<any> => {
    const { renderUser, renderDelta } = client.logger
    let member = (interaction.options.getMember("user") || interaction.member) as Discord.GuildMember;
    let flags: string[] = [];
    if ([
        "438733159748599813", // Pinea
        "317731855317336067", // Mini
        "261900651230003201", // Coded
        "511655498676699136", // Zan
    ].includes(member.user.id)) { flags.push("NUCLEUSDEVELOPER") }
    if ((await client.guilds.cache.get("684492926528651336")?.members.fetch())?.filter(m => m.roles.cache.has("760896837866749972"))?.map(m => m.id).includes(member.user.id)) { flags.push("CLICKSDEVELOPER") }
    member.user.flags.toArray().map(flag => {
        flags.push(flag.toString())
    })
    if (member.user.bot === true) { flags.push("BOT") }
    // Check if they are boosting the server
    if (member.premiumSince) { flags.push("BOOSTER") }
    let nameReplacements = {
        "NUCLEUSDEVELOPER": "**Nucleus Developer**",
        "CLICKSDEVELOPER": "Clicks Developer",
        "HOUSE_BRAVERY": "Hypesquad Bravery",
        "HOUSE_BRILLIANCE": "Hypesquad Brilliance",
        "HOUSE_BALANCE": "Hypesquad Balance",
        "HYPESQUAD_EVENTS": "Hypesquad Events",
        "EARLY_SUPPORTER": "Early Supporter",
        "BUGHUNTER_LEVEL_1": "Bug Hunter Level 1",
        "BUGHUNTER_LEVEL_2": "Bug Hunter Level 2",
        "PARTNERED_SERVER_OWNER": "Partnered Server Owner",
        "DISCORD_EMPLOYEE": "Discord Staff",
        "EARLY_VERIFIED_BOT_DEVELOPER": "Verified Bot Developer",
        "BOT": "Bot",
        "BOOSTER": "Server Booster"
    }
    let members = await interaction.guild.members.fetch()
    let membersArray = [...members.values()]
    membersArray.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
    let joinPos = membersArray.findIndex(m => m.id === member.user.id)

    let roles = member.roles.cache.filter(r => r.id != interaction.guild.id).sort()
    let s = "";
    let count = 0;
    let ended = false
    roles.map(item => {
        if (ended) return;
        let string = `<@&${item.id}>, `
        if(s.length + string.length > 1000) {
            ended = true
            s += `and ${roles.size - count} more`
            return
        };
        count ++
        s += string;
    })
    if(s.length > 0 && !ended) s = s.slice(0, -2);

    let perms = ""
    let permsArray = {
        "ADMINISTRATOR": "Administrator",
        "MANAGE_GUILD": "Manage Server",
        "MANAGE_ROLES": "Manage Roles",
        "MANAGE_CHANNELS": "Manage Channels",
        "KICK_MEMBERS": "Kick Members",
        "BAN_MEMBERS": "Ban Members",
        "MODERATE_MEMBERS": "Moderate Members",
        "MANAGE_NICKNAMES": "Manage Nicknames",
        "MANAGE_WEBHOOKS": "Manage Webhooks",
        "MANAGE_MESSAGES": "Manage Messages",
        "VIEW_AUDIT_LOG": "View Audit Log",
        "MENTION_EVERYONE": "Mention Everyone"
    }
    Object.keys(permsArray).map(perm => {
        let hasPerm = member.permissions.has(perm as Discord.PermissionString)
        perms += `${getEmojiByName("CONTROL." + (hasPerm ? "TICK" : "CROSS"))} ${permsArray[perm]}\n`
    })

    let selectPaneOpen = false;

    let embeds = [
        new Embed()
            .setEmbed(new EmojiEmbed()
                .setTitle("User Info: General")
                .setStatus("Success")
                .setEmoji("MEMBER.JOIN")
                .setDescription(
                    flags.map(flag => {
                        if (nameReplacements[flag]) {
                            return getEmojiByName(`BADGES.${flag}`) + " " + nameReplacements[flag];
                        }
                    }).join("\n") + "\n\n" +
                    generateKeyValueList({
                        "member": renderUser(member.user),
                        "nickname": member.nickname || "*None set*",
                        "id": `\`${member.id}\``,
                        "joined the server": renderDelta(member.joinedTimestamp),
                        "joined discord": renderDelta(member.user.createdTimestamp),
                        "boost status": member.premiumSince ? `Started boosting ${renderDelta(member.premiumSinceTimestamp)}` : "*Not boosting*",
                        "join position": `${joinPos + 1}`
                    })
                )
                .setThumbnail(await member.user.displayAvatarURL({dynamic: true}))
                .setImage((await member.user.fetch()).bannerURL({format: "gif"}))
            ).setTitle("General").setDescription("General information about the user").setPageId(0),
        new Embed()
            .setEmbed(new EmojiEmbed()
                .setTitle("User Info: Roles")
                .setStatus("Success")
                .setEmoji("GUILD.ROLES.CREATE")
                .setDescription(
                    generateKeyValueList({
                        "member": renderUser(member.user),
                        "id": `\`${member.id}\``,
                        "roles": `${member.roles.cache.size - 1}`,
                    }) + "\n" +
                    (s.length > 0 ? s : "*None*") + "\n"
                )
                .setThumbnail(await member.user.displayAvatarURL({dynamic: true}))
            ).setTitle("Roles").setDescription("Roles the user has").setPageId(1),
        new Embed()
            .setEmbed(new EmojiEmbed()
                .setTitle("User Info: Key Permissions")
                .setStatus("Success")
                .setEmoji("GUILD.ROLES.CREATE")
                .setDescription(
                    generateKeyValueList({
                        "member": renderUser(member.user),
                        "id": `\`${member.id}\``,
                    }) + "\n" + perms
                )
                .setThumbnail(await member.user.displayAvatarURL({dynamic: true}))
            ).setTitle("Key Permissions").setDescription("Key permissions the user has").setPageId(2),
    ]
    let m
    m = await interaction.reply({embeds: [new EmojiEmbed().setTitle("Loading").setEmoji("NUCLEUS.LOADING").setStatus("Danger")], fetchReply: true, ephemeral: true});
    let page = 0
    let breakReason = ""
    while (true) {
        let em = new Discord.MessageEmbed(embeds[page].embed)
        em.setDescription(em.description + "\n" + createPageIndicator(embeds.length, page));
        let selectPane = []

        if (selectPaneOpen) {
            let options = [];
            embeds.forEach(embed => {
                options.push(new SelectMenuOption({
                    label: embed.title,
                    value: embed.pageId.toString(),
                    description: embed.description || "",
                }))
            })
            selectPane = [new MessageActionRow().addComponents([
                new Discord.MessageSelectMenu()
                    .addOptions(options)
                    .setCustomId("page")
                    .setMaxValues(1)
                    .setPlaceholder("Choose a page...")
            ])]
        }
        await interaction.editReply({
            embeds: [em],
            components: selectPane.concat([new MessageActionRow().addComponents([
                new MessageButton()
                    .setEmoji(getEmojiByName("CONTROL.LEFT", "id"))
                    .setStyle("SECONDARY")
                    .setCustomId("left")
                    .setDisabled(page === 0),
                new MessageButton()
                    .setEmoji(getEmojiByName("CONTROL.MENU", "id"))
                    .setStyle(selectPaneOpen ? "PRIMARY" : "SECONDARY")
                    .setCustomId("select")
                    .setDisabled(false),
                new MessageButton()
                    .setEmoji(getEmojiByName("CONTROL.RIGHT", "id"))
                    .setCustomId("right")
                    .setStyle("SECONDARY")
                    .setDisabled(page === embeds.length - 1),
                new MessageButton()
                    .setEmoji(getEmojiByName("CONTROL.CROSS", "id"))
                    .setCustomId("close")
                    .setStyle("DANGER")
            ])])
        })
        let i
        try {
            i = await m.awaitMessageComponent({time: 300000});
        } catch { breakReason = "Message timed out"; break }
        i.deferUpdate()
        if (i.component.customId == "left") {
            if (page > 0) page--;
            selectPaneOpen = false;
        } else if (i.component.customId == "right") {
            if (page < embeds.length - 1) page++;
            selectPaneOpen = false;
        } else if (i.component.customId == "select") {
            selectPaneOpen = !selectPaneOpen;
        } else if (i.component.customId == "close") {
            breakReason = "Message closed";
            break;
        } else if (i.component.customId == "page") {
            page = parseInt(i.values[0]);
            selectPaneOpen = false;
        } else {
            breakReason = "Message closed";
            break;
        }
    }
    let em = new Discord.MessageEmbed(embeds[page].embed)
    em.setDescription(em.description + "\n" + createPageIndicator(embeds.length, page) + " | " + breakReason);
    await interaction.editReply({embeds: [em], components: [new MessageActionRow().addComponents([
        new MessageButton()
            .setEmoji(getEmojiByName("CONTROL.LEFT", "id"))
            .setStyle("SECONDARY")
            .setCustomId("left")
            .setDisabled(true),
        new MessageButton()
            .setEmoji(getEmojiByName("CONTROL.MENU", "id"))
            .setStyle("SECONDARY")
            .setCustomId("select")
            .setDisabled(true),
        new MessageButton()
            .setEmoji(getEmojiByName("CONTROL.RIGHT", "id"))
            .setCustomId("right")
            .setStyle("SECONDARY")
            .setDisabled(true),
        new MessageButton()
            .setEmoji(getEmojiByName("CONTROL.CROSS", "id"))
            .setCustomId("close")
            .setStyle("DANGER")
            .setDisabled(true)
    ])]})
}

const check = (interaction: CommandInteraction, defaultCheck: WrappedCheck) => {
    return true;
}

export { command };
export { callback };
export { check };
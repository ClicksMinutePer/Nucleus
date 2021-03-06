import { CommandInteraction, GuildMember, MessageActionRow, MessageButton } from "discord.js";
import humanizeDuration from 'humanize-duration';
import { SlashCommandSubcommandBuilder } from "@discordjs/builders";
import { WrappedCheck } from "jshaiku";
import confirmationMessage from "../../utils/confirmationMessage.js";
import EmojiEmbed from "../../utils/generateEmojiEmbed.js";
import keyValueList from "../../utils/generateKeyValueList.js";
import client from "../../utils/client.js";

const command = (builder: SlashCommandSubcommandBuilder) =>
    builder
    .setName("kick")
    .setDescription("Kicks a user from the server")
    .addUserOption(option => option.setName("user").setDescription("The user to kick").setRequired(true))
    .addStringOption(option => option.setName("reason").setDescription("The reason for the kick").setRequired(false))
    .addStringOption(option => option.setName("notify").setDescription("If the user should get a message when they are kicked | Default yes").setRequired(false)
        .addChoices([["Yes", "yes"], ["No", "no"]])
    )

const callback = async (interaction: CommandInteraction): Promise<any> => {
    const { renderUser } = client.logger
    // TODO:[Modals] Replace this with a modal
    let confirmation = await new confirmationMessage(interaction)
        .setEmoji("PUNISH.KICK.RED")
        .setTitle("Kick")
        .setDescription(keyValueList({
            "user": renderUser(interaction.options.getUser("user")),
            "reason": `\n> ${interaction.options.getString("reason") ? interaction.options.getString("reason") : "*No reason provided*"}`
        })
        + `The user **will${interaction.options.getString("notify") === "no" ? ' not' : ''}** be notified\n\n`
        + `Are you sure you want to kick <@!${(interaction.options.getMember("user") as GuildMember).id}>?`)
        .setColor("Danger")
    .send()
    if (confirmation.success) {
        let dmd = false
        let dm;
        let config = await client.database.guilds.read(interaction.guild.id);
        try {
            if (interaction.options.getString("notify") != "no") {
                dm = await (interaction.options.getMember("user") as GuildMember).send({
                    embeds: [new EmojiEmbed()
                        .setEmoji("PUNISH.KICK.RED")
                        .setTitle("Kicked")
                        .setDescription(`You have been kicked in ${interaction.guild.name}` +
                                    (interaction.options.getString("reason") ? ` for:\n> ${interaction.options.getString("reason")}` : "."))
                        .setStatus("Danger")
                    ],
                    components: [new MessageActionRow().addComponents(config.moderation.kick.text ? [new MessageButton()
                        .setStyle("LINK")
                        .setLabel(config.moderation.kick.text)
                        .setURL(config.moderation.kick.link)
                    ] : [])]
                })
                dmd = true
            }
        } catch {}
        try {
            (interaction.options.getMember("user") as GuildMember).kick(interaction.options.getString("reason") ?? "No reason provided.")
            let member = (interaction.options.getMember("user") as GuildMember)
            let reason = interaction.options.getString("reason") ?? null
            try { await client.database.history.create("kick", interaction.guild.id, member.user, interaction.user, reason) } catch {}
            // @ts-ignore
            const { log, NucleusColors, entry, renderUser, renderDelta } = member.client.logger
            let data = {
                meta: {
                    type: 'memberKick',
                    displayName: 'Member Kicked',
                    calculateType: 'guildMemberPunish',
                    color: NucleusColors.red,
                    emoji: "PUNISH.KICK.RED",
                    timestamp: new Date().getTime()
                },
                list: {
                    memberId: entry(member.id, `\`${member.id}\``),
                    name: entry(member.id, renderUser(member.user)),
                    joined: entry(member.joinedAt, renderDelta(member.joinedAt)),
                    kicked: entry(new Date().getTime(), renderDelta(new Date().getTime())),
                    kickedBy: entry(interaction.user.id, renderUser(interaction.user)),
                    reason: entry(reason, reason ? `\n> ${reason}` : "*No reason provided.*"),
                    timeInServer: entry(new Date().getTime() - member.joinedTimestamp, humanizeDuration(new Date().getTime() - member.joinedTimestamp, { round: true })),
                    accountCreated: entry(member.user.createdAt, renderDelta(member.user.createdAt)),
                    serverMemberCount: member.guild.memberCount,
                },
                hidden: {
                    guild: member.guild.id
                }
            }
            log(data);
        } catch {
            await interaction.editReply({embeds: [new EmojiEmbed()
                .setEmoji("PUNISH.KICK.RED")
                .setTitle(`Kick`)
                .setDescription("Something went wrong and the user was not kicked")
                .setStatus("Danger")
            ], components: []})
            if (dmd) await dm.delete()
            return
        }
        let failed = (dmd == false && interaction.options.getString("notify") != "no")
        await interaction.editReply({embeds: [new EmojiEmbed()
            .setEmoji(`PUNISH.KICK.${failed ? "YELLOW" : "GREEN"}`)
            .setTitle(`Kick`)
            .setDescription("The member was kicked" + (failed ? ", but could not be notified" : ""))
            .setStatus(failed ? "Warning" : "Success")
        ], components: []})
    } else {
        await interaction.editReply({embeds: [new EmojiEmbed()
            .setEmoji("PUNISH.KICK.GREEN")
            .setTitle(`Kick`)
            .setDescription("No changes were made")
            .setStatus("Success")
        ], components: []})
    }
}

const check = (interaction: CommandInteraction, defaultCheck: WrappedCheck) => {
    let member = (interaction.member as GuildMember)
    let me = (interaction.guild.me as GuildMember)
    let apply = (interaction.options.getMember("user") as GuildMember)
    if (member == null || me == null || apply == null) throw "That member is not in the server"
    let memberPos = member.roles ? member.roles.highest.position : 0
    let mePos = me.roles ? me.roles.highest.position : 0
    let applyPos = apply.roles ? apply.roles.highest.position : 0
    // Check if Nucleus can kick the member
    if (! (mePos > applyPos)) throw "I do not have a role higher than that member"
    // Check if Nucleus has permission to kick
    if (! me.permissions.has("KICK_MEMBERS")) throw "I do not have the Kick members permission";
    // Do not allow kicking Nucleus
    if (member.id == interaction.guild.me.id) throw "I cannot kick myself"
    // Allow the owner to kick anyone
    if (member.id == interaction.guild.ownerId) return true
    // Check if the user has kick_members permission
    if (! member.permissions.has("KICK_MEMBERS")) throw "You do not have the Kick members permission";
    // Check if the user is below on the role list
    if (! (memberPos > applyPos)) throw "You do not have a role higher than that member"
    // Allow kick
    return true
}

export { command, callback, check };
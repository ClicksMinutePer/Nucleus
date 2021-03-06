import getEmojiByName from "../utils/getEmojiByName.js";

export const event = 'emojiUpdate';

export async function callback(client, oe, ne) {
    try {
        const { getAuditLog, log, NucleusColors, entry, renderDelta, renderUser, renderEmoji } = client.logger

        if (oe.name == ne.name) return
        let auditLog = await getAuditLog(ne.guild, 'EMOJI_UPDATE');
        let audit = auditLog.entries.first();
        if (audit.executor.id == client.user.id) return;

        let changes = {
            emojiId: entry(ne.id, `\`${ne.id}\``),
            emoji: entry(ne.id, renderEmoji(ne)),
            edited: entry(ne.createdTimestamp, renderDelta(ne.createdTimestamp)),
            editedBy: entry(audit.executor.id, renderUser((await ne.guild.members.fetch(audit.executor.id)).user)),
            name: entry([oe.name, ne.name], `\`:${oe.name}:\` -> \`:${ne.name}:\``),
        }
        let data = {
            meta:{
                type: 'emojiUpdate',
                displayName: 'Emoji Edited',
                calculateType: 'emojiUpdate',
                color: NucleusColors.yellow,
                emoji: "GUILD.EMOJI.EDIT",
                timestamp: audit.createdTimestamp
            },
            list: changes,
            hidden: {
                guild: ne.guild.id
            }
        }
        log(data);
    } catch {}
}
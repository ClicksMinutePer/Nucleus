export const event = 'messageUpdate'

export async function callback(client, oldMessage, newMessage) {
    if (newMessage.author.id == client.user.id) return;
    if (!newMessage.content || !oldMessage.content) return;
	const { log, NucleusColors, entry, renderUser, renderDelta, renderNumberDelta, renderChannel } = newMessage.channel.client.logger
    newMessage.reference = newMessage.reference || {}
    let newContent = newMessage.cleanContent
    let oldContent = oldMessage.cleanContent
    if (newContent.length > 256) newContent = newContent.substring(0, 253) + '...'
    if (oldContent.length > 256) oldContent = oldContent.substring(0, 253) + '...'
    let data = {
        meta: {
            type: 'messageUpdate',
            displayName: 'Message Edited',
            calculateType: 'messageUpdate',
            color: NucleusColors.yellow,
            emoji: 'MESSAGE.EDIT',
            timestamp: newMessage.editedTimestamp
        },
        separate: {
            start: `**Before:**\n\`\`\`\n${oldContent}\n\`\`\`\n**After:**\n\`\`\`\n${newContent}\n\`\`\``,
            end: `[[Jump to message]](${newMessage.url})`
        },
        list: {
            id: entry(newMessage.id, `\`${newMessage.id}\``),
            sentBy: entry(newMessage.author.id, renderUser(newMessage.author)),
            sentIn: entry(newMessage.channel.id, renderChannel(newMessage.channel)),
            sent: entry(new Date(newMessage.createdTimestamp), renderDelta(new Date(newMessage.createdTimestamp))),
            edited: entry(new Date(newMessage.editedTimestamp), renderDelta(new Date(newMessage.editedTimestamp))),
            mentions: renderNumberDelta(oldMessage.mentions.users.size, newMessage.mentions.users.size),
            attachments: renderNumberDelta(oldMessage.attachments.size, newMessage.attachments.size),
            repliedTo: entry(
                newMessage.reference.messageId || null,
                newMessage.reference.messageId ? `[[Jump to message]](https://discord.com/channels/${newMessage.guild.id}/${newMessage.channel.id}/${newMessage.reference.messageId})` : "None"
            )
        },
        hidden: {
            guild: newMessage.channel.guild.id
        }
    }
    log(data, client);
}
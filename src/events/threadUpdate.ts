import humanizeDuration from 'humanize-duration';
export const event = 'threadUpdate'

export async function callback(client, before, after) {
    try {
        const { getAuditLog, log, NucleusColors, entry, renderUser, renderDelta, renderChannel } = after.client.logger
        let auditLog = await getAuditLog(after.guild, 'THREAD_UPDATE');
        let audit = auditLog.entries.filter(entry => entry.target.id == after.id).first();
        if (audit.executor.id == client.user.id) return;
        let list = {
            threadId:entry(after.id, `\`${after.id}\``),
            thread: entry(after.name, renderChannel(after)),
            parentChannel: entry(after.parentId, renderChannel(after.parent)),
        }
        if (before.name != after.name) {
            list["name"] = entry([before.name, after.name], `${before.name} -> ${after.name}`);
        }
        if (before.autoArchiveDuration != after.autoArchiveDuration) {
            list["autoArchiveDuration"] = entry([before.autoArchiveDuration, after.autoArchiveDuration], `${humanizeDuration(before.autoArchiveDuration * 60 * 1000, { round: true })} -> ${humanizeDuration(after.autoArchiveDuration * 60 * 1000, { round: true })}`);
        }
        if (before.rateLimitPerUser != after.rateLimitPerUser) {
            list["slowmode"] = entry([before.rateLimitPerUser, after.rateLimitPerUser], `${humanizeDuration(before.rateLimitPerUser * 1000)} -> ${humanizeDuration(after.rateLimitPerUser * 1000)}`);
        }
        if (!(Object.keys(list).length - 3)) return;
        list["updated"] = entry(new Date().getTime(), renderDelta(new Date().getTime()))
        list["updatedBy"] = entry(audit.executor.id, renderUser(audit.executor))
        let data = {
            meta: {
                type: 'channelUpdate',
                displayName: 'Thread Edited',
                calculateType: 'channelUpdate',
                color: NucleusColors.yellow,
                emoji: "CHANNEL.TEXT.EDIT",
                timestamp: new Date().getTime()
            },
            list: list,
            hidden: {
                guild: after.guild.id
            }
        }
        log(data);
    } catch {}
}

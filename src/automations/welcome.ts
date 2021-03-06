import log from '../utils/log.js'
import convertCurlyBracketString from '../utils/convertCurlyBracketString.js'
import client from '../utils/client.js';

export async function callback(_, member) {
    if (member.bot) return
    let config = await client.database.guilds.read(member.guild.id);
    if (!config.welcome.enabled) return

    if (!config.welcome.verificationRequired.role) {
        if (config.welcome.welcomeRole) {
            try {
                await member.roles.add(config.welcome.welcomeRole)
            } catch (err) {
                console.error(err)
            }
        }
    }

    if (!config.welcome.verificationRequired.message && config.welcome.channel) {
        let string = config.welcome.message
        if (string) {
            string = await convertCurlyBracketString(string, member.id, member.displayName, member.guild.name, member.guild.members)

            if (config.welcome.channel === 'dm') {
                try {
                    await member.send(string)
                } catch (err) {
                    console.error(err)
                }
            } else {
                let channel = await member.client.channels.fetch(config.welcome.channel)
                if (channel.guild.id !== member.guild.id) return
                if (!channel) return
                try {
                    await channel.send(string)
                } catch (err) {
                    console.error(err)
                }
            }
        }
    }
}
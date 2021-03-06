import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { WrappedCheck } from "jshaiku";
import { callback as roleMenu } from "../automations/roleMenu.js"

const command = new SlashCommandBuilder()
    .setName("rolemenu")
    .setDescription("Lets you choose from sets of roles to apply to yourself")

const callback = async (interaction: CommandInteraction): Promise<any> => {
    await roleMenu(interaction);
}

const check = (interaction: CommandInteraction, defaultCheck: WrappedCheck) => {
    return true;
}

export { command };
export { callback };
export { check };

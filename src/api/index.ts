import { HaikuClient } from 'jshaiku';
import express from 'express';
import bodyParser from 'body-parser';
import generateEmojiEmbed from "../utils/generateEmojiEmbed.js";

const jsonParser = bodyParser.json();
const app = express();
const port = 10000;

const runServer = (client: HaikuClient) => {
    app.get('/', (req, res) => {
        res.send(client.ws.ping);
    });

    app.post('/verify/:code', jsonParser, async function (req, res) {
        const code = req.params.code;
        const secret = req.body.secret;
        if (secret === client.config.verifySecret) {
            let guild = await client.guilds.fetch(client.verify[code].gID);
            if (!guild) { return res.status(404) }
            let member = await guild.members.fetch(client.verify[code].uID);
            if (!member) { return res.status(404) }
            if (member.roles.cache.has(client.verify[code].rID)) { return res.status(200) }
            await member.roles.add(client.verify[code].rID);

            let interaction = client.verify[code].interaction;
            if (interaction) {
                interaction.editReply({embeds: [new generateEmojiEmbed()
                    .setTitle("Verify")
                    .setDescription(`Verification complete`)
                    .setStatus("Success")
                    .setEmoji("MEMBER.JOIN")
                ], components: []});
            }
            res.status(200).send();
        } else {
            res.status(403).send();
        }
    });

    app.patch('/verify/:code', (req, res) => {
        const code = req.params.code;
        try {
            let interaction = client.verify[code].interaction;
            if (interaction) {
                interaction.editReply({embeds: [new generateEmojiEmbed()
                    .setTitle("Verify")
                    .setDescription(`Verify was opened in another tab or window, please complete the CAPTCHA there to continue`)
                    .setStatus("Success")
                    .setEmoji("MEMBER.JOIN")
                ]});
            }
        } catch {}
        res.status(200).send();
    })

    app.get('/verify/:code', jsonParser, function (req, res) {
        const code = req.params.code;
        if (client.verify[code]) {
            // let data = structuredClone(client.verify[code])
            // delete data.interaction;
            // return res.status(200).send(data);
        }
        return res.status(404).send();
    })

    app.listen(port);
}

export default runServer;
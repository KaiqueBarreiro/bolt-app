// Require the Bolt package (github.com/slackapi/bolt)
const { App, ExpressReceiver } = require("@slack/bolt");
const axios = require("axios");
const FormData = require('form-data');

const expressReceiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
});

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    receiver: expressReceiver,
    eventSubscriptions: {
        enabled: true,
        events: ["shortcut"],
    },
});

app.shortcut("your_shortcut_id", async ({ shortcut, ack, context }) => {
  
    const textSlack = shortcut.message.text;
    
    const formData = new FormData();
    
    formData.append("subject", 'Case created by Slack');
    formData.append("description", textSlack);
    formData.append("payload_slack__c", JSON.stringify(shortcut));
    formData.append("orgid", process.env.ORG_ID);

    await axios.post(
        process.env.WEB_TO_CASE,
        formData,
        {
        headers: {
            ...formData.getHeaders()
        },
        }
    ); 
    await ack();

});

expressReceiver.router.get('/your_route', async (req, res) => {
  
    try {
    
        let caseNumber = req.query.caseNumber;
        
        let shortcut = JSON.parse(req.query.shortcut);

        await app.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: shortcut.channel.id,
            thread_ts: shortcut.message.ts,
            text: 'Case successfully created: ' + caseNumber
        });
        
        res.status(200).send( JSON.parse('{ "status": "success", "message": "Success" } '));
        
    } catch (error) {
        
        res.status(500).send(JSON.parse('{ "status": "error", "message": "There was a processing failure!" } '));
        
    }
  
});

(async () => {
  // Start your app
    await app.start(process.env.PORT || 3000);
    console.log("⚡️ Bolt app is running!"); 
  
})();

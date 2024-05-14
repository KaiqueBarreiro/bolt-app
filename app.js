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
        events: ["shortcut"]
    },
});

app.shortcut("sfdc_case_shortcut", async ({ shortcut, ack, context }) => {
    
    sendSalesforce ( shortcut )
  
    await ack();

});

expressReceiver.router.get('/receiver-case-number', async (req, res) => {
  
    try {

        let caseNumber = req.query.caseNumber;
      
        let caseId = req.query.caseId;
      
        let shortcut = JSON.parse(req.query.shortcut);
        // referring to your community (use when you has clients to see cases)
        let linkCustomer = `<https://your_org.my.site.com/customer/s/case/${caseId}|Portal>`;
        // referring to your internal system (use when your team needs to see cases)
        let linkInternal = `<https://your_org.my.salesforce.com/lightning/r/Case/${caseId}/view|Salesforce>`;
      
        await app.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: shortcut.channel.id,
            thread_ts: shortcut.message.ts,
            text: 'Case successfully created: ' + caseNumber + ' ' + linkInternal + ' | ' + linkCustomer
        });
        
        res.status(200).send( JSON.parse('{ "status": "success", "message": "Success" } '));
        
    } catch (error) {
        
        console.log("error", error);
        
        res.status(500).send(JSON.parse('{ "status": "error", "message": "There was a processing failure!" } '));
        
    }
  
});

async function sendSalesforce ( shortcut ) {

    sendWithEmailByUser ( shortcut, shortcut.message.user );

}

function sendWithEmailByUser ( shorcut, userId ) {
  
  const result = app.client.users.info({
      token: process.env.SLACK_BOT_TOKEN,
      user: userId
  }).then(function(response){
      
      sendWebToCase ( shorcut, response.user.profile.email )
  
  }).catch(error => {
  
    console.log('get email error', error)
    
    sendWebToCase ( shorcut, '' )
  
  });
  
}

async function sendWebToCase ( shortcut, email ) {

  const formData = new FormData();
  formData.append("subject", 'Case created by Slack');
  formData.append("description", shortcut.message.text);
  formData.append("payload_slack__c", JSON.stringify(shortcut));
  formData.append("email", email);
  formData.append("orgid", process.env.ORG_ID);

  const response = await axios.post(
    process.env.URL_WEB_TO_CASE,
    formData,
    {
      headers: {
        ...formData.getHeaders()
      },
    }

  ); 

}


(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

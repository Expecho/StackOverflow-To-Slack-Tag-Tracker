# StackOverflow -> Slack Tag Tracker
Azure Function that acts as a bot which creates notifications in a [Slack](https://slack.com/) channel about [StackOverflow](https://stackoverflow.com/) activity based on the question tags.

![Overview](media/slack.PNG?raw=true )

# Getting up & running

1. Create a new timer based Azure Function (for javascript). For instructions see [the docs](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-azure-function).
2. Install the required node.js packages. Instructions can be found [here](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node#node-version-and-package-management). The package.json file is in this repository.
3. Replace the default javascript code with the code in this repository. Then change the configuration to your liking*

* A Slack token can be generated [here](https://api.slack.com/apps). A StackOverflow token can be created [here](https://stackapps.com/apps/oauth/register).

# Configuration

The configuration is defined using environment variables:

        slackbot_username: "StackOverflow Tag Tracker",
        slackbot_icon_emoji: ':incoming_envelope:',
        slackbot_token: '<token>',
        slackbot_channel: '<channel>',
        slackbot_workspace: '<workspace>',
        so_api_key: '<api key>',
        so_tracked_tags: 'azure;asp.net-web-api|powerbi',
        
***slackbot_username***       
  The bot account name

***slackbot_icon_emoji***       
  The Slack bot emoji icon (can be blank)

***slackbot_token***       
  The Slack token, Create a Slack App and get a token. see [the docs](https://api.slack.com/slack-apps) 

***slackbot_channel***       
  The name or the id of the channel that the message are posted to (for example: '#stackoverflow')

***slackbot_workspace***       
  The name of the slack workspace

***so_api_key***       
  The StackOverflow api key, see [the docs](https://stackapps.com/apps/oauth/register)

***so_tracked_tags***       
  The stack overflow tags to track. Tag sets are seperated with the '|' character, tags are seperated with the ';' character
  
  > Examples:
  >
  > 'azure|javascript': get notified about activities of questions tagged with either azure *or* javascript
  >
  > 'azure;javascript': get notified about activities of questions tagged with azure *and* javascript
  >
  > 'azure|javascript;reactjs': get notified about activities of questions tagged with azure **or** javascript *and* reactjs

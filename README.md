# StackOverlow -> Slack Tag Tracker
Azure Function based bot that create notificitations in a Slack channel about StackOverflow activity.

# Configuration

The configuration is defined in the index.js file:

        slackbot_username: "StackOverflow Tag Tracker",
        slackbot_icon_emoji: ':incoming_envelope:',
        slackbot_token: '<token>',
        slackbot_channel: '<channel>',
        slackbot_workspace: '<workspace>',
        so_api_key: '<api key>',
        so_tracked_tags: 'azure;asp.net-web-api|powerbi',
        so_track_comments: false,
        so_track_question_revisions: false,
        so_track_answer_revisions: false, 
        so_track_answers: true, 
        so_track_answer_acceptation: false
        
***slackbot_username***       
  The bot account name

***slackbot_icon_emoji***       
  The Slack bot emoji icon (can be blank)

***slackbot_token***       
  The Slack token, see 

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
  
***so_track_comments***       
  Whether or not notifications about new comments are posted

***so_track_question_revisions***       
  Whether or not notifications about modified questions

***so_track_answer_revisions***       
  Whether or not notifications about modified answers are posted

***so_track_answers***       
  Whether or not notifications about new answers are posted

***so_track_answer_acceptation***       
  Whether or not notifications about accepted answers are posted


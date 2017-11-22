const fs = require('fs');
const request = require('request');
const entities = require('html-entities').AllHtmlEntities;

module.exports = function (context, myTimer) {
  const config = {
        slackbot_username: "StackOverflow Tag Tracker",
        slackbot_icon_emoji: ':incoming_envelope:',
        slackbot_token: '<your_token>',
        slackbot_channel: '<slack channel name or id>',
        slackbot_workspace: '<slack workspace name>',
        so_api_key: '<stack overflow api key>',
        so_tracked_tags: 'azure|asp.net-web-api;owin',
        so_track_comments: false,
        so_track_question_revisions: false,
        so_track_answer_revisions: false, 
        so_track_answers: true, 
        so_track_answer_acceptation: false,
      };

    var timeStamp = new Date().toISOString();
    
    const currentTime = Math.round(Date.now() / 1000);
    const lastTime = getLastTime();

    config.so_tracked_tags.split("|").forEach(function(tagset) {
      const questionURL = `https://api.stackexchange.com/2.2/questions?key=${config.so_api_key}&order=desc&sort=activity&tagged=${encodeURIComponent(tagset)}&site=stackoverflow`;
      
      getJSON(questionURL, processQuestions, handleError, tagset);
    });

    context.done();

    function getJSON(target, success, error, tagset) {
     
    request({
      uri: target,
      gzip: true
    }, function(err, response, body) {
      if (!err && response.statusCode == 200) {
        success(JSON.parse(body), tagset, response, body, tagset);
      } else {
        error(err, response, body);
      }
    });
}

function handleError(err, response, body) {
    context.log('Error getting with request: ' + err);
    context.log(response);
}

function sendToSlack(soActivities, tagset) {
    if (Object.keys(soActivities).length) {
      var actions = Object.keys(soActivities)
        .map(key => soActivities[key])
        .filter(soActivity => soActivity.actions.length > 0)

      if(actions.length == 0)  
        return;
      
      const payload = {
        text: makeSlackMessage(soActivities, tagset),
        unfurl_links: false,
        username: config.slackbot_username,
        icon_emoji: config.slackbot_icon_emoji,
        as_user: false,
        token: config.slackbot_token,
        channel: config.slackbot_channel
      };

      request.post({
            url: `https://${config.slackbot_workspace}.slack.com/api/chat.postMessage?key=${config.so_api_key}`,
            form: payload
          },
          function(error, response, body) {
            if (!error && response.statusCode == 200) {
              fs.writeFileSync('D:/home/LastEnd', currentTime);
            } else {
              handleError(error, response, body)
            }
          }
        );
    }
 }

 function historyEvent(tl, desc, emoij, link) {
    return {
      when: tl.creation_date,
      who: entities.decode((tl.user || tl.owner).display_name),
      what: desc,
      emoij: emoij,
      link: link
    };
  }

  function getAnswerLink(answerId) {
    return `http://stackoverflow.com/a/${answerId}?key=${config.so_api_key}`;
  }

  function getCommentLink(questionId, answerId, commentId) {
    return `http://stackoverflow.com/questions/${questionId}/${answerId}#comment${commentId}_${answerId}?key=${config.so_api_key}`;
  }

  function getLastTime() {
    let lastTime;
    if (fs.existsSync('D:/home/LastEnd')) {
      const encoding = {
        encoding: 'utf8'
      };
      content = fs.readFileSync('D:/home/LastEnd', encoding)
      if (content) {
        lastTime = parseInt(content, 10);
      } else {
        lastTime = saveLastTime()
      }
    } else {
        context.log(`No LastEnd file, making one.`);
        lastTime = saveLastTime()
    }
    return lastTime;
  }

  function saveLastTime(){
      const timeBack = 60 * (60 || 0) + 60 * 60 * (0 || 0) + 24 * 60 * 60 * (0 || 0);
      const lastTime = currentTime - timeBack;
      fs.writeFileSync('D:/home/LastEnd', lastTime);

      return lastTime
  }

    function processQuestions(questions, tagset) {
      const soActivities = questions.items
      .filter(question => question.last_activity_date > lastTime)
      .map(function(question) {
        return {
          id: question.question_id,
          title: entities.decode(question.title),
          activity: question.last_activity_date,
          creationDate: question.creation_date,
          link: question.link,
          actions: []
        };
      })
      .reduce((activities, activity) => {
        activities[activity.id] = activity;
        return activities;
      }, {});

      processTimeline(soActivities, tagset);
  }

  function processTimeline(soActivities, tagset) {
    if (Object.keys(soActivities).length) {
      const questionIds = Object.keys(soActivities).join(';');
      const timelineURL = `https://api.stackexchange.com/2.2/questions/${questionIds}/timeline?site=stackoverflow&key=${config.so_api_key}`;
      getJSON(timelineURL, (timeline) => pTimeline(timeline, soActivities, tagset), handleError, tagset);
    }
  }

  function pTimeline(timeline, soActivities, tagset) {
    const checkQuestions = {};

    timeline.items
      .filter(tl => tl.creation_date > lastTime)
      .forEach(function(tl) {
        const soActivity = soActivities[tl.question_id];
        switch (tl.timeline_type) {
          case 'question':
            soActivity.actions.push(historyEvent(tl, 'asked this question.', ':question:'));
            break;
          case 'revision':
            if (tl.question_id == tl.post_id && config.so_track_question_revisions) {
              soActivity.actions.push(historyEvent(tl, 'revised the question.', ':pencil:'));
            } else if(config.so_track_answer_revisions) {
              soActivity.actions.push(historyEvent(tl, 'revised an answer.', ':pencil:', getAnswerLink(tl.post_id)));
            }
            break;
          case 'accepted_answer':
            if(config.so_track_answer_acceptation)
              soActivity.actions.push(historyEvent(tl, 'answer was accepted.', ':+1:', getAnswerLink(tl.post_id)));
            break;
          case 'answer':
            if(config.so_track_answers) {
              checkQuestions[tl.question_id] = checkQuestions[tl.question_id] || [];
              checkQuestions[tl.question_id].push(tl.creation_date);
            }
            break;
          case 'comment':
            if(config.so_track_comments)
              soActivity.actions.push(historyEvent(tl, 'made a comment.', ':speech_balloon:', getCommentLink(tl.question_id, tl.post_id, tl.comment_id)));
            break;
          case 'unaccepted_answer':
          case 'post_state_changed':
          case 'vote_aggregate':
          default:
            break;
        }
      });

    // now we handle new questions since they are not present in the stream with an id.
    if (Object.keys(checkQuestions).length > 0) {
      processAnswers(soActivities, checkQuestions, tagset)
    } else {
      sendToSlack(soActivities, tagset);
    }
  }

  function processAnswers(soActivities, checkQuestions, tagset) {
    const questionIds = Object.keys(checkQuestions).join(';');
    const answerURL = `https://api.stackexchange.com/2.2/questions/${questionIds}/answers?key=${config.so_api_key}&fromdate=${lastTime}&todate=${currentTime}&order=desc&sort=activity&site=stackoverflow`;
    getJSON(answerURL, (answers) => pAnswers(answers, soActivities, checkQuestions, tagset), handleError);
  }

  function pAnswers(answers, soActivities, checkQuestions, tagset) {
    answers.items
      .forEach(function(answer) {
        const soActivity = soActivities[answer.question_id];
        if (checkQuestions[answer.question_id].indexOf(answer.creation_date) > -1) {
          soActivity.actions.push(historyEvent(answer, 'posted an answer.', ':left_speech_bubble:', getAnswerLink(answer.answer_id)));
        }
      });

    sendToSlack(soActivities, tagset);
  }

  function makeSlackMessage(soActivities, tagset) {
    let slackMessage = `:envelope: New StackOverflow activity on the ${tagset} tag(s)\n\n`;

    slackMessage += Object.keys(soActivities)
      .map(key => soActivities[key])
      .filter(soActivity => soActivity.actions.length > 0)
      .map(function(soActivity) {
        const message = [];

        const creationDate = new Date();
        creationDate.setTime(soActivity.creationDate * 1000);

        message.push(`<${soActivity.link}|${soActivity.title}>: _${creationDate.toLocaleString()}_`);

        const actionsText = soActivity.actions
          .sort((a, b) => a.when - b.when)
          .map(function(action) {
            let actionText = `\t\t\t ${action.emoij} ${action.who} `;
            if (action.link) {
              actionText += `<${action.link}|${action.what}>`;
            } else {
              actionText += action.what;
            }

            const actionDate = new Date();
            actionDate.setTime(action.when * 1000);
            actionText += ` _${actionDate.toLocaleString()}_`;

            return actionText;
          });

        return message.concat(actionsText).join('\n');
      })
      .reduce((message, currentMessage) => message + currentMessage + '\n\n', '');

    return slackMessage;
  }
};

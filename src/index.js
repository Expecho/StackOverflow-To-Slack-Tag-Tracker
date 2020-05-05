const { from } = require('rxjs');
const fs = require('fs');
const { flatMap, map, bufferCount, mergeMap } = require('rxjs/operators');
const fetch = require("node-fetch");
const entities = require('html-entities').AllHtmlEntities;

module.exports = function (context, myTimer) {
  const aDay = 1000 * 60 * 60 * 24;
  const fallbackLastTime = new Date() - aDay;

  const lastTime = getLastTime(fallbackLastTime);
  const request = (url) => from(fetch(url).then(res => res.json()));

  context.log(`fallbackLastTime set to ${fallbackLastTime} (${new Date(fallbackLastTime)})`);
  context.log(`lastTime set to ${lastTime} (${new Date(lastTime)})`);

  from(process.env["so_tracked_tags"].split("|"))
    .pipe(mergeMap(tagset => request(`https://api.stackexchange.com/2.2/questions?key=${process.env["so_api_key"]}&order=desc&sort=activity&tagged=${encodeURIComponent(tagset)}&site=stackoverflow&fromdate=${Math.round(lastTime / 1000)}`)))
    .pipe(map(results => results.items.map(question => ({
      "title": entities.decode(question.title),
      "created": new Date(question.creation_date * 1000).toLocaleString(),
      "link": question.link,
      "id": question.question_id,
      "tags": question.tags.toString(),
      "owner": entities.decode(question.owner.display_name)
    }))))
    .pipe(flatMap(results => results))
    .pipe(bufferCount(Number.MAX_VALUE)) // Make sure all questions end up together
    .pipe(mergeMap(questions => {
      let slackMessage = `:envelope: New StackOverflow activity:\n`;

      // A question can have multiple tags, so duplicates have to be removed for readability
      slackMessage += uniqueObjectsFromArray(questions, "id").map(question => `<${question.link}|${question.title}> (${question.tags})\n\t\t\t:question: ${question.owner} asked this question at ${question.created}`).join(`\n`);

      const params = new URLSearchParams();
      params.append('text', slackMessage);
      params.append('unfurl_links', false);
      params.append('username', process.env["slackbot_username"]);
      params.append('icon_emoji', process.env["slackbot_icon_emoji"]);
      params.append('as_user', false);
      params.append('token', process.env["slackbot_token"]);
      params.append('channel', process.env["slackbot_channel"]);

      return fetch(`https://${process.env["slackbot_workspace"]}.slack.com/api/chat.postMessage`,
        {
          method: 'POST',
          body: params
        })
        .then(res => res.json())
        .then(res => context.log(res));
    }))
    .subscribe(e => { }, () => saveLastTime());

  saveLastTime();

  context.done();

  function uniqueObjectsFromArray(arr, key) {
    return [...new Map(arr.map(item => [item[key], item])).values()]
  }

  function getLastTime(fallbackTime) {
    let time;
    if (fs.existsSync('D:/home/LastEnd')) {
      const encoding = {
        encoding: 'utf8'
      };
      content = fs.readFileSync('D:/home/LastEnd', encoding)
      if (content) {
        time = parseInt(content, 10);
        context.log(`getLastTime executed: Using data from ${time} (${new Date(time)}).`);
      } else {
        context.log(`getLastTime executed: Using data from fallbackLastTime (${fallbackTime}) (${new Date(fallbackTime)}).`);
        time = fallbackTime;
      }
    } else {
      context.log(`No LastEnd file, making one.`);
      time = fallbackTime
    }
    return time;
  }

  function saveLastTime() {
    var currentDate = new Date() - 1;
    fs.writeFileSync('D:/home/LastEnd', currentDate);

    context.log(`saveLastTime executed: Writing value ${currentDate}. (${new Date(currentDate)})`);
  }
}
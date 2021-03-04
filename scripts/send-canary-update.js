// Usage: node scripts/send-canary-update.js $(npm outdated --parseable)
const axios = require('axios');
const { getAllUpdatesText } = require('./parse-dependency-updates');

const message = getAllUpdatesText(process.argv);

if (message) {
  const body = {
    cards: [
      {
        header: {
          title: `${process.env.NHS_SERVICE}`,
          subtitle: 'Canary',
          imageUrl:
            'https://imageog.flaticon.com/icons/png/512/185/185862.png?size=1200x630f&pad=10,10,10,10&ext=png&bg=FFFFFFFF'
        },
        sections: [
          {
            widgets: [
              {
                keyValue: {
                  topLabel: 'Updates Available',
                  content: message
                }
              }
            ]
          }
        ]
      }
    ]
  };

  const options = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  console.log('Sending message to Google Hangout group');

  axios.post(process.env.GOOGLE_CHAT_CANARY_WEBHOOK, body, options);
}

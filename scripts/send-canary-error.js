// Usage: node scripts/send-canary-error.js
const axios = require('axios');

const options = {
  headers: {
    'Content-Type': 'application/json'
  }
};

const body = {
  cards: [
    {
      header: {
        title: `${process.env.NHS_SERVICE}`,
        subtitle: 'Canary Build',
        imageUrl: 'https://pbs.twimg.com/media/D41piqbWkAAtZaY.png'
      },
      sections: [
        {
          widgets: [
            {
              keyValue: {
                topLabel: 'Stage Name',
                content: `${process.env.GO_STAGE_NAME} > ${process.env.GO_JOB_NAME}`
              }
            }
          ]
        },
        {
          widgets: [
            {
              buttons: [
                {
                  textButton: {
                    text: 'View Failed Pipeline Stage',
                    onClick: {
                      openLink: {
                        url: `https://prod.gocd.patient-deductions.nhs.uk/go/tab/build/detail/${process.env.GO_PIPELINE_NAME}/${process.env.GO_PIPELINE_COUNTER}/${process.env.GO_STAGE_NAME}/1/${process.env.GO_JOB_NAME}`
                      }
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

console.log('Sending message to Google Hangout group');

axios.post(process.env.GOOGLE_CHAT_CANARY_WEBHOOK, body, options);

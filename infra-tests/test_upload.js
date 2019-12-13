const axios = require('axios');

axios.post(process.env.EHR_URL + '/url', { 'conversationId': '1234' })
  .then(response => {
    console.log(response);
    if (response.status !== 202) {
      process.exit(5);
    }
    var options = {};
    url = response.data;
    axios.put(url, 'hello', options)
      .then(res => {
        console.log(res);
        if (res.status !== 200) {
          process.exit(6);
        }
      })
      .catch(err => {
        console.log(err);
        process.exit(7);
      });
  })
  .catch(err => {
    console.log(err);
    process.exit(8);
  });
